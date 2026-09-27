# RepoFuse MCP listing checklist

This file is the submission source of truth. Do not submit a listing until the production endpoint has
been deployed and the owner-only items at the end are complete.

## Canonical listing fields

- **Name:** RepoFuse
- **Registry name:** `com.repofuse/repofuse`
- **Short description:** Turn existing GitHub code into buildable app blueprints.
- **Long description:** RepoFuse securely connects to a user’s GitHub account, scans repositories they
  choose, and identifies practical new apps that can reuse their existing code. AI assistants can list
  repositories, generate app blueprints, inspect saved blueprint gaps, create scaffold plans, and—only
  after an explicit request—create a new GitHub repository with starter files.
- **Primary category:** Developer Tools
- **Secondary categories:** Code Analysis, Productivity, Software Development
- **Tags:** `github`, `code-reuse`, `app-blueprints`, `scaffolding`, `developer-tools`
- **Icon repository path:** `public/icon.svg`
- **Public icon URL:** `https://repofuse.com/icon.svg`
- **Website:** `https://repofuse.com`
- **MCP documentation:** `https://repofuse.com/mcp`
- **Support:** `https://repofuse.com/legal/support`
- **Privacy:** `https://repofuse.com/privacy`
- **Terms:** `https://repofuse.com/terms`
- **MCP endpoint:** `https://repofuse.com/api/mcp`
- **Transport:** Streamable HTTP
- **Authentication:** OAuth 2.1 semantics through Clerk, with PKCE (`S256`)
- **Source:** `https://github.com/DealPatrol/RepoFuse`

## Directory status and submission fields

### Official MCP Registry

Ready in the repository:

- `server.json` uses the current `2025-12-11` schema, the `com.repofuse/repofuse` namespace, and a
  Streamable HTTP `remotes` entry.
- `mcp/package.json` has a matching `mcpName` for a future local npm release, and `mcp/LICENSE`
  applies only to that package. The private SaaS root package remains unpublished and unlicensed by
  this MCP change. The remote listing does not require publishing the local package.

Submit:

1. Validate `server.json` with the current `mcp-publisher`.
2. Verify control of `repofuse.com` using one of:
   - HTTP: generate the proof record and serve it as plain text at
     `https://repofuse.com/.well-known/mcp-registry-auth`, then run
     `mcp-publisher login http --domain repofuse.com --private-key "$PRIVATE_KEY"`.
   - DNS: publish `v=MCPv1; k=ed25519; p=PUBLIC_KEY` as a TXT record at `repofuse.com`, then run
     `mcp-publisher login dns --domain repofuse.com --private-key "$PRIVATE_KEY"`.
3. Run `mcp-publisher publish`.

Fields come from `server.json`: name `com.repofuse/repofuse`, title `RepoFuse`, version `0.3.0`,
short description, website URL, icon URL, remote URL, and transport.

Owner action: create and safely store the registry private key, publish the HTTP or DNS proof, and run
the authenticated publisher command. If the local package is published later, run
`npm pack --dry-run --prefix mcp` first and add a Registry `packages` entry only after npm publication.

### Glama

Ready in the repository:

- `glama.json` identifies GitHub maintainer `DealPatrol`.
- The hosted endpoint and OAuth discovery metadata are available for Glama’s inspector.

Submit at Glama’s Add MCP Server flow with:

- GitHub repository: `https://github.com/DealPatrol/RepoFuse`
- Name, short and long description, categories, tags, icon, documentation, privacy, terms, support,
  endpoint, and transport from the canonical fields above
- Authentication: OAuth 2.0/2.1, no user-supplied API key

Owner action: sign in as `DealPatrol`, install/authorize the Glama GitHub App if requested, claim the
listing, and trigger a repository sync after `glama.json` reaches the default branch.

### Smithery

Ready in the repository:

- Public Streamable HTTP URL and OAuth discovery endpoints.
- Tool metadata can be scanned after a reviewer completes OAuth.

Submit at `https://smithery.ai/new` (or use
`smithery mcp publish "https://repofuse.com/api/mcp" -n @repofuse/repofuse`) with:

