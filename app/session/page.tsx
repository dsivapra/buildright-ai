"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { loadBrief, saveBrief, clearBrief, ProjectBrief } from "@/lib/storage";
import {
  generateSessionPrompt,
  generateStuckPrompt,
  generateResetPrompt,
  generateClosePrompt,
} from "@/lib/prompt";
import { cleanBrief, cleanGoalInput } from "@/lib/clean";

type Mode = "session" | "stuck" | "reset" | "close";

const MODES: {
  id: Mode;
  icon: string;
  label: string;
  color: string;
  inputLabel: string;
  inputPlaceholder: string;
  needsInput: boolean;
  noInputMsg: string;
}[] = [
  {
    id: "session",
    icon: "▶",
    label: "START SESSION",
    color: "var(--green)",
    inputLabel: "> what do you want to work on today?",
    inputPlaceholder: "e.g. add the login page, fix the nav bug, write homepage copy...",
    needsInput: true,
    noInputMsg: "",
  },
  {
    id: "stuck",
    icon: "⚠",
    label: "I'M STUCK",
    color: "var(--amber)",
    inputLabel: "> describe what's not working",
    inputPlaceholder: "e.g. my form isn't submitting, the button does nothing when clicked...",
    needsInput: true,
    noInputMsg: "",
  },
  {
    id: "reset",
    icon: "↺",
    label: "RESET CONTEXT",
    color: "var(--cyan)",
    inputLabel: "",
    inputPlaceholder: "",
    needsInput: false,
    noInputMsg:
      "> context window full. generating reset prompt — re-anchors your session with full project context. no input needed.",
  },
  {
    id: "close",
    icon: "■",
    label: "CLOSE SESSION",
    color: "var(--muted)",
    inputLabel: "",
    inputPlaceholder: "",
    needsInput: false,
    noInputMsg:
      "> generating session close prompt. paste into ai — it will write a summary you can save for next time.",
  },
];

function SessionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const paramMode = (searchParams.get("mode") as Mode) || "session";

  const [mode, setMode] = useState<Mode>(paramMode);
  const [brief, setBrief] = useState<ProjectBrief | null>(null);
  const [input, setInput] = useState("");
  const [prompt, setPrompt] = useState("");
  const [copied, setCopied] = useState(false);
  const [lastSessionInput, setLastSessionInput] = useState("");
  const [showLastSession, setShowLastSession] = useState(false);
  const [tick, setTick] = useState(true);
  const [cleanWarnings, setCleanWarnings] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    setBrief(loadBrief());
    const t = setInterval(() => setTick((v) => !v), 530);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    setMode(paramMode);
    setPrompt("");
    setInput("");
    setCopied(false);
  }, [paramMode]);

  const currentMode = MODES.find((m) => m.id === mode)!;

  function handleNewProject() {
    if (!confirmReset) {
      setConfirmReset(true);
      setTimeout(() => setConfirmReset(false), 3000);
      return;
    }
    clearBrief();
    window.location.href = "/wizard";
  }

  async function generate() {
    if (!brief) return;
    setLoading(true);
    setPrompt("");

    // merge last session if provided
    const rawBrief = lastSessionInput.trim()
      ? { ...brief, lastSessionSummary: lastSessionInput.trim() }
      : brief;

    // clean + validate brief
    const { brief: cleaned, warnings } = cleanBrief(rawBrief);
    setCleanWarnings(warnings);

    // save cleaned version back
    saveBrief(cleaned);
    setBrief(cleaned);

    const cleanedInput = cleanGoalInput(input);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief: cleaned, todayGoal: cleanedInput, mode }),
      });
      const data = await res.json();
      if (data.prompt) {
        setPrompt(data.prompt);
      } else {
        setPrompt("// ERROR: Could not generate prompt. Check your API key.");
      }
    } catch {
      setPrompt("// ERROR: Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }

  async function copyPrompt() {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const canGenerate = !currentMode.needsInput || input.trim().length > 0;

  return (
    <main className="min-h-screen flex flex-col px-8 py-12 max-w-3xl mx-auto w-full">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Link
          href="/"
          className="pixel-heading text-lg"
          style={{ color: "var(--muted)" }}
        >
          &lt; BUILDRIGHT
        </Link>
        <div className="flex items-center gap-3">
          {brief ? (
            <span
              className="text-sm px-3 py-1"
              style={{
                border: "1px solid var(--border)",
                color: "var(--green)",
                background: "rgba(0,255,65,0.05)",
              }}
            >
              📁 {brief.projectName?.toUpperCase() || "UNTITLED"}
            </span>
          ) : (
            <Link
              href="/wizard"
              className="pixel-heading text-sm px-3 py-1"
              style={{
                border: "1px solid var(--green)",
                color: "var(--green)",
                background: "rgba(0,255,65,0.05)",
              }}
            >
              + SETUP BRIEF
            </Link>
          )}
          {brief && (
            <button
              onClick={handleNewProject}
              className="pixel-heading text-sm px-3 py-1 transition-all"
              style={{
                border: `1px solid ${confirmReset ? "var(--amber)" : "var(--muted)"}`,
                color: confirmReset ? "var(--amber)" : "var(--muted)",
              }}
            >
              {confirmReset ? "CONFIRM?" : "NEW PROJECT"}
            </button>
          )}
        </div>
      </div>

      {/* Title */}
      <p
        className="pixel-heading text-4xl mb-8 flicker"
        style={{ color: "var(--green)" }}
      >
        // SESSION CONNECTOR
        <span style={{ opacity: tick ? 1 : 0 }}> █</span>
      </p>

      {/* Mode tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => {
              setMode(m.id);
              setPrompt("");
              setInput("");
              setCopied(false);
              router.replace(`/session?mode=${m.id}`);
            }}
            className="pixel-heading px-5 py-3 text-lg transition-all"
            style={{
              border: `1px solid ${mode === m.id ? m.color : m.color + "44"}`,
              color: mode === m.id ? "#000" : m.color,
              background: mode === m.id ? m.color : "transparent",
            }}
          >
            {m.icon} {m.label}
          </button>
        ))}
      </div>

      {/* Input card */}
      <div
        className="corner-box p-6 mb-4"
        style={{
          background: "rgba(0,255,65,0.02)",
          border: "1px solid var(--border)",
        }}
      >
        {/* Last session toggle */}
        {mode === "session" && (
          <div className="mb-4">
            <button
              onClick={() => setShowLastSession((v) => !v)}
              className="text-base mb-2 flex items-center gap-1"
              style={{ color: "var(--muted)" }}
            >
              {showLastSession ? "▾" : "▸"} LAST SESSION SUMMARY (OPTIONAL)
            </button>
            {showLastSession && (
              <textarea
                rows={3}
                value={lastSessionInput}
                onChange={(e) => setLastSessionInput(e.target.value)}
                placeholder="what did you accomplish last session? what's unfinished?"
                className="w-full px-4 py-3 text-base resize-none"
                style={{
                  background: "rgba(0,0,0,0.4)",
                  border: "1px solid var(--border)",
                  color: "var(--text)",
                  outline: "none",
                }}
                onFocus={(e) => (e.target.style.borderColor = "var(--green)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
              />
            )}
          </div>
        )}

        {/* Main input */}
        {currentMode.needsInput ? (
          <div>
            <label
              className="block text-lg mb-3"
              style={{ color: "var(--muted)" }}
            >
              {currentMode.inputLabel}
            </label>
            <textarea
              autoFocus
              rows={3}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={currentMode.inputPlaceholder}
              className="w-full px-4 py-3 text-sm resize-none"
              style={{
                background: "rgba(0,0,0,0.4)",
                border: "1px solid var(--border)",
                color: "var(--text)",
                outline: "none",
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--green)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
          </div>
        ) : (
          <p className="text-lg" style={{ color: "var(--muted)" }}>
            {currentMode.noInputMsg}
          </p>
        )}

        <button
          onClick={generate}
          disabled={!canGenerate || loading}
          className="pixel-heading mt-6 w-full px-5 py-4 text-xl disabled:opacity-30 transition-all"
          style={{
            background: canGenerate && !loading ? currentMode.color : "transparent",
            color: canGenerate && !loading ? "#000" : currentMode.color,
            border: `2px solid ${currentMode.color}`,
          }}
        >
          {loading ? "GENERATING..." : "GENERATE PROMPT >"}
        </button>
      </div>

      {/* Warnings */}
      {cleanWarnings.length > 0 && (
        <div
          className="mb-4 p-4"
          style={{
            border: "1px solid var(--amber)",
            background: "rgba(255,176,0,0.05)",
          }}
        >
          <p className="pixel-heading text-lg mb-2" style={{ color: "var(--amber)" }}>
            ⚠ WEAK INPUTS DETECTED — PROMPT MAY BE GENERIC
          </p>
          {cleanWarnings.map((w, i) => (
            <p key={i} className="text-base" style={{ color: "var(--amber)" }}>
              › {w}{" "}
              <Link href="/wizard" style={{ textDecoration: "underline" }}>
                Fix in brief →
              </Link>
            </p>
          ))}
        </div>
      )}

      {/* Output */}
      {prompt && (
        <div
          className="corner-box p-6"
          style={{
            background: "rgba(0,255,65,0.02)",
            border: "1px solid var(--green)",
            boxShadow: "0 0 20px rgba(0,255,65,0.1)",
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <span
              className="pixel-heading text-2xl"
              style={{ color: "var(--green)" }}
            >
              // OUTPUT PROMPT
            </span>
            <button
              onClick={copyPrompt}
              className="pixel-heading px-5 py-2 text-lg transition-all"
              style={{
                background: copied ? "var(--green)" : "transparent",
                color: copied ? "#000" : "var(--green)",
                border: "1px solid var(--green)",
              }}
            >
              {copied ? "✓ COPIED" : "[ COPY ]"}
            </button>
          </div>
          <pre
            className="text-base leading-relaxed whitespace-pre-wrap"
            style={{ color: "var(--text)", fontFamily: "'Share Tech Mono', monospace" }}
          >
            {prompt}
          </pre>
        </div>
      )}

      {/* No brief warning */}
      {!brief && (
        <div
          className="mt-4 p-4 text-base"
          style={{
            border: "1px solid var(--amber)",
            color: "var(--amber)",
            background: "rgba(255,176,0,0.05)",
          }}
        >
          ⚠ NO PROJECT BRIEF FOUND — PROMPTS WILL BE GENERIC.{" "}
          <Link href="/wizard" style={{ textDecoration: "underline" }}>
            SETUP IN 2 MIN →
          </Link>
        </div>
      )}
    </main>
  );
}

export default function SessionPage() {
  return (
    <Suspense>
      <SessionContent />
    </Suspense>
  );
}
