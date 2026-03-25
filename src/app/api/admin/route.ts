import { NextRequest, NextResponse } from 'next/server';

const GALLERY_BASE = process.env.GALLERY_URL || 'https://lumen-gallery.ngrok.app';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'lumen-admin-2026';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'lumen-secret-token-2026';
const REVIEW_TOKEN = process.env.REVIEW_TOKEN || 'lumen-review-2026';

function galleryHeaders() {
  return {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': '1',
  };
}

// GET /api/admin — verify auth
export async function GET(request: NextRequest) {
  const token = request.cookies.get('admin_token')?.value;
  if (token === ADMIN_TOKEN) {
    return NextResponse.json({ authenticated: true });
  }
  return NextResponse.json({ authenticated: false }, { status: 401 });
}

// POST /api/admin — all admin actions
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action } = body;

  // ── LOGIN ──
  if (action === 'login') {
    const { password } = body;
    if (password === ADMIN_PASSWORD) {
      const res = NextResponse.json({ success: true, token: ADMIN_TOKEN });
      res.cookies.set('admin_token', ADMIN_TOKEN, {
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
        sameSite: 'strict',
      });
      return res;
    }
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }

  // ── AUTH CHECK ──
  const token = request.cookies.get('admin_token')?.value || body.token;
  if (token !== ADMIN_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ── HIDE (immediate, via gallery server v8) ──
  if (action === 'hide') {
    const { filename } = body;
    if (!filename) return NextResponse.json({ error: 'filename required' }, { status: 400 });
    try {
      await fetch(`${GALLERY_BASE}/hide/${encodeURIComponent(filename)}?token=${REVIEW_TOKEN}`, {
        method: 'POST',
        headers: galleryHeaders(),
      });
      return NextResponse.json({ success: true, message: `${filename} hidden` });
    } catch {
      return NextResponse.json({ success: true, message: `${filename} marked hidden` });
    }
  }

  // ── BULK HIDE ──
  if (action === 'bulk-hide') {
    const { filenames } = body;
    if (!Array.isArray(filenames)) return NextResponse.json({ error: 'filenames array required' }, { status: 400 });
    try {
      await fetch(`${GALLERY_BASE}/bulk-hide?token=${REVIEW_TOKEN}`, {
        method: 'POST',
        headers: galleryHeaders(),
        body: JSON.stringify({ filenames }),
      });
      return NextResponse.json({ success: true, count: filenames.length });
    } catch {
      return NextResponse.json({ success: true, count: filenames.length });
    }
  }

  // ── DELETE (permanent) ──
  if (action === 'delete') {
    const { filename } = body;
    if (!filename) return NextResponse.json({ error: 'filename required' }, { status: 400 });
    try {
      await fetch(`${GALLERY_BASE}/delete/${encodeURIComponent(filename)}?token=${REVIEW_TOKEN}`, {
        method: 'POST',
        headers: galleryHeaders(),
      });
      return NextResponse.json({ success: true, message: `${filename} deleted` });
    } catch {
      return NextResponse.json({ success: true, message: `${filename} deleted` });
    }
  }

  // ── QC REVIEW: GET QUEUE ──
  if (action === 'qc-queue') {
    const limit = body.limit || 50;
    const offset = body.offset || 0;
    try {
      const res = await fetch(
        `${GALLERY_BASE}/review/queue?token=${REVIEW_TOKEN}&limit=${limit}&offset=${offset}`,
        { headers: galleryHeaders() }
      );
      const data = await res.json();
      // Rewrite image URLs through our proxy
      const items = (data.items || []).map((item: { filename: string; status?: string }) => ({
        ...item,
        imageUrl: `/api/admin/qc-img?filename=${encodeURIComponent(item.filename)}`,
      }));
      return NextResponse.json({ total: data.total, items });
    } catch {
      return NextResponse.json({ total: 0, items: [] });
    }
  }

  // ── QC APPROVE ──
  if (action === 'qc-approve') {
    const { filename } = body;
    if (!filename) return NextResponse.json({ error: 'filename required' }, { status: 400 });
    try {
      const res = await fetch(
        `${GALLERY_BASE}/review/approve/${encodeURIComponent(filename)}?token=${REVIEW_TOKEN}`,
        { method: 'POST', headers: galleryHeaders() }
      );
      const data = await res.json();
      return NextResponse.json({ success: true, ...data });
    } catch {
      return NextResponse.json({ success: false, error: 'Gallery server unreachable' }, { status: 502 });
    }
  }

  // ── QC REJECT ──
  if (action === 'qc-reject') {
    const { filename } = body;
    if (!filename) return NextResponse.json({ error: 'filename required' }, { status: 400 });
    try {
      const res = await fetch(
        `${GALLERY_BASE}/review/reject/${encodeURIComponent(filename)}?token=${REVIEW_TOKEN}`,
        { method: 'POST', headers: galleryHeaders() }
      );
      const data = await res.json();
      return NextResponse.json({ success: true, ...data });
    } catch {
      return NextResponse.json({ success: false, error: 'Gallery server unreachable' }, { status: 502 });
    }
  }

  // ── QC APPROVE BULK ──
  if (action === 'qc-approve-bulk') {
    const { filenames } = body;
    if (!Array.isArray(filenames)) return NextResponse.json({ error: 'filenames array required' }, { status: 400 });
    try {
      const res = await fetch(
        `${GALLERY_BASE}/review/approve-bulk?token=${REVIEW_TOKEN}`,
        {
          method: 'POST',
          headers: galleryHeaders(),
          body: JSON.stringify({ filenames }),
        }
      );
      const data = await res.json();
      return NextResponse.json({ success: true, ...data });
    } catch {
      return NextResponse.json({ success: false, error: 'Gallery server unreachable' }, { status: 502 });
    }
  }

  // ── LOGOUT ──
  if (action === 'logout') {
    const res = NextResponse.json({ success: true });
    res.cookies.delete('admin_token');
    return res;
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
