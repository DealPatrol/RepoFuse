// app/api/preview/route.ts
// Ephemeral Preview feature — streams progress back to the client via SSE
// Stages: analyzing → fixing → deploying → live

import { NextRequest } from "next/server";
import { getCurrentAccessToken } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";

function getAnthropic() { return new Anthropic() }

// ─── Types ────────────────────────────────────────────────────────────────────

interface GitHubFile {
  path: string;
  content: string;       // decoded string (not base64)
  encoding?: string;
}

interface SSEEvent {
  stage: "analyzing" | "fixing" | "deploying" | "live" | "error";
  message?: string;
  url?: string;
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // 1. Auth — grab the GitHub access token from cookies
  const accessToken = await getCurrentAccessToken();
  if (!accessToken) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { owner, repo } = await req.json();
  if (!owner || !repo) {
    return new Response("Missing owner or repo", { status: 400 });
  }

  const encoder = new TextEncoder();

  // 2. Build a Server-Sent Events stream
  const stream = new ReadableStream({
    async start(controller) {
      // Helper: push an SSE event to the client
      const send = (event: SSEEvent) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
        );
      };

      try {
        // ── STAGE 1: ANALYZE ──────────────────────────────────────────────────
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

        const { fixedPackageJson, changes } = await fixDependencies(
          packageJsonFile.content
        );

        // Stream each change to the terminal
        for (const change of changes) {
          send({ stage: "fixing", message: change });
        }

        if (changes.length === 0) {
          send({ stage: "fixing", message: "All dependencies look healthy ✓" });
        }

        // ── STAGE 3: DEPLOY TO VERCEL ─────────────────────────────────────────
        send({ stage: "deploying", message: "Preparing files for deployment…" });

        // Replace package.json with the fixed version; keep everything else
        const deployFiles = buildDeployFiles(files, fixedPackageJson);

        send({ stage: "deploying", message: "Pushing to Vercel API…" });

        const framework = detectFramework(fixedPackageJson);
        const deploymentName = `repofuse-${repo.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;

        const deploymentId = await createVercelDeployment(
          deploymentName,
          deployFiles,
          framework
        );

        send({ stage: "deploying", message: "Building project on Vercel…" });

        // Poll until the deployment is ready (up to ~90 seconds)
        const previewUrl = await pollUntilReady(deploymentId);

        // ── LIVE ──────────────────────────────────────────────────────────────
        send({ stage: "live", url: `https://${previewUrl}` });

      } catch (err: any) {
        console.error("[preview] Error:", err);
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

/**
 * Fetches a flat list of text files from a GitHub repo.
 * Skips binaries, node_modules, .git, and files over 100 KB.
 * Reuses your existing lib/github.ts pattern.
 */
async function fetchRepoFiles(
  owner: string,
  repo: string,
  token: string
): Promise<GitHubFile[]> {
  // Get the default branch's tree (recursive)
  const treeRes = await ghFetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`,
    token
  );
  const tree = await treeRes.json();

  const SKIP = ["node_modules", ".git", "dist", "build", ".next", "coverage"];
  const TEXT_EXTS = [
    ".ts", ".tsx", ".js", ".jsx", ".json", ".css", ".scss",
    ".html", ".md", ".env.example", ".gitignore", "Dockerfile",
  ];

  const textFiles = (tree.tree ?? []).filter((item: any) => {
    if (item.type !== "blob") return false;
    if (SKIP.some((s) => item.path.includes(s))) return false;
    if (item.size > 100_000) return false; // skip large files
    const ext = "." + item.path.split(".").pop();
    return TEXT_EXTS.includes(ext) || item.path.includes("package.json");
  });

  // Fetch up to 80 files in parallel (Vercel limit)
  const sliced = textFiles.slice(0, 80);

  const results = await Promise.allSettled(
    sliced.map(async (item: any) => {
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
    },
  });
}

// ─── Claude dep-fixer ────────────────────────────────────────────────────────

interface FixResult {
  fixedPackageJson: Record<string, any>;
  changes: string[];
}

async function fixDependencies(rawPackageJson: string): Promise<FixResult> {
  let parsed: Record<string, any>;
  try {
    parsed = JSON.parse(rawPackageJson);
  } catch {
    return { fixedPackageJson: {}, changes: ["Could not parse package.json"] };
  }

  const response = await getAnthropic().messages.create({
    model: "claude-opus-4-5",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `You are a Node.js expert. Analyze this package.json and fix any deprecated, broken, insecure, or unmaintained dependencies. Update them to the latest stable versions.

Return ONLY a raw JSON object (no markdown fences, no explanation) with exactly two keys:
- "packageJson": the complete fixed package.json as a JSON object
- "changes": an array of short human-readable strings like "react-scripts → vite@5.2.0" describing each change. Empty array if nothing needed fixing.

package.json:
${JSON.stringify(parsed, null, 2)}`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "{}";

  try {
    const clean = text.replace(/```json|```/g, "").trim();
    const result = JSON.parse(clean);
    return {
      fixedPackageJson: result.packageJson ?? parsed,
      changes: Array.isArray(result.changes) ? result.changes : [],
    };
  } catch {
    // If Claude's response can't be parsed, return original unchanged
    return { fixedPackageJson: parsed, changes: [] };
  }
}

// ─── Vercel helpers ───────────────────────────────────────────────────────────

function buildDeployFiles(
  files: GitHubFile[],
  fixedPackageJson: Record<string, any>
) {
  return files.map((f) => ({
    file: f.path,
    data:
      f.path === "package.json"
        ? JSON.stringify(fixedPackageJson, null, 2)
        : f.content,
  }));
}

function detectFramework(pkg: Record<string, any>): string | null {
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  if (deps["next"]) return "nextjs";
  if (deps["react-scripts"]) return "create-react-app";
  if (deps["vite"]) return "vite";
  if (deps["@remix-run/node"]) return "remix";
  if (deps["nuxt"]) return "nuxtjs";
  if (deps["@sveltejs/kit"]) return "sveltekit";
  if (deps["astro"]) return "astro";
  return null;
}

async function createVercelDeployment(
  name: string,
  files: { file: string; data: string }[],
  framework: string | null
): Promise<string> {
  const body: Record<string, any> = {
    name,
    files,
    target: "preview",
    projectSettings: {},
  };

  if (framework) {
    body.projectSettings.framework = framework;
  }

  // Add team if configured
  const url = process.env.VERCEL_TEAM_ID
    ? `https://api.vercel.com/v13/deployments?teamId=${process.env.VERCEL_TEAM_ID}`
    : "https://api.vercel.com/v13/deployments";

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
    throw new Error(
      err?.error?.message ?? `Vercel API error: ${res.status}`
    );
  }

  const data = await res.json();
  return data.id as string;
}

/**
 * Polls the Vercel deployment endpoint every 4 seconds until READY or ERROR.
 * Times out after 30 attempts (~2 minutes).
 */
async function pollUntilReady(deploymentId: string): Promise<string> {
  const MAX_ATTEMPTS = 30;
  const INTERVAL_MS = 4000;

  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    await new Promise((r) => setTimeout(r, INTERVAL_MS));

    const res = await fetch(
      `https://api.vercel.com/v13/deployments/${deploymentId}`,
      {
        headers: { Authorization: `Bearer ${process.env.VERCEL_TOKEN}` },
      }
    );

    if (!res.ok) continue;

    const data = await res.json();

    if (data.readyState === "READY") {
      return data.url as string; // e.g. "my-app-abc123.vercel.app"
    }

    if (data.readyState === "ERROR" || data.readyState === "CANCELED") {
      throw new Error(`Deployment failed with state: ${data.readyState}`);
    }

    // INITIALIZING or BUILDING — keep polling
  }

  throw new Error("Deployment timed out after 2 minutes.");
}
