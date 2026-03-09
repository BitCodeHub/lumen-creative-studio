"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { UtensilsCrossed, Sparkles, ImageIcon } from "lucide-react"

const cuisines = [
  "Italian", "Japanese", "Mexican", "Indian", "French", "Thai", "American", "Mediterranean"
]

const styles = [
  "Restaurant Menu", "Social Media", "Magazine", "Rustic", "Minimalist", "Dark Moody"
]

export default function FoodCreator() {
  const [selectedCuisine, setSelectedCuisine] = useState(cuisines[0])
  const [selectedStyle, setSelectedStyle] = useState(styles[0])
  const [prompt, setPrompt] = useState("")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-pink">
            <UtensilsCrossed className="h-5 w-5 text-white" />
          </div>
          Food Creator
        </h1>
        <p className="text-muted-foreground mt-1">
          Generate appetizing food photography with AI
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Describe Your Dish</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Describe the food dish you want to create... e.g., 'A juicy beef burger with melted cheese, fresh lettuce, and crispy bacon'"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[120px]"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Cuisine Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-2">
                {cuisines.map((cuisine) => (
                  <button
                    key={cuisine}
                    onClick={() => setSelectedCuisine(cuisine)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedCuisine === cuisine
                        ? "bg-primary text-white"
                        : "bg-secondary hover:bg-secondary/80 text-muted-foreground"
                    }`}
                  >
                    {cuisine}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Photography Style</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
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

          <Button variant="gradient" size="lg" className="w-full h-14 text-lg">
            <Sparkles className="h-5 w-5 mr-2" />
            Generate Food Photo
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
                <p className="text-muted-foreground">Your food image will appear here</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
