# Open pull request triage

Snapshot: 2026-09-27. No pull requests were closed or modified during this audit.

## Summary

| Classification | Count |
|---|---:|
| Already merged-equivalent | 42 |
| Still relevant | 7 |
| Obsolete | 8 |
| **Total open PRs** | **57** |

“Already merged-equivalent” means the security fix or product behavior is present on
`main`, even when Git cannot identify an old patch as an exact cherry-pick.
“Still relevant” means the PR contains distinct work that needs a separate product
decision and rebase. “Obsolete” means newer architecture or UI work superseded it.

## Triage table

| PR | Classification | Rationale |
|---|---|---|
| [#127](https://github.com/DealPatrol/RepoFuse/pull/127) Consolidate RepoFuse security tests and CI | Still relevant | This consolidation PR adds the requested tests, CI, environment inventory, and triage. |
| [#126](https://github.com/DealPatrol/RepoFuse/pull/126) Add OAuth-protected public RepoFuse MCP server | Still relevant | Active OAuth/MCP work opened on 2026-09-27; intentionally left untouched by this PR. |
| [#122](https://github.com/DealPatrol/RepoFuse/pull/122) Fix critical auth, billing, and data-loss regressions | Already merged-equivalent | Exact patch-equivalent of the fix set merged by #123. |
| [#121](https://github.com/DealPatrol/RepoFuse/pull/121) Fix critical auth, billing, and data-loss regressions | Already merged-equivalent | Exact patch-equivalent of the fix set merged by #123. |
| [#120](https://github.com/DealPatrol/RepoFuse/pull/120) Fix critical auth, billing, and data-loss regressions | Already merged-equivalent | Exact patch-equivalent of the fix set merged by #123. |
| [#119](https://github.com/DealPatrol/RepoFuse/pull/119) Fix critical auth, billing, and data-loss regressions | Already merged-equivalent | Exact patch-equivalent of the fix set merged by #123. |
| [#118](https://github.com/DealPatrol/RepoFuse/pull/118) Fix critical auth, billing, and data-loss regressions | Already merged-equivalent | Exact patch-equivalent of the fix set merged by #123. |
| [#117](https://github.com/DealPatrol/RepoFuse/pull/117) Fix critical auth, billing, and data-loss regressions | Already merged-equivalent | Exact patch-equivalent of the fix set merged by #123. |
| [#116](https://github.com/DealPatrol/RepoFuse/pull/116) Fix critical auth, billing, and data-loss regressions | Already merged-equivalent | Earlier implementation of the same ownership, billing, safe-rerun, and fail-closed build fixes now on `main`. |
| [#115](https://github.com/DealPatrol/RepoFuse/pull/115) Fix critical auth, billing, and data-safety regressions | Already merged-equivalent | Its fix set is included in #123. |
| [#114](https://github.com/DealPatrol/RepoFuse/pull/114) Fix critical auth, billing, and safe-replacement regressions | Already merged-equivalent | Its fix set is included in #123. |
| [#113](https://github.com/DealPatrol/RepoFuse/pull/113) Fix paid AI action billing and fail-closed build pushes | Already merged-equivalent | Authenticated billing, atomic deductions, private repos, and fail-closed pushes are on `main`. |
| [#112](https://github.com/DealPatrol/RepoFuse/pull/112) Fix critical auth, ownership, and credit regressions | Already merged-equivalent | Owner-scoped completion/milestones and paid-action charging are on `main`. |
| [#110](https://github.com/DealPatrol/RepoFuse/pull/110) Fix critical auth, billing, and data safety regressions | Already merged-equivalent | Its consolidated security behavior is included in #123. |
| [#109](https://github.com/DealPatrol/RepoFuse/pull/109) Fix critical auth, billing, and data-loss regressions | Already merged-equivalent | Earlier non-identical implementation; all intended protections are included in #123. |
| [#108](https://github.com/DealPatrol/RepoFuse/pull/108) Fix critical auth, billing, and data-loss regressions | Already merged-equivalent | Earlier non-identical implementation; all intended protections are included in #123. |
| [#107](https://github.com/DealPatrol/RepoFuse/pull/107) Fix critical auth and billing regressions | Already merged-equivalent | Its ownership, credit, rerun, and idempotency fixes are on `main`. |
| [#106](https://github.com/DealPatrol/RepoFuse/pull/106) Fix critical auth and build failure regressions | Already merged-equivalent | Completion auth and fail-closed private builds are on `main`. |
| [#105](https://github.com/DealPatrol/RepoFuse/pull/105) Fix milestone ownership checks | Already merged-equivalent | Milestone mutations now scope by project and authenticated owner. |
| [#104](https://github.com/DealPatrol/RepoFuse/pull/104) Fix critical billing and analysis data-loss regressions | Already merged-equivalent | Safe blueprint replacement, billing idempotency, and paid-action refunds are on `main`. |
| [#100](https://github.com/DealPatrol/RepoFuse/pull/100) Fix critical billing, tenant isolation, and false-success regressions | Already merged-equivalent | Its consolidated fix set is included in #123. |
| [#99](https://github.com/DealPatrol/RepoFuse/pull/99) Fix tenant scoping in code completion and milestones | Already merged-equivalent | Completion queries and milestone mutations are owner-scoped on `main`. |
| [#98](https://github.com/DealPatrol/RepoFuse/pull/98) Fix critical blueprint, billing, and milestone regressions | Already merged-equivalent | Safe reruns, authenticated scaffold billing, and milestone ownership are on `main`. |
| [#97](https://github.com/DealPatrol/RepoFuse/pull/97) Fix milestone ownership and scaffold credit charging | Already merged-equivalent | Both protections are on `main`. |
| [#96](https://github.com/DealPatrol/RepoFuse/pull/96) Fix scaffold billing bypass and milestone authorization | Already merged-equivalent | Both protections are on `main`. |
| [#95](https://github.com/DealPatrol/RepoFuse/pull/95) Fix critical build and analysis rerun failures | Already merged-equivalent | Build failures now terminate and reruns preserve prior blueprints until replacements exist. |
| [#93](https://github.com/DealPatrol/RepoFuse/pull/93) Fix critical build-app and credit regressions | Already merged-equivalent | Private fail-closed builds and authenticated atomic billing are on `main`. |
| [#92](https://github.com/DealPatrol/RepoFuse/pull/92) Fix critical build and credit accounting failures | Already merged-equivalent | Its build and billing behavior is on `main`. |
| [#91](https://github.com/DealPatrol/RepoFuse/pull/91) Fix critical build and credit correctness bugs | Already merged-equivalent | Relevant scaffold, credit, build, and Vercel persistence corrections are on `main`. |
| [#90](https://github.com/DealPatrol/RepoFuse/pull/90) Fix build-app false success and blueprint scoping leak | Already merged-equivalent | Build errors fail closed and authenticated blueprint access is scoped. |
| [#89](https://github.com/DealPatrol/RepoFuse/pull/89) Fail build app when provider file writes fail | Already merged-equivalent | Provider write failures throw and stop the stream on `main`. |
| [#88](https://github.com/DealPatrol/RepoFuse/pull/88) Fail build app stream on generation or push errors | Already merged-equivalent | Generation/push failures stop the build on `main`. |
| [#86](https://github.com/DealPatrol/RepoFuse/pull/86) Fail app builds on generation or push errors | Already merged-equivalent | Generation/push failures stop the build on `main`. |
| [#84](https://github.com/DealPatrol/RepoFuse/pull/84) Add resilient AI gateway fallbacks | Still relevant | Adds fallback-model and blocked-credit retry behavior not present on `main`; rebase and review cost/routing policy separately. |
| [#83](https://github.com/DealPatrol/RepoFuse/pull/83) Cloud agent bootstrap notes | Already merged-equivalent | Current `AGENTS.md` already documents required environment variables, schema/setup, and MCP smoke testing. |
| [#82](https://github.com/DealPatrol/RepoFuse/pull/82) Align landing page UI with mobile hero reference | Obsolete | Later landing-page redesigns superseded this stale visual implementation. |
| [#81](https://github.com/DealPatrol/RepoFuse/pull/81) Update dashboard navigation and landing page interactivity | Already merged-equivalent | Current dashboard sidebar, interactive hero, analysis auth, and billing cover its intent. |
| [#78](https://github.com/DealPatrol/RepoFuse/pull/78) Add Build This App generation workflow | Still relevant | Structured, persisted build plans remain distinct from the current direct-build/download flow; requires a rebase. |
| [#74](https://github.com/DealPatrol/RepoFuse/pull/74) Fix RepoFuse issues | Still relevant | Debt scanner, debt fix, and launch-preview features are not on `main`; split and rebase before considering merge. |
| [#72](https://github.com/DealPatrol/RepoFuse/pull/72) Migrate middleware to proxy | Already merged-equivalent | `main` uses the Next.js 16 `proxy.ts` convention after #125. |
| [#70](https://github.com/DealPatrol/RepoFuse/pull/70) Capture user email on GitHub sign-in | Still relevant | Verified-email capture is absent; needs a consent/privacy and marketing-use decision before rebase. |
| [#64](https://github.com/DealPatrol/RepoFuse/pull/64) Critical correctness bugs | Already merged-equivalent | OAuth session and Stripe webhook correctness is present through later security merges. |
| [#57](https://github.com/DealPatrol/RepoFuse/pull/57) Fix critical auth, billing, credit, and rerun correctness bugs | Already merged-equivalent | Safe redirects, Stripe sync, refunds, and safe reruns are on `main`. |
| [#56](https://github.com/DealPatrol/RepoFuse/pull/56) Add Living CTO UX innovations | Still relevant | The proposed thought stream, CTO mode, preferences, and insight rail are absent; rebase as separate product work. |
| [#53](https://github.com/DealPatrol/RepoFuse/pull/53) Fix critical auth, billing, and build correctness issues | Already merged-equivalent | Session validation, Neon billing sync, and fail-closed paid builds are on `main`. |
| [#45](https://github.com/DealPatrol/RepoFuse/pull/45) Polish marketing and dashboard UI | Obsolete | Subsequent homepage, pricing, navigation, and dashboard redesigns superseded this UI patch. |
| [#40](https://github.com/DealPatrol/RepoFuse/pull/40) Build This App for GitHub/GitLab | Already merged-equivalent | The current Build This App route and modal implement this workflow with later security hardening. |
| [#38](https://github.com/DealPatrol/RepoFuse/pull/38) Create GitHub repo from scaffold | Obsolete | The current Build This App workflow supersedes this results-page-specific implementation. |
| [#32](https://github.com/DealPatrol/RepoFuse/pull/32) Use authenticated user for credit APIs | Already merged-equivalent | Credit summary and paid AI routes use the authenticated user on `main`. |
| [#31](https://github.com/DealPatrol/RepoFuse/pull/31) Fix scaffold credit authorization | Already merged-equivalent | Scaffold and credit-summary authorization is on `main`. |
| [#29](https://github.com/DealPatrol/RepoFuse/pull/29) Add GitLab and Bitbucket integrations | Obsolete | It targets an old UI/auth architecture; GitLab was reimplemented and Bitbucket is explicitly unavailable in the current flow. |
| [#28](https://github.com/DealPatrol/RepoFuse/pull/28) Fix credit auth regressions | Already merged-equivalent | Its authenticated-user credit protections are on `main`. |
| [#21](https://github.com/DealPatrol/RepoFuse/pull/21) Migrate to Supabase | Obsolete | RepoFuse deliberately uses Neon’s serverless driver; this migration conflicts with the current architecture. |
| [#20](https://github.com/DealPatrol/RepoFuse/pull/20) Fix duplicate analysis handler and add billing UI | Already merged-equivalent | The duplicate handler is gone and current branding, theming, and Stripe flows supersede its implementation. |
| [#6](https://github.com/DealPatrol/RepoFuse/pull/6) Development environment setup | Obsolete | TaskFlow stubs and the nested env-agent-finder product do not belong in the current RepoFuse application. |
| [#4](https://github.com/DealPatrol/RepoFuse/pull/4) Agent value exploration | Obsolete | The old interactive env-agent script is superseded by current setup docs and is outside the product’s active architecture. |
| [#3](https://github.com/DealPatrol/RepoFuse/pull/3) Clarify Copilot permissions | Obsolete | The PR has no file changes and its one-time review response is no longer actionable. |

## Duplicate “Fix critical…” diff results

The nine open drafts with the exact title **“Fix critical auth, billing, and
data-loss regressions”** were compared against current `main`:

| PR | Patch comparison | Unique missing fix |
|---|---|---|
| #122 | Git patch-id is already present on `main` | None |
| #121 | Git patch-id is already present on `main` | None |
| #120 | Git patch-id is already present on `main` | None |
| #119 | Git patch-id is already present on `main` | None |
| #118 | Git patch-id is already present on `main` | None |
| #117 | Git patch-id is already present on `main` | None |
| #116 | Earlier, non-identical implementation; compared by affected routes and invariants | None; #123 contains the same protections |
| #109 | Earlier, non-identical implementation; compared by affected routes and invariants | None; #123 contains the same protections |
| #108 | Earlier, non-identical implementation; compared by affected routes and invariants | None; #123 contains the same protections |

PRs #123 and #124 merged the consolidated implementation. Current `main` passes
`scripts/critical-regression-check.mjs`, including authenticated/scoped code
completion, project-owner milestone mutations, authenticated scaffold and legacy
analysis billing, atomic/idempotent credits, safe analysis replacement, private
repositories, refunds, and fail-closed provider pushes. There was therefore no
missing security commit to cherry-pick.

## Duplicate PR source

The duplicate PR bodies link to the external Cursor automation
[Find critical bugs](https://cursor.com/automations/077bda2f-73e1-4a9d-a365-d21365e4fe6b)
(`077bda2f-73e1-4a9d-a365-d21365e4fe6b`), owned by Cole Collins. It created PRs
as `app/cursor`; it is not a workflow in this repository. The automation is
currently **disabled**, so no repository change is needed to make it reuse a
single PR. If re-enabled, Cole should configure it to continue or update one
named branch/PR instead of creating a new branch for each run.
