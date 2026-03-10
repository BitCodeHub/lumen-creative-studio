"use client";
import { useState, useRef, useCallback } from "react";

const STYLES = [
  {
    id: "linkedin",
    label: "LinkedIn",
    desc: "Clean & confident",
    preview: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80",
  },
  {
    id: "executive",
    label: "Executive",
    desc: "Commanding & sharp",
    preview: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80",
  },
  {
    id: "creative",
    label: "Creative",
    desc: "Bold & expressive",
    preview: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&q=80",
  },
  {
    id: "casual",
    label: "Casual",
    desc: "Approachable & warm",
    preview: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
  },
  {
    id: "studio",
    label: "Studio",
    desc: "Polished & timeless",
    preview: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80",
  },
  {
    id: "glamour",
    label: "Editorial",
    desc: "Radiant & striking",
    preview: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&q=80",
  },
];

type HeadshotResult = {
  style: string;
  label: string;
  promptId: string;
  imageUrl?: string;
  status: "pending" | "done" | "error";
};

export default function HeadshotsPage() {
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [selectedStyles, setSelectedStyles] = useState<string[]>(["linkedin", "executive", "creative"]);
  const [results, setResults] = useState<HeadshotResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedResult, setSelectedResult] = useState<HeadshotResult | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const fileRef = useRef<HTMLInputElement>(null);
  const pollRefs = useRef<Record<string, NodeJS.Timeout>>({});

  const handleFile = (f: File) => {
    setPhoto(f);
    setResults([]);
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotoPreview(e.target?.result as string);
      setStep(2);
    };
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

  const generate = async () => {
    if (!photo || selectedStyles.length === 0) return;
    setError(null);
    setLoading(true);
    setResults([]);
    setStep(3);

    const form = new FormData();
    form.append("photo", photo);
    form.append("styles", JSON.stringify(selectedStyles));

    try {
      const r = await fetch("/api/headshots", { method: "POST", body: form });
      const d = await r.json();

      if (!r.ok) {
        setError(d.error || "Generation failed");
        setLoading(false);
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
      initial.forEach((res, idx) => pollImage(res, idx));
    } catch (e) {
      setError((e as Error).message);
      setLoading(false);
    }
  };

  const doneCount = results.filter((r) => r.status === "done").length;
  const totalCount = results.length;
  const progress = totalCount > 0 ? (doneCount / totalCount) * 100 : 0;
  const allDone = totalCount > 0 && doneCount === totalCount;
  const pendingCount = results.filter(r => r.status === "pending").length;

  return (
    <div style={{ minHeight: "100vh", background: "#080808", color: "#fff", fontFamily: "'Inter', -apple-system, sans-serif" }}>
      
      {/* Header */}
      <header style={{
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "0 40px",
        height: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "rgba(8,8,8,0.95)",
        backdropFilter: "blur(12px)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <a href="/" style={{
            color: "rgba(255,255,255,0.35)",
            textDecoration: "none",
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            gap: 6,
            letterSpacing: 0.2,
            transition: "color 0.15s",
          }}
            onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M5 12l7-7M5 12l7 7" />
            </svg>
            Gallery
          </a>
          <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.08)" }} />
          <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: -0.2 }}>AI Headshots</span>
        </div>

        {/* Step indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {["Upload", "Style", "Generate"].map((s, i) => (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{
                  width: 20, height: 20, borderRadius: "50%",
                  background: step > i + 1 ? "#7c3aed" : step === i + 1 ? "rgba(124,58,237,0.2)" : "transparent",
                  border: step > i + 1 ? "none" : step === i + 1 ? "1.5px solid #7c3aed" : "1.5px solid rgba(255,255,255,0.12)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, fontWeight: 700,
                  color: step > i + 1 ? "#fff" : step === i + 1 ? "#a78bfa" : "rgba(255,255,255,0.3)",
                  transition: "all 0.3s",
                }}>
                  {step > i + 1 ? "✓" : i + 1}
                </div>
                <span style={{
                  fontSize: 12,
                  color: step === i + 1 ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.25)",
                  fontWeight: step === i + 1 ? 500 : 400,
                  transition: "color 0.3s",
                }}>{s}</span>
              </div>
              {i < 2 && <div style={{ width: 24, height: 1, background: "rgba(255,255,255,0.08)" }} />}
            </div>
          ))}
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 32px" }}>

        {/* STEP 1 — Upload */}
        {step === 1 && (
          <div style={{ maxWidth: 520, margin: "0 auto", paddingTop: 32 }}>
            <div style={{ marginBottom: 40, textAlign: "center" }}>
              <h1 style={{ fontSize: 36, fontWeight: 700, letterSpacing: -1, marginBottom: 12, lineHeight: 1.15 }}>
                Professional headshots,<br />
                <span style={{ background: "linear-gradient(135deg, #a78bfa, #818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  in seconds
                </span>
              </h1>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 15, lineHeight: 1.6 }}>
                Upload a clear photo of your face to get started
              </p>
            </div>

            {/* Upload zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
              onClick={() => fileRef.current?.click()}
              style={{
                border: `2px dashed ${dragOver ? "rgba(124,58,237,0.6)" : "rgba(255,255,255,0.08)"}`,
                borderRadius: 20,
                padding: "56px 32px",
                cursor: "pointer",
                background: dragOver ? "rgba(124,58,237,0.05)" : "rgba(255,255,255,0.02)",
                transition: "all 0.2s",
                textAlign: "center",
              }}
            >
              <div style={{
                width: 72, height: 72, borderRadius: 18,
                background: "rgba(124,58,237,0.1)",
                border: "1px solid rgba(124,58,237,0.2)",
                margin: "0 auto 20px",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(124,58,237,0.8)" strokeWidth="1.5">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 6 }}>
                {dragOver ? "Drop to upload" : "Drop your photo here"}
              </div>
              <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 13, marginBottom: 20 }}>
                or <span style={{ color: "#a78bfa", textDecoration: "underline" }}>browse files</span> · JPG, PNG, WEBP
              </div>
              <div style={{
                display: "inline-flex", flexDirection: "column", gap: 6,
                textAlign: "left",
                padding: "14px 20px",
                background: "rgba(255,255,255,0.03)",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.05)",
              }}>
                {["Clear, front-facing face", "Good lighting preferred", "Sharp focus — no blur"].map(tip => (
                  <div key={tip} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
                    <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#7c3aed", flexShrink: 0 }} />
                    {tip}
                  </div>
                ))}
              </div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
          </div>
        )}

        {/* STEP 2 — Style selection */}
        {step === 2 && (
          <div>
            <div style={{ display: "flex", gap: 40, alignItems: "flex-start" }}>
              
              {/* Left: photo + change */}
              <div style={{ flexShrink: 0 }}>
                <div style={{ position: "relative", width: 160 }}>
                  <img
                    src={photoPreview!}
                    alt="Your photo"
                    style={{ width: 160, height: 200, objectFit: "cover", objectPosition: "center top", borderRadius: 16, display: "block" }}
                  />
                  <button
                    onClick={() => fileRef.current?.click()}
                    style={{
                      position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)",
                      padding: "6px 14px",
                      background: "rgba(0,0,0,0.7)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      borderRadius: 8,
                      color: "rgba(255,255,255,0.7)",
                      fontSize: 11, fontWeight: 500,
                      cursor: "pointer",
                      backdropFilter: "blur(8px)",
                      whiteSpace: "nowrap",
                    }}
                  >Change photo</button>
                </div>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
              </div>

              {/* Right: style grid + CTA */}
              <div style={{ flex: 1 }}>
                <div style={{ marginBottom: 24 }}>
                  <h2 style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.5, marginBottom: 6 }}>Choose your styles</h2>
                  <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 14 }}>Select up to 6 — we'll generate one headshot per style</p>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 28 }}>
                  {STYLES.map((s) => {
                    const active = selectedStyles.includes(s.id);
                    return (
                      <button
                        key={s.id}
                        onClick={() => toggleStyle(s.id)}
                        style={{
                          padding: 0,
                          borderRadius: 14,
                          border: active ? "2px solid #7c3aed" : "2px solid transparent",
                          background: "transparent",
                          cursor: "pointer",
                          overflow: "hidden",
                          position: "relative",
                          transition: "all 0.15s",
                          outline: "none",
                        }}
                      >
                        <img
                          src={s.preview}
                          alt={s.label}
                          style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover", display: "block" }}
                        />
                        <div style={{
                          position: "absolute", inset: 0,
                          background: active
                            ? "linear-gradient(to bottom, rgba(124,58,237,0.3) 0%, rgba(0,0,0,0.7) 100%)"
                            : "linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.75) 100%)",
                          transition: "background 0.15s",
                        }} />
                        {active && (
                          <div style={{
                            position: "absolute", top: 8, right: 8,
                            width: 22, height: 22, borderRadius: "50%",
                            background: "#7c3aed",
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}>
                            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                              <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>
                        )}
                        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "10px 12px" }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 2 }}>{s.label}</div>
                          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)" }}>{s.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {error && (
                  <div style={{
                    padding: "12px 16px",
                    background: "rgba(239,68,68,0.08)",
                    border: "1px solid rgba(239,68,68,0.2)",
                    borderRadius: 12,
                    color: "#fca5a5",
                    fontSize: 13,
                    marginBottom: 16,
                    display: "flex", gap: 8,
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
                      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    {error}
                  </div>
                )}

                <button
                  onClick={generate}
                  disabled={selectedStyles.length === 0 || loading}
                  style={{
                    padding: "14px 32px",
                    borderRadius: 12,
                    border: "none",
                    background: selectedStyles.length > 0 && !loading
                      ? "linear-gradient(135deg, #7c3aed, #6d28d9)"
                      : "rgba(255,255,255,0.06)",
                    color: selectedStyles.length > 0 && !loading ? "#fff" : "rgba(255,255,255,0.25)",
                    fontSize: 14, fontWeight: 600,
                    cursor: selectedStyles.length > 0 && !loading ? "pointer" : "not-allowed",
                    letterSpacing: 0.1,
                    display: "flex", alignItems: "center", gap: 8,
                    transition: "all 0.15s",
                    boxShadow: selectedStyles.length > 0 && !loading ? "0 4px 20px rgba(124,58,237,0.35)" : "none",
                  }}
                >
                  Generate {selectedStyles.length} headshot{selectedStyles.length !== 1 ? "s" : ""}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3 — Results */}
        {step === 3 && (
          <div>
            {/* Progress header */}
            {!allDone && totalCount > 0 && (
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                marginBottom: 32,
              }}>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Generating your headshots</div>
                  <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 13 }}>{doneCount} of {totalCount} complete</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 140, height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{
                      height: "100%", width: `${progress}%`,
                      background: "linear-gradient(90deg, #7c3aed, #818cf8)",
                      borderRadius: 3, transition: "width 0.5s ease",
                    }} />
                  </div>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", minWidth: 28 }}>{Math.round(progress)}%</span>
                </div>
              </div>
            )}

            {allDone && (
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                marginBottom: 32, padding: "16px 20px",
                background: "rgba(124,58,237,0.08)",
                border: "1px solid rgba(124,58,237,0.2)",
                borderRadius: 14,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(124,58,237,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>All {doneCount} headshots ready</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>Click any image to preview or download</div>
                  </div>
                </div>
                <button
                  onClick={() => { setResults([]); setPhotoPreview(null); setPhoto(null); setStep(1); setError(null); }}
                  style={{
                    padding: "8px 18px", borderRadius: 10,
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "transparent", color: "rgba(255,255,255,0.5)",
                    cursor: "pointer", fontSize: 13, fontWeight: 500,
                  }}
                >New session</button>
              </div>
            )}

            {/* Loading skeleton / results grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
              {results.length === 0 && loading
                ? selectedStyles.map((s) => (
                  <div key={s} style={{
                    borderRadius: 16, overflow: "hidden",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    aspectRatio: "2/3",
                    animation: "pulse 2s ease-in-out infinite",
                  }} />
                ))
                : results.map((res, i) => {
                  const styleInfo = STYLES.find((s) => s.id === res.style);
                  return (
                    <div
                      key={i}
                      onClick={() => res.status === "done" && res.imageUrl && setSelectedResult(res)}
                      style={{
                        borderRadius: 16, overflow: "hidden",
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        cursor: res.status === "done" ? "pointer" : "default",
                        transition: "transform 0.2s, box-shadow 0.2s, border-color 0.2s",
                        position: "relative",
                      }}
                      onMouseEnter={e => {
                        if (res.status === "done") {
                          (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
                          (e.currentTarget as HTMLDivElement).style.boxShadow = "0 12px 40px rgba(0,0,0,0.5)";
                          (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(124,58,237,0.3)";
                        }
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLDivElement).style.transform = "none";
                        (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
                        (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.06)";
                      }}
                    >
                      {res.status === "done" && res.imageUrl ? (
                        <>
                          <img
                            src={res.imageUrl}
                            alt={res.label}
                            style={{ width: "100%", aspectRatio: "2/3", objectFit: "cover", display: "block" }}
                          />
                          <div style={{
                            position: "absolute", inset: 0,
                            background: "linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.75))",
                            display: "flex", flexDirection: "column", justifyContent: "flex-end",
                            padding: 14,
                          }}>
                            <div style={{ fontSize: 13, fontWeight: 600 }}>{styleInfo?.label}</div>
                            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{styleInfo?.desc}</div>
                          </div>
                          <div style={{
                            position: "absolute", top: 10, right: 10,
                            opacity: 0, transition: "opacity 0.15s",
                          }} className="dl-btn">
                            <a
                              href={res.imageUrl}
                              download={`headshot_${res.style}.jpg`}
                              onClick={e => e.stopPropagation()}
                              style={{
                                width: 32, height: 32, borderRadius: 8,
                                background: "rgba(0,0,0,0.7)",
                                border: "1px solid rgba(255,255,255,0.15)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                backdropFilter: "blur(8px)",
                              }}
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                              </svg>
                            </a>
                          </div>
                        </>
                      ) : (
                        <div style={{
                          aspectRatio: "2/3",
                          display: "flex", flexDirection: "column",
                          alignItems: "center", justifyContent: "center",
                          gap: 12,
                          background: "linear-gradient(135deg, rgba(124,58,237,0.04), rgba(79,70,229,0.04))",
                        }}>
                          <div style={{
                            width: 32, height: 32,
                            border: "2px solid rgba(124,58,237,0.3)",
                            borderTopColor: "#7c3aed",
                            borderRadius: "50%",
                            animation: "spin 1s linear infinite",
                          }} />
                          <div style={{ textAlign: "center", padding: "0 12px" }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.6)", marginBottom: 3 }}>{styleInfo?.label}</div>
                            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>Generating...</div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>

            {error && (
              <div style={{
                marginTop: 24, padding: "12px 16px",
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.2)",
                borderRadius: 12,
                color: "#fca5a5",
                fontSize: 13,
                display: "flex", gap: 8,
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Lightbox */}
      {selectedResult && selectedResult.imageUrl && (
        <div
          onClick={() => setSelectedResult(null)}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.9)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 100, padding: 24,
            backdropFilter: "blur(16px)",
          }}
        >
          <button
            onClick={() => setSelectedResult(null)}
            style={{
              position: "absolute", top: 20, right: 24,
              width: 36, height: 36, borderRadius: 10,
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.6)",
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, lineHeight: 1,
            }}
          >×</button>
          <div
            onClick={e => e.stopPropagation()}
            style={{
              display: "flex", gap: 0,
              background: "#111",
              borderRadius: 20,
              overflow: "hidden",
              maxHeight: "85vh",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <img
              src={selectedResult.imageUrl}
              alt={selectedResult.label}
              style={{ height: "85vh", maxHeight: 700, width: "auto", display: "block", objectFit: "contain" }}
            />
            <div style={{ width: 240, padding: "28px 24px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
                  {STYLES.find(s => s.id === selectedResult.style)?.label}
                </div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>
                  {STYLES.find(s => s.id === selectedResult.style)?.desc}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <a
                  href={selectedResult.imageUrl}
                  download={`headshot_${selectedResult.style}.jpg`}
                  target="_blank"
                  rel="noopener"
                  style={{
                    padding: "12px 0", borderRadius: 12,
                    background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
                    color: "#fff", textDecoration: "none",
                    fontSize: 14, fontWeight: 600,
                    textAlign: "center",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                    boxShadow: "0 4px 20px rgba(124,58,237,0.35)",
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Download
                </a>
                <button
                  onClick={() => setSelectedResult(null)}
                  style={{
                    padding: "11px 0", borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: "transparent",
                    color: "rgba(255,255,255,0.4)",
                    cursor: "pointer", fontSize: 14,
                  }}
                >Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.7; } }
        * { box-sizing: border-box; }
        .headshots-card:hover .dl-btn { opacity: 1 !important; }
      `}</style>
    </div>
  );
}
