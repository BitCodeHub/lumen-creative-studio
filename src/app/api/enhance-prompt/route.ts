import { NextRequest, NextResponse } from 'next/server';

const OLLAMA_URL = process.env.OLLAMA_URL || 'https://lumen-ollama.ngrok.app';

export const maxDuration = 60;

const SYSTEM = 'You are an expert AI image prompt engineer. Transform basic prompts into detailed, photorealistic image generation prompts. Add camera specs (Canon 5D, 85mm f/1.4), lighting (golden hour, studio softbox), and technical quality tags. Return ONLY the enhanced prompt in one paragraph, max 80 words.';

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();
    if (!prompt) return NextResponse.json({ error: 'Prompt required' }, { status: 400 });

    const upstream = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3.3:70b',
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: `Enhance this image prompt (max 80 words): "${prompt}"` }
        ],
        stream: true,
        think: false,
        options: { num_predict: 150, temperature: 0.7 }
      }),
    });

    if (!upstream.ok || !upstream.body) {
      return NextResponse.json({ error: 'Enhancement failed' }, { status: 500 });
    }

    // Stream NDJSON from Ollama → client as SSE
    const encoder = new TextEncoder();
    const body = new ReadableStream({
      async start(ctrl) {
        const reader = upstream.body!.getReader();
        const dec = new TextDecoder();
        let buf = '';
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buf += dec.decode(value, { stream: true });
            const lines = buf.split('\n');
            buf = lines.pop() || '';
            for (const line of lines) {
              if (!line.trim()) continue;
              try {
                const obj = JSON.parse(line);
                const token = obj.message?.content || '';
                if (token) ctrl.enqueue(encoder.encode(`data: ${JSON.stringify({ t: token })}\n\n`));
              } catch {}
            }
          }
          ctrl.enqueue(encoder.encode('data: [DONE]\n\n'));
        } catch {
          ctrl.enqueue(encoder.encode(`data: ${JSON.stringify({ error: true })}\n\n`));
        }
        ctrl.close();
      }
    });

    return new NextResponse(body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'X-Accel-Buffering': 'no',
      }
    });
  } catch (e) {
    return NextResponse.json({ error: 'Enhancement failed' }, { status: 500 });
  }
}
