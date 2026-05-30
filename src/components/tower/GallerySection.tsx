"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import type { Amenity, ConstructionMilestone } from "@/lib/types";

// Named gallery location — generated from amenities + milestones + standard project locations
export interface GalleryLocation {
  id: string;
  label: string;          // e.g. "Rooftop Pool"
  category: string;       // e.g. "Amenities" | "Exterior" | "Construction"
  imageUrl: string;
  description?: string;
}

const UNSPLASH = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=1200&q=85&auto=format&fit=crop`;

// Standard residential project gallery locations — fallback when no amenity data
const STANDARD_LOCATIONS: GalleryLocation[] = [
  { id: "grand_entrance",   label: "Grand Entrance",      category: "Exterior",  imageUrl: UNSPLASH("1486325212027-8081e485255e") },
  { id: "lobby",            label: "Grand Lobby",         category: "Interior",  imageUrl: UNSPLASH("1600607687939-ce8a6c25118c") },
  { id: "rooftop_pool",     label: "Rooftop Pool",        category: "Amenities", imageUrl: UNSPLASH("1576013551627-0cc20b96c2a7") },
  { id: "sky_terrace",      label: "Sky Terrace",         category: "Amenities", imageUrl: UNSPLASH("1502672260266-1c1ef2d93688") },
  { id: "clubhouse",        label: "Clubhouse",           category: "Amenities", imageUrl: UNSPLASH("1566073771259-470de1bed544") },
  { id: "fitness",          label: "Fitness Centre",      category: "Amenities", imageUrl: UNSPLASH("1534438327276-14e5300c3a48") },
  { id: "gardens",          label: "Landscaped Gardens",  category: "Exterior",  imageUrl: UNSPLASH("1558904541-efa843a96f01") },
  { id: "amphitheatre",     label: "Amphitheatre",        category: "Amenities", imageUrl: UNSPLASH("1489599849927-2ee91cede3ba") },
  { id: "kids_play",        label: "Kids Play Zone",      category: "Amenities", imageUrl: UNSPLASH("1597430203889-c93cce4aaa47") },
  { id: "basketball",       label: "Basketball Court",    category: "Sports",    imageUrl: UNSPLASH("1546519638-68e109498ffc") },
  { id: "central_courtyard",label: "Central Courtyard",  category: "Exterior",  imageUrl: UNSPLASH("1520637836993-23b3b00c7b98") },
  { id: "terrace_dining",   label: "Terrace Dining",      category: "Amenities", imageUrl: UNSPLASH("1555396273-367ea4eb4db5") },
];

function photoForAmenity(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("pool"))      return UNSPLASH("1576013551627-0cc20b96c2a7");
  if (n.includes("gym") || n.includes("fitness")) return UNSPLASH("1534438327276-14e5300c3a48");
  if (n.includes("garden") || n.includes("landscap") || n.includes("park")) return UNSPLASH("1558904541-efa843a96f01");
  if (n.includes("club"))      return UNSPLASH("1566073771259-470de1bed544");
  if (n.includes("play") || n.includes("kids") || n.includes("child")) return UNSPLASH("1597430203889-c93cce4aaa47");
  if (n.includes("yoga") || n.includes("meditat")) return UNSPLASH("1588286840104-8957b019727f");
  if (n.includes("court") || n.includes("badminton") || n.includes("tennis") || n.includes("basketball")) return UNSPLASH("1546519638-68e109498ffc");
  if (n.includes("amphi") || n.includes("theatre") || n.includes("theater")) return UNSPLASH("1489599849927-2ee91cede3ba");
  if (n.includes("lounge") || n.includes("party") || n.includes("social")) return UNSPLASH("1554118811-1e0d58224f24");
  if (n.includes("work") || n.includes("office") || n.includes("cowork")) return UNSPLASH("1497366216548-37526070297c");
  if (n.includes("rooftop") || n.includes("sky") || n.includes("terrace")) return UNSPLASH("1502672260266-1c1ef2d93688");
  if (n.includes("spa") || n.includes("steam")) return UNSPLASH("1540555700478-4be289fbecef");
  if (n.includes("dining") || n.includes("cafe") || n.includes("restaur")) return UNSPLASH("1555396273-367ea4eb4db5");
  if (n.includes("lobby") || n.includes("entrance") || n.includes("foyer")) return UNSPLASH("1600607687939-ce8a6c25118c");
  return UNSPLASH("1545324418-cc1a3fa10c00");
}

export function buildGallery(
  amenities: Amenity[],
  milestones: ConstructionMilestone[],
  coverImageUrl?: string | null
): GalleryLocation[] {
  const locations: GalleryLocation[] = [];

  // Cover as "Exterior View"
  if (coverImageUrl) {
    locations.push({
      id: "cover",
      label: "Exterior View",
      category: "Exterior",
      imageUrl: coverImageUrl,
    });
  }

  // Amenity-sourced locations
  amenities.slice(0, 10).forEach((a, i) => {
    locations.push({
      id: `amenity_${a.id}`,
      label: a.name,
      category: a.category ?? "Amenities",
      imageUrl: photoForAmenity(a.name),
      description: undefined,
    });
  });

  // Fill remainder from standard locations (skip duplicates by label similarity)
  const existingLabels = new Set(locations.map(l => l.label.toLowerCase()));
  for (const sl of STANDARD_LOCATIONS) {
    if (locations.length >= 16) break;
    const key = sl.label.toLowerCase();
    const isDupe = Array.from(existingLabels).some(el => el.includes(key.split(" ")[0]) || key.split(" ")[0].includes(el));
    if (!isDupe) {
      locations.push(sl);
      existingLabels.add(key);
    }
  }

  // Milestone photos (construction)
  const milestonePhotos = milestones.flatMap(m => (m.photo_urls ?? []).slice(0, 2)).slice(0, 4);
  milestonePhotos.forEach((url, i) => {
    locations.push({
      id: `milestone_${i}`,
      label: "Construction Progress",
      category: "Construction",
      imageUrl: url,
    });
  });

  return locations;
}

const CATEGORY_COLORS: Record<string, string> = {
  Exterior:     "#0071e3",
  Interior:     "#7c3aed",
  Amenities:    "#1cc77f",
  Sports:       "#f59e0b",
  Construction: "#64748b",
  Default:      "#475569",
};

function Lightbox({
  locations,
  idx,
  onClose,
}: {
  locations: GalleryLocation[];
  idx: number;
  onClose: () => void;
}) {
  const [current, setCurrent] = useState(idx);

  const prev = useCallback(() => setCurrent(c => (c - 1 + locations.length) % locations.length), [locations.length]);
  const next = useCallback(() => setCurrent(c => (c + 1) % locations.length), [locations.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape")      onClose();
      if (e.key === "ArrowRight")  next();
      if (e.key === "ArrowLeft")   prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, next, prev]);

  const loc = locations[current];
  const catColor = CATEGORY_COLORS[loc.category] ?? CATEGORY_COLORS.Default;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(12px)" }}
      onClick={onClose}>
      {/* Close */}
      <button onClick={onClose} className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center"
        style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}>
        <X className="w-5 h-5" />
      </button>

      {/* Counter */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 px-3 py-1.5 rounded-full"
        style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", fontSize: "0.75rem", color: "rgba(255,255,255,0.7)" }}>
        {current + 1} / {locations.length}
      </div>

      {/* Prev */}
      {locations.length > 1 && (
        <>
          <button onClick={e => { e.stopPropagation(); prev(); }}
            className="absolute left-4 sm:left-6 z-10 w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}>
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={e => { e.stopPropagation(); next(); }}
            className="absolute right-4 sm:right-6 z-10 w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}>
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Image card */}
      <div className="relative w-full max-w-4xl mx-4 rounded-3xl overflow-hidden"
        style={{ maxHeight: "80vh", aspectRatio: "16/10" }}
        onClick={e => e.stopPropagation()}>
        <Image src={loc.imageUrl} alt={loc.label} fill className="object-cover" sizes="100vw" priority />
        {/* Overlay */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 50%)" }} />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full mb-2"
            style={{ background: `${catColor}22`, border: `1px solid ${catColor}44`, fontSize: "0.68rem", fontWeight: 700, color: catColor, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            {loc.category}
          </span>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>{loc.label}</div>
        </div>
      </div>

      {/* Thumbnail strip */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 overflow-x-auto max-w-[90vw] px-2"
        style={{ scrollbarWidth: "none" }}>
        {locations.map((l, i) => (
          <button key={l.id} onClick={e => { e.stopPropagation(); setCurrent(i); }}
            className="shrink-0 relative rounded-lg overflow-hidden transition-all"
            style={{
              width: 48, height: 32,
              outline: i === current ? "2px solid #fff" : "2px solid transparent",
              outlineOffset: 1,
              opacity: i === current ? 1 : 0.5,
            }}>
            <Image src={l.imageUrl} alt={l.label} fill className="object-cover" sizes="48px" />
          </button>
        ))}
      </div>
    </div>
  );
}

interface Props {
  locations: GalleryLocation[];
  projectName: string;
}

const ALL_CATS = "All";

export default function GallerySection({ locations, projectName }: Props) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [activeCat, setActiveCat] = useState(ALL_CATS);

  const categories = [ALL_CATS, ...Array.from(new Set(locations.map(l => l.category)))];
  const filtered = activeCat === ALL_CATS ? locations : locations.filter(l => l.category === activeCat);

  if (locations.length === 0) return null;

  return (
    <div className="apple-card overflow-hidden" style={{ padding: 0 }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-6 pb-3">
        <div>
          <h2 className="text-tile" style={{ color: "#1d1d1f" }}>Gallery</h2>
          <p className="text-caption mt-0.5" style={{ color: "rgba(0,0,0,0.45)" }}>
            {locations.length} locations · {projectName}
          </p>
        </div>
        <button onClick={() => setLightboxIdx(0)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
          style={{ background: "rgba(0,0,0,0.06)", color: "#1d1d1f", border: "none", cursor: "pointer" }}>
          <Maximize2 className="w-3.5 h-3.5" /> View all
        </button>
      </div>

      {/* Category chips */}
      <div className="flex gap-1.5 px-6 pb-4 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        {categories.map(cat => {
          const color = CATEGORY_COLORS[cat] ?? CATEGORY_COLORS.Default;
          return (
            <button key={cat} onClick={() => setActiveCat(cat)}
              className="shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={activeCat === cat
                ? { background: "#1d1d1f", color: "#fff" }
                : { background: "#f0f0f2", color: "rgba(0,0,0,0.56)" }}>
              {cat}
              {cat !== ALL_CATS && (
                <span className="ml-1 opacity-60">({locations.filter(l => l.category === cat).length})</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Gallery grid — 3 cols, first item spans 2 rows */}
      <div className="px-6 pb-6">
        <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(3, 1fr)", gridAutoRows: "120px" }}>
          {filtered.slice(0, 7).map((loc, i) => {
            const catColor = CATEGORY_COLORS[loc.category] ?? CATEGORY_COLORS.Default;
            const isHero = i === 0;
            return (
              <button key={loc.id} onClick={() => setLightboxIdx(filtered.indexOf(loc))}
                className="relative rounded-2xl overflow-hidden group"
                style={{
                  gridColumn: isHero ? "span 2" : undefined,
                  gridRow: isHero ? "span 2" : undefined,
                  cursor: "pointer",
                  padding: 0,
                  border: "none",
                  background: "none",
                }}>
                <Image src={loc.imageUrl} alt={loc.label} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="400px" />
                {/* Overlay */}
                <div className="absolute inset-0 pointer-events-none"
                  style={{ background: "linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.1) 60%, transparent 100%)" }} />
                {/* Number + label */}
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <div className="flex items-end justify-between">
                    <div>
                      {isHero && (
                        <span className="block mb-1 px-2 py-0.5 rounded-full text-[9px] font-bold tracking-widest uppercase"
                          style={{ background: `${catColor}30`, color: catColor, border: `1px solid ${catColor}40`, width: "fit-content" }}>
                          {loc.category}
                        </span>
                      )}
                      <div style={{ fontSize: isHero ? "1rem" : "0.72rem", fontWeight: 700, color: "#fff", lineHeight: 1.2, textAlign: "left" }}>
                        {loc.label}
                      </div>
                    </div>
                    <span className="shrink-0 ml-1 text-right"
                      style={{ fontSize: "0.65rem", fontWeight: 700, color: "rgba(255,255,255,0.4)", lineHeight: 1 }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                </div>

                {/* Hover expand icon */}
                <div className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}>
                  <Maximize2 className="w-3.5 h-3.5" style={{ color: "#fff" }} />
                </div>
              </button>
            );
          })}
        </div>

        {filtered.length > 7 && (
          <button onClick={() => setLightboxIdx(7)}
            className="w-full mt-2 py-3 rounded-2xl text-sm font-semibold transition-all"
            style={{ background: "#f5f5f7", color: "#1d1d1f", border: "none", cursor: "pointer" }}>
            View {filtered.length - 7} more photos →
          </button>
        )}
      </div>

      {lightboxIdx !== null && (
        <Lightbox
          locations={filtered}
          idx={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
        />
      )}
    </div>
  );
}
