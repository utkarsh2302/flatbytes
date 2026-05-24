"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  SlidersHorizontal, X, MapPin, Building2, ArrowRight,
  ChevronDown, Phone,
} from "lucide-react";
import type { FlatType } from "@/lib/types";
import type { FlatWithProject } from "@/lib/data";
import { FLAT_TYPE_LABELS, STATUS_COLORS } from "@/lib/types";
import dynamic from "next/dynamic";
const UnifiedLeadForm = dynamic(() => import("@/components/buyer/UnifiedLeadForm"), { ssr: false });

const BHK_OPTS: { type: FlatType; emoji: string }[] = [
  { type: "studio",    emoji: "🏢" },
  { type: "1bhk",     emoji: "🛏"  },
  { type: "2bhk",     emoji: "🏠"  },
  { type: "3bhk",     emoji: "🏡"  },
  { type: "4bhk",     emoji: "🏘"  },
  { type: "penthouse", emoji: "👑" },
];

const BUDGET_OPTS = [
  { label: "Under ₹50L", max: 5_000_000  },
  { label: "₹50L–1Cr",   max: 10_000_000 },
  { label: "₹1Cr–2Cr",   max: 20_000_000 },
  { label: "₹2Cr+",      max: undefined  },
];

function formatPrice(p: number) {
  if (p >= 10_000_000) return `₹${(p / 10_000_000).toFixed(2)} Cr`;
  if (p >= 100_000)    return `₹${(p / 100_000).toFixed(1)}L`;
  return `₹${p.toLocaleString("en-IN")}`;
}

interface Props {
  initialFlats: FlatWithProject[];
  initialTypes: FlatType[];
  initialMaxPrice?: number;
}

