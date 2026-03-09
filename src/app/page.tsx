"use client";

import { useState } from "react";
import { 
  Sparkles, 
  Video, 
  Home, 
  ShoppingBag, 
  Utensils, 
  User, 
  ZoomIn, 
  Layers, 
  Film, 
  Workflow,
  Settings,
  CreditCard,
  HelpCircle,
  Bell,
  Search,
  Check,
  Loader2
} from "lucide-react";

const tools = [
  { id: "image-generator", name: "Image Generator", icon: Sparkles, gradient: "gradient-purple" },
  { id: "video-generator", name: "Video Generator", icon: Video, gradient: "gradient-blue" },
  { id: "interior-design", name: "Interior Design", icon: Home, gradient: "gradient-green" },
  { id: "product-creator", name: "Product Creator", icon: ShoppingBag, gradient: "gradient-orange" },
  { id: "food-creator", name: "Food Creator", icon: Utensils, gradient: "gradient-pink" },
  { id: "skin-enhancer", name: "Skin Enhancer", icon: User, gradient: "gradient-purple" },
  { id: "upscale", name: "AI Upscale", icon: ZoomIn, gradient: "gradient-blue" },
  { id: "mega-studio", name: "Mega Studio", icon: Layers, gradient: "gradient-pink" },
  { id: "scenes-creator", name: "Scenes Creator", icon: Film, gradient: "gradient-green" },
  { id: "app-builder", name: "App Builder", icon: Workflow, gradient: "gradient-orange" },
];

const toolDescriptions: Record<string, string> = {
  "image-generator": "Create stunning images from text prompts using FLUX and RealVisXL models",
  "video-generator": "Transform your images into dynamic videos with LTX Video AI",
  "interior-design": "Redesign any room with AI-powered interior visualization",
  "product-creator": "Generate professional product photography instantly",
  "food-creator": "Create mouthwatering food photography and styling",
  "skin-enhancer": "Professional portrait retouching and enhancement",
  "upscale": "Enhance image resolution up to 4x with AI",
  "mega-studio": "All-in-one creative workspace for complex projects",
  "scenes-creator": "Create video storyboards from scripts",
  "app-builder": "Build AI workflows with visual drag & drop",
};

const models = [
  { id: "flux-pro", name: "FLUX Pro", tag: "Best" },
  { id: "realvis", name: "RealVisXL", tag: "Photo" },
  { id: "flux-schnell", name: "FLUX Fast", tag: "Quick" },
  { id: "sdxl", name: "SDXL", tag: "Classic" },
];

