"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import type { Project, Flat, Tower } from "@/lib/types";
import { getProjectStats } from "@/lib/types";
import FlatDetailPanel from "@/components/flat/FlatDetailPanel";
import FlatFilters, { FilterState, applyFilters } from "@/components/flat/FlatFilters";
import CompareBar from "@/components/flat/CompareBar";
const CompareModal = dynamic(() => import("@/components/flat/CompareModal"), { ssr: false });
const VirtualTourModal = dynamic(() => import("@/components/flat/VirtualTourModal"), { ssr: false });
import ConstructionTracker from "@/components/tower/ConstructionTracker";
import AmenitiesShowcase from "@/components/tower/AmenitiesShowcase";
import StatusBadge from "@/components/ui/StatusBadge";
import UrgencyToast from "@/components/buyer/UrgencyToast";
import ShareButton from "@/components/buyer/ShareButton";
import ChatWidget from "@/components/buyer/ChatWidget";
import Image from "next/image";
import {
  MapPin, Building2, SlidersHorizontal, Layers, Box, BarChart2, X,
  Shield, ChevronRight, ChevronLeft, Sparkles, Calendar, Maximize2,
  CheckCircle2, ImageIcon, Heart, Clock, Navigation,
} from "lucide-react";

const ModelViewer = dynamic(() => import("@/components/tower/ModelViewer"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center" style={{ background: "#020917" }}>
      <div className="flex flex-col items-center gap-3" style={{ color: "rgba(255,255,255,0.4)" }}>
        <div className="w-10 h-10 rounded-full border-2 animate-spin"
          style={{ borderColor: "rgba(28,199,127,0.2)", borderTopColor: "#1cc77f" }} />
        <span className="text-caption">Loading 3D model…</span>
      </div>
    </div>
  ),
});

type ViewMode = "3d" | "floor" | "overview" | "visual";

interface Props { project: Project; }

// ── Flat card used in floor grid ──────────────────────────────────────────────
const STATUS_STYLE: Record<string, { bg: string; border: string; text: string }> = {
  available:  { bg: "rgba(52,199,89,0.08)",   border: "rgba(52,199,89,0.3)",   text: "#1a7f4a" },
  sold:       { bg: "rgba(255,59,48,0.08)",   border: "rgba(255,59,48,0.3)",   text: "#d70015" },
  reserved:   { bg: "rgba(255,149,0,0.08)",   border: "rgba(255,149,0,0.3)",   text: "#c25000" },
  held:       { bg: "rgba(168,85,247,0.08)",  border: "rgba(168,85,247,0.3)",  text: "#6c28d9" },
  discussion: { bg: "rgba(0,113,227,0.08)",   border: "rgba(0,113,227,0.3)",   text: "#0055b3" },
};

const FACING_ARROW: Record<string, string> = {
  North:"↑N", South:"↓S", East:"→E", West:"←W",
  north:"↑N", south:"↓S", east:"→E", west:"←W",
  "North-East":"↗NE","North-West":"↖NW","South-East":"↘SE","South-West":"↙SW",
  north_east:"↗NE",north_west:"↖NW",south_east:"↘SE",south_west:"↙SW",
};

const FLAT_TYPE_LABELS: Record<string, string> = {
  studio:"Studio", "1bhk":"1 BHK", "2bhk":"2 BHK", "3bhk":"3 BHK",
  "4bhk":"4 BHK", penthouse:"Penthouse", office:"Office", office_floor:"Office Floor",
};