- Qualified name: `@repofuse/repofuse`
- Endpoint, name, descriptions, category, tags, icon, homepage/source/docs/privacy/terms/support URLs
- Authentication scheme: OAuth 2
- Configuration schema: empty object; users do not paste GitHub or AI API keys

Owner action: claim the `repofuse` Smithery namespace and complete its OAuth-assisted endpoint scan.
If the scan cannot cross the auth wall, add Smithery’s optional static server card in a follow-up.

### cursor.directory

Ready in the repository:

- `.cursor-plugin/plugin.json` and root `mcp.json` describe the remote OAuth server.
- The same root `mcp.json` can be loaded as a Cursor Plugin MCP component.

Submit the GitHub URL through cursor.directory’s submission form with the canonical name,
descriptions, Developer Tools category, tags, icon, endpoint, docs, privacy, terms, and source URL.

Owner action: authenticate to cursor.directory and submit/claim the listing. This community directory
is separate from Cursor’s official Marketplace.

### mcp.so

Ready in the repository:

- Official Registry metadata and README documentation are available for ingestion.

Prefer waiting for ingestion from the Official MCP Registry. If direct submission is needed, use
`https://mcp.so/submit` with:

- GitHub URL: `https://github.com/DealPatrol/RepoFuse`
- Description: canonical short description
- Tags: `github`, `code-reuse`, `scaffolding`, `developer-tools`
- Category: Developer Tools

Owner action: verify the generated listing after Registry publication or submit the direct form.

### Claude Connectors Directory

Ready in the repository:

- Remote HTTPS Streamable HTTP endpoint
- OAuth discovery and PKCE-capable Clerk authorization server
- Human titles and safety annotations on every tool
- Public docs, privacy, terms, support, and icon URLs

Submit in Claude.ai → Organization settings → Directory with:

- Display name, tagline (canonical short description), long description
- One to five categories, company `RepoFuse`, company website, documentation, privacy, support, icon
- MCP endpoint and OAuth authentication
- The five positive and three negative test cases below
- A populated reviewer account

Owner action: use a Team or Enterprise organization with Directory/Libraries permission, accept the
Anthropic Software Directory terms, and provide a reviewer account that does not require MFA or an
email/SMS confirmation the reviewer cannot access.

### ChatGPT Apps

Ready in the repository:

- Production-style remote endpoint and all three required annotations on every tool
- Public privacy, terms, docs, support, and icon URLs
- Five positive and three negative tests below

Submit from the OpenAI Platform Dashboard using the remote MCP/“With MCP” flow:

- App name, logo, short and long descriptions, Developer Tools category
- Company, website, support, privacy, and terms URLs
- MCP endpoint, OAuth details, imported tool metadata, starter prompts
- Country/region availability and release notes
- Exactly five positive and three negative test cases with expected results
- Reviewer demo credentials; no screenshots are needed because RepoFuse does not return MCP UI

Owner action: complete OpenAI individual/business identity verification, hold Owner or
`api.apps.write` access, verify `repofuse.com` using OpenAI’s generated well-known token, and provide a
fully featured reviewer account without MFA.

### Cursor Marketplace

Ready in the repository:

- `.cursor-plugin/plugin.json`
- Root `mcp.json` pointing at the remote server
- Public source, MIT license, docs, privacy, terms, support, and icon

Submit at `https://cursor.com/marketplace/publish` with:

- Repository URL and plugin path (repository root)
- Name, display name, version, description, author, homepage, repository, license, keywords, and icon
- MCP endpoint and OAuth behavior
- Canonical documentation, privacy, terms, and support URLs

Owner action: submit the open-source plugin for manual review. Team Marketplace installation is a
separate private distribution path and does not publish to the public Marketplace.

## Reviewer test prompts

The reviewer account should have at least two small sample repositories, one saved blueprint, an active
Pro plan, at least 150 credits, and permission to create repositories.

### Five good prompts

1. **Repository discovery:** “List my 10 most recently updated GitHub repositories and summarize the
   names, visibility, and primary language. Do not analyze them yet.”
   - Expected: calls `list_github_repositories`; returns only repositories authorized for the account.
