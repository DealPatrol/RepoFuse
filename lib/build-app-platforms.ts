export type BuildPlatform = 'github' | 'gitlab'

export interface GitLabProject {
  id: number
  web_url: string
  default_branch: string
}

async function providerErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const err = (await res.json()) as { message?: unknown }
    if (typeof err.message === 'string') {
      return err.message
    }
    if (err.message && typeof err.message === 'object') {
      return JSON.stringify(err.message)
    }
  } catch {
    // Provider APIs do not always return JSON for gateway or auth failures.
  }

  return fallback
}

export async function createGitHubRepo(
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
    throw new Error(
      await providerErrorMessage(res, 'Failed to create GitHub repository'),
    )
  }

  const repo = (await res.json()) as { html_url: string }
  return repo.html_url
}

export async function pushFileToGitHub(
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
    const message = await providerErrorMessage(
      res,
      `Failed to push ${path} to GitHub`,
    )
    throw new Error(`GitHub rejected ${path}: ${message}`)
  }
}

export async function createGitLabProject(
  accessToken: string,
  repoName: string,
  description: string,
): Promise<GitLabProject> {
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
    throw new Error(
      await providerErrorMessage(res, 'Failed to create GitLab project'),
    )
  }

  return res.json() as Promise<GitLabProject>
}

export async function pushFileToGitLab(
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
    const message = await providerErrorMessage(
      res,
      `Failed to push ${path} to GitLab`,
    )
    throw new Error(`GitLab rejected ${path}: ${message}`)
  }
}
