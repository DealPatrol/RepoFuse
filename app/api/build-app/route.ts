import { NextRequest } from 'next/server'
import { generateWithGateway } from '@/lib/ai-gateway'
import { getCurrentUser } from '@/lib/auth'
import { getSubscriptionByGithubId, upsertSubscription, type AppBlueprint } from '@/lib/queries'
import { hasProAccess } from '@/lib/pro-access'

type Platform = 'github' | 'gitlab'

interface BuildAppRequest {
  platform: Platform
  repoName: string
  blueprint: Pick<
    AppBlueprint,
    'name' | 'description' | 'app_type' | 'technologies' | 'existing_files' | 'missing_files' | 'complexity' | 'estimated_effort' | 'ai_explanation'
  >
}

async function generateFiles(
  blueprint: BuildAppRequest['blueprint'],
  userId: string,
): Promise<Record<string, string>> {
  const missingList = blueprint.missing_files
    .map((f) => `  - ${f.name}: ${f.purpose}`)
    .join('\n')

  const existingList = blueprint.existing_files
    .slice(0, 20)
    .map((f) => `  - ${f.path}: ${f.purpose}`)
    .join('\n')

  const prompt = `You are a senior software engineer. Generate complete, production-ready source code for all the missing files in this project.

Project: ${blueprint.name}
Description: ${blueprint.description ?? ''}
Type: ${blueprint.app_type ?? 'application'}
Technologies: ${blueprint.technologies.join(', ')}
Complexity: ${blueprint.complexity}
${blueprint.estimated_effort ? `Estimated effort: ${blueprint.estimated_effort}` : ''}
${blueprint.ai_explanation ? `Context: ${blueprint.ai_explanation}` : ''}

Existing files already in the codebase (reference but do NOT regenerate these):
${existingList || '  (none listed)'}

Missing files to generate (write FULL working implementations):
${missingList || '  (none)'}

Also generate these project files:
  - README.md (comprehensive setup and usage instructions)
  - package.json (correct for the tech stack, with all needed dependencies)
  - .env.example (all required environment variables with placeholder values)
  - .gitignore (appropriate for this stack)

Rules:
- Return ONLY valid JSON, no markdown fences, no extra text
- Keys are relative file paths (e.g. "src/auth/index.ts")
- Values are complete file content as strings
- All strings must use proper JSON escaping (\\n for newlines, \\" for quotes)
- Write real, working code — not placeholder stubs

Return format: {"path/to/file.ts": "...full content...", "README.md": "..."}
`

  const raw = (
    await generateWithGateway({
      feature: 'build-app',
      userId,
      maxOutputTokens: 8192,
      messages: [{ role: 'user', content: prompt }],
    })
  ).trim()
  const jsonText = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()

  const obj = JSON.parse(jsonText) as Record<string, unknown>
  const files: Record<string, string> = {}
  for (const [k, v] of Object.entries(obj)) {
    files[k] = typeof v === 'string' ? v : JSON.stringify(v, null, 2)
  }
  return files
}

async function createGitHubRepo(
  accessToken: string,
  username: string,
  repoName: string,
  description: string,
): Promise<string> {
  const res = await fetch('https://api.github.com/user/repos', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: repoName,
      description,
      private: false,
      auto_init: false,
    }),
  })

  if (!res.ok) {
    const err = (await res.json()) as { message?: string }
    throw new Error(err.message ?? 'Failed to create GitHub repository')
  }

  const repo = (await res.json()) as { html_url: string }
  return repo.html_url
}

