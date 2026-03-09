"use client";

import { useState } from "react";
import { Sparkles, Video, Home as HomeIcon, ShoppingBag, Utensils, User, ZoomIn, Layers, Film, Workflow } from "lucide-react";

const tools = [
  {
    id: "image-generator",
    name: "AI Image Generator",
    description: "Create stunning images from text prompts",
    icon: Sparkles,
    color: "from-purple-500 to-pink-500",
    href: "/tools/image-generator",
  },
  {
    id: "video-generator",
    name: "AI Video Generator",
    description: "Transform images into videos with AI",
    icon: Video,
    color: "from-blue-500 to-cyan-500",
    href: "/tools/video-generator",
  },
  {
    id: "interior-design",
    name: "Interior Design",
    description: "Redesign rooms with AI visualization",
    icon: HomeIcon,
    color: "from-green-500 to-emerald-500",
    href: "/tools/interior-design",
  },
  {
    id: "product-creator",
    name: "AI Product Creator",
    description: "Professional product photography with AI",
    icon: ShoppingBag,
    color: "from-orange-500 to-amber-500",
    href: "/tools/product-creator",
  },
  {
    id: "food-creator",
    name: "Food Creator",
    description: "Beautiful food photography and styling",
    icon: Utensils,
    color: "from-red-500 to-rose-500",
    href: "/tools/food-creator",
  },
  {
    id: "skin-enhancer",
    name: "Skin Enhancer",
    description: "Professional portrait retouching",
    icon: User,
    color: "from-pink-500 to-fuchsia-500",
    href: "/tools/skin-enhancer",
  },
  {
    id: "upscale",
    name: "AI Upscale",
    description: "Enhance image resolution up to 4x",
    icon: ZoomIn,
    color: "from-indigo-500 to-violet-500",
    href: "/tools/upscale",
  },
  {
    id: "mega-studio",
    name: "Mega Studio",
    description: "All-in-one project management hub",
    icon: Layers,
    color: "from-teal-500 to-cyan-500",
    href: "/tools/mega-studio",
  },
  {
    id: "scenes-creator",
    name: "Scenes Creator",
    description: "Create video storyboards from scripts",
    icon: Film,
    color: "from-yellow-500 to-orange-500",
    href: "/tools/scenes-creator",
  },
  {
    id: "app-builder",
    name: "App Builder",
    description: "Build AI workflows with drag & drop",
    icon: Workflow,
    color: "from-slate-500 to-zinc-500",
    href: "/tools/app-builder",
  },
];

const models = [
  { id: "flux-pro", name: "FLUX Pro", tag: "Best Quality" },
  { id: "realvis", name: "RealVisXL", tag: "Photorealistic" },
  { id: "flux-schnell", name: "FLUX Schnell", tag: "Fast" },
  { id: "sdxl", name: "SDXL", tag: "Versatile" },
];

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState("flux-pro");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, model: selectedModel }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setGeneratedImage(data.imageUrl);
      }
    } catch (error) {
      console.error("Generation failed:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-pink-900/20" />
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center">
            <h1 className="text-5xl font-bold tracking-tight">
              <span className="gradient-text">AI Creative Studio</span>
            </h1>
            <p className="mt-4 text-xl text-zinc-400">
              Create stunning images, videos, and more with the power of AI
            </p>
          </div>

          {/* Quick Generate */}
          <div className="mx-auto mt-12 max-w-3xl">
            <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-6 backdrop-blur">
              <div className="flex flex-wrap gap-2 mb-4">
                {models.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => setSelectedModel(model.id)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      selectedModel === model.id
                        ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                        : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                    }`}
                  >
                    {model.name}
                    {model.tag && (
                      <span className="ml-2 text-xs opacity-70">{model.tag}</span>
                    )}
                  </button>
                ))}
              </div>
              
              <div className="flex gap-3">
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe what you want to create..."
                  className="flex-1 rounded-xl border border-white/10 bg-zinc-800 px-4 py-3 text-white placeholder-zinc-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                />
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !prompt.trim()}
                  className="rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-3 font-medium text-white hover:opacity-90 transition disabled:opacity-50"
                >
                  {isGenerating ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Generating...
                    </span>
                  ) : (
                    "Generate"
                  )}
                </button>
              </div>

              {generatedImage && (
                <div className="mt-6">
                  <img
                    src={generatedImage}
                    alt="Generated"
                    className="w-full rounded-xl border border-white/10"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Tools Grid */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            <span className="gradient-text">AI Tools</span>
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {tools.map((tool) => (
              <a
                key={tool.id}
                href={tool.href}
                className="group card-hover rounded-xl border border-white/10 bg-zinc-900/50 p-6 backdrop-blur"
              >
                <div className={`inline-flex rounded-lg bg-gradient-to-br ${tool.color} p-3`}>
                  <tool.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="mt-4 font-semibold text-white group-hover:text-purple-400 transition">
                  {tool.name}
                </h3>
                <p className="mt-2 text-sm text-zinc-400">
                  {tool.description}
                </p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-20 border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="text-3xl font-bold text-center mb-4">
            <span className="gradient-text">Pricing</span>
          </h2>
          <p className="text-center text-zinc-400 mb-12">
            Start free, upgrade when you need more
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { name: "Free", price: "$0", credits: "50 credits/month", features: ["Basic models", "Standard quality", "Community support"] },
              { name: "Pro", price: "$19", credits: "500 credits/month", features: ["All models", "HD quality", "Priority support", "API access"], popular: true },
              { name: "Enterprise", price: "$99", credits: "Unlimited", features: ["All Pro features", "Custom models", "Dedicated support", "Webhooks"] },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`rounded-xl border p-6 ${
                  plan.popular
                    ? "border-purple-500 bg-purple-500/10"
                    : "border-white/10 bg-zinc-900/50"
                }`}
              >
                {plan.popular && (
                  <span className="inline-block rounded-full bg-purple-500 px-3 py-1 text-xs font-medium text-white mb-4">
                    Most Popular
                  </span>
                )}
                <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                <div className="mt-2">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                  <span className="text-zinc-400">/month</span>
                </div>
                <p className="mt-2 text-sm text-zinc-400">{plan.credits}</p>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-zinc-300">
                      <svg className="h-4 w-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                <button className={`mt-6 w-full rounded-lg py-2 font-medium transition ${
                  plan.popular
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90"
                    : "bg-zinc-800 text-white hover:bg-zinc-700"
                }`}>
                  Get Started
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500" />
              <span className="text-xl font-bold gradient-text">Lumen Creative</span>
            </div>
            <p className="text-sm text-zinc-400">
              © 2026 Lumen AI Solutions. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
