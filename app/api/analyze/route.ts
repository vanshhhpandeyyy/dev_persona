import {
  BedrockRuntimeClient,
  InvokeModelCommand
} from "@aws-sdk/client-bedrock-runtime";

const client = new BedrockRuntimeClient({
  region: "us-east-1"
});

async function runPersona(id: string, roleName: string, code: string) {
  try {

    const prompt = `<s>[INST]
You are a ${roleName}.

Analyze the provided code and respond STRICTLY in this format:

## Improved Code
\`\`\`javascript
// improved version here
\`\`\`

## Explanation
Explain briefly what was improved and why (3–6 lines max).

## Issues Found
List issues found in the original code (if any).

## Suggestions
Optional improvements for production-level quality.

Code to analyze:
${code}

[/INST]`;

    const command = new InvokeModelCommand({
      modelId: "mistral.mistral-7b-instruct-v0:2",
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        prompt,
        max_tokens: 700,
        temperature: 0.4,
        top_p: 0.9
      })
    });

    const response = await client.send(command);

    const decoded = new TextDecoder().decode(response.body);
    const result = JSON.parse(decoded);

    return {
      name: roleName,
      content: result.outputs?.[0]?.text ?? "No response generated"
    };

  }
  catch (error: any) {
  return {
    name: roleName,
    content: "",
    error: error.message
  };
}


export async function POST(req) {

  try {

    const { code } = await req.json();

    if (!code || !code.trim()) {
      return Response.json({
        error: "Code is required"
      }, { status: 400 });
    }

    const [
      senior,
      security,
      architect
    ] = await Promise.all([
      runPersona("senior-engineer", "Senior Software Engineer", code),
      runPersona("security-engineer", "Security Engineer", code),
      runPersona("architect", "Software Architect", code)
    ]);

    return Response.json({
      results: {
        "senior-engineer": senior,
        "security-engineer": security,
        "architect": architect
      }
    });

  } catch (error) {

    console.error("API error:", error);

    return Response.json({
      error: error.message
    }, { status: 500 });

  }
}
