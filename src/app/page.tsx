"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Compass, Diamond, Archive, ChevronDown,
  Loader2, Download, Heart, Copy, Check, Sparkles,
  Image as ImageIcon, Plus, Wand2, ChevronLeft, ChevronRight, X
} from "lucide-react";

interface GalleryImage {
  id: string;
  imageUrl: string;
  prompt: string;
  model: string;
}

const MODELS = [
  { id: "realvis", label: "RealVis XL" },
  { id: "flux-dev", label: "FLUX.1 Dev" },
  { id: "flux-schnell", label: "FLUX Schnell" },
  { id: "sdxl", label: "SDXL" },
];

const GAP = 6;

function getCols(w: number) {
  if (w >= 1400) return 5;
  if (w >= 1100) return 4;
  if (w >= 750) return 3;
  if (w >= 480) return 2;
  return 2;
}

// Dreamina renders images at FULL natural height — no crop, no objectFit cover.
// Stagger comes from images having genuinely different aspect ratios.
// Auto-gen v3 now outputs mixed sizes (portrait/landscape/square).
// For existing uniform images, we use stable placeholder ratios until real sizes load.

const PLACEHOLDER_ARS = [1.4, 0.7, 1.6, 1.0, 0.8, 1.5, 1.1, 0.75, 1.55, 0.9, 1.35, 1.65, 0.65, 1.2, 1.45];

