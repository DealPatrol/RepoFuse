import { NextRequest, NextResponse } from 'next/server'
import { generateText } from 'ai'
import { deductCredits, refundCredits, CREDITS } from '@/lib/credits'
import { getCurrentUser } from '@/lib/auth'

const model = 'openai/gpt-4-turbo'

interface SelectedRepository {
  name: string
  full_name: string
  default_branch: string
}

interface RepositoryTreeFile {
  path: string
  size?: number
}

interface AppSuggestion {
  is_complete?: boolean
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { analysisId, selectedRepos } = (await request.json()) as {
      analysisId: string
      selectedRepos: SelectedRepository[]
    }

    if (!Array.isArray(selectedRepos) || selectedRepos.length === 0) {
      return NextResponse.json({ error: 'At least one repository is required' }, { status: 400 })
    }

    const creditMetadata = {
      analysisId,
      selectedRepos: selectedRepos.map((r) => r.name),
    }
    const deductResult = await deductCredits(user.id, CREDITS.ANALYSIS_COST, 'analysis', creditMetadata)
    if (!deductResult.success) {
      return NextResponse.json(
        {
          error: deductResult.error || 'Insufficient credits',
          required: CREDITS.ANALYSIS_COST,
          message: 'Upgrade to Pro to get unlimited analyses with 3,000 monthly credits.',
        },
        { status: 402 }
      )
    }

    try {
      // Get all repo files from database
      const filesByRepo: Record<string, RepositoryTreeFile[]> = {}
      
      for (const repo of selectedRepos) {
        // Fetch repo structure from GitHub API
        const files = await fetchRepoStructure(repo)
        filesByRepo[repo.name] = files
      }

      // Use AI to analyze cross-repo patterns
      const prompt = `You are an expert software architect analyzing code across multiple repositories.

Given these repositories with their file structures:
${Object.entries(filesByRepo).map(([name, files]) => 
  `${name}: ${files.map(f => f.path).join(', ')}`
).join('\n')}

Your task is to discover what applications could be built by combining files from these repositories. For each possible app, determine:
1. App Name
2. App Type (Web App, Mobile App, API, Library, etc.)
3. Description
4. Complete? (true/false - does it have 80%+ of needed files?)
5. Reuse Percentage (how much code can be reused)
6. Missing Files (if not complete)
7. Technologies Used
8. Difficulty Level (easy/medium/hard)
9. Fast Cash Label (if missing only 2-3 files)
10. Explanation

Return as JSON array of app suggestions. Focus on practical, buildable applications.`

      const result = await generateText({
        model,
        prompt,
        temperature: 0.7,
        maxOutputTokens: 2000,
      })

      // Parse AI response and save suggestions
      let suggestions: AppSuggestion[] = []
      try {
        const jsonMatch = result.text.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
          suggestions = JSON.parse(jsonMatch[0])
        }
      } catch (e) {
        console.error('Failed to parse AI response:', e)
      }

      const newBalance = deductResult.transaction?.balance_after || 0

      return NextResponse.json({
        analysisId,
        suggestions,
        totalSuggestions: suggestions.length,
        completeSuggestions: suggestions.filter((suggestion) => suggestion.is_complete).length,
        creditsUsed: CREDITS.ANALYSIS_COST,
        creditsRemaining: newBalance,
      })
    } catch (error) {
      await refundCredits(user.id, CREDITS.ANALYSIS_COST, 'legacy analysis failed', creditMetadata).catch((refundError) => {
        console.error('Failed to refund analysis credits:', refundError)
      })
      throw error
    }
  } catch (error) {
    console.error('Analysis error:', error)
    return NextResponse.json({ error: 'Failed to analyze repositories' }, { status: 500 })
  }
}

async function fetchRepoStructure(repo: SelectedRepository): Promise<RepositoryTreeFile[]> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${repo.full_name}/git/trees/${repo.default_branch}?recursive=1`,
      {
        headers: {
          'Accept': 'application/vnd.github+json',
        },
      }
    )

    if (!response.ok) return []

    const data = (await response.json()) as {
      tree?: Array<{ path: string; size?: number; type: string }>
    }

    return (data.tree ?? [])
      .filter((item) => item.type === 'blob')
      .slice(0, 100) // Limit to first 100 files
      .map((item) => ({
        path: item.path,
        size: item.size,
      }))
  } catch (error) {
    console.error('Error fetching repo structure:', error)
    return []
  }
}
