"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import type { Project, Flat, Tower } from "@/lib/types";
import { getProjectStats } from "@/lib/types";
import FloorPlan from "@/components/tower/FloorPlan";
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
import { MapPin, Building2, SlidersHorizontal, Layers, Box, BarChart2, X, Shield, ChevronRight, ChevronLeft, Sparkles, Calendar, IndianRupee, Maximize2 } from "lucide-react";

const ModelViewer = dynamic(() => import("@/components/tower/ModelViewer"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center" style={{ background: "#020917" }}>
      <div className="flex flex-col items-center gap-3" style={{ color: "rgba(255,255,255,0.4)" }}>
        <div
          className="w-10 h-10 rounded-full border-2 animate-spin"
          style={{ borderColor: "rgba(28,199,127,0.2)", borderTopColor: "#1cc77f" }}
        />
        <span className="text-caption">Loading 3D model...</span>
      </div>
    </div>
  ),
});

type ViewMode = "3d" | "floor" | "overview";

interface Props {
  project: Project;
}

export default function ProjectExplorer({ project }: Props) {
  const [view, setView] = useState<ViewMode>("3d");
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);
  const [selectedFlat, setSelectedFlat] = useState<Flat | null>(null);
  const [selectedTowerIdx, setSelectedTowerIdx] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [compareList, setCompareList] = useState<Flat[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [tourFlat, setTourFlat] = useState<Flat | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    flatType: [],
    status: [],
    minFloor: 1,
    maxFloor: project.total_floors ?? 30,
    minPrice: 0,
    maxPrice: project.price_max ?? 60000000,
    facing: [],
  });

  const stats = getProjectStats(project);
  const activeTower: Tower | undefined = project.towers[selectedTowerIdx];
  const allFlats = project.towers.flatMap((t) => t.flats);
  const filteredFlats = useMemo(() => applyFilters(allFlats, filters), [allFlats, filters]);
  const filterCount = filters.flatType.length + filters.status.length + filters.facing.length;

  const [floorToast, setFloorToast] = useState<number | null>(null);

  const handleFloorSelect = (floor: number) => {
    setSelectedFloor(floor);
    setView("floor");
    setFloorToast(floor);
    setTimeout(() => setFloorToast(null), 2200);
  };

  const toggleCompare = (flat: Flat) => {
    setCompareList((prev) => {
      if (prev.find((f) => f.id === flat.id)) return prev.filter((f) => f.id !== flat.id);
      if (prev.length >= 3) return prev;
      return [...prev, flat];
    });
  };

  return (
    <div className="pt-[48px] h-screen flex flex-col overflow-hidden" style={{ background: "#f5f5f7" }}>

      {/* ── Top bar ───────────────────────────────────────────── */}
      <div
        className="shrink-0 flex items-center gap-4 px-5 py-2"
        style={{ background: "#ffffff", borderBottom: "1px solid rgba(0,0,0,0.08)", height: 52 }}
      >
        {/* Back */}
        <a
          href="/projects"
          className="shrink-0 flex items-center gap-1 text-micro transition-colors"
          style={{ color: "rgba(0,0,0,0.42)" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#0071e3")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "rgba(0,0,0,0.42)")}
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Projects</span>
        </a>

        <div style={{ width: 1, height: 18, background: "rgba(0,0,0,0.1)", flexShrink: 0 }} />

        {/* Project info */}
        <div className="flex items-center gap-2.5 min-w-0">
          <Building2 className="w-4 h-4 shrink-0" style={{ color: "#0071e3" }} />
          <div className="min-w-0">
            <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "#1d1d1f", letterSpacing: "-0.01em" }} className="truncate">
              {project.name}
            </div>
            <div className="flex items-center gap-1 truncate" style={{ fontSize: "0.75rem", color: "rgba(0,0,0,0.42)" }}>
              <MapPin className="w-2.5 h-2.5" />
              {project.location}
            </div>
          </div>
        </div>

        {/* Availability pills */}
        <div className="hidden lg:flex items-center gap-1.5 ml-2">
          {[
            { label: `${stats.available} Available`, color: "#1a7f4a", bg: "rgba(52,199,89,0.1)", border: "rgba(52,199,89,0.25)" },
            { label: `${stats.sold} Sold`, color: "#d70015", bg: "rgba(255,59,48,0.1)", border: "rgba(255,59,48,0.25)" },
            { label: `${stats.reserved} Reserved`, color: "#c25000", bg: "rgba(255,149,0,0.1)", border: "rgba(255,149,0,0.25)" },
          ].map((s) => (
            <span
              key={s.label}
              className="text-micro px-2 py-0.5 rounded-pill"
              style={{ color: s.color, background: s.bg, border: `1px solid ${s.border}` }}
            >
              {s.label}
            </span>
          ))}
        </div>

        {/* RERA */}
        {project.rera_number && (
          <div className="hidden md:flex items-center gap-1 ml-auto mr-2 text-micro" style={{ color: "rgba(0,0,0,0.4)" }}>
            <Shield className="w-3 h-3" style={{ color: "#34c759" }} />
            {project.rera_number}
          </div>
        )}

        {/* Share */}
        <div className="hidden sm:block shrink-0">
          <ShareButton title={project.name} text={`Explore ${project.name} in 3D on FlatBytes`} />
        </div>

        {/* View switcher */}
        <div
          className="flex items-center gap-0.5 rounded-comfortable p-0.5 shrink-0 ml-auto"
          style={{ background: "#f5f5f7" }}
        >
          {([
            { id: "3d", icon: <Box className="w-3.5 h-3.5" />, label: "3D" },
            { id: "floor", icon: <Layers className="w-3.5 h-3.5" />, label: "Floor" },
            { id: "overview", icon: <BarChart2 className="w-3.5 h-3.5" />, label: "Info" },
          ] as const).map((v) => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-standard text-micro font-normal transition-all"
              style={
                view === v.id
                  ? { background: "#ffffff", color: "#1d1d1f", boxShadow: "rgba(0,0,0,0.12) 0px 1px 4px 0px" }
                  : { background: "transparent", color: "rgba(0,0,0,0.48)" }
              }
            >
              {v.icon}
              <span className="hidden sm:inline">{v.label}</span>
            </button>
          ))}
        </div>

        {/* Filter toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-standard text-micro transition-all shrink-0"
          style={
            filterCount > 0
              ? { background: "#0071e3", color: "#fff" }
              : { background: "#f5f5f7", color: "rgba(0,0,0,0.64)" }
          }
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Filters</span>
          {filterCount > 0 && (
            <span
              className="w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-semibold"
              style={{ background: "rgba(255,255,255,0.25)" }}
            >
              {filterCount}
            </span>
          )}
        </button>
      </div>

      {/* ── Main area ─────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* Filters sidebar */}
        {showFilters && (
          <aside
            className="shrink-0 w-72 overflow-y-auto"
            style={{ background: "#ffffff", borderRight: "1px solid rgba(0,0,0,0.08)" }}
          >
            <div className="p-4">
              <FlatFilters
                filters={filters}
                onChange={setFilters}
                totalFloors={project.total_floors ?? 30}
                maxPrice={project.price_max ?? 60000000}
                onClose={() => setShowFilters(false)}
              />
            </div>
          </aside>
        )}

        {/* Explorer */}
        <main className="flex-1 relative overflow-hidden">

          {/* Floor-selected toast */}
          {floorToast !== null && (
            <div
              className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-2 rounded-large text-micro font-medium pointer-events-none"
              style={{
                background: "#1d1d1f",
                color: "#ffffff",
                boxShadow: "rgba(0,0,0,0.3) 0px 8px 24px 0px",
                animation: "fadeSlideDown 0.2s ease",
              }}
            >
              <Sparkles className="w-3.5 h-3.5" style={{ color: "#0071e3" }} />
              Floor {floorToast} — viewing flat layout
            </div>
          )}
          {/* Tower selector */}
          {project.towers.length > 1 && view === "floor" && (
            <div
              className="absolute top-3 right-3 z-20 flex items-center gap-1 rounded-comfortable p-1"
              style={{ background: "rgba(255,255,255,0.9)", boxShadow: "var(--shadow-sm)", backdropFilter: "blur(10px)" }}
            >
              {project.towers.map((t, i) => (
                <button
                  key={t.id}
                  onClick={() => { setSelectedTowerIdx(i); setSelectedFlat(null); }}
                  className="px-3 py-1.5 rounded-standard text-micro transition-all"
                  style={
                    i === selectedTowerIdx
                      ? { background: "#0071e3", color: "#fff" }
                      : { background: "transparent", color: "rgba(0,0,0,0.56)" }
                  }
                >
                  {t.name}
                </button>
              ))}
            </div>
          )}

          {/* 3D view */}
          {view === "3d" && (
            <div className="w-full h-full relative" style={{ background: "#020917" }} role="region" aria-label="Interactive 3D building model">
              <ModelViewer
                modelPath={project.model_3d_url ?? undefined}
                buildingType={project.project_type === "commercial" ? "commercial" : "residential"}
                isUnderConstruction={
                  project.status === "active" || (project.construction_percentage ?? 100) < 100
                }
                totalFloors={activeTower?.total_floors ?? project.total_floors ?? 20}
                onFloorClick={handleFloorSelect}
              />
              {/* Floor plan CTA */}
              <button
                onClick={() => setView("floor")}
                className="absolute top-3 left-3 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-standard text-micro font-medium transition-all"
                style={{
                  background: "rgba(0,0,0,0.55)",
                  color: "rgba(255,255,255,0.85)",
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(255,255,255,0.12)",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(28,199,127,0.25)"; (e.currentTarget as HTMLElement).style.color = "#1cc77f"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.55)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.85)"; }}
              >
                <Layers className="w-3.5 h-3.5" />
                Explore Floor Plans
              </button>
              {/* Powered by watermark */}
              <div className="absolute bottom-10 right-3 z-10 pointer-events-none"
                style={{ opacity: 0.35 }}>
                <span style={{ fontSize: "0.65rem", fontWeight: 600, color: "#fff", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  Powered by FlatBytes
                </span>
              </div>
            </div>
          )}

          {/* Floor plan */}
          {view === "floor" && (
            <div className="w-full h-full overflow-auto p-6 pb-24 lg:pb-6" style={{ background: "#f5f5f7" }}>
              {activeTower ? (
                <FloorPlan
                  flats={applyFilters(activeTower.flats, filters)}
                  floor={selectedFloor ?? 1}
                  totalFloors={activeTower.total_floors}
                  onFlatSelect={setSelectedFlat}
                  onFloorChange={setSelectedFloor}
                  selectedFlatId={selectedFlat?.id}
                />
              ) : (
                <div className="flex items-center justify-center h-full" style={{ color: "rgba(0,0,0,0.32)" }}>
                  <div className="text-center">
                    <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="text-caption">No tower data available</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Overview */}
          {view === "overview" && (
            <div className="w-full h-full overflow-auto" style={{ background: "#f5f5f7" }}>
              {/* Cover hero */}
              {project.cover_image_url && (
                <div className="relative w-full" style={{ height: 260 }}>
                  <Image
                    src={project.cover_image_url}
                    alt={project.name}
                    fill
                    className="object-cover"
                    sizes="100vw"
                    priority
                  />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.18) 55%, transparent 100%)" }} />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1.15 }}>{project.name}</h1>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <MapPin className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.7)" }} />
                      <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.875rem" }}>{project.location}</span>
                      {project.rera_number && (
                        <>
                          <span style={{ color: "rgba(255,255,255,0.35)" }}>·</span>
                          <Shield className="w-3 h-3" style={{ color: "#34c759" }} />
                          <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.8125rem" }}>RERA {project.rera_number}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="p-6 pb-24 lg:pb-8 max-w-4xl mx-auto space-y-5">

                {/* Quick specs */}
                <div className="apple-card p-5">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
                    {[
                      {
                        icon: <Building2 className="w-4 h-4" style={{ color: "#0071e3" }} />,
                        label: "Configuration",
                        value: (() => {
                          const types = Array.from(new Set(allFlats.map(f => f.flat_type))).sort();
                          if (types.length === 0) return "—";
                          if (types.length === 1) return types[0].toUpperCase();
                          return `${types[0].toUpperCase()} – ${types[types.length - 1].toUpperCase()}`;
                        })(),
                      },
                      {
                        icon: <IndianRupee className="w-4 h-4" style={{ color: "#0071e3" }} />,
                        label: "Price",
                        value: project.price_starting
                          ? `₹${(project.price_starting / 100000).toFixed(0)}L – ₹${(project.price_max! / 10000000).toFixed(1)}Cr`
                          : "On request",
                      },
                      {
                        icon: <Maximize2 className="w-4 h-4" style={{ color: "#0071e3" }} />,
                        label: "Carpet Area",
                        value: (() => {
                          if (allFlats.length === 0) return "—";
                          const min = Math.min(...allFlats.map(f => f.carpet_area_sqft));
                          const max = Math.max(...allFlats.map(f => f.carpet_area_sqft));
                          return `${min.toLocaleString()} – ${max.toLocaleString()} sq.ft`;
                        })(),
                      },
                      {
                        icon: <Calendar className="w-4 h-4" style={{ color: "#0071e3" }} />,
                        label: "Possession",
                        value: project.possession_date
                          ? new Date(project.possession_date).toLocaleDateString("en-IN", { month: "short", year: "numeric" })
                          : "TBA",
                      },
                    ].map((spec) => (
                      <div key={spec.label} className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5">
                          {spec.icon}
                          <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "rgba(0,0,0,0.4)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{spec.label}</span>
                        </div>
                        <div style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#1d1d1f" }}>{spec.value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* About */}
                <div className="apple-card p-6">
                  <h2 className="text-tile mb-3" style={{ color: "#1d1d1f" }}>About {project.name}</h2>
                  <p className="text-body" style={{ color: "rgba(0,0,0,0.64)", lineHeight: 1.7 }}>{project.description ?? "Premium residential development."}</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Total Flats", value: stats.total },
                    { label: "Available", value: stats.available, accent: true },
                    { label: "Towers", value: project.total_towers ?? project.towers.length },
                    { label: "Max Floors", value: project.total_floors ?? "—" },
                  ].map((s) => (
                    <div key={s.label} className="apple-card p-4 text-center">
                      <div style={{ fontSize: "1.75rem", fontWeight: 700, color: s.accent ? "#0071e3" : "#1d1d1f", letterSpacing: "-0.02em" }}>
                        {s.value}
                      </div>
                      <div className="text-caption mt-0.5" style={{ color: "rgba(0,0,0,0.48)" }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Why Invest */}
                <div className="apple-card p-6">
                  <h2 className="text-tile mb-4" style={{ color: "#1d1d1f" }}>Why Invest</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { icon: "📍", title: "Prime Location", desc: `${project.location} — well-connected to tech corridors, schools, hospitals, and expressways.` },
                      { icon: "📈", title: "Strong Appreciation", desc: "This micro-market has seen 12–18% annual price appreciation over the past 5 years." },
                      { icon: "🏆", title: "Trusted Developer", desc: "38+ years of delivering landmark residential projects on time, across India." },
                      { icon: "🔑", title: "On-Track Delivery", desc: project.possession_date ? `Superstructure complete. On track for ${new Date(project.possession_date).toLocaleDateString("en-IN", { month: "long", year: "numeric" })} possession.` : "Project on schedule. Milestone-linked RERA compliance." },
                    ].map((item) => (
                      <div key={item.title} className="flex gap-3 p-4 rounded-standard" style={{ background: "#f5f5f7" }}>
                        <span className="text-2xl shrink-0">{item.icon}</span>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "#1d1d1f" }}>{item.title}</div>
                          <div style={{ fontSize: "0.8125rem", color: "rgba(0,0,0,0.52)", marginTop: 3, lineHeight: 1.5 }}>{item.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Construction tracker */}
                {project.construction_milestones.length > 0 && (
                  <ConstructionTracker
                    milestones={project.construction_milestones}
                    overallPercentage={project.construction_percentage ?? 0}
                  />
                )}

                {/* Amenities */}
                {project.amenities.length > 0 && (
                  <AmenitiesShowcase amenities={project.amenities} />
                )}

                {/* Available flat list */}
                <div className="apple-card p-6">
                  <h2 className="text-tile mb-4" style={{ color: "#1d1d1f" }}>
                    Available Flats
                    <span className="text-body ml-2" style={{ color: "rgba(0,0,0,0.42)", fontWeight: 400 }}>
                      ({filteredFlats.filter((f) => f.status === "available").length})
                    </span>
                  </h2>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {filteredFlats
                      .filter((f) => f.status === "available")
                      .slice(0, 20)
                      .map((flat) => (
                        <button
                          key={flat.id}
                          onClick={() => setSelectedFlat(flat)}
                          className="w-full flex items-center justify-between p-3.5 rounded-standard text-left group"
                          style={{ background: "#f5f5f7", transition: "background 0.15s" }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#ebebed")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "#f5f5f7")}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-standard flex items-center justify-center text-xs font-semibold" style={{ background: "rgba(0,113,227,0.1)", color: "#0071e3" }}>
                              {flat.floor}
                            </div>
                            <div>
                              <div className="text-caption" style={{ fontWeight: 600, color: "#1d1d1f" }}>
                                Flat {flat.flat_number} — {flat.flat_type.toUpperCase()}
                              </div>
                              <div className="text-micro" style={{ color: "rgba(0,0,0,0.42)" }}>
                                {flat.carpet_area_sqft} sq.ft{flat.facing ? ` · ${flat.facing}` : ""}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <div className="text-caption" style={{ fontWeight: 600, color: "#1d1d1f" }}>
                                ₹{(flat.total_price / 100000).toFixed(0)}L
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4" style={{ color: "rgba(0,0,0,0.32)" }} />
                          </div>
                        </button>
                      ))}
                  </div>
                </div>

              </div>
            </div>
          )}
        </main>

        {/* Flat detail panel */}
        {selectedFlat && (
          <aside
            className="shrink-0 w-80 lg:w-96 overflow-y-auto"
            style={{ background: "#ffffff", borderLeft: "1px solid rgba(0,0,0,0.08)" }}
          >
            <FlatDetailPanel
              flat={selectedFlat}
              projectName={project.name}
              projectId={project.id}
              onClose={() => setSelectedFlat(null)}
              isInCompare={compareList.some((f) => f.id === selectedFlat.id)}
              onToggleCompare={() => toggleCompare(selectedFlat)}
              onOpenTour={() => setTourFlat(selectedFlat)}
            />
          </aside>
        )}
      </div>

      {/* Mobile bottom flat bar */}
      {selectedFlat && (
        <div
          className="lg:hidden shrink-0 flex items-center gap-3 px-4 py-3"
          style={{ background: "#ffffff", borderTop: "1px solid rgba(0,0,0,0.08)" }}
        >
          <div className="flex-1 min-w-0">
            <div className="text-caption" style={{ fontWeight: 600, color: "#1d1d1f" }}>
              Flat {selectedFlat.flat_number}
            </div>
            <div className="text-micro" style={{ color: "rgba(0,0,0,0.48)" }}>
              ₹{(selectedFlat.total_price / 100000).toFixed(0)}L · {selectedFlat.flat_type.toUpperCase()}
            </div>
          </div>
          <StatusBadge status={selectedFlat.status} size="sm" />
          <button
            onClick={() => setSelectedFlat(null)}
            className="p-1.5 rounded-standard"
            style={{ background: "#f5f5f7", color: "rgba(0,0,0,0.48)" }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Compare bar */}
      {compareList.length > 0 && (
        <CompareBar
          flats={compareList}
          onRemove={(id) => setCompareList((prev) => prev.filter((f) => f.id !== id))}
          onCompare={() => setShowCompareModal(true)}
          onClear={() => setCompareList([])}
        />
      )}

      {/* Compare modal */}
      {showCompareModal && (
        <CompareModal
          flats={compareList}
          projectName={project.name}
          onClose={() => setShowCompareModal(false)}
        />
      )}

      {/* Virtual tour modal */}
      {tourFlat && (
        <VirtualTourModal flat={tourFlat} onClose={() => setTourFlat(null)} />
      )}

      {/* Buyer engagement */}
      <UrgencyToast
        available={stats.available}
        reserved={stats.reserved}
        sold={stats.sold}
        total={stats.total}
      />
      <ChatWidget projectId={project.id} projectName={project.name} />
    </div>
  );
}
