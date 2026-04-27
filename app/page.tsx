"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { hasBrief, clearBrief } from "@/lib/storage";

const TITLE = "BUILDRIGHT";
const GLITCH_MAP: Record<string, string[]> = {
  B: ["8", "ß", "|3"],
  U: ["Ü", "|_|", "µ"],
  I: ["1", "!", "|"],
  L: ["|", "1", "£"],
  D: ["|)", "0", "∂"],
  R: ["|2", "®", "Я"],
  G: ["6", "&", "9"],
  H: ["|-|", "#", "|-"],
  T: ["†", "7", "+"],
};

function glitchTitle(): string {
  const chars = TITLE.split("");
  // corrupt 1–2 random characters
  const numCorrupt = Math.random() < 0.5 ? 1 : 2;
  const indices = [...Array(TITLE.length).keys()]
    .sort(() => Math.random() - 0.5)
    .slice(0, numCorrupt);
  indices.forEach((i) => {
    const options = GLITCH_MAP[chars[i]];
    if (options) chars[i] = options[Math.floor(Math.random() * options.length)];
  });
  return chars.join("");
}

export default function Home() {
  const [hasProject, setHasProject] = useState(false);
  const [tick, setTick] = useState(true);
  const [confirmReset, setConfirmReset] = useState(false);
  const [titleText, setTitleText] = useState(TITLE);

  useEffect(() => {
    setHasProject(hasBrief());
    const t = setInterval(() => setTick((v) => !v), 530);

    // glitch effect — fires every 3–7 seconds, corrupts for 100ms
    function scheduleGlitch() {
      const delay = 3000 + Math.random() * 4000;
      return setTimeout(() => {
        setTitleText(glitchTitle());
        setTimeout(() => {
          setTitleText(TITLE);
          scheduleGlitch();
        }, 80 + Math.random() * 60);
      }, delay);
    }
    const g = scheduleGlitch();

    return () => {
      clearInterval(t);
      clearTimeout(g);
    };
  }, []);

  function handleReset() {
    if (!confirmReset) {
      setConfirmReset(true);
      setTimeout(() => setConfirmReset(false), 3000);
      return;
    }
    clearBrief();
    setHasProject(false);
    setConfirmReset(false);
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-16">

      {/* Header */}
      <div className="text-center mb-10">
        <h1
          className="pixel-heading"
          style={{ color: "var(--green)", fontSize: "clamp(48px, 10vw, 96px)", lineHeight: 1 }}
        >
          {titleText}
        </h1>
        <p
          className="pixel-heading mt-3 tracking-widest"
          style={{ color: "var(--cyan)", fontSize: "18px" }}
        >
          // AI BUILDER&apos;S CO-PILOT — v1.0.0
        </p>
      </div>

      {/* Tagline — clearly a description, not an input */}
      <div className="w-full max-w-2xl mb-10 text-center">
        <p className="text-lg" style={{ color: "var(--text)", lineHeight: 1.7 }}>
          Tell BuildRight what you&apos;re building. It applies{" "}
          <span style={{ color: "var(--green)" }}>expert prompt engineering</span>{" "}
          to generate a technically precise session prompt — anchored to your
          project, your last session, and today&apos;s goal. No more wasted
          context. No more starting from scratch.
        </p>
        <p className="mt-4 text-base" style={{ color: "var(--cyan)" }}>
          // you describe it in natural language. we turn it into an expert prompt.
        </p>
        <p className="mt-3 text-base" style={{ color: "var(--green)" }}>
          &gt; ready{" "}
          <span style={{ opacity: tick ? 1 : 0 }}>█</span>
        </p>
      </div>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {hasProject ? (
          <>
            <Link
              href="/session"
              className="pixel-heading glow-btn px-8 py-3 text-lg text-center"
              style={{
                background: "var(--green)",
                color: "#000",
                border: "2px solid var(--green)",
              }}
            >
              [ START SESSION ]
            </Link>
            <Link
              href="/wizard"
              className="pixel-heading px-8 py-3 text-lg text-center glow-border"
              style={{ color: "var(--green)" }}
            >
              [ EDIT BRIEF ]
            </Link>
          </>
        ) : (
          <Link
            href="/wizard"
            className="pixel-heading glow-btn px-8 py-3 text-lg text-center"
            style={{
              background: "var(--green)",
              color: "#000",
              border: "2px solid var(--green)",
            }}
          >
            [ SETUP PROJECT ]
          </Link>
        )}
      </div>

      {/* Reset project button — only shown if they have a brief */}
      {hasProject && (
        <button
          onClick={handleReset}
          className="pixel-heading text-sm mb-12 transition-all"
          style={{ color: confirmReset ? "var(--amber)" : "var(--muted)" }}
        >
          {confirmReset
            ? "⚠ CLICK AGAIN TO CONFIRM RESET"
            : "[ START A NEW PROJECT ]"}
        </button>
      )}

      {!hasProject && <div className="mb-12" />}

      {/* How it works */}
      <div className="w-full max-w-2xl mb-12">
        <p className="pixel-heading text-xl mb-4" style={{ color: "var(--cyan)" }}>
          // HOW IT WORKS
        </p>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            {
              step: "01",
              title: "SETUP BRIEF",
              desc: "Answer 6 quick questions about your project. Saved to your browser — takes 2 minutes.",
            },
            {
              step: "02",
              title: "DESCRIBE GOAL",
              desc: "Tell BuildRight what you want to work on today. It reads your brief automatically.",
            },
            {
              step: "03",
              title: "COPY + PASTE",
              desc: "Get an expert-level prompt. Paste into Claude, ChatGPT, or Cursor and go.",
            },
          ].map((item) => (
            <div
              key={item.step}
              className="corner-box p-4"
              style={{
                background: "rgba(0,255,65,0.03)",
                border: "1px solid var(--border)",
              }}
            >
              <p className="pixel-heading text-2xl mb-2" style={{ color: "var(--green)" }}>
                {item.step}
              </p>
              <p className="pixel-heading text-lg mb-1" style={{ color: "var(--cyan)" }}>
                {item.title}
              </p>
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Connectors */}
      <div className="w-full max-w-2xl">
        <p className="pixel-heading text-xl mb-2" style={{ color: "var(--cyan)" }}>
          // SESSION CONNECTORS
        </p>
        <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
          Different prompts for every stage of your build.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: "▶", label: "START", desc: "Begin a session", href: "/session?mode=session", color: "var(--green)" },
            { icon: "⚠", label: "STUCK", desc: "Debug a problem", href: "/session?mode=stuck", color: "var(--amber)" },
            { icon: "↺", label: "RESET", desc: "Context is full", href: "/session?mode=reset", color: "var(--cyan)" },
            { icon: "■", label: "CLOSE", desc: "End a session", href: "/session?mode=close", color: "var(--muted)" },
          ].map((c) => (
            <Link
              key={c.label}
              href={c.href}
              className="pixel-heading flex flex-col gap-1 px-4 py-3 text-lg transition-all"
              style={{ border: `1px solid ${c.color}44`, color: c.color }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = `${c.color}11`;
                (e.currentTarget as HTMLElement).style.borderColor = c.color;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "transparent";
                (e.currentTarget as HTMLElement).style.borderColor = `${c.color}44`;
              }}
            >
              <span>{c.icon} {c.label}</span>
              <span className="text-xs font-sans" style={{ color: "var(--muted)", fontFamily: "'Share Tech Mono'" }}>
                {c.desc}
              </span>
            </Link>
          ))}
        </div>
      </div>

      <p className="mt-16 text-sm text-center" style={{ color: "var(--muted)" }}>
        // DATA STORED LOCALLY — NOTHING SENT TO SERVER
      </p>
    </main>
  );
}
