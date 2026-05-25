// app/api/preview/route.ts
// Ephemeral Preview — streams progress via SSE, saves URL to DB

import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface GitHubFile { path: string; content: string; }
interface SSEEvent {
  stage: "analyzing" | "fixing" | "deploying" | "live" | "error";
  message?: string;
  url?: string;
  savedId?: string;
}

// ─── POST — launch a new preview ─────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user?.access_token) return new Response("Unauthorized", { status: 401 });

  const { owner, repo } = await req.json();
  if (!owner || !repo) return new Response("Missing owner or repo", { status: 400 });

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: SSEEvent) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));

      try {
        // ── ANALYZE ──────────────────────────────────────────────────────────
        send({ stage: "analyzing", message: "Fetching repository files…" });
        const files = await fetchRepoFiles(owner, repo, user.access_token);
        send({ stage: "analyzing", message: `Found ${files.length} files · Reading package.json…` });

        const pkgFile = files.find((f) => f.path === "package.json");
        if (!pkgFile) {
          send({ stage: "error", message: "No package.json found." });
          controller.close(); return;
        }

        // ── FIX DEPS ─────────────────────────────────────────────────────────
        send({ stage: "fixing", message: "Analyzing dependencies with AI…" });
        const { fixedPackageJson, changes } = await fixDependencies(pkgFile.content);
        for (const c of changes) send({ stage: "fixing", message: c });
        if (!changes.length) send({ stage: "fixing", message: "All dependencies look healthy ✓" });

        // ── DEPLOY ───────────────────────────────────────────────────────────
        send({ stage: "deploying", message: "Preparing files for deployment…" });
        const deployFiles = buildDeployFiles(files, fixedPackageJson);
        const name = `repofuse-${repo.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;

        send({ stage: "deploying", message: "Pushing to Vercel API…" });
        const { deploymentId, deploymentUrl } = await createVercelDeployment(
          name, deployFiles, detectFramework(fixedPackageJson)
        );

        send({ stage: "deploying", message: "Building project on Vercel…" });
        const readyUrl = await pollUntilReady(deploymentId);
        const previewUrl = `https://${readyUrl}`;

        // ── SAVE TO DB ───────────────────────────────────────────────────────
        const db = getDb();
        const saved = await db`
          INSERT INTO previews (user_id, repo_owner, repo_name, preview_url, vercel_deployment_id, dep_changes)
          VALUES (
            ${user.id},
            ${owner},
            ${repo},
            ${previewUrl},
            ${deploymentId},
            ${JSON.stringify(changes)}
          )
          RETURNING id
        `;

        send({ stage: "live", url: previewUrl, savedId: saved[0]?.id });

      } catch (err: any) {
        console.error("[preview]", err);
        send({ stage: "error", message: err.message ?? "Unexpected error." });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

// ─── GET — fetch saved previews for a repo ───────────────────────────────────

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user?.id) return new Response("Unauthorized", { status: 401 });

  const { searchParams } = new URL(req.url);
  const owner = searchParams.get("owner");
  const repo  = searchParams.get("repo");

  const db = getDb();

  // If owner+repo provided, return previews for that specific repo
  // Otherwise return all previews for the user (dashboard view)
  const previews = owner && repo
    ? await db`
        SELECT id, repo_owner, repo_name, preview_url, dep_changes, expires_at, created_at
        FROM previews
        WHERE user_id = ${user.id}
          AND repo_owner = ${owner}
          AND repo_name  = ${repo}
        ORDER BY created_at DESC
        LIMIT 10
      `
    : await db`
        SELECT id, repo_owner, repo_name, preview_url, dep_changes, expires_at, created_at
        FROM previews
        WHERE user_id = ${user.id}
        ORDER BY created_at DESC
        LIMIT 20
      `;

  return Response.json({ previews });
}

// ─── GitHub helpers ───────────────────────────────────────────────────────────

