"use client";

import { useState, useMemo } from "react";
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
  CheckCircle2,
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

type ViewMode = "3d" | "floor" | "overview";

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
  const [view, setView]                     = useState<ViewMode>("3d");
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

  const stats        = getProjectStats(project);
  const activeTower: Tower | undefined = project.towers[selectedTowerIdx];
  const allFlats     = project.towers.flatMap((t) => t.flats);
  const filteredFlats = useMemo(() => applyFilters(allFlats, filters), [allFlats, filters]);
  const filterCount  = filters.flatType.length + filters.status.length + filters.facing.length;

  const currentFloor = selectedFloor ?? (activeTower?.total_floors ?? 1);
  const floorFlats   = useMemo(
    () => applyFilters(activeTower?.flats ?? [], filters).filter((f) => f.floor === currentFloor),
    [activeTower, filters, currentFloor],
  );
  const totalFloors  = activeTower?.total_floors ?? project.total_floors ?? 24;

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
            <div className="font-semibold truncate" style={{ fontSize:"0.875rem", color:"#1d1d1f", letterSpacing:"-0.01em", maxWidth:"min(220px,38vw)" }}>
              {project.name}
            </div>
            <div className="flex items-center gap-1 truncate" style={{ fontSize:"0.7rem", color:"rgba(0,0,0,0.42)", maxWidth:"min(220px,38vw)" }}>
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
            { id:"3d",       icon:<Box className="w-3.5 h-3.5"/>,     label:"3D" },
            { id:"floor",    icon:<Layers className="w-3.5 h-3.5"/>,  label:"Floor" },
            { id:"overview", icon:<BarChart2 className="w-3.5 h-3.5"/>, label:"Info" },
          ] as const).map(v => (
            <button key={v.id} onClick={() => setView(v.id)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-standard text-micro font-normal transition-all"
              style={view===v.id
                ? { background:"#ffffff", color:"#1d1d1f", boxShadow:"rgba(0,0,0,0.12) 0px 1px 4px 0px" }
                : { background:"transparent", color:"rgba(0,0,0,0.48)" }}>
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

        {/* Filter sidebar */}
        {showFilters && (
          <aside className="shrink-0 w-72 overflow-y-auto"
            style={{ background:"#ffffff", borderRight:"1px solid rgba(0,0,0,0.08)" }}>
            <div className="p-4">
              <FlatFilters filters={filters} onChange={setFilters}
                totalFloors={project.total_floors ?? 30}
                maxPrice={project.price_max ?? 60000000}
                onClose={() => setShowFilters(false)}/>
            </div>
          </aside>
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
                    {/* Availability chips */}
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      <span className="px-2.5 py-1 rounded-pill text-xs font-semibold"
                        style={{ background:"rgba(52,199,89,0.2)", color:"#4ade80", border:"1px solid rgba(52,199,89,0.3)" }}>
                        {stats.available} Available
                      </span>
                      {stats.sold > 0 && (
                        <span className="px-2.5 py-1 rounded-pill text-xs font-semibold"
                          style={{ background:"rgba(255,59,48,0.15)", color:"#ff6b6b", border:"1px solid rgba(255,59,48,0.25)" }}>
                          {stats.sold} Sold
                        </span>
                      )}
                      {stats.reserved > 0 && (
                        <span className="px-2.5 py-1 rounded-pill text-xs font-semibold"
                          style={{ background:"rgba(255,149,0,0.15)", color:"#ffa94d", border:"1px solid rgba(255,149,0,0.25)" }}>
                          {stats.reserved} Reserved
                        </span>
                      )}
                      {project.possession_date && (
                        <span className="px-2.5 py-1 rounded-pill text-xs font-medium"
                          style={{ background:"rgba(255,255,255,0.08)", color:"rgba(255,255,255,0.6)", border:"1px solid rgba(255,255,255,0.12)" }}>
                          <Calendar className="w-3 h-3 inline mr-1"/>
                          Possession {new Date(project.possession_date).toLocaleDateString("en-IN", { month:"short", year:"numeric" })}
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
          {view === "floor" && (
            <div className="w-full h-full flex overflow-hidden" style={{ background:"#f5f5f7" }}>

              {/* ── Left: Floor selector sidebar ── */}
              <div className="shrink-0 flex flex-col overflow-hidden"
                style={{ width:"clamp(56px,6vw,72px)", background:"#ffffff", borderRight:"1px solid rgba(0,0,0,0.08)" }}>
                <div className="py-3 px-1 text-center shrink-0" style={{ fontSize:"0.6rem", fontWeight:700, color:"rgba(0,0,0,0.35)", textTransform:"uppercase", letterSpacing:"0.06em", borderBottom:"1px solid rgba(0,0,0,0.06)" }}>
                  Floor
                </div>
                <div className="flex-1 overflow-y-auto py-2" style={{ scrollbarWidth:"none" }}>
                  {Array.from({ length: totalFloors }, (_, i) => totalFloors - i).map(f => {
                    const active = f === currentFloor;
                    const hasFlats = (activeTower?.flats ?? []).some(fl => fl.floor === f);
                    return (
                      <button key={f} onClick={() => { setSelectedFloor(f); setSelectedFlat(null); }}
                        className="w-full flex items-center justify-center transition-all"
                        style={{
                          height: 36,
                          fontWeight: active ? 700 : 400,
                          fontSize: "0.8125rem",
                          color: active ? "#fff" : hasFlats ? "#1d1d1f" : "rgba(0,0,0,0.25)",
                          background: active ? "#0071e3" : "transparent",
                          cursor: hasFlats ? "pointer" : "default",
                        }}>
                        {f}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── Right: Flat grid ── */}
              <div className="flex-1 flex flex-col overflow-hidden">

                {/* Floor header bar */}
                <div className="shrink-0 flex items-center gap-3 px-5 py-3 flex-wrap"
                  style={{ background:"#ffffff", borderBottom:"1px solid rgba(0,0,0,0.08)", minHeight:48 }}>
                  <span style={{ fontSize:"0.9375rem", fontWeight:700, color:"#1d1d1f" }}>Floor {currentFloor}</span>
                  <div style={{ width:1, height:14, background:"rgba(0,0,0,0.1)" }}/>
                  {floorFlats.length === 0
                    ? <span style={{ fontSize:"0.8125rem", color:"rgba(0,0,0,0.4)" }}>No units on this floor</span>
                    : <>
                        {floorAvail > 0 && <span style={{ fontSize:"0.8125rem", color:"#1a7f4a", fontWeight:600 }}>{floorAvail} Available</span>}
                        {floorSold  > 0 && <span style={{ fontSize:"0.8125rem", color:"#d70015", fontWeight:600 }}>{floorSold} Sold</span>}
                        {floorRes   > 0 && <span style={{ fontSize:"0.8125rem", color:"#c25000", fontWeight:600 }}>{floorRes} Reserved</span>}
                        <div style={{ width:1, height:14, background:"rgba(0,0,0,0.1)" }}/>
                        <span style={{ fontSize:"0.8125rem", color:"rgba(0,0,0,0.42)", fontStyle:"italic" }}>Price on request</span>
                      </>
                  }
                  {/* Tower selector */}
                  {project.towers.length > 1 && (
                    <div className="ml-auto flex items-center gap-1 rounded-comfortable p-0.5"
                      style={{ background:"#f5f5f7" }}>
                      {project.towers.map((t, i) => (
                        <button key={t.id} onClick={() => { setSelectedTowerIdx(i); setSelectedFlat(null); }}
                          className="px-3 py-1 rounded-standard text-micro transition-all"
                          style={i === selectedTowerIdx
                            ? { background:"#0071e3", color:"#fff" }
                            : { background:"transparent", color:"rgba(0,0,0,0.56)" }}>
                          {t.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Status legend */}
                <div className="shrink-0 flex items-center gap-3 px-5 py-2.5 overflow-x-auto"
                  style={{ background:"#fafafa", borderBottom:"1px solid rgba(0,0,0,0.06)", scrollbarWidth:"none" }}>
                  {(["available","sold","reserved","discussion"] as const).map(s => (
                    <StatusBadge key={s} status={s} size="sm"/>
                  ))}
                </div>

                {/* Flat grid */}
                <div className="flex-1 overflow-auto p-5 pb-24 lg:pb-6">
                  {floorFlats.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-4" style={{ color:"rgba(0,0,0,0.28)" }}>
                      <Building2 className="w-12 h-12 opacity-20"/>
                      <div className="text-center">
                        <p style={{ fontSize:"0.9375rem", fontWeight:600, color:"rgba(0,0,0,0.36)" }}>No units on Floor {currentFloor}</p>
                        <p style={{ fontSize:"0.8125rem", color:"rgba(0,0,0,0.28)", marginTop:4 }}>Select another floor from the left</p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid gap-3"
                      style={{ gridTemplateColumns:"repeat(auto-fill, minmax(160px, 1fr))", maxWidth:900 }}>
                      {floorFlats.map(flat => {
                        const s = STATUS_STYLE[flat.status] ?? STATUS_STYLE.available;
                        const active = flat.id === selectedFlat?.id;
                        return (
                          <button key={flat.id} onClick={() => setSelectedFlat(flat)}
                            className="relative text-left rounded-xl p-4 transition-all hover:scale-[1.02]"
                            style={{
                              background: active ? s.bg.replace("0.08","0.18") : s.bg,
                              border: `1.5px solid ${active ? s.border.replace("0.3","0.7") : s.border}`,
                              boxShadow: active ? `0 0 0 3px ${s.border}` : "none",
                            }}>
                            <div className="font-semibold mb-1.5" style={{ fontSize:"0.875rem", color:s.text }}>
                              {flat.flat_number}
                            </div>
                            <div style={{ fontSize:"0.8125rem", fontWeight:600, color:"#1d1d1f" }}>
                              {FLAT_TYPE_LABELS[flat.flat_type] ?? flat.flat_type.toUpperCase()}
                            </div>
                            <div style={{ fontSize:"0.75rem", color:"rgba(0,0,0,0.48)", marginTop:2 }}>
                              {flat.carpet_area_sqft} sq.ft
                            </div>
                            <div style={{ fontSize:"0.75rem", fontWeight:600, color:s.text, marginTop:4 }}>
                              On Request
                            </div>
                            {flat.facing && (
                              <span className="absolute bottom-3 right-3"
                                style={{ fontSize:"0.6875rem", color:s.text, opacity:0.7 }}>
                                {FACING_ARROW[flat.facing] ?? flat.facing[0]}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

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
              maxHeight:"92svh",
              animation:"slideUpSheet 0.32s cubic-bezier(0.34,1.2,0.64,1)",
            }}>
            {/* Pull handle */}
            <div className="shrink-0 flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ background:"rgba(0,0,0,0.15)" }}/>
            </div>
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

      <UrgencyToast available={stats.available} reserved={stats.reserved}
        sold={stats.sold} total={stats.total}/>
      <ChatWidget projectId={project.id} projectName={project.name}/>
    </div>
  );
}
