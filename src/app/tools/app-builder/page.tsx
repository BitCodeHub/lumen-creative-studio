"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Smartphone, Sparkles, ImageIcon } from "lucide-react"

const appTypes = [
  "Social Media",
  "E-commerce",
  "Fitness",
  "Finance",
  "Food Delivery",
  "Travel",
  "Education",
  "Healthcare",
]

const styles = [
  "Modern Minimal",
  "Playful",
  "Corporate",
  "Dark Mode",
  "Glassmorphism",
  "Neumorphism",
  "Gradient",
  "Flat Design",
]

const screens = [
  "Login/Signup",
  "Dashboard",
  "Profile",
  "Settings",
  "Feed",
  "Product List",
  "Checkout",
  "Onboarding",
]

export default function AppBuilder() {
  const [selectedType, setSelectedType] = useState(appTypes[0])
  const [selectedStyle, setSelectedStyle] = useState(styles[0])
  const [selectedScreen, setSelectedScreen] = useState(screens[0])
  const [prompt, setPrompt] = useState("")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-orange">
            <Smartphone className="h-5 w-5 text-white" />
          </div>
          App Builder
        </h1>
        <p className="text-muted-foreground mt-1">
          Design app UI mockups with AI
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">App Description</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Describe your app and its features..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[120px]"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">App Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-2">
                {appTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      selectedType === type
                        ? "bg-primary text-white"
                        : "bg-secondary hover:bg-secondary/80 text-muted-foreground"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Design Style</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-2">
                {styles.map((style) => (
                  <button
                    key={style}
                    onClick={() => setSelectedStyle(style)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
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

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Screen Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-2">
                {screens.map((screen) => (
                  <button
                    key={screen}
                    onClick={() => setSelectedScreen(screen)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      selectedScreen === screen
                        ? "bg-primary text-white"
                        : "bg-secondary hover:bg-secondary/80 text-muted-foreground"
                    }`}
                  >
                    {screen}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Button variant="gradient" size="lg" className="w-full h-14 text-lg">
            <Sparkles className="h-5 w-5 mr-2" />
            Generate UI Design
          </Button>
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-lg">Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <div className="w-64 h-[520px] rounded-[40px] border-4 border-border bg-secondary/50 p-2 relative">
                {/* Phone notch */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-6 bg-background rounded-full" />
                {/* Screen */}
                <div className="w-full h-full rounded-[32px] bg-card flex items-center justify-center">
                  <div className="text-center">
                    <ImageIcon className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Your app design<br/>will appear here</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