export default function SearchClient({ initialFlats, initialTypes, initialMaxPrice }: Props) {
  const router = useRouter();
  const [flats] = useState(initialFlats);
  const [selectedTypes, setSelectedTypes] = useState<FlatType[]>(initialTypes);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(initialMaxPrice);
  const [sortBy, setSortBy] = useState<"area_desc" | "area_asc" | "floor_desc">("area_desc");
  const [showFilters, setShowFilters] = useState(false);
  const [leadTarget, setLeadTarget] = useState<{ projectId: string; projectName: string; flat?: FlatWithProject } | null>(null);

  function toggleType(t: FlatType) {
    setSelectedTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  }

  function applyFilters() {
    const params = new URLSearchParams();
    if (selectedTypes.length > 0) params.set("types", selectedTypes.join(","));
    if (maxPrice) params.set("maxPrice", String(maxPrice));
    router.push(`/search?${params.toString()}`);
    setShowFilters(false);
  }

  const filtered = useMemo(() => {
    let result = flats;
    if (selectedTypes.length > 0) result = result.filter((f) => selectedTypes.includes(f.flat_type));
    if (maxPrice) result = result.filter((f) => f.total_price <= maxPrice);
    result = [...result].sort((a, b) => {
      if (sortBy === "area_asc")   return a.carpet_area_sqft - b.carpet_area_sqft;
      if (sortBy === "floor_desc") return b.floor - a.floor;
      return b.carpet_area_sqft - a.carpet_area_sqft;
    });
    return result;
  }, [flats, selectedTypes, maxPrice, sortBy]);

  // Group by project
  const grouped = useMemo(() => {
    const map = new Map<string, { name: string; city: string; cover: string | null; id: string; flats: FlatWithProject[] }>();
    for (const f of filtered) {
      if (!map.has(f.projectId)) {
        map.set(f.projectId, { id: f.projectId, name: f.projectName, city: f.projectCity, cover: f.projectCover, flats: [] });
      }
      map.get(f.projectId)!.flats.push(f);
    }
    return Array.from(map.values());
  }, [filtered]);

  const activeFilterCount = selectedTypes.length + (maxPrice ? 1 : 0);

  return (
    <main className="min-h-screen" style={{ background: "#f5f5f7", paddingTop: 60 }}>
      {/* ── Sticky header ─────────────────────────────── */}
      <div
        className="sticky top-[48px] z-20 border-b"
        style={{ background: "#fff", borderColor: "rgba(0,0,0,0.08)" }}
      >
        {/* Row 1: BHK quick-select + Sort */}
        <div className="max-w-6xl mx-auto px-4 pt-2.5 pb-2 flex items-center gap-2">
          {/* BHK quick chips — tap to toggle, always visible */}
          <div className="flex gap-1.5 overflow-x-auto hide-scrollbar flex-1" style={{ scrollbarWidth: "none" }}>
            {BHK_OPTS.map(({ type, emoji }) => {
              const active = selectedTypes.includes(type);
              return (
                <button
                  key={type}
                  onClick={() => toggleType(type)}
                  className="shrink-0 flex items-center gap-1 px-2.5 rounded-xl font-medium transition-all"
                  style={{
                    height: 36, fontSize: "0.8rem",
                    background: active ? "#0071e3" : "#f0f0f2",
                    color: active ? "#fff" : "rgba(0,0,0,0.6)",
                    border: active ? "1.5px solid #0071e3" : "1.5px solid transparent",
                    cursor: "pointer",
                  }}
                  aria-pressed={active}
                  aria-label={`Filter by ${FLAT_TYPE_LABELS[type]}`}
                >
                  <span style={{ fontSize: "0.85rem" }}>{emoji}</span>
                  <span>{FLAT_TYPE_LABELS[type]}</span>
                </button>
              );
            })}
            {/* Budget filter pill if active */}
            {maxPrice && (
              <button
                onClick={() => setMaxPrice(undefined)}
                className="shrink-0 flex items-center gap-1 px-2.5 rounded-xl font-medium"
                style={{ height: 36, fontSize: "0.8rem", background: "#f59e0b", color: "#fff", border: "1.5px solid #f59e0b", cursor: "pointer" }}
              >
                Under {formatPrice(maxPrice)} <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Budget + sort controls */}
          <div className="shrink-0 flex items-center gap-2">
            <button
              onClick={() => setShowFilters(true)}
              className="flex items-center gap-1.5 px-3 rounded-xl font-medium"
              style={{
                height: 36, fontSize: "0.8rem",
                background: maxPrice ? "#1d1d1f" : "#f0f0f2",
                color: maxPrice ? "#fff" : "rgba(0,0,0,0.6)",
                border: "none", cursor: "pointer",
              }}
              aria-label="Budget filter"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Budget</span>
            </button>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="appearance-none rounded-xl px-2.5 pr-7 font-medium"
                style={{
                  height: 36, fontSize: "0.8rem", border: "1.5px solid rgba(0,0,0,0.1)",
                  background: "#fff", color: "#1d1d1f", cursor: "pointer", outline: "none",
                }}
                aria-label="Sort flats"
              >
                <option value="area_desc">Largest</option>
                <option value="area_asc">Smallest</option>
                <option value="floor_desc">High Floor</option>
              </select>
              <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "rgba(0,0,0,0.4)" }} />
            </div>
          </div>
        </div>

        {/* Result count */}
        <div className="max-w-6xl mx-auto px-4 pb-2">
          <p style={{ fontSize: "0.75rem", color: "rgba(0,0,0,0.4)", fontWeight: 500 }}>
            {filtered.length === 0
              ? "No available flats match your filters"
              : `${filtered.length} available flat${filtered.length !== 1 ? "s" : ""} across ${grouped.length} project${grouped.length !== 1 ? "s" : ""}`}
          </p>
        </div>
      </div>

      {/* ── Main content ──────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 py-6 pb-28 md:pb-10 space-y-10">
        {grouped.length === 0 ? (
          <EmptyState onReset={() => { setSelectedTypes([]); setMaxPrice(undefined); router.push("/search"); }} />
        ) : (
          grouped.map((project) => (
            <section key={project.id}>
              {/* Project header */}
              <div className="flex items-center gap-4 mb-4">
                <div
                  className="w-14 h-14 rounded-2xl overflow-hidden shrink-0"
                  style={{ background: "#e8e2d8" }}
                >
                  {project.cover ? (
                    <Image src={project.cover} alt={project.name} width={56} height={56} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Building2 className="w-6 h-6 opacity-25" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#1d1d1f", letterSpacing: "-0.015em" }}>
                    {project.name}
                  </h2>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="flex items-center gap-1" style={{ color: "rgba(0,0,0,0.5)", fontSize: "0.8125rem" }}>
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      {project.city}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                      style={{ background: "rgba(52,199,89,0.1)", color: "#1a7f4a", border: "1px solid rgba(52,199,89,0.2)" }}>
                      {project.flats.length} unit{project.flats.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
                <Link
                  href={`/projects/${project.id}${selectedTypes.length > 0 ? `?types=${selectedTypes.join(",")}` : ""}`}
                  className="hidden sm:flex items-center gap-1.5 px-4 rounded-xl font-medium shrink-0"
                  style={{ height: 38, fontSize: "0.8125rem", background: "#f0f0f2", color: "#1d1d1f", textDecoration: "none" }}
                >
                  View in 3D <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Flat cards grid */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {project.flats.map((flat) => (
                  <FlatCard
                    key={flat.id}
                    flat={flat}
                    projectId={project.id}
                    projectName={project.name}
                    selectedTypes={selectedTypes}
                    onInterested={() => setLeadTarget({ projectId: project.id, projectName: project.name, flat })}
                  />
                ))}
              </div>

              {/* Mobile "view in 3D" link */}
              <Link
                href={`/projects/${project.id}${selectedTypes.length > 0 ? `?types=${selectedTypes.join(",")}` : ""}`}
                className="sm:hidden flex items-center justify-center gap-2 mt-3 rounded-2xl font-medium"
                style={{ height: 44, background: "#f0f0f2", color: "#1d1d1f", fontSize: "0.875rem", textDecoration: "none" }}
              >
                View all flats in 3D <ArrowRight className="w-4 h-4" />
              </Link>
            </section>
          ))
        )}
      </div>

      {/* ── Filter bottom-sheet (mobile + desktop) ──── */}
      {showFilters && (
        <FilterSheet
          maxPrice={maxPrice}
          onSetMaxPrice={setMaxPrice}
          onApply={applyFilters}
          onClose={() => setShowFilters(false)}
        />
      )}

      {/* ── Lead form modal ──────────────────────────── */}
      {leadTarget && (
        <UnifiedLeadForm
          projectId={leadTarget.projectId}
          projectName={leadTarget.projectName}
          flat={leadTarget.flat}
          onClose={() => setLeadTarget(null)}
        />
      )}
    </main>
  );
}

