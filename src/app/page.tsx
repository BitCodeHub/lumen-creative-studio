"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { 
  Compass, Diamond, Archive, AlignJustify, ChevronDown,
  Loader2, Download, Heart, Copy, RefreshCw, Check, Sparkles,
  Image as ImageIcon, Settings, Plus, Wand2
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
  const [hovered, setHovered] = useState<string | null>(null);
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
        const res = await fetch(`/api/gallery?page=${p}&limit=48`, { signal: controller.signal });
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
    console.error('Gallery fetch failed after retries:', lastError);
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

  const generate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setError("");
    setGeneratedImage(null);
    setProgress("Submitting...");
    setActiveNav("create");
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
        setProgress(`Generating... ${Math.round((Date.now()-start)/1000)}s`);
      }
      setError("Timed out — try FLUX Schnell for faster results");
    } catch { setError("AI temporarily unavailable. Please try again."); }
    setIsGenerating(false); setProgress("");
  };

  const copyPrompt = (id: string, text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(id); setTimeout(() => setCopied(null), 1800);
  };

  const remix = (img: GalleryImage) => {
    setPrompt(img.prompt); setActiveNav("create");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleLike = (id: string) => {
    setLiked(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0a0a0a",
      fontFamily: "Inter,-apple-system,BlinkMacSystemFont,sans-serif", color: "#fff" }}>

      {/* Sidebar */}
      <aside style={{ width: 64, background: "#111", borderRight: "1px solid #1c1c1c",
        display: "flex", flexDirection: "column", alignItems: "center",
        padding: "14px 0", position: "fixed", top: 0, bottom: 0, left: 0, zIndex: 50 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10,
          background: "linear-gradient(135deg, #0066ff, #00aaff)",
          display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
          <Sparkles size={17} color="white" />
        </div>
        {(["explore", "create"] as const).map(nav => {
          const Icon = nav === "explore" ? Compass : Diamond;
          return (
            <button key={nav} onClick={() => setActiveNav(nav)} title={nav}
              style={{ width: 52, height: 52, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: 3,
                border: "none", borderRadius: 10,
                background: activeNav === nav ? "rgba(0,102,255,0.15)" : "transparent",
                cursor: "pointer", color: activeNav === nav ? "#4d9fff" : "#555",
                textTransform: "capitalize" }}>
              <Icon size={19} />
              <span style={{ fontSize: 9.5, fontWeight: 500 }}>{nav.charAt(0).toUpperCase()+nav.slice(1)}</span>
            </button>
          );
        })}
        <button title="Assets" style={{ width: 52, height: 52, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 3,
          border: "none", borderRadius: 10, background: "transparent", cursor: "pointer", color: "#444" }}>
          <Archive size={19} />
          <span style={{ fontSize: 9.5, fontWeight: 500 }}>Assets</span>
        </button>
        <div style={{ flex: 1 }} />
        <button style={{ width: 52, height: 40, display: "flex", alignItems: "center", justifyContent: "center",
          border: "none", background: "transparent", cursor: "pointer", color: "#444" }}>
          <AlignJustify size={17} />
        </button>
      </aside>

      {/* Main */}
      <main style={{ marginLeft: 64, flex: 1 }}>

        {activeNav === "explore" && (
          <>
            <div style={{ textAlign: "center", padding: "32px 24px 20px" }}>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: "#fff", margin: 0, letterSpacing: -0.3 }}>
                Start Creating With <span style={{ color: "#4d9fff" }}>AI Image</span>
                <span style={{ color: "#4d9fff", marginLeft: 3 }}>↓</span>
              </h1>
            </div>

            {/* Prompt box */}
            <div style={{ maxWidth: 720, margin: "0 auto", width: "100%", padding: "0 20px 20px" }}>
              <div style={{ background: "#161616", border: "1.5px solid #2a2a2a", borderRadius: 16,
                boxShadow: "0 4px 24px rgba(0,0,0,0.35)" }}>
                <div style={{ display: "flex", gap: 12, padding: "14px 14px 10px" }}>
                  <button style={{ width: 52, height: 52, borderRadius: 10, border: "1.5px dashed #333",
                    background: "#1e1e1e", display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", flexShrink: 0, color: "#555" }}>
                    <Plus size={18} />
                  </button>
                  <textarea value={prompt} onChange={e => setPrompt(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); generate(); }}}
                    placeholder="Describe the image you're imagining"
                    style={{ flex: 1, border: "none", outline: "none", resize: "none", fontSize: 14.5,
                      color: "#ddd", background: "transparent", fontFamily: "inherit",
                      minHeight: 52, lineHeight: 1.5, paddingTop: 2 }} />
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "8px 14px 12px", flexWrap: "wrap", gap: 8 }}>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <button style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px",
                      borderRadius: 20, border: "1px solid #2a2a2a", background: "#1e1e1e",
                      fontSize: 12.5, color: "#bbb", cursor: "pointer", fontWeight: 500 }}>
                      <ImageIcon size={12} color="#4d9fff" />
                      {MODELS.find(m => m.id === model)?.label}
                      <ChevronDown size={11} color="#555" />
                    </button>
                    <button style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px",
                      borderRadius: 20, border: "1px solid #2a2a2a", background: "#1e1e1e",
                      fontSize: 12.5, color: "#bbb", cursor: "pointer" }}>
                      <div style={{ width: 12, height: 12, border: "1.5px solid #555", borderRadius: 2 }} />
                      Auto ratio
                    </button>
                    <button style={{ padding: "5px 10px", borderRadius: 20, border: "1px solid #2a2a2a",
                      background: "#1e1e1e", fontSize: 12.5, color: "#bbb", cursor: "pointer" }}>
                      High (2K)
                    </button>
                    <button style={{ width: 28, height: 28, borderRadius: "50%", border: "1px solid #2a2a2a",
                      background: "#1e1e1e", display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer", color: "#555" }}>
                      <Settings size={12} />
                    </button>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 12, color: "#444" }}>✦ 0/image</span>
                    <button onClick={generate} disabled={isGenerating || !prompt.trim()}
                      style={{ width: 34, height: 34, borderRadius: "50%",
                        background: isGenerating || !prompt.trim() ? "#222" : "#0066ff",
                        border: "none", display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: isGenerating || !prompt.trim() ? "not-allowed" : "pointer", transition: "background 0.15s" }}>
                      {isGenerating
                        ? <Loader2 size={15} color="#555" style={{ animation: "spin 1s linear infinite" }} />
                        : <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      }
                    </button>
                  </div>
                </div>
                {progress && <div style={{ padding: "8px 14px 10px", borderTop: "1px solid #1e1e1e",
                  fontSize: 12.5, color: "#666", display: "flex", gap: 7, alignItems: "center" }}>
                  <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> {progress}
                </div>}
                {error && <div style={{ padding: "8px 14px 10px", borderTop: "1px solid #2a1515",
                  fontSize: 12.5, color: "#ff6b6b" }}>{error}</div>}
              </div>
            </div>

            {/* Tabs */}
            <div style={{ padding: "0 20px 0", borderBottom: "1px solid #181818" }}>
              <div style={{ display: "flex" }}>
                {(["trends", "shorts"] as const).map(t => (
                  <button key={t} onClick={() => setTab(t)}
                    style={{ padding: "8px 16px", fontSize: 13.5,
                      fontWeight: tab === t ? 600 : 400,
                      color: tab === t ? "#fff" : "#555", background: "transparent", border: "none",
                      cursor: "pointer",
                      borderBottom: tab === t ? "2px solid #4d9fff" : "2px solid transparent" }}>
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
                  style={{ padding: "8px 18px", borderRadius: 8, border: "1px solid #333",
                    background: "#161616", color: "#888", cursor: "pointer", fontSize: 13 }}>
                  🔄 Retry
                </button>
              </div>
            ) : (
              <div style={{ padding: "14px 14px 60px", columns: "4 170px", gap: "8px" }}>
                {/* Skeleton placeholders while loading */}
                {loadingGallery && images.length === 0 && Array.from({ length: 16 }).map((_, i) => (
                  <div key={`sk-${i}`} style={{ breakInside: "avoid", marginBottom: 8,
                    borderRadius: 10, background: "#161616",
                    height: [220,300,180,260,200,340,220,280,190,310,240,170,250,320,200,280][i],
                    animation: "pulse 1.6s ease-in-out infinite" }} />
                ))}
                {images.map(img => (
                  <div key={img.id}
                    style={{ breakInside: "avoid", marginBottom: 8, position: "relative",
                      borderRadius: 10, overflow: "hidden", cursor: "pointer", background: "#161616" }}
                    onMouseEnter={() => setHovered(img.id)}
                    onMouseLeave={() => setHovered(null)}>
                    <img src={img.imageUrl} alt={img.prompt.slice(0, 60)} loading="lazy"
                      style={{ width: "100%", display: "block", borderRadius: 10,
                        transition: "transform 0.25s ease",
                        transform: hovered === img.id ? "scale(1.03)" : "scale(1)" }}
                      onError={e => { (e.target as HTMLImageElement).closest('div')!.style.display = "none"; }}
                    />
                    {hovered === img.id && (
                      <div style={{ position: "absolute", inset: 0, borderRadius: 10,
                        background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 45%, transparent 70%)",
                        display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: 10 }}>
                        <p style={{ color: "rgba(255,255,255,0.9)", fontSize: 11.5, lineHeight: 1.45,
                          marginBottom: 8, display: "-webkit-box", WebkitLineClamp: 3,
                          WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                          {img.prompt}
                        </p>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(6px)",
                            borderRadius: 10, padding: "2px 7px", fontSize: 10.5, color: "rgba(255,255,255,0.8)" }}>
                            {img.model}
                          </span>
                          <div style={{ display: "flex", gap: 4 }}>
                            <button onClick={e => { e.stopPropagation(); toggleLike(img.id); }}
                              style={{ width: 27, height: 27, borderRadius: "50%", border: "none",
                                background: "rgba(255,255,255,0.15)", backdropFilter: "blur(6px)",
                                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <Heart size={12} color="white" fill={liked.has(img.id) ? "white" : "none"} />
                            </button>
                            <button onClick={e => { e.stopPropagation(); copyPrompt(img.id, img.prompt); }}
                              style={{ width: 27, height: 27, borderRadius: "50%", border: "none",
                                background: "rgba(255,255,255,0.15)", backdropFilter: "blur(6px)",
                                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              {copied === img.id ? <Check size={12} color="#4dff91" /> : <Copy size={12} color="white" />}
                            </button>
                            <button onClick={e => { e.stopPropagation(); remix(img); }}
                              style={{ display: "flex", alignItems: "center", gap: 3, padding: "0 8px",
                                height: 27, borderRadius: 13, border: "none",
                                background: "rgba(77,159,255,0.25)", backdropFilter: "blur(6px)",
                                cursor: "pointer", color: "#9dd0ff", fontSize: 11, fontWeight: 600 }}>
                              <RefreshCw size={10} /> Remix
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
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
                      style={{ padding: "6px 14px", borderRadius: 8,
                        border: model === m.id ? "1.5px solid #0066ff" : "1.5px solid #1e1e1e",
                        background: model === m.id ? "rgba(0,102,255,0.1)" : "#161616",
                        color: model === m.id ? "#4d9fff" : "#555",
                        fontSize: 13, cursor: "pointer", fontWeight: 500 }}>
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
                  style={{ width: "100%", minHeight: 110, resize: "vertical", background: "#161616",
                    border: "1px solid #1e1e1e", borderRadius: 10, padding: "10px 12px", color: "#ddd",
                    fontSize: 14, outline: "none", fontFamily: "inherit", lineHeight: 1.55 }} />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button onClick={generate} disabled={isGenerating || !prompt.trim()}
                  style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 22px",
                    background: isGenerating || !prompt.trim() ? "#1a1a1a" : "#0066ff",
                    border: "none", borderRadius: 10,
                    color: isGenerating || !prompt.trim() ? "#444" : "white",
                    fontWeight: 600, fontSize: 14, cursor: isGenerating || !prompt.trim() ? "not-allowed" : "pointer" }}>
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
                      style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px",
                        background: "#161616", border: "1px solid #2a2a2a", borderRadius: 8,
                        color: "#bbb", textDecoration: "none", fontSize: 13 }}>
                      <Download size={13} /> Download
                    </a>
                    <button onClick={() => setActiveNav("explore")}
                      style={{ padding: "7px 14px", background: "transparent", border: "1px solid #1e1e1e",
                        borderRadius: 8, color: "#555", fontSize: 13, cursor: "pointer" }}>
                      ← Explore
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <style jsx global>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity: 0.35; } 50% { opacity: 0.6; } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #0a0a0a; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: #0a0a0a; }
        ::-webkit-scrollbar-thumb { background: #222; border-radius: 3px; }
        textarea::placeholder { color: #444; }
        @media (max-width: 640px) {
          aside { width: 52px !important; }
          main { margin-left: 52px !important; }
          div[style*='columns: 4'] { columns: 2 130px !important; }
        }
      `}</style>
    </div>
  );
}
