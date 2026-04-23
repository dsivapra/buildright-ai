"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { saveBrief, loadBrief, ProjectBrief } from "@/lib/storage";

const STEPS = [
  {
    id: "projectName",
    label: "WHAT ARE YOU BUILDING?",
    hint: "> give your project a name",
    placeholder: "e.g. my portfolio site, a booking app...",
    type: "input",
  },
  {
    id: "description",
    label: "DESCRIBE IT",
    hint: "> what does it do? what problem does it solve?",
    placeholder: "e.g. a tool that helps freelancers send invoices without accounting software...",
    type: "textarea",
  },
  {
    id: "targetUser",
    label: "WHO IS IT FOR?",
    hint: "> describe your target user",
    placeholder: "e.g. non-technical small business owners...",
    type: "input",
  },
  {
    id: "aiTools",
    label: "WHICH AI TOOLS?",
    hint: "> claude, chatgpt, cursor, lovable, bolt...",
    placeholder: "e.g. claude and cursor...",
    type: "input",
  },
  {
    id: "techStack",
    label: "TECH STACK?",
    hint: "> no-code counts. not sure? just say so.",
    placeholder: "e.g. next.js + supabase, webflow + zapier, don't know yet...",
    type: "input",
  },
  {
    id: "successLooksLike",
    label: "WHAT DOES SUCCESS LOOK LIKE?",
    hint: "> when is version 1 done?",
    placeholder: "e.g. a working landing page that collects emails by friday...",
    type: "textarea",
  },
  {
    id: "constraints",
    label: "ANY CONSTRAINTS?",
    hint: "> budget, timeline, things to avoid",
    placeholder: "e.g. no paid apis, ship by end of week, keep it simple...",
    type: "textarea",
  },
] as const;

type StepId = (typeof STEPS)[number]["id"];

const emptyBrief: ProjectBrief = {
  projectName: "",
  description: "",
  targetUser: "",
  aiTools: "",
  techStack: "",
  successLooksLike: "",
  constraints: "",
  lastSessionSummary: "",
};

export default function WizardPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<ProjectBrief>(emptyBrief);
  const [saving, setSaving] = useState(false);
  const [tick, setTick] = useState(true);

  useEffect(() => {
    const existing = loadBrief();
    if (existing) setForm(existing);
    const t = setInterval(() => setTick((v) => !v), 530);
    return () => clearInterval(t);
  }, []);

  const current = STEPS[step];
  const value = form[current.id as StepId];
  const isLast = step === STEPS.length - 1;
  const progress = ((step + 1) / STEPS.length) * 100;

  function handleChange(val: string) {
    setForm((prev) => ({ ...prev, [current.id]: val }));
  }

  function handleNext() {
    if (isLast) {
      setSaving(true);
      saveBrief(form);
      setTimeout(() => router.push("/session"), 300);
    } else {
      setStep((s) => s + 1);
    }
  }

  function handleBack() {
    if (step > 0) setStep((s) => s - 1);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && current.type === "input") {
      e.preventDefault();
      if (value.trim()) handleNext();
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-16">

      {/* Back to home */}
      <div className="w-full max-w-xl mb-6">
        <Link
          href="/"
          className="pixel-heading text-base"
          style={{ color: "var(--muted)" }}
        >
          &lt; BUILDRIGHT
        </Link>
      </div>

      {/* Title */}
      <p
        className="pixel-heading text-4xl mb-8 flicker"
        style={{ color: "var(--green)" }}
      >
        // PROJECT BRIEF SETUP
      </p>

      {/* Progress */}
      <div className="w-full max-w-xl mb-8">
        <div className="flex justify-between mb-2">
          <span className="text-sm" style={{ color: "var(--muted)" }}>
            STEP_{String(step + 1).padStart(2, "0")} / {STEPS.length}
          </span>
          <span className="text-sm" style={{ color: "var(--muted)" }}>
            {Math.round(progress)}% COMPLETE
          </span>
        </div>
        <div
          className="h-1 w-full"
          style={{ background: "var(--dim)" }}
        >
          <div
            className="h-full progress-bar transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Card */}
      <div
        className="corner-box w-full max-w-xl p-10"
        style={{
          background: "rgba(0,255,65,0.03)",
          border: "1px solid var(--border)",
        }}
      >
        <p className="text-lg mb-3" style={{ color: "var(--muted)" }}>
          {current.hint}
        </p>
        <h2
          className="pixel-heading text-5xl mb-8"
          style={{ color: "var(--green)" }}
        >
          {current.label}
          <span
            className="ml-1"
            style={{ opacity: tick ? 1 : 0, color: "var(--green)" }}
          >
            █
          </span>
        </h2>

        {current.type === "textarea" ? (
          <textarea
            autoFocus
            rows={4}
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={current.placeholder}
            className="w-full px-4 py-4 text-lg resize-none"
            style={{
              background: "rgba(0,0,0,0.4)",
              border: "1px solid var(--border)",
              color: "var(--text)",
              outline: "none",
            }}
            onFocus={(e) =>
              (e.target.style.borderColor = "var(--green)")
            }
            onBlur={(e) =>
              (e.target.style.borderColor = "var(--border)")
            }
          />
        ) : (
          <input
            autoFocus
            type="text"
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={current.placeholder}
            className="w-full px-4 py-4 text-lg"
            style={{
              background: "rgba(0,0,0,0.4)",
              border: "1px solid var(--border)",
              color: "var(--text)",
              outline: "none",
            }}
            onFocus={(e) =>
              (e.target.style.borderColor = "var(--green)")
            }
            onBlur={(e) =>
              (e.target.style.borderColor = "var(--border)")
            }
          />
        )}

        <div className="flex items-center justify-between mt-8">
          <button
            onClick={handleBack}
            disabled={step === 0}
            className="pixel-heading text-lg disabled:opacity-20 transition-colors"
            style={{ color: "var(--muted)" }}
            onMouseEnter={(e) =>
              ((e.target as HTMLElement).style.color = "var(--green)")
            }
            onMouseLeave={(e) =>
              ((e.target as HTMLElement).style.color = "var(--muted)")
            }
          >
            &lt; BACK
          </button>
          <button
            onClick={handleNext}
            disabled={!value.trim() || saving}
            className="pixel-heading px-8 py-3 text-xl disabled:opacity-30 transition-all glow-btn"
            style={{
              background: "var(--green)",
              color: "#000",
              border: "2px solid var(--green)",
            }}
          >
            {saving ? "SAVING..." : isLast ? "BUILD BRIEF >" : "NEXT >"}
          </button>
        </div>
      </div>

      <p className="mt-6 text-base" style={{ color: "var(--muted)" }}>
        // PRESS ENTER TO ADVANCE ON SHORT FIELDS
      </p>
    </main>
  );
}
