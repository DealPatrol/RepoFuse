import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getCurrentUser } from '@/lib/auth'
import { getAnthropicModel } from '@/lib/anthropic-model'
import { deductCredits, CREDITS } from '@/lib/credits'

export const maxDuration = 120
export const dynamic = 'force-dynamic'

const anthropic = new Anthropic()

interface LaunchPreviewRequest {
  repoOwner: string
  repoName: string
  vercelToken: string
}

async function getGitHubFile(token: string, owner: string, repo: string, path: string) {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
    },
  })
  if (!res.ok) return null
  const data = (await res.json()) as { content: string; sha: string }
  const content = Buffer.from(data.content, 'base64').toString('utf-8')
  return { content, sha: data.sha }
}

async function fixDependencies(packageJson: string): Promise<string> {
  const response = await anthropic.messages.create({
    model: getAnthropicModel(),
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: `You are a Node.js expert. Update this package.json to use the latest stable versions of all dependencies. Keep the structure and all other fields identical. Only update version strings to current stable releases. Do NOT use "latest" — use semver ranges like "^18.3.1". Return ONLY valid JSON, no markdown fences.

${packageJson}`,
      },
    ],
  })
  const raw = response.content[0].type === 'text' ? response.content[0].text.trim() : ''
  if (!raw) return packageJson
  return raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()
}

async function pushGitHubFile(
  token: string,
  owner: string,
  repo: string,
  path: string,
  content: string,
  sha: string,
  message: string,
) {
  const encoded = Buffer.from(content).toString('base64')
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message, content: encoded, sha }),
  })
  if (!res.ok) {
    const err = (await res.json()) as { message?: string }
    throw new Error(err.message ?? 'Failed to push file')
  }
}

async function getGitHubRepoId(token: string, owner: string, repo: string): Promise<number> {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
  })
  if (!res.ok) throw new Error('Could not fetch repository info from GitHub')
  const data = (await res.json()) as { id: number; default_branch: string }
  return data.id
}

async function getGitHubRepoDefaultBranch(token: string, owner: string, repo: string): Promise<string> {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
  })
  if (!res.ok) return 'main'
  const data = (await res.json()) as { default_branch: string }
  return data.default_branch || 'main'
}

async function createVercelProject(
  vercelToken: string,
  name: string,
  repoOwner: string,
  repoName: string,
) {
  const res = await fetch('https://api.vercel.com/v10/projects', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${vercelToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      gitRepository: { repo: `${repoOwner}/${repoName}`, type: 'github' },
    }),
  })
  if (!res.ok) {
    const err = (await res.json()) as { error?: { message?: string } }
    throw new Error(err.error?.message ?? 'Failed to create Vercel project')
  }
  return (await res.json()) as { id: string; name: string }
}

async function createVercelDeployment(
  vercelToken: string,
  projectName: string,
  repoId: number,
  ref: string,
) {
  const res = await fetch('https://api.vercel.com/v13/deployments', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${vercelToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: projectName,
      gitSource: { type: 'github', repoId, ref },
    }),
  })
  if (!res.ok) {
    const err = (await res.json()) as { error?: { message?: string } }
    throw new Error(err.error?.message ?? 'Failed to trigger deployment')
  }
  return (await res.json()) as { id: string; url: string; readyState: string }
}

