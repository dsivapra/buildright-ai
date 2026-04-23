import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { brief, todayGoal, mode } = await req.json();

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const systemContext = `You are an expert AI prompt engineer. Your job is to write expert-level prompts for non-technical people who are building things with AI tools like Claude, ChatGPT, or Cursor.

The user fills in basic, casual details about their project. You transform those details into a powerful, technically precise prompt that they could never write themselves.

Your prompts should:
- Use proper technical terminology appropriate for their project type
- Include specific best practices the user wouldn't know to ask for
- Set clear constraints and output formats
- Reference relevant patterns, standards, or frameworks for their domain
- Be specific enough that an AI assistant knows exactly how to help

You output ONLY the prompt text — no explanation, no intro, no "here's your prompt". Just the raw prompt ready to paste.`;

    let userRequest = "";

    if (mode === "session") {
      userRequest = `Generate an expert-level AI session prompt for this project:

Project name: ${brief.projectName}
What they're building: ${brief.description}
Who it's for: ${brief.targetUser}
AI tools they use: ${brief.aiTools}
Tech stack: ${brief.techStack}
Success looks like: ${brief.successLooksLike}
Constraints: ${brief.constraints}
Last session summary: ${brief.lastSessionSummary || "This is the first session."}
Today's goal: ${todayGoal}

Write a prompt that:
1. Opens with a clear expert role assignment for the AI
2. Gives full project context in structured sections
3. Includes domain-specific technical standards and best practices they wouldn't know to specify
4. Sets precise working rules tailored to their stack, tools, and project type
5. Ends with today's specific goal framed technically

Make it expert-level — the kind of prompt a senior engineer or experienced product builder would write.`;

    } else if (mode === "stuck") {
      userRequest = `Generate an expert-level debugging prompt for this situation:

Project: ${brief.projectName}
What they're building: ${brief.description}
Tech stack: ${brief.techStack}
The problem: ${todayGoal}

Write a prompt that:
1. Assigns the AI an expert debugging role for their specific stack
2. Frames the problem with proper technical context
3. Asks the AI to diagnose systematically — not just guess
4. Includes relevant debugging approaches for their tech stack
5. Keeps changes minimal and targeted

Make it sound like a senior developer asking for help — precise, technical, no fluff.`;

    } else if (mode === "reset") {
      userRequest = `Generate an expert context-reset prompt for this project:

Project: ${brief.projectName}
What they're building: ${brief.description}
Stack: ${brief.techStack}
Last session summary: ${brief.lastSessionSummary || "No summary available."}

Write a prompt that efficiently re-establishes full context for a fresh AI session. Include the key architectural decisions, current state, and what's next. Make it concise but complete — a senior developer handing off to a colleague.`;

    } else if (mode === "close") {
      userRequest = `Generate a session close prompt for this project:

Project: ${brief.projectName}
Stack: ${brief.techStack}

Write a prompt asking the AI to produce a structured session summary that captures: what was built, decisions made and why, current system state, what's next, and any open questions. Format it so it can be dropped directly into the next session as context.`;
    }

    const result = await model.generateContent([
      { text: systemContext },
      { text: userRequest },
    ]);

    const text = result.response.text();

    return NextResponse.json({ prompt: text });
  } catch (err) {
    console.error("Gemini error:", err);
    return NextResponse.json(
      { error: "Failed to generate prompt" },
      { status: 500 }
    );
  }
}
