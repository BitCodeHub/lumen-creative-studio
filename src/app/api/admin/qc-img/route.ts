import { NextRequest, NextResponse } from 'next/server';

const GALLERY_BASE = process.env.GALLERY_URL || 'https://lumen-gallery.ngrok.app';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'lumen-secret-token-2026';
const REVIEW_TOKEN = process.env.REVIEW_TOKEN || 'lumen-review-2026';

// GET /api/admin/qc-img?filename=xxx — proxy pending QC image
export async function GET(request: NextRequest) {
  const token = request.cookies.get('admin_token')?.value;
  if (token !== ADMIN_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const filename = request.nextUrl.searchParams.get('filename');
  if (!filename) {
    return NextResponse.json({ error: 'filename required' }, { status: 400 });
  }

  try {
    const res = await fetch(
      `${GALLERY_BASE}/review/img/${encodeURIComponent(filename)}?token=${REVIEW_TOKEN}`,
      { headers: { 'ngrok-skip-browser-warning': '1' } }
    );
    if (!res.ok) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }
    const blob = await res.blob();
    return new NextResponse(blob, {
      headers: {
        'Content-Type': res.headers.get('Content-Type') || 'image/jpeg',
        'Cache-Control': 'no-cache, no-store',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Proxy error' }, { status: 502 });
  }
}