/* ── Flat card ─────────────────────────────────────────────── */
function FlatCard({
  flat, projectId, projectName, selectedTypes, onInterested,
}: {
  flat: FlatWithProject;
  projectId: string;
  projectName: string;
  selectedTypes: FlatType[];
  onInterested: () => void;
}) {
  return (
    <div className="flat-card">
      {/* Top section */}
      <div className="p-4">
        {/* BHK + Status row */}
        <div className="flex items-center justify-between mb-1">
          <span style={{ fontSize: "1.25rem", fontWeight: 700, color: "#1d1d1f", letterSpacing: "-0.025em" }}>
            {FLAT_TYPE_LABELS[flat.flat_type] ?? flat.flat_type}
          </span>
          <span
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
            style={{
              background: `${STATUS_COLORS[flat.status]}18`,
              color: STATUS_COLORS[flat.status],
              border: `1px solid ${STATUS_COLORS[flat.status]}35`,
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full inline-block"
              style={{ background: STATUS_COLORS[flat.status] }}
            />
            {flat.status === "available" ? "Available" : flat.status === "discussion" ? "Open to discuss" : flat.status}
          </span>
        </div>

        {/* Flat number */}
        <div style={{ fontSize: "0.8rem", color: "rgba(0,0,0,0.42)", marginBottom: 8 }}>
          Flat {flat.flat_number}
        </div>

        {/* Details row */}
        <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mb-3" style={{ fontSize: "0.8125rem", color: "rgba(0,0,0,0.5)" }}>
          <span>{flat.carpet_area_sqft} sq ft</span>
          <span style={{ opacity: 0.4 }}>·</span>
          <span>Floor {flat.floor}</span>
          {flat.facing && (
            <>
              <span style={{ opacity: 0.4 }}>·</span>
              <span>{flat.facing}-facing</span>
            </>
          )}
        </div>

        {/* Pricing */}
        <div style={{ fontSize: "1.125rem", fontWeight: 700, color: "#0071e3", letterSpacing: "-0.02em" }}>
          On Request
        </div>
        <div style={{ fontSize: "0.75rem", color: "rgba(0,0,0,0.4)", marginTop: 2 }}>
          Contact for pricing details
        </div>
      </div>

      {/* Actions */}
      <div
        className="flex gap-2 px-4 pb-4"
        style={{ borderTop: "1px solid rgba(0,0,0,0.05)", paddingTop: 12 }}
      >
        <Link
          href={`/projects/${projectId}?types=${flat.flat_type}${selectedTypes.length > 1 ? `,${selectedTypes.filter(t => t !== flat.flat_type).join(",")}` : ""}`}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl font-medium"
          style={{
            height: 44, fontSize: "0.8125rem",
            background: "#f0f0f2", color: "#1d1d1f",
            textDecoration: "none",
          }}
          aria-label={`View ${projectName} in 3D`}
        >
          View in 3D
        </Link>
        <button
          onClick={onInterested}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl font-semibold"
          style={{
            height: 44, fontSize: "0.8125rem",
            background: "#0071e3", color: "#fff",
            border: "none", cursor: "pointer",
          }}
          aria-label="Express interest in this flat"
        >
          <Phone className="w-3.5 h-3.5" />
          I&apos;m Interested
        </button>
      </div>
    </div>
  );
}

/* ── Empty state ───────────────────────────────────────────── */
function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div
        className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6"
        style={{ background: "rgba(0,113,227,0.08)" }}
      >
        <Building2 className="w-9 h-9" style={{ color: "#0071e3", opacity: 0.6 }} />
      </div>
      <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#1d1d1f", marginBottom: 8 }}>
        No flats match these filters
      </h3>
      <p style={{ fontSize: "0.9375rem", color: "rgba(0,0,0,0.5)", marginBottom: 24, maxWidth: 280 }}>
        Try removing some filters or expanding your budget range.
      </p>
      <button
        onClick={onReset}
        className="btn-primary"
        style={{ padding: "12px 28px" }}
      >
        Clear All Filters
      </button>
    </div>
  );
}

