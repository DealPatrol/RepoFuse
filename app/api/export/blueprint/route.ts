import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth'
import { exportAppSchema, exportRequestSchema } from '@/lib/schemas'

type ExportApp = z.infer<typeof exportAppSchema>

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const parsedBody = exportRequestSchema.safeParse(await request.json())

    if (!parsedBody.success) {
      return NextResponse.json({ error: parsedBody.error.issues[0]?.message ?? 'Invalid export request' }, { status: 400 })
    }

    const { app } = parsedBody.data
    const fileBaseName = toSlug(app.app_name)

    const blueprint = {
      id: `${fileBaseName}-${Date.now()}`,
      appName: app.app_name,
      appType: app.app_type,
      description: app.description,
      complete: app.is_complete,
      reusePercentage: app.reuse_percentage,
      missingFilesCount: app.missing_files_count,
      missingFiles: app.missing_files,
      technologies: app.technologies,
      difficultyLevel: app.difficulty_level,
      explanation: app.ai_explanation,
      fastCashLabel: app.fast_cash_label,
      createdAt: new Date().toISOString(),
      fileStructure: generateFileStructure(),
      setupInstructions: generateSetupInstructions(app),
      dependencies: app.technologies.map((tech: string) => ({
        name: tech,
        version: 'latest',
      })),
    }

    return NextResponse.json(blueprint, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${fileBaseName}-blueprint.json"`,
      },
    })
  } catch (error) {
    console.error('Error generating blueprint:', error)
    return NextResponse.json({ error: 'Failed to generate blueprint' }, { status: 500 })
  }
}

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'blueprint'
}

function generateFileStructure(): Record<string, unknown> {
  return {
    root: {
      'README.md': 'Project documentation',
      'package.json': 'Dependencies',
      'src/': {
        'index.ts': 'Entry point',
        'components/': 'Reusable components',
        'utils/': 'Helper utilities',
        'types/': 'TypeScript types',
      },
      'tests/': 'Test files',
      '.env.example': 'Environment variables',
    },
  }
}

function generateSetupInstructions(app: ExportApp): string[] {
  return [
    `Create new project: npx create-${app.app_type}-app ${toSlug(app.app_name)}`,
    'Install dependencies from the reused repositories',
    'Copy the identified files into the new project structure',
    'Install missing dependencies',
    'Run tests to verify everything works',
    'Deploy to production',
  ]
}