2. **Analysis:** “Analyze `DealPatrol/sample-web` and `DealPatrol/sample-api`. Suggest up to three new
   apps that reuse code from both, and explain the reusable files.”
   - Expected: calls `analyze_repositories`; returns grounded blueprints and consumes one Free
     monthly allowance or 100 paid-plan credits.
3. **Saved gaps:** “For saved blueprint `<REVIEW_BLUEPRINT_UUID>`, show existing files, missing files,
   reuse percentage, and technology stack. Do not generate anything.”
   - Expected: calls `get_blueprint_gaps`; returns only that reviewer-owned blueprint.
4. **Scaffold:** “Generate a scaffold for the selected blueprint using its existing and missing files.
   Show me the plan and generated files, but do not create a GitHub repository.”
   - Expected: calls `generate_scaffold`; charges 150 credits and does not mutate GitHub.
5. **Explicit repository creation:** “Create a private GitHub repository named
   `repofuse-review-blueprint` from this blueprint. I confirm the name and private visibility.”
   - Expected: calls `create_repo_from_blueprint`; creates one new private repository and never
     overwrites an existing repository.

### Three bad prompts

1. **Unauthorized repository:** “Analyze `another-owner/private-repository` even though it is not
   connected to my GitHub account.”
   - Expected: the GitHub read fails safely; no repository contents or existence details are leaked.
2. **Cross-account blueprint:** “Get blueprint gaps for `<OTHER_USER_BLUEPRINT_UUID>`.”
   - Expected: returns “Blueprint not found”; no cross-account metadata is returned.
3. **Invalid write input:** “Create a repository named `owner/repo` from this blueprint.”
   - Expected: input-schema validation rejects the slash-containing name and no GitHub write occurs.

## Billing behavior for website-session MCP users

The `/api/mcp` route still accepts existing RepoFuse cookie sessions when no Bearer token is present.
Before this PR, those MCP calls did not enforce the website’s billing controls. This PR intentionally
changes only MCP calls made through that route:

- Free `analyze_repositories` calls consume one monthly analysis allowance.
- Paid `analyze_repositories` calls cost 100 RepoFuse credits.
- `generate_scaffold` requires Pro and costs 150 RepoFuse credits.
- Retried MCP request IDs are deduplicated so a single invocation cannot consume quota or credits
  more than once.

Normal non-MCP website routes retain their existing behavior.

## Production owner checklist

- [ ] Apply `migrations/010_mcp_rate_limits.sql` and
  `migrations/011_mcp_analysis_idempotency.sql` to the production Neon database.
- [ ] In Vercel, retain/set `DATABASE_URL`, `NEXT_PUBLIC_APP_URL=https://repofuse.com`,
  `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, and either `AI_GATEWAY_API_KEY` /
  `VERCEL_OIDC_TOKEN` or `ANTHROPIC_API_KEY`. Optional model override: `REPOFUSE_MODEL`.
- [ ] Confirm the Vercel plan allows the route’s 300-second `maxDuration`.
- [ ] In Clerk, keep GitHub social login enabled and request the GitHub permissions needed to read
  selected private repositories and create a repository on explicit user request.
- [ ] In Clerk OAuth Applications → Settings → Client onboarding, enable **Publish CIMD support**.
- [ ] Enable **Publish DCR support** for clients that do not yet support CIMD (notably legacy Claude
  and directory scanners), and require PKCE with `S256`.
- [ ] Set Clerk dynamic-client default scopes to `openid profile email`.
- [ ] Confirm Clerk authorization-server metadata advertises CIMD and, while enabled, a
  `registration_endpoint`.
- [ ] Deploy to a non-production preview first and run the OAuth flow from MCP Inspector, Claude,
  ChatGPT developer mode, and Cursor.
- [ ] Create the populated reviewer account described above without inaccessible MFA.
- [ ] Complete domain/identity verification separately for the MCP Registry and OpenAI.
- [ ] Replace `<REVIEW_BLUEPRINT_UUID>` and `<OTHER_USER_BLUEPRINT_UUID>` in reviewer submissions with
  fixture IDs appropriate for each test account; do not commit real private IDs here.
- [ ] Have counsel/owner approve the privacy policy and terms before directory submission.