async function pushFileToGitHub(
  accessToken: string,
  username: string,
  repoName: string,
  path: string,
  content: string,
): Promise<void> {
  const encoded = Buffer.from(content).toString('base64')
  const res = await fetch(
    `https://api.github.com/repos/${username}/${repoName}/contents/${path}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `Add ${path}`,
        content: encoded,
      }),
    },
  )

  if (!res.ok) {
    const err = (await res.json()) as { message?: string }
    console.warn(`[build-app] Failed to push ${path}: ${err.message}`)
  }
}

async function createGitLabProject(
  accessToken: string,
  repoName: string,
  description: string,
): Promise<{ id: number; web_url: string; default_branch: string }> {
  const res = await fetch('https://gitlab.com/api/v4/projects', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: repoName,
      description,
      visibility: 'private',
      initialize_with_readme: false,
    }),
  })

  if (!res.ok) {
    const err = (await res.json()) as { message?: string | Record<string, string[]> }
    const msg =
      typeof err.message === 'string'
        ? err.message
        : JSON.stringify(err.message)
    throw new Error(msg ?? 'Failed to create GitLab project')
  }

  return res.json() as Promise<{ id: number; web_url: string; default_branch: string }>
}

async function pushFileToGitLab(
  accessToken: string,
  projectId: number,
  branch: string,
  path: string,
  content: string,
): Promise<void> {
  const encodedPath = encodeURIComponent(path)
  const res = await fetch(
    `https://gitlab.com/api/v4/projects/${projectId}/repository/files/${encodedPath}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        branch,
        content,
        commit_message: `Add ${path}`,
        encoding: 'text',
      }),
    },
  )

  if (!res.ok) {
    const err = (await res.json()) as { message?: string }
    console.warn(`[build-app] Failed to push ${path} to GitLab: ${err.message}`)
  }
}

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      try {
        const user = await getCurrentUser()
        if (!user) {
          send({ step: 'error', message: 'Sign in before building an app.' })
          controller.close()
          return
        }

        let sub = await getSubscriptionByGithubId(user.github_id).catch(() => null)
        if (!sub) {
          sub = await upsertSubscription({ github_id: user.github_id }).catch(() => null)
        }
        if (!hasProAccess(user, sub)) {
          send({ step: 'error', message: 'Build This App is available on paid plans. Upgrade to create and push a generated repo.' })
          controller.close()
          return
        }

        const body = (await request.json()) as BuildAppRequest
        const { platform, repoName, blueprint } = body

        if (!repoName?.trim()) {
          send({ step: 'error', message: 'Repository name is required.' })
          controller.close()
          return
        }

        const cleanRepoName = repoName.trim().replace(/\s+/g, '-').toLowerCase()

        // Step 1 — generate files with Claude
        send({ step: 'generating', message: 'Generating file contents with Claude…' })

        let files: Record<string, string>
        try {
          files = await generateFiles(blueprint, user.id)
        } catch (e) {
          send({
            step: 'error',
            message: `File generation failed: ${e instanceof Error ? e.message : String(e)}`,
          })
          controller.close()
          return
        }

        const fileEntries = Object.entries(files)
        send({
          step: 'generated',
          message: `${fileEntries.length} files ready. Creating repository…`,
          fileCount: fileEntries.length,
        })

        // Step 2 — create repo
        const accessToken = user.access_token
        let repoUrl: string
        let gitlabProjectId: number | null = null
        let gitlabBranch = 'main'

        try {
          if (platform === 'github') {
            repoUrl = await createGitHubRepo(
              accessToken,
              user.github_username,
              cleanRepoName,
              blueprint.description ?? blueprint.name,
            )
          } else {
            const project = await createGitLabProject(
              accessToken,
              cleanRepoName,
              blueprint.description ?? blueprint.name,
            )
            repoUrl = project.web_url
            gitlabProjectId = project.id
            gitlabBranch = project.default_branch || 'main'
          }
        } catch (e) {
          send({
            step: 'error',
            message: `Could not create repository: ${e instanceof Error ? e.message : String(e)}. Make sure you are connected to ${platform === 'github' ? 'GitHub' : 'GitLab'}.`,
          })
          controller.close()
          return
        }

        send({ step: 'repo_created', message: 'Repository created. Pushing files…', repoUrl })

        // Step 3 — push files
        let pushed = 0
        for (const [path, content] of fileEntries) {
          if (platform === 'github') {
            await pushFileToGitHub(accessToken, user.github_username, cleanRepoName, path, content)
          } else if (gitlabProjectId !== null) {
            await pushFileToGitLab(accessToken, gitlabProjectId, gitlabBranch, path, content)
          }
          pushed++
          send({
            step: 'pushing',
            message: `Pushing files… (${pushed}/${fileEntries.length})`,
            current: pushed,
            total: fileEntries.length,
          })
        }

        send({
          step: 'done',
          message: `${pushed} files pushed successfully.`,
          repoUrl,
          filesCreated: pushed,
        })
      } catch (e) {
        console.error('[build-app] unhandled error:', e)
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ step: 'error', message: 'An unexpected error occurred.' })}\n\n`,
          ),
        )
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
