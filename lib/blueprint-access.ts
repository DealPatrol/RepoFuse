import type { AuthUser } from '@/lib/auth'
import { getUserViewedBlueprintIds, type AppBlueprint } from '@/lib/queries'
import { resolveProAccess } from '@/lib/pro-access'
import { PLANS, type PlanId } from '@/lib/stripe'

export interface BlueprintAccessResult {
  blueprints: AppBlueprint[]
  blueprintLimit: number
  userPlan: PlanId
  viewedBlueprintIds: string[]
  isTrialing: boolean
}

function maskLockedBlueprint(blueprint: AppBlueprint): AppBlueprint {
  return {
    ...blueprint,
    existing_files: [],
    missing_files: [],
    estimated_effort: null,
    technologies: [],
    ai_explanation: null,
  }
}

export async function applyBlueprintAccess(
  user: AuthUser,
  blueprints: AppBlueprint[],
): Promise<BlueprintAccessResult> {
  let userPlan: PlanId = 'free'
  let blueprintLimit: number = PLANS.free.blueprints_viewable
  let viewedBlueprintIds: string[] = []
  let isTrialing = false

  try {
    const [proAccess, viewedIds] = await Promise.all([
      resolveProAccess(user),
      getUserViewedBlueprintIds(user.id),
    ])

    userPlan = proAccess.canAccessPro ? proAccess.plan : 'free'
    blueprintLimit = PLANS[userPlan].blueprints_viewable
    viewedBlueprintIds = viewedIds
    isTrialing = proAccess.subscription?.status === 'trialing'
  } catch {
    // Billing/view tracking may be unavailable during setup; fall back to free limits.
  }

  if (blueprintLimit === -1) {
    return { blueprints, blueprintLimit, userPlan, viewedBlueprintIds, isTrialing }
  }

  const viewed = new Set(viewedBlueprintIds)
  let remainingViews = Math.max(0, blueprintLimit - viewed.size)
  const accessibleBlueprints = blueprints.map((blueprint) => {
    if (viewed.has(blueprint.id)) {
      return blueprint
    }

    if (remainingViews > 0) {
      remainingViews -= 1
      return blueprint
    }

    return maskLockedBlueprint(blueprint)
  })

  return {
    blueprints: accessibleBlueprints,
    blueprintLimit,
    userPlan,
    viewedBlueprintIds,
    isTrialing,
  }
}
