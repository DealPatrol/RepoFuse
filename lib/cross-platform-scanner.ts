import { cookies } from 'next/headers'
import { Anthropic } from '@anthropic-ai/sdk'

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

interface ScannedFile {
  path: string
  platform: string
  language: string
  purpose: string
  technologies: string[]
  exports: string[]
  imports: string[]
  reusabilityScore: number
}

export async function scanCrossPlatformCode(): Promise<ScannedFile[]> {
  const cookieStore = await cookies()
  const platformsData = cookieStore.get('connected_platforms')?.value

  if (!platformsData) {
    throw new Error('No connected platforms')
  }

  const platforms = JSON.parse(platformsData)
  const allFiles: ScannedFile[] = []

  // Fetch files from each connected platform
  for (const [platformId, platformData] of Object.entries(platforms)) {
    try {
      const files = await fetchPlatformFiles(platformId as string, platformData as any)
      allFiles.push(...files)
    } catch (error) {
      console.error(`[v0] Error fetching from ${platformId}:`, error)
    }
  }

  if (allFiles.length === 0) {
    return []
  }

  // Use Claude to analyze files for patterns and reusability
  const analysisPrompt = `Analyze these ${allFiles.length} files from multiple code platforms and identify:
1. The purpose/function of each file
2. What technologies each file uses
3. Reusability score (1-10) based on how generic vs specific it is
4. What apps could be built by combining files

Files to analyze:
${allFiles.map((f, i) => `${i + 1}. [${f.platform}] ${f.path}`).join('\n')}

For each file, provide:
- Purpose (one sentence)
- Technologies (list)
- Reusability score
- Can this be combined with other files to build apps?`

  const response = await getAnthropic().messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 4000,
    messages: [
      {
        role: 'user',
        content: analysisPrompt,
      },
    ],
  })

  // Parse Claude's response and enrich file data
  const analysis = response.content[0].type === 'text' ? response.content[0].text : ''

  return allFiles.map((file) => ({
    ...file,
    purpose: extractPurpose(analysis, file.path) || file.purpose,
    reusabilityScore: extractReusabilityScore(analysis, file.path) || file.reusabilityScore,
  }))
}

async function fetchPlatformFiles(platformId: string, platformData: any): Promise<ScannedFile[]> {
  const accessToken = platformData.access_token

  if (platformId === 'github') {
    return fetchGitHubFiles(accessToken)
  } else if (platformId === 'vercel') {
    return fetchVercelFiles(accessToken)
  } else if (platformId === 'gitlab') {
    return fetchGitLabFiles(accessToken)
  } else if (platformId === 'replit') {
    return fetchReplitFiles(accessToken)
  } else if (platformId === 'netlify') {
    return fetchNetlifyFiles(accessToken)
  }

  return []
}

async function fetchGitHubFiles(token: string): Promise<ScannedFile[]> {
  const repos = await fetch('https://api.github.com/user/repos?per_page=50', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
    },
  }).then(r => r.json())

  const files: ScannedFile[] = []

  for (const repo of repos) {
    try {
      const tree = await fetch(`https://api.github.com/repos/${repo.full_name}/git/trees/HEAD?recursive=1`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }).then(r => r.json())

      if (tree.tree) {
        for (const item of tree.tree.slice(0, 100)) {
          if (isCodeFile(item.path)) {
            files.push({
              path: `${repo.name}/${item.path}`,
              platform: 'github',
              language: getLanguage(item.path),
              purpose: '',
              technologies: [],
              exports: [],
              imports: [],
              reusabilityScore: 5,
            })
          }
        }
      }
    } catch (error) {
      console.error(`[v0] Error fetching GitHub repo ${repo.name}:`, error)
    }
  }

  return files.slice(0, 200)
}

async function fetchVercelFiles(token: string): Promise<ScannedFile[]> {
  const projects = await fetch('https://api.vercel.com/v9/projects', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  }).then(r => r.json())

  // Simplified - would fetch source files from Vercel projects
  return []
}

async function fetchGitLabFiles(token: string): Promise<ScannedFile[]> {
  // Simplified - would fetch from GitLab API
  return []
}

async function fetchReplitFiles(token: string): Promise<ScannedFile[]> {
  // Simplified - would fetch from Replit API
  return []
}

async function fetchNetlifyFiles(token: string): Promise<ScannedFile[]> {
  // Simplified - would fetch from Netlify API
  return []
}

function isCodeFile(path: string): boolean {
  const codeExtensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.java', '.rb', '.php', '.css', '.scss', '.html']
  return codeExtensions.some(ext => path.endsWith(ext))
}

function getLanguage(path: string): string {
  if (path.endsWith('.ts') || path.endsWith('.tsx')) return 'typescript'
  if (path.endsWith('.js') || path.endsWith('.jsx')) return 'javascript'
  if (path.endsWith('.py')) return 'python'
  if (path.endsWith('.go')) return 'go'
  if (path.endsWith('.java')) return 'java'
  if (path.endsWith('.rb')) return 'ruby'
  if (path.endsWith('.php')) return 'php'
  if (path.endsWith('.css') || path.endsWith('.scss')) return 'css'
  if (path.endsWith('.html')) return 'html'
  return 'unknown'
}

function extractPurpose(analysis: string, filePath: string): string {
  const lines = analysis.split('\n')
  const fileSection = lines.find(l => l.includes(filePath))
  if (fileSection) {
    const purposeLine = lines[lines.indexOf(fileSection) + 1]
    return purposeLine?.replace('- Purpose:', '').trim() || ''
  }
  return ''
}

function extractReusabilityScore(analysis: string, filePath: string): number {
  const lines = analysis.split('\n')
  const fileSection = lines.find(l => l.includes(filePath))
  if (fileSection) {
    const scoreLine = lines[lines.indexOf(fileSection) + 3]
    const match = scoreLine?.match(/\d+/)
    return match ? parseInt(match[0]) : 5
  }
  return 5
}
