"use client";
import { useState, useRef, useCallback } from "react";

const STYLES = [
  { id: "linkedin", label: "Professional", icon: "💼", desc: "Corporate & clean" },
  { id: "creative", label: "Creative", icon: "🎨", desc: "Artistic flair" },
  { id: "casual", label: "Casual", icon: "☀️", desc: "Natural & friendly" },
  { id: "executive", label: "Executive", icon: "👔", desc: "Power & authority" },
  { id: "studio", label: "Studio", icon: "📸", desc: "Classic portrait" },
  { id: "glamour", label: "Glamour", icon: "✨", desc: "Red carpet ready" },
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
  const progress = results.length > 0 ? (doneCount / results.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans">
      {/* Header */}
      <header className="border-b border-[#1a1a1a] px-6 py-4 flex items-center gap-4">
        <a href="/" className="text-gray-500 hover:text-white transition text-sm flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </a>
        <div className="w-px h-5 bg-[#333]" />
        <div>
          <h1 className="text-xl font-bold">AI Headshots</h1>
          <p className="text-gray-500 text-sm">Professional photos in seconds</p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        <div className="grid lg:grid-cols-[380px_1fr] gap-8">

          {/* Left Panel */}
          <div className="space-y-6">
            {/* Upload Zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
              onClick={() => fileRef.current?.click()}
              className={`
                relative rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden
                ${dragOver ? 'border-violet-500 bg-violet-500/5' : 'border-[#333] bg-[#111] hover:border-[#444]'}
                ${photoPreview ? 'aspect-square' : 'aspect-[4/3]'}
              `}
            >
              {photoPreview ? (
                <div className="relative w-full h-full group">
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <span className="text-sm font-medium">Click to change</span>
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="font-semibold text-white">Drop your photo here</p>
                  <p className="text-gray-500 text-sm mt-1">or click to browse</p>
                  <div className="flex gap-2 mt-4">
                    <span className="px-2 py-1 bg-[#1a1a1a] rounded text-xs text-gray-400">JPG</span>
                    <span className="px-2 py-1 bg-[#1a1a1a] rounded text-xs text-gray-400">PNG</span>
                    <span className="px-2 py-1 bg-[#1a1a1a] rounded text-xs text-gray-400">WEBP</span>
                  </div>
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
            </div>

            {/* Style Selector */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-300">Choose your styles</span>
                <span className="text-xs text-gray-500">{selectedStyles.length} selected</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {STYLES.map((s) => {
                  const active = selectedStyles.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      onClick={() => toggleStyle(s.id)}
                      className={`
                        p-3 rounded-xl text-left transition-all
                        ${active 
                          ? 'bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 border border-violet-500/50 ring-1 ring-violet-500/20' 
                          : 'bg-[#111] border border-[#222] hover:border-[#333]'}
                      `}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{s.icon}</span>
                        <div>
                          <p className={`text-sm font-medium ${active ? 'text-white' : 'text-gray-400'}`}>{s.label}</p>
                          <p className="text-xs text-gray-500">{s.desc}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={generate}
              disabled={!photo || selectedStyles.length === 0 || loading}
              className={`
                w-full py-4 rounded-xl font-semibold text-sm transition-all
                ${(!photo || loading) 
                  ? 'bg-[#222] text-gray-500 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500 shadow-lg shadow-violet-500/25'}
              `}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Processing...
                </span>
              ) : (
                `Generate ${selectedStyles.length} Headshot${selectedStyles.length > 1 ? 's' : ''}`
              )}
            </button>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Tips */}
            <div className="p-4 rounded-xl bg-[#111] border border-[#1a1a1a]">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Pro tips</p>
              <ul className="space-y-2">
                {[
                  "Use a clear, well-lit photo",
                  "Face the camera directly",
                  "Avoid busy backgrounds",
                  "Higher resolution = better results"
                ].map((tip) => (
                  <li key={tip} className="flex items-start gap-2 text-sm text-gray-400">
                    <span className="text-violet-400 mt-0.5">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right Panel - Results */}
          <div>
            {results.length === 0 && !loading ? (
              <div className="h-full min-h-[500px] flex flex-col items-center justify-center text-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 flex items-center justify-center mb-6">
                  <svg className="w-12 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-300 mb-2">Your headshots will appear here</h3>
                <p className="text-gray-500 text-sm max-w-sm">
                  Upload a photo and select your preferred styles to generate professional headshots instantly
                </p>
                <div className="flex flex-wrap justify-center gap-2 mt-8">
                  {["✨ Studio quality", "⚡ Ready in seconds", "🎨 Multiple styles"].map((t) => (
                    <span key={t} className="px-3 py-1.5 bg-[#111] border border-[#222] rounded-full text-xs text-gray-500">{t}</span>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                {/* Progress Bar */}
                {results.length > 0 && doneCount < results.length && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">Generating headshots...</span>
                      <span className="text-sm font-medium text-violet-400">{doneCount}/{results.length}</span>
                    </div>
                    <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Results Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {results.map((res, i) => (
                    <div key={i} className="group rounded-xl overflow-hidden bg-[#111] border border-[#1a1a1a] hover:border-[#333] transition">
                      {res.status === "done" && res.imageUrl ? (
                        <a href={res.imageUrl} download={`headshot_${res.style}.jpg`} target="_blank" rel="noopener" className="block">
                          <div className="relative aspect-[3/4]">
                            <img src={res.imageUrl} alt={res.label} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                              <span className="px-3 py-1.5 bg-white text-black rounded-lg text-sm font-medium">
                                Download
                              </span>
                            </div>
                          </div>
                        </a>
                      ) : (
                        <div className="aspect-[3/4] flex flex-col items-center justify-center bg-gradient-to-br from-[#111] to-[#1a1a2e]">
                          <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mb-3" />
                          <span className="text-xs text-gray-500">Creating magic...</span>
                        </div>
                      )}
                      <div className="px-3 py-2.5 flex items-center gap-2 border-t border-[#1a1a1a]">
                        <span>{STYLES.find((s) => s.id === res.style)?.icon}</span>
                        <span className="text-sm text-gray-400">{res.label}</span>
                        {res.status === "done" && (
                          <svg className="w-4 h-4 text-green-500 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Download All */}
                {doneCount === results.length && doneCount > 0 && (
                  <div className="mt-6 p-4 rounded-xl bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-white">All headshots ready! 🎉</p>
                        <p className="text-sm text-gray-400">Click any image to download</p>
                      </div>
                      <button 
                        onClick={() => results.forEach(r => r.imageUrl && window.open(r.imageUrl, '_blank'))}
                        className="px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-sm font-medium transition"
                      >
                        Open All
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
