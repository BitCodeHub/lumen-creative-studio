"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
  VideoIcon,
  Sparkles,
  Download,
  RefreshCw,
  Wand2,
  Settings2,
  Loader2,
  Check,
  AlertCircle,
  Play,
} from "lucide-react"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

const presetPrompts = [
  "A serene lake at sunrise, gentle ripples, mist rising, cinematic slow motion",
  "City street at night, neon lights reflecting on wet pavement, people walking",
  "Ocean waves crashing on rocky shore, dramatic clouds, golden hour lighting",
  "Futuristic robot walking through a neon-lit corridor, cinematic",
  "Beautiful flower blooming in timelapse, macro photography, studio lighting",
  "Hot air balloons floating over mountain landscape at sunrise",
]

export default function VideoGenerator() {
  const [prompt, setPrompt] = useState("")
  const [negativePrompt, setNegativePrompt] = useState("blurry, low quality, distorted")
  const [frames, setFrames] = useState(33)
  const [steps, setSteps] = useState(20)
  const [cfg, setCfg] = useState(3.0)
  const [seed, setSeed] = useState(-1)
  const [showAdvanced, setShowAdvanced] = useState(false)
  
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [jobId, setJobId] = useState<string | null>(null)
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [apiStatus, setApiStatus] = useState<"connected" | "disconnected" | "checking">("checking")

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

  useEffect(() => {
    if (!jobId || !isGenerating) return

    const pollStatus = async () => {
      try {
        const res = await fetch(`${API_URL}/api/job/${jobId}`)
        if (!res.ok) return

        const data = await res.json()
        setProgress(data.progress)

        if (data.status === "completed" && data.result_url) {
          setGeneratedVideo(`${API_URL}${data.result_url}`)
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

    const interval = setInterval(pollStatus, 2000)
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
    setGeneratedVideo(null)

    try {
      const res = await fetch(`${API_URL}/api/generate/video`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          negative_prompt: negativePrompt,
          width: 480,
          height: 320,
          frames,
          steps,
          cfg,
          seed,
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
    if (generatedVideo) {
      const link = document.createElement("a")
      link.href = generatedVideo
      link.download = `lumen-video-${Date.now()}.mp4`
      link.click()
    }
  }

  const handleRandomPrompt = () => {
    const randomPrompt = presetPrompts[Math.floor(Math.random() * presetPrompts.length)]
    setPrompt(randomPrompt)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-blue">
              <VideoIcon className="h-5 w-5 text-white" />
            </div>
            Video Generator
          </h1>
          <p className="text-muted-foreground mt-1">
            Create AI videos with LTX Video model
          </p>
        </div>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Wand2 className="h-4 w-4 text-primary" />
                Video Prompt
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Textarea
                  placeholder="Describe the video scene you want to create..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[120px] pr-12"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-2"
                  onClick={handleRandomPrompt}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {presetPrompts.slice(0, 3).map((p, i) => (
                  <button
                    key={i}
                    onClick={() => setPrompt(p)}
                    className="text-xs px-3 py-1.5 rounded-full bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors truncate max-w-[200px]"
                  >
                    {p.slice(0, 35)}...
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-primary" />
                Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Duration</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "2s", frames: 33 },
                    { label: "4s", frames: 65 },
                    { label: "6s", frames: 97 },
                  ].map((dur) => (
                    <button
                      key={dur.frames}
                      onClick={() => setFrames(dur.frames)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        frames === dur.frames
                          ? "bg-primary text-white"
                          : "bg-secondary hover:bg-secondary/80 text-muted-foreground"
                      }`}
                    >
                      {dur.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-sm text-primary hover:underline"
              >
                {showAdvanced ? "Hide" : "Show"} Advanced Settings
              </button>

              {showAdvanced && (
                <div className="space-y-4 pt-2 border-t border-border">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Negative Prompt</label>
                    <Textarea
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
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

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
                Generating Video...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5 mr-2" />
                Generate Video
              </>
            )}
          </Button>

          {isGenerating && (
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Generating video...</span>
                  <span className="text-sm font-medium">{progress}%</span>
                </div>
                <Progress value={progress} />
                <p className="text-xs text-muted-foreground mt-2">
                  Video generation takes 2-5 minutes depending on duration...
                </p>
              </CardContent>
            </Card>
          )}

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

        <Card className="h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative aspect-video rounded-xl bg-secondary/50 overflow-hidden flex items-center justify-center">
              {generatedVideo ? (
                <video
                  src={generatedVideo}
                  controls
                  autoPlay
                  loop
                  className="w-full h-full object-contain"
                />
              ) : isGenerating ? (
                <div className="text-center">
                  <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-muted-foreground">Creating your video...</p>
                </div>
              ) : (
                <div className="text-center">
                  <Play className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-muted-foreground">Your generated video will appear here</p>
                </div>
              )}
            </div>

            {generatedVideo && (
              <div className="flex gap-3 mt-4">
                <Button onClick={handleDownload} className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Download MP4
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