/* ── Filter sheet (bottom-sheet + desktop overlay) ─────────── */
function FilterSheet({
  maxPrice, onSetMaxPrice, onApply, onClose,
}: {
  maxPrice?: number;
  onSetMaxPrice: (v?: number) => void;
  onApply: () => void;
  onClose: () => void;
}) {
  return (
    <>
      <div className="bottom-sheet-backdrop" onClick={onClose} />
      <div
        className="fixed inset-x-0 bottom-0 sm:inset-auto sm:fixed sm:right-4 sm:bottom-[68px] sm:w-72 z-50"
        style={{
          background: "#fff",
          borderRadius: "20px 20px 0 0",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.15)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Handle */}
        <div className="sm:hidden bottom-sheet-handle flex-shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 flex-shrink-0">
          <h3 style={{ fontSize: "1.0625rem", fontWeight: 700, color: "#1d1d1f" }}>Budget Range</h3>
          <button onClick={onClose} aria-label="Close filters"
            style={{ background: "rgba(0,0,0,0.06)", border: "none", cursor: "pointer", width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Budget options */}
        <div className="px-5 pb-4 grid grid-cols-2 gap-2">
          {BUDGET_OPTS.map(({ label, max }) => {
            const active = maxPrice === max;
            return (
              <button
                key={label}
                onClick={() => onSetMaxPrice(active ? undefined : max)}
                className="rounded-xl font-medium transition-all"
                style={{
                  height: 48, fontSize: "0.875rem", border: `1.5px solid ${active ? "#0071e3" : "rgba(0,0,0,0.1)"}`,
                  background: active ? "rgba(0,113,227,0.06)" : "#f5f5f7",
                  color: active ? "#0071e3" : "#1d1d1f", cursor: "pointer",
                }}
                aria-pressed={active}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Footer apply button */}
        <div className="px-5 pb-5 flex-shrink-0">
          <button
            onClick={onApply}
            className="w-full flex items-center justify-center gap-2 rounded-2xl font-semibold"
            style={{ height: 52, background: "#0071e3", color: "#fff", fontSize: "1rem", border: "none", cursor: "pointer" }}
          >
            Apply Budget
          </button>
        </div>
      </div>
    </>
  );
}
