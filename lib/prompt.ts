import { ProjectBrief } from "./storage";

export type ConnectorType = "session" | "plan" | "stuck" | "reset" | "close";

// ─── Adaptive working rules ───────────────────────────────────────────────────

function detect(str: string, keywords: string[]): boolean {
  const lower = str.toLowerCase();
  return keywords.some((k) => lower.includes(k));
}

function generateWorkingRules(brief: ProjectBrief): string[] {
  const stack = brief.techStack?.toLowerCase() || "";
  const tools = brief.aiTools?.toLowerCase() || "";
  const constraints = brief.constraints?.toLowerCase() || "";
  const description = brief.description?.toLowerCase() || "";
  const goal = brief.successLooksLike?.toLowerCase() || "";
  const target = brief.targetUser?.toLowerCase() || "";

  const rules: string[] = [];

  // ── Code vs no-code ──────────────────────────────────────────────────────
  const isNoCode = detect(stack, [
    "webflow", "wix", "squarespace", "framer", "bubble", "glide",
    "zapier", "notion", "airtable", "carrd", "typedream", "no-code", "no code",
  ]);

  const isLowTech = detect(stack, ["not sure", "don't know", "unsure", "tbd"]) ||
    stack.length < 4;

  const usesEditor = detect(tools, ["cursor", "windsurf", "cline", "copilot"]);
  const usesPromptBuilder = detect(tools, ["lovable", "bolt", "v0", "replit"]);

  if (isNoCode) {
    rules.push("- I'm using no-code tools — do not write raw code. Give me step-by-step instructions I can follow in the UI.");
  } else if (usesEditor) {
    rules.push("- Format all code in blocks ready to copy directly into my editor.");
    rules.push("- One change at a time — tell me exactly which file and line to update.");
  } else if (usesPromptBuilder) {
    rules.push(`- I'm building with ${brief.aiTools} — give me prompts I can paste into it, not raw code.`);
  } else if (isLowTech) {
    rules.push("- Keep solutions simple. Explain any technical terms in plain language.");
    rules.push("- If there's a no-code or low-code option, suggest it first.");
  }

  // ── Speed vs quality ─────────────────────────────────────────────────────
  const wantsSpeed = detect(constraints, [
    "fast", "quick", "asap", "this week", "today", "immediately", "urgent", "ship",
  ]) || detect(goal, ["fast", "quick", "asap", "this week", "today"]);

  const wantsPolish = detect(description, [
    "portfolio", "landing page", "showcase", "recruiter", "hiring",
  ]) || detect(target, ["recruiter", "hiring manager", "client"]);

  if (wantsSpeed) {
    rules.push("- Prioritise speed over perfection. Give me the fastest working solution first.");
  }

  if (wantsPolish) {
    rules.push("- Focus on presentation and visual polish — this needs to impress people.");
  }

  // ── Budget ───────────────────────────────────────────────────────────────
  const isBootstrapped = detect(constraints, [
    "free", "zero budget", "no budget", "no paid", "no cost", "cheap",
  ]);

  if (isBootstrapped) {
    rules.push("- Only suggest free tools and solutions. Flag anything that costs money before recommending it.");
  }

  // ── Project type specific ─────────────────────────────────────────────────
  const isDebugging = detect(description, ["fix", "debug", "broken", "error", "bug"]) ||
    detect(goal, ["fix", "debug"]);

  const isLearning = detect(constraints, ["learn", "understand", "teach"]) ||
    detect(goal, ["learn", "understand"]);

  const isContent = detect(description, [
    "blog", "newsletter", "content", "copy", "writing", "article",
  ]);

  const isEcommerce = detect(description, [
    "shop", "store", "ecommerce", "e-commerce", "sell", "product", "checkout",
  ]);

  if (isDebugging) {
    rules.push("- Focus only on the specific problem. Do not rewrite unrelated parts of the project.");
  }

  if (isLearning) {
    rules.push("- Explain what you're doing and why at each step so I can understand, not just copy.");
  }

  if (isContent) {
    rules.push("- Match my voice and tone. Ask me for an example of my writing before drafting anything.");
  }

  if (isEcommerce) {
    rules.push("- Flag anything that could affect payments or user data — safety first.");
  }

  // ── Always-on rules ───────────────────────────────────────────────────────
  rules.push("- Give me one step at a time and wait for my confirmation before moving on.");
  rules.push("- If you need clarification, ask one question at a time.");
  rules.push("- If we're approaching the context limit, warn me and summarise what we've done.");

  return rules;
}

// ─── Prompt generators ────────────────────────────────────────────────────────

export function generateSessionPrompt(
  brief: ProjectBrief,
  todayGoal: string
): string {
  const lines: string[] = [];

  lines.push(`You are helping me build ${brief.projectName}.`);
  lines.push("");
  lines.push("## Project context");
  lines.push(`Goal: ${brief.description}`);
  if (brief.targetUser) lines.push(`Built for: ${brief.targetUser}`);
  if (brief.techStack) lines.push(`Stack: ${brief.techStack}`);
  if (brief.aiTools) lines.push(`AI tools I'm using: ${brief.aiTools}`);
  if (brief.successLooksLike)
    lines.push(`Success looks like: ${brief.successLooksLike}`);
  if (brief.constraints) lines.push(`Constraints: ${brief.constraints}`);

  if (brief.lastSessionSummary) {
    lines.push("");
    lines.push("## Last session");
    lines.push(brief.lastSessionSummary);
  }

  lines.push("");
  lines.push("## Today's goal");
  lines.push(todayGoal);

  lines.push("");
  lines.push("## How I want you to work");
  generateWorkingRules(brief).forEach((r) => lines.push(r));

  return lines.join("\n");
}

