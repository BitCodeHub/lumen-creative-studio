"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Wand2, Sparkles, Upload, ImageIcon, Eraser, Palette, Layers, Move, Crop } from "lucide-react"

const tools = [
  { id: "inpaint", name: "Inpaint", icon: Eraser, description: "Remove or replace objects" },
  { id: "outpaint", name: "Outpaint", icon: Layers, description: "Extend image boundaries" },
  { id: "recolor", name: "Recolor", icon: Palette, description: "Change colors with AI" },
  { id: "relocate", name: "Relocate", icon: Move, description: "Move objects in image" },
  { id: "uncrop", name: "Uncrop", icon: Crop, description: "Expand image canvas" },
]

export default function MegaStudio() {
  const [selectedTool, setSelectedTool] = useState("inpaint")
  const [prompt, setPrompt] = useState("")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-pink">
            <Wand2 className="h-5 w-5 text-white" />
          </div>
          Mega Studio
        </h1>
        <p className="text-muted-foreground mt-1">
          All-in-one AI editing studio
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tools Sidebar */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Edit Tools</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {tools.map((tool) => (
              <button
                key={tool.id}
                onClick={() => setSelectedTool(tool.id)}
                className={`w-full p-4 rounded-xl flex items-center gap-3 transition-all ${
                  selectedTool === tool.id
                    ? "bg-primary/20 border-2 border-primary"
                    : "bg-secondary hover:bg-secondary/80 border-2 border-transparent"
                }`}
              >
                <div className={`p-2 rounded-lg ${selectedTool === tool.id ? "bg-primary" : "bg-muted"}`}>
                  <tool.icon className="h-4 w-4 text-white" />
                </div>
                <div className="text-left">
                  <p className="font-medium">{tool.name}</p>
                  <p className="text-xs text-muted-foreground">{tool.description}</p>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Canvas */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Canvas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-video rounded-xl bg-secondary/50 flex items-center justify-center mb-4">
              <div className="text-center">
                <Upload className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground">Drop an image to start editing</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <Textarea
                placeholder={
                  selectedTool === "inpaint" ? "Describe what to put in the selected area..." :
                  selectedTool === "outpaint" ? "Describe the extended scene..." :
                  selectedTool === "recolor" ? "Describe the new colors..." :
                  "Describe the edit..."
                }
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[80px]"
              />
              
              <Button variant="gradient" size="lg" className="w-full">
                <Sparkles className="h-5 w-5 mr-2" />
                Apply Edit
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
