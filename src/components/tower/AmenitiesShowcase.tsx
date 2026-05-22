"use client";

import { useState, useMemo, useEffect } from "react";
import type { Amenity } from "@/lib/types";
import { Sparkles, ChevronRight, X, Maximize2, ChevronLeft } from "lucide-react";

interface Props {
  amenities: Amenity[];
}

// Category theming — each category gets a distinct gradient + accent
const CATEGORY_THEME: Record<string, { gradient: string; accent: string }> = {
  recreation: { gradient: "linear-gradient(135deg, #0071e3 0%, #00a8e8 100%)", accent: "#0071e3" },
  wellness: { gradient: "linear-gradient(135deg, #059669 0%, #34d399 100%)", accent: "#059669" },
  fitness: { gradient: "linear-gradient(135deg, #059669 0%, #34d399 100%)", accent: "#059669" },
  convenience: { gradient: "linear-gradient(135deg, #d97706 0%, #fbbf24 100%)", accent: "#d97706" },
  services: { gradient: "linear-gradient(135deg, #d97706 0%, #fbbf24 100%)", accent: "#d97706" },
  security: { gradient: "linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)", accent: "#7c3aed" },
  outdoor: { gradient: "linear-gradient(135deg, #16a34a 0%, #4ade80 100%)", accent: "#16a34a" },
  social: { gradient: "linear-gradient(135deg, #db2777 0%, #f472b6 100%)", accent: "#db2777" },
  technology: { gradient: "linear-gradient(135deg, #0891b2 0%, #22d3ee 100%)", accent: "#0891b2" },
  workspace: { gradient: "linear-gradient(135deg, #4f46e5 0%, #818cf8 100%)", accent: "#4f46e5" },
  work: { gradient: "linear-gradient(135deg, #4f46e5 0%, #818cf8 100%)", accent: "#4f46e5" },
  building: { gradient: "linear-gradient(135deg, #475569 0%, #94a3b8 100%)", accent: "#475569" },
  entertainment: { gradient: "linear-gradient(135deg, #db2777 0%, #f472b6 100%)", accent: "#db2777" },
  default: { gradient: "linear-gradient(135deg, #475569 0%, #94a3b8 100%)", accent: "#475569" },
};

function themeFor(category: string | null) {
  if (!category) return CATEGORY_THEME.default;
  const key = category.toLowerCase();
  for (const k of Object.keys(CATEGORY_THEME)) {
    if (key.includes(k)) return CATEGORY_THEME[k];
  }
  return CATEGORY_THEME.default;
}

const UNSPLASH = (id: string) => `https://images.unsplash.com/photo-${id}?w=1100&q=80&auto=format&fit=crop`;

// Photo per amenity, matched on name keywords. Falls back gracefully if a URL fails.
function imageFor(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("pool")) return UNSPLASH("1576013551627-0cc20b96c2a7");
  if (n.includes("gym") || n.includes("fitness")) return UNSPLASH("1534438327276-14e5300c3a48");
  if (n.includes("garden") || n.includes("landscap") || n.includes("green") || n.includes("park")) return UNSPLASH("1558904541-efa843a96f01");
  if (n.includes("club")) return UNSPLASH("1600607687939-ce8a6c25118c");
  if (n.includes("play") || n.includes("kids") || n.includes("child")) return UNSPLASH("1597430203889-c93cce4aaa47");
  if (n.includes("security") || n.includes("cctv") || n.includes("concierge")) return UNSPLASH("1557597774-9d273605dfa9");
  if (n.includes("parking")) return UNSPLASH("1506521781263-d8422e82f27a");
  if (n.includes("yoga") || n.includes("meditat") || n.includes("reflexolog")) return UNSPLASH("1588286840104-8957b019727f");
  if (n.includes("spa") || n.includes("steam")) return UNSPLASH("1540555700478-4be289fbecef");
  if (n.includes("court") || n.includes("badminton") || n.includes("squash") || n.includes("tennis")) return UNSPLASH("1626224583764-f87db24ac4ea");
  if (n.includes("jog") || n.includes("track") || n.includes("cycl")) return UNSPLASH("1502904550040-7534597429ae");
  if (n.includes("theatre") || n.includes("theater") || n.includes("amphi")) return UNSPLASH("1489599849927-2ee91cede3ba");
  if (n.includes("cafe") || n.includes("food") || n.includes("dining") || n.includes("restaurant")) return UNSPLASH("1517248135467-4c7edcad34c4");
  if (n.includes("lounge") || n.includes("business") || n.includes("co-work") || n.includes("coworking") || n.includes("conference")) return UNSPLASH("1497366216548-37526070297c");
  if (n.includes("elevator") || n.includes("lift")) return UNSPLASH("1545063328-c8e3faffa16f");
  if (n.includes("power") || n.includes("generator") || n.includes("backup")) return UNSPLASH("1473341304170-971dccb5ac1e");
  if (n.includes("ev ") || n.includes("charging")) return UNSPLASH("1593941707882-a5bba14938c7");
  if (n.includes("smart") || n.includes("automation")) return UNSPLASH("1558002038-1055907df827");
  if (n.includes("rooftop") || n.includes("sky")) return UNSPLASH("1502672260266-1c1ef2d93688");
  if (n.includes("ac") || n.includes("air")) return UNSPLASH("1631545806609-25ca15e35e62");
  if (n.includes("pet")) return UNSPLASH("1450778869180-41d0601e046e");
  if (n.includes("senior") || n.includes("pavilion")) return UNSPLASH("1573497019940-1c28c88b4f3e");
  return UNSPLASH("1545324418-cc1a3fa10c00");
}

