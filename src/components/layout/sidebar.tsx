"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  ImageIcon,
  VideoIcon,
  Sofa,
  ShoppingBag,
  UtensilsCrossed,
  Sparkles,
  ZoomIn,
  Wand2,
  Mountain,
  Smartphone,
  Home,
  Settings,
  CreditCard,
  HelpCircle,
} from "lucide-react"

const tools = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Image Generator", href: "/tools/image-generator", icon: ImageIcon, gradient: "gradient-purple" },
  { name: "Video Generator", href: "/tools/video-generator", icon: VideoIcon, gradient: "gradient-blue" },
  { name: "Interior Design", href: "/tools/interior-design", icon: Sofa, gradient: "gradient-green" },
  { name: "Product Creator", href: "/tools/product-creator", icon: ShoppingBag, gradient: "gradient-orange" },
  { name: "Food Creator", href: "/tools/food-creator", icon: UtensilsCrossed, gradient: "gradient-pink" },
  { name: "Skin Enhancer", href: "/tools/skin-enhancer", icon: Sparkles, gradient: "gradient-purple" },
  { name: "AI Upscale", href: "/tools/ai-upscale", icon: ZoomIn, gradient: "gradient-blue" },
  { name: "Mega Studio", href: "/tools/mega-studio", icon: Wand2, gradient: "gradient-pink" },
  { name: "Scenes Creator", href: "/tools/scenes-creator", icon: Mountain, gradient: "gradient-green" },
  { name: "App Builder", href: "/tools/app-builder", icon: Smartphone, gradient: "gradient-orange" },
]

const bottomLinks = [
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "Billing", href: "/billing", icon: CreditCard },
  { name: "Help", href: "/help", icon: HelpCircle },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-card/50 backdrop-blur-xl">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-border px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-purple">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Lumen Creative
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-1">
            {tools.map((tool) => {
              const isActive = pathname === tool.href
              return (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary/20 text-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg",
                      tool.gradient || "bg-secondary"
                    )}
                  >
                    <tool.icon className="h-4 w-4 text-white" />
                  </div>
                  {tool.name}
                </Link>
              )
            })}
          </div>
        </nav>

        {/* Bottom Links */}
        <div className="border-t border-border px-3 py-4">
          <div className="space-y-1">
            {bottomLinks.map((link) => {
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary/20 text-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <link.icon className="h-4 w-4" />
                  {link.name}
                </Link>
              )
            })}
          </div>
        </div>

        {/* Credits */}
        <div className="border-t border-border p-4">
          <div className="rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Credits</span>
              <span className="text-lg font-bold text-white">∞</span>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-secondary overflow-hidden">
              <div className="h-full w-full gradient-purple rounded-full" />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Unlimited generations
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}
