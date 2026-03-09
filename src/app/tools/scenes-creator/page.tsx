"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Mountain, Sparkles, ImageIcon } from "lucide-react"

const scenes = [
  "Cinematic Landscape",
  "Urban Night",
  "Fantasy World",
  "Sci-Fi Environment",
  "Underwater",
  "Space/Cosmos",
  "Ancient Ruins",
  "Forest/Nature",
]

const moods = [
  "Dramatic",
  "Peaceful",
  "Mysterious",
  "Epic",
  "Romantic",
  "Dark/Moody",
  "Bright/Cheerful",
  "Nostalgic",
]

const times = [
  "Golden Hour",
  "Blue Hour",
  "Midnight",
  "Noon",
  "Sunrise",
  "Sunset",
  "Overcast",
  "Stormy",
]

export default function ScenesCreator() {
  const [selectedScene, setSelectedScene] = useState(scenes[0])
  const [selectedMood, setSelectedMood] = useState(moods[0])
  const [selectedTime, setSelectedTime] = useState(times[0])
  const [prompt, setPrompt] = useState("")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-green">
            <Mountain className="h-5 w-5 text-white" />
          </div>
          Scenes Creator
        </h1>
        <p className="text-muted-foreground mt-1">
          Generate cinematic scene compositions
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Scene Description</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Describe your scene in detail..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[120px]"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Scene Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-2">
                {scenes.map((scene) => (
                  <button
                    key={scene}
                    onClick={() => setSelectedScene(scene)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      selectedScene === scene
                        ? "bg-primary text-white"
                        : "bg-secondary hover:bg-secondary/80 text-muted-foreground"
                    }`}
                  >
                    {scene}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Mood</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-2">
                {moods.map((mood) => (
                  <button
                    key={mood}
                    onClick={() => setSelectedMood(mood)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      selectedMood === mood
                        ? "bg-primary text-white"
                        : "bg-secondary hover:bg-secondary/80 text-muted-foreground"
                    }`}
                  >
                    {mood}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Time of Day</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-2">
                {times.map((time) => (
                  <button
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      selectedTime === time
                        ? "bg-primary text-white"
                        : "bg-secondary hover:bg-secondary/80 text-muted-foreground"
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Button variant="gradient" size="lg" className="w-full h-14 text-lg">
            <Sparkles className="h-5 w-5 mr-2" />
            Generate Scene
          </Button>
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-lg">Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-video rounded-xl bg-secondary/50 flex items-center justify-center">
              <div className="text-center">
                <ImageIcon className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground">Your scene will appear here</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
