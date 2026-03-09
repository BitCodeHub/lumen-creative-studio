"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ZoomIn, Sparkles, Upload, ImageIcon } from "lucide-react"

const scales = [
  { value: 2, label: "2x", resolution: "2048px" },
  { value: 4, label: "4x", resolution: "4096px" },
  { value: 8, label: "8x", resolution: "8192px" },
]

const models = [
  { id: "ultrasharp", name: "UltraSharp", description: "Best for general photos" },
  { id: "anime", name: "Anime", description: "Optimized for anime/illustrations" },
  { id: "face", name: "Face Enhance", description: "Best for portraits" },
  { id: "real", name: "Real-ESRGAN", description: "Realistic enhancement" },
]

export default function AIUpscale() {
  const [selectedScale, setSelectedScale] = useState(4)
  const [selectedModel, setSelectedModel] = useState("ultrasharp")
  const [denoise, setDenoise] = useState(0.3)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-blue">
            <ZoomIn className="h-5 w-5 text-white" />
          </div>
          AI Upscale
        </h1>
        <p className="text-muted-foreground mt-1">
          Upscale images to 4K+ resolution with AI
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Upload Image</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-border rounded-xl p-12 text-center hover:border-primary/50 transition-colors cursor-pointer">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2">Drop your image here</p>
                <p className="text-sm text-muted-foreground">Supports JPG, PNG, WebP</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Upscale Factor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {scales.map((scale) => (
                  <button
                    key={scale.value}
                    onClick={() => setSelectedScale(scale.value)}
                    className={`p-4 rounded-xl text-center transition-all ${
                      selectedScale === scale.value
                        ? "bg-primary text-white"
                        : "bg-secondary hover:bg-secondary/80"
                    }`}
                  >
                    <p className="text-2xl font-bold">{scale.label}</p>
                    <p className={`text-sm ${selectedScale === scale.value ? "text-white/80" : "text-muted-foreground"}`}>
                      {scale.resolution}
                    </p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Upscale Model</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {models.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => setSelectedModel(model.id)}
                    className={`p-4 rounded-xl text-left transition-all ${
                      selectedModel === model.id
                        ? "bg-primary/20 border-2 border-primary"
                        : "bg-secondary hover:bg-secondary/80 border-2 border-transparent"
                    }`}
                  >
                    <p className="font-medium">{model.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{model.description}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Denoise Strength</CardTitle>
            </CardHeader>
            <CardContent>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={denoise}
                onChange={(e) => setDenoise(parseFloat(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-sm text-muted-foreground mt-2">
                <span>None</span>
                <span className="font-medium text-foreground">{denoise}</span>
                <span>Strong</span>
              </div>
            </CardContent>
          </Card>

          <Button variant="gradient" size="lg" className="w-full h-14 text-lg">
            <Sparkles className="h-5 w-5 mr-2" />
            Upscale Image
          </Button>
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-lg">Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-square rounded-xl bg-secondary/50 flex items-center justify-center">
              <div className="text-center">
                <ImageIcon className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground">Upload an image to upscale</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
