"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { 
  Compass, Diamond, Archive, AlignJustify, Upload, ChevronDown,
  Loader2, Download, Heart, Copy, RefreshCw, Check, Sparkles,
  Image as ImageIcon, Settings, Plus
} from "lucide-react";

const GALLERY_BASE = "https://lumen-gallery.ngrok.app";

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

const RATIOS = ["Auto ratio", "1:1", "4:3", "16:9", "9:16", "3:4"];
const QUALITIES = ["Standard", "High (2K)", "Ultra (4K)"];

export default function HomePage() {
  const [tab, setTab] = useState<"trends" | "shorts">("trends");
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState("realvis");
  const [ratio, setRatio] = useState("Auto ratio");
  const [quality, setQuality] = useState("High (2K)");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const [showGenerator, setShowGenerator] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [hovered, setHovered] = useState<string | null>(null);

  // Gallery
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingGallery, setLoadingGallery] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const fetchGallery = useCallback(async (p: number) => {
    setLoadingGallery(true);
    try {
      const res = await fetch(`/api/gallery?page=${p}&limit=24`);
      const data = await res.json();
      setImages(prev => p === 1 ? data.images : [...prev, ...data.images]);
      setHasMore(data.hasMore);
    } catch { /* ignore */ }
    setLoadingGallery(false);
  }, []);

  useEffect(() => { fetchGallery(1); }, [fetchGallery]);

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loadingGallery) {
        const next = page + 1;
        setPage(next);
        fetchGallery(next);
      }
    }, { rootMargin: "500px" });
    if (loaderRef.current) observerRef.current.observe(loaderRef.current);
    return () => observerRef.current?.disconnect();
  }, [hasMore, loadingGallery, page, fetchGallery]);

  const generate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setError("");
    setGeneratedImage(null);
    setProgress("Submitting...");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, model }),
      });
      const { promptId, error: err } = await res.json();
      if (err || !promptId) { setError(err || "Failed"); setIsGenerating(false); return; }
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
        if (poll.status === "error") { setError("Generation failed"); setIsGenerating(false); return; }
        setProgress(`Generating... ${Math.round((Date.now()-start)/1000)}s`);
      }
      setError("Timed out");
    } catch { setError("Unavailable"); }
    setIsGenerating(false);
    setProgress("");
  };

  const copyPrompt = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1800);
  };

  const remix = (img: GalleryImage) => {
    setPrompt(img.prompt);
    setShowGenerator(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#fff", fontFamily: "Inter,-apple-system,sans-serif", color: "#1a1a1a" }}>
      
      {/* Left Sidebar — narrow icon rail like Dreamina */}
      <aside style={{ width: 60, background: "#fff", borderRight: "1px solid #f0f0f0",
        display: "flex", flexDirection: "column", alignItems: "center",
        padding: "16px 0", position: "fixed", top: 0, bottom: 0, left: 0, zIndex: 50 }}>
        {/* Logo */}
        <div style={{ width: 32, height: 32, marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg, #0066ff, #00aaff)",
            display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Sparkles size={14} color="white" />
          </div>
        </div>
        {/* Nav icons */}
        {[
          { icon: Compass, label: "Explore", active: !showGenerator, onClick: () => setShowGenerator(false) },
          { icon: Diamond, label: "Create", active: showGenerator, onClick: () => setShowGenerator(true) },
          { icon: Archive, label: "Assets", active: false, onClick: () => {} },
        ].map(item => (
          <button key={item.label} onClick={item.onClick}
            title={item.label}
            style={{ width: 44, height: 52, display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", gap: 4, border: "none", background: "transparent",
              cursor: "pointer", borderRadius: 8, marginBottom: 4,
              color: item.active ? "#0066ff" : "#999" }}>
            <item.icon size={20} />
            <span style={{ fontSize: 10, fontWeight: 500 }}>{item.label}</span>
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button title="Menu" style={{ width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center",
          border: "none", background: "transparent", cursor: "pointer", color: "#999" }}>
          <AlignJustify size={18} />
        </button>
      </aside>

      {/* Main */}
      <main style={{ marginLeft: 60, flex: 1, display: "flex", flexDirection: "column" }}>
        
        {/* Heading */}
        <div style={{ textAlign: "center", padding: "36px 24px 24px" }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "#1a1a1a", margin: 0 }}>
            Start Creating With{" "}
            <span style={{ color: "#0066ff" }}>AI Image</span>
            <span style={{ color: "#0066ff", fontSize: 18, marginLeft: 4 }}>↓</span>
          </h1>
        </div>

        {/* Prompt Box — exactly like Dreamina */}
        <div style={{ maxWidth: 800, margin: "0 auto", width: "100%", padding: "0 24px 24px" }}>
          <div style={{ background: "#fff", border: "1.5px solid #e8e8e8", borderRadius: 16,
            boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
            
            {/* Top: image upload area + prompt */}
            <div style={{ display: "flex", gap: 12, padding: "16px 16px 12px" }}>
              {/* Image upload slot */}
              <button style={{ width: 56, height: 56, borderRadius: 10, border: "1.5px dashed #d0d0d0",
                background: "#fafafa", display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", flexShrink: 0, color: "#bbb" }}>
                <Plus size={20} />
              </button>
              {/* Prompt textarea */}
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), generate())}
                placeholder="Describe the image you're imagining"
                style={{ flex: 1, border: "none", outline: "none", resize: "none", fontSize: 15,
                  color: "#1a1a1a", background: "transparent", fontFamily: "inherit",
                  minHeight: 56, lineHeight: 1.5, paddingTop: 4 }} />
            </div>

            {/* Bottom toolbar */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "10px 16px", borderTop: "1px solid #f4f4f4" }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                {/* Model chip */}
                <button onClick={() => {}} style={{ display: "flex", alignItems: "center", gap: 4,
                  padding: "5px 10px", borderRadius: 20, border: "1px solid #e0e0e0",
                  background: "#fff", fontSize: 13, color: "#333", cursor: "pointer", fontWeight: 500 }}>
                  <ImageIcon size={13} color="#0066ff" />
                  {MODELS.find(m => m.id === model)?.label}
                  <ChevronDown size={12} color="#999" />
                </button>
                {/* Ratio chip */}
                <button style={{ display: "flex", alignItems: "center", gap: 4,
                  padding: "5px 10px", borderRadius: 20, border: "1px solid #e0e0e0",
                  background: "#fff", fontSize: 13, color: "#333", cursor: "pointer" }}>
                  <div style={{ width: 13, height: 13, border: "1.5px solid #999", borderRadius: 2 }} />
                  {ratio}
                </button>
                {/* Quality chip */}
                <button style={{ display: "flex", alignItems: "center", gap: 4,
                  padding: "5px 10px", borderRadius: 20, border: "1px solid #e0e0e0",
                  background: "#fff", fontSize: 13, color: "#333", cursor: "pointer" }}>
                  {quality}
                </button>
                {/* Settings */}
                <button style={{ width: 30, height: 30, borderRadius: "50%", border: "1px solid #e0e0e0",
                  background: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", color: "#999" }}>
                  <Settings size={13} />
                </button>
              </div>
              {/* Credits + Submit */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13, color: "#999" }}>✦ 0/image</span>
                <button onClick={generate} disabled={isGenerating || !prompt.trim()}
                  style={{ width: 36, height: 36, borderRadius: "50%",
                    background: isGenerating || !prompt.trim() ? "#e0e0e0" : "#1a1a1a",
                    border: "none", display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: isGenerating || !prompt.trim() ? "not-allowed" : "pointer" }}>
                  {isGenerating
                    ? <Loader2 size={16} color="white" style={{ animation: "spin 1s linear infinite" }} />
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  }
                </button>
              </div>
            </div>

            {/* Progress / Error / Result */}
            {progress && (
              <div style={{ padding: "10px 16px", borderTop: "1px solid #f4f4f4", fontSize: 13, color: "#888",
                display: "flex", alignItems: "center", gap: 8 }}>
                <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> {progress}
              </div>
            )}
            {error && (
              <div style={{ padding: "10px 16px", borderTop: "1px solid #fee", fontSize: 13, color: "#d00",
                background: "#fff8f8" }}>
                {error}
              </div>
            )}
            {generatedImage && (
              <div style={{ padding: 16, borderTop: "1px solid #f4f4f4" }}>
                <img src={generatedImage} alt="Generated"
                  style={{ maxWidth: "100%", borderRadius: 12, display: "block" }} />
                <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                  <a href={generatedImage} download="generated.png"
                    style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px",
                      background: "#f4f4f4", borderRadius: 20, fontSize: 13, color: "#333",
                      textDecoration: "none" }}>
                    <Download size={13} /> Download
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tabs: Trends / AI Shorts */}
        <div style={{ maxWidth: "100%", padding: "0 24px", marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 4, borderBottom: "1px solid #f0f0f0", paddingBottom: 0 }}>
            {["trends", "shorts"].map(t => (
              <button key={t} onClick={() => setTab(t as "trends" | "shorts")}
                style={{ padding: "8px 16px", fontSize: 14, fontWeight: tab === t ? 600 : 400,
                  color: tab === t ? "#1a1a1a" : "#999", background: "transparent", border: "none",
                  cursor: "pointer", borderBottom: tab === t ? "2px solid #1a1a1a" : "2px solid transparent",
                  marginBottom: -1 }}>
                {t === "trends" ? "Trends" : "AI Shorts"}
              </button>
            ))}
          </div>
        </div>

        {/* Gallery Masonry Grid */}
        <div style={{ padding: "0 16px 60px", columns: "4 180px", gap: "8px" }}>
          {images.map(img => (
            <div key={img.id}
              style={{ breakInside: "avoid", marginBottom: 8, position: "relative",
                borderRadius: 12, overflow: "hidden", cursor: "pointer" }}
              onMouseEnter={() => setHovered(img.id)}
              onMouseLeave={() => setHovered(null)}>
              
              <img
                src={img.imageUrl}
                alt={img.prompt.slice(0, 60)}
                loading="lazy"
                style={{ width: "100%", display: "block", borderRadius: 12,
                  transition: "transform 0.2s",
                  transform: hovered === img.id ? "scale(1.02)" : "scale(1)" }}
                onError={e => { (e.target as HTMLImageElement).parentElement!.style.display = "none"; }}
              />

              {/* Hover overlay */}
              {hovered === img.id && (
                <div style={{ position: "absolute", inset: 0, borderRadius: 12,
                  background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.2) 40%, transparent 65%)",
                  display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: 10 }}>
                  
                  {/* Prompt */}
                  <p style={{ color: "rgba(255,255,255,0.92)", fontSize: 12, lineHeight: 1.45,
                    marginBottom: 8, display: "-webkit-box", WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {img.prompt}
                  </p>

                  {/* Actions */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ background: "rgba(255,255,255,0.18)", backdropFilter: "blur(4px)",
                      borderRadius: 12, padding: "2px 8px", fontSize: 11, color: "rgba(255,255,255,0.9)" }}>
                      {img.model}
                    </span>
                    <div style={{ display: "flex", gap: 5 }}>
                      <button onClick={e => { e.stopPropagation(); toggleLike(img.id); }}
                        title="Like"
                        style={{ width: 28, height: 28, borderRadius: "50%", border: "none",
                          background: "rgba(255,255,255,0.2)", backdropFilter: "blur(4px)",
                          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Heart size={12} color="white" fill={liked.has(img.id) ? "white" : "none"} />
                      </button>
                      <button onClick={e => { e.stopPropagation(); copyPrompt(img.id, img.prompt); }}
                        title="Copy prompt"
                        style={{ width: 28, height: 28, borderRadius: "50%", border: "none",
                          background: "rgba(255,255,255,0.2)", backdropFilter: "blur(4px)",
                          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {copied === img.id ? <Check size={12} color="white" /> : <Copy size={12} color="white" />}
                      </button>
                      <button onClick={e => { e.stopPropagation(); remix(img); }}
                        title="Remix"
                        style={{ display: "flex", alignItems: "center", gap: 3,
                          padding: "0 8px", height: 28, borderRadius: 14, border: "none",
                          background: "rgba(255,255,255,0.25)", backdropFilter: "blur(4px)",
                          cursor: "pointer", color: "white", fontSize: 11, fontWeight: 600 }}>
                        <RefreshCw size={10} /> Remix
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Infinite scroll trigger */}
        <div ref={loaderRef} style={{ height: 60, display: "flex", alignItems: "center",
          justifyContent: "center", color: "#bbb", fontSize: 13 }}>
          {loadingGallery && <><Loader2 size={15} style={{ animation: "spin 1s linear infinite", marginRight: 6 }} /> Loading...</>}
          {!hasMore && images.length > 0 && "✦ You've seen it all ✦"}
        </div>
      </main>

      <style jsx global>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #fff; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: #e0e0e0; border-radius: 3px; }
        @media (max-width: 640px) {
          aside { width: 48px !important; }
          main { margin-left: 48px !important; }
          div[style*="columns: 4"] { columns: 2 140px !important; }
        }
      `}</style>
    </div>
  );

  function toggleLike(id: string) {
    setLiked(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  }
}
