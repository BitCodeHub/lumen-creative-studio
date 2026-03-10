"use client";
import { useState, useRef, useCallback } from "react";

const STYLES = [
  { id: "linkedin", label: "LinkedIn Pro", icon: "💼" },
  { id: "creative", label: "Creative", icon: "🎨" },
  { id: "casual", label: "Casual", icon: "😊" },
  { id: "executive", label: "Executive", icon: "🏢" },
  { id: "studio", label: "Studio", icon: "📸" },
  { id: "glamour", label: "Glamour", icon: "✨" },
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
  const [selectedStyles, setSelectedStyles] = useState<string[]>(["linkedin", "creative", "casual"]);
  const [results, setResults] = useState<HeadshotResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const pollRefs = useRef<Record<string, NodeJS.Timeout>>({});

  const handleFile = (f: File) => {
    setPhoto(f);
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

  const generate = async () => {
    if (!photo || selectedStyles.length === 0) return;
    setError(null);
    setLoading(true);
    setResults([]);

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

      const initial: HeadshotResult[] = d.jobs.map((j: any) => ({
        style: j.style,
        label: j.label,
        promptId: j.promptId,
        status: "pending",
      }));
      setResults(initial);
      setLoading(false);

      initial.forEach((res, idx) => pollImage(res, idx));
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  };

  const doneCount = results.filter((r) => r.status === "done").length;

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#fff", fontFamily: "Inter, sans-serif" }}>
      {/* Header */}
      <div style={{ borderBottom: "1px solid #1a1a1a", padding: "20px 40px", display: "flex", alignItems: "center", gap: 16 }}>
        <a href="/" style={{ color: "#888", textDecoration: "none", fontSize: 14 }}>← Back</a>
        <div style={{ width: 1, height: 20, background: "#333" }} />
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>AI Headshots</h1>
          <p style={{ margin: 0, color: "#888", fontSize: 13 }}>Upload 1 photo → get professional headshots in 6 styles</p>
        </div>
        <div style={{ marginLeft: "auto", background: "#1a1a2e", border: "1px solid #7c3aed", borderRadius: 8, padding: "6px 14px", fontSize: 13, color: "#a78bfa" }}>
          ⚡ Powered by DGX Spark
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 32 }}>

          {/* Left — Upload + Config */}
          <div>
            {/* Upload zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
              onClick={() => fileRef.current?.click()}
              style={{
                border: `2px dashed ${dragOver ? "#7c3aed" : "#333"}`,
                borderRadius: 16,
                padding: 24,
                textAlign: "center",
                cursor: "pointer",
                background: dragOver ? "rgba(124,58,237,0.05)" : "#111",
                transition: "all 0.2s",
                marginBottom: 24,
                minHeight: 240,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" style={{ maxWidth: "100%", maxHeight: 220, borderRadius: 12, objectFit: "cover" }} />
              ) : (
                <>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🤳</div>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: 15 }}>Upload your photo</p>
                  <p style={{ margin: "6px 0 0", color: "#666", fontSize: 13 }}>Drag & drop or click • JPG, PNG, WEBP</p>
                  <p style={{ margin: "4px 0 0", color: "#555", fontSize: 12 }}>Best results: clear face, good lighting</p>
                </>
              )}
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
            </div>

            {/* Style selector */}
            <div style={{ marginBottom: 24 }}>
              <p style={{ margin: "0 0 12px", fontWeight: 600, fontSize: 14, color: "#ccc" }}>
                Select styles ({selectedStyles.length}/6)
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {STYLES.map((s) => {
                  const active = selectedStyles.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      onClick={() => toggleStyle(s.id)}
                      style={{
                        padding: "10px 12px",
                        borderRadius: 10,
                        border: `1px solid ${active ? "#7c3aed" : "#333"}`,
                        background: active ? "rgba(124,58,237,0.15)" : "#111",
                        color: active ? "#a78bfa" : "#888",
                        cursor: "pointer",
                        textAlign: "left",
                        fontSize: 13,
                        fontWeight: active ? 600 : 400,
                        transition: "all 0.15s",
                      }}
                    >
                      {s.icon} {s.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Generate button */}
            <button
              onClick={generate}
              disabled={!photo || selectedStyles.length === 0 || loading}
              style={{
                width: "100%",
                padding: "14px 0",
                borderRadius: 12,
                border: "none",
                background: (!photo || loading) ? "#333" : "linear-gradient(135deg, #7c3aed, #4f46e5)",
                color: (!photo || loading) ? "#666" : "#fff",
                fontSize: 15,
                fontWeight: 700,
                cursor: (!photo || loading) ? "not-allowed" : "pointer",
                transition: "all 0.2s",
              }}
            >
              {loading ? "⏳ Queuing jobs..." : `✨ Generate ${selectedStyles.length} Headshots`}
            </button>

            {error && (
              <div style={{ marginTop: 12, padding: 12, background: "#1a0000", border: "1px solid #7f1d1d", borderRadius: 8, color: "#f87171", fontSize: 13 }}>
                ⚠️ {error}
              </div>
            )}

            {/* Value prop */}
            <div style={{ marginTop: 24, padding: 16, background: "#111", border: "1px solid #1e1e2e", borderRadius: 12 }}>
              <p style={{ margin: "0 0 8px", color: "#888", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Why Lumen Headshots?</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {["$0 — unlimited generations", "6 professional styles instantly", "800K image-trained LoRA", "Private & secure — no data stored"].map((t) => (
                  <div key={t} style={{ display: "flex", gap: 8, fontSize: 12, color: "#aaa" }}>
                    <span style={{ color: "#7c3aed" }}>✓</span> {t}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right — Results grid */}
          <div>
            {results.length === 0 && !loading ? (
              <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#444", textAlign: "center", minHeight: 400 }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>👤</div>
                <p style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Your headshots will appear here</p>
                <p style={{ margin: "8px 0 0", fontSize: 13 }}>Upload a photo and select styles to get started</p>
                <div style={{ marginTop: 24, display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
                  {["LinkedIn headshots people pay $30-100 for", "Same quality as Remini & Lensa", "Runs on 121GB VRAM DGX Spark"].map((t) => (
                    <div key={t} style={{ padding: "6px 12px", background: "#111", border: "1px solid #222", borderRadius: 20, fontSize: 12, color: "#666" }}>{t}</div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {results.length > 0 && (
                  <div style={{ marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 14, color: "#888" }}>
                      {doneCount}/{results.length} complete
                      {doneCount < results.length && " · generating..."}
                    </span>
                    {doneCount > 0 && (
                      <span style={{ fontSize: 12, color: "#7c3aed" }}>Click any image to download</span>
                    )}
                  </div>
                )}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
                  {results.map((res, i) => (
                    <div key={i} style={{ borderRadius: 12, overflow: "hidden", background: "#111", border: "1px solid #222", position: "relative" }}>
                      {res.status === "done" && res.imageUrl ? (
                        <a href={res.imageUrl} download={`headshot_${res.style}.jpg`} target="_blank" rel="noopener">
                          <img
                            src={res.imageUrl}
                            alt={res.label}
                            style={{ width: "100%", display: "block", aspectRatio: "2/3", objectFit: "cover" }}
                          />
                        </a>
                      ) : (
                        <div style={{ aspectRatio: "2/3", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, background: "linear-gradient(135deg, #111, #1a1a2e)" }}>
                          <div style={{ width: 36, height: 36, border: "3px solid #7c3aed", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                          <span style={{ fontSize: 12, color: "#666" }}>Generating...</span>
                        </div>
                      )}
                      <div style={{ padding: "8px 12px", fontSize: 12, color: "#888", background: "#111" }}>
                        {STYLES.find((s) => s.id === res.style)?.icon} {res.label}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