// Evocative description from amenity name
function describe(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("pool")) return "Take a refreshing dip or unwind poolside — a resort-style escape right at home.";
  if (n.includes("gym") || n.includes("fitness")) return "A fully-equipped fitness centre so your workout is never more than an elevator ride away.";
  if (n.includes("garden") || n.includes("park") || n.includes("landscap")) return "Lush landscaped greens designed for morning walks and quiet evenings.";
  if (n.includes("club")) return "A premium clubhouse for celebrations, gatherings, and community living.";
  if (n.includes("play") || n.includes("kids") || n.includes("child")) return "A safe, joyful play zone purpose-built for the youngest residents.";
  if (n.includes("security") || n.includes("cctv") || n.includes("guard")) return "Round-the-clock surveillance and trained personnel keeping your family secure.";
  if (n.includes("concierge")) return "A dedicated concierge desk to handle the everyday so you don't have to.";
  if (n.includes("parking")) return "Ample covered parking with smooth access for residents and guests.";
  if (n.includes("yoga") || n.includes("meditat")) return "A serene dedicated space to reconnect, stretch, and find your calm.";
  if (n.includes("sport") || n.includes("court") || n.includes("tennis") || n.includes("badminton") || n.includes("squash")) return "Professional-grade courts to keep your competitive spirit alive.";
  if (n.includes("jog") || n.includes("track") || n.includes("cycl")) return "A dedicated track winding through the community for runs and rides.";
  if (n.includes("power") || n.includes("backup") || n.includes("generator")) return "Uninterrupted power backup so life never skips a beat.";
  if (n.includes("lift") || n.includes("elevator")) return "High-speed elevators for effortless vertical living.";
  if (n.includes("amphi") || n.includes("theatre") || n.includes("theater")) return "An open venue for performances, movie nights, and community events.";
  if (n.includes("spa") || n.includes("steam")) return "A rejuvenating spa retreat — wellness woven into everyday life.";
  if (n.includes("cafe") || n.includes("restaurant") || n.includes("dining") || n.includes("food")) return "Curated dining and café spaces for casual meetups and good food.";
  if (n.includes("lounge") || n.includes("business") || n.includes("conference") || n.includes("work")) return "Elegant work-ready lounges for meetings and focused days.";
  if (n.includes("ev") || n.includes("charging")) return "Future-ready EV charging points for a cleaner commute.";
  if (n.includes("smart") || n.includes("automation")) return "Intelligent home automation putting control at your fingertips.";
  if (n.includes("rooftop") || n.includes("sky")) return "An elevated rooftop escape with skyline views and open air.";
  if (n.includes("ac")) return "Centralised climate control for year-round indoor comfort.";
  if (n.includes("pet")) return "A dedicated space where four-legged family members play freely.";
  return "A thoughtfully designed amenity that elevates everyday life in this community.";
}

