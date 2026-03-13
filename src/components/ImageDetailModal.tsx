"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Sparkles, Download, Copy, Check, Loader2, ZoomIn, RefreshCw, ChevronDown } from "lucide-react";

interface GalleryImage {
  id: string;
  imageUrl: string;
  prompt: string;
  model: string;
  likes: number;
  createdAt: string;
}

interface ImageDetailModalProps {
  image: GalleryImage | null;
  onClose: () => void;
}

const ASPECT_RATIOS = [
  { label: "1:1", value: "1:1", width: 1024, height: 1024 },
  { label: "4:3", value: "4:3", width: 1024, height: 768 },
  { label: "3:4", value: "3:4", width: 768, height: 1024 },
  { label: "16:9", value: "16:9", width: 1280, height: 720 },
  { label: "9:16", value: "9:16", width: 720, height: 1280 },
  { label: "3:2", value: "3:2", width: 1200, height: 800 },
  { label: "2:3", value: "2:3", width: 800, height: 1200 },
];

const RESOLUTIONS = [
  { label: "HD (768px)", width: 768, height: 768 },
  { label: "Full HD (1024px)", width: 1024, height: 1024 },
  { label: "2K (1280px)", width: 1280, height: 1280 },
];

export default function ImageDetailModal({ image, onClose }: ImageDetailModalProps) {
  const [enhancedPrompt, setEnhancedPrompt] = useState("");
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhanceError, setEnhanceError] = useState("");
  const [copied, setCopied] = useState(false);
  const [copiedEnhanced, setCopiedEnhanced] = useState(false);
  const [selectedRatio, setSelectedRatio] = useState(ASPECT_RATIOS[2]); // 3:4 default portrait
  const [selectedRes, setSelectedRes] = useState(RESOLUTIONS[1]); // 1024px default
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [genError, setGenError] = useState("");
  const [imgNaturalSize, setImgNaturalSize] = useState<{ w: number; h: number } | null>(null);
  const [showRatioPanel, setShowRatioPanel] = useState(false);

  // Close on ESC
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // Reset state when image changes
  useEffect(() => {
    setEnhancedPrompt("");
    setEnhanceError("");
    setGeneratedImage(null);
    setGenError("");
    setImgNaturalSize(null);
  }, [image?.id]);

  const handleEnhance = useCallback(async () => {
    if (!image?.prompt || isEnhancing) return;
    setIsEnhancing(true);
    setEnhanceError("");
    setEnhancedPrompt("");
    try {
      const res = await fetch("/api/enhance-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: image.prompt }),
      });
      const data = await res.json();
      if (data.enhanced) {
        setEnhancedPrompt(data.enhanced);
      } else {
        setEnhanceError("Enhancement failed. Try again.");
      }
    } catch {
      setEnhanceError("Connection error. Try again.");
    } finally {
      setIsEnhancing(false);
    }
  }, [image?.prompt, isEnhancing]);

  const handleGenerate = useCallback(async () => {
    const promptToUse = enhancedPrompt || image?.prompt;
    if (!promptToUse || isGenerating) return;
    setIsGenerating(true);
    setGenError("");
    setGeneratedImage(null);

    const finalWidth = Math.round(selectedRes.width * (selectedRatio.width / Math.max(selectedRatio.width, selectedRatio.height)));
    const finalHeight = Math.round(selectedRes.height * (selectedRatio.height / Math.max(selectedRatio.width, selectedRatio.height)));

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: promptToUse,
          width: finalWidth,
          height: finalHeight,
          model: "realvis",
        }),
      });
      const data = await res.json();

      if (data.type === "gemini" && data.image) {
        setGeneratedImage(data.image);
        setIsGenerating(false);
        return;
      }

      if (data.promptId) {
        // Poll for completion
        const promptId = data.promptId;
        let attempts = 0;
        const poll = async () => {
          if (attempts++ > 120) { setGenError("Timed out"); setIsGenerating(false); return; }
          try {
            const statusRes = await fetch(`/api/generate?promptId=${promptId}`);
            const statusData = await statusRes.json();
            if (statusData.status === "done" && statusData.imageUrl) {
              setGeneratedImage(statusData.imageUrl);
              setIsGenerating(false);
            } else if (statusData.status === "error") {
              setGenError("Generation failed");
              setIsGenerating(false);
            } else {
              setTimeout(poll, 3000);
            }
          } catch { setTimeout(poll, 3000); }
        };
        setTimeout(poll, 3000);
      } else {
        setGenError("Failed to start generation");
        setIsGenerating(false);
      }
    } catch {
      setGenError("Connection error");
      setIsGenerating(false);
    }
  }, [enhancedPrompt, image?.prompt, isGenerating, selectedRatio, selectedRes]);

  const getAspectRatio = () => {
    if (imgNaturalSize) {
      const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
      const d = gcd(imgNaturalSize.w, imgNaturalSize.h);
      return `${imgNaturalSize.w / d}:${imgNaturalSize.h / d}`;
    }
    return "—";
  };

  if (!image) return null;

  const activePrompt = enhancedPrompt || image.prompt;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.92)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "1rem",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#111111",
          border: "1px solid #2a2a2a",
          borderRadius: "1rem",
          width: "100%",
          maxWidth: "1100px",
          maxHeight: "92vh",
          overflow: "auto",
          display: "grid",
          gridTemplateColumns: "1fr 420px",
          position: "relative",
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: "1rem", right: "1rem", zIndex: 10,
            background: "rgba(0,0,0,0.7)", border: "1px solid #333",
            borderRadius: "50%", width: "2rem", height: "2rem",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#aaa", cursor: "pointer",
          }}
        >
          <X size={16} />
        </button>

        {/* LEFT: Image */}
        <div style={{
          background: "#0a0a0a",
          borderRadius: "1rem 0 0 1rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem",
          minHeight: "500px",
        }}>
          <img
            src={generatedImage || image.imageUrl}
            alt={image.prompt}
            onLoad={(e) => {
              const el = e.target as HTMLImageElement;
              setImgNaturalSize({ w: el.naturalWidth, h: el.naturalHeight });
            }}
            style={{
              maxWidth: "100%",
              maxHeight: "65vh",
              borderRadius: "0.5rem",
              objectFit: "contain",
              display: "block",
            }}
          />

          {/* Resolution & Aspect Ratio badge */}
          {imgNaturalSize && (
            <div style={{
              marginTop: "0.75rem",
              display: "flex", gap: "0.5rem",
              flexWrap: "wrap", justifyContent: "center",
            }}>
              <span style={{
                background: "#1a1a1a", border: "1px solid #333",
                borderRadius: "0.375rem", padding: "0.25rem 0.625rem",
                fontSize: "0.75rem", color: "#a0a0a0",
              }}>
                <ZoomIn size={11} style={{ display: "inline", marginRight: "0.3rem" }} />
                {imgNaturalSize.w} × {imgNaturalSize.h}
              </span>
              <span style={{
                background: "#1a1a1a", border: "1px solid #333",
                borderRadius: "0.375rem", padding: "0.25rem 0.625rem",
                fontSize: "0.75rem", color: "#a0a0a0",
              }}>
                {getAspectRatio()}
              </span>
            </div>
          )}

          {/* Download button */}
          <a
            href={generatedImage || image.imageUrl}
            download
            style={{
              marginTop: "0.75rem",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid #333",
              borderRadius: "0.5rem",
              padding: "0.5rem 1rem",
              color: "#aaa",
              fontSize: "0.8rem",
              textDecoration: "none",
              display: "flex", alignItems: "center", gap: "0.375rem",
              cursor: "pointer",
            }}
          >
            <Download size={14} /> Download
          </a>
        </div>

        {/* RIGHT: Controls */}
        <div style={{
          padding: "1.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.25rem",
          borderLeft: "1px solid #1e1e1e",
          overflowY: "auto",
        }}>

          {/* Original Prompt */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#666", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Original Prompt
              </span>
              <button
                onClick={() => { navigator.clipboard.writeText(image.prompt); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#555", padding: "0.25rem" }}
              >
                {copied ? <Check size={13} color="#00c853" /> : <Copy size={13} />}
              </button>
            </div>
            <p style={{
              color: "#ccc", fontSize: "0.8125rem", lineHeight: 1.6,
              background: "#0d0d0d", border: "1px solid #222",
              borderRadius: "0.5rem", padding: "0.75rem",
              margin: 0,
            }}>
              {image.prompt}
            </p>
          </div>

          {/* Enhance Prompt Button */}
          <button
            onClick={handleEnhance}
            disabled={isEnhancing}
            style={{
              background: isEnhancing
                ? "rgba(139,92,246,0.1)"
                : "linear-gradient(135deg, rgba(139,92,246,0.2), rgba(236,72,153,0.2))",
              border: "1px solid rgba(139,92,246,0.4)",
              borderRadius: "0.625rem",
              padding: "0.75rem 1rem",
              color: isEnhancing ? "#888" : "#c084fc",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: isEnhancing ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
              transition: "all 0.2s ease",
            }}
          >
            {isEnhancing ? (
              <><Loader2 size={16} className="animate-spin" /> Enhancing with Llama 3.3 70B...</>
            ) : (
              <><Sparkles size={16} /> ✨ AI Enhance Prompt</>
            )}
          </button>

          {enhanceError && (
            <p style={{ color: "#f87171", fontSize: "0.75rem", margin: 0 }}>{enhanceError}</p>
          )}

          {/* Enhanced Prompt */}
          {enhancedPrompt && (
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#a855f7", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  ✨ Enhanced Prompt
                </span>
                <button
                  onClick={() => { navigator.clipboard.writeText(enhancedPrompt); setCopiedEnhanced(true); setTimeout(() => setCopiedEnhanced(false), 2000); }}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#555", padding: "0.25rem" }}
                >
                  {copiedEnhanced ? <Check size={13} color="#00c853" /> : <Copy size={13} />}
                </button>
              </div>
              <textarea
                value={enhancedPrompt}
                onChange={(e) => setEnhancedPrompt(e.target.value)}
                rows={6}
                style={{
                  width: "100%",
                  background: "#0d0d0d",
                  border: "1px solid rgba(139,92,246,0.35)",
                  borderRadius: "0.5rem",
                  padding: "0.75rem",
                  color: "#e0c7ff",
                  fontSize: "0.8125rem",
                  lineHeight: 1.6,
                  resize: "vertical",
                  boxSizing: "border-box",
                  fontFamily: "inherit",
                }}
              />
            </div>
          )}

          {/* Aspect Ratio & Resolution (shown when enhanced prompt available) */}
          {enhancedPrompt && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
              {/* Aspect Ratio */}
              <div>
                <div
                  onClick={() => setShowRatioPanel(!showRatioPanel)}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    cursor: "pointer", marginBottom: "0.375rem",
                  }}
                >
                  <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#666", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Aspect Ratio
                  </span>
                  <ChevronDown size={14} color="#555" style={{ transform: showRatioPanel ? "rotate(180deg)" : "none", transition: "0.2s" }} />
                </div>
                <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
                  {ASPECT_RATIOS.map((r) => (
                    <button
                      key={r.value}
                      onClick={() => setSelectedRatio(r)}
                      style={{
                        padding: "0.375rem 0.625rem",
                        background: selectedRatio.value === r.value ? "rgba(139,92,246,0.25)" : "#1a1a1a",
                        border: selectedRatio.value === r.value ? "1px solid rgba(139,92,246,0.5)" : "1px solid #2a2a2a",
                        borderRadius: "0.375rem",
                        color: selectedRatio.value === r.value ? "#c084fc" : "#777",
                        fontSize: "0.75rem",
                        cursor: "pointer",
                      }}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Resolution */}
              <div>
                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#666", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "0.375rem" }}>
                  Resolution
                </span>
                <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
                  {RESOLUTIONS.map((r) => (
                    <button
                      key={r.label}
                      onClick={() => setSelectedRes(r)}
                      style={{
                        padding: "0.375rem 0.625rem",
                        background: selectedRes.label === r.label ? "rgba(139,92,246,0.25)" : "#1a1a1a",
                        border: selectedRes.label === r.label ? "1px solid rgba(139,92,246,0.5)" : "1px solid #2a2a2a",
                        borderRadius: "0.375rem",
                        color: selectedRes.label === r.label ? "#c084fc" : "#777",
                        fontSize: "0.75rem",
                        cursor: "pointer",
                      }}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                style={{
                  background: isGenerating
                    ? "rgba(139,92,246,0.1)"
                    : "linear-gradient(135deg, #7c3aed, #db2777)",
                  border: "none",
                  borderRadius: "0.625rem",
                  padding: "0.875rem 1rem",
                  color: isGenerating ? "#888" : "#fff",
                  fontSize: "0.9rem",
                  fontWeight: 700,
                  cursor: isGenerating ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                  transition: "all 0.2s ease",
                }}
              >
                {isGenerating ? (
                  <><Loader2 size={16} className="animate-spin" /> Generating...</>
                ) : (
                  <><RefreshCw size={16} /> Generate New Image</>
                )}
              </button>

              {genError && (
                <p style={{ color: "#f87171", fontSize: "0.75rem", margin: 0 }}>{genError}</p>
              )}
            </div>
          )}

          {/* Model info */}
          <div style={{
            marginTop: "auto",
            paddingTop: "1rem",
            borderTop: "1px solid #1e1e1e",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            fontSize: "0.75rem", color: "#555",
          }}>
            <span style={{ background: "#171717", padding: "0.25rem 0.5rem", borderRadius: "0.25rem", color: "#666" }}>
              {image.model}
            </span>
            <span>{new Date(image.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
