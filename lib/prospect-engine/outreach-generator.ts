import type { OutreachMessage, Prospect } from './types'

function getSpecificRepo(prospect: Prospect) {
  return [...prospect.repos].sort((a, b) => b.matchedKeywords.length - a.matchedKeywords.length || b.stars - a.stars)[0]
}

function getSpecificTheme(prospect: Prospect) {
  const keywords = new Set<string>()
  for (const repo of prospect.repos) {
    for (const keyword of repo.matchedKeywords) {
      keywords.add(keyword)
    }
  }

  const themes = Array.from(keywords).slice(0, 3)
  return themes.length > 0 ? themes.join(', ') : 'launchable developer products'
}

export function generateOutreachMessage(prospect: Prospect): OutreachMessage {
  const repo = getSpecificRepo(prospect)
  const firstName = prospect.name.split(' ')[0] || prospect.githubUsername
  const repoReference = repo ? `${repo.name}${repo.description ? ` (${repo.description})` : ''}` : 'your GitHub projects'
  const theme = getSpecificTheme(prospect)

  return {
    channel: prospect.email ? 'email' : 'manual',
    subject: 'Quick idea from your GitHub projects',
    status: 'draft',
    body: [
      `Hey ${firstName},`,
      '',
      `I came across your GitHub and noticed ${repoReference}. Looks like you've built useful pieces around ${theme}.`,
      '',
      "I'm building RepoFuse - it analyzes a developer's existing repos and shows what products they are already close to launching by combining code they have already written.",
      '',
      'I think your repos would be a strong fit for this. Want me to run a free RepoFuse report on them?',
      '',
      'No pressure - just thought it might be useful. If you would rather not hear from me again, just say so and I will not follow up.',
      '',
      'Cole',
    ].join('\n'),
  }
}
