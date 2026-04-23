import { ProjectBrief } from "./storage";

// Phrases considered too vague to be useful
const VAGUE = [
  "not sure", "idk", "n/a", "na", "none", "no idea", "tbd", "to be decided",
  "dunno", "unsure", "don't know", "dont know", "?", "-", "...", "nope", "no",
];

const TOOL_NAMES: Record<string, string> = {
  claude: "Claude",
  chatgpt: "ChatGPT",
  "chat gpt": "ChatGPT",
  cursor: "Cursor",
  lovable: "Lovable",
  bolt: "Bolt",
  windsurf: "Windsurf",
  copilot: "Copilot",
  gemini: "Gemini",
  "v0": "v0",
  replit: "Replit",
  vercel: "Vercel",
  supabase: "Supabase",
  nextjs: "Next.js",
  "next.js": "Next.js",
  react: "React",
  tailwind: "Tailwind",
  webflow: "Webflow",
  notion: "Notion",
  zapier: "Zapier",
};

function capitalizeFirst(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function fixPronounI(str: string): string {
  // replace standalone " i " with " I "
  return str
    .replace(/\bi\b/g, "I")
    .replace(/\bi'm\b/gi, "I'm")
    .replace(/\bi've\b/gi, "I've")
    .replace(/\bi'll\b/gi, "I'll")
    .replace(/\bi'd\b/gi, "I'd");
}

function fixToolNames(str: string): string {
  let result = str;
  for (const [key, value] of Object.entries(TOOL_NAMES)) {
    const regex = new RegExp(`\\b${key}\\b`, "gi");
    result = result.replace(regex, value);
  }
  return result;
}

function isVague(str: string): boolean {
  const trimmed = str.trim().toLowerCase();
  return (
    VAGUE.includes(trimmed) ||
    trimmed.length < 4
  );
}

function cleanField(
  value: string,
  fallback: string,
  applyToolFix = false
): string {
  const trimmed = value.trim();
  if (!trimmed || isVague(trimmed)) return fallback;

  let result = trimmed;
  result = fixPronounI(result);
  result = capitalizeFirst(result);
  if (applyToolFix) result = fixToolNames(result);

  // ensure it ends with punctuation for multi-word values
  if (
    result.length > 10 &&
    !result.endsWith(".") &&
    !result.endsWith("!") &&
    !result.endsWith("?") &&
    !result.endsWith(",")
  ) {
    result = result + ".";
  }

  return result;
}

export interface CleanResult {
  brief: ProjectBrief;
  warnings: string[];
}

export function cleanBrief(brief: ProjectBrief): CleanResult {
  const warnings: string[] = [];

  const projectName = brief.projectName.trim() || "My Project";

  const description = cleanField(
    brief.description,
    "A project I'm building with AI tools."
  );
  if (isVague(brief.description))
    warnings.push("Description is vague — your prompt will be generic.");

  const targetUser = cleanField(
    brief.targetUser,
    "General users."
  );

  const aiTools = cleanField(brief.aiTools, "AI tools (unspecified).", true);

  const techStack = cleanField(
    brief.techStack,
    "Stack to be decided.",
    true
  );

  const successLooksLike = cleanField(
    brief.successLooksLike,
    "A working version of the project."
  );

  const constraints = cleanField(
    brief.constraints,
    "No specific constraints."
  );

  const lastSessionSummary = brief.lastSessionSummary?.trim() || "";

  return {
    brief: {
      projectName,
      description,
      targetUser,
      aiTools,
      techStack,
      successLooksLike,
      constraints,
      lastSessionSummary,
    },
    warnings,
  };
}

export function cleanGoalInput(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return trimmed;
  let result = fixPronounI(trimmed);
  result = capitalizeFirst(result);
  return result;
}