export default function HomePage() {
  const [prompt, setPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState("flux-pro");
  const [selectedTool, setSelectedTool] = useState("image-generator");
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

  const activeTool = tools.find(t => t.id === selectedTool);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0a0a0f" }}>
      {/* Sidebar */}
      <aside className="sidebar">
        {/* Logo */}
        <div style={{ 
          padding: "1.25rem 1.5rem", 
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem"
        }}>
          <div className="gradient-purple" style={{ 
            width: "36px", 
            height: "36px", 
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <Sparkles size={20} color="white" />
          </div>
          <span className="gradient-text" style={{ fontSize: "1.125rem", fontWeight: 700 }}>
            Lumen Creative
          </span>
        </div>

        {/* Nav Items */}
        <nav style={{ padding: "1rem 0.75rem", flex: 1 }}>
          <div style={{ marginBottom: "0.5rem", padding: "0 0.75rem" }}>
            <span style={{ fontSize: "0.75rem", color: "#666", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Tools
            </span>
          </div>
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => setSelectedTool(tool.id)}
              className={`nav-item ${selectedTool === tool.id ? "active" : ""}`}
              style={{ 
                width: "100%", 
                border: "none", 
                cursor: "pointer",
                background: selectedTool === tool.id ? "rgba(168, 85, 247, 0.15)" : "transparent",
                marginBottom: "2px"
              }}
            >
              <div className={`icon-wrap ${tool.gradient}`}>
                <tool.icon size={16} color="white" />
              </div>
              <span>{tool.name}</span>
            </button>
          ))}
        </nav>

        {/* Bottom */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", padding: "0.75rem" }}>
          <button className="nav-item" style={{ width: "100%", border: "none", cursor: "pointer", background: "transparent" }}>
            <Settings size={18} />
            <span>Settings</span>
          </button>
          <button className="nav-item" style={{ width: "100%", border: "none", cursor: "pointer", background: "transparent" }}>
            <CreditCard size={18} />
            <span>Billing</span>
          </button>
          <button className="nav-item" style={{ width: "100%", border: "none", cursor: "pointer", background: "transparent" }}>
            <HelpCircle size={18} />
            <span>Help</span>
          </button>
        </div>

        {/* Credits */}
        <div style={{ padding: "1rem" }}>
          <div style={{ 
            background: "linear-gradient(135deg, rgba(168,85,247,0.2) 0%, rgba(236,72,153,0.2) 100%)",
            borderRadius: "0.75rem",
            padding: "1rem"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.875rem", color: "#888" }}>Credits</span>
              <span style={{ fontSize: "1.25rem", fontWeight: 700, color: "white" }}>∞</span>
            </div>
            <div style={{ 
              marginTop: "0.5rem", 
              height: "6px", 
              borderRadius: "3px", 
              background: "rgba(255,255,255,0.1)",
              overflow: "hidden"
            }}>
              <div className="gradient-purple" style={{ width: "100%", height: "100%" }} />
            </div>
            <p style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "#666" }}>
              Unlimited generations
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Header */}
        <header style={{
          position: "sticky",
          top: 0,
          zIndex: 30,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "1rem 1.5rem",
          background: "rgba(10, 10, 15, 0.9)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.1)"
        }}>
          <div style={{ position: "relative" }}>
            <Search size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#666" }} />
            <input 
              className="input" 
              placeholder="Search tools, generations..." 
              style={{ width: "320px", paddingLeft: "40px" }}
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <button className="btn-secondary" style={{ padding: "0.5rem", borderRadius: "0.5rem", position: "relative" }}>
              <Bell size={20} />
              <span style={{ 
                position: "absolute", 
                top: "4px", 
                right: "4px", 
                width: "8px", 
                height: "8px", 
                borderRadius: "50%", 
                background: "#a855f7" 
              }} />
            </button>
            <button className="btn-primary" style={{ padding: "0.5rem 1rem", fontSize: "0.875rem" }}>
              Upgrade to Pro
            </button>
            <button className="btn-secondary" style={{ width: "40px", height: "40px", borderRadius: "50%", padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <User size={20} />
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div style={{ padding: "2rem" }}>
          {/* Tool Header */}
          <div style={{ marginBottom: "2rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.5rem" }}>
              {activeTool && (
                <div className={`icon-wrap ${activeTool.gradient}`} style={{ width: "48px", height: "48px", borderRadius: "12px" }}>
                  <activeTool.icon size={24} color="white" />
                </div>
              )}
              <div>
                <h1 className="gradient-text" style={{ fontSize: "1.75rem", fontWeight: 700 }}>
                  {activeTool?.name || "AI Creative Studio"}
                </h1>
                <p style={{ color: "#888", fontSize: "0.875rem", marginTop: "0.25rem" }}>
                  {toolDescriptions[selectedTool]}
                </p>
              </div>
            </div>
          </div>

          {/* Generation Panel */}
          <div className="tool-card" style={{ marginBottom: "2rem" }}>
            {/* Model Selection */}
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
              {models.map((model) => (
                <button
                  key={model.id}
                  onClick={() => setSelectedModel(model.id)}
                  className={`model-btn ${selectedModel === model.id ? "active" : ""}`}
                >
                  {model.name}
                  <span style={{ marginLeft: "0.5rem", opacity: 0.7, fontSize: "0.75rem" }}>
                    {model.tag}
                  </span>
                </button>
              ))}
            </div>

            {/* Prompt Input */}
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe what you want to create..."
                className="input"
                style={{ flex: 1 }}
                onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              />
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="btn-primary"
                style={{ display: "flex", alignItems: "center", gap: "0.5rem", whiteSpace: "nowrap" }}
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={18} className="animate-spin" style={{ animation: "spin 1s linear infinite" }} />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    Generate
                  </>
                )}
              </button>
            </div>

            {/* Generated Image */}
            {generatedImage && (
              <div style={{ marginTop: "1.5rem" }}>
                <img
                  src={generatedImage}
                  alt="Generated"
                  style={{ 
                    width: "100%", 
                    maxWidth: "512px",
                    borderRadius: "0.75rem",
                    border: "1px solid rgba(255,255,255,0.1)"
                  }}
                />
              </div>
            )}
          </div>

          {/* Quick Access Tools */}
          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem", color: "white" }}>
            All Tools
          </h2>
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", 
            gap: "1rem" 
          }}>
            {tools.map((tool) => (
              <button
                key={tool.id}
                onClick={() => setSelectedTool(tool.id)}
                className="tool-card"
                style={{ 
                  border: selectedTool === tool.id ? "1px solid #a855f7" : "1px solid rgba(255,255,255,0.08)",
                  cursor: "pointer",
                  textAlign: "left"
                }}
              >
                <div className={`icon-wrap ${tool.gradient}`} style={{ marginBottom: "0.75rem" }}>
                  <tool.icon size={16} color="white" />
                </div>
                <h3 style={{ fontWeight: 600, color: "white", fontSize: "0.875rem" }}>
                  {tool.name}
                </h3>
                <p style={{ fontSize: "0.75rem", color: "#666", marginTop: "0.25rem" }}>
                  {toolDescriptions[tool.id]?.slice(0, 50)}...
                </p>
              </button>
            ))}
          </div>

          {/* Pricing Section */}
          <div style={{ marginTop: "3rem" }}>
            <h2 className="gradient-text" style={{ fontSize: "1.5rem", fontWeight: 700, textAlign: "center", marginBottom: "0.5rem" }}>
              Pricing
            </h2>
            <p style={{ textAlign: "center", color: "#888", marginBottom: "2rem" }}>
              Start free, upgrade when you need more
            </p>
            
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", 
              gap: "1.5rem",
              maxWidth: "900px",
              margin: "0 auto"
            }}>
              {[
                { name: "Free", price: "$0", credits: "50 credits/month", features: ["Basic models", "Standard quality", "Community support"] },
                { name: "Pro", price: "$19", credits: "500 credits/month", features: ["All models", "HD quality", "Priority support", "API access"], popular: true },
                { name: "Enterprise", price: "$99", credits: "Unlimited", features: ["All Pro features", "Custom models", "Dedicated support", "Webhooks"] },
              ].map((plan) => (
                <div
                  key={plan.name}
                  className={`pricing-card ${plan.popular ? "popular" : ""}`}
                >
                  {plan.popular && (
                    <span style={{ 
                      display: "inline-block",
                      background: "#a855f7",
                      color: "white",
                      padding: "0.25rem 0.75rem",
                      borderRadius: "1rem",
                      fontSize: "0.75rem",
                      fontWeight: 500,
                      marginBottom: "1rem"
                    }}>
                      Most Popular
                    </span>
                  )}
                  <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "white" }}>{plan.name}</h3>
                  <div style={{ marginTop: "0.5rem" }}>
                    <span style={{ fontSize: "2.5rem", fontWeight: 700, color: "white" }}>{plan.price}</span>
                    <span style={{ color: "#888" }}>/month</span>
                  </div>
                  <p style={{ marginTop: "0.5rem", fontSize: "0.875rem", color: "#888" }}>{plan.credits}</p>
                  <ul style={{ marginTop: "1.5rem", listStyle: "none" }}>
                    {plan.features.map((feature) => (
                      <li key={feature} style={{ 
                        display: "flex", 
                        alignItems: "center", 
                        gap: "0.5rem", 
                        fontSize: "0.875rem", 
                        color: "#ccc",
                        marginBottom: "0.75rem"
                      }}>
                        <Check size={16} color="#a855f7" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <button 
                    className={plan.popular ? "btn-primary" : "btn-secondary"}
                    style={{ width: "100%", marginTop: "1.5rem" }}
                  >
                    Get Started
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer style={{ 
          borderTop: "1px solid rgba(255,255,255,0.1)", 
          padding: "2rem",
          marginTop: "3rem"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div className="gradient-purple" style={{ width: "32px", height: "32px", borderRadius: "8px" }} />
              <span className="gradient-text" style={{ fontWeight: 700 }}>Lumen Creative</span>
            </div>
            <p style={{ fontSize: "0.875rem", color: "#666" }}>
              © 2026 Lumen AI Solutions. All rights reserved.
            </p>
          </div>
        </footer>
      </main>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
