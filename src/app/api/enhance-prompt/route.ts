import { NextRequest, NextResponse } from 'next/server';

const OLLAMA_URL = 'https://lumen-ollama.ngrok.app';

const ENHANCE_SYSTEM = `You are an expert AI image prompt engineer specializing in photorealistic, cinematic, and editorial photography. 
Your job is to transform basic image prompts into highly detailed, professional prompts that produce stunning, magazine-quality results.

Rules:
- Add specific camera details (e.g., "shot on Canon EOS R5, 85mm f/1.4 lens")
- Add lighting details (e.g., "golden hour backlight, soft diffused fill light")
- Add technical quality tags (e.g., "8K UHD, RAW photo, ultra-detailed, sharp focus")
- Add scene/atmosphere details
- Add subject details (expression, posture, styling)
- Keep the core subject and intent of the original prompt
- Do NOT add NSFW content
- Return ONLY the enhanced prompt, no explanations, no markdown, no quotes`;

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();
    if (!prompt) return NextResponse.json({ error: 'Prompt required' }, { status: 400 });

    const userMessage = `Enhance this image generation prompt into a highly detailed, photorealistic prompt. Original: "${prompt}"`;

    const res = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3.3:70b',
        messages: [
          { role: 'system', content: ENHANCE_SYSTEM },
          { role: 'user', content: userMessage }
        ],
        stream: false,
        options: {
          num_predict: 400,
          temperature: 0.7,
          think: false
        }
      }),
      signal: AbortSignal.timeout(60000)
    });

    if (!res.ok) throw new Error(`Ollama error: ${res.status}`);
    const data = await res.json();
    
    let enhanced = data.message?.content || '';
    // Strip any thinking tags if present
    enhanced = enhanced.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    // Strip quotes if wrapped
    enhanced = enhanced.replace(/^["']|["']$/g, '').trim();
    
    if (!enhanced) throw new Error('Empty response');
    
    return NextResponse.json({ enhanced });
  } catch (error) {
    console.error('[Enhance] Error:', error);
    return NextResponse.json({ error: 'Enhancement failed' }, { status: 500 });
  }
}
