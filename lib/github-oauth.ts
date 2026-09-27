/** Legacy GitHub OAuth app used before Clerk social sign-in. */
export function isLegacyGitHubOAuthConfigured(): boolean {
  const clientId = (process.env.GITHUB_CLIENT_ID || process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID)?.trim()
  const clientSecret = process.env.GITHUB_CLIENT_SECRET?.trim()
  return Boolean(clientId && clientSecret)
}

export function legacyGitHubClientId(): string | undefined {
  const clientId = (process.env.GITHUB_CLIENT_ID || process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID)?.trim()
  return clientId || undefined
}
