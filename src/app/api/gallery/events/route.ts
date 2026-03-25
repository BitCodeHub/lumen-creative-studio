import { NextRequest } from 'next/server';

const GALLERY_BASE = process.env.GALLERY_URL || 'https://lumen-gallery.ngrok.app';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'lumen-secret-token-2026';

// GET /api/gallery/events — proxy SSE stream from gallery server
export async function GET(request: NextRequest) {
  const token = request.cookies.get('admin_token')?.value;
  if (token !== ADMIN_TOKEN) {
    // Public SSE — only non-sensitive gallery events (added/removed)
    // Still proxy through so we don't expose backend URL
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let galleryRes: Response | null = null;
      try {
        galleryRes = await fetch(`${GALLERY_BASE}/events`, {
          headers: { 'ngrok-skip-browser-warning': '1' },
          signal: request.signal,
        });

        if (!galleryRes.ok || !galleryRes.body) {
          controller.enqueue(encoder.encode('event: error\ndata: {"error":"upstream unavailable"}\n\n'));
          controller.close();
          return;
        }

        const reader = galleryRes.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          controller.enqueue(value);
        }
      } catch {
        // Client disconnected or upstream closed
      } finally {
        controller.close();
      }
    },
    cancel() {
      // Client disconnected
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
      'Connection': 'keep-alive',
    },
  });
}
