import { NextRequest, NextResponse } from 'next/server';

const GALLERY_BASE = 'https://lumen-gallery.ngrok.app';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '24');

  try {
    const res = await fetch(
      `${GALLERY_BASE}/gallery?page=${page}&limit=${limit}`,
      {
        headers: { 'ngrok-skip-browser-warning': '1' },
        cache: 'no-store',
      }
    );

    if (!res.ok) throw new Error('Gallery server error');

    const data = await res.json();

    // Derive a readable label from filename (e.g. "asian_princess_00001_.jpg" → "Asian Princess")
    function labelFromId(id: string): string {
      return id
        .replace(/[_-]/g, ' ')
        .replace(/\d{5}_?\.jpg$/i, '')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/\b\w/g, (c) => c.toUpperCase());
    }

    // Proxy image URLs through our API to avoid ngrok browser warning
    const images = (data.images || []).map((img: { id: string; prompt?: string; model?: string; [key: string]: unknown }) => ({
      ...img,
      imageUrl: `/api/gallery/image?file=${encodeURIComponent(img.id)}`,
      prompt: img.prompt || labelFromId(img.id as string),
      model: img.model || 'Lumen AI',
    }));

    return NextResponse.json({
      images,
      total: data.total,
      page: data.page,
      limit: data.limit,
      hasMore: data.hasMore,
    });
  } catch {
    return NextResponse.json({ images: [], total: 0, page, limit, hasMore: false });
  }
}
