"use client";
import { useState, useRef, useCallback } from "react";

const STYLES = [
  {
    id: "linkedin",
    label: "LinkedIn Pro",
    icon: "💼",
    desc: "Clean, confident, professional",
    color: "#0077b5",
  },
  {
    id: "creative",
    label: "Creative",
    icon: "🎨",
    desc: "Bold, expressive, memorable",
    color: "#7c3aed",
  },
  {
    id: "casual",
    label: "Casual",
    icon: "😊",
    desc: "Approachable, warm, natural",
    color: "#059669",
  },
  {
    id: "executive",
    label: "Executive",
    icon: "🏢",
    desc: "Commanding, sharp, authoritative",
    color: "#1e40af",
  },
  {
    id: "studio",
    label: "Studio",
    icon: "📸",
    desc: "Polished, timeless, elegant",
    color: "#6b7280",
  },
  {
    id: "glamour",
    label: "Glamour",
    icon: "✨",
    desc: "Radiant, editorial, striking",
    color: "#be185d",
  },
];

type HeadshotResult = {
  style: string;
  label: string;
  promptId: string;
  imageUrl?: string;
  status: "pending" | "done" | "error";
};

const LOADING_MESSAGES = [
  "Analyzing facial features...",
  "Crafting the perfect look...",
  "Applying professional lighting...",
  "Fine-tuning details...",
  "Almost ready...",
];

