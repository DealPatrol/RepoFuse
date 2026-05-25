export type LikedAppDifficulty = 'easy' | 'medium' | 'hard'

export interface LikedApp {
  id: string
  name: string
  tagline: string
  description: string
  type: string
  difficulty: LikedAppDifficulty
  estimatedEffort: string
  suggestedStack: string[]
  monetizationAngle: string
  whyNow: string
  reusePlan?: string
  sourceFiles?: string[]
  filesToCreate?: string[]
  selectedAt: string
}

const LIKED_APPS_KEY = 'repofuse:liked-apps'
const LIKED_APPS_EVENT = 'repofuse-liked-apps-changed'

export function createLikedAppId(name: string, tagline = '') {
  return `${name}-${tagline}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 96)
}

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

export function getLikedApps(): LikedApp[] {
  if (!canUseStorage()) return []

  try {
    const raw = window.localStorage.getItem(LIKED_APPS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveLikedApps(apps: LikedApp[]) {
  if (!canUseStorage()) return
  window.localStorage.setItem(LIKED_APPS_KEY, JSON.stringify(apps))
  window.dispatchEvent(new CustomEvent(LIKED_APPS_EVENT))
}

export function isAppLiked(id: string) {
  return getLikedApps().some((app) => app.id === id)
}

export function toggleLikedApp(app: Omit<LikedApp, 'selectedAt'>) {
  const apps = getLikedApps()
  const exists = apps.some((item) => item.id === app.id)
  const nextApps = exists
    ? apps.filter((item) => item.id !== app.id)
    : [{ ...app, selectedAt: new Date().toISOString() }, ...apps]

  saveLikedApps(nextApps)
  return { liked: !exists, apps: nextApps }
}

export function removeLikedApp(id: string) {
  const apps = getLikedApps().filter((app) => app.id !== id)
  saveLikedApps(apps)
  return apps
}

export function subscribeToLikedApps(callback: () => void) {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener(LIKED_APPS_EVENT, callback)
  window.addEventListener('storage', callback)
  return () => {
    window.removeEventListener(LIKED_APPS_EVENT, callback)
    window.removeEventListener('storage', callback)
  }
}
