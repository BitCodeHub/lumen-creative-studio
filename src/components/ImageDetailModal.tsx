"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Sparkles, Download, Copy, Check, Loader2, ZoomIn, RefreshCw } from "lucide-react";

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
  { label: "HD (768)", width: 768, height: 768 },
  { label: "Full HD (1024)", width: 1024, height: 1024 },
  { label: "2K (1280)", width: 1280, height: 1280 },
];

export default function ImageDetailModal({ image, onClose }: ImageDetailModalProps) {
  const [enhancedPrompt, setEnhancedPrompt] = useState("");
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhanceError, setEnhanceError] = useState("");
  const [copied, setCopied] = useState(false);
  const [copiedEnhanced, setCopiedEnhanced] = useState(false);
  const [selectedRatio, setSelectedRatio] = useState(ASPECT_RATIOS[2]);
  const [selectedRes, setSelectedRes] = useState(RESOLUTIONS[1]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [genError, setGenError] = useState("");
  const [imgNaturalSize, setImgNaturalSize] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

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
    return null;
  };

  if (!image) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.92)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        backdropFilter: "blur(4px)",
        overflowY: "auto",
        padding: "0",
      }}
    >
      {/* Sheet slides up from bottom — mobile-native feel */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#111111",
          border: "1px solid #2a2a2a",
          borderRadius: "1.25rem 1.25rem 0 0",
          width: "100%",
          maxWidth: "640px",
          maxHeight: "95vh",
          overflowY: "auto",
          position: "relative",
          paddingBottom: "env(safe-area-inset-bottom, 1rem)",
        }}
      >
        {/* Drag handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "0.75rem 0 0" }}>
          <div style={{ width: "2.5rem", height: "0.25rem", background: "#333", borderRadius: "9999px" }} />
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: "1rem", right: "1rem", zIndex: 10,
            background: "rgba(0,0,0,0.6)", border: "1px solid #333",
            borderRadius: "50%", width: "2rem", height: "2rem",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#aaa", cursor: "pointer",
          }}
        >
          <X size={16} />
        </button>

        {/* Image */}
        <div style={{
          padding: "0.75rem 1rem",
          background: "#0a0a0a",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
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
              maxHeight: "45vh",
              borderRadius: "0.75rem",
              objectFit: "contain",
              display: "block",
            }}
          />

          {/* Resolution badge */}
          {imgNaturalSize && (
            <div style={{
              marginTop: "0.625rem",
              display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "center",
            }}>
              <span style={{
                background: "#1a1a1a", border: "1px solid #2a2a2a",
                borderRadius: "0.375rem", padding: "0.2rem 0.6rem",
                fontSize: "0.72rem", color: "#888",
                display: "flex", alignItems: "center", gap: "0.3rem",
              }}>
                <ZoomIn size={10} /> {imgNaturalSize.w} × {imgNaturalSize.h}
              </span>
              <span style={{
                background: "#1a1a1a", border: "1px solid #2a2a2a",
                borderRadius: "0.375rem", padding: "0.2rem 0.6rem",
                fontSize: "0.72rem", color: "#888",
              }}>
                {getAspectRatio()}
              </span>
            </div>
          )}
        </div>

        {/* Controls */}
        <div style={{ padding: "1.25rem 1rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>

          {/* Action row: Use prompt, Copy, Download */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: "0.5rem" }}>
            <button
              onClick={() => navigator.clipboard.writeText(enhancedPrompt || image.prompt)}
              style={{
                background: "linear-gradient(135deg, #6366f1, #a855f7)",
                border: "none", borderRadius: "0.625rem",
                padding: "0.75rem 1rem", color: "#fff",
                fontWeight: 700, fontSize: "0.9rem",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem",
              }}
            >
              <Sparkles size={15} /> Use prompt
            </button>
            <button
              onClick={() => { navigator.clipboard.writeText(image.prompt); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              style={{
                background: "#1a1a1a", border: "1px solid #2a2a2a",
                borderRadius: "0.625rem", padding: "0.75rem",
                color: "#888", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              {copied ? <Check size={16} color="#00c853" /> : <Copy size={16} />}
            </button>
            <a
              href={generatedImage || image.imageUrl}
              download
              style={{
                background: "#1a1a1a", border: "1px solid #2a2a2a",
                borderRadius: "0.625rem", padding: "0.75rem",
                color: "#888", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                textDecoration: "none",
              }}
            >
              <Download size={16} />
            </a>
          </div>

          {/* Prompt display */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.4rem" }}>
              <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: "0.06em" }}>PROMPT</span>
              <button
                onClick={() => { navigator.clipboard.writeText(image.prompt); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#555", fontSize: "0.72rem" }}
              >
                {copied ? <Check size={12} color="#00c853" /> : "Copy"}
              </button>
            </div>
            <p style={{
              color: "#bbb", fontSize: "0.8rem", lineHeight: 1.6,
              background: "#0d0d0d", border: "1px solid #1e1e1e",
              borderRadius: "0.5rem", padding: "0.625rem",
              margin: 0,
            }}>
              {image.prompt}
            </p>
          </div>

          {/* Enhance button */}
          <button
            onClick={handleEnhance}
            disabled={isEnhancing}
            style={{
              background: isEnhancing
                ? "rgba(139,92,246,0.08)"
                : "linear-gradient(135deg, rgba(139,92,246,0.15), rgba(236,72,153,0.15))",
              border: "1px solid rgba(139,92,246,0.35)",
              borderRadius: "0.625rem",
              padding: "0.75rem 1rem",
              color: isEnhancing ? "#666" : "#c084fc",
              fontSize: "0.875rem", fontWeight: 700,
              cursor: isEnhancing ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
              transition: "all 0.2s",
            }}
          >
            {isEnhancing
              ? <><Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> Enhancing with Qwen 3.5...</>
              : <><Sparkles size={15} /> ✨ AI Enhance Prompt</>
            }
          </button>
          {enhanceError && <p style={{ color: "#f87171", fontSize: "0.75rem", margin: "-0.5rem 0 0" }}>{enhanceError}</p>}

          {/* Enhanced prompt textarea */}
          {enhancedPrompt && (
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#a855f7", textTransform: "uppercase", letterSpacing: "0.06em" }}>✨ ENHANCED PROMPT</span>
                <button
                  onClick={() => { navigator.clipboard.writeText(enhancedPrompt); setCopiedEnhanced(true); setTimeout(() => setCopiedEnhanced(false), 2000); }}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#555", fontSize: "0.72rem" }}
                >
                  {copiedEnhanced ? <Check size={12} color="#00c853" /> : "Copy"}
                </button>
              </div>
              <textarea
                value={enhancedPrompt}
                onChange={(e) => setEnhancedPrompt(e.target.value)}
                rows={5}
                style={{
                  width: "100%",
                  background: "#0d0d0d",
                  border: "1px solid rgba(139,92,246,0.3)",
                  borderRadius: "0.5rem",
                  padding: "0.625rem",
                  color: "#d4b8ff",
                  fontSize: "0.8rem",
                  lineHeight: 1.6,
                  resize: "vertical",
                  boxSizing: "border-box",
                  fontFamily: "inherit",
                }}
              />
            </div>
          )}

          {/* Aspect Ratio */}
          <div>
            <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "0.5rem" }}>
              Aspect Ratio
            </span>
            <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
              {ASPECT_RATIOS.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setSelectedRatio(r)}
                  style={{
                    padding: "0.35rem 0.6rem",
                    background: selectedRatio.value === r.value ? "rgba(139,92,246,0.25)" : "#1a1a1a",
                    border: selectedRatio.value === r.value ? "1px solid rgba(139,92,246,0.5)" : "1px solid #2a2a2a",
                    borderRadius: "0.375rem",
                    color: selectedRatio.value === r.value ? "#c084fc" : "#666",
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
            <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "0.5rem" }}>
              Resolution
            </span>
            <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
              {RESOLUTIONS.map((r) => (
                <button
                  key={r.label}
                  onClick={() => setSelectedRes(r)}
                  style={{
                    padding: "0.35rem 0.6rem",
                    background: selectedRes.label === r.label ? "rgba(139,92,246,0.25)" : "#1a1a1a",
                    border: selectedRes.label === r.label ? "1px solid rgba(139,92,246,0.5)" : "1px solid #2a2a2a",
                    borderRadius: "0.375rem",
                    color: selectedRes.label === r.label ? "#c084fc" : "#666",
                    fontSize: "0.75rem",
                    cursor: "pointer",
                  }}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            style={{
              background: isGenerating
                ? "rgba(139,92,246,0.08)"
                : "linear-gradient(135deg, #7c3aed, #db2777)",
              border: "none",
              borderRadius: "0.625rem",
              padding: "0.875rem",
              color: isGenerating ? "#666" : "#fff",
              fontSize: "0.9rem", fontWeight: 700,
              cursor: isGenerating ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
              transition: "all 0.2s",
            }}
          >
            {isGenerating
              ? <><Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> Generating (~8-10 min)...</>
              : <><RefreshCw size={15} /> Generate New Image</>
            }
          </button>
          {genError && <p style={{ color: "#f87171", fontSize: "0.75rem", margin: "-0.5rem 0 0" }}>{genError}</p>}

          {/* Footer */}
          <div style={{
            paddingTop: "0.75rem",
            borderTop: "1px solid #1e1e1e",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            fontSize: "0.72rem", color: "#444",
          }}>
            <span style={{ background: "#171717", padding: "0.2rem 0.5rem", borderRadius: "0.25rem", color: "#555" }}>
              {image.model}
            </span>
            <span>{new Date(image.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
