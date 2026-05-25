// app/api/preview/route.ts
// Ephemeral Preview — streams progress back to the client via SSE
// Stages: analyzing → fixing → deploying → live

import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface GitHubFile {
  path: string;
  content: string;
}

interface SSEEvent {
  stage: "analyzing" | "fixing" | "deploying" | "live" | "error";
  message?: string;
  url?: string;
}

export async function POST(req: NextRequest) {
  // Auth — uses RepoFuse's cookie-based system
  const user = await getCurrentUser();
  if (!user?.access_token) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { owner, repo } = await req.json();
  if (!owner || !repo) {
    return new Response("Missing owner or repo", { status: 400 });
  }

  const accessToken = user.access_token;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: SSEEvent) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
        );
      };

      try {
        // ── STAGE 1: ANALYZE ─────────────────────────────────────────────────
        send({ stage: "analyzing", message: "Fetching repository files…" });

        const files = await fetchRepoFiles(owner, repo, accessToken);

        send({
          stage: "analyzing",
          message: `Found ${files.length} files · Reading package.json…`,
        });

        const packageJsonFile = files.find((f) => f.path === "package.json");
        if (!packageJsonFile) {
          send({ stage: "error", message: "No package.json found in this repository." });
          controller.close();
          return;
        }

        // ── STAGE 2: FIX DEPS WITH CLAUDE ────────────────────────────────────
        send({ stage: "fixing", message: "Analyzing dependencies with AI…" });

        const { fixedPackageJson, changes } = await fixDependencies(packageJsonFile.content);

        for (const change of changes) {
          send({ stage: "fixing", message: change });
        }
        if (changes.length === 0) {
          send({ stage: "fixing", message: "All dependencies look healthy ✓" });
        }

        // ── STAGE 3: DEPLOY TO VERCEL ─────────────────────────────────────────
        send({ stage: "deploying", message: "Preparing files for deployment…" });

        const deployFiles = buildDeployFiles(files, fixedPackageJson);
        const deploymentName = `repofuse-${repo.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
        const framework = detectFramework(fixedPackageJson);

        send({ stage: "deploying", message: "Pushing to Vercel API…" });

        const deploymentId = await createVercelDeployment(deploymentName, deployFiles, framework);

        send({ stage: "deploying", message: "Building project on Vercel…" });

        const previewUrl = await pollUntilReady(deploymentId);

        send({ stage: "live", url: `https://${previewUrl}` });

      } catch (err: any) {
        console.error("[preview]", err);
        send({ stage: "error", message: err.message ?? "An unexpected error occurred." });
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

// ─── GitHub helpers ───────────────────────────────────────────────────────────

async function fetchRepoFiles(owner: string, repo: string, token: string): Promise<GitHubFile[]> {
  const treeRes = await ghFetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`,
    token
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
      const res = await ghFetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${item.path}`,
        token
      );
      const data = await res.json();
      const content =
        data.encoding === "base64"
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
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "RepoFuse",
    },
  });
}

// ─── Claude dep-fixer ────────────────────────────────────────────────────────

async function fixDependencies(rawPackageJson: string) {
  let parsed: Record<string, any>;
  try {
    parsed = JSON.parse(rawPackageJson);
  } catch {
    return { fixedPackageJson: {}, changes: ["Could not parse package.json"] };
  }

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    messages: [{
      role: "user",
      content: `You are a Node.js expert. Fix any deprecated, broken, or unmaintained dependencies in this package.json.

Return ONLY a raw JSON object (no markdown, no explanation) with exactly two keys:
- "packageJson": the complete fixed package.json as a JSON object  
- "changes": array of short strings like "react-scripts → vite@5.2.0". Empty array if nothing needed fixing.

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

function buildDeployFiles(files: GitHubFile[], fixedPackageJson: Record<string, any>) {
  return files.map((f) => ({
    file: f.path,
    data: f.path === "package.json" ? JSON.stringify(fixedPackageJson, null, 2) : f.content,
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
): Promise<string> {
  const url = process.env.VERCEL_TEAM_ID
    ? `https://api.vercel.com/v13/deployments?teamId=${process.env.VERCEL_TEAM_ID}`
    : "https://api.vercel.com/v13/deployments";

  const body: Record<string, any> = { name, files, target: "preview", projectSettings: {} };
  if (framework) body.projectSettings.framework = framework;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.VERCEL_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err?.error?.message ?? `Vercel API error: ${res.status}`);
  }

  const data = await res.json();
  return data.id as string;
}

async function pollUntilReady(deploymentId: string): Promise<string> {
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 4000));
    const res = await fetch(`https://api.vercel.com/v13/deployments/${deploymentId}`, {
      headers: { Authorization: `Bearer ${process.env.VERCEL_TOKEN}` },
    });
    if (!res.ok) continue;
    const data = await res.json();
    if (data.readyState === "READY") return data.url as string;
    if (data.readyState === "ERROR" || data.readyState === "CANCELED") {
      throw new Error(`Deployment failed: ${data.readyState}`);
    }
  }
  throw new Error("Deployment timed out after 2 minutes.");
}
