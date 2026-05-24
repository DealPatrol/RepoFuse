export const DEFAULT_GITHUB_RETURN_TO = '/dashboard/repositories?connected=github'

export function getSafeRedirectPath(
  value: string | null | undefined,
  fallback = DEFAULT_GITHUB_RETURN_TO,
): string {
  const candidate = value?.trim()

  if (!candidate || !candidate.startsWith('/') || candidate.startsWith('//') || candidate.includes('\\')) {
    return fallback
  }

  try {
    const parsed = new URL(candidate, 'http://repofuse.local')

    if (parsed.origin !== 'http://repofuse.local') {
      return fallback
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch {
    return fallback
  }
}
