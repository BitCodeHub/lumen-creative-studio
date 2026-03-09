"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ImageIcon,
  Sparkles,
  Download,
  RefreshCw,
  Wand2,
  Settings2,
  Loader2,
  Check,
  AlertCircle,
  Zap,
} from "lucide-react"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

const presetPrompts = [
  "A majestic lion in a suit, sitting at a CEO desk in a modern office, cinematic lighting, 8k",
  "Cyberpunk city at night with neon signs, flying cars, rain reflections, ultra detailed",
  "Beautiful woman portrait, soft studio lighting, professional photography, 8k uhd",
  "Mystical forest with glowing mushrooms, fairy lights, magical atmosphere, fantasy art",
  "Futuristic sports car on a mountain road, sunset, dramatic clouds, hyperrealistic",
  "Cozy coffee shop interior, warm lighting, plants, wooden furniture, architectural photography",
]

const aspectRatios = [
  { label: "1:1 Square", width: 1024, height: 1024 },
  { label: "16:9 Landscape", width: 1344, height: 768 },
  { label: "9:16 Portrait", width: 768, height: 1344 },
  { label: "4:3 Standard", width: 1152, height: 896 },
  { label: "3:4 Portrait", width: 896, height: 1152 },
]

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState("")
  const [negativePrompt, setNegativePrompt] = useState("blurry, low quality, distorted, ugly, bad anatomy, deformed")
  const [aspectRatio, setAspectRatio] = useState(aspectRatios[0])
  const [steps, setSteps] = useState(20)
  const [cfg, setCfg] = useState(3.5)
  const [seed, setSeed] = useState(-1)
  const [upscale, setUpscale] = useState(true)
  const [showAdvanced, setShowAdvanced] = useState(false)
  
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [jobId, setJobId] = useState<string | null>(null)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [apiStatus, setApiStatus] = useState<"connected" | "disconnected" | "checking">("checking")

  // Check API health
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch(`${API_URL}/api/health`)
        if (res.ok) {
          const data = await res.json()
          setApiStatus(data.comfyui === "connected" ? "connected" : "disconnected")
        } else {
          setApiStatus("disconnected")
        }
      } catch {
        setApiStatus("disconnected")
      }
    }
    checkHealth()
    const interval = setInterval(checkHealth, 30000)
    return () => clearInterval(interval)
  }, [])

  // Poll job status
  useEffect(() => {
    if (!jobId || !isGenerating) return

    const pollStatus = async () => {
      try {
        const res = await fetch(`${API_URL}/api/job/${jobId}`)
        if (!res.ok) return

        const data = await res.json()
        setProgress(data.progress)

        if (data.status === "completed" && data.result_url) {
          setGeneratedImage(`${API_URL}${data.result_url}`)
          setIsGenerating(false)
          setJobId(null)
        } else if (data.status === "failed") {
          setError(data.error || "Generation failed")
          setIsGenerating(false)
          setJobId(null)
        }
      } catch (e) {
        console.error("Poll error:", e)
      }
    }

    const interval = setInterval(pollStatus, 1000)
    return () => clearInterval(interval)
  }, [jobId, isGenerating])

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt")
      return
    }

    setIsGenerating(true)
    setProgress(0)
    setError(null)
    setGeneratedImage(null)

    try {
      const res = await fetch(`${API_URL}/api/generate/image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          negative_prompt: negativePrompt,
          width: aspectRatio.width,
          height: aspectRatio.height,
          steps,
          cfg,
          seed,
          upscale,
        }),
      })

      if (!res.ok) {
        throw new Error("Failed to start generation")
      }

      const data = await res.json()
      setJobId(data.job_id)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate")
      setIsGenerating(false)
    }
  }

  const handleDownload = () => {
    if (generatedImage) {
      const link = document.createElement("a")
      link.href = generatedImage
      link.download = `lumen-${Date.now()}.png`
      link.click()
    }
  }

  const handleRandomPrompt = () => {
    const randomPrompt = presetPrompts[Math.floor(Math.random() * presetPrompts.length)]
    setPrompt(randomPrompt)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-purple">
              <ImageIcon className="h-5 w-5 text-white" />
            </div>
            Image Generator
          </h1>
          <p className="text-muted-foreground mt-1">
            Create stunning images with FLUX.1-dev + 4K upscaling
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
            apiStatus === "connected" ? "bg-green-500/20 text-green-400" :
            apiStatus === "disconnected" ? "bg-red-500/20 text-red-400" :
            "bg-yellow-500/20 text-yellow-400"
          }`}>
            {apiStatus === "connected" ? <Check className="h-3 w-3" /> :
             apiStatus === "disconnected" ? <AlertCircle className="h-3 w-3" /> :
             <Loader2 className="h-3 w-3 animate-spin" />}
            {apiStatus === "connected" ? "GPU Connected" :
             apiStatus === "disconnected" ? "GPU Offline" : "Checking..."}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel - Controls */}
        <div className="space-y-6">
          {/* Prompt */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Wand2 className="h-4 w-4 text-primary" />
                Prompt
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Textarea
                  placeholder="Describe the image you want to create..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[120px] pr-12"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-2"
                  onClick={handleRandomPrompt}
                  title="Random prompt"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>

              {/* Quick prompts */}
              <div className="flex flex-wrap gap-2">
                {presetPrompts.slice(0, 3).map((p, i) => (
                  <button
                    key={i}
                    onClick={() => setPrompt(p)}
                    className="text-xs px-3 py-1.5 rounded-full bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors truncate max-w-[200px]"
                  >
                    {p.slice(0, 40)}...
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-primary" />
                Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Aspect Ratio */}
              <div>
                <label className="text-sm font-medium mb-2 block">Aspect Ratio</label>
                <div className="grid grid-cols-5 gap-2">
                  {aspectRatios.map((ar) => (
                    <button
                      key={ar.label}
                      onClick={() => setAspectRatio(ar)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        aspectRatio.label === ar.label
                          ? "bg-primary text-white"
                          : "bg-secondary hover:bg-secondary/80 text-muted-foreground"
                      }`}
                    >
                      {ar.label.split(" ")[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Upscale toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">4K Upscale</label>
                  <p className="text-xs text-muted-foreground">Upscale to 4096x4096</p>
                </div>
                <button
                  onClick={() => setUpscale(!upscale)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    upscale ? "bg-primary" : "bg-secondary"
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    upscale ? "translate-x-6" : "translate-x-0.5"
                  }`} />
                </button>
              </div>

              {/* Advanced toggle */}
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-sm text-primary hover:underline"
              >
                {showAdvanced ? "Hide" : "Show"} Advanced Settings
              </button>

              {showAdvanced && (
                <div className="space-y-4 pt-2 border-t border-border">
                  {/* Negative prompt */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Negative Prompt</label>
                    <Textarea
                      placeholder="What to avoid..."
                      value={negativePrompt}
                      onChange={(e) => setNegativePrompt(e.target.value)}
                      className="min-h-[60px]"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Steps</label>
                      <Input
                        type="number"
                        value={steps}
                        onChange={(e) => setSteps(parseInt(e.target.value))}
                        min={1}
                        max={50}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">CFG</label>
                      <Input
                        type="number"
                        value={cfg}
                        onChange={(e) => setCfg(parseFloat(e.target.value))}
                        min={1}
                        max={20}
                        step={0.5}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Seed</label>
                      <Input
                        type="number"
                        value={seed}
                        onChange={(e) => setSeed(parseInt(e.target.value))}
                        placeholder="-1 = random"
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Generate Button */}
          <Button
            variant="gradient"
            size="lg"
            className="w-full h-14 text-lg"
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim() || apiStatus !== "connected"}
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5 mr-2" />
                Generate Image
              </>
            )}
          </Button>

          {/* Progress */}
          {isGenerating && (
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Generating...</span>
                  <span className="text-sm font-medium">{progress}%</span>
                </div>
                <Progress value={progress} />
                <p className="text-xs text-muted-foreground mt-2">
                  {upscale ? "Creating 4K image with FLUX.1-dev + UltraSharp upscaling..." : "Creating image with FLUX.1-dev..."}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Error */}
          {error && (
            <Card className="border-red-500/50 bg-red-500/10">
              <CardContent className="py-4">
                <div className="flex items-center gap-2 text-red-400">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Panel - Preview */}
        <Card className="h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative aspect-square rounded-xl bg-secondary/50 overflow-hidden flex items-center justify-center">
              {generatedImage ? (
                <img
                  src={generatedImage}
                  alt="Generated"
                  className="w-full h-full object-contain"
                />
              ) : isGenerating ? (
                <div className="text-center">
                  <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-muted-foreground">Creating your image...</p>
                </div>
              ) : (
                <div className="text-center">
                  <ImageIcon className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-muted-foreground">Your generated image will appear here</p>
                </div>
              )}
            </div>

            {/* Actions */}
            {generatedImage && (
              <div className="flex gap-3 mt-4">
                <Button onClick={handleDownload} className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button variant="secondary" onClick={() => handleGenerate()} className="flex-1">
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
