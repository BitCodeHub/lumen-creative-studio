import { NextRequest, NextResponse } from 'next/server';

const OLLAMA_URL = 'https://lumen-ollama.ngrok.app';

const ENHANCE_SYSTEM = `You are an expert AI image prompt engineer. Transform basic prompts into detailed, photorealistic image generation prompts. Add camera specs, lighting, and quality tags. Max 80 words. Return ONLY the enhanced prompt.`;

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();
    if (!prompt) return NextResponse.json({ error: 'Prompt required' }, { status: 400 });

    // Use streaming to avoid Render timeout, then collect full response
    const res = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3.3:70b',
        messages: [
          { role: 'system', content: ENHANCE_SYSTEM },
          { role: 'user', content: `Enhance this prompt (max 80 words): "${prompt}"` }
        ],
        stream: true,
        think: false,
        options: { num_predict: 150, temperature: 0.7 }
      }),
      signal: AbortSignal.timeout(58000)
    });

    if (!res.ok || !res.body) {
      return NextResponse.json({ error: 'Enhancement failed' }, { status: 500 });
    }

    // Stream response back to client
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let fullContent = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n').filter(l => l.trim());
            for (const line of lines) {
              try {
                const data = JSON.parse(line);
                const token = data.message?.content || '';
                if (token) {
                  fullContent += token;
                  // Stream each token
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token })}\n\n`));
                }
                if (data.done) {
                  const cleaned = fullContent.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, enhanced: cleaned })}\n\n`));
                }
              } catch {}
            }
          }
        } catch (e) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Stream error' })}\n\n`));
        }
        controller.close();
      }
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    });
  } catch (error) {
    console.error('[Enhance] Error:', error);
    return NextResponse.json({ error: 'Enhancement failed' }, { status: 500 });
  }
}
