"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import type { Flat } from "@/lib/types";
import { X, Images, ChevronLeft, ChevronRight } from "lucide-react";
import { FLAT_TYPE_LABELS } from "@/lib/types";

// Curated interior photo sets per flat type
// Each entry: { room, url (Unsplash direct), credit }
type RoomPhoto = { room: string; url: string }

const PHOTO_SETS: Record<string, RoomPhoto[]> = {
  "2bhk": [
    { room: "Living Room",     url: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1600&q=85&fit=crop" },
    { room: "Master Bedroom",  url: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1600&q=85&fit=crop" },
    { room: "Kitchen",         url: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1600&q=85&fit=crop" },
    { room: "Bathroom",        url: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1600&q=85&fit=crop" },
    { room: "Balcony View",    url: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1600&q=85&fit=crop" },
  ],
  "3bhk": [
    { room: "Living Room",     url: "https://images.unsplash.com/photo-1600210492493-0946911123ea?w=1600&q=85&fit=crop" },
    { room: "Master Bedroom",  url: "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=1600&q=85&fit=crop" },
    { room: "Bedroom 2",       url: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=1600&q=85&fit=crop" },
    { room: "Kitchen",         url: "https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=1600&q=85&fit=crop" },
    { room: "Master Bath",     url: "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?w=1600&q=85&fit=crop" },
    { room: "Balcony View",    url: "https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=1600&q=85&fit=crop" },
  ],
  "4bhk": [
    { room: "Grand Living",    url: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1600&q=85&fit=crop" },
    { room: "Dining Area",     url: "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=1600&q=85&fit=crop" },
    { room: "Master Suite",    url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&q=85&fit=crop" },
    { room: "Kitchen",         url: "https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=1600&q=85&fit=crop" },
    { room: "Master Bath",     url: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1600&q=85&fit=crop" },
    { room: "Study / Library", url: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1600&q=85&fit=crop" },
    { room: "Balcony View",    url: "https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=1600&q=85&fit=crop" },
  ],
  "office": [
    { room: "Reception",       url: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&q=85&fit=crop" },
    { room: "Open Floor",      url: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1600&q=85&fit=crop" },
    { room: "Conference Room", url: "https://images.unsplash.com/photo-1529579538991-6e5ab50a1cb4?w=1600&q=85&fit=crop" },
    { room: "City View",       url: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1600&q=85&fit=crop" },
  ],
  "penthouse": [
    { room: "Sky Lounge",      url: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1600&q=85&fit=crop" },
    { room: "Panoramic View",  url: "https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=1600&q=85&fit=crop" },
    { room: "Master Suite",    url: "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=1600&q=85&fit=crop" },
    { room: "Private Pool",    url: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1600&q=85&fit=crop" },
    { room: "Gourmet Kitchen", url: "https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=1600&q=85&fit=crop" },
    { room: "Master Bath",     url: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1600&q=85&fit=crop" },
    { room: "Terrace",         url: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1600&q=85&fit=crop" },
  ],
  "1bhk": [
    { room: "Living Room",     url: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1600&q=85&fit=crop" },
    { room: "Bedroom",         url: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1600&q=85&fit=crop" },
    { room: "Kitchen",         url: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1600&q=85&fit=crop" },
    { room: "Bathroom",        url: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1600&q=85&fit=crop" },
  ],
  "default": [
    { room: "Living Room",     url: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1600&q=85&fit=crop" },
    { room: "Bedroom",         url: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1600&q=85&fit=crop" },
    { room: "Kitchen",         url: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1600&q=85&fit=crop" },
    { room: "Bathroom",        url: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1600&q=85&fit=crop" },
    { room: "Balcony View",    url: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1600&q=85&fit=crop" },
  ],
};

function photosForFlat(flat: Flat): RoomPhoto[] {
  const t = flat.flat_type.toLowerCase();
  if (t.includes("penthouse")) return PHOTO_SETS["penthouse"];
  if (t.includes("4")) return PHOTO_SETS["4bhk"];
  if (t.includes("3")) return PHOTO_SETS["3bhk"];
  if (t.includes("2")) return PHOTO_SETS["2bhk"];
  if (t === "1bhk" || t.includes("1")) return PHOTO_SETS["1bhk"];
  if (t.includes("office") || t.includes("commercial")) return PHOTO_SETS["office"];
  return PHOTO_SETS["default"];
}

function PhotoGallery({ photos }: { photos: RoomPhoto[] }) {
  const [idx, setIdx] = useState(0);
  const [animDir, setAnimDir] = useState<"left" | "right" | null>(null);
  const [touchStartX, setTouchStartX] = useState(0);

  const go = useCallback((dir: "left" | "right") => {
    setAnimDir(dir);
    setIdx(prev => dir === "right"
      ? (prev + 1) % photos.length
      : (prev - 1 + photos.length) % photos.length
    );
    setTimeout(() => setAnimDir(null), 300);
  }, [photos.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go("right");
      if (e.key === "ArrowLeft")  go("left");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  const current = photos[idx];

  return (
    <div className="w-full h-full flex flex-col" style={{ background: "#0a0d12" }}>
      {/* Main image */}
      <div
        className="relative flex-1 overflow-hidden select-none"
        onTouchStart={e => setTouchStartX(e.touches[0].clientX)}
        onTouchEnd={e => {
          const dx = e.changedTouches[0].clientX - touchStartX;
          if (Math.abs(dx) > 50) go(dx < 0 ? "right" : "left");
        }}
      >
        <Image
          key={idx}
          src={current.url}
          alt={current.room}
          fill
          className="object-cover"
          sizes="100vw"
          priority
          style={{
            transition: animDir ? "opacity 0.28s ease" : "none",
            opacity: animDir ? 0 : 1,
          }}
        />

        {/* Dark gradient overlay — top and bottom */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, transparent 25%, transparent 65%, rgba(0,0,0,0.70) 100%)"
        }} />

        {/* Room label */}
        <div className="absolute bottom-20 left-0 right-0 flex justify-center pointer-events-none">
          <div
            className="px-5 py-2 rounded-full text-sm font-semibold tracking-wide"
            style={{ background: "rgba(0,0,0,0.50)", backdropFilter: "blur(12px)", color: "#fff", border: "1px solid rgba(255,255,255,0.15)", letterSpacing: "0.04em" }}
          >
            {current.room}
          </div>
        </div>

        {/* Counter */}
        <div className="absolute top-4 right-4 text-xs font-medium" style={{ color: "rgba(255,255,255,0.55)" }}>
          {idx + 1} / {photos.length}
        </div>

        {/* Prev / Next arrows */}
        {photos.length > 1 && (
          <>
            <button
              onClick={() => go("left")}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-all"
              style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff" }}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => go("right")}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-all"
              style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff" }}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnail strip */}
      <div
        className="shrink-0 flex gap-2 overflow-x-auto px-4 py-3"
        style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(12px)", scrollbarWidth: "none" }}
      >
        {photos.map((p, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            className="relative shrink-0 rounded-lg overflow-hidden transition-all"
            style={{
              width: 72, height: 48,
              outline: i === idx ? "2px solid #fff" : "2px solid transparent",
              outlineOffset: 1,
              opacity: i === idx ? 1 : 0.55,
            }}
          >
            <Image src={p.url} alt={p.room} fill className="object-cover" sizes="72px" />
            <div
              className="absolute inset-x-0 bottom-0 px-1 py-0.5 text-center"
              style={{ background: "rgba(0,0,0,0.6)", fontSize: 8, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
            >
              {p.room}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

interface Props {
  flat: Flat;
  onClose: () => void;
}

export default function VirtualTourModal({ flat, onClose }: Props) {
  const isOffice = /office/.test(flat.flat_type);
  const photos = photosForFlat(flat);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "#0a0d12" }}>
      {/* Header */}
      <div
        className="shrink-0 flex items-center justify-between gap-3 px-4 py-3"
        style={{ background: "rgba(10,13,18,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}
      >
        <div className="min-w-0">
          <div style={{ fontWeight: 600, fontSize: 14, color: "#fff" }} className="truncate">
            {isOffice ? "Unit" : "Flat"} {flat.flat_number} · Interior
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 1 }}>
            {FLAT_TYPE_LABELS[flat.flat_type] ?? flat.flat_type.toUpperCase()} · Floor {flat.floor} · {flat.carpet_area_sqft} sq.ft · Sample photos
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl" style={{ background: "rgba(255,255,255,0.07)" }}>
            <Images className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.5)" }}/>
            <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)" }}>Interior Photos</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
            style={{ color: "rgba(255,255,255,0.6)", background: "rgba(255,255,255,0.07)", border: "none", cursor: "pointer" }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 relative overflow-hidden">
        <PhotoGallery photos={photos} />
      </div>
    </div>
  );
}
