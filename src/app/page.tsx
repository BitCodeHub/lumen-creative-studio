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
  HelpCircle,
  Bell,
  Search,
  Check,
  Loader2,
  Download,
  Menu,
  X
} from "lucide-react";

const tools = [
  { id: "image-generator", name: "Image Generator", icon: Sparkles },
  { id: "video-generator", name: "Video Generator", icon: Video },
  { id: "interior-design", name: "Interior Design", icon: Home },
  { id: "product-creator", name: "Product Creator", icon: ShoppingBag },
  { id: "food-creator", name: "Food Creator", icon: Utensils },
  { id: "skin-enhancer", name: "Skin Enhancer", icon: User },
  { id: "upscale", name: "AI Upscale", icon: ZoomIn },
  { id: "mega-studio", name: "Mega Studio", icon: Layers },
  { id: "scenes-creator", name: "Scenes Creator", icon: Film },
  { id: "app-builder", name: "App Builder", icon: Workflow },
];

const toolDescriptions: Record<string, string> = {
  "image-generator": "Generate images from text using FLUX.1-dev with 4x upscaling",
  "video-generator": "Transform images into videos with LTX Video AI",
  "interior-design": "Redesign rooms with AI-powered visualization",
  "product-creator": "Generate professional product photography",
  "food-creator": "Create mouthwatering food photography",
  "skin-enhancer": "Professional portrait retouching",
  "upscale": "Enhance image resolution up to 4x",
  "mega-studio": "All-in-one creative workspace",
  "scenes-creator": "Create video storyboards from scripts",
  "app-builder": "Build AI workflows with drag & drop",
};

const models = [
  { id: "flux-dev", name: "FLUX.1-dev", tag: "Default" },
  { id: "flux-schnell", name: "FLUX Schnell", tag: "Fast" },
  { id: "realvis", name: "RealVisXL", tag: "Photo" },
  { id: "sdxl", name: "SDXL", tag: "Classic" },
];

