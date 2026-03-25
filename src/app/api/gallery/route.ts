import { NextRequest, NextResponse } from 'next/server';

const GALLERY_BASE = process.env.GALLERY_URL || 'https://lumen-gallery.ngrok.app';
// Images served via /api/gallery/image proxy

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

    function labelFromId(id: string): string {
      return id
        .replace(/[_-]/g, ' ')
        .replace(/\d{5}_?\.jpg$/i, '')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/\b\w/g, (c) => c.toUpperCase());
    }

    const images = (data.images || []).map((img: { filename?: string; id?: string; prompt?: string; model?: string; [key: string]: unknown }) => {
      const filename = (img.filename || img.id || '') as string;
      return {
        ...img,
        id: filename,
        filename,
        imageUrl: `/api/gallery/image?file=${encodeURIComponent(filename)}`,
        prompt: img.prompt || labelFromId(filename),
        model: img.model || 'Lumen AI',
      };
    });

    const totalPages = data.pages || Math.ceil((data.total || 0) / limit);

    return NextResponse.json({
      images,
      total: data.total,
      page: data.page || page,
      limit: data.limit || limit,
      hasMore: page < totalPages,
    });
  } catch {
    return NextResponse.json({ images: [], total: 0, page, limit, hasMore: false });
  }
}
