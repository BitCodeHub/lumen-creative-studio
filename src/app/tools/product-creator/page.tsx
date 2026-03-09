"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ShoppingBag, Sparkles, Upload, ImageIcon } from "lucide-react"

const backgrounds = [
  "Studio White",
  "Gradient",
  "Lifestyle",
  "Minimalist",
  "Nature",
  "Urban",
  "Abstract",
  "Custom",
]

const angles = [
  "Front View",
  "45° Angle",
  "Side View",
  "Top Down",
  "Floating",
  "Multiple Angles",
]

export default function ProductCreator() {
  const [selectedBg, setSelectedBg] = useState(backgrounds[0])
  const [selectedAngle, setSelectedAngle] = useState(angles[0])
  const [description, setDescription] = useState("")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-orange">
            <ShoppingBag className="h-5 w-5 text-white" />
          </div>
          Product Creator
        </h1>
        <p className="text-muted-foreground mt-1">
          Generate professional product photography with AI
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Upload Product</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-border rounded-xl p-12 text-center hover:border-primary/50 transition-colors cursor-pointer">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2">Drop your product image here</p>
                <p className="text-sm text-muted-foreground">PNG with transparent background works best</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Background Style</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-2">
                {backgrounds.map((bg) => (
                  <button
                    key={bg}
                    onClick={() => setSelectedBg(bg)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedBg === bg
                        ? "bg-primary text-white"
                        : "bg-secondary hover:bg-secondary/80 text-muted-foreground"
                    }`}
                  >
                    {bg}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Camera Angle</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                {angles.map((angle) => (
                  <button
                    key={angle}
                    onClick={() => setSelectedAngle(angle)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedAngle === angle
                        ? "bg-primary text-white"
                        : "bg-secondary hover:bg-secondary/80 text-muted-foreground"
                    }`}
                  >
                    {angle}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Scene Description</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Describe the scene you want for your product..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[80px]"
              />
            </CardContent>
          </Card>

          <Button variant="gradient" size="lg" className="w-full h-14 text-lg">
            <Sparkles className="h-5 w-5 mr-2" />
            Generate Product Shot
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
                <p className="text-muted-foreground">Upload a product to get started</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
