// Server-side AI provider layer. Keys: user columns first, env fallback.
// Providers: OpenAI (api.openai.com) and NVIDIA NIM (build.nvidia.com free-key catalog).
import type { User } from '@prisma/client';

export type AIProvider = 'openai' | 'nvidia' | 'heuristic' | 'none';

const COPYWRITER_SYSTEM =
  'You are a punchy copywriter for social graphics. Reply with one short headline, one subline, and one caption separated by newlines. No extra commentary.';

export function resolveAI(user: Pick<User, 'aiProvider' | 'openaiKey' | 'nvidiaKey'>): {
  provider: AIProvider;
  openaiKey?: string;
  nvidiaKey?: string;
} {
  const openaiKey = user.openaiKey || process.env.OPENAI_API_KEY || '';
  const nvidiaKey = user.nvidiaKey || process.env.NVIDIA_API_KEY || '';
  const want = user.aiProvider;

  if (want === 'openai' && openaiKey) return { provider: 'openai', openaiKey };
  if (want === 'nvidia' && nvidiaKey) return { provider: 'nvidia', nvidiaKey };
  // provider heuristic / unset / missing key → any available key wins, else offline
  if (openaiKey) return { provider: 'openai', openaiKey };
  if (nvidiaKey) return { provider: 'nvidia', nvidiaKey };
  return { provider: 'none' };
}

/* ---------------- OpenAI ---------------- */

async function jfetch(url: string, headers: Record<string, string>, body: unknown) {
  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
  if (!res.ok) {
    let detail = '';
    try {
      detail = (await res.json())?.error?.message || '';
    } catch { /* ignore */ }
    throw new Error(`${res.status}: ${detail || res.statusText}`);
  }
  return res.json();
}

export async function openaiText(key: string, prompt: string): Promise<string> {
  const data = await jfetch(
    'https://api.openai.com/v1/chat/completions',
    { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: COPYWRITER_SYSTEM },
        { role: 'user', content: prompt },
      ],
      max_tokens: 160,
    },
  );
  return data.choices?.[0]?.message?.content?.trim() || '';
}

export async function openaiImage(key: string, prompt: string): Promise<string> {
  try {
    const data = await jfetch(
      'https://api.openai.com/v1/images/generations',
      { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      { model: 'gpt-image-1', prompt, size: '1024x1024', n: 1 },
    );
    const b64 = data.data?.[0]?.b64_json;
    if (!b64) throw new Error('no image data');
    return `data:image/png;base64,${b64}`;
  } catch (e) {
    if (/gpt-image-1|unknown model|model_not_found/i.test(String(e))) {
      const data = await jfetch(
        'https://api.openai.com/v1/images/generations',
        { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        { model: 'dall-e-3', prompt, size: '1024x1024', n: 1, response_format: 'b64_json' },
      );
      const b64 = data.data?.[0]?.b64_json;
      if (!b64) throw new Error('no image data');
      return `data:image/png;base64,${b64}`;
    }
    throw e;
  }
}

/* ---------------- NVIDIA NIM (build.nvidia.com free keys) ---------------- */

export async function nvidiaText(key: string, prompt: string): Promise<string> {
  const model = process.env.NVIDIA_TEXT_MODEL || 'meta/llama-3.1-8b-instruct';
  const data = await jfetch(
    'https://integrate.api.nvidia.com/v1/chat/completions',
    { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    {
      model,
      messages: [
        { role: 'system', content: COPYWRITER_SYSTEM },
        { role: 'user', content: prompt },
      ],
      max_tokens: 160,
      temperature: 0.7,
    },
  );
  return data.choices?.[0]?.message?.content?.trim() || '';
}

export async function nvidiaImage(key: string, prompt: string): Promise<string> {
  const model = process.env.NVIDIA_IMAGE_MODEL || 'stabilityai/stable-diffusion-xl';
  // Most SD-family NIMs: https://ai.api.nvidia.com/v1/genai/{model} -> { artifacts: [{ base64 }] }
  const data = await jfetch(
    `https://ai.api.nvidia.com/v1/genai/${model}`,
    { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    { prompt, mode: 'base', cfg_scale: 5, steps: 30, aspect_ratio: '1:1', n: 1 },
  );
  const b64 =
    data.artifacts?.[0]?.base64 ||
    data.image_data?.[0]?.base64 ||
    data.images?.[0] ||
    (typeof data.image === 'string' ? data.image : '');
  if (!b64) throw new Error(`NVIDIA NIM ${model} returned no image data`);
  return `data:image/png;base64,${b64.replace(/^data:image\/\w+;base64,/, '')}`;
}

/* ---------------- Facade used by API routes ---------------- */

export async function runText(
  user: Pick<User, 'aiProvider' | 'openaiKey' | 'nvidiaKey'>,
  prompt: string,
): Promise<{ text: string; provider: AIProvider }> {
  const { provider, openaiKey, nvidiaKey } = resolveAI(user);
  if (provider === 'openai') return { text: await openaiText(openaiKey!, prompt), provider };
  if (provider === 'nvidia') return { text: await nvidiaText(nvidiaKey!, prompt), provider };
  throw new Error('no AI provider configured');
}

export async function runImage(
  user: Pick<User, 'aiProvider' | 'openaiKey' | 'nvidiaKey'>,
  prompt: string,
): Promise<{ url: string; provider: AIProvider }> {
  const { provider, openaiKey, nvidiaKey } = resolveAI(user);
  if (provider === 'openai') return { url: await openaiImage(openaiKey!, prompt), provider };
  if (provider === 'nvidia') return { url: await nvidiaImage(nvidiaKey!, prompt), provider };
  throw new Error('no AI provider configured');
}
