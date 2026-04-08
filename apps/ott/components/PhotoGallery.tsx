"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface Photo {
  id: number;
  url: string;
  type: string;
  width?: number | null;
  height?: number | null;
}

interface PhotoGalleryProps {
  images: Photo[];
  title: string;
}

export function PhotoGallery({ images, title }: PhotoGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    document.body.style.overflow = selectedIndex !== null ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedIndex]);

  if (images.length === 0) return null;

  const openLightbox = (index: number) => setSelectedIndex(index);
  const closeLightbox = () => setSelectedIndex(null);

  const goToNext = () => {
    if (selectedIndex !== null && selectedIndex < images.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
  };

  const goToPrevious = () => {
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowRight") goToNext();
    if (e.key === "ArrowLeft") goToPrevious();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-white">Photos</h2>
        <span className="text-sm text-zinc-400">{images.length} images</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {images.map((image, index) => (
          <button
            key={image.id}
            onClick={() => openLightbox(index)}
            className="relative aspect-video bg-zinc-900 rounded-lg overflow-hidden group cursor-pointer"
          >
            <Image
              src={image.url}
              alt={`${title} photo ${index + 1}`}
              fill
              className="object-cover group-hover:scale-105 transition"
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition" />
          </button>
        ))}
      </div>

      {selectedIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={closeLightbox}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="dialog"
          aria-modal="true"
        >
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white text-4xl hover:text-zinc-400 transition z-10"
            aria-label="Close"
          >
            &times;
          </button>

          {selectedIndex > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToPrevious();
              }}
              className="absolute left-4 text-white text-6xl hover:text-zinc-400 transition z-10"
              aria-label="Previous"
            >
              &#8249;
            </button>
          )}

          {selectedIndex < images.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              className="absolute right-4 text-white text-6xl hover:text-zinc-400 transition z-10"
              aria-label="Next"
            >
              &#8250;
            </button>
          )}

          <div
            className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={images[selectedIndex].url}
              alt={`${title} photo ${selectedIndex + 1}`}
              width={images[selectedIndex].width || 1920}
              height={images[selectedIndex].height || 1080}
              className="object-contain max-w-full max-h-full"
              priority
            />
          </div>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black/50 px-4 py-2 rounded">
            {selectedIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </div>
  );
}
