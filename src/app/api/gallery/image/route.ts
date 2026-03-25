import { NextRequest, NextResponse } from 'next/server';

const GALLERY_BASE = 'https://lumen-gallery.ngrok.app';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const file = searchParams.get('file');
  if (!file) return new NextResponse('Missing file', { status: 400 });

  try {
    const quality = request.nextUrl.searchParams.get('quality');
  const endpoint = quality === 'hires' ? 'hires' : 'images';
  const res = await fetch(`${GALLERY_BASE}/${endpoint}/${encodeURIComponent(file)}`, {
      headers: { 'ngrok-skip-browser-warning': '1' },
      cache: quality === 'hires' ? 'force-cache' : 'no-store',
    });
    if (!res.ok) return new NextResponse('Image not found', { status: 404 });

    const blob = await res.blob();
    return new NextResponse(blob, {
      headers: {
        'Content-Type': res.headers.get('Content-Type') || 'image/jpeg',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch {
    return new NextResponse('Failed to fetch image', { status: 502 });
  }
}
