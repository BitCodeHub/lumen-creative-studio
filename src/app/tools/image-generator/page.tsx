"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import {
  ImageIcon,
  Sparkles,
  Download,
  RefreshCw,
  Wand2,
  Settings2,
  AlertCircle,
  Zap,
  Clock,
  Star,
  ChevronDown,
} from "lucide-react"

const MODELS = [
  {
    id: "realvis",
    name: "RealVis XL v4",
    desc: "Ultra-photorealistic portraits & scenes",
    quality: 5,
    time: "~45s",
    badge: "Best Quality",
    badgeColor: "bg-purple-500/20 text-purple-300",
    steps: 45,
  },
  {
    id: "flux-dev",
    name: "FLUX.1 Dev",
    desc: "Premium detail & prompt accuracy",
    quality: 5,
    time: "~35s",
    badge: "Premium",
    badgeColor: "bg-blue-500/20 text-blue-300",
    steps: 25,
  },
  {
    id: "flux-schnell",
    name: "FLUX.1 Schnell",
    desc: "Blazing fast, great for drafts",
    quality: 3,
    time: "~8s",
    badge: "Fastest",
    badgeColor: "bg-green-500/20 text-green-300",
    steps: 4,
  },
  {
    id: "sdxl",
    name: "Stable Diffusion XL",
    desc: "Versatile, great for creative styles",
    quality: 4,
    time: "~25s",
    badge: "Creative",
    badgeColor: "bg-orange-500/20 text-orange-300",
    steps: 25,
  },
]

const ASPECT_RATIOS = [
  { label: "1:1", width: 1024, height: 1024 },
  { label: "16:9", width: 1344, height: 768 },
  { label: "9:16", width: 768, height: 1344 },
  { label: "4:3", width: 1152, height: 896 },
  { label: "3:4", width: 896, height: 1152 },
]

const EXAMPLE_PROMPTS = [
  "A majestic lion in a suit, CEO desk in a modern office, cinematic lighting, 8k",
  "Cyberpunk city at night, neon signs, flying cars, rain reflections, ultra detailed",
  "Beautiful woman portrait, soft studio lighting, professional photography, 8k uhd",
  "Mystical forest with glowing mushrooms, fairy lights, magical atmosphere, fantasy",
  "Futuristic sports car on a mountain road, sunset, dramatic clouds, hyperrealistic",
  "Cozy coffee shop interior, warm lighting, plants, wooden furniture, architectural",
]

// Animated canvas-style loading component
function GeneratingAnimation({ modelTime }: { modelTime: string }) {
  const messages = [
    "Painting your vision...",
    "Adding fine details...",
    "Enhancing colors...",
    "Applying finishing touches...",
    "Almost there...",
  ]
  const [msgIdx] = useState(0)

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-6 px-8 text-center">
      {/* Animated orbs */}
      <div className="relative w-28 h-28">
        <div className="absolute inset-0 rounded-full bg-accent/20 animate-ping" style={{ animationDuration: "2s" }} />
        <div className="absolute inset-2 rounded-full bg-accent/30 animate-ping" style={{ animationDuration: "2s", animationDelay: "0.3s" }} />
        <div className="absolute inset-4 rounded-full bg-accent/40 animate-ping" style={{ animationDuration: "2s", animationDelay: "0.6s" }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <Sparkles className="w-10 h-10 text-accent animate-pulse" />
        </div>
      </div>

      <div>
        <p className="text-lg font-semibold text-foreground">{messages[msgIdx]}</p>
        <p className="text-sm text-muted-foreground mt-1">Expected: {modelTime}</p>
      </div>

      {/* Progress bar shimmer */}
      <div className="w-full max-w-xs h-1.5 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full bg-accent rounded-full"
          style={{
            animation: "shimmer 2s ease-in-out infinite",
            background: "linear-gradient(90deg, transparent 0%, var(--accent) 50%, transparent 100%)",
            backgroundSize: "200% 100%",
          }}
        />
      </div>

      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  )
}

