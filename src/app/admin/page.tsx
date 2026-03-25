"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Trash2, LogOut, Shield, Eye, EyeOff, Loader2, Check, X,
  AlertTriangle, RefreshCw, CheckCircle, XCircle, Clock,
  Zap, LayoutGrid, List, ChevronLeft, ChevronRight
} from "lucide-react";

interface AdminImage {
  id: string;
  imageUrl: string;
  prompt: string;
  model: string;
}

interface QCItem {
  filename: string;
  status: "pending";
  imageUrl: string;
}

type Tab = "gallery" | "qc";
type ViewMode = "grid" | "swipe";

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Tab
  const [tab, setTab] = useState<Tab>("gallery");

  // Gallery state
  const [images, setImages] = useState<AdminImage[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingGallery, setLoadingGallery] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [hiding, setHiding] = useState<string | null>(null);
  const [bulkHiding, setBulkHiding] = useState(false);

  // QC state
  const [qcItems, setQcItems] = useState<QCItem[]>([]);
  const [qcTotal, setQcTotal] = useState(0);
  const [loadingQC, setLoadingQC] = useState(false);
  const [qcView, setQcView] = useState<ViewMode>("grid");
  const [swipeIndex, setSwipeIndex] = useState(0);
  const [qcProcessing, setQcProcessing] = useState<string | null>(null);
  const [qcSelected, setQcSelected] = useState<Set<string>>(new Set());
  const [qcBulkWorking, setQcBulkWorking] = useState(false);
  const [qcStats, setQcStats] = useState({ approved: 0, rejected: 0 });

  // SSE / real-time
  const sseRef = useRef<EventSource | null>(null);

  // Toast
  const [toast, setToast] = useState<{ msg: string; kind: "ok" | "err" | "info" } | null>(null);
  const showToast = (msg: string, kind: "ok" | "err" | "info" = "ok") => {
    setToast({ msg, kind });
    setTimeout(() => setToast(null), 3500);
  };

  const loaderRef = useRef<HTMLDivElement>(null);
  const fetchingRef = useRef(false);
  const pageRef = useRef(1);

  // ── Auth ──────────────────────────────────────────────────────────────────
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
      if (res.ok) setAuthed(true);
      else setLoginError("Invalid password");
    } catch { setLoginError("Connection error"); }
    setLoginLoading(false);
  };

  const logout = async () => {
    await fetch('/api/admin', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'logout' }),
    });
    setAuthed(false);
    setImages([]); setSelected(new Set());
    sseRef.current?.close();
  };

  // ── SSE Real-time ─────────────────────────────────────────────────────────
  const connectSSE = useCallback(() => {
    sseRef.current?.close();
    const es = new EventSource('/api/gallery/events');

    es.addEventListener('approved', (e) => {
      try {
        const { filename } = JSON.parse(e.data);
        showToast(`✅ Approved: ${filename.slice(0, 30)}`, 'ok');
        // Remove from QC grid immediately
        setQcItems(prev => prev.filter(i => i.filename !== filename));
        setQcTotal(prev => Math.max(0, prev - 1));
      } catch {}
    });

    es.addEventListener('rejected', (e) => {
      try {
        const { filename } = JSON.parse(e.data);
        setQcItems(prev => prev.filter(i => i.filename !== filename));
        setQcTotal(prev => Math.max(0, prev - 1));
      } catch {}
    });

    es.addEventListener('removed', (e) => {
      try {
        const { filename } = JSON.parse(e.data);
        setImages(prev => prev.filter(img => img.id !== filename));
        showToast(`Hidden: ${filename.slice(0, 30)}`, 'info');
      } catch {}
    });

    es.addEventListener('bulk-removed', (e) => {
      try {
        const { filenames, count } = JSON.parse(e.data);
        const fnSet = new Set(filenames as string[]);
        setImages(prev => prev.filter(img => !fnSet.has(img.id)));
        showToast(`Hidden ${count} images`, 'info');
      } catch {}
    });

    es.addEventListener('bulk-approved', (e) => {
      try {
        const { filenames, count } = JSON.parse(e.data);
        const fnSet = new Set(filenames as string[]);
        setQcItems(prev => prev.filter(i => !fnSet.has(i.filename)));
        setQcTotal(prev => Math.max(0, prev - count));
        showToast(`✅ Approved ${count} images`, 'ok');
      } catch {}
    });

    es.addEventListener('reload', () => {
      fetchImages(1);
    });

    es.onerror = () => {
      setTimeout(connectSSE, 5000);
    };

    sseRef.current = es;
  }, []);

  useEffect(() => {
    if (authed) {
      connectSSE();
      return () => { sseRef.current?.close(); };
    }
  }, [authed, connectSSE]);

  // ── Gallery fetch ─────────────────────────────────────────────────────────
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
    if (authed && tab === "gallery") fetchImages(1);
  }, [authed, tab, fetchImages]);

  // Infinite scroll
  useEffect(() => {
    if (!authed) return;
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !fetchingRef.current) {
        fetchImages(pageRef.current + 1);
      }
    }, { threshold: 0.1 });
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [authed, hasMore, fetchImages]);

  // ── Gallery actions ───────────────────────────────────────────────────────
  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const hideImage = async (filename: string) => {
    setHiding(filename);
    try {
      await fetch('/api/admin', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'hide', filename }),
      });
      setImages(prev => prev.filter(img => img.id !== filename));
      setHidden(prev => new Set([...prev, filename]));
      showToast('Hidden from gallery', 'info');
    } catch { showToast('Failed to hide', 'err'); }
    setHiding(null);
  };

  const bulkHide = async () => {
    if (selected.size === 0) return;
    setBulkHiding(true);
    const filenames = [...selected];
    try {
      await fetch('/api/admin', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'bulk-hide', filenames }),
      });
      setImages(prev => prev.filter(img => !selected.has(img.id)));
      setSelected(new Set());
      showToast(`Hidden ${filenames.length} images`, 'info');
    } catch { showToast('Bulk hide failed', 'err'); }
    setBulkHiding(false);
  };

  // ── QC fetch ──────────────────────────────────────────────────────────────
  const fetchQC = useCallback(async () => {
    setLoadingQC(true);
    try {
      const res = await fetch('/api/admin', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'qc-queue', limit: 100 }),
      });
      const data = await res.json();
      setQcItems(data.items || []);
      setQcTotal(data.total || 0);
    } catch { }
    setLoadingQC(false);
  }, []);

  useEffect(() => {
    if (authed && tab === "qc") { fetchQC(); setSwipeIndex(0); }
  }, [authed, tab, fetchQC]);

  // ── QC actions ────────────────────────────────────────────────────────────
  const qcApprove = async (filename: string) => {
    setQcProcessing(filename);
    try {
      await fetch('/api/admin', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'qc-approve', filename }),
      });
      setQcItems(prev => prev.filter(i => i.filename !== filename));
      setQcTotal(prev => Math.max(0, prev - 1));
      setQcStats(s => ({ ...s, approved: s.approved + 1 }));
      setSwipeIndex(prev => Math.min(prev, qcItems.length - 2));
      showToast('✅ Approved — live in gallery!', 'ok');
    } catch { showToast('Approve failed', 'err'); }
    setQcProcessing(null);
  };

  const qcReject = async (filename: string) => {
    setQcProcessing(filename);
    try {
      await fetch('/api/admin', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'qc-reject', filename }),
      });
      setQcItems(prev => prev.filter(i => i.filename !== filename));
      setQcTotal(prev => Math.max(0, prev - 1));
      setQcStats(s => ({ ...s, rejected: s.rejected + 1 }));
      setSwipeIndex(prev => Math.min(prev, qcItems.length - 2));
      showToast('❌ Rejected', 'info');
    } catch { showToast('Reject failed', 'err'); }
    setQcProcessing(null);
  };

  const qcToggleSelect = (fn: string) => {
    setQcSelected(prev => {
      const next = new Set(prev);
      next.has(fn) ? next.delete(fn) : next.add(fn);
      return next;
    });
  };

  const qcApproveAll = async () => {
    if (qcItems.length === 0) return;
    setQcBulkWorking(true);
    const filenames = qcItems.map(i => i.filename);
    try {
      await fetch('/api/admin', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'qc-approve-bulk', filenames }),
      });
      setQcStats(s => ({ ...s, approved: s.approved + filenames.length }));
      setQcItems([]);
      setQcTotal(0);
      showToast(`✅ All ${filenames.length} approved — live in gallery!`, 'ok');
    } catch { showToast('Bulk approve failed', 'err'); }
    setQcBulkWorking(false);
  };

  const qcApproveSelected = async () => {
    if (qcSelected.size === 0) return;
    setQcBulkWorking(true);
    const filenames = [...qcSelected];
    try {
      await fetch('/api/admin', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'qc-approve-bulk', filenames }),
      });
      setQcStats(s => ({ ...s, approved: s.approved + filenames.length }));
      setQcItems(prev => prev.filter(i => !qcSelected.has(i.filename)));
      setQcTotal(prev => Math.max(0, prev - filenames.length));
      setQcSelected(new Set());
      showToast(`✅ ${filenames.length} approved — live!`, 'ok');
    } catch { showToast('Bulk approve failed', 'err'); }
    setQcBulkWorking(false);
  };

  // Keyboard shortcuts (swipe mode)
  useEffect(() => {
    if (!authed || tab !== 'qc' || qcView !== 'swipe') return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'a') {
        const item = qcItems[swipeIndex];
        if (item) qcApprove(item.filename);
      } else if (e.key === 'ArrowLeft' || e.key === 'r') {
        const item = qcItems[swipeIndex];
        if (item) qcReject(item.filename);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [authed, tab, qcView, qcItems, swipeIndex]);

  const visibleImages = images.filter(img => !hidden.has(img.id));
  const currentQcItem = qcItems[swipeIndex];

  // ── LOGIN SCREEN ──────────────────────────────────────────────────────────
  if (authed === null) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 size={24} color="#333" style={{ animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!authed) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 340, background: "#111", borderRadius: 16, padding: "32px 28px", border: "1px solid #1e1e1e" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
            <Shield size={20} color="#4d9fff" />
            <span style={{ fontWeight: 700, fontSize: 18, color: "#fff" }}>Lumen Admin</span>
          </div>
          <div style={{ position: "relative", marginBottom: 12 }}>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && login()}
              placeholder="Admin password"
              style={{ width: "100%", padding: "11px 40px 11px 14px", background: "#161616", border: "1px solid #2a2a2a", borderRadius: 10, color: "#ddd", fontSize: 14, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
              autoFocus
            />
            <button onClick={() => setShowPassword(v => !v)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#555", padding: 4 }}>
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {loginError && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#ff6b6b", fontSize: 13, marginBottom: 12 }}>
              <AlertTriangle size={14} /> {loginError}
            </div>
          )}
          <button onClick={login} disabled={loginLoading || !password.trim()} style={{ width: "100%", padding: "11px", borderRadius: 10, border: "none", background: loginLoading || !password.trim() ? "#1e1e1e" : "#0066ff", color: loginLoading || !password.trim() ? "#444" : "white", fontWeight: 600, fontSize: 14, cursor: loginLoading || !password.trim() ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {loginLoading ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Signing in...</> : "Sign In"}
          </button>
        </div>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── ADMIN PANEL ───────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#fff", fontFamily: "Inter,-apple-system,sans-serif" }}>

      {/* Header */}
      <div style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(10,10,10,0.97)", backdropFilter: "blur(12px)", borderBottom: "1px solid #1a1a1a", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Shield size={16} color="#4d9fff" />
            <span style={{ fontWeight: 700, fontSize: 15 }}>Admin</span>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 4, background: "#161616", borderRadius: 8, padding: 3, border: "1px solid #222" }}>
            {(["gallery", "qc"] as Tab[]).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding: "5px 14px", borderRadius: 6, border: "none",
                background: tab === t ? "#0066ff" : "transparent",
                color: tab === t ? "white" : "#666",
                fontWeight: tab === t ? 600 : 400, fontSize: 13, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6,
              }}>
                {t === "gallery" ? (
                  <><LayoutGrid size={12} /> Gallery {visibleImages.length > 0 && <span style={{ fontSize: 11, opacity: 0.7 }}>{visibleImages.length}</span>}</>
                ) : (
                  <><Clock size={12} /> QC Review {qcTotal > 0 && <span style={{ background: "#ff6b00", color: "white", borderRadius: 10, padding: "1px 7px", fontSize: 10, fontWeight: 700 }}>{qcTotal}</span>}</>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Right actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* SSE live indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#4dff91" }}>
            <Zap size={11} />
            <span>Live</span>
          </div>

          {tab === "gallery" && selected.size > 0 && (
            <button onClick={bulkHide} disabled={bulkHiding} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "#ff3b3022", border: "1px solid #ff3b3044", borderRadius: 8, color: "#ff6b6b", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
              {bulkHiding ? <><Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> Hiding...</> : <><Trash2 size={13} /> Hide {selected.size}</>}
            </button>
          )}

          {tab === "gallery" && (
            <button onClick={() => fetchImages(1)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", background: "#161616", border: "1px solid #2a2a2a", borderRadius: 8, color: "#888", fontSize: 13, cursor: "pointer" }}>
              <RefreshCw size={13} />
            </button>
          )}

          {tab === "qc" && (
            <>
              <button onClick={() => setQcView(v => v === "grid" ? "swipe" : "grid")} style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", background: "#161616", border: "1px solid #2a2a2a", borderRadius: 8, color: "#888", fontSize: 13, cursor: "pointer" }}>
                {qcView === "grid" ? <><List size={13} /> Swipe</> : <><LayoutGrid size={13} /> Grid</>}
              </button>
              <button onClick={fetchQC} style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", background: "#161616", border: "1px solid #2a2a2a", borderRadius: 8, color: "#888", fontSize: 13, cursor: "pointer" }}>
                <RefreshCw size={13} />
              </button>
            </>
          )}

          <button onClick={logout} style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", background: "#161616", border: "1px solid #2a2a2a", borderRadius: 8, color: "#555", fontSize: 13, cursor: "pointer" }}>
            <LogOut size={13} />
          </button>
        </div>
      </div>

      {/* ── GALLERY TAB ── */}
      {tab === "gallery" && (
        <>
          <div style={{ padding: "12px 20px", background: "#0d0d0d", borderBottom: "1px solid #141414" }}>
            <p style={{ fontSize: 12, color: "#444", margin: 0 }}>
              Click to select · <Trash2 size={10} style={{ display: "inline", verticalAlign: "middle" }} /> hide individually · changes reflect in gallery in real time via SSE
            </p>
          </div>
          <div style={{ padding: "16px 20px 120px", columns: "5 180px", gap: 8 }}>
            {visibleImages.map(img => (
              <div key={img.id} onClick={() => toggleSelect(img.id)} style={{
                breakInside: "avoid", marginBottom: 8, position: "relative",
                borderRadius: 10, overflow: "hidden", cursor: "pointer",
                border: selected.has(img.id) ? "2.5px solid #0066ff" : "2.5px solid transparent",
                opacity: hiding === img.id ? 0.3 : 1,
                transition: "border-color 0.15s, opacity 0.2s",
              }}>
                <img src={img.imageUrl} alt={img.prompt?.slice(0, 40) || "image"} style={{ width: "100%", display: "block", borderRadius: 8 }} loading="lazy" />
                {selected.has(img.id) && (
                  <div style={{ position: "absolute", inset: 0, background: "rgba(0,102,255,0.15)", display: "flex", alignItems: "flex-start", justifyContent: "flex-end", padding: 8 }}>
                    <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#0066ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Check size={12} color="white" />
                    </div>
                  </div>
                )}
                <div className="img-actions" style={{ position: "absolute", bottom: 6, right: 6 }}>
                  <button onClick={e => { e.stopPropagation(); hideImage(img.id); }} disabled={hiding === img.id} style={{ width: 28, height: 28, borderRadius: 7, border: "none", background: "rgba(255,59,48,0.85)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "white" }} title="Hide from gallery">
                    {hiding === img.id ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> : <X size={12} />}
                  </button>
                </div>
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(transparent,rgba(0,0,0,0.6))", padding: "16px 8px 5px", fontSize: 9, color: "rgba(255,255,255,0.45)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {img.id}
                </div>
              </div>
            ))}
          </div>
          <div ref={loaderRef} style={{ height: 60, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {loadingGallery && <Loader2 size={16} color="#333" style={{ animation: "spin 1s linear infinite" }} />}
            {!hasMore && visibleImages.length > 0 && <span style={{ color: "#2a2a2a", fontSize: 11 }}>All images loaded</span>}
          </div>
        </>
      )}

      {/* ── QC REVIEW TAB ── */}
      {tab === "qc" && (
        <div style={{ padding: "0 0 100px" }}>
          {/* QC Stats bar */}
          <div style={{ padding: "12px 20px", background: "#0d0d0d", borderBottom: "1px solid #141414", display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
              <Clock size={14} color="#888" />
              <span style={{ color: "#666" }}>Pending:</span>
              <span style={{ color: "#ff9500", fontWeight: 700 }}>{qcTotal}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
              <CheckCircle size={14} color="#4dff91" />
              <span style={{ color: "#666" }}>Approved this session:</span>
              <span style={{ color: "#4dff91", fontWeight: 700 }}>{qcStats.approved}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
              <XCircle size={14} color="#ff6b6b" />
              <span style={{ color: "#666" }}>Rejected:</span>
              <span style={{ color: "#ff6b6b", fontWeight: 700 }}>{qcStats.rejected}</span>
            </div>
            <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
              {qcSelected.size > 0 && (
                <button onClick={qcApproveSelected} disabled={qcBulkWorking} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", background: "#4dff9122", border: "1px solid #4dff9144", borderRadius: 8, color: "#4dff91", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                  {qcBulkWorking ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <CheckCircle size={13} />}
                  Approve {qcSelected.size} selected
                </button>
              )}
              {qcItems.length > 0 && qcSelected.size === 0 && (
                <button onClick={qcApproveAll} disabled={qcBulkWorking} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", background: "#0066ff22", border: "1px solid #0066ff44", borderRadius: 8, color: "#4d9fff", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                  {qcBulkWorking ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Zap size={13} />}
                  Approve All {qcItems.length}
                </button>
              )}
            </div>
          </div>

          {loadingQC && (
            <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
              <Loader2 size={24} color="#333" style={{ animation: "spin 1s linear infinite" }} />
            </div>
          )}

          {!loadingQC && qcItems.length === 0 && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 20px", color: "#333" }}>
              <CheckCircle size={40} color="#1e3a20" />
              <p style={{ marginTop: 16, fontSize: 16, color: "#3a3a3a" }}>Queue is clear!</p>
              <p style={{ fontSize: 13, color: "#2a2a2a", marginTop: 4 }}>All images reviewed.</p>
            </div>
          )}

          {/* SWIPE MODE */}
          {!loadingQC && qcItems.length > 0 && qcView === "swipe" && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 20px" }}>
              <p style={{ fontSize: 12, color: "#444", marginBottom: 16 }}>
                ← Reject &nbsp;|&nbsp; Approve → &nbsp; · &nbsp; {swipeIndex + 1} / {qcItems.length}
              </p>
              {currentQcItem && (
                <div style={{ maxWidth: 520, width: "100%", position: "relative" }}>
                  <img
                    src={currentQcItem.imageUrl}
                    alt={currentQcItem.filename}
                    style={{ width: "100%", borderRadius: 14, display: "block", boxShadow: "0 8px 40px rgba(0,0,0,0.6)" }}
                  />
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(transparent,rgba(0,0,0,0.8))", padding: "24px 16px 14px", borderRadius: "0 0 14px 14px" }}>
                    <p style={{ fontSize: 11, color: "#888", margin: 0 }}>{currentQcItem.filename}</p>
                  </div>
                </div>
              )}
              <div style={{ display: "flex", gap: 16, marginTop: 20 }}>
                <button
                  onClick={() => currentQcItem && qcReject(currentQcItem.filename)}
                  disabled={!!qcProcessing}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 32px", background: "#ff3b3022", border: "1.5px solid #ff3b3055", borderRadius: 12, color: "#ff6b6b", fontWeight: 700, fontSize: 15, cursor: "pointer", minWidth: 140, justifyContent: "center" }}
                >
                  <ChevronLeft size={18} /> Reject
                </button>
                <button
                  onClick={() => currentQcItem && qcApprove(currentQcItem.filename)}
                  disabled={!!qcProcessing}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 32px", background: "#4dff9122", border: "1.5px solid #4dff9155", borderRadius: 12, color: "#4dff91", fontWeight: 700, fontSize: 15, cursor: "pointer", minWidth: 140, justifyContent: "center" }}
                >
                  Approve <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* GRID MODE */}
          {!loadingQC && qcItems.length > 0 && qcView === "grid" && (
            <div style={{ padding: "16px 20px", columns: "5 180px", gap: 8 }}>
              {qcItems.map(item => (
                <div
                  key={item.filename}
                  onClick={() => qcToggleSelect(item.filename)}
                  style={{
                    breakInside: "avoid", marginBottom: 8, position: "relative",
                    borderRadius: 10, overflow: "hidden", cursor: "pointer",
                    border: qcSelected.has(item.filename) ? "2.5px solid #4dff91" : "2.5px solid #1a1a1a",
                    opacity: qcProcessing === item.filename ? 0.3 : 1,
                    transition: "border-color 0.15s, opacity 0.2s",
                  }}
                >
                  <img src={item.imageUrl} alt={item.filename} style={{ width: "100%", display: "block", borderRadius: 8 }} loading="lazy" />
                  {qcSelected.has(item.filename) && (
                    <div style={{ position: "absolute", top: 8, right: 8, width: 22, height: 22, borderRadius: "50%", background: "#4dff91", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Check size={12} color="#000" />
                    </div>
                  )}
                  {/* Approve/Reject quick buttons */}
                  <div className="qc-actions" style={{ position: "absolute", bottom: 6, left: 6, right: 6, display: "flex", gap: 4 }}>
                    <button
                      onClick={e => { e.stopPropagation(); qcApprove(item.filename); }}
                      disabled={!!qcProcessing}
                      style={{ flex: 1, padding: "6px 0", borderRadius: 7, border: "none", background: "rgba(77,255,145,0.85)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#000", fontWeight: 700, fontSize: 11 }}
                      title="Approve → live in gallery"
                    >
                      {qcProcessing === item.filename ? <Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} /> : <><Check size={11} /> OK</>}
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); qcReject(item.filename); }}
                      disabled={!!qcProcessing}
                      style={{ flex: 1, padding: "6px 0", borderRadius: 7, border: "none", background: "rgba(255,59,48,0.85)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "white", fontWeight: 700, fontSize: 11 }}
                      title="Reject"
                    >
                      <X size={11} /> No
                    </button>
                  </div>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, background: "linear-gradient(rgba(0,0,0,0.5),transparent)", padding: "6px 8px" }}>
                    <span style={{ fontSize: 8, color: "rgba(255,165,0,0.9)", fontWeight: 600, background: "rgba(0,0,0,0.4)", padding: "2px 6px", borderRadius: 4 }}>PENDING QC</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)",
          background: "#111", border: `1px solid ${toast.kind === 'ok' ? '#2a4a2a' : toast.kind === 'err' ? '#4a2a2a' : '#2a2a2a'}`,
          borderRadius: 10, padding: "10px 18px", fontSize: 13,
          color: toast.kind === 'ok' ? '#4dff91' : toast.kind === 'err' ? '#ff6b6b' : '#888',
          boxShadow: "0 8px 32px rgba(0,0,0,0.7)", zIndex: 9999,
          display: "flex", alignItems: "center", gap: 8,
        }}>
          {toast.kind === 'ok' ? <Check size={14} /> : toast.kind === 'err' ? <AlertTriangle size={14} /> : <Clock size={14} />}
          {toast.msg}
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #0a0a0a; }
        .img-actions { opacity: 0; transition: opacity 0.15s; }
        div:hover > .img-actions { opacity: 1; }
        .qc-actions { opacity: 0; transition: opacity 0.15s; }
        div:hover > .qc-actions { opacity: 1; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: #0a0a0a; }
        ::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 3px; }
      `}</style>
    </div>
  );
}
