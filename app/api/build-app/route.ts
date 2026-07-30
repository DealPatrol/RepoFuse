import { NextRequest } from 'next/server'
import { generateWithGateway } from '@/lib/ai-gateway'
import { getCurrentUser } from '@/lib/auth'
import { getSubscriptionByGithubId, upsertSubscription, type AppBlueprint } from '@/lib/queries'
import { hasProAccess } from '@/lib/pro-access'
import {
  createGitHubRepo,
  createGitLabProject,
  pushFileToGitHub,
  pushFileToGitLab,
  type BuildPlatform,
} from '@/lib/build-app-platforms'

interface BuildAppRequest {
  platform: BuildPlatform
  repoName: string
  blueprint: Pick<
    AppBlueprint,
    'name' | 'description' | 'app_type' | 'technologies' | 'existing_files' | 'missing_files' | 'complexity' | 'estimated_effort' | 'ai_explanation'
  >
}

/** Generate a single file's content using Claude */
async function generateSingleFile(
  blueprint: BuildAppRequest['blueprint'],
  filePath: string,
  filePurpose: string,
  userId: string,
): Promise<string> {
  const existingList = blueprint.existing_files
    .slice(0, 15)
    .map((f) => ` - ${f.path}: ${f.purpose}`)
    .join('\n')

  const prompt = `You are a senior software engineer. Generate complete, production-ready source code for ONE file.

Project: ${blueprint.name}
Description: ${blueprint.description ?? ''}
Type: ${blueprint.app_type ?? 'application'}
Technologies: ${blueprint.technologies.join(', ')}
${blueprint.ai_explanation ? `Context: ${blueprint.ai_explanation}` : ''}

Existing files in the codebase (reference only, do NOT regenerate):
${existingList || ' (none listed)'}

File to generate:
  Path: ${filePath}
  Purpose: ${filePurpose}

Write the FULL, working implementation for this file.
Return ONLY the raw file content — no markdown fences, no explanation, no preamble.
Just the file content itself, ready to save.`

  return generateWithGateway({
    feature: 'build-app',
    userId,
    maxOutputTokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  })
}

/** Build the list of all files to generate */
function getFilesToGenerate(blueprint: BuildAppRequest['blueprint']): Array<{ path: string; purpose: string }> {
  const files: Array<{ path: string; purpose: string }> = []

  // Missing files from the blueprint
  for (const f of blueprint.missing_files) {
    files.push({ path: f.name, purpose: f.purpose })
  }

  // Standard project files
  files.push({ path: 'README.md', purpose: 'Comprehensive setup, usage, and API documentation' })
  files.push({ path: 'package.json', purpose: 'Project dependencies and scripts for the tech stack' })
  files.push({ path: '.env.example', purpose: 'All required environment variables with placeholder values' })
  files.push({ path: '.gitignore', purpose: 'Gitignore file appropriate for this stack' })

  return files
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
          return
        }

        let sub = await getSubscriptionByGithubId(user.github_id).catch(() => null)
        if (!sub) {
          sub = await upsertSubscription({ github_id: user.github_id }).catch(() => null)
        }
        if (!hasProAccess(user, sub)) {
          send({ step: 'error', message: 'Build This App is available on paid plans. Upgrade to create and push a generated repo.' })
          return
        }

        const body = (await request.json()) as BuildAppRequest
        const { platform, repoName, blueprint } = body

        if (platform !== 'github' && platform !== 'gitlab') {
          send({ step: 'error', message: 'Choose GitHub or GitLab before building.' })
          return
        }

        if (!repoName?.trim()) {
          send({ step: 'error', message: 'Repository name is required.' })
          return
        }

        const cleanRepoName = repoName.trim().replace(/\s+/g, '-').toLowerCase()

        // Step 1 — determine files to generate
        const filesToGenerate = getFilesToGenerate(blueprint)
        send({
          step: 'generating',
          message: `Generating ${filesToGenerate.length} files with Claude…`,
          files: filesToGenerate.map((f) => f.path),
        })

        // Step 2 — create repo early so we can push as files complete
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
          return
        }

        send({ step: 'repo_created', message: 'Repository created. Generating and pushing files…', repoUrl })

        // Step 3 — generate and push each file individually
        let pushed = 0
        const total = filesToGenerate.length

        for (const { path, purpose } of filesToGenerate) {
          // Generate this file
          let content: string
          try {
            content = await generateSingleFile(blueprint, path, purpose, user.id)
          } catch (e) {
            console.error(`[build-app] Failed to generate ${path}:`, e)
            send({
              step: 'error',
              message: `Could not generate ${path}: ${e instanceof Error ? e.message : String(e)}`,
            })
            return
          }

          // Push to platform
          try {
            if (platform === 'github') {
              await pushFileToGitHub(accessToken, user.github_username, cleanRepoName, path, content)
            } else if (gitlabProjectId !== null) {
              await pushFileToGitLab(accessToken, gitlabProjectId, gitlabBranch, path, content)
            }
          } catch (e) {
            console.error(`[build-app] Failed to push ${path}:`, e)
            send({
              step: 'error',
              message: e instanceof Error ? e.message : `Could not push ${path}`,
            })
            return
          }

          pushed++
          send({
            step: 'pushing',
            message: `Pushed ${pushed}/${total} files`,
            current: pushed,
            total,
            path,
            preview: content.slice(0, 600),
          })
        }

        send({
          step: 'done',
          message: `${pushed} files generated and pushed successfully.`,
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