function QualityStars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-3 h-3 ${i <= count ? "text-yellow-400 fill-yellow-400" : "text-gray-600"}`}
        />
      ))}
    </div>
  )
}

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState("")
  const [negativePrompt, setNegativePrompt] = useState("blurry, low quality, distorted, ugly, bad anatomy, deformed")
  const [selectedModel, setSelectedModel] = useState(MODELS[0])
  const [aspectRatio, setAspectRatio] = useState(ASPECT_RATIOS[0])
  const [upscale, setUpscale] = useState(true)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [seed, setSeed] = useState(-1)

  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt")
      return
    }

    setIsGenerating(true)
    setError(null)
    setGeneratedImage(null)

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          model: selectedModel.id,
          upscale,
          seed: seed === -1 ? undefined : seed,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Generation failed. Please try again.")
      }

      setGeneratedImage(data.imageUrl)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = () => {
    if (!generatedImage) return
    const link = document.createElement("a")
    link.href = generatedImage
    link.download = `lumen-${Date.now()}.png`
    link.click()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent">
            <ImageIcon className="h-5 w-5 text-white" />
          </div>
          Image Generator
        </h1>
        <p className="text-muted-foreground mt-1">
          Create stunning AI images from your imagination
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel */}
        <div className="space-y-5">

          {/* Model Selector */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-accent" />
                Choose Model
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {MODELS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedModel(m)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all border ${
                    selectedModel.id === m.id
                      ? "bg-accent/10 border-accent/40"
                      : "border-transparent hover:bg-secondary/60"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-semibold">{m.name}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${m.badgeColor}`}>
                        {m.badge}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{m.desc}</p>
                  </div>
                  <div className="flex-shrink-0 text-right space-y-1">
                    <QualityStars count={m.quality} />
                    <div className="flex items-center gap-1 justify-end text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {m.time}
                    </div>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Prompt */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Wand2 className="h-4 w-4 text-accent" />
                Prompt
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                placeholder="Describe what you want to create in detail..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[110px]"
              />
              {/* Example prompts */}
              <div className="flex flex-wrap gap-1.5">
                {EXAMPLE_PROMPTS.slice(0, 3).map((p, i) => (
                  <button
                    key={i}
                    onClick={() => setPrompt(p)}
                    className="text-xs px-2.5 py-1 rounded-full bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {p.slice(0, 35)}…
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-accent" />
                Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Aspect Ratio */}
              <div>
                <label className="text-sm font-medium mb-2 block">Aspect Ratio</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {ASPECT_RATIOS.map((ar) => (
                    <button
                      key={ar.label}
                      onClick={() => setAspectRatio(ar)}
                      className={`py-2 rounded-lg text-xs font-medium transition-all ${
                        aspectRatio.label === ar.label
                          ? "bg-accent text-white"
                          : "bg-secondary hover:bg-secondary/80 text-muted-foreground"
                      }`}
                    >
                      {ar.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4K Upscale */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">4K Upscale</label>
                  <p className="text-xs text-muted-foreground">Enhance to 4096×4096</p>
                </div>
                <button
                  onClick={() => setUpscale(!upscale)}
                  className={`w-11 h-6 rounded-full transition-colors relative ${upscale ? "bg-accent" : "bg-secondary"}`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${upscale ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
              </div>

              {/* Advanced */}
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-1 text-sm text-accent hover:underline"
              >
                <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
                {showAdvanced ? "Hide" : "Show"} advanced options
              </button>

              {showAdvanced && (
                <div className="space-y-3 pt-2 border-t border-border">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Negative Prompt</label>
                    <Textarea
                      placeholder="Things to avoid..."
                      value={negativePrompt}
                      onChange={(e) => setNegativePrompt(e.target.value)}
                      className="min-h-[60px] text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Seed (–1 = random)</label>
                    <Input
                      type="number"
                      value={seed}
                      onChange={(e) => setSeed(parseInt(e.target.value))}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Generate Button */}
          <Button
            className="w-full h-14 text-base font-semibold bg-accent hover:bg-accent/90 text-white"
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
          >
            {isGenerating ? (
              <><Sparkles className="h-5 w-5 mr-2 animate-pulse" /> Creating your image...</>
            ) : (
              <><Zap className="h-5 w-5 mr-2" /> Generate Image</>
            )}
          </Button>

          {/* Error */}
          {error && (
            <Card className="border-red-500/40 bg-red-500/10">
              <CardContent className="py-3">
                <div className="flex items-start gap-2 text-red-400">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Panel - Preview */}
        <Card className="h-fit sticky top-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative rounded-xl bg-secondary/40 overflow-hidden min-h-[400px] flex items-center justify-center">
              {isGenerating ? (
                <GeneratingAnimation modelTime={selectedModel.time} />
              ) : generatedImage ? (
                <img
                  src={generatedImage}
                  alt="Generated"
                  className="w-full h-full object-contain rounded-xl"
                />
              ) : (
                <div className="text-center py-16 px-8">
                  <div className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
                    <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
                  </div>
                  <p className="text-muted-foreground font-medium">Your image will appear here</p>
                  <p className="text-sm text-muted-foreground/60 mt-1">Enter a prompt and click Generate</p>
                </div>
              )}
            </div>

            {generatedImage && !isGenerating && (
              <div className="flex gap-3 mt-4">
                <Button onClick={handleDownload} className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button variant="secondary" onClick={handleGenerate} className="flex-1">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Regenerate
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
