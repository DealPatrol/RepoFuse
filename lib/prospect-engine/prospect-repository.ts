import { mockProspects } from './mock-data'

export function getMockProspects(limit?: number) {
  return typeof limit === 'number' ? mockProspects.slice(0, limit) : mockProspects
}

export function getMockProspectById(id: string) {
  return mockProspects.find(
    (prospect) =>
      prospect.id.toLowerCase() === id.toLowerCase() ||
      prospect.githubUsername.toLowerCase() === id.toLowerCase(),
  )
}