export default function AmenitiesShowcase({ amenities }: Props) {
  const categories = useMemo(() => {
    const set = new Set<string>();
    amenities.forEach((a) => set.add(a.category ?? "Lifestyle"));
    return ["All", ...Array.from(set)];
  }, [amenities]);

  const [activeCat, setActiveCat] = useState("All");
  const [focusIdx, setFocusIdx] = useState(0);
  const [autoplay, setAutoplay] = useState(true);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [brokenImages, setBrokenImages] = useState<Set<string>>(new Set());

  const filtered = useMemo(
    () => (activeCat === "All" ? amenities : amenities.filter((a) => (a.category ?? "Lifestyle") === activeCat)),
    [amenities, activeCat]
  );

  useEffect(() => { setFocusIdx(0); }, [activeCat]);

  useEffect(() => {
    if (!autoplay || filtered.length < 2 || lightboxIdx !== null) return;
    const t = setInterval(() => setFocusIdx((i) => (i + 1) % filtered.length), 3800);
    return () => clearInterval(t);
  }, [autoplay, filtered.length, lightboxIdx]);

  // Esc + arrow keys for lightbox
  useEffect(() => {
    if (lightboxIdx === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxIdx(null);
      if (e.key === "ArrowRight") setLightboxIdx((i) => (i === null ? null : (i + 1) % filtered.length));
      if (e.key === "ArrowLeft") setLightboxIdx((i) => (i === null ? null : (i - 1 + filtered.length) % filtered.length));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxIdx, filtered.length]);

  if (amenities.length === 0) return null;

  const focused = filtered[focusIdx] ?? filtered[0];
  const theme = themeFor(focused?.category ?? null);
  const focusedBroken = focused ? brokenImages.has(focused.id) : true;

  function markBroken(id: string) {
    setBrokenImages((prev) => new Set(prev).add(id));
  }

  return (
    <div className="apple-card overflow-hidden" style={{ padding: 0 }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-6 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" style={{ color: "#0071e3" }} />
            <h2 className="text-tile" style={{ color: "#1d1d1f" }}>World-Class Amenities</h2>
          </div>
          <p className="text-caption mt-1" style={{ color: "rgba(0,0,0,0.5)" }}>
            {amenities.length} lifestyle features — tap any one to see it
          </p>
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-1.5 px-6 pb-4 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setActiveCat(c)}
            className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all shrink-0"
            style={
              activeCat === c
                ? { background: "#1d1d1f", color: "#fff" }
                : { background: "#f0f0f2", color: "rgba(0,0,0,0.56)" }
            }
          >
            {c}
          </button>
        ))}
      </div>

      {/* Featured display — photo with overlay */}
      {focused && (
        <button
          className="relative mx-6 rounded-2xl overflow-hidden block w-[calc(100%-3rem)] text-left"
          style={{ minHeight: 240, background: theme.gradient, cursor: "pointer" }}
          onMouseEnter={() => setAutoplay(false)}
          onMouseLeave={() => setAutoplay(true)}
          onClick={() => setLightboxIdx(focusIdx)}
        >
          {/* photo */}
          {!focusedBroken && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageFor(focused.name)}
              alt={focused.name}
              onError={() => markBroken(focused.id)}
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          {/* dark gradient for legibility */}
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.25) 55%, rgba(0,0,0,0.1) 100%)" }} />

          {/* expand hint */}
          <div
            className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full"
            style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(8px)" }}
          >
            <Maximize2 className="w-3 h-3" style={{ color: "#fff" }} />
            <span style={{ fontSize: "0.66rem", fontWeight: 600, color: "#fff" }}>View photo</span>
          </div>

          {/* text */}
          <div className="absolute bottom-0 left-0 right-0 p-5">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-2xl">{focused.icon ?? "✦"}</span>
              <span
                className="px-2 py-0.5 rounded-full"
                style={{ background: "rgba(255,255,255,0.2)", fontSize: "0.62rem", fontWeight: 700, color: "#fff", letterSpacing: "0.06em", textTransform: "uppercase" }}
              >
                {focused.category ?? "Lifestyle"}
              </span>
            </div>
            <h3 style={{ fontSize: "1.375rem", fontWeight: 700, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1.15 }}>
              {focused.name}
            </h3>
            <p className="mt-1" style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.82)", lineHeight: 1.45, maxWidth: 520 }}>
              {describe(focused.name)}
            </p>
          </div>

          {/* progress dots */}
          {filtered.length > 1 && (
            <div className="absolute top-3 left-3 flex gap-1.5">
              {filtered.map((_, i) => (
                <span
                  key={i}
                  className="rounded-full transition-all"
                  style={{
                    width: i === focusIdx ? 18 : 5,
                    height: 5,
                    background: i === focusIdx ? "#fff" : "rgba(255,255,255,0.45)",
                  }}
                />
              ))}
            </div>
          )}
        </button>
      )}

      {/* Amenity grid — click to open photo */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 p-6">
        {filtered.map((a, i) => {
          const aTheme = themeFor(a.category ?? null);
          const isActive = i === focusIdx;
          return (
            <button
              key={a.id}
              onClick={() => setLightboxIdx(i)}
              onMouseEnter={() => { setFocusIdx(i); setAutoplay(false); }}
              onMouseLeave={() => setAutoplay(true)}
              className="flex items-center gap-2.5 p-3 rounded-xl text-left transition-all"
              style={isActive ? { background: aTheme.accent } : { background: "#f7f7f8" }}
            >
              <span className="text-xl shrink-0">{a.icon ?? "✦"}</span>
              <span className="text-xs font-semibold leading-tight" style={{ color: isActive ? "#fff" : "#1d1d1f" }}>
                {a.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* footer strip */}
      <div className="flex items-center justify-between px-6 py-3" style={{ background: "#f7f7f8", borderTop: "1px solid rgba(0,0,0,0.05)" }}>
        <span className="text-xs" style={{ color: "rgba(0,0,0,0.45)" }}>Tap any amenity to view its photo</span>
        <span className="flex items-center gap-1 text-xs font-medium" style={{ color: "#0071e3" }}>
          {categories.length - 1} categories <ChevronRight className="w-3 h-3" />
        </span>
      </div>

      {/* ── Lightbox ─────────────────────────────────────────────── */}
      {lightboxIdx !== null && filtered[lightboxIdx] && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.88)" }}
          onClick={() => setLightboxIdx(null)}
        >
          {/* Close */}
          <button
            onClick={() => setLightboxIdx(null)}
            className="absolute top-4 right-4 p-2 rounded-full"
            style={{ background: "rgba(255,255,255,0.12)" }}
          >
            <X className="w-5 h-5" style={{ color: "#fff" }} />
          </button>

          {/* Prev / Next */}
          {filtered.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setLightboxIdx((lightboxIdx - 1 + filtered.length) % filtered.length); }}
                className="absolute left-3 sm:left-6 p-2.5 rounded-full"
                style={{ background: "rgba(255,255,255,0.12)" }}
              >
                <ChevronLeft className="w-5 h-5" style={{ color: "#fff" }} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setLightboxIdx((lightboxIdx + 1) % filtered.length); }}
                className="absolute right-3 sm:right-6 p-2.5 rounded-full"
                style={{ background: "rgba(255,255,255,0.12)" }}
              >
                <ChevronRight className="w-5 h-5" style={{ color: "#fff" }} />
              </button>
            </>
          )}

          {/* Card */}
          <div
            className="w-full max-w-2xl rounded-2xl overflow-hidden"
            style={{ background: "#fff" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full" style={{ aspectRatio: "16/10", background: themeFor(filtered[lightboxIdx].category ?? null).gradient }}>
              {!brokenImages.has(filtered[lightboxIdx].id) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageFor(filtered[lightboxIdx].name)}
                  alt={filtered[lightboxIdx].name}
                  onError={() => markBroken(filtered[lightboxIdx].id)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span style={{ fontSize: 72 }}>{filtered[lightboxIdx].icon ?? "✦"}</span>
                </div>
              )}
            </div>
            <div className="p-5">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xl">{filtered[lightboxIdx].icon ?? "✦"}</span>
                <span
                  className="px-2 py-0.5 rounded-full"
                  style={{
                    background: themeFor(filtered[lightboxIdx].category ?? null).accent + "1a",
                    color: themeFor(filtered[lightboxIdx].category ?? null).accent,
                    fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase",
                  }}
                >
                  {filtered[lightboxIdx].category ?? "Lifestyle"}
                </span>
                <span className="ml-auto text-xs" style={{ color: "rgba(0,0,0,0.4)" }}>
                  {lightboxIdx + 1} / {filtered.length}
                </span>
              </div>
              <h3 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#1d1d1f", letterSpacing: "-0.02em" }}>
                {filtered[lightboxIdx].name}
              </h3>
              <p className="mt-1.5" style={{ fontSize: "0.9rem", color: "rgba(0,0,0,0.6)", lineHeight: 1.55 }}>
                {describe(filtered[lightboxIdx].name)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
