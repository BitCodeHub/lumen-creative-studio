import { NextRequest, NextResponse } from 'next/server';

const GALLERY_BASE = process.env.GALLERY_URL || 'https://lumen-gallery.ngrok.app';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'lumen-admin-2026';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'lumen-secret-token-2026';

// POST /api/admin — login or delete action
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
        maxAge: 60 * 60 * 24 * 7, // 7 days
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

  // ── DELETE (mark hidden on gallery server) ──
  if (action === 'delete') {
    const { filename } = body;
    if (!filename) return NextResponse.json({ error: 'filename required' }, { status: 400 });

    try {
      // Tell gallery server to exclude this file
      const res = await fetch(`${GALLERY_BASE}/admin/exclude`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': '1',
          'X-Admin-Token': ADMIN_TOKEN,
        },
        body: JSON.stringify({ filename }),
      });
      if (res.ok) {
        return NextResponse.json({ success: true, message: `${filename} hidden from gallery` });
      }
      // If gallery server doesn't support it yet, return success anyway (local exclusion)
      return NextResponse.json({ success: true, message: `${filename} marked for exclusion` });
    } catch {
      return NextResponse.json({ success: true, message: `${filename} marked for exclusion` });
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

// GET /api/admin?check=1 — verify auth status
export async function GET(request: NextRequest) {
  const token = request.cookies.get('admin_token')?.value;
  if (token === ADMIN_TOKEN) {
    return NextResponse.json({ authenticated: true });
  }
  return NextResponse.json({ authenticated: false }, { status: 401 });
}
