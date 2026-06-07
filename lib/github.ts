export interface GitHubRepositorySummary {
  id: number
  name: string
  full_name: string
  description: string | null
  url: string
  language: string | null
  stars: number
  default_branch: string
  private: boolean
}

interface GitHubApiRepository {
  id: number
  name: string
  full_name: string
  description: string | null
  html_url: string
  language: string | null
  stargazers_count: number
  default_branch: string
  private: boolean
}

export class GitHubApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public responseBody: string,
  ) {
    super(message)
    this.name = 'GitHubApiError'
  }
}

async function githubRequest<T>(url: string, accessToken: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'RepoFuse',
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    const message = await response.text()
    throw new GitHubApiError(`GitHub request failed (${response.status})`, response.status, message)
  }

  return response.json() as Promise<T>
}

export async function listGitHubRepositories(accessToken: string): Promise<GitHubRepositorySummary[]> {
  const repositories: GitHubRepositorySummary[] = []

  for (let page = 1; page <= 10; page += 1) {
    const pageItems = await githubRequest<GitHubApiRepository[]>(
      `https://api.github.com/user/repos?per_page=100&sort=updated&affiliation=owner,collaborator,organization_member&page=${page}`,
      accessToken,
    )

    repositories.push(
      ...pageItems.map((repo) => ({
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        description: repo.description,
        url: repo.html_url,
        language: repo.language,
        stars: repo.stargazers_count,
        default_branch: repo.default_branch,
        private: repo.private,
      })),
    )

    if (pageItems.length < 100) {
      break
    }
  }

  return repositories
}

/** Paths we skip so the analysis budget isn't eaten by deps and build output. */
const SKIP_TREE_PATH_PREFIXES = [
  'node_modules/',
  'vendor/',
  '.git/',
  '.next/',
  'dist/',
  'build/',
  'coverage/',
  '__pycache__/',
  '.venv/',
  'venv/',
  'target/', // Rust
]

function shouldSkipRepoPath(path: string): boolean {
  const lower = path.toLowerCase()
  if (lower.endsWith('.min.js') || lower.endsWith('.map')) return true
  return SKIP_TREE_PATH_PREFIXES.some((prefix) => lower.includes(prefix))
}

export async function getGitHubRepositoryTree(
  fullName: string,
  defaultBranch: string,
  accessToken: string,
) {
  return githubRequest<{ tree?: Array<{ path: string; type: string; size?: number }>; truncated?: boolean }>(
    `https://api.github.com/repos/${fullName}/git/trees/${encodeURIComponent(defaultBranch)}?recursive=1`,
    accessToken,
  )
}

/**
 * Resolves default_branch to the repo root tree SHA, then loads a recursive tree.
 * More reliable than passing a branch name directly when the Trees API rejects some refs.
 */
export async function getGitHubRepositoryTreeFromBranch(
  fullName: string,
  branch: string,
  accessToken: string,
) {
  const branchRef = await githubRequest<{ commit: { sha: string } }>(
    `https://api.github.com/repos/${fullName}/branches/${encodeURIComponent(branch)}`,
    accessToken,
  )
  const commit = await githubRequest<{ commit: { tree: { sha: string } } }>(
    `https://api.github.com/repos/${fullName}/commits/${branchRef.commit.sha}`,
    accessToken,
  )
  const treeSha = commit.commit.tree.sha
  return githubRequest<{ tree?: Array<{ path: string; type: string; size?: number }>; truncated?: boolean }>(
    `https://api.github.com/repos/${fullName}/git/trees/${treeSha}?recursive=1`,
    accessToken,
  )
}

export { shouldSkipRepoPath }