export default function ProjectExplorer({ project }: Props) {
  const [view, setView]                     = useState<ViewMode>("visual");
  const [selectedFloor, setSelectedFloor]   = useState<number | null>(null);
  const [selectedFlat, setSelectedFlat]     = useState<Flat | null>(null);
  const [selectedTowerIdx, setSelectedTowerIdx] = useState(0);
  const [showFilters, setShowFilters]       = useState(false);
  const [compareList, setCompareList]       = useState<Flat[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [tourFlat, setTourFlat]             = useState<Flat | null>(null);
  const [floorToast, setFloorToast]         = useState<number | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    flatType: [], status: [],
    minFloor: 1, maxFloor: project.total_floors ?? 30,
    minPrice: 0, maxPrice: project.price_max ?? 60000000,
    facing: [],
  });
  const [showAvailOnly, setShowAvailOnly] = useState(true);
  const [flatSort, setFlatSort] = useState<"default" | "area_desc" | "area_asc" | "floor_desc">("default");
  const [recentlyViewed, setRecentlyViewed] = useState<Array<{ flatId: string; flatNumber: string; flatType: string; floor: number }>>([]);
  const sheetTouchY = useRef(0);

  // Track recently viewed flat
  useEffect(() => {
    if (!selectedFlat) return;
    const key = "flatbytes_recently_viewed_" + project.id;
    try {
      const existing: Array<{ flatId: string; flatNumber: string; flatType: string; floor: number }> =
        JSON.parse(localStorage.getItem(key) ?? "[]");
      const deduped = existing.filter((r) => r.flatId !== selectedFlat.id).slice(0, 7);
      deduped.unshift({ flatId: selectedFlat.id, flatNumber: selectedFlat.flat_number, flatType: selectedFlat.flat_type, floor: selectedFlat.floor });
      localStorage.setItem(key, JSON.stringify(deduped));
      setRecentlyViewed(deduped);
    } catch {}
  }, [selectedFlat, project.id]);

  // Load recently viewed on mount
  useEffect(() => {
    const key = "flatbytes_recently_viewed_" + project.id;
    try {
      const stored = JSON.parse(localStorage.getItem(key) ?? "[]");
      setRecentlyViewed(stored);
    } catch {}
  }, [project.id]);

  // Pre-populate BHK filter from URL (e.g. ?types=3bhk from search page)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const typesParam = params.get("types");
    if (!typesParam) return;
    const valid = ["studio","1bhk","2bhk","3bhk","4bhk","penthouse","office","office_floor"];
    const types = typesParam.split(",").filter(t => valid.includes(t)) as import("@/lib/types").FlatType[];
    if (types.length > 0) {
      setFilters(prev => ({ ...prev, flatType: types }));
      // Auto-jump to the floor with the most available flats matching the type
      const allFlatsForType = project.towers.flatMap(t => t.flats)
        .filter(f => types.includes(f.flat_type) && f.status === "available");
      if (allFlatsForType.length > 0) {
        const floorCounts: Record<number, number> = {};
        for (const f of allFlatsForType) floorCounts[f.floor] = (floorCounts[f.floor] ?? 0) + 1;
        const bestFloor = Number(Object.entries(floorCounts).sort((a, b) => b[1] - a[1])[0][0]);
        setSelectedFloor(bestFloor);
        setView("floor");
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats        = getProjectStats(project);
  const activeTower: Tower | undefined = project.towers[selectedTowerIdx];
  const allFlats     = project.towers.flatMap((t) => t.flats);
  const filteredFlats = useMemo(() => applyFilters(allFlats, filters), [allFlats, filters]);
  const filterCount  = filters.flatType.length + filters.status.length + filters.facing.length;

  const currentFloor = selectedFloor ?? (activeTower?.total_floors ?? 1);
  const floorFlats   = useMemo(() => {
    let flats = applyFilters(activeTower?.flats ?? [], filters).filter((f) => f.floor === currentFloor);
    if (showAvailOnly) flats = flats.filter((f) => f.status === "available");
    if (flatSort === "area_desc") flats = [...flats].sort((a, b) => b.carpet_area_sqft - a.carpet_area_sqft);
    else if (flatSort === "area_asc") flats = [...flats].sort((a, b) => a.carpet_area_sqft - b.carpet_area_sqft);
    else if (flatSort === "floor_desc") flats = [...flats].sort((a, b) => b.floor - a.floor);
    return flats;
  }, [activeTower, filters, currentFloor, showAvailOnly, flatSort]);
  const totalFloors  = activeTower?.total_floors ?? project.total_floors ?? 24;

  // Best Value: available flat with lowest price_per_sqft (or highest area as fallback)
  const bestValueId = useMemo(() => {
    const avail = (activeTower?.flats ?? []).filter((f) => f.floor === currentFloor && f.status === "available");
    if (avail.length < 2) return null;
    const hasPps = avail.some((f) => f.price_per_sqft !== null);
    const sorted = hasPps
      ? [...avail].sort((a, b) => (a.price_per_sqft ?? 99999) - (b.price_per_sqft ?? 99999))
      : [...avail].sort((a, b) => b.carpet_area_sqft - a.carpet_area_sqft);
    return sorted[0].id;
  }, [activeTower, currentFloor]);

  const handleFloorSelect = (floor: number) => {
    setSelectedFloor(floor);
    setView("floor");
    setFloorToast(floor);
    setTimeout(() => setFloorToast(null), 2000);
  };

  const toggleCompare = (flat: Flat) => {
    setCompareList((prev) => {
      if (prev.find((f) => f.id === flat.id)) return prev.filter((f) => f.id !== flat.id);
      if (prev.length >= 3) return prev;
      return [...prev, flat];
    });
  };

  // floor stats
  const floorAvail = floorFlats.filter(f => f.status === "available").length;
  const floorSold  = floorFlats.filter(f => f.status === "sold").length;
  const floorRes   = floorFlats.filter(f => f.status === "reserved").length;

  return (
    <div className="pt-[48px] h-screen flex flex-col overflow-hidden" style={{ background: "#f5f5f7" }}>

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center gap-3 px-4 sm:px-5"
        style={{ background:"#ffffff", borderBottom:"1px solid rgba(0,0,0,0.08)", height:52 }}>

        {/* Back */}
        <a href="/projects" className="shrink-0 flex items-center gap-1 text-micro transition-colors"
          style={{ color:"rgba(0,0,0,0.42)" }}
          onMouseEnter={e=>(e.currentTarget as HTMLElement).style.color="#0071e3"}
          onMouseLeave={e=>(e.currentTarget as HTMLElement).style.color="rgba(0,0,0,0.42)"}>
          <ChevronLeft className="w-3.5 h-3.5"/>
          <span className="hidden sm:inline">Projects</span>
        </a>

        <div style={{ width:1, height:18, background:"rgba(0,0,0,0.1)", flexShrink:0 }}/>

        {/* Project name + location */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Building2 className="w-4 h-4 shrink-0" style={{ color:"#0071e3" }}/>
          <div className="min-w-0">
            <div className="font-semibold truncate" style={{ fontSize:"0.875rem", color:"#1d1d1f", letterSpacing:"-0.01em", maxWidth:"min(200px,46vw)" }}>
              {project.name}
            </div>
            <div className="flex items-center gap-1 truncate" style={{ fontSize:"0.7rem", color:"rgba(0,0,0,0.42)", maxWidth:"min(200px,46vw)" }}>
              <MapPin className="w-2.5 h-2.5 shrink-0"/>
              {project.location}
            </div>
          </div>
        </div>

        {/* Availability pills — desktop only */}
        <div className="hidden lg:flex items-center gap-1.5 shrink-0">
          {[
            { n: stats.available, label:"Available", color:"#1a7f4a", bg:"rgba(52,199,89,0.1)", border:"rgba(52,199,89,0.25)" },
            { n: stats.sold,      label:"Sold",      color:"#d70015", bg:"rgba(255,59,48,0.1)",  border:"rgba(255,59,48,0.25)" },
            { n: stats.reserved,  label:"Reserved",  color:"#c25000", bg:"rgba(255,149,0,0.1)",  border:"rgba(255,149,0,0.25)" },
          ].map(s => (
            <span key={s.label} className="text-micro px-2 py-0.5 rounded-pill whitespace-nowrap"
              style={{ color:s.color, background:s.bg, border:`1px solid ${s.border}` }}>
              {s.n} {s.label}
            </span>
          ))}
        </div>

        {/* RERA badge — desktop only, compact */}
        {project.rera_number && (
          <div className="hidden xl:flex items-center gap-1 shrink-0 text-micro" style={{ color:"rgba(0,0,0,0.38)" }}>
            <Shield className="w-3 h-3" style={{ color:"#34c759" }}/>
            RERA ✓
          </div>
        )}

        {/* Share */}
        <div className="hidden sm:block shrink-0">
          <ShareButton title={project.name} text={`Explore ${project.name} in 3D on FlatBytes`}/>
        </div>

        {/* View switcher */}
        <div className="flex items-center gap-0.5 rounded-comfortable p-0.5 shrink-0"
          style={{ background:"#f5f5f7" }}>
          {([
            { id:"visual",   icon:<ImageIcon className="w-3.5 h-3.5"/>, label:"Visual" },
            { id:"3d",       icon:<Box className="w-3.5 h-3.5"/>,     label:"3D" },
            { id:"floor",    icon:<Layers className="w-3.5 h-3.5"/>,  label:"Floor" },
            { id:"overview", icon:<BarChart2 className="w-3.5 h-3.5"/>, label:"Info" },
          ] as const).map(v => (
            <button key={v.id} onClick={() => setView(v.id)}
              className="flex items-center justify-center gap-1 px-2.5 sm:px-3 rounded-standard text-micro font-normal transition-all"
              style={{ ...( view===v.id
                ? { background:"#ffffff", color:"#1d1d1f", boxShadow:"rgba(0,0,0,0.12) 0px 1px 4px 0px" }
                : { background:"transparent", color:"rgba(0,0,0,0.48)" }),
                minHeight: 36, minWidth: 36 }}>
              {v.icon}
              <span className="hidden sm:inline">{v.label}</span>
            </button>
          ))}
        </div>

        {/* Filters */}
        <button onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-standard text-micro transition-all shrink-0"
          style={filterCount>0
            ? { background:"#0071e3", color:"#fff" }
            : { background:"#f5f5f7", color:"rgba(0,0,0,0.64)" }}>
          <SlidersHorizontal className="w-3.5 h-3.5"/>
          <span className="hidden sm:inline">Filters</span>
          {filterCount>0 && (
            <span className="w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-semibold"
              style={{ background:"rgba(255,255,255,0.25)" }}>{filterCount}</span>
          )}
        </button>
      </div>

      {/* ── Main ────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* Desktop filter sidebar */}
        {showFilters && (
          <aside className="hidden lg:block shrink-0 w-72 overflow-y-auto"
            style={{ background:"#ffffff", borderRight:"1px solid rgba(0,0,0,0.08)" }}>
            <div className="p-4">
              <FlatFilters filters={filters} onChange={setFilters}
                totalFloors={project.total_floors ?? 30}
                maxPrice={project.price_max ?? 60000000}
                onClose={() => setShowFilters(false)}/>
            </div>
          </aside>
        )}

        {/* Mobile filter bottom sheet */}
        {showFilters && (
          <div className="lg:hidden fixed inset-0 z-50">
            <div className="absolute inset-0" style={{ background:"rgba(0,0,0,0.5)" }}
              onClick={() => setShowFilters(false)}/>
            <div className="absolute bottom-0 left-0 right-0 rounded-t-3xl overflow-hidden flex flex-col"
              style={{ background:"#fff", maxHeight:"88vh", animation:"slideUpSheet 0.32s cubic-bezier(0.34,1.2,0.64,1)" }}>
              <div className="relative flex justify-center pt-3 pb-0 shrink-0">
                <div className="w-10 h-1 rounded-full" style={{ background:"rgba(0,0,0,0.15)" }}/>
              </div>
              <div className="flex items-center justify-between px-5 py-3 shrink-0" style={{ borderBottom:"1px solid rgba(0,0,0,0.08)" }}>
                <div className="flex items-center gap-2">
                  <span style={{ fontWeight:700, fontSize:"1rem", color:"#1d1d1f" }}>Filters</span>
                  {filterCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background:"#0071e3", color:"#fff" }}>
                      {filterCount}
                    </span>
                  )}
                </div>
                <button onClick={() => setShowFilters(false)}
                  style={{ padding:8, background:"none", border:"none", cursor:"pointer", color:"rgba(0,0,0,0.4)", display:"flex" }}>
                  <X className="w-5 h-5"/>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-5">
                <FlatFilters filters={filters} onChange={setFilters}
                  totalFloors={project.total_floors ?? 30}
                  maxPrice={project.price_max ?? 60000000}
                  onClose={() => setShowFilters(false)}/>
              </div>
            </div>
          </div>
        )}

        <main className="flex-1 relative overflow-hidden">

          {/* Floor-jump toast */}
          {floorToast !== null && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-2 rounded-large text-micro font-medium pointer-events-none"
              style={{ background:"#1d1d1f", color:"#fff", boxShadow:"rgba(0,0,0,0.3) 0px 8px 24px 0px", animation:"fadeSlideDown 0.2s ease" }}>
              <Sparkles className="w-3.5 h-3.5" style={{ color:"#0071e3" }}/>
              Floor {floorToast} selected
            </div>
          )}

          {/* ═══ VISUAL RENDER VIEW ════════════════════════════════════ */}
          {view === "visual" && (
            <div className="w-full h-full relative overflow-hidden" style={{ background: "#0a0f1a" }}>
              <Image
                src="/images/building_render.jpg"
                alt={`${project.name} architectural visualization`}
                fill
                className="object-contain"
                priority
                sizes="100vw"
              />
              {/* Gradient overlay bottom */}
              <div className="absolute inset-0 pointer-events-none"
                style={{ background: "linear-gradient(to top, rgba(10,15,26,0.92) 0%, rgba(10,15,26,0.3) 40%, transparent 70%)" }}/>
              {/* Top badge */}
              <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(12px)", color: "#fff", border: "1px solid rgba(255,255,255,0.15)" }}>
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#1cc77f" }}/>
                Photorealistic Render · Cycles
              </div>
              {/* Bottom CTA */}
              <div className="absolute bottom-0 left-0 right-0 z-10 p-6 sm:p-8">
                <div className="max-w-2xl">
                  <h2 style={{ fontSize: "clamp(1.2rem,3vw,2rem)", fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
                    {project.name}
                  </h2>
                  <p className="mt-1.5 text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
                    {project.location}
                  </p>
                  <div className="flex items-center gap-3 mt-4">
                    <button onClick={() => setView("3d")}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm transition-all"
                      style={{ background: "#0071e3", color: "#fff", border: "none", cursor: "pointer" }}>
                      <Box className="w-4 h-4"/>
                      Explore in 3D
                    </button>
                    <button onClick={() => setView("floor")}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm transition-all"
                      style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", cursor: "pointer" }}>
                      <Layers className="w-4 h-4"/>
                      View Floor Plans
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══ 3D VIEW ═══════════════════════════════════════════════ */}
          {view === "3d" && (
            <div className="w-full h-full relative" style={{ background:"#020917" }}
              role="region" aria-label="Interactive 3D building model">
              <ModelViewer
                modelPath={project.model_3d_url ?? undefined}
                buildingType={project.project_type === "commercial" ? "commercial" : "residential"}
                isUnderConstruction={project.status === "active" || (project.construction_percentage ?? 100) < 100}
                totalFloors={activeTower?.total_floors ?? project.total_floors ?? 20}
                onFloorClick={handleFloorSelect}/>

              {/* ── Bottom HUD ── */}
              <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none"
                style={{ background:"linear-gradient(to top, rgba(2,9,23,0.92) 0%, rgba(2,9,23,0.6) 60%, transparent 100%)", padding:"32px 24px 20px" }}>
                <div className="flex items-end justify-between gap-4 max-w-5xl mx-auto pointer-events-auto">
                  {/* Project identity */}
                  <div>
                    <h1 style={{ fontSize:"clamp(1.1rem,2.5vw,1.6rem)", fontWeight:800, color:"#fff", letterSpacing:"-0.02em", lineHeight:1.1 }}>
                      {project.name}
                    </h1>
                    <div className="flex items-center gap-1.5 mt-1" style={{ color:"rgba(255,255,255,0.55)", fontSize:"0.8rem" }}>
                      <MapPin className="w-3 h-3"/>
                      {project.location}
                      {project.rera_number && (
                        <><span style={{ opacity:0.4 }}>·</span>
                        <Shield className="w-3 h-3" style={{ color:"#34c759" }}/>
                        <span style={{ color:"rgba(255,255,255,0.5)" }}>RERA Verified</span></>
                      )}
                    </div>
                    {/* Availability chips — horizontal scroll on mobile */}
                    <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1" style={{ scrollbarWidth:"none" }}>
                      <span className="shrink-0 px-2.5 py-1 rounded-pill text-xs font-semibold"
                        style={{ background:"rgba(52,199,89,0.2)", color:"#4ade80", border:"1px solid rgba(52,199,89,0.3)" }}>
                        {stats.available} Available
                      </span>
                      {stats.sold > 0 && (
                        <span className="shrink-0 px-2.5 py-1 rounded-pill text-xs font-semibold"
                          style={{ background:"rgba(255,59,48,0.15)", color:"#ff6b6b", border:"1px solid rgba(255,59,48,0.25)" }}>
                          {stats.sold} Sold
                        </span>
                      )}
                      {stats.reserved > 0 && (
                        <span className="shrink-0 px-2.5 py-1 rounded-pill text-xs font-semibold"
                          style={{ background:"rgba(255,149,0,0.15)", color:"#ffa94d", border:"1px solid rgba(255,149,0,0.25)" }}>
                          {stats.reserved} Reserved
                        </span>
                      )}
                      {project.possession_date && (
                        <span className="shrink-0 hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-pill text-xs font-medium"
                          style={{ background:"rgba(255,255,255,0.08)", color:"rgba(255,255,255,0.6)", border:"1px solid rgba(255,255,255,0.12)" }}>
                          <Calendar className="w-3 h-3"/>
                          {new Date(project.possession_date).toLocaleDateString("en-IN", { month:"short", year:"numeric" })}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* CTAs */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                    <button onClick={() => setView("floor")}
                      className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-standard font-semibold transition-all"
                      style={{ background:"#0071e3", color:"#fff", fontSize:"0.875rem", border:"none", cursor:"pointer" }}
                      onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background="#0077ED"}
                      onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background="#0071e3"}>
                      <Layers className="w-4 h-4"/>
                      View Floor Plans
                    </button>
                    <button onClick={() => setView("overview")}
                      className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-standard font-semibold transition-all"
                      style={{ background:"rgba(255,255,255,0.12)", color:"#fff", fontSize:"0.875rem", border:"1px solid rgba(255,255,255,0.2)", cursor:"pointer", backdropFilter:"blur(8px)" }}
                      onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background="rgba(255,255,255,0.18)"}
                      onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background="rgba(255,255,255,0.12)"}>
                      <BarChart2 className="w-4 h-4"/>
                      Project Info
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══ FLOOR PLAN VIEW ════════════════════════════════════════ */}
          {view === "floor" && (() => {
            const ST_BORDER: Record<string,string> = { available:"#34c759", sold:"#ff3b30", reserved:"#ff9500", held:"#af52de", discussion:"#007aff" };
            const ST_TEXT:   Record<string,string> = { available:"#1a7f4a", sold:"#d70015",  reserved:"#c25000",  held:"#6c28d9", discussion:"#0055b3" };
            const ST_BG:     Record<string,string> = { available:"rgba(52,199,89,0.06)", sold:"rgba(255,59,48,0.06)", reserved:"rgba(255,149,0,0.06)", held:"rgba(175,82,222,0.06)", discussion:"rgba(0,122,255,0.06)" };
            const ST_LABEL:  Record<string,string> = { available:"Available", sold:"Sold", reserved:"Reserved", held:"Held", discussion:"In Discussion" };
            return (
            <div className="w-full h-full flex flex-col overflow-hidden" style={{ background:"#f5f5f7" }}>

              {/* ── Mobile horizontal floor strip ── */}
              <div className="lg:hidden shrink-0 flex items-center gap-1.5 px-4 py-2.5 overflow-x-auto"
                style={{ background:"#fff", borderBottom:"1px solid rgba(0,0,0,0.08)", scrollbarWidth:"none" }}>
                <span className="shrink-0 text-xs font-semibold mr-1" style={{ color:"rgba(0,0,0,0.32)", letterSpacing:"0.04em" }}>FLOOR</span>
                {Array.from({ length: totalFloors }, (_, i) => totalFloors - i).map(f => {
                  const fp = (activeTower?.flats ?? []).filter(fl => fl.floor === f);
                  const hasAvail = fp.some(fl => fl.status === "available");
                  const active = f === currentFloor;
                  return (
                    <button key={f}
                      onClick={() => { setSelectedFloor(f); setSelectedFlat(null); }}
                      className="shrink-0 flex flex-col items-center justify-center rounded-xl transition-all"
                      style={{
                        minWidth: 44, height: 52,
                        background: active ? "#0071e3" : fp.length ? "#f5f5f7" : "transparent",
                        color: active ? "#fff" : fp.length ? "#1d1d1f" : "rgba(0,0,0,0.2)",
                        fontWeight: active ? 700 : 500, fontSize: "0.875rem",
                        border: active ? "none" : fp.length ? "1px solid rgba(0,0,0,0.09)" : "none",
                      }}>
                      {f}
                      {!active && fp.length > 0 && (
                        <div style={{ width:5, height:5, borderRadius:"50%", marginTop:3,
                          background: hasAvail ? "#34c759" : "#ff9500" }}/>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="flex-1 flex min-h-0">

                {/* ── Desktop floor sidebar ── */}
                <div className="hidden lg:flex shrink-0 flex-col overflow-hidden"
                  style={{ width:88, background:"#fff", borderRight:"1px solid rgba(0,0,0,0.08)" }}>
                  <div className="py-3 text-center shrink-0"
                    style={{ fontSize:"0.6rem", fontWeight:700, color:"rgba(0,0,0,0.32)", textTransform:"uppercase", letterSpacing:"0.08em", borderBottom:"1px solid rgba(0,0,0,0.06)" }}>
                    Floor
                  </div>
                  <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth:"none" }}>
                    {Array.from({ length: totalFloors }, (_, i) => totalFloors - i).map(f => {
                      const fp = (activeTower?.flats ?? []).filter(fl => fl.floor === f);
                      const avC = fp.filter(fl => fl.status === "available").length;
                      const soC = fp.filter(fl => fl.status === "sold").length;
                      const reC = fp.filter(fl => fl.status === "reserved").length;
                      const active = f === currentFloor;
                      const isHighFloor = f >= Math.ceil(totalFloors * 0.75);
                      const isGroundLevel = f <= 2;
                      const qualityTag = isHighFloor ? { label:"✦", title:"Premium Floor", color:"#c25000" }
                        : isGroundLevel ? { label:"G", title:"Ground Level", color:"#1a7f4a" }
                        : null;
                      return (
                        <button key={f}
                          onClick={() => { setSelectedFloor(f); setSelectedFlat(null); }}
                          className="w-full flex items-center justify-between px-3 transition-all group"
                          style={{
                            height:40, fontSize:"0.8125rem",
                            fontWeight: active ? 700 : fp.length ? 500 : 400,
                            color: active ? "#fff" : fp.length ? "#1d1d1f" : "rgba(0,0,0,0.2)",
                            background: active ? "#0071e3" : "transparent",
                            cursor: fp.length ? "pointer" : "default",
                          }}
                          title={qualityTag?.title}>
                          <span>{f}</span>
                          <div className="flex items-center gap-0.5">
                            {qualityTag && !active && (
                              <span style={{ fontSize:"0.5rem", fontWeight:700, color: qualityTag.color, lineHeight:1 }}>
                                {qualityTag.label}
                              </span>
                            )}
                            {!active && fp.length > 0 && (
                              <div className="flex gap-0.5">
                                {avC > 0 && <div style={{ width:5, height:5, borderRadius:"50%", background:"#34c759" }}/>}
                                {reC > 0 && <div style={{ width:5, height:5, borderRadius:"50%", background:"#ff9500" }}/>}
                                {soC > 0 && <div style={{ width:5, height:5, borderRadius:"50%", background:"#ff3b30" }}/>}
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ── Main content ── */}
                <div className="flex-1 flex flex-col min-h-0">

                  {/* Floor header */}
                  <div className="shrink-0" style={{ background:"#fff", borderBottom:"1px solid rgba(0,0,0,0.08)" }}>
                    {/* Title row */}
                    <div className="flex items-center gap-3 px-5 py-3 flex-wrap" style={{ minHeight:52 }}>
                      <span style={{ fontSize:"0.9375rem", fontWeight:700, color:"#1d1d1f" }}>Floor {currentFloor}</span>
                      <div style={{ width:1, height:14, background:"rgba(0,0,0,0.1)", flexShrink:0 }}/>
                      {(() => {
                        const total = (activeTower?.flats ?? []).filter(f => f.floor === currentFloor);
                        const av = total.filter(f => f.status === "available").length;
                        const so = total.filter(f => f.status === "sold").length;
                        const re = total.filter(f => f.status === "reserved").length;
                        return total.length === 0
                          ? <span style={{ fontSize:"0.8125rem", color:"rgba(0,0,0,0.4)" }}>No units</span>
                          : <div className="flex items-center gap-2 flex-wrap">
                              {av > 0 && <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background:"rgba(52,199,89,0.1)", color:"#1a7f4a", border:"1px solid rgba(52,199,89,0.25)" }}><span style={{ width:5,height:5,borderRadius:"50%",background:"#34c759",display:"inline-block" }}/>{av} Available</span>}
                              {re > 0 && <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background:"rgba(255,149,0,0.1)", color:"#c25000", border:"1px solid rgba(255,149,0,0.25)" }}>{re} Reserved</span>}
                              {so > 0 && <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background:"rgba(255,59,48,0.08)", color:"#d70015", border:"1px solid rgba(255,59,48,0.2)" }}>{so} Sold</span>}
                            </div>;
                      })()}
                      {project.towers.length > 1 && (
                        <div className="ml-auto flex items-center gap-1 rounded-comfortable p-0.5" style={{ background:"#f5f5f7" }}>
                          {project.towers.map((t, i) => (
                            <button key={t.id} onClick={() => { setSelectedTowerIdx(i); setSelectedFlat(null); }}
                              className="px-3 py-1 rounded-standard text-micro transition-all"
                              style={i === selectedTowerIdx ? { background:"#0071e3", color:"#fff" } : { background:"transparent", color:"rgba(0,0,0,0.56)" }}>
                              {t.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Filter + sort strip */}
                    <div className="pill-scroll items-center gap-2 px-5 pb-2.5">
                      {/* Active BHK type chip (when type filter is set from URL) */}
                      {filters.flatType.length > 0 && (
                        <button
                          onClick={() => setFilters(prev => ({ ...prev, flatType: [] }))}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0"
                          style={{ background:"rgba(0,113,227,0.12)", color:"#0055b3", border:"1.5px solid rgba(0,113,227,0.3)" }}>
                          {filters.flatType.map(t => FLAT_TYPE_LABELS[t] ?? t).join(", ")}
                          <span style={{ opacity:0.6, fontSize:"0.65rem" }}>✕</span>
                        </button>
                      )}
                      {/* Available only toggle */}
                      <button
                        onClick={() => setShowAvailOnly(v => !v)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                        style={showAvailOnly
                          ? { background:"rgba(52,199,89,0.12)", color:"#1a7f4a", border:"1.5px solid rgba(52,199,89,0.35)" }
                          : { background:"#f5f5f7", color:"rgba(0,0,0,0.56)", border:"1.5px solid transparent" }}>
                        <span style={{ width:6,height:6,borderRadius:"50%",background: showAvailOnly ? "#34c759" : "rgba(0,0,0,0.25)",display:"inline-block",flexShrink:0 }}/>
                        Available Only
                      </button>

                      {/* Sort controls */}
                      <div className="flex items-center gap-1 rounded-xl p-0.5" style={{ background:"#f5f5f7" }}>
                        {([
                          { id:"default"   as const, label:"Default" },
                          { id:"area_desc" as const, label:"Largest" },
                          { id:"area_asc"  as const, label:"Smallest" },
                          { id:"floor_desc"as const, label:"High Floor" },
                        ]).map(s => (
                          <button key={s.id} onClick={() => setFlatSort(s.id)}
                            className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                            style={flatSort === s.id
                              ? { background:"#fff", color:"#1d1d1f", boxShadow:"0 1px 3px rgba(0,0,0,0.1)" }
                              : { background:"transparent", color:"rgba(0,0,0,0.48)" }}>
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Recently viewed strip */}
                  {recentlyViewed.length > 1 && (
                    <div className="shrink-0 px-4 py-2 flex items-center gap-2 overflow-x-auto"
                      style={{ background:"rgba(0,113,227,0.04)", borderBottom:"1px solid rgba(0,113,227,0.08)", scrollbarWidth:"none" }}>
                      <span className="shrink-0 text-xs font-semibold flex items-center gap-1" style={{ color:"rgba(0,0,0,0.35)" }}>
                        <Clock className="w-3 h-3"/> Recent
                      </span>
                      {recentlyViewed.slice(1, 7).map(rv => {
                        const rvFlat = allFlats.find(f => f.id === rv.flatId);
                        if (!rvFlat) return null;
                        const rvSt = STATUS_STYLE[rvFlat.status] ?? STATUS_STYLE.available;
                        return (
                          <button key={rv.flatId}
                            onClick={() => { setSelectedFloor(rv.floor); setSelectedFlat(rvFlat); }}
                            className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium transition-all"
                            style={{ background:"#fff", color:"#1d1d1f", border:`1px solid ${rvSt.border}`, whiteSpace:"nowrap" }}>
                            <span style={{ width:5, height:5, borderRadius:"50%", background:rvSt.border, display:"inline-block", flexShrink:0 }}/>
                            {rv.flatNumber} · F{rv.floor}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Flat grid */}
                  <div className="flex-1 overflow-auto p-4 sm:p-5 pb-28 lg:pb-6">
                    {floorFlats.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full gap-3 py-16">
                        <div style={{ width:56, height:56, borderRadius:16, background:"#f5f5f7", display:"flex", alignItems:"center", justifyContent:"center" }}>
                          <Building2 className="w-6 h-6" style={{ color:"rgba(0,0,0,0.2)" }}/>
                        </div>
                        <p style={{ fontSize:"0.9375rem", fontWeight:600, color:"rgba(0,0,0,0.35)" }}>
                          {showAvailOnly ? "No available flats on this floor" : `No units on Floor ${currentFloor}`}
                        </p>
                        <p style={{ fontSize:"0.8125rem", color:"rgba(0,0,0,0.25)" }}>
                          {showAvailOnly ? "Try turning off 'Available Only' or pick another floor" : "Try a different floor"}
                        </p>
                        {showAvailOnly && (
                          <button onClick={() => setShowAvailOnly(false)}
                            className="px-4 py-2 rounded-xl text-sm font-semibold"
                            style={{ background:"#f5f5f7", color:"#1d1d1f", border:"none", cursor:"pointer" }}>
                            Show all statuses
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="grid gap-3 sm:gap-4"
                        style={{ gridTemplateColumns:"repeat(auto-fill, minmax(150px, 1fr))" }}>
                        {floorFlats.map(flat => {
                          const bc = ST_BORDER[flat.status] ?? "#e5e5ea";
                          const bg = ST_BG[flat.status]     ?? "rgba(0,0,0,0.02)";
                          const tc = ST_TEXT[flat.status]   ?? "rgba(0,0,0,0.45)";
                          const active = flat.id === selectedFlat?.id;
                          const isBestValue = flat.id === bestValueId;
                          return (
                            <button key={flat.id} onClick={() => setSelectedFlat(flat)}
                              className="flat-card relative text-left rounded-2xl transition-all"
                              style={{
                                background: active ? bg.replace("0.06","0.14") : "#fff",
                                borderTop: "1px solid rgba(0,0,0,0.07)",
                                borderRight: "1px solid rgba(0,0,0,0.07)",
                                borderBottom: "1px solid rgba(0,0,0,0.07)",
                                borderLeft: `4px solid ${bc}`,
                                boxShadow: active
                                  ? `0 0 0 2px ${bc}55, 0 8px 24px rgba(0,0,0,0.1)`
                                  : isBestValue ? "0 0 0 1.5px #34c75966, 0 4px 16px rgba(52,199,89,0.12)"
                                  : "0 1px 4px rgba(0,0,0,0.05)",
                                padding: "15px 15px 12px",
                              }}>

                              {/* Best Value badge */}
                              {isBestValue && (
                                <div className="absolute top-0 right-0 flex items-center gap-0.5 px-2 py-0.5 rounded-bl-xl rounded-tr-xl text-xs font-bold"
                                  style={{ background:"linear-gradient(135deg,#34c759,#1a7f4a)", color:"#fff", fontSize:"0.625rem", letterSpacing:"0.02em" }}>
                                  ★ BEST PICK
                                </div>
                              )}

                              {/* Status row */}
                              <div className="flex items-center justify-between mb-2.5">
                                <div className="flex items-center gap-1.5">
                                  <div style={{ width:6, height:6, borderRadius:"50%", background:bc, flexShrink:0 }}/>
                                  <span style={{ fontSize:"0.6875rem", fontWeight:700, color:tc, letterSpacing:"0.01em" }}>
                                    {ST_LABEL[flat.status] ?? flat.status}
                                  </span>
                                </div>
                                {flat.facing && (
                                  <span style={{ fontSize:"0.75rem", color:"rgba(0,0,0,0.38)", fontWeight:500 }}>
                                    {FACING_ARROW[flat.facing] ?? flat.facing[0]}
                                  </span>
                                )}
                              </div>

                              {/* Flat number */}
                              <div style={{ fontSize:"1.25rem", fontWeight:800, color:"#1d1d1f", letterSpacing:"-0.02em", lineHeight:1 }}>
                                {flat.flat_number}
                              </div>

                              {/* Type + area */}
                              <div style={{ fontSize:"0.8125rem", fontWeight:600, color:"#3a3a3c", marginTop:6 }}>
                                {FLAT_TYPE_LABELS[flat.flat_type] ?? flat.flat_type.toUpperCase()}
                              </div>
                              <div style={{ fontSize:"0.75rem", color:"rgba(0,0,0,0.42)", marginTop:2 }}>
                                {flat.carpet_area_sqft.toLocaleString()} sq.ft
                              </div>

                              <div style={{ height:1, background:"rgba(0,0,0,0.06)", margin:"11px 0 10px" }}/>

                              {/* Action row */}
                              <div className="flex items-center justify-between gap-2">
                                <button
                                  onClick={e => { e.stopPropagation(); setTourFlat(flat); }}
                                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
                                  style={{ background:"rgba(0,113,227,0.08)", color:"#0071e3", border:"1px solid rgba(0,113,227,0.16)" }}
                                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background="rgba(0,113,227,0.16)"}
                                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background="rgba(0,113,227,0.08)"}>
                                  <Box className="w-3 h-3"/> 3D Tour
                                </button>
                                <span style={{ fontSize:"0.6875rem", color:"rgba(0,0,0,0.32)", fontStyle:"italic" }}>On Request</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
          })()}

          {/* ═══ OVERVIEW / INFO ════════════════════════════════════════ */}
          {view === "overview" && (
            <div className="w-full h-full overflow-auto" style={{ background:"#f5f5f7" }}>
              {project.cover_image_url && (
                <div className="relative w-full" style={{ height:260 }}>
                  <Image src={project.cover_image_url} alt={project.name} fill
                    className="object-cover" sizes="100vw" priority/>
                  <div className="absolute inset-0"
                    style={{ background:"linear-gradient(to top,rgba(0,0,0,0.72) 0%,rgba(0,0,0,0.18) 55%,transparent 100%)" }}/>
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h1 style={{ fontSize:"1.75rem", fontWeight:700, color:"#fff", letterSpacing:"-0.02em", lineHeight:1.15 }}>
                      {project.name}
                    </h1>
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      <MapPin className="w-3.5 h-3.5" style={{ color:"rgba(255,255,255,0.7)" }}/>
                      <span style={{ color:"rgba(255,255,255,0.7)", fontSize:"0.875rem" }}>{project.location}</span>
                      {project.rera_number && (
                        <>
                          <span style={{ color:"rgba(255,255,255,0.35)" }}>·</span>
                          <Shield className="w-3 h-3" style={{ color:"#34c759" }}/>
                          <span style={{ color:"rgba(255,255,255,0.6)", fontSize:"0.8125rem" }}>RERA {project.rera_number}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="p-5 pb-24 lg:pb-8 max-w-4xl mx-auto space-y-4">

                {/* Possession countdown */}
                {project.possession_date && (() => {
                  const now = new Date();
                  const poss = new Date(project.possession_date);
                  const diffMs = poss.getTime() - now.getTime();
                  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
                  const months = Math.floor(Math.abs(diffDays) / 30);
                  const isPast = diffDays <= 0;
                  const urgency = !isPast && diffDays <= 180;
                  return (
                    <div className="rounded-2xl overflow-hidden"
                      style={{ background: isPast ? "linear-gradient(135deg,#1a7f4a,#0a4d2a)" : urgency ? "linear-gradient(135deg,#c25000,#7c2d00)" : "linear-gradient(135deg,#0071e3,#0a3d6b)", boxShadow:"0 4px 20px rgba(0,0,0,0.12)" }}>
                      <div className="p-5 flex items-center justify-between gap-4 flex-wrap">
                        <div>
                          <div style={{ fontSize:"0.6875rem", fontWeight:700, color:"rgba(255,255,255,0.6)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:4 }}>
                            {isPast ? "Possession Ready" : "Possession Countdown"}
                          </div>
                          <div style={{ fontSize:"1.75rem", fontWeight:800, color:"#fff", letterSpacing:"-0.03em", lineHeight:1 }}>
                            {isPast ? "Ready to Move" : months > 0 ? `${months} months` : `${diffDays} days`}
                          </div>
                          <div style={{ fontSize:"0.8125rem", color:"rgba(255,255,255,0.65)", marginTop:4 }}>
                            {isPast ? `Possession was ${poss.toLocaleDateString("en-IN",{month:"long",year:"numeric"})}` : `Target: ${poss.toLocaleDateString("en-IN",{month:"long",year:"numeric"})}`}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {!isPast && (
                            <>
                              <div className="w-32 h-2 rounded-full" style={{ background:"rgba(255,255,255,0.2)" }}>
                                <div className="h-full rounded-full" style={{ width:`${Math.min(100, Math.max(5, (project.construction_percentage ?? 70)))}%`, background:"rgba(255,255,255,0.85)" }}/>
                              </div>
                              <div style={{ fontSize:"0.75rem", color:"rgba(255,255,255,0.6)" }}>
                                {project.construction_percentage ?? 70}% complete
                              </div>
                            </>
                          )}
                          {isPast && (
                            <span className="px-3 py-1.5 rounded-xl text-xs font-bold" style={{ background:"rgba(255,255,255,0.2)", color:"#fff" }}>
                              ✓ OC Received
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Quick specs */}
                <div className="apple-card p-5">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
                    {[
                      { label:"Configuration", value: (() => {
                          const ts = Array.from(new Set(allFlats.map(f=>f.flat_type))).sort();
                          return ts.length === 0 ? "—" : ts.length === 1 ? ts[0].toUpperCase() : `${ts[0].toUpperCase()} – ${ts[ts.length-1].toUpperCase()}`;
                        })() },
                      { label:"Price",        value:"On Request" },
                      { label:"Carpet Area",  value: (() => {
                          if (allFlats.length===0) return "—";
                          const mn=Math.min(...allFlats.map(f=>f.carpet_area_sqft));
                          const mx=Math.max(...allFlats.map(f=>f.carpet_area_sqft));
                          return `${mn.toLocaleString()} – ${mx.toLocaleString()} sq.ft`;
                        })() },
                      { label:"Possession",  value: project.possession_date
                          ? new Date(project.possession_date).toLocaleDateString("en-IN",{month:"short",year:"numeric"})
                          : "TBA" },
                    ].map(spec => (
                      <div key={spec.label} className="flex flex-col gap-1">
                        <span style={{ fontSize:"0.7rem", fontWeight:600, color:"rgba(0,0,0,0.4)", textTransform:"uppercase", letterSpacing:"0.06em" }}>{spec.label}</span>
                        <span style={{ fontSize:"0.9375rem", fontWeight:600, color:"#1d1d1f" }}>{spec.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* About */}
                <div className="apple-card p-5">
                  <h2 className="text-tile mb-3" style={{ color:"#1d1d1f" }}>About {project.name}</h2>
                  <p className="text-body" style={{ color:"rgba(0,0,0,0.64)", lineHeight:1.7 }}>
                    {project.description ?? "Premium residential development."}
                  </p>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label:"Total Flats", value:stats.total },
                    { label:"Available",   value:stats.available, accent:true },
                    { label:"Towers",      value:project.total_towers ?? project.towers.length },
                    { label:"Max Floors",  value:project.total_floors ?? "—" },
                  ].map(s => (
                    <div key={s.label} className="apple-card p-4 text-center">
                      <div style={{ fontSize:"1.75rem", fontWeight:700, letterSpacing:"-0.02em", color:s.accent?"#0071e3":"#1d1d1f" }}>{s.value}</div>
                      <div className="text-caption mt-0.5" style={{ color:"rgba(0,0,0,0.48)" }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Why invest */}
                <div className="apple-card p-5">
                  <h2 className="text-tile mb-4" style={{ color:"#1d1d1f" }}>Why Invest</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { icon:"📍", title:"Prime Location", desc:`${project.location} — well-connected to tech corridors, schools, hospitals, and expressways.` },
                      { icon:"📈", title:"Strong Appreciation", desc:"This micro-market has seen 12–18% annual price appreciation over the past 5 years." },
                      { icon:"🏆", title:"Trusted Developer", desc:"38+ years of delivering landmark residential projects on time, across India." },
                      { icon:"🔑", title:"On-Track Delivery", desc: project.possession_date
                          ? `Superstructure complete. On track for ${new Date(project.possession_date).toLocaleDateString("en-IN",{month:"long",year:"numeric"})} possession.`
                          : "Project on schedule. Milestone-linked RERA compliance." },
                    ].map(item => (
                      <div key={item.title} className="flex gap-3 p-4 rounded-standard" style={{ background:"#f5f5f7" }}>
                        <span className="text-2xl shrink-0">{item.icon}</span>
                        <div>
                          <div style={{ fontWeight:600, fontSize:"0.875rem", color:"#1d1d1f" }}>{item.title}</div>
                          <div style={{ fontSize:"0.8125rem", color:"rgba(0,0,0,0.52)", marginTop:3, lineHeight:1.5 }}>{item.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {project.construction_milestones.length > 0 && (
                  <ConstructionTracker milestones={project.construction_milestones}
                    overallPercentage={project.construction_percentage ?? 0}/>
                )}

                {/* Neighborhood quick facts */}
                <div className="apple-card p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Navigation className="w-4 h-4" style={{ color:"#0071e3" }}/>
                    <h2 className="text-tile" style={{ color:"#1d1d1f" }}>Neighborhood</h2>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { emoji:"🚇", label:"Metro Station", dist:"0.8 km", time:"10 min walk" },
                      { emoji:"🏥", label:"Hospital",      dist:"1.2 km", time:"5 min drive" },
                      { emoji:"🏫", label:"Top Schools",   dist:"0.5 km", time:"6 min walk" },
                      { emoji:"🛒", label:"Supermarket",   dist:"0.3 km", time:"4 min walk" },
                      { emoji:"✈️", label:"Airport",        dist:"18 km",  time:"30 min drive" },
                      { emoji:"🌳", label:"City Park",     dist:"0.6 km", time:"8 min walk" },
                    ].map(item => (
                      <div key={item.label} className="flex items-start gap-2.5 p-3 rounded-xl" style={{ background:"#f5f5f7" }}>
                        <span style={{ fontSize:"1.25rem", lineHeight:1 }}>{item.emoji}</span>
                        <div>
                          <div style={{ fontSize:"0.8125rem", fontWeight:600, color:"#1d1d1f" }}>{item.label}</div>
                          <div style={{ fontSize:"0.75rem", color:"rgba(0,0,0,0.45)", marginTop:1 }}>{item.dist} · {item.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p style={{ fontSize:"0.75rem", color:"rgba(0,0,0,0.3)", marginTop:12 }}>* Approximate distances. Verify before finalising.</p>
                </div>

                {project.amenities.length > 0 && (
                  <AmenitiesShowcase amenities={project.amenities}/>
                )}

                {/* Available flat list */}
                <div className="apple-card p-5">
                  <h2 className="text-tile mb-4" style={{ color:"#1d1d1f" }}>
                    Available Units
                    <span className="text-body ml-2" style={{ color:"rgba(0,0,0,0.42)", fontWeight:400 }}>
                      ({filteredFlats.filter(f=>f.status==="available").length})
                    </span>
                  </h2>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {filteredFlats.filter(f=>f.status==="available").slice(0,20).map(flat => (
                      <button key={flat.id} onClick={() => setSelectedFlat(flat)}
                        className="w-full flex items-center justify-between p-3.5 rounded-standard text-left"
                        style={{ background:"#f5f5f7", transition:"background 0.15s" }}
                        onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background="#ebebed"}
                        onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background="#f5f5f7"}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-standard flex items-center justify-center text-xs font-semibold"
                            style={{ background:"rgba(0,113,227,0.1)", color:"#0071e3" }}>{flat.floor}</div>
                          <div>
                            <div className="text-caption" style={{ fontWeight:600, color:"#1d1d1f" }}>
                              Flat {flat.flat_number} — {(FLAT_TYPE_LABELS[flat.flat_type] ?? flat.flat_type).toUpperCase()}
                            </div>
                            <div className="text-micro" style={{ color:"rgba(0,0,0,0.42)" }}>
                              {flat.carpet_area_sqft} sq.ft{flat.facing ? ` · ${flat.facing}` : ""}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-caption" style={{ fontWeight:600, color:"rgba(0,0,0,0.42)", fontStyle:"italic" }}>On Request</span>
                          <ChevronRight className="w-4 h-4" style={{ color:"rgba(0,0,0,0.32)" }}/>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}
        </main>

        {/* ── Desktop flat detail panel (right side) ── */}
        {selectedFlat && (
          <aside className="hidden lg:block shrink-0 overflow-y-auto"
            style={{ width:384, background:"#ffffff", borderLeft:"1px solid rgba(0,0,0,0.08)" }}>
            <FlatDetailPanel flat={selectedFlat} projectName={project.name} projectId={project.id}
              onClose={() => setSelectedFlat(null)}
              isInCompare={compareList.some(f=>f.id===selectedFlat.id)}
              onToggleCompare={() => toggleCompare(selectedFlat)}
              onOpenTour={() => setTourFlat(selectedFlat)}/>
          </aside>
        )}
      </div>

      {/* ── Mobile flat detail — full-screen bottom sheet ── */}
      {selectedFlat && (
        <div className="lg:hidden fixed inset-0 z-40" style={{ pointerEvents:"none" }}>
          {/* Backdrop */}
          <div className="absolute inset-0" style={{ background:"rgba(0,0,0,0.4)", pointerEvents:"auto" }}
            onClick={() => setSelectedFlat(null)}/>
          {/* Sheet */}
          <div className="absolute left-0 right-0 bottom-0 rounded-t-3xl overflow-hidden flex flex-col"
            style={{
              background:"#ffffff", pointerEvents:"auto",
              maxHeight:"93svh",
              animation:"slideUpSheet 0.32s cubic-bezier(0.34,1.2,0.64,1)",
              paddingBottom:"env(safe-area-inset-bottom, 0px)",
            }}
            onTouchStart={e => { sheetTouchY.current = e.touches[0].clientY; }}
            onTouchEnd={e => { if (e.changedTouches[0].clientY - sheetTouchY.current > 80) setSelectedFlat(null); }}>
            {/* Pull handle area — tap or swipe down to close */}
            <button
              onClick={() => setSelectedFlat(null)}
              className="shrink-0 flex flex-col items-center gap-1 pt-3 pb-2 w-full"
              style={{ background:"none", border:"none", cursor:"pointer" }}
              aria-label="Close flat details">
              <div className="w-10 h-1 rounded-full" style={{ background:"rgba(0,0,0,0.18)" }}/>
              <span style={{ fontSize:"0.65rem", color:"rgba(0,0,0,0.28)", letterSpacing:"0.04em" }}>swipe down to close</span>
            </button>
            <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth:"none" }}>
              <FlatDetailPanel flat={selectedFlat} projectName={project.name} projectId={project.id}
                onClose={() => setSelectedFlat(null)}
                isInCompare={compareList.some(f=>f.id===selectedFlat.id)}
                onToggleCompare={() => toggleCompare(selectedFlat)}
                onOpenTour={() => setTourFlat(selectedFlat)}/>
            </div>
          </div>
        </div>
      )}

      {/* Compare bar */}
      {compareList.length > 0 && (
        <CompareBar flats={compareList}
          onRemove={id => setCompareList(prev=>prev.filter(f=>f.id!==id))}
          onCompare={() => setShowCompareModal(true)}
          onClear={() => setCompareList([])}/>
      )}

      {showCompareModal && (
        <CompareModal flats={compareList} projectName={project.name}
          onClose={() => setShowCompareModal(false)}/>
      )}

      {tourFlat && (
        <VirtualTourModal flat={tourFlat} onClose={() => setTourFlat(null)}/>
      )}

      {/* Floating WhatsApp FAB — mobile only, left side, hidden when flat detail sheet is open */}
      {!selectedFlat && (
        <a
          href={`https://wa.me/?text=${encodeURIComponent(`Hi, I'm interested in ${project.name} at ${project.location}. Please share availability and pricing.`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="md:hidden fixed left-4 z-30 flex items-center gap-2.5 px-4 rounded-full"
          style={{
            bottom: "calc(16px + env(safe-area-inset-bottom, 0px))",
            height: 48,
            background: "linear-gradient(135deg,#25d366 0%,#128c4a 100%)",
            boxShadow: "0 4px 20px rgba(37,211,102,0.45), 0 2px 8px rgba(0,0,0,0.2)",
          }}
          aria-label="Chat on WhatsApp">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: "0.875rem", letterSpacing: "-0.01em" }}>WhatsApp</span>
        </a>
      )}

      <UrgencyToast available={stats.available} reserved={stats.reserved}
        sold={stats.sold} total={stats.total}/>
      <ChatWidget projectId={project.id} projectName={project.name}/>
    </div>
  );
}