async function fetchRepoFiles(owner: string, repo: string, token: string): Promise<GitHubFile[]> {
  const treeRes = await ghFetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`, token
  );
  const tree = await treeRes.json();

  const SKIP = ["node_modules", ".git", "dist", "build", ".next", "coverage"];
  const TEXT_EXTS = [".ts", ".tsx", ".js", ".jsx", ".json", ".css", ".scss", ".html", ".md"];

  const textFiles = (tree.tree ?? []).filter((item: any) => {
    if (item.type !== "blob") return false;
    if (SKIP.some((s) => item.path.includes(s))) return false;
    if (item.size > 100_000) return false;
    const ext = "." + item.path.split(".").pop();
    return TEXT_EXTS.includes(ext) || item.path === "package.json";
  });

  const results = await Promise.allSettled(
    textFiles.slice(0, 80).map(async (item: any) => {
      const res  = await ghFetch(`https://api.github.com/repos/${owner}/${repo}/contents/${item.path}`, token);
      const data = await res.json();
      const content = data.encoding === "base64"
        ? Buffer.from(data.content, "base64").toString("utf-8")
        : data.content ?? "";
      return { path: item.path, content } as GitHubFile;
    })
  );

  return results
    .filter((r): r is PromiseFulfilledResult<GitHubFile> => r.status === "fulfilled")
    .map((r) => r.value);
}

function ghFetch(url: string, token: string) {
  return fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "User-Agent": "RepoFuse" },
  });
}

// ─── Claude dep-fixer ────────────────────────────────────────────────────────

async function fixDependencies(raw: string) {
  let parsed: Record<string, any>;
  try { parsed = JSON.parse(raw); }
  catch { return { fixedPackageJson: {}, changes: ["Could not parse package.json"] }; }

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    messages: [{
      role: "user",
      content: `You are a Node.js expert. Fix any deprecated, broken, or unmaintained dependencies in this package.json.
Return ONLY raw JSON (no markdown) with two keys:
- "packageJson": the fixed package.json object
- "changes": array of strings like "react-scripts → vite@5.2.0". Empty array if nothing needed fixing.

package.json:
${JSON.stringify(parsed, null, 2)}`,
    }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "{}";
  try {
    const result = JSON.parse(text.replace(/```json|```/g, "").trim());
    return {
      fixedPackageJson: result.packageJson ?? parsed,
      changes: Array.isArray(result.changes) ? result.changes : [],
    };
  } catch {
    return { fixedPackageJson: parsed, changes: [] };
  }
}

// ─── Vercel helpers ───────────────────────────────────────────────────────────

function buildDeployFiles(files: GitHubFile[], fixedPkg: Record<string, any>) {
  return files.map((f) => ({
    file: f.path,
    data: f.path === "package.json" ? JSON.stringify(fixedPkg, null, 2) : f.content,
  }));
}

function detectFramework(pkg: Record<string, any>): string | null {
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  if (deps["next"]) return "nextjs";
  if (deps["react-scripts"]) return "create-react-app";
  if (deps["vite"]) return "vite";
  if (deps["@remix-run/node"]) return "remix";
  if (deps["nuxt"]) return "nuxtjs";
  if (deps["astro"]) return "astro";
  return null;
}

async function createVercelDeployment(
  name: string,
  files: { file: string; data: string }[],
  framework: string | null
): Promise<{ deploymentId: string; deploymentUrl: string }> {
  const url = process.env.VERCEL_TEAM_ID
    ? `https://api.vercel.com/v13/deployments?teamId=${process.env.VERCEL_TEAM_ID}`
    : "https://api.vercel.com/v13/deployments";

  const body: Record<string, any> = { name, files, target: "preview", projectSettings: {} };
  if (framework) body.projectSettings.framework = framework;

  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.VERCEL_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err?.error?.message ?? `Vercel API error: ${res.status}`);
  }
  const data = await res.json();
  return { deploymentId: data.id, deploymentUrl: data.url };
}

async function pollUntilReady(deploymentId: string): Promise<string> {
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 4000));
    const res  = await fetch(`https://api.vercel.com/v13/deployments/${deploymentId}`, {
      headers: { Authorization: `Bearer ${process.env.VERCEL_TOKEN}` },
    });
    if (!res.ok) continue;
    const data = await res.json();
    if (data.readyState === "READY") return data.url as string;
    if (["ERROR", "CANCELED"].includes(data.readyState)) throw new Error(`Deployment ${data.readyState}`);
  }
  throw new Error("Deployment timed out.");
}
