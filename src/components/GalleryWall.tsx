"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Sparkles, Copy, Heart, Download, Loader2, Check } from "lucide-react";

interface GalleryImage {
  id: string;
  imageUrl: string;
  prompt: string;
  model: string;
  likes: number;
  createdAt: string;
}

interface GalleryWallProps {
  onRemix: (prompt: string) => void;
}

export default function GalleryWall({ onRemix }: GalleryWallProps) {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Fetch gallery images
  const fetchImages = useCallback(async (pageNum: number, append: boolean = false) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      const response = await fetch(`/api/gallery?page=${pageNum}&limit=20`);
      const data = await response.json();

      if (data.images) {
        if (append) {
          setImages(prev => [...prev, ...data.images]);
        } else {
          setImages(data.images);
        }
        setHasMore(data.hasMore);
      }
    } catch (error) {
      console.error("Failed to fetch gallery:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchImages(1);
  }, [fetchImages]);

  // Infinite scroll observer
  useEffect(() => {
    if (loading) return;

    // Disconnect previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !loadingMore) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchImages(nextPage, true);
        }
      },
      { 
        threshold: 0,
        rootMargin: "200px" // Load more before user reaches the end
      }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loading, hasMore, loadingMore, page, fetchImages]);

  const copyPrompt = (id: string, prompt: string) => {
    navigator.clipboard.writeText(prompt);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) {
    return (
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center", 
        minHeight: "400px",
        color: "#737373"
      }}>
        <Loader2 size={24} className="animate-spin" />
        <span style={{ marginLeft: "0.5rem" }}>Loading gallery...</span>
      </div>
    );
  }

  return (
    <div style={{ width: "100%" }}>
      {/* Gallery Header */}
      <div style={{ 
        marginBottom: "1.5rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
      }}>
        <div>
          <h2 style={{ 
            fontSize: "1.5rem", 
            fontWeight: 600, 
            color: "#ededed",
            marginBottom: "0.25rem"
          }}>
            Find your inspiration
          </h2>
          <p style={{ color: "#737373", fontSize: "0.875rem" }}>
            Explore {images.length}+ AI-generated images with prompts you can use
          </p>
        </div>
      </div>

      {/* Masonry Grid */}
      <div className="gallery-masonry">
        {images.map((image) => (
          <div key={image.id} className="gallery-card">
            {/* Image */}
            <div style={{ position: "relative", overflow: "hidden" }}>
              <img
                src={image.imageUrl}
                alt={image.prompt}
                style={{
                  width: "100%",
                  display: "block"
                }}
                loading="lazy"
              />
              
              {/* Hover Overlay */}
              <div className="gallery-overlay">
                {/* Action Buttons */}
                <div style={{ 
                  display: "flex", 
                  gap: "0.5rem", 
                  marginBottom: "0.5rem" 
                }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); onRemix(image.prompt); }}
                    className="btn-primary"
                    style={{ 
                      padding: "0.5rem 0.75rem", 
                      fontSize: "0.75rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.375rem"
                    }}
                  >
                    <Sparkles size={12} />
                    Remix
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); copyPrompt(image.id, image.prompt); }}
                    className="btn-secondary"
                    style={{ 
                      padding: "0.5rem 0.75rem", 
                      fontSize: "0.75rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.375rem"
                    }}
                  >
                    {copiedId === image.id ? <Check size={12} /> : <Copy size={12} />}
                    {copiedId === image.id ? "Copied!" : "Copy"}
                  </button>
                  <a
                    href={image.imageUrl}
                    download
                    onClick={(e) => e.stopPropagation()}
                    className="btn-secondary"
                    style={{ 
                      padding: "0.5rem", 
                      fontSize: "0.75rem",
                      display: "flex",
                      alignItems: "center"
                    }}
                  >
                    <Download size={12} />
                  </a>
                </div>
              </div>
            </div>

            {/* Prompt Section - Always Visible */}
            <div style={{ padding: "0.875rem" }}>
              {/* Full Prompt - scrollable if too long */}
              <p style={{
                color: "#d4d4d4",
                fontSize: "0.8125rem",
                lineHeight: 1.5,
                marginBottom: "0.75rem",
                display: "-webkit-box",
                WebkitLineClamp: 4,
                WebkitBoxOrient: "vertical",
                overflow: "hidden"
              }}>
                {image.prompt}
              </p>
              
              {/* Copy Prompt Button */}
              <button
                onClick={() => copyPrompt(image.id, image.prompt)}
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  background: copiedId === image.id ? "rgba(0, 200, 83, 0.1)" : "rgba(255, 255, 255, 0.05)",
                  border: copiedId === image.id ? "1px solid rgba(0, 200, 83, 0.3)" : "1px solid #2a2a2a",
                  borderRadius: "0.375rem",
                  color: copiedId === image.id ? "#00c853" : "#737373",
                  fontSize: "0.75rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.375rem",
                  transition: "all 0.15s ease"
                }}
              >
                {copiedId === image.id ? (
                  <>
                    <Check size={12} />
                    Prompt copied!
                  </>
                ) : (
                  <>
                    <Copy size={12} />
                    Copy prompt to use
                  </>
                )}
              </button>
              
              {/* Meta Info */}
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "space-between",
                marginTop: "0.75rem",
                paddingTop: "0.75rem",
                borderTop: "1px solid #2a2a2a",
                fontSize: "0.6875rem",
                color: "#525252"
              }}>
                <span style={{ 
                  background: "#171717", 
                  padding: "0.25rem 0.5rem", 
                  borderRadius: "0.25rem",
                  color: "#737373"
                }}>
                  {image.model}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                  <Heart size={10} />
                  {image.likes.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Load More Trigger */}
      <div 
        ref={loadMoreRef} 
        style={{ 
          height: "100px", 
          marginTop: "1rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        {loadingMore && (
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            color: "#737373",
            padding: "1rem"
          }}>
            <Loader2 size={20} className="animate-spin" />
            <span style={{ marginLeft: "0.5rem" }}>Loading more inspirations...</span>
          </div>
        )}
      </div>

      {!hasMore && images.length > 0 && (
        <p style={{ 
          textAlign: "center", 
          color: "#525252", 
          fontSize: "0.875rem",
          padding: "1rem"
        }}>
          You've seen all {images.length} images! Create something new ✨
        </p>
      )}
    </div>
  );
}
