import { NextRequest, NextResponse } from 'next/server'
import { getCurrentAccessToken } from '@/lib/auth'
import { requirePro } from '@/lib/billing'
import { createGitHubRepositoryFromBlueprint } from '@/lib/repofuse-core.js'
import { createGitHubRepositoryRequestSchema } from '@/lib/schemas'

export async function POST(request: NextRequest) {
  try {
    const [accessToken, proAccess] = await Promise.all([
      getCurrentAccessToken(),
      requirePro(),
    ])

    if (!proAccess.ok) {
      return proAccess.response
    }

    const { app, repoName, scaffoldFiles } = (await request.json()) as {
      app: TemplateApp
      repoName: string
      scaffoldFiles?: Record<string, unknown>
    }

    if (!repoName || repoName.trim().length === 0) {
      return NextResponse.json({ error: 'Repository name required' }, { status: 400 })
    if (!accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const parsedBody = createGitHubRepositoryRequestSchema.safeParse(await request.json())

    if (!parsedBody.success) {
      return NextResponse.json({ error: parsedBody.error.issues[0]?.message ?? 'Invalid repository request' }, { status: 400 })
    }

    const newRepo = await createRepoRes.json()

    const filesToCreate = scaffoldFiles
      ? normalizeScaffoldFiles(scaffoldFiles)
      : generateTemplateFiles(app)

    // Create files in the new repository
    for (const [fileName, content] of Object.entries(filesToCreate)) {
      await createFileInRepo(
        githubUsername,
        repoName,
        fileName,
        content,
        accessToken
      )
    }
    const result = await createGitHubRepositoryFromBlueprint({
      accessToken,
      repoName: parsedBody.data.repoName,
      app: parsedBody.data.app,
      privateRepo: false,
    })

    return NextResponse.json({
      success: true,
      repository: result.repository,
      filesCreated: result.files_created,
    })
  } catch (error) {
    console.error('Error creating repository:', error)
    return NextResponse.json({ error: 'Failed to create repository' }, { status: 500 })
  }
}

async function createFileInRepo(
  owner: string,
  repo: string,
  path: string,
  content: string,
  accessToken: string
): Promise<void> {
  const encodedContent = Buffer.from(content).toString('base64')

  await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github+json',
      },
      body: JSON.stringify({
        message: `Add ${path}`,
        content: encodedContent,
      }),
    }
  )
}

function normalizeScaffoldFiles(files: Record<string, unknown>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(files).map(([path, content]) => [
      path,
      typeof content === 'string' ? content : JSON.stringify(content, null, 2),
    ])
  )
}

function generateTemplateFiles(app: TemplateApp): Record<string, string> {
  return {
    'README.md': `# ${app.app_name}

${app.description}

## Technologies
${app.technologies.map((t: string) => `- ${t}`).join('\n')}

## Getting Started

\`\`\`bash
npm install
npm run dev
\`\`\`

## Difficulty Level
${app.difficulty_level}

## Notes
${app.ai_explanation}

${app.missing_files.length > 0 ? `
## Missing Files to Add
${app.missing_files.map((f: string) => `- [ ] ${f}`).join('\n')}
` : ''}
`,
    'package.json': JSON.stringify(
      {
        name: app.app_name.toLowerCase().replace(/\s+/g, '-'),
        version: '1.0.0',
        description: app.description,
        scripts: {
          dev: 'next dev',
          build: 'next build',
          start: 'next start',
        },
        dependencies: {
          react: '^18.0.0',
          'next': '^14.0.0',
        },
      },
      null,
      2
    ),
    '.gitignore': `node_modules/
.env
.env.local
.env.*.local
.next/
dist/
build/
*.log
.DS_Store
`,
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create repository' },
      { status: 500 },
    )
  }
}
