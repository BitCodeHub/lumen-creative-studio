"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Sparkles, Copy, Heart, Download, Loader2 } from "lucide-react";

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
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

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
    if (loading || loadingMore || !hasMore) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          setPage(prev => {
            const nextPage = prev + 1;
            fetchImages(nextPage, true);
            return nextPage;
          });
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loading, loadingMore, hasMore, fetchImages]);

  const copyPrompt = (prompt: string) => {
    navigator.clipboard.writeText(prompt);
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
            fontSize: "1.25rem", 
            fontWeight: 600, 
            color: "#ededed",
            marginBottom: "0.25rem"
          }}>
            Explore
          </h2>
          <p style={{ color: "#737373", fontSize: "0.875rem" }}>
            Get inspired by community creations
          </p>
        </div>
      </div>

      {/* Masonry Grid */}
      <div style={{
        columnCount: 4,
        columnGap: "1rem",
        width: "100%"
      }} className="gallery-masonry">
        {images.map((image) => (
          <div
            key={image.id}
            style={{
              breakInside: "avoid",
              marginBottom: "1rem",
              position: "relative",
              borderRadius: "0.75rem",
              overflow: "hidden",
              background: "#171717",
              border: "1px solid #2a2a2a",
              transition: "transform 0.2s, box-shadow 0.2s",
              cursor: "pointer"
            }}
            className="gallery-card"
          >
            {/* Image */}
            <div style={{ position: "relative" }}>
              <img
                src={image.imageUrl}
                alt={image.prompt}
                style={{
                  width: "100%",
                  display: "block",
                  borderRadius: "0.75rem 0.75rem 0 0"
                }}
                loading="lazy"
              />
              
              {/* Hover Overlay */}
              <div className="gallery-overlay" style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)",
                opacity: 0,
                transition: "opacity 0.2s",
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
                padding: "1rem"
              }}>
                {/* Action Buttons */}
                <div style={{ 
                  display: "flex", 
                  gap: "0.5rem", 
                  marginBottom: "0.75rem" 
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
                    onClick={(e) => { e.stopPropagation(); copyPrompt(image.prompt); }}
                    className="btn-secondary"
                    style={{ 
                      padding: "0.5rem 0.75rem", 
                      fontSize: "0.75rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.375rem"
                    }}
                  >
                    <Copy size={12} />
                    Copy
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

            {/* Prompt Preview */}
            <div style={{ padding: "0.75rem" }}>
              <p style={{
                color: "#a3a3a3",
                fontSize: "0.8125rem",
                lineHeight: 1.4,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}>
                {image.prompt}
              </p>
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "space-between",
                marginTop: "0.5rem",
                fontSize: "0.6875rem",
                color: "#525252"
              }}>
                <span>{image.model}</span>
                <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                  <Heart size={10} />
                  {image.likes}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Load More Trigger */}
      <div ref={loadMoreRef} style={{ height: "20px", marginTop: "1rem" }}>
        {loadingMore && (
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            color: "#737373",
            padding: "1rem"
          }}>
            <Loader2 size={20} className="animate-spin" />
            <span style={{ marginLeft: "0.5rem" }}>Loading more...</span>
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
          You've seen it all! Create something new ✨
        </p>
      )}
    </div>
  );
}
