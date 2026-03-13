import { NextRequest, NextResponse } from 'next/server';

const OLLAMA_URL = 'https://lumen-ollama.ngrok.app';

const ENHANCE_SYSTEM = `You are an expert AI image prompt engineer. Transform basic prompts into highly detailed, photorealistic image generation prompts. Add camera specs, lighting, and technical quality tags. Return ONLY the enhanced prompt in one paragraph, no explanations, max 120 words.`;

async function enhanceWithModel(prompt: string, model: string, timeoutMs: number): Promise<string | null> {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: ENHANCE_SYSTEM },
          { role: 'user', content: `Enhance this image prompt (max 120 words): "${prompt}"` }
        ],
        stream: false,
        think: false,
        options: { num_predict: 200, temperature: 0.7 }
      }),
      signal: AbortSignal.timeout(timeoutMs)
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

    // Primary: Llama 3.3 70B (stable, ~30s with 200 tokens)
    let enhanced = await enhanceWithModel(prompt, 'llama3.3:70b', 55000);

    if (!enhanced) return NextResponse.json({ error: 'Enhancement failed' }, { status: 500 });
    return NextResponse.json({ enhanced });
  } catch (error) {
    console.error('[Enhance] Error:', error);
    return NextResponse.json({ error: 'Enhancement failed' }, { status: 500 });
  }
}
