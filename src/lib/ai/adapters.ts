import { LegalFlag } from '../types';

interface CompletionResponse {
  flags: LegalFlag[];
}

// --- Shared JSON extraction utility ---
function extractFlagsFromText(text: string): LegalFlag[] {
  try {
    const parsed: CompletionResponse = JSON.parse(text);
    return parsed.flags || [];
  } catch {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed: CompletionResponse = JSON.parse(jsonMatch[0]);
        return parsed.flags || [];
      } catch {
        // fall through
      }
    }
    return [];
  }
}

// --- Shared fetch wrapper with timeout and retry logic ---
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs = 30000
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

async function postJSON<T = unknown>(
  url: string,
  headers: Record<string, string>,
  body: unknown,
  timeoutMs = 30000
): Promise<T> {
  const response = await fetchWithTimeout(
    url,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
    },
    timeoutMs
  );

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  return (await response.json()) as T;
}

// --- Truncate text safely ---
const MAX_TEXT_LENGTH = 15000;
function safeTruncate(text: string, maxLength = MAX_TEXT_LENGTH): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '... [truncated]';
}

// --- OpenAI-style providers (OpenAI, Groq, OpenRouter) ---
export async function analyzeWithOpenAI(
  text: string,
  apiKey: string,
  systemPrompt: string,
  model: string
): Promise<LegalFlag[]> {
  const data = await postJSON<{
    choices: { message: { content: string } }[];
  }>('https://api.openai.com/v1/chat/completions', { Authorization: `Bearer ${apiKey}` }, {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Analyze this legal text: ${safeTruncate(text)}` },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.1,
    max_tokens: 4096,
  });

  const content = JSON.parse(data.choices[0].message.content);
  return content.flags || [];
}

export async function analyzeWithGroq(
  text: string,
  apiKey: string,
  systemPrompt: string,
  model: string
): Promise<LegalFlag[]> {
  const data = await postJSON<{
    choices: { message: { content: string } }[];
  }>('https://api.groq.com/openai/v1/chat/completions', { Authorization: `Bearer ${apiKey}` }, {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Analyze this legal text: ${safeTruncate(text)}` },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.1,
    max_tokens: 4096,
  });

  const content = JSON.parse(data.choices[0].message.content);
  return content.flags || [];
}

export async function analyzeWithOpenRouter(
  text: string,
  apiKey: string,
  systemPrompt: string,
  model: string = 'openrouter/auto'
): Promise<LegalFlag[]> {
  const data = await postJSON<{
    choices: { message: { content: string } }[];
  }>('https://openrouter.ai/api/v1/chat/completions', { Authorization: `Bearer ${apiKey}` }, {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Analyze this legal text: ${safeTruncate(text)}` },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.1,
    max_tokens: 4096,
  });

  const content = JSON.parse(data.choices[0].message.content);
  return content.flags || [];
}

// --- Anthropic ---
export async function analyzeWithAnthropic(
  text: string,
  apiKey: string,
  systemPrompt: string,
  model: string
): Promise<LegalFlag[]> {
  const data = await postJSON<{
    content: { text: string }[];
  }>('https://api.anthropic.com/v1/messages', {
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
  }, {
    model,
    max_tokens: 4096,
    system: systemPrompt,
    messages: [
      { role: 'user', content: `Analyze this legal text: ${safeTruncate(text, 150000)}` },
    ],
  });

  const content = data.content[0].text;
  return extractFlagsFromText(content);
}

// --- Gemini ---
export async function analyzeWithGemini(
  text: string,
  apiKey: string,
  systemPrompt: string,
  model: string
): Promise<LegalFlag[]> {
  const data = await postJSON<{
    candidates: { content: { parts: { text: string }[] } }[];
  }>(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {},
    {
      contents: [
        {
          parts: [
            { text: `${systemPrompt}\n\nAnalyze this legal text: ${safeTruncate(text, 150000)}` },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1,
        maxOutputTokens: 8192,
      },
    }
  );

  const content = data.candidates[0].content.parts[0].text;
  return extractFlagsFromText(content);
}

// --- Ollama ---
export async function analyzeWithOllama(
  text: string,
  _apiKey: string,
  systemPrompt: string,
  model: string
): Promise<LegalFlag[]> {
  const data = await postJSON<{
    message: { content: string };
  }>('http://localhost:11434/api/chat', {}, {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Analyze this legal text: ${safeTruncate(text)}` },
    ],
    format: 'json',
    stream: false,
    options: {
      temperature: 0.1,
      num_ctx: 8192,
    },
  });

  const content = data.message.content;
  return extractFlagsFromText(content);
}
