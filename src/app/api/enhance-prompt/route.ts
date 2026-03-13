import { NextRequest, NextResponse } from 'next/server';

const OLLAMA_URL = 'https://lumen-ollama.ngrok.app';

const ENHANCE_SYSTEM = `You are an expert AI image prompt engineer. Transform basic prompts into highly detailed, photorealistic image generation prompts. Add camera specs, lighting, technical quality tags, atmosphere. Return ONLY the enhanced prompt, no explanations.`;

async function enhanceWithModel(prompt: string, model: string, timeoutMs: number): Promise<string | null> {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: ENHANCE_SYSTEM },
          { role: 'user', content: `Enhance this image prompt: "${prompt}"` }
        ],
        stream: false,
        think: false,
        options: { num_predict: 400, temperature: 0.7 }
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

    // Primary: Qwen 3.5 122B (best quality, ~20s)
    let enhanced = await enhanceWithModel(prompt, 'qwen3.5:122b', 60000);
    
    // Fallback: Llama 3.3 70B (~26s)
    if (!enhanced) {
      console.log('[Enhance] Qwen 3.5 unavailable, using Llama 3.3 70B fallback');
      enhanced = await enhanceWithModel(prompt, 'llama3.3:70b', 60000);
    }

    if (!enhanced) return NextResponse.json({ error: 'Enhancement failed' }, { status: 500 });
    return NextResponse.json({ enhanced });
  } catch (error) {
    console.error('[Enhance] Error:', error);
    return NextResponse.json({ error: 'Enhancement failed' }, { status: 500 });
  }
}