export default function HomePage() {
  const [prompt, setPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState("flux-dev");
  const [selectedTool, setSelectedTool] = useState("image-generator");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setError(null);
    setGeneratedImage(null);
    setProgress("Connecting to DGX...");
    
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          prompt, 
          model: selectedModel,
          upscale: true,
          upscale_factor: 4
        }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.imageUrl) {
        setProgress("");
        setGeneratedImage(data.imageUrl);
      } else {
        setError(data.error || "Generation failed");
        setProgress("");
      }
    } catch (err) {
      setError("Failed to connect to generation server");
      setProgress("");
    } finally {
      setIsGenerating(false);
    }
  };

  const activeTool = tools.find(t => t.id === selectedTool);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0f0f0f" }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          style={{ 
            position: "fixed", 
            inset: 0, 
            background: "rgba(0,0,0,0.5)", 
            zIndex: 40 
          }} 
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`} style={{ transform: sidebarOpen ? "translateX(0)" : undefined }}>
        {/* Logo */}
        <div style={{ 
          padding: "1rem 1rem", 
          borderBottom: "1px solid #2a2a2a",
          display: "flex",
          alignItems: "center",
          gap: "0.625rem"
        }}>
          <div style={{ 
            width: "28px", 
            height: "28px", 
            borderRadius: "6px",
            background: "#0066ff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <Sparkles size={16} color="white" />
          </div>
          <span style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#ededed" }}>
            Lumen Creative
          </span>
        </div>

        {/* Nav Items */}
        <nav style={{ padding: "0.75rem 0.5rem", flex: 1 }}>
          <div style={{ marginBottom: "0.375rem", padding: "0 0.75rem" }}>
            <span style={{ fontSize: "0.6875rem", color: "#737373", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Tools
            </span>
          </div>
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => { setSelectedTool(tool.id); setSidebarOpen(false); }}
              className={`nav-item ${selectedTool === tool.id ? "active" : ""}`}
              style={{ 
                width: "100%", 
                border: "none", 
                cursor: "pointer",
                marginBottom: "1px"
              }}
            >
              <tool.icon size={16} color={selectedTool === tool.id ? "#ededed" : "#737373"} />
              <span>{tool.name}</span>
            </button>
          ))}
        </nav>

        {/* Bottom */}
        <div style={{ borderTop: "1px solid #2a2a2a", padding: "0.5rem" }}>
          <button className="nav-item" style={{ width: "100%", border: "none", cursor: "pointer" }}>
            <Settings size={16} />
            <span>Settings</span>
          </button>
          <button className="nav-item" style={{ width: "100%", border: "none", cursor: "pointer" }}>
            <HelpCircle size={16} />
            <span>Help</span>
          </button>
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
          padding: "0.75rem 1rem",
          background: "#0f0f0f",
          borderBottom: "1px solid #2a2a2a",
          gap: "0.75rem"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="btn-secondary"
              style={{ 
                padding: "0.5rem", 
                borderRadius: "0.375rem",
                display: "none"
              }}
              id="mobile-menu-btn"
            >
              {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <div style={{ position: "relative" }}>
              <Search size={16} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#737373" }} />
              <input 
                className="input" 
                placeholder="Search..." 
                style={{ width: "240px", paddingLeft: "34px", background: "#171717", maxWidth: "100%" }}
              />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <button className="btn-secondary" style={{ padding: "0.5rem", borderRadius: "0.375rem" }}>
              <Bell size={18} />
            </button>
            <button className="btn-primary">
              Upgrade
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div style={{ padding: "1.5rem" }}>
          {/* Tool Header */}
          <div style={{ marginBottom: "1.5rem" }}>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 600, color: "#ededed", marginBottom: "0.25rem" }}>
              {activeTool?.name || "AI Creative Studio"}
            </h1>
            <p style={{ color: "#737373", fontSize: "0.875rem" }}>
              {toolDescriptions[selectedTool]}
            </p>
          </div>

          {/* Generation Panel */}
          <div className="tool-card" style={{ marginBottom: "1.5rem" }}>
            {/* Model Selection */}
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontSize: "0.8125rem", color: "#737373", marginBottom: "0.5rem", fontWeight: 500 }}>
                Model
              </label>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {models.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => setSelectedModel(model.id)}
                    className={`model-btn ${selectedModel === model.id ? "active" : ""}`}
                  >
                    {model.name}
                    <span style={{ marginLeft: "0.375rem", opacity: 0.6 }}>
                      {model.tag}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Prompt Input */}
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontSize: "0.8125rem", color: "#737373", marginBottom: "0.5rem", fontWeight: 500 }}>
                Prompt
              </label>
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
                      <Loader2 size={16} className="animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      Generate
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Settings Row */}
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", fontSize: "0.8125rem", color: "#737373" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                <Check size={14} color="#0066ff" />
                4x Upscale enabled
              </span>
            </div>

            {/* Progress */}
            {progress && (
              <div style={{ marginTop: "1rem", padding: "0.75rem", background: "#171717", borderRadius: "0.375rem", fontSize: "0.875rem", color: "#737373" }}>
                {progress}
              </div>
            )}

            {/* Error */}
            {error && (
              <div style={{ marginTop: "1rem", padding: "0.75rem", background: "rgba(255, 59, 48, 0.1)", borderRadius: "0.375rem", fontSize: "0.875rem", color: "#ff3b30", border: "1px solid rgba(255, 59, 48, 0.2)" }}>
                {error}
              </div>
            )}

            {/* Generated Image */}
            {generatedImage && (
              <div style={{ marginTop: "1rem" }}>
                <div style={{ position: "relative", display: "inline-block" }}>
                  <img
                    src={generatedImage}
                    alt="Generated"
                    style={{ 
                      maxWidth: "100%", 
                      maxHeight: "512px",
                      borderRadius: "0.5rem",
                      border: "1px solid #2a2a2a"
                    }}
                  />
                  <div style={{ 
                    position: "absolute", 
                    bottom: "0.75rem", 
                    right: "0.75rem", 
                    display: "flex", 
                    gap: "0.5rem" 
                  }}>
                    <a 
                      href={generatedImage} 
                      download="generated.png"
                      className="btn-secondary"
                      style={{ padding: "0.5rem", display: "flex", alignItems: "center", gap: "0.375rem" }}
                    >
                      <Download size={14} />
                      Download
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* All Tools Grid */}
          <div style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.75rem", color: "#ededed" }}>
              All Tools
            </h2>
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", 
              gap: "0.75rem" 
            }}>
              {tools.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => setSelectedTool(tool.id)}
                  className="tool-card"
                  style={{ 
                    border: selectedTool === tool.id ? "1px solid #0066ff" : "1px solid #2a2a2a",
                    cursor: "pointer",
                    textAlign: "left"
                  }}
                >
                  <div className="icon-wrap" style={{ marginBottom: "0.5rem" }}>
                    <tool.icon size={14} color="#ededed" />
                  </div>
                  <h3 style={{ fontWeight: 500, color: "#ededed", fontSize: "0.8125rem" }}>
                    {tool.name}
                  </h3>
                </button>
              ))}
            </div>
          </div>

          {/* Pricing Section */}
          <div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.375rem", color: "#ededed" }}>
              Pricing
            </h2>
            <p style={{ color: "#737373", marginBottom: "1rem", fontSize: "0.875rem" }}>
              Simple, transparent pricing
            </p>
            
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", 
              gap: "1rem",
              maxWidth: "800px"
            }}>
              {[
                { name: "Free", price: "$0", credits: "50 credits/month", features: ["Basic models", "Standard quality", "Community support"] },
                { name: "Pro", price: "$19", credits: "500 credits/month", features: ["All models", "4K quality", "Priority support", "API access"], popular: true },
                { name: "Enterprise", price: "$99", credits: "Unlimited", features: ["Everything in Pro", "Custom models", "Dedicated support", "SLA"] },
              ].map((plan) => (
                <div
                  key={plan.name}
                  className={`pricing-card ${plan.popular ? "popular" : ""}`}
                >
                  {plan.popular && (
                    <span className="badge badge-success" style={{ marginBottom: "0.75rem" }}>
                      Recommended
                    </span>
                  )}
                  <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "#ededed" }}>{plan.name}</h3>
                  <div style={{ marginTop: "0.375rem" }}>
                    <span style={{ fontSize: "2rem", fontWeight: 700, color: "#ededed" }}>{plan.price}</span>
                    <span style={{ color: "#737373", fontSize: "0.875rem" }}>/month</span>
                  </div>
                  <p style={{ marginTop: "0.25rem", fontSize: "0.8125rem", color: "#737373" }}>{plan.credits}</p>
                  <ul style={{ marginTop: "1rem", listStyle: "none" }}>
                    {plan.features.map((feature) => (
                      <li key={feature} style={{ 
                        display: "flex", 
                        alignItems: "center", 
                        gap: "0.5rem", 
                        fontSize: "0.8125rem", 
                        color: "#a3a3a3",
                        marginBottom: "0.5rem"
                      }}>
                        <Check size={14} color="#0066ff" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <button 
                    className={plan.popular ? "btn-primary" : "btn-secondary"}
                    style={{ width: "100%", marginTop: "1rem" }}
                  >
                    Get Started
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
