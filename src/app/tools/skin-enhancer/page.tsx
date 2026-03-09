"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Sparkles, Upload, ImageIcon } from "lucide-react"

const enhancements = [
  { id: "smooth", name: "Skin Smoothing", description: "Remove blemishes and imperfections" },
  { id: "tone", name: "Skin Tone", description: "Even out skin tone" },
  { id: "glow", name: "Add Glow", description: "Natural healthy glow" },
  { id: "wrinkles", name: "Reduce Wrinkles", description: "Subtle wrinkle reduction" },
  { id: "pores", name: "Minimize Pores", description: "Reduce pore visibility" },
  { id: "brighten", name: "Brighten", description: "Brighten dull skin" },
]

export default function SkinEnhancer() {
  const [selectedEnhancements, setSelectedEnhancements] = useState<string[]>(["smooth", "tone"])
  const [intensity, setIntensity] = useState(50)

  const toggleEnhancement = (id: string) => {
    setSelectedEnhancements(prev =>
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-purple">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          Skin Enhancer
        </h1>
        <p className="text-muted-foreground mt-1">
          AI-powered skin retouching and enhancement
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Upload Portrait</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-border rounded-xl p-12 text-center hover:border-primary/50 transition-colors cursor-pointer">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2">Drop your portrait here</p>
                <p className="text-sm text-muted-foreground">High resolution works best</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Enhancements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {enhancements.map((enhancement) => (
                  <button
                    key={enhancement.id}
                    onClick={() => toggleEnhancement(enhancement.id)}
                    className={`p-4 rounded-xl text-left transition-all ${
                      selectedEnhancements.includes(enhancement.id)
                        ? "bg-primary/20 border-2 border-primary"
                        : "bg-secondary hover:bg-secondary/80 border-2 border-transparent"
                    }`}
                  >
                    <p className="font-medium">{enhancement.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{enhancement.description}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Intensity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={intensity}
                  onChange={(e) => setIntensity(parseInt(e.target.value))}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Subtle</span>
                  <span className="font-medium text-foreground">{intensity}%</span>
                  <span>Strong</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button variant="gradient" size="lg" className="w-full h-14 text-lg">
            <Sparkles className="h-5 w-5 mr-2" />
            Enhance Portrait
          </Button>
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-lg">Before / After</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-square rounded-xl bg-secondary/50 flex items-center justify-center">
              <div className="text-center">
                <ImageIcon className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground">Upload a portrait to enhance</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
