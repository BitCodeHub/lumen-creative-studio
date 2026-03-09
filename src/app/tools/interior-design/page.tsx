"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Sofa, Sparkles, Upload, ImageIcon } from "lucide-react"

const styles = [
  "Modern Minimalist",
  "Scandinavian",
  "Industrial",
  "Mid-Century Modern",
  "Bohemian",
  "Traditional",
  "Contemporary",
  "Coastal",
  "Rustic",
  "Art Deco",
]

const rooms = [
  "Living Room",
  "Bedroom",
  "Kitchen",
  "Bathroom",
  "Home Office",
  "Dining Room",
]

export default function InteriorDesign() {
  const [selectedStyle, setSelectedStyle] = useState(styles[0])
  const [selectedRoom, setSelectedRoom] = useState(rooms[0])
  const [description, setDescription] = useState("")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-green">
            <Sofa className="h-5 w-5 text-white" />
          </div>
          Interior Design AI
        </h1>
        <p className="text-muted-foreground mt-1">
          Transform rooms with AI-powered interior design
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          {/* Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Upload Room Photo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-border rounded-xl p-12 text-center hover:border-primary/50 transition-colors cursor-pointer">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2">Drop your room photo here</p>
                <p className="text-sm text-muted-foreground">or click to browse</p>
              </div>
            </CardContent>
          </Card>

          {/* Room Type */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Room Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                {rooms.map((room) => (
                  <button
                    key={room}
                    onClick={() => setSelectedRoom(room)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedRoom === room
                        ? "bg-primary text-white"
                        : "bg-secondary hover:bg-secondary/80 text-muted-foreground"
                    }`}
                  >
                    {room}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Style */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Design Style</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {styles.map((style) => (
                  <button
                    key={style}
                    onClick={() => setSelectedStyle(style)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedStyle === style
                        ? "bg-primary text-white"
                        : "bg-secondary hover:bg-secondary/80 text-muted-foreground"
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Additional Details</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Describe any specific requirements..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[80px]"
              />
            </CardContent>
          </Card>

          <Button variant="gradient" size="lg" className="w-full h-14 text-lg">
            <Sparkles className="h-5 w-5 mr-2" />
            Redesign Room
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
                <p className="text-muted-foreground">Upload a room photo to get started</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
