export interface ProjectBrief {
  projectName: string;
  description: string;
  targetUser: string;
  aiTools: string;
  techStack: string;
  successLooksLike: string;
  constraints: string;
  lastSessionSummary: string;
}

const BRIEF_KEY = "buildright_project_brief";

export function saveBrief(brief: ProjectBrief): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(BRIEF_KEY, JSON.stringify(brief));
}

export function loadBrief(): ProjectBrief | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(BRIEF_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ProjectBrief;
  } catch {
    return null;
  }
}

export function clearBrief(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(BRIEF_KEY);
}

export function hasBrief(): boolean {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem(BRIEF_KEY);
}