export function generateStuckPrompt(
  brief: ProjectBrief,
  stuckDescription: string
): string {
  const lines: string[] = [];

  lines.push(`I'm building ${brief.projectName} and I'm stuck.`);
  lines.push("");
  lines.push("## Project context");
  lines.push(`Goal: ${brief.description}`);
  if (brief.techStack) lines.push(`Stack: ${brief.techStack}`);
  if (brief.constraints) lines.push(`Constraints: ${brief.constraints}`);

  lines.push("");
  lines.push("## The problem");
  lines.push(stuckDescription);

  lines.push("");
  lines.push("## What I need");
  lines.push("- Diagnose what's going wrong in plain language.");
  lines.push("- Give me the simplest fix first.");
  lines.push("- Don't rewrite everything — keep changes minimal.");

  // inject relevant adaptive rules
  const rules = generateWorkingRules(brief).filter((r) =>
    r.includes("no-code") ||
    r.includes("editor") ||
    r.includes("free tools") ||
    r.includes("plain language")
  );
  rules.forEach((r) => lines.push(r));

  return lines.join("\n");
}

export function generateResetPrompt(brief: ProjectBrief): string {
  const lines: string[] = [];

  lines.push(
    `My context window is full. Let's start a fresh session for ${brief.projectName}.`
  );
  lines.push("");
  lines.push("## What we've built so far");
  lines.push(brief.description);
  if (brief.lastSessionSummary) {
    lines.push("");
    lines.push("## Last session summary");
    lines.push(brief.lastSessionSummary);
  }

  lines.push("");
  lines.push("## What I need now");
  lines.push("- Acknowledge the context above and confirm you understand where we are.");
  lines.push("- Wait for me to tell you what to work on next.");
  lines.push("- Keep your response short.");

  return lines.join("\n");
}

export function generatePlanPrompt(
  brief: ProjectBrief,
  todayGoal: string
): string {
  const lines: string[] = [];

  lines.push(`You are helping me plan something for ${brief.projectName}. Do NOT build or write any code yet.`);
  lines.push("");
  lines.push("## Project context");
  lines.push(`Goal: ${brief.description}`);
  if (brief.targetUser) lines.push(`Built for: ${brief.targetUser}`);
  if (brief.techStack) lines.push(`Stack: ${brief.techStack}`);
  if (brief.aiTools) lines.push(`AI tools I'm using: ${brief.aiTools}`);
  if (brief.constraints) lines.push(`Constraints: ${brief.constraints}`);

  if (brief.lastSessionSummary) {
    lines.push("");
    lines.push("## Last session");
    lines.push(brief.lastSessionSummary);
  }

  lines.push("");
  lines.push("## What I want to plan");
  lines.push(todayGoal);

  lines.push("");
  lines.push("## Your job — follow these steps exactly:");
  lines.push("");
  lines.push("### Step 1 — Ask me questions first");
  lines.push("Before doing anything else, ask me 3–5 focused questions that will help you understand exactly what I need.");
  lines.push("Ask all questions in one message. Wait for my answers before moving on.");
  lines.push("Keep questions simple — I am not technical, so use plain language.");
  lines.push("");
  lines.push("### Step 2 — Propose a plan");
  lines.push("Once I've answered, write a clear step-by-step plan.");
  lines.push("Each step should be one small, specific task.");
  lines.push("Show me the full plan and ask: 'Does this look right? Should I adjust anything?'");
  lines.push("Wait for my approval before moving on.");
  lines.push("");
  lines.push("### Step 3 — Execute one step at a time");
  lines.push("Only after I approve the plan, start step 1.");
  lines.push("Complete it fully, show me the result, and wait for my confirmation before moving to step 2.");
  lines.push("Never skip ahead.");
  lines.push("");
  lines.push("## Important rules");
  lines.push("- Do not write any code or make any changes until I approve the plan.");
  lines.push("- If something is unclear at any point, ask — do not assume.");
  lines.push("- Use plain language throughout. Explain technical terms if you must use them.");
  lines.push("- Keep your messages focused and short. No walls of text.");

  return lines.join("\n");
}

export function generateClosePrompt(brief: ProjectBrief): string {
  const lines: string[] = [];

  lines.push(`I'm wrapping up my session on ${brief.projectName}.`);
  lines.push("");
  lines.push("Please write a short session summary (3–5 bullet points) covering:");
  lines.push("- What we built or changed today");
  lines.push("- Any decisions we made and why");
  lines.push("- What's left to do next session");
  lines.push("- Any blockers or open questions");
  lines.push("");
  lines.push("Keep it concise — I'll save this as context for next time.");

  return lines.join("\n");
}
