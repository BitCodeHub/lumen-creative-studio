import { NextRequest, NextResponse } from 'next/server';

const NEMOTRON_URL = 'https://lumen-nemotron.ngrok.app/v1';
const OLLAMA_URL = 'https://lumen-ollama.ngrok.app';

const ENHANCE_SYSTEM = `You are an expert AI image prompt engineer. Transform basic prompts into highly detailed, photorealistic image generation prompts. Add camera specs, lighting, technical quality tags, atmosphere. Return ONLY the enhanced prompt, no explanations.`;

async function enhanceWithNemotron(prompt: string): Promise<string | null> {
  try {
    const res = await fetch(`${NEMOTRON_URL}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'nemotron-3-super',
        messages: [
          { role: 'system', content: ENHANCE_SYSTEM },
          { role: 'user', content: `Enhance this image prompt: "${prompt}"` }
        ],
        max_tokens: 400,
        temperature: 1.0,
        top_p: 0.95,
      }),
      signal: AbortSignal.timeout(45000)
    });
    if (!res.ok) return null;
    const data = await res.json();
    let enhanced = (data.choices?.[0]?.message?.content || '') as string;
    enhanced = enhanced.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    return enhanced || null;
  } catch {
    return null;
  }
}

async function enhanceWithOllama(prompt: string): Promise<string | null> {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3.3:70b',
        messages: [
          { role: 'system', content: ENHANCE_SYSTEM },
          { role: 'user', content: `Enhance this image prompt: "${prompt}"` }
        ],
        stream: false,
        options: { num_predict: 400, temperature: 0.7 }
      }),
      signal: AbortSignal.timeout(60000)
    });
    if (!res.ok) return null;
    const data = await res.json();
    let enhanced = (data.message?.content || '') as string;
    enhanced = enhanced.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    return enhanced || null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();
    if (!prompt) return NextResponse.json({ error: 'Prompt required' }, { status: 400 });

    let enhanced = await enhanceWithNemotron(prompt);
    if (!enhanced) {
      console.log('[Enhance] Nemotron unavailable, using Llama 3.3 70B fallback');
      enhanced = await enhanceWithOllama(prompt);
    }

    if (!enhanced) return NextResponse.json({ error: 'Enhancement failed' }, { status: 500 });
    return NextResponse.json({ enhanced });
  } catch (error) {
    console.error('[Enhance] Error:', error);
    return NextResponse.json({ error: 'Enhancement failed' }, { status: 500 });
  }
}
