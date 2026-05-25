"use client";
// components/LaunchPreview.tsx
// Drop this onto any repo detail page:
//   <LaunchPreview owner="acme" repo="my-old-app" />

import { useState, useRef, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Stage = "idle" | "analyzing" | "fixing" | "deploying" | "live" | "error";

interface TerminalEntry {
  id: number;
  text: string;
  color: string;
}

interface Props {
  owner: string;   // GitHub username / org
  repo: string;    // repository name
}

// ─── Stage config ─────────────────────────────────────────────────────────────

const STAGE_META: Record<Stage, { label: string; icon: string; color: string }> = {
  idle:      { label: "Launch Preview",             icon: "🚀", color: "#00ff88" },
  analyzing: { label: "Analyzing dependencies",     icon: "🔍", color: "#00cfff" },
  fixing:    { label: "Fixing deprecated packages", icon: "🔧", color: "#ffaa00" },
  deploying: { label: "Deploying to Vercel",        icon: "⚡", color: "#bf5fff" },
  live:      { label: "Preview is live!",           icon: "✅", color: "#00ff88" },
  error:     { label: "Something went wrong",       icon: "⚠️", color: "#ff4466" },
};

const STAGE_PROGRESS: Record<Stage, number> = {
  idle: 0, analyzing: 15, fixing: 40, deploying: 70, live: 100, error: 0,
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function LaunchPreview({ owner, repo }: Props) {
  const [stage, setStage]           = useState<Stage>("idle");
  const [progress, setProgress]     = useState(0);
  const [lines, setLines]           = useState<TerminalEntry[]>([]);
  const [liveUrl, setLiveUrl]       = useState<string | null>(null);
  const [copied, setCopied]         = useState(false);
  const terminalRef                 = useRef<HTMLDivElement>(null);
  const lineIdRef                   = useRef(0);

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [lines]);

  const addLine = (text: string, color = "#888") => {
    setLines((prev) => [
      ...prev,
      { id: lineIdRef.current++, text, color },
    ]);
  };

  const reset = () => {
    setStage("idle");
    setProgress(0);
    setLines([]);
    setLiveUrl(null);
  };

  // ── Launch ──────────────────────────────────────────────────────────────────

  const launch = async () => {
    if (stage !== "idle" && stage !== "error" && stage !== "live") return;

    reset();
    // Give state a tick to flush before we start adding lines
    await new Promise((r) => setTimeout(r, 50));

    addLine(`Connecting to ${owner}/${repo}…`, "#555");

    let res: Response;
    try {
      res = await fetch("/api/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner, repo }),
      });
    } catch (err: any) {
      setStage("error");
      addLine(`Network error: ${err.message}`, "#ff4466");
      return;
    }

    if (!res.ok) {
      setStage("error");
      addLine(`Server error: ${res.status}`, "#ff4466");
      return;
    }

    // ── Read SSE stream ────────────────────────────────────────────────────────
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // SSE lines look like: "data: {...}\n\n"
      const parts = buffer.split("\n\n");
      buffer = parts.pop() ?? "";

      for (const part of parts) {
        const line = part.replace(/^data: /, "").trim();
        if (!line) continue;

        let event: { stage: Stage; message?: string; url?: string };
        try {
          event = JSON.parse(line);
        } catch {
          continue;
        }

        const meta = STAGE_META[event.stage];
        setStage(event.stage);
        setProgress(STAGE_PROGRESS[event.stage]);

        if (event.message) {
          addLine(event.message, meta.color);
        }

        if (event.stage === "live" && event.url) {
          setLiveUrl(event.url);
          addLine(`→ ${event.url}`, "#00ff88");
        }
      }
    }
  };

  // ── Copy URL ───────────────────────────────────────────────────────────────

  const copyUrl = () => {
    if (!liveUrl) return;
    navigator.clipboard?.writeText(liveUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Derived ────────────────────────────────────────────────────────────────

  const meta      = STAGE_META[stage];
  const isRunning = ["analyzing", "fixing", "deploying"].includes(stage);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=Syne:wght@600;700&display=swap');

        @keyframes ping {
          75%, 100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes glow-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.55; }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes progress-glow {
          0%,100% { box-shadow: 0 0 6px var(--bar-color); }
          50%      { box-shadow: 0 0 14px var(--bar-color); }
        }

        .lp-card {
          background: #0d0d0f;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px;
          padding: 20px;
          width: 100%;
          max-width: 400px;
          position: relative;
          overflow: hidden;
        }
        .lp-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(0,255,136,0.45), transparent);
        }

        .lp-btn {
          all: unset;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          box-sizing: border-box;
          padding: 13px 20px;
          border-radius: 8px;
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          transition: all 0.2s ease;
          border: 1px solid transparent;
          position: relative;
          overflow: hidden;
        }
        .lp-btn:disabled { cursor: default; }
        .lp-btn::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent);
          background-size: 200% 100%;
          opacity: 0;
          transition: opacity 0.3s;
        }
        .lp-btn:hover:not(:disabled)::after {
          opacity: 1;
          animation: shimmer 1.4s ease infinite;
        }

        .lp-btn-idle {
          background: linear-gradient(135deg, rgba(0,255,136,0.12), rgba(0,255,136,0.06));
          border-color: rgba(0,255,136,0.35);
          color: #00ff88;
        }
        .lp-btn-idle:hover {
          background: linear-gradient(135deg, rgba(0,255,136,0.2), rgba(0,255,136,0.1));
          border-color: rgba(0,255,136,0.6);
          box-shadow: 0 0 20px rgba(0,255,136,0.18);
          transform: translateY(-1px);
        }
        .lp-btn-running {
          background: rgba(255,255,255,0.03);
          border-color: rgba(255,255,255,0.07);
          color: #555;
          animation: glow-pulse 2s ease infinite;
        }
        .lp-btn-live {
          background: linear-gradient(135deg, rgba(0,255,136,0.16), rgba(0,207,255,0.08));
          border-color: rgba(0,255,136,0.45);
          color: #00ff88;
        }
        .lp-btn-live:hover {
          border-color: rgba(0,255,136,0.7);
          box-shadow: 0 0 18px rgba(0,255,136,0.15);
          transform: translateY(-1px);
        }
        .lp-btn-error {
          background: linear-gradient(135deg, rgba(255,68,102,0.12), rgba(255,68,102,0.06));
          border-color: rgba(255,68,102,0.35);
          color: #ff4466;
        }
        .lp-btn-error:hover {
          border-color: rgba(255,68,102,0.6);
        }

        .lp-terminal {
          background: #080808;
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 8px;
          padding: 12px 14px;
          margin-top: 14px;
          max-height: 140px;
          overflow-y: auto;
          animation: slide-up 0.3s ease;
          scrollbar-width: none;
        }
        .lp-terminal::-webkit-scrollbar { display: none; }

        .lp-terminal-line {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          line-height: 1.65;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          animation: slide-up 0.25s ease;
        }

        .lp-url-bar {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(0,255,136,0.05);
          border: 1px solid rgba(0,255,136,0.18);
          border-radius: 8px;
          padding: 10px 14px;
          margin-top: 12px;
          animation: slide-up 0.4s ease;
        }

        .lp-dot-pulse {
          position: relative;
          width: 8px; height: 8px;
          flex-shrink: 0;
        }
        .lp-dot-pulse span:first-child {
          position: absolute; inset: 0;
          border-radius: 50%;
          animation: ping 1.3s cubic-bezier(0,0,0.2,1) infinite;
        }
        .lp-dot-pulse span:last-child {
          position: relative; display: block;
          width: 8px; height: 8px;
          border-radius: 50%;
        }

        .lp-progress-track {
          width: 100%;
          height: 2px;
          background: rgba(255,255,255,0.05);
          border-radius: 2px;
          overflow: hidden;
          margin-top: 12px;
        }
        .lp-progress-bar {
          height: 100%;
          border-radius: 2px;
          transition: width 0.5s ease, background-color 0.3s ease;
          animation: progress-glow 1.8s ease infinite;
        }
      `}</style>

      <div className="lp-card">
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
          <div>
            <div style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: "11px",
              fontWeight: 700,
              color: "#444",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: "4px",
            }}>
              Ephemeral Preview
            </div>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "12px",
              color: "#00cfff",
              display: "flex", alignItems: "center", gap: "6px",
            }}>
              <span style={{ color: "#333" }}>⌥</span>
              {owner}/{repo}
            </div>
          </div>

          {(stage === "live" || stage === "error") && (
            <button
              onClick={reset}
              style={{
                all: "unset", cursor: "pointer",
                fontFamily: "monospace", fontSize: "10px",
                color: "#333", padding: "3px 8px",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "4px", transition: "color 0.2s",
              }}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#777")}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "#333")}
            >
              reset
            </button>
          )}
        </div>

        {/* Pulsing stage label when running */}
        {isRunning && (
          <div style={{
            display: "flex", alignItems: "center", gap: "8px",
            marginBottom: "12px",
            animation: "slide-up 0.3s ease",
          }}>
            <div className="lp-dot-pulse">
              <span style={{ background: meta.color }} />
              <span style={{ background: meta.color }} />
            </div>
            <span style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: "11px",
              fontWeight: 700,
              color: meta.color,
              letterSpacing: "0.05em",
            }}>
              {meta.label}…
            </span>
          </div>
        )}

        {/* Main button */}
        <button
          className={`lp-btn lp-btn-${isRunning ? "running" : stage === "live" ? "live" : stage === "error" ? "error" : "idle"}`}
          onClick={launch}
          disabled={isRunning}
        >
          <span style={{ fontSize: "15px" }}>{meta.icon}</span>
          {stage === "live" ? "Relaunch Preview" : meta.label}
          {isRunning && (
            <span style={{ marginLeft: "auto", fontFamily: "monospace", fontSize: "11px", color: "#444" }}>
              {progress}%
            </span>
          )}
        </button>

        {/* Progress bar */}
        {(isRunning || stage === "live") && (
          <div className="lp-progress-track">
            <div
              className="lp-progress-bar"
              style={{
                width: `${progress}%`,
                background: `linear-gradient(90deg, ${meta.color}66, ${meta.color})`,
                // @ts-ignore
                "--bar-color": meta.color,
              }}
            />
          </div>
        )}

        {/* Terminal output */}
        {lines.length > 0 && (
          <div className="lp-terminal" ref={terminalRef}>
            {lines.map((line) => (
              <div key={line.id} className="lp-terminal-line" style={{ color: line.color }}>
                <span style={{ color: "#333", marginRight: "8px" }}>$</span>
                {line.text}
              </div>
            ))}
          </div>
        )}

        {/* Live URL bar */}
        {stage === "live" && liveUrl && (
          <div className="lp-url-bar">
            <div className="lp-dot-pulse">
              <span style={{ background: "#00ff88" }} />
              <span style={{ background: "#00ff88" }} />
            </div>
            <a
              href={liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontFamily: "monospace", fontSize: "11px",
                color: "#00ff88", textDecoration: "none",
                flex: 1, overflow: "hidden",
                textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}
            >
              {liveUrl}
            </a>
            <button
              onClick={copyUrl}
              style={{
                all: "unset", cursor: "pointer",
                fontFamily: "monospace", fontSize: "10px",
                color: copied ? "#00ff88" : "#333",
                padding: "3px 8px",
                border: `1px solid ${copied ? "rgba(0,255,136,0.3)" : "rgba(255,255,255,0.06)"}`,
                borderRadius: "4px",
                transition: "all 0.2s",
                flexShrink: 0,
              }}
            >
              {copied ? "copied!" : "copy"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
