"use client";
import { useState, useRef, useCallback } from "react";

const STYLES = [
  { id: "linkedin", label: "LinkedIn Pro", icon: "💼", desc: "Clean & professional" },
  { id: "creative", label: "Creative", icon: "🎨", desc: "Artistic flair" },
  { id: "casual", label: "Casual", icon: "😊", desc: "Warm & approachable" },
  { id: "executive", label: "Executive", icon: "🏢", desc: "C-suite presence" },
  { id: "studio", label: "Studio", icon: "📸", desc: "Classic portrait" },
  { id: "glamour", label: "Glamour", icon: "✨", desc: "Editorial polish" },
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
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const fileRef = useRef<HTMLInputElement>(null);
  const pollRefs = useRef<Record<string, NodeJS.Timeout>>({});

  const handleFile = (f: File) => {
    setPhoto(f);
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
        status: "pending",
      }));
      setResults(initial);
      setLoading(false);

      initial.forEach((res, idx) => pollImage(res, idx));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setLoading(false);
    }
  };

  const doneCount = results.filter((r) => r.status === "done").length;
  const allDone = doneCount === results.length && results.length > 0;

  const resetAll = () => {
    setPhoto(null);
    setPhotoPreview(null);
    setSelectedStyles(["linkedin", "creative", "casual"]);
    setResults([]);
    setStep(1);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <header className="border-b border-[#1a1a1a] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <a href="/" className="text-[#666] hover:text-white transition-colors text-sm flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back
          </a>
          <div className="w-px h-5 bg-[#333]" />
          <div>
            <h1 className="text-xl font-bold tracking-tight">AI Headshots</h1>
            <p className="text-xs text-[#666]">Professional photos in seconds</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${step >= s ? "bg-gradient-to-br from-violet-600 to-indigo-600 text-white" : "bg-[#1a1a1a] text-[#444]"}`}>
                {s === 1 ? "📷" : s === 2 ? "🎨" : "✨"}
              </div>
              {s < 3 && <div className={`w-8 h-0.5 ${step > s ? "bg-violet-600" : "bg-[#222]"}`} />}
            </div>
          ))}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        
        {step === 1 && (
          <div className="text-center max-w-lg mx-auto">
            <div className="mb-8">
              <div className="text-6xl mb-4">📸</div>
              <h2 className="text-2xl font-bold mb-2">Upload Your Photo</h2>
              <p className="text-[#888] text-sm">One clear photo is all you need. We will create multiple professional styles.</p>
            </div>
            
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-12 cursor-pointer transition-all ${dragOver ? "border-violet-500 bg-violet-500/5" : "border-[#333] hover:border-[#555] bg-[#111]"}`}
            >
              <div className="text-4xl mb-4">🤳</div>
              <p className="font-semibold mb-1">Drop your photo here</p>
              <p className="text-[#666] text-sm mb-4">or click to browse</p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] rounded-full text-xs text-[#888]">
                <span>JPG, PNG, WEBP</span>
                <span className="text-[#333]">•</span>
                <span>Max 10MB</span>
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
            </div>
            
            <div className="mt-8 grid grid-cols-3 gap-4 text-xs text-[#666]">
              <div className="p-3 bg-[#111] rounded-xl border border-[#1a1a1a]">
                <div className="text-lg mb-1">😊</div>
                <p>Face clearly visible</p>
              </div>
              <div className="p-3 bg-[#111] rounded-xl border border-[#1a1a1a]">
                <div className="text-lg mb-1">💡</div>
                <p>Good lighting</p>
              </div>
              <div className="p-3 bg-[#111] rounded-xl border border-[#1a1a1a]">
                <div className="text-lg mb-1">🎯</div>
                <p>Look at camera</p>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="grid md:grid-cols-2 gap-8">
            <div className="text-center">
              <div className="relative inline-block">
                <img src={photoPreview!} alt="Your photo" className="max-w-full max-h-[400px] rounded-2xl object-cover shadow-2xl" />
                <button onClick={resetAll} className="absolute top-3 right-3 w-8 h-8 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-sm transition-colors">✕</button>
              </div>
              <p className="text-[#666] text-sm mt-4">Looking great! Now pick your styles →</p>
            </div>

            <div>
              <h2 className="text-xl font-bold mb-2">Choose Your Styles</h2>
              <p className="text-[#888] text-sm mb-6">Select up to 6 styles. We will generate each one.</p>
              
              <div className="grid grid-cols-2 gap-3 mb-6">
                {STYLES.map((s) => {
                  const active = selectedStyles.includes(s.id);
                  return (
                    <button key={s.id} onClick={() => toggleStyle(s.id)} className={`p-4 rounded-xl text-left transition-all ${active ? "bg-violet-600/20 border-2 border-violet-500" : "bg-[#111] border-2 border-[#222] hover:border-[#333]"}`}>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{s.icon}</span>
                        <div>
                          <p className={`font-semibold ${active ? "text-violet-300" : "text-white"}`}>{s.label}</p>
                          <p className="text-xs text-[#666]">{s.desc}</p>
                        </div>
                        {active && <div className="ml-auto w-5 h-5 bg-violet-500 rounded-full flex items-center justify-center text-xs">✓</div>}
                      </div>
                    </button>
                  );
                })}
              </div>

              <button onClick={generate} disabled={selectedStyles.length === 0 || loading} className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${selectedStyles.length === 0 || loading ? "bg-[#333] text-[#666] cursor-not-allowed" : "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-500/25"}`}>
                {loading ? <span className="flex items-center justify-center gap-2"><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating...</span> : `Generate ${selectedStyles.length} Headshot${selectedStyles.length !== 1 ? "s" : ""} ✨`}
              </button>

              {error && <div className="mt-4 p-4 bg-red-950/50 border border-red-900 rounded-xl text-red-400 text-sm">⚠️ {error}</div>}
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold">{allDone ? "Your Headshots Are Ready! 🎉" : "Creating Your Headshots..."}</h2>
                <p className="text-[#888] text-sm">{allDone ? "Click any image to download in full resolution" : `${doneCount} of ${results.length} complete`}</p>
              </div>
              {allDone && <button onClick={resetAll} className="px-4 py-2 bg-[#1a1a1a] hover:bg-[#222] border border-[#333] rounded-xl text-sm transition-colors">Start Over</button>}
            </div>

            {!allDone && (
              <div className="h-1 bg-[#1a1a1a] rounded-full mb-8 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-violet-600 to-indigo-600 transition-all duration-500" style={{ width: `${(doneCount / results.length) * 100}%` }} />
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {results.map((res, i) => (
                <div key={i} className="group rounded-2xl overflow-hidden bg-[#111] border border-[#1a1a1a] hover:border-[#333] transition-all">
                  {res.status === "done" && res.imageUrl ? (
                    <a href={res.imageUrl} download={`headshot_${res.style}.jpg`} target="_blank" rel="noopener" className="block relative">
                      <img src={res.imageUrl} alt={res.label} className="w-full aspect-[3/4] object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="px-4 py-2 bg-white text-black rounded-full text-sm font-semibold">⬇️ Download</span>
                      </div>
                    </a>
                  ) : (
                    <div className="aspect-[3/4] flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-[#111] to-[#1a1a2e]">
                      <div className="w-10 h-10 border-3 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
                      <span className="text-xs text-[#666]">Generating...</span>
                    </div>
                  )}
                  <div className="p-3 flex items-center gap-2">
                    <span>{STYLES.find((s) => s.id === res.style)?.icon}</span>
                    <span className="text-sm text-[#888]">{res.label}</span>
                    {res.status === "done" && <span className="ml-auto text-green-500 text-xs">✓ Ready</span>}
                  </div>
                </div>
              ))}
            </div>

            {allDone && (
              <div className="mt-8 text-center">
                <p className="text-[#666] text-sm mb-4">Love your headshots? Share them!</p>
                <div className="flex items-center justify-center gap-3">
                  <button className="px-6 py-3 bg-[#0077b5] hover:bg-[#006195] rounded-xl font-semibold transition-colors">Share to LinkedIn</button>
                  <button className="px-6 py-3 bg-[#1a1a1a] hover:bg-[#222] border border-[#333] rounded-xl font-semibold transition-colors">Copy Link</button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}