async function pollDeployment(vercelToken: string, deploymentId: string): Promise<string> {
  const maxMs = 90_000
  const start = Date.now()
  while (Date.now() - start < maxMs) {
    await new Promise((r) => setTimeout(r, 6000))
    const res = await fetch(`https://api.vercel.com/v13/deployments/${deploymentId}`, {
      headers: { Authorization: `Bearer ${vercelToken}` },
    })
    if (!res.ok) continue
    const data = (await res.json()) as { readyState: string; url: string }
    if (data.readyState === 'READY') return `https://${data.url}`
    if (data.readyState === 'ERROR' || data.readyState === 'CANCELED') {
      throw new Error(`Deployment ended with state: ${data.readyState}`)
    }
  }
  throw new Error('Deployment timed out — it may still be building on Vercel')
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
          send({ step: 'error', message: 'Sign in to launch a preview.' })
          controller.close()
          return
        }

        const body = (await request.json()) as LaunchPreviewRequest
        const { repoOwner, repoName, vercelToken } = body

        if (!vercelToken?.trim()) {
          send({ step: 'error', message: 'Vercel token is required.' })
          controller.close()
          return
        }

        if (!repoOwner?.trim() || !repoName?.trim()) {
          send({ step: 'error', message: 'Repository owner and name are required.' })
          controller.close()
          return
        }

        // Deduct credits before any AI/cloud work
        const creditResult = await deductCredits(
          user.id,
          CREDITS.LAUNCH_PREVIEW_COST,
          'launch_preview',
          { repoOwner, repoName },
        )
        if (!creditResult.success) {
          send({ step: 'error', message: creditResult.error ?? 'Insufficient credits' })
          controller.close()
          return
        }

        // Step 1 — fetch package.json
        send({ step: 'fetching', message: 'Fetching package.json from GitHub…' })
        const pkgFile = await getGitHubFile(user.access_token, repoOwner, repoName, 'package.json')

        // Step 2 — fix deps with Claude
        if (pkgFile) {
          send({ step: 'fixing', message: 'Updating dependencies with Claude…' })
          let fixedPkg = pkgFile.content
          try {
            const updated = await fixDependencies(pkgFile.content)
            // Verify it's still valid JSON before pushing
            JSON.parse(updated)
            if (updated !== pkgFile.content) {
              fixedPkg = updated
            }
          } catch {
            // Keep original if Claude output is invalid
          }

          if (fixedPkg !== pkgFile.content) {
            send({ step: 'pushing', message: 'Pushing updated package.json…' })
            try {
              await pushGitHubFile(
                user.access_token,
                repoOwner,
                repoName,
                'package.json',
                fixedPkg,
                pkgFile.sha,
                'chore: update dependencies to latest stable versions',
              )
            } catch {
              // Non-fatal — continue with Vercel deployment
            }
          } else {
            send({ step: 'pushing', message: 'Dependencies are up to date.' })
          }
        }

        // Step 3 — create Vercel project
        send({ step: 'creating', message: 'Creating Vercel project…' })
        const projectName = `${repoName}-preview-${Date.now()}`.slice(0, 52).replace(/[^a-z0-9-]/gi, '-').toLowerCase()
        let project: { id: string; name: string }
        try {
          project = await createVercelProject(vercelToken, projectName, repoOwner, repoName)
        } catch (e) {
          send({
            step: 'error',
            message: `Vercel project creation failed: ${e instanceof Error ? e.message : String(e)}. Make sure your Vercel account is connected to GitHub.`,
          })
          controller.close()
          return
        }

        // Step 4 — trigger deployment
        send({ step: 'deploying', message: 'Triggering Vercel deployment…' })
        let deploymentId: string
        try {
          const [repoId, defaultBranch] = await Promise.all([
            getGitHubRepoId(user.access_token, repoOwner, repoName),
            getGitHubRepoDefaultBranch(user.access_token, repoOwner, repoName),
          ])
          const deployment = await createVercelDeployment(vercelToken, project.name, repoId, defaultBranch)
          deploymentId = deployment.id
        } catch (e) {
          send({
            step: 'error',
            message: `Could not trigger deployment: ${e instanceof Error ? e.message : String(e)}`,
          })
          controller.close()
          return
        }

        // Step 5 — poll until ready
        send({ step: 'deploying', message: 'Building on Vercel… (this may take up to 90s)' })
        let previewUrl: string
        try {
          previewUrl = await pollDeployment(vercelToken, deploymentId)
        } catch (e) {
          send({
            step: 'error',
            message: `Deployment failed: ${e instanceof Error ? e.message : String(e)}`,
          })
          controller.close()
          return
        }

        send({ step: 'done', previewUrl })
      } catch (e) {
        console.error('[launch-preview] unhandled error:', e)
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ step: 'error', message: 'An unexpected error occurred.' })}\n\n`),
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
