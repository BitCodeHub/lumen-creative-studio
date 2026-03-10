"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Trash2, LogOut, Shield, Eye, EyeOff, Loader2, Check, X, AlertTriangle, RefreshCw } from "lucide-react";

interface AdminImage {
  id: string;
  imageUrl: string;
  prompt: string;
  model: string;
}

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [images, setImages] = useState<AdminImage[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingGallery, setLoadingGallery] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleted, setDeleted] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState<string | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const loaderRef = useRef<HTMLDivElement>(null);
  const fetchingRef = useRef(false);
  const pageRef = useRef(1);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Check auth on load
  useEffect(() => {
    fetch('/api/admin')
      .then(r => r.ok ? setAuthed(true) : setAuthed(false))
      .catch(() => setAuthed(false));
  }, []);

  const login = async () => {
    setLoginLoading(true);
    setLoginError("");
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', password }),
      });
      if (res.ok) {
        setAuthed(true);
      } else {
        setLoginError("Invalid password");
      }
    } catch {
      setLoginError("Connection error");
    }
    setLoginLoading(false);
  };

  const logout = async () => {
    await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'logout' }),
    });
    setAuthed(false);
    setImages([]);
    setSelected(new Set());
  };

  const fetchImages = useCallback(async (p: number) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setLoadingGallery(true);
    try {
      const res = await fetch(`/api/gallery?page=${p}&limit=50`);
      const data = await res.json();
      const imgs = data.images || [];
      setImages(prev => p === 1 ? imgs : [...prev, ...imgs]);
      setHasMore(data.hasMore ?? false);
      setPage(p);
      pageRef.current = p;
    } catch { /* ignore */ }
    setLoadingGallery(false);
    fetchingRef.current = false;
  }, []);

  useEffect(() => {
    if (authed) fetchImages(1);
  }, [authed, fetchImages]);

  // Infinite scroll
  useEffect(() => {
    if (!authed) return;
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !fetchingRef.current) {
        fetchImages(pageRef.current + 1);
      }
    }, { rootMargin: '800px' });
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [authed, hasMore, fetchImages]);

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

  const deleteImage = async (filename: string) => {
    setDeleting(filename);
    try {
      await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', filename }),
      });
      setDeleted(prev => new Set([...prev, filename]));
      setSelected(prev => { const s = new Set(prev); s.delete(filename); return s; });
      showToast(`Hidden: ${filename.slice(0, 30)}...`);
    } catch {
      showToast("Delete failed");
    }
    setDeleting(null);
  };

  const bulkDelete = async () => {
    if (selected.size === 0) return;
    setBulkDeleting(true);
    for (const id of selected) {
      await deleteImage(id);
    }
    setSelected(new Set());
    setBulkDeleting(false);
    showToast(`${selected.size} images hidden from gallery`);
  };

  const visibleImages = images.filter(img => !deleted.has(img.id));

  // ── LOGIN SCREEN ──
  if (authed === null) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 size={24} color="#4d9fff" style={{ animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  if (!authed) {
    return (
      <div style={{
        minHeight: "100vh", background: "#0a0a0a",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "Inter,-apple-system,sans-serif",
      }}>
        <div style={{
          background: "#111", border: "1px solid #1e1e1e", borderRadius: 20,
          padding: "40px 36px", width: 360, textAlign: "center",
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14, margin: "0 auto 20px",
            background: "linear-gradient(135deg, #0066ff22, #0066ff44)",
            border: "1px solid #0066ff44",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Shield size={24} color="#4d9fff" />
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 6 }}>Admin Access</h1>
          <p style={{ fontSize: 13, color: "#555", marginBottom: 28 }}>Lumen Creative Studio</p>

          <div style={{ position: "relative", marginBottom: 12 }}>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && login()}
              placeholder="Admin password"
              style={{
                width: "100%", padding: "11px 40px 11px 14px",
                background: "#161616", border: "1px solid #2a2a2a", borderRadius: 10,
                color: "#ddd", fontSize: 14, outline: "none", fontFamily: "inherit",
                boxSizing: "border-box",
              }}
              autoFocus
            />
            <button onClick={() => setShowPassword(v => !v)} style={{
              position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none", cursor: "pointer", color: "#555", padding: 4,
            }}>
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {loginError && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#ff6b6b", fontSize: 13, marginBottom: 12 }}>
              <AlertTriangle size={14} /> {loginError}
            </div>
          )}

          <button onClick={login} disabled={loginLoading || !password.trim()} style={{
            width: "100%", padding: "11px", borderRadius: 10, border: "none",
            background: loginLoading || !password.trim() ? "#1e1e1e" : "#0066ff",
            color: loginLoading || !password.trim() ? "#444" : "white",
            fontWeight: 600, fontSize: 14, cursor: loginLoading || !password.trim() ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
            {loginLoading ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Signing in...</> : "Sign In"}
          </button>
        </div>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── ADMIN GALLERY ──
  return (
    <div style={{
      minHeight: "100vh", background: "#0a0a0a", color: "#fff",
      fontFamily: "Inter,-apple-system,sans-serif",
    }}>
      {/* Header */}
      <div style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(10,10,10,0.95)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid #1a1a1a",
        padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Shield size={18} color="#4d9fff" />
          <span style={{ fontWeight: 700, fontSize: 16 }}>Admin Panel</span>
          <span style={{ fontSize: 12, color: "#555", background: "#161616", padding: "2px 10px", borderRadius: 20, border: "1px solid #222" }}>
            {visibleImages.length} images
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {selected.size > 0 && (
            <button onClick={bulkDelete} disabled={bulkDeleting} style={{
              display: "flex", alignItems: "center", gap: 6, padding: "8px 16px",
              background: "#ff3b3022", border: "1px solid #ff3b3044", borderRadius: 8,
              color: "#ff6b6b", fontWeight: 600, fontSize: 13, cursor: "pointer",
            }}>
              {bulkDeleting
                ? <><Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> Hiding...</>
                : <><Trash2 size={13} /> Hide {selected.size} selected</>}
            </button>
          )}
          <button onClick={() => fetchImages(1)} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "8px 12px",
            background: "#161616", border: "1px solid #2a2a2a", borderRadius: 8,
            color: "#888", fontSize: 13, cursor: "pointer",
          }}>
            <RefreshCw size={13} /> Refresh
          </button>
          <button onClick={logout} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "8px 14px",
            background: "#161616", border: "1px solid #2a2a2a", borderRadius: 8,
            color: "#666", fontSize: 13, cursor: "pointer",
          }}>
            <LogOut size={13} /> Logout
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div style={{ padding: "16px 24px", background: "#0f0f0f", borderBottom: "1px solid #161616" }}>
        <p style={{ fontSize: 13, color: "#555" }}>
          Click images to select • Click <Trash2 size={11} style={{ display: "inline", verticalAlign: "middle" }} /> to hide individually •
          Select multiple and use "Hide selected" to bulk remove • Hidden images disappear from the public gallery immediately
        </p>
      </div>

      {/* Image Grid */}
      <div style={{ padding: "20px 24px 120px", columns: "5 200px", gap: 8 }}>
        {visibleImages.map(img => (
          <div
            key={img.id}
            onClick={() => toggleSelect(img.id)}
            style={{
              breakInside: "avoid", marginBottom: 8, position: "relative",
              borderRadius: 10, overflow: "hidden", cursor: "pointer",
              border: selected.has(img.id) ? "2.5px solid #ff3b30" : "2.5px solid transparent",
              opacity: deleting === img.id ? 0.4 : 1,
              transition: "border-color 0.15s, opacity 0.2s",
            }}
          >
            <img
              src={img.imageUrl}
              alt={img.prompt?.slice(0, 40) || "image"}
              style={{ width: "100%", display: "block", borderRadius: 8 }}
              loading="lazy"
            />

            {/* Selection overlay */}
            {selected.has(img.id) && (
              <div style={{
                position: "absolute", inset: 0, background: "rgba(255,59,48,0.18)",
                display: "flex", alignItems: "flex-start", justifyContent: "flex-end", padding: 8,
                borderRadius: 8,
              }}>
                <div style={{
                  width: 24, height: 24, borderRadius: "50%", background: "#ff3b30",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Check size={13} color="white" />
                </div>
              </div>
            )}

            {/* Delete button (always visible on hover) */}
            <div className="admin-actions" style={{
              position: "absolute", bottom: 6, right: 6,
              display: "flex", gap: 5,
            }}>
              <button
                onClick={e => { e.stopPropagation(); deleteImage(img.id); }}
                disabled={deleting === img.id}
                style={{
                  width: 30, height: 30, borderRadius: 8, border: "none",
                  background: "rgba(255,59,48,0.85)", backdropFilter: "blur(4px)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", color: "white",
                }}
                title="Hide from gallery"
              >
                {deleting === img.id
                  ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
                  : <X size={13} />}
              </button>
            </div>

            {/* Filename label */}
            <div style={{
              position: "absolute", bottom: 0, left: 0, right: 0,
              background: "linear-gradient(transparent, rgba(0,0,0,0.7))",
              padding: "20px 8px 6px",
              fontSize: 9, color: "rgba(255,255,255,0.55)",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {img.id}
            </div>
          </div>
        ))}
      </div>

      {/* Loader */}
      <div ref={loaderRef} style={{ height: 60, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {loadingGallery && <Loader2 size={16} color="#333" style={{ animation: "spin 1s linear infinite" }} />}
        {!hasMore && images.length > 0 && <span style={{ color: "#333", fontSize: 12 }}>All images loaded</span>}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 32, left: "50%", transform: "translateX(-50%)",
          background: "#1a1a1e", border: "1px solid #333", borderRadius: 10,
          padding: "12px 20px", fontSize: 13, color: "#ccc",
          boxShadow: "0 8px 32px rgba(0,0,0,0.6)", zIndex: 999,
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <Check size={14} color="#4dff91" /> {toast}
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #0a0a0a; }
        .admin-actions { opacity: 0; transition: opacity 0.15s; }
        div:hover > .admin-actions { opacity: 1; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: #0a0a0a; }
        ::-webkit-scrollbar-thumb { background: #222; border-radius: 3px; }
      `}</style>
    </div>
  );
}
