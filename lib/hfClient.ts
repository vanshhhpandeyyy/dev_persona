import type { Persona } from './personas';

const HF_MODEL_ID = 'mistralai/Mistral-7B-Instruct-v0.2';
const HF_API_URL = `https://api-inference.huggingface.co/models/${HF_MODEL_ID}`;

type HfTextGenerationResponseItem = {
  generated_text?: string;
  [key: string]: unknown;
};

type HfTextGenerationResponse = HfTextGenerationResponseItem[];

export async function generatePersonaAnalysis(params: {
  persona: Persona;
  code: string;
  hfToken: string;
}): Promise<string> {
  const { persona, code, hfToken } = params;
  const prompt = buildPrompt(persona, code);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 55_000);

  try {
    const res = await fetch(HF_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${hfToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 512,
          temperature: 0.2,
          return_full_text: false,
        },
      }),
      signal: controller.signal,
      cache: 'no-store',
    });

    if (!res.ok) {
      const text = await safeReadText(res);
      throw new Error(
        `Hugging Face API error (${res.status} ${res.statusText}): ${truncate(
          text,
          300
        )}`
      );
    }

    const json = (await res.json()) as unknown;
    const content = extractGeneratedText(json);
    return content.trim() || 'No response generated.';
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Hugging Face request timed out');
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

function buildPrompt(persona: Persona, code: string): string {
  return [
    `You are ${persona.name}.`,
    persona.systemPrompt,
    '',
    'Analyze the following code and respond only with your analysis, using clear markdown formatting:',
    '',
    '```',
    code,
    '```',
  ].join('\n');
}

function extractGeneratedText(json: unknown): string {
  if (Array.isArray(json) && json.length > 0) {
    const first = json[0] as HfTextGenerationResponseItem;
    if (typeof first.generated_text === 'string') {
      return first.generated_text;
    }
  }

  if (typeof json === 'string') {
    return json;
  }

  try {
    return JSON.stringify(json);
  } catch {
    return '';
  }
}

async function safeReadText(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return '';
  }
}

function truncate(text: string, max: number): string {
  if (!text) return '';
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…`;
}

