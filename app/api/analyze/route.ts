type PersonaId = "senior-engineer" | "security-engineer" | "architect";

const PERSONAS: { id: PersonaId; name: string; focus: string }[] = [
  {
    id: "senior-engineer",
    name: "Senior Software Engineer",
    focus: "Correctness, bugs, edge cases, readability, maintainability, testing, and practical refactoring.",
  },
  {
    id: "security-engineer",
    name: "Security Engineer",
    focus: "Security vulnerabilities, trust boundaries, input validation, authentication, authorization, injection, secrets, and remediation.",
  },
  {
    id: "architect",
    name: "Software Architect",
    focus: "Architecture, separation of concerns, coupling, cohesion, scalability, performance, reliability, and long-term maintainability.",
  },
];

async function runPersona(persona: (typeof PERSONAS)[number], code: string, apiKey: string) {
  const prompt = `You are acting as a ${persona.name}. Review the supplied source code with this focus: ${persona.focus}

Be specific. Do not invent files, dependencies, runtime behavior, or vulnerabilities. If something cannot be established from the snippet, say so. Preserve the original language and framework.

Return exactly these sections:
## Overall Assessment
A concise summary.

## Improved Code
Provide a complete improved version when the supplied snippet is self-contained. If it is not self-contained, provide a targeted patch or explain what additional context is needed. Never replace missing context with fabricated code.

## Explanation
Explain the most important changes.

## Issues Found
List concrete issues, or state none identified.

## Suggestions
Give prioritized next steps.

Code to review:
\`\`\`
${code}
\`\`\``;

  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.25,
          maxOutputTokens: 1800,
        },
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(55000),
    }
  );

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      payload?.error?.message ||
      `Gemini API request failed (HTTP ${response.status}).`;
    throw new Error(message);
  }

  const text = payload?.candidates?.[0]?.content?.parts
    ?.map((part: { text?: string }) => part.text ?? "")
    .join("")
    .trim();

  if (!text) {
    throw new Error("Gemini returned an empty response. Please try again.");
  }

  return { name: persona.name, content: text };
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return Response.json(
        {
          error:
            "Server setup incomplete: GEMINI_API_KEY is missing. Add it in your Vercel project environment variables, then redeploy.",
        },
        { status: 503 }
      );
    }

    const body = await req.json().catch(() => null);
    const code = typeof body?.code === "string" ? body.code.trim() : "";

    if (!code) {
      return Response.json({ error: "Please provide code to analyze." }, { status: 400 });
    }

    if (code.length > 30000) {
      return Response.json(
        { error: "Please keep the code under 30,000 characters for one review." },
        { status: 413 }
      );
    }

    const settled = await Promise.all(
      PERSONAS.map(async (persona) => {
        try {
          return {
            id: persona.id,
            ...(await runPersona(persona, code, apiKey)),
          };
        } catch (error) {
          return {
            id: persona.id,
            name: persona.name,
            content: "",
            error: error instanceof Error ? error.message : "Unknown AI provider error.",
          };
        }
      })
    );

    const results = Object.fromEntries(
      settled.map(({ id, ...result }) => [id, result])
    );

    const failed = settled.filter((result) => result.error);
    if (failed.length === PERSONAS.length) {
      return Response.json(
        {
          error: `All three reviews failed. First error: ${failed[0].error}`,
          results,
        },
        { status: 502 }
      );
    }

    return Response.json({ results });
  } catch (error) {
    console.error("Analyze API error:", error);
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unexpected server error while analyzing code.",
      },
      { status: 500 }
    );
  }
}