function MasonryGrid({
  images,
  onSelect,
  liked,
  onLike,
}: {
  images: GalleryImage[];
  onSelect: (idx: number) => void;
  liked: Set<string>;
  onLike: (id: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const aspectMap = useRef<Record<string, number>>({});
  const [containerWidth, setContainerWidth] = useState(0);
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const update = () => {
      if (containerRef.current) setContainerWidth(containerRef.current.offsetWidth);
    };
    update();
    const ro = new ResizeObserver(update);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const handleLoad = useCallback((id: string, el: HTMLImageElement) => {
    if (el.naturalWidth && el.naturalHeight) {
      const ar = el.naturalHeight / el.naturalWidth;
      if (Math.abs((aspectMap.current[id] ?? 0) - ar) > 0.01) {
        aspectMap.current[id] = ar;
        forceUpdate(n => n + 1);
      }
    }
  }, []);

  // Compute layout inline (no state — runs on every render, instant)
  const numCols = getCols(containerWidth || 1000);
  const colW = containerWidth ? Math.floor((containerWidth - GAP * (numCols - 1)) / numCols) : 200;
  const colHeights = new Array(numCols).fill(0);
  const positions: { x: number; y: number; w: number; h: number }[] = [];

  images.forEach((img, idx) => {
    const ar = aspectMap.current[img.id] ?? PLACEHOLDER_ARS[idx % PLACEHOLDER_ARS.length];
    const h = Math.round(colW * ar);
    const minCol = colHeights.indexOf(Math.min(...colHeights));
    positions.push({ x: minCol * (colW + GAP), y: colHeights[minCol], w: colW, h });
    colHeights[minCol] += h + GAP;
  });

  const containerH = Math.max(...colHeights, 0);

  return (
    <div
      ref={containerRef}
      style={{ position: "relative", width: "100%", height: containerH || undefined, minHeight: 400 }}
    >
      {images.map((img, idx) => {
        const pos = positions[idx];
        return (
          <div
            key={img.id}
            className="gallery-card"
            onClick={() => onSelect(idx)}
            style={{
              position: "absolute",
              left: pos.x,
              top: pos.y,
              width: pos.w,
              height: pos.h,
              borderRadius: 8,
              overflow: "hidden",
              background: "#161616",
              cursor: "pointer",
            }}
          >
            <img
              src={img.imageUrl}
              alt={img.prompt ? img.prompt.slice(0, 60) : "AI image"}
              onLoad={e => handleLoad(img.id, e.currentTarget)}
              onError={e => {
                const card = (e.target as HTMLImageElement).closest(".gallery-card") as HTMLElement;
                if (card) card.style.display = "none";
              }}
              style={{
                width: "100%",
                height: "100%",
                display: "block",
                // Dreamina: objectFit contain — shows FULL image, black bars if aspect doesn't match
                objectFit: "contain",
                objectPosition: "center center",
                background: "#161616",
              }}
            />
            <div className="gallery-overlay">
              <button
                className="like-btn"
                onClick={e => { e.stopPropagation(); onLike(img.id); }}
              >
                <Heart size={12} color="white" fill={liked.has(img.id) ? "white" : "none"} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function HomePage() {
  const [activeNav, setActiveNav] = useState<"explore" | "create">("explore");
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState("realvis");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<"trends" | "shorts">("trends");

  const [images, setImages] = useState<GalleryImage[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingGallery, setLoadingGallery] = useState(false);
  const [galleryError, setGalleryError] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const pageRef = useRef(1);
  const fetchingRef = useRef(false);

  // Floating bar state
  const [floatingExpanded, setFloatingExpanded] = useState(false);
  const floatingRef = useRef<HTMLDivElement>(null);

  // Detail view state
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const fetchGallery = useCallback(async (p: number, reset = false, retries = 2) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setLoadingGallery(true);
    setGalleryError(false);
    let lastError: Error | null = null;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 20000);
        const res = await fetch(`/api/gallery?page=${p}&limit=50`, { signal: controller.signal });
        clearTimeout(timeout);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const imgs = data.images || [];
        if (reset || p === 1) {
          setImages(imgs);
        } else {
          setImages(prev => [...prev, ...imgs]);
        }
        setHasMore(data.hasMore ?? false);
        setPage(p);
        pageRef.current = p;
        setLoadingGallery(false);
        fetchingRef.current = false;
        return;
      } catch (e) {
        lastError = e as Error;
        if (attempt < retries) await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
      }
    }
    console.error("Gallery fetch failed:", lastError);
    setGalleryError(true);
    setLoadingGallery(false);
    fetchingRef.current = false;
  }, []);

  useEffect(() => { fetchGallery(1, true); }, []); // eslint-disable-line

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !fetchingRef.current) {
        fetchGallery(pageRef.current + 1);
      }
    }, { rootMargin: "1200px" });
    if (loaderRef.current) observerRef.current.observe(loaderRef.current);
    return () => observerRef.current?.disconnect();
  }, [hasMore, fetchGallery]);

  // Close floating bar on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (floatingRef.current && !floatingRef.current.contains(e.target as Node)) {
        setFloatingExpanded(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Keyboard nav for detail view
  useEffect(() => {
    if (selectedIdx === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedIdx(null);
      if (e.key === "ArrowLeft") setSelectedIdx(i => i !== null && i > 0 ? i - 1 : i);
      if (e.key === "ArrowRight") setSelectedIdx(i => i !== null && i < images.length - 1 ? i + 1 : i);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedIdx, images.length]);

  const generate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setError("");
    setGeneratedImage(null);
    setProgress("Submitting...");
    setFloatingExpanded(false);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, model }),
      });
      const { promptId, error: err } = await res.json();
      if (err || !promptId) { setError(err || "Failed to start"); setIsGenerating(false); return; }
      setProgress("Generating...");
      const start = Date.now();
      while (Date.now() - start < 600000) {
        await new Promise(r => setTimeout(r, 3000));
        const poll = await fetch(`/api/generate?promptId=${promptId}`).then(r => r.json());
        if (poll.status === "complete" && poll.imageUrl) {
          setGeneratedImage(poll.imageUrl);
          setIsGenerating(false);
          setProgress("");
          return;
        }
        if (poll.status === "error") { setError("Generation failed. Try again."); setIsGenerating(false); return; }
        setProgress(`Generating... ${Math.round((Date.now() - start) / 1000)}s`);
      }
      setError("Timed out — try FLUX Schnell for faster results");
    } catch { setError("AI temporarily unavailable. Please try again."); }
    setIsGenerating(false);
    setProgress("");
  };

  const copyPrompt = (id: string, text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(id);
    setTimeout(() => setCopied(null), 1800);
  };

  const toggleLike = (id: string) => {
    setLiked(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  };

  const selectedImg = selectedIdx !== null ? images[selectedIdx] : null;

  return (
    <div style={{
      display: "flex", minHeight: "100vh", background: "#0a0a0a",
      fontFamily: "Inter,-apple-system,BlinkMacSystemFont,sans-serif", color: "#fff"
    }}>
      {/* Sidebar */}
      <aside style={{
        width: 64, background: "#111", borderRight: "1px solid #1c1c1c",
        display: "flex", flexDirection: "column", alignItems: "center",
        padding: "14px 0", position: "fixed", top: 0, bottom: 0, left: 0, zIndex: 50
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: "linear-gradient(135deg, #0066ff, #00aaff)",
          display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16
        }}>
          <Sparkles size={17} color="white" />
        </div>
        {(["explore", "create"] as const).map(nav => {
          const Icon = nav === "explore" ? Compass : Diamond;
          return (
            <button key={nav} onClick={() => setActiveNav(nav)} title={nav}
              style={{
                width: 52, height: 52, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: 3,
                border: "none", borderRadius: 10,
                background: activeNav === nav ? "rgba(0,102,255,0.15)" : "transparent",
                cursor: "pointer", color: activeNav === nav ? "#4d9fff" : "#555",
              }}>
              <Icon size={19} />
              <span style={{ fontSize: 9.5, fontWeight: 500 }}>{nav.charAt(0).toUpperCase() + nav.slice(1)}</span>
            </button>
          );
        })}
        <button title="Assets" style={{
          width: 52, height: 52, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 3,
          border: "none", borderRadius: 10, background: "transparent", cursor: "pointer", color: "#444"
        }}>
          <Archive size={19} />
          <span style={{ fontSize: 9.5, fontWeight: 500 }}>Assets</span>
        </button>
      </aside>

      {/* Main content */}
      <main style={{ marginLeft: 64, flex: 1, overflowX: "hidden" }}>

        {activeNav === "explore" && (
          <>
            {/* Header */}
            <div style={{ textAlign: "center", padding: "28px 24px 16px" }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: "#fff", margin: 0, letterSpacing: -0.3 }}>
                Start Creating With <span style={{ color: "#4d9fff" }}>AI Image</span>
              </h1>
            </div>

            {/* Tabs */}
            <div style={{ padding: "0 20px 0", borderBottom: "1px solid #181818" }}>
              <div style={{ display: "flex" }}>
                {(["trends", "shorts"] as const).map(t => (
                  <button key={t} onClick={() => setTab(t)}
                    style={{
                      padding: "8px 16px", fontSize: 13.5,
                      fontWeight: tab === t ? 600 : 400,
                      color: tab === t ? "#fff" : "#555", background: "transparent", border: "none",
                      cursor: "pointer",
                      borderBottom: tab === t ? "2px solid #4d9fff" : "2px solid transparent"
                    }}>
                    {t === "trends" ? "Trends" : "AI Shorts"}
                  </button>
                ))}
              </div>
            </div>

            {/* Gallery */}
            {galleryError && images.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#444" }}>
                <p style={{ marginBottom: 6, fontSize: 14, color: "#666" }}>Gallery temporarily unavailable</p>
                <p style={{ marginBottom: 16, fontSize: 12, color: "#444" }}>The image server may be waking up — please retry in a moment</p>
                <button onClick={() => fetchGallery(1, true)}
                  style={{
                    padding: "8px 18px", borderRadius: 8, border: "1px solid #333",
                    background: "#161616", color: "#888", cursor: "pointer", fontSize: 13
                  }}>
                  🔄 Retry
                </button>
              </div>
            ) : (
              <div style={{ padding: "14px 8px 140px 8px" }}>
                {loadingGallery && images.length === 0 ? (
                  // Skeleton placeholders using CSS columns (fine for skeletons, no staggering needed)
                  <div style={{ columns: 5, columnGap: GAP }}>
                    {Array.from({ length: 25 }).map((_, i) => (
                      <div key={`sk-${i}`} style={{
                        breakInside: "avoid", marginBottom: GAP,
                        borderRadius: 8, background: "#161616",
                        height: [240, 320, 200, 280, 220, 360, 240, 300, 200, 320,
                          260, 340, 220, 290, 200, 310, 250, 380, 210, 280,
                          300, 240, 320, 200, 260][i],
                        animation: "pulse 1.6s ease-in-out infinite"
                      }} />
                    ))}
                  </div>
                ) : (
                  <MasonryGrid
                    images={images}
                    onSelect={setSelectedIdx}
                    liked={liked}
                    onLike={toggleLike}
                  />
                )}
              </div>
            )}

            <div ref={loaderRef} style={{ height: 50, display: "flex", alignItems: "center",
              justifyContent: "center", color: "#333", fontSize: 12 }}>
              {loadingGallery && images.length > 0 && <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />}
              {!hasMore && images.length > 0 && "✦ All caught up ✦"}
            </div>
          </>
        )}

        {activeNav === "create" && (
          <div style={{ maxWidth: 700, margin: "0 auto", width: "100%", padding: "40px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
              <Wand2 size={18} color="#4d9fff" />
              <h1 style={{ fontSize: 18, fontWeight: 700, color: "#fff", margin: 0 }}>AI Generator</h1>
            </div>
            <div style={{ background: "#111", border: "1px solid #1c1c1c", borderRadius: 14, padding: 20 }}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 11, color: "#555", marginBottom: 8,
                  fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6 }}>Model</label>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {MODELS.map(m => (
                    <button key={m.id} onClick={() => setModel(m.id)}
                      style={{
                        padding: "6px 14px", borderRadius: 8,
                        border: model === m.id ? "1.5px solid #0066ff" : "1.5px solid #1e1e1e",
                        background: model === m.id ? "rgba(0,102,255,0.1)" : "#161616",
                        color: model === m.id ? "#4d9fff" : "#555",
                        fontSize: 13, cursor: "pointer", fontWeight: 500
                      }}>
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 11, color: "#555", marginBottom: 8,
                  fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6 }}>Prompt</label>
                <textarea value={prompt} onChange={e => setPrompt(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && e.metaKey && generate()}
                  placeholder="Describe what you want to create in detail..."
                  style={{
                    width: "100%", minHeight: 110, resize: "vertical", background: "#161616",
                    border: "1px solid #1e1e1e", borderRadius: 10, padding: "10px 12px", color: "#ddd",
                    fontSize: 14, outline: "none", fontFamily: "inherit", lineHeight: 1.55
                  }} />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button onClick={generate} disabled={isGenerating || !prompt.trim()}
                  style={{
                    display: "flex", alignItems: "center", gap: 7, padding: "9px 22px",
                    background: isGenerating || !prompt.trim() ? "#1a1a1a" : "#0066ff",
                    border: "none", borderRadius: 10,
                    color: isGenerating || !prompt.trim() ? "#444" : "white",
                    fontWeight: 600, fontSize: 14, cursor: isGenerating || !prompt.trim() ? "not-allowed" : "pointer"
                  }}>
                  {isGenerating
                    ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Generating...</>
                    : <><Sparkles size={14} /> Generate</>}
                </button>
              </div>
              {progress && <div style={{ marginTop: 12, padding: "8px 12px", background: "#161616",
                borderRadius: 8, fontSize: 13, color: "#666", display: "flex", gap: 8, alignItems: "center" }}>
                <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> {progress}
              </div>}
              {error && <div style={{ marginTop: 12, padding: "8px 12px", background: "rgba(255,59,48,0.07)",
                borderRadius: 8, fontSize: 13, color: "#ff6b6b", border: "1px solid rgba(255,59,48,0.12)" }}>
                {error}
              </div>}
              {generatedImage && (
                <div style={{ marginTop: 16 }}>
                  <img src={generatedImage} alt="Generated"
                    style={{ maxWidth: "100%", borderRadius: 12, border: "1px solid #1e1e1e" }} />
                  <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                    <a href={generatedImage} download="generated.png"
                      style={{
                        display: "flex", alignItems: "center", gap: 6, padding: "7px 14px",
                        background: "#161616", border: "1px solid #2a2a2a", borderRadius: 8,
                        color: "#bbb", textDecoration: "none", fontSize: 13
                      }}>
                      <Download size={13} /> Download
                    </a>
                    <button onClick={() => setActiveNav("explore")}
                      style={{
                        padding: "7px 14px", background: "transparent", border: "1px solid #1e1e1e",
                        borderRadius: 8, color: "#555", fontSize: 13, cursor: "pointer"
                      }}>
                      ← Explore
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ===== DETAIL VIEW (Dreamina-style) ===== */}
      {selectedImg && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 200,
            background: "rgba(0,0,0,0.95)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
          onClick={() => setSelectedIdx(null)}
        >
          {/* Close */}
          <button onClick={() => setSelectedIdx(null)} style={{
            position: "absolute", top: 16, right: 16,
            width: 36, height: 36, borderRadius: "50%",
            border: "none", background: "rgba(255,255,255,0.1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "#ccc", zIndex: 10,
          }}>
            <X size={16} />
          </button>

          {/* Left arrow */}
          <button
            onClick={e => { e.stopPropagation(); setSelectedIdx(i => i !== null && i > 0 ? i - 1 : i); }}
            disabled={selectedIdx === 0}
            style={{
              position: "absolute", left: 20, top: "50%", transform: "translateY(-50%)",
              width: 44, height: 44, borderRadius: "50%", border: "none",
              background: selectedIdx === 0 ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.12)",
              color: selectedIdx === 0 ? "#333" : "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: selectedIdx === 0 ? "not-allowed" : "pointer",
              zIndex: 10, backdropFilter: "blur(8px)",
            }}>
            <ChevronLeft size={22} />
          </button>

          {/* Right arrow (stops before the detail panel) */}
          <button
            onClick={e => { e.stopPropagation(); setSelectedIdx(i => i !== null && i < images.length - 1 ? i + 1 : i); }}
            disabled={selectedIdx === images.length - 1}
            style={{
              position: "absolute", right: 376, top: "50%", transform: "translateY(-50%)",
              width: 44, height: 44, borderRadius: "50%", border: "none",
              background: selectedIdx === images.length - 1 ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.12)",
              color: selectedIdx === images.length - 1 ? "#333" : "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: selectedIdx === images.length - 1 ? "not-allowed" : "pointer",
              zIndex: 10, backdropFilter: "blur(8px)",
            }}>
            <ChevronRight size={22} />
          </button>

          {/* Image area */}
          <div style={{
            flex: 1, height: "100vh",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "24px 80px",
            marginRight: 360,
          }} onClick={e => e.stopPropagation()}>
            <img
              src={selectedImg.imageUrl}
              alt={selectedImg.prompt ? selectedImg.prompt.slice(0, 80) : "AI image"}
              style={{
                maxHeight: "calc(100vh - 48px)", maxWidth: "100%",
                borderRadius: 12, objectFit: "contain",
                boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
              }}
            />
          </div>

          {/* Right panel */}
          <div style={{
            position: "fixed", right: 0, top: 0, bottom: 0, width: 360,
            background: "#111", borderLeft: "1px solid #1e1e1e",
            display: "flex", flexDirection: "column", overflowY: "auto",
          }} onClick={e => e.stopPropagation()}>
            <div style={{ height: 56 }} />

            {/* Thumbnail + actions */}
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #1a1a1a" }}>
              <img src={selectedImg.imageUrl} alt="thumbnail"
                style={{ width: "100%", borderRadius: 10, display: "block", objectFit: "contain", marginBottom: 12, background: "#0a0a0a" }} />
              <button onClick={() => { setPrompt(selectedImg.prompt); setSelectedIdx(null); setFloatingExpanded(true); }}
                style={{
                  width: "100%", padding: "10px", borderRadius: 8,
                  background: "#0066ff", border: "none",
                  color: "white", fontWeight: 600, fontSize: 14, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 8,
                }}>
                <Sparkles size={14} /> Use prompt
              </button>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => copyPrompt(selectedImg.id, selectedImg.prompt)}
                  style={{
                    flex: 1, padding: "8px", borderRadius: 8,
                    border: "1px solid #2a2a2a", background: "#161616",
                    color: "#aaa", fontSize: 13, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                  }}>
                  {copied === selectedImg.id ? <Check size={13} color="#4dff91" /> : <Copy size={13} />}
                  {copied === selectedImg.id ? "Copied!" : "Copy prompt"}
                </button>
                <a href={selectedImg.imageUrl} download="image.jpg"
                  style={{
                    flex: 1, padding: "8px", borderRadius: 8,
                    border: "1px solid #2a2a2a", background: "#161616",
                    color: "#aaa", fontSize: 13, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                    textDecoration: "none",
                  }}>
                  <Download size={13} /> Download
                </a>
              </div>
            </div>

            {/* Prompt */}
            <div style={{ padding: "16px 20px", flex: 1 }}>
              <p style={{ fontSize: 11, color: "#555", fontWeight: 600, textTransform: "uppercase",
                letterSpacing: 0.6, marginBottom: 10 }}>Prompt</p>
              <p style={{ fontSize: 13.5, color: "#bbb", lineHeight: 1.7 }}>
                {selectedImg.prompt || "No prompt available"}
              </p>
            </div>

            {/* Like */}
            <div style={{ padding: "16px 20px", borderTop: "1px solid #1a1a1a" }}>
              <button onClick={() => toggleLike(selectedImg.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "8px 16px",
                  borderRadius: 8, border: "1px solid #2a2a2a", background: "#161616",
                  color: liked.has(selectedImg.id) ? "#ff6b6b" : "#aaa", fontSize: 13, cursor: "pointer",
                }}>
                <Heart size={14} fill={liked.has(selectedImg.id) ? "#ff6b6b" : "none"}
                  color={liked.has(selectedImg.id) ? "#ff6b6b" : "#aaa"} />
                {liked.has(selectedImg.id) ? "Liked" : "Like"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== FLOATING PROMPT BAR ===== */}
      <div ref={floatingRef} style={{
        position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
        width: "min(720px, calc(100vw - 96px))", zIndex: 100,
        transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
      }}>
        {!floatingExpanded && (
          <div onClick={() => setFloatingExpanded(true)} style={{
            background: "rgba(18,18,20,0.93)", backdropFilter: "blur(20px)",
            border: "1.5px solid rgba(255,255,255,0.09)", borderRadius: 50,
            boxShadow: "0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(77,159,255,0.07)",
            display: "flex", alignItems: "center", gap: 10,
            padding: "10px 12px 10px 18px", cursor: "text",
          }}>
            <Wand2 size={15} color="#4d9fff" style={{ flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: 14, color: prompt ? "#ccc" : "#444",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {prompt || "Describe the image you're imagining..."}
            </span>
            {isGenerating && <span style={{ fontSize: 12, color: "#666", marginRight: 4 }}>{progress}</span>}
            <button
              onClick={e => { e.stopPropagation(); if (prompt.trim()) generate(); else setFloatingExpanded(true); }}
              disabled={isGenerating}
              style={{
                width: 36, height: 36, borderRadius: "50%", border: "none", flexShrink: 0,
                background: isGenerating ? "#1e1e1e" : "linear-gradient(135deg, #0066ff, #0044bb)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: isGenerating ? "not-allowed" : "pointer",
                boxShadow: "0 2px 10px rgba(0,102,255,0.35)",
              }}>
              {isGenerating
                ? <Loader2 size={15} color="#555" style={{ animation: "spin 1s linear infinite" }} />
                : <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14M12 5l7 7-7 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>}
            </button>
          </div>
        )}

        {floatingExpanded && (
          <div style={{
            background: "rgba(14,14,16,0.97)", backdropFilter: "blur(24px)",
            border: "1.5px solid rgba(255,255,255,0.1)", borderRadius: 20,
            boxShadow: "0 16px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(77,159,255,0.1)",
            overflow: "hidden",
          }}>
            <div style={{ display: "flex", gap: 12, padding: "14px 14px 10px", alignItems: "flex-start" }}>
              <button style={{
                width: 40, height: 40, borderRadius: 10, border: "1.5px dashed #333",
                background: "#1a1a1a", display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", flexShrink: 0, color: "#555", marginTop: 2
              }}>
                <Plus size={16} />
              </button>
              <textarea autoFocus value={prompt} onChange={e => setPrompt(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); generate(); } }}
                placeholder="Describe the image you're imagining..."
                style={{
                  flex: 1, border: "none", outline: "none", resize: "none", fontSize: 14.5,
                  color: "#ddd", background: "transparent", fontFamily: "inherit",
                  minHeight: 56, maxHeight: 140, lineHeight: 1.55, paddingTop: 4
                }} />
            </div>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "6px 14px 12px", flexWrap: "wrap", gap: 8, borderTop: "1px solid #1a1a1a"
            }}>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                <button style={{
                  display: "flex", alignItems: "center", gap: 4, padding: "4px 10px",
                  borderRadius: 20, border: "1px solid #2a2a2a", background: "#1a1a1a",
                  fontSize: 12, color: "#bbb", cursor: "pointer", fontWeight: 500
                }}>
                  <ImageIcon size={11} color="#4d9fff" />
                  {MODELS.find(m => m.id === model)?.label}
                  <ChevronDown size={10} color="#555" />
                </button>
                <button style={{
                  display: "flex", alignItems: "center", gap: 4, padding: "4px 10px",
                  borderRadius: 20, border: "1px solid #2a2a2a", background: "#1a1a1a",
                  fontSize: 12, color: "#bbb", cursor: "pointer"
                }}>
                  <div style={{ width: 10, height: 10, border: "1.5px solid #555", borderRadius: 2 }} />
                  Auto ratio
                </button>
                <button style={{
                  padding: "4px 10px", borderRadius: 20, border: "1px solid #2a2a2a",
                  background: "#1a1a1a", fontSize: 12, color: "#bbb", cursor: "pointer"
                }}>High (2K)</button>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 11.5, color: "#444" }}>✦ 0/image</span>
                <button onClick={() => generate()} disabled={isGenerating || !prompt.trim()}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "7px 18px", borderRadius: 50, border: "none",
                    background: isGenerating || !prompt.trim() ? "#1e1e1e" : "linear-gradient(135deg, #0066ff, #0044bb)",
                    color: isGenerating || !prompt.trim() ? "#444" : "white",
                    fontWeight: 600, fontSize: 13, cursor: isGenerating || !prompt.trim() ? "not-allowed" : "pointer",
                    boxShadow: isGenerating || !prompt.trim() ? "none" : "0 2px 12px rgba(0,102,255,0.4)",
                  }}>
                  {isGenerating
                    ? <><Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> {progress || "Generating..."}</>
                    : <><Sparkles size={13} /> Generate</>}
                </button>
              </div>
            </div>
            {error && (
              <div style={{ padding: "8px 14px 10px", borderTop: "1px solid #2a1515",
                fontSize: 12.5, color: "#ff6b6b" }}>{error}</div>
            )}
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity: 0.35; } 50% { opacity: 0.6; } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #0a0a0a; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: #0a0a0a; }
        ::-webkit-scrollbar-thumb { background: #222; border-radius: 3px; }
        textarea::placeholder { color: #444; }

        .gallery-card {
          border-radius: 8px;
          overflow: hidden;
          background: #161616;
          cursor: pointer;
          transition: transform 0.2s ease;
        }
        .gallery-card:hover { transform: scale(1.02); z-index: 2; }

        .gallery-overlay {
          position: absolute;
          inset: 0;
          border-radius: 8px;
          opacity: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 60%);
          transition: opacity 0.2s;
          display: flex;
          align-items: flex-end;
          padding: 6px;
        }
        .gallery-card:hover .gallery-overlay { opacity: 1; }

        .like-btn {
          width: 28px; height: 28px; border-radius: 50%;
          border: none; background: rgba(0,0,0,0.5);
          backdrop-filter: blur(4px); cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          margin-left: auto; color: white;
        }
      `}</style>
    </div>
  );
}
