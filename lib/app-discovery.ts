import { Anthropic } from '@anthropic-ai/sdk'
import { getAnthropicModel } from '@/lib/anthropic-model'

let __anthropicClient: Anthropic | null = null
function getAnthropic(): Anthropic {
  if (__anthropicClient) return __anthropicClient
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) {
    throw new Error('ANTHROPIC_API_KEY is not configured')
  }
  __anthropicClient = new Anthropic({ apiKey: key })
  return __anthropicClient
}

export interface DiscoveredApp {
  name: string
  description: string
  type: string
  reusablePercentage: number
  missingFiles: string[]
  existingFiles: string[]
  estimatedBuildTime: string
  technologies: string[]
  difficulty: 'easy' | 'medium' | 'hard'
  explanation: string
  fastCashLabel?: string
}

export async function discoverApps(scannedFiles: any[]): Promise<DiscoveredApp[]> {
  if (scannedFiles.length === 0) {
    return []
  }

  const filesList = scannedFiles
    .map((f) => `- ${f.path} (${f.language}, purpose: ${f.purpose}, reusability: ${f.reusabilityScore}/10)`)
    .join('\n')

  const prompt = `You are an expert software architect and product strategist. The files below come from products a developer has ALREADY built. Your job is to identify 8-12 genuinely NEW applications they could build by recombining the capabilities in this code — not to re-describe what they already have.

Files available:
${filesList}

First, privately inventory the transferable CAPABILITIES in these files (auth, payments, scraping, dashboards, notifications, API clients, AI integration, etc.). Capabilities transfer across domains even when the product doesn't.

HARD RULES for every suggestion:
1. NOT A REBUILD: never suggest an app that is one of the developer's existing products plus or minus a feature or two. If the file list clearly forms a complete app, that app already exists — do not suggest it.
2. DIFFERENT MARKET: each suggestion must target a different audience, use case, or business model than the code it borrows from. (Auth + billing from a dev tool can power a gym portal, a paywalled newsletter, a booking system.)
3. DIVERSE SET: spread suggestions across different product categories — B2B SaaS, consumer, internal tool, marketplace, API-as-product, automation.
4. HONEST REUSE: a genuinely new product with 40-60% reuse beats a "95% reuse" near-clone. Do not inflate reuse by picking clones.

For each app, provide:
1. App name
2. Description (1-2 sentences, including WHO it is for)
3. Type (SaaS, Tool, Dashboard, API, etc)
4. List of existing files to reuse
5. Missing files needed (be honest — novel apps may need several)
6. Estimated build time (1-3 hours, 4-8 hours, 1-2 days, etc)
7. Core technologies required
8. Difficulty level (easy, medium, hard)
9. Why this is a good idea — name the capabilities being transferred and the new market they unlock

Format as JSON array with objects containing these fields.`

  const response = await getAnthropic().messages.create({
    model: getAnthropicModel(),
    max_tokens: 8000,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  })

  const content = response.content[0]
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude')
  }

  try {
    // Extract JSON from response
    const jsonMatch = content.text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      throw new Error('No JSON found in response')
    }

    const appsData = JSON.parse(jsonMatch[0])

    return appsData.map((app: any) => {
      const existingFiles = app['Existing files'] || app.existingFiles || []
      const missingFiles = app['Missing files'] || app.missingFiles || []
      
      // Parse missing files with detailed information
      const parsedMissingFiles = Array.isArray(missingFiles) 
        ? missingFiles.map((f: any) => typeof f === 'string' ? { name: f, description: 'Implementation needed', estimatedLines: 100 } : f)
        : []
      
      const total = existingFiles.length + parsedMissingFiles.length
      const completionPercentage = total > 0 ? Math.round((existingFiles.length / total) * 100) : 0
      
      return {
        name: app['App name'] || app.name,
        description: app.Description || app.description,
        type: app.Type || app.type,
        reusablePercentage: completionPercentage,
        missingFiles: parsedMissingFiles,
        existingFiles: existingFiles,
        estimatedBuildTime: app['Estimated build time'] || app.estimatedBuildTime,
        technologies: app['Core technologies'] || app.technologies || [],
        difficulty: (app['Difficulty level'] || app.difficulty || 'medium').toLowerCase() as 'easy' | 'medium' | 'hard',
        explanation: app['Why this is a good idea'] || app.explanation || '',
        completionPercentage,
        buildSteps: app['Build steps'] || app.buildSteps || [],
        fastCashLabel: parsedMissingFiles.length <= 2 && completionPercentage >= 80 ? 'QUICK WIN' : undefined,
      }
    })
  } catch (error) {
    console.error('[v0] Error parsing Claude response:', content.text, error)
    return []
  }
}
function calculateReusablePercentage(existing: any[], missing: any[]): number {
  const total = existing.length + missing.length
  if (total === 0) return 0
  return Math.round((existing.length / total) * 100)
}