export default function HeadshotsPage() {
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [selectedStyles, setSelectedStyles] = useState<string[]>(["linkedin", "creative", "casual"]);
  const [results, setResults] = useState<HeadshotResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMsg, setLoadingMsg] = useState(0);
  const [selectedResult, setSelectedResult] = useState<HeadshotResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const pollRefs = useRef<Record<string, NodeJS.Timeout>>({});
  const msgTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleFile = (f: File) => {
    setPhoto(f);
    setResults([]);
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => setPhotoPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  };

  const toggleStyle = (id: string) => {
    setSelectedStyles((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : prev.length < 6 ? [...prev, id] : prev
    );
  };

  const pollImage = useCallback((result: HeadshotResult, idx: number) => {
    const interval = setInterval(async () => {
      try {
        const r = await fetch(`/api/generate?promptId=${result.promptId}`);
        if (r.ok) {
          const d = await r.json();
          if (d.status === "done" && d.imageUrl) {
            clearInterval(interval);
            delete pollRefs.current[result.promptId];
            setResults((prev) =>
              prev.map((res, i) =>
                i === idx ? { ...res, imageUrl: d.imageUrl, status: "done" } : res
              )
            );
          }
        }
      } catch {}
    }, 3000);
    pollRefs.current[result.promptId] = interval;
  }, []);

  const startLoadingMessages = () => {
    let i = 0;
    msgTimerRef.current = setInterval(() => {
      i = (i + 1) % LOADING_MESSAGES.length;
      setLoadingMsg(i);
    }, 3500);
  };

  const generate = async () => {
    if (!photo || selectedStyles.length === 0) return;
    setError(null);
    setLoading(true);
    setResults([]);
    setLoadingMsg(0);
    startLoadingMessages();

    const form = new FormData();
    form.append("photo", photo);
    form.append("styles", JSON.stringify(selectedStyles));

    try {
      const r = await fetch("/api/headshots", { method: "POST", body: form });
      const d = await r.json();

      if (!r.ok) {
        setError(d.error || "Generation failed");
        setLoading(false);
        if (msgTimerRef.current) clearInterval(msgTimerRef.current);
        return;
      }

      const initial: HeadshotResult[] = d.jobs.map((j: { style: string; label: string; promptId: string }) => ({
        style: j.style,
        label: j.label,
        promptId: j.promptId,
        status: "pending" as const,
      }));
      setResults(initial);
      setLoading(false);
      if (msgTimerRef.current) clearInterval(msgTimerRef.current);

      initial.forEach((res, idx) => pollImage(res, idx));
    } catch (e) {
      setError((e as Error).message);
      setLoading(false);
      if (msgTimerRef.current) clearInterval(msgTimerRef.current);
    }
  };

  const doneCount = results.filter((r) => r.status === "done").length;
  const totalCount = results.length;
  const progress = totalCount > 0 ? (doneCount / totalCount) * 100 : 0;
  const allDone = totalCount > 0 && doneCount === totalCount;

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#fff", fontFamily: "Inter, sans-serif" }}>
      {/* Consistent app header */}
      <div style={{
        borderBottom: "1px solid #1a1a1a",
        padding: "16px 32px",
        display: "flex",
        alignItems: "center",
        gap: 16,
        background: "#0a0a0a",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}>
        <a href="/" style={{ color: "#666", textDecoration: "none", fontSize: 13, display: "flex", alignItems: "center", gap: 6, transition: "color 0.15s" }}
          onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
          onMouseLeave={e => (e.currentTarget.style.color = "#666")}
        >
          ← Explore
        </a>
        <div style={{ width: 1, height: 16, background: "#2a2a2a" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16,
          }}>🤳</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.2 }}>AI Headshots</div>
            <div style={{ fontSize: 12, color: "#666", lineHeight: 1.2 }}>Professional portraits in seconds</div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        {/* All-done banner */}
        {allDone && (
          <div style={{
            marginBottom: 24,
            padding: "16px 24px",
            background: "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(79,70,229,0.15))",
            border: "1px solid rgba(124,58,237,0.3)",
            borderRadius: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 24 }}>🎉</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>All {doneCount} headshots ready!</div>
                <div style={{ fontSize: 13, color: "#a78bfa" }}>Click any image to view or download</div>
              </div>
            </div>
            <button
              onClick={() => { setResults([]); setPhotoPreview(null); setPhoto(null); }}
              style={{
                padding: "8px 18px", borderRadius: 10, border: "1px solid rgba(124,58,237,0.4)",
                background: "transparent", color: "#a78bfa", cursor: "pointer", fontSize: 13, fontWeight: 600,
              }}
            >
              ↺ New session
            </button>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 32, alignItems: "start" }}>

          {/* LEFT PANEL */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Upload zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
              onClick={() => fileRef.current?.click()}
              style={{
                border: `2px dashed ${dragOver ? "#7c3aed" : photoPreview ? "rgba(124,58,237,0.4)" : "#2a2a2a"}`,
                borderRadius: 20,
                cursor: "pointer",
                background: dragOver ? "rgba(124,58,237,0.06)" : photoPreview ? "#111" : "#0f0f0f",
                transition: "all 0.2s",
                overflow: "hidden",
                position: "relative",
              }}
            >
              {photoPreview ? (
                <div style={{ position: "relative" }}>
                  <img
                    src={photoPreview}
                    alt="Your photo"
                    style={{ width: "100%", display: "block", maxHeight: 320, objectFit: "cover", objectPosition: "center top" }}
                  />
                  <div style={{
                    position: "absolute", inset: 0,
                    background: "linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.7))",
                    display: "flex", alignItems: "flex-end", padding: 16,
                  }}>
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>Click to change photo</span>
                  </div>
                </div>
              ) : (
                <div style={{ padding: "48px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12, textAlign: "center" }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: 16,
                    background: "linear-gradient(135deg, rgba(124,58,237,0.2), rgba(79,70,229,0.2))",
                    border: "1px solid rgba(124,58,237,0.3)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 28,
                  }}>📷</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Drop your photo here</div>
                    <div style={{ color: "#555", fontSize: 13 }}>or click to browse · JPG, PNG, WEBP</div>
                  </div>
                  <div style={{ borderTop: "1px solid #1a1a1a", width: "100%", paddingTop: 16, display: "flex", flexDirection: "column", gap: 6 }}>
                    {["Clear face, front-facing", "Good lighting, sharp focus", "Neutral expression works best"].map((tip) => (
                      <div key={tip} style={{ display: "flex", gap: 8, fontSize: 12, color: "#555", textAlign: "left" }}>
                        <span style={{ color: "#7c3aed", flexShrink: 0 }}>·</span>
                        {tip}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
            </div>

            {/* Style selector */}
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: "#ccc" }}>Choose your styles</span>
                <span style={{ fontSize: 12, color: "#555" }}>{selectedStyles.length} / 6 selected</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {STYLES.map((s) => {
                  const active = selectedStyles.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      onClick={() => toggleStyle(s.id)}
                      style={{
                        padding: "12px 14px",
                        borderRadius: 14,
                        border: `1px solid ${active ? "rgba(124,58,237,0.5)" : "#1e1e1e"}`,
                        background: active ? "rgba(124,58,237,0.12)" : "#0f0f0f",
                        color: active ? "#e9d5ff" : "#777",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "all 0.15s",
                        position: "relative",
                        overflow: "hidden",
                      }}
                    >
                      <div style={{ fontSize: 18, marginBottom: 4 }}>{s.icon}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{s.label}</div>
                      <div style={{ fontSize: 11, opacity: 0.6 }}>{s.desc}</div>
                      {active && (
                        <div style={{
                          position: "absolute", top: 8, right: 8,
                          width: 16, height: 16, borderRadius: "50%",
                          background: "#7c3aed",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 9, color: "#fff",
                        }}>✓</div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Generate button */}
            <button
              onClick={generate}
              disabled={!photo || selectedStyles.length === 0 || loading || results.filter(r => r.status === 'pending').length > 0}
              style={{
                width: "100%",
                padding: "16px 0",
                borderRadius: 16,
                border: "none",
                background: (!photo || loading) ? "#1a1a1a"
                  : "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
                color: (!photo || loading) ? "#444" : "#fff",
                fontSize: 15,
                fontWeight: 700,
                cursor: (!photo || loading || results.filter(r => r.status === 'pending').length > 0) ? "not-allowed" : "pointer",
                transition: "all 0.2s",
                letterSpacing: 0.3,
                boxShadow: (!photo || loading) ? "none" : "0 4px 24px rgba(124,58,237,0.3)",
              }}
            >
              {loading
                ? "⏳ Starting generation..."
                : results.filter(r => r.status === 'pending').length > 0
                ? `⏳ Generating ${results.filter(r => r.status === 'pending').length} headshots...`
                : `✨ Generate ${selectedStyles.length} headshot${selectedStyles.length !== 1 ? "s" : ""}`}
            </button>

            {/* Loading message */}
            {(loading || results.filter(r => r.status === 'pending').length > 0) && (
              <div style={{
                padding: "12px 16px",
                background: "#111",
                borderRadius: 12,
                border: "1px solid #1e1e1e",
                fontSize: 13,
                color: "#888",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}>
                <div style={{
                  width: 14, height: 14, border: "2px solid #7c3aed",
                  borderTopColor: "transparent", borderRadius: "50%",
                  flexShrink: 0, animation: "spin 0.8s linear infinite",
                }} />
                {LOADING_MESSAGES[loadingMsg]}
              </div>
            )}

            {/* Progress bar */}
            {totalCount > 0 && !allDone && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#555", marginBottom: 6 }}>
                  <span>{doneCount} of {totalCount} complete</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div style={{ height: 4, background: "#1a1a1a", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{
                    height: "100%",
                    width: `${progress}%`,
                    background: "linear-gradient(90deg, #7c3aed, #4f46e5)",
                    borderRadius: 4,
                    transition: "width 0.5s ease",
                  }} />
                </div>
              </div>
            )}

            {error && (
              <div style={{
                padding: "12px 16px",
                background: "#120000",
                border: "1px solid #3b0000",
                borderRadius: 12,
                color: "#f87171",
                fontSize: 13,
                display: "flex", gap: 8, alignItems: "flex-start",
              }}>
                <span style={{ flexShrink: 0 }}>⚠️</span>
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* RIGHT PANEL — Results */}
          <div>
            {results.length === 0 && !loading ? (
              /* Empty state */
              <div style={{
                minHeight: 480,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                padding: 40,
              }}>
                <div style={{
                  width: 120, height: 120, borderRadius: 24,
                  background: "linear-gradient(135deg, rgba(124,58,237,0.1), rgba(79,70,229,0.1))",
                  border: "1px solid rgba(124,58,237,0.15)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 48, marginBottom: 24,
                }}>👤</div>
                <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
                  Your headshots appear here
                </div>
                <div style={{ color: "#555", fontSize: 14, maxWidth: 340, lineHeight: 1.6 }}>
                  Upload a photo, pick your styles, and get a set of professional headshots in seconds.
                </div>
                <div style={{ display: "flex", gap: 10, marginTop: 28, flexWrap: "wrap", justifyContent: "center" }}>
                  {["Corporate & polished", "Creative & expressive", "Casual & approachable"].map((t) => (
                    <div key={t} style={{
                      padding: "8px 16px",
                      background: "#111",
                      border: "1px solid #1e1e1e",
                      borderRadius: 20,
                      fontSize: 13,
                      color: "#666",
                    }}>{t}</div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
                {results.map((res, i) => {
                  const styleInfo = STYLES.find((s) => s.id === res.style);
                  return (
                    <div
                      key={i}
                      onClick={() => res.status === "done" && res.imageUrl && setSelectedResult(res)}
                      style={{
                        borderRadius: 16,
                        overflow: "hidden",
                        background: "#111",
                        border: "1px solid #1e1e1e",
                        cursor: res.status === "done" ? "pointer" : "default",
                        transition: "transform 0.15s, box-shadow 0.15s",
                      }}
                      onMouseEnter={e => {
                        if (res.status === "done") {
                          (e.currentTarget as HTMLDivElement).style.transform = "scale(1.02)";
                          (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 32px rgba(0,0,0,0.5)";
                        }
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLDivElement).style.transform = "scale(1)";
                        (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
                      }}
                    >
                      {res.status === "done" && res.imageUrl ? (
                        <img
                          src={res.imageUrl}
                          alt={res.label}
                          style={{ width: "100%", display: "block", aspectRatio: "2/3", objectFit: "cover" }}
                        />
                      ) : (
                        <div style={{
                          aspectRatio: "2/3",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 14,
                          background: "linear-gradient(135deg, #111, #0f0f1a)",
                        }}>
                          <div style={{
                            width: 40, height: 40,
                            border: "3px solid rgba(124,58,237,0.4)",
                            borderTopColor: "#7c3aed",
                            borderRadius: "50%",
                            animation: "spin 1s linear infinite",
                          }} />
                          <span style={{ fontSize: 12, color: "#444" }}>Creating your look</span>
                        </div>
                      )}
                      <div style={{
                        padding: "10px 14px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 14 }}>{styleInfo?.icon}</span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: "#ccc" }}>{res.label}</span>
                        </div>
                        {res.status === "done" && (
                          <a
                            href={res.imageUrl}
                            download={`headshot_${res.style}.jpg`}
                            target="_blank"
                            rel="noopener"
                            onClick={e => e.stopPropagation()}
                            style={{
                              fontSize: 12, color: "#7c3aed", textDecoration: "none",
                              padding: "4px 10px", border: "1px solid rgba(124,58,237,0.3)",
                              borderRadius: 8, transition: "all 0.15s",
                            }}
                          >↓</a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {selectedResult && selectedResult.imageUrl && (
        <div
          onClick={() => setSelectedResult(null)}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.92)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 100, padding: 24,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "#111",
              borderRadius: 24,
              overflow: "hidden",
              maxWidth: 480,
              width: "100%",
              border: "1px solid #222",
            }}
          >
            <img
              src={selectedResult.imageUrl}
              alt={selectedResult.label}
              style={{ width: "100%", display: "block", maxHeight: "65vh", objectFit: "cover" }}
            />
            <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>
                  {STYLES.find(s => s.id === selectedResult.style)?.icon} {selectedResult.label}
                </div>
                <div style={{ fontSize: 13, color: "#666", marginTop: 2 }}>
                  {STYLES.find(s => s.id === selectedResult.style)?.desc}
                </div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => setSelectedResult(null)}
                  style={{
                    padding: "8px 16px", borderRadius: 10,
                    border: "1px solid #2a2a2a",
                    background: "transparent", color: "#888",
                    cursor: "pointer", fontSize: 13,
                  }}
                >Close</button>
                <a
                  href={selectedResult.imageUrl}
                  download={`headshot_${selectedResult.style}.jpg`}
                  target="_blank"
                  rel="noopener"
                  style={{
                    padding: "8px 18px", borderRadius: 10,
                    background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
                    color: "#fff", textDecoration: "none",
                    fontSize: 13, fontWeight: 700,
                    display: "flex", alignItems: "center", gap: 6,
                  }}
                >↓ Download</a>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .headshots-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
