"use client";

import { useState, useMemo } from "react";
import type { Project, Flat } from "@/lib/types";
import { X, Info } from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string; border: string }> = {
  available:  { label: "Available",    color: "#dcfce7", dot: "#16a34a", border: "#86efac" },
  sold:       { label: "Sold",         color: "#fee2e2", dot: "#dc2626", border: "#fca5a5" },
  reserved:   { label: "Reserved",     color: "#fff7ed", dot: "#ea580c", border: "#fdba74" },
  held:       { label: "Held",         color: "#faf5ff", dot: "#9333ea", border: "#d8b4fe" },
  discussion: { label: "In Discussion",color: "#eff6ff", dot: "#2563eb", border: "#93c5fd" },
};

const FLAT_TYPE_SHORT: Record<string, string> = {
  studio: "St", "1bhk": "1B", "2bhk": "2B", "3bhk": "3B",
  "4bhk": "4B", penthouse: "PH", office_suite: "OF", office_floor: "FL",
};

function FlatCell({ flat, onClick, isSelected }: {
  flat: Flat; onClick: () => void; isSelected: boolean;
}) {
  const cfg = STATUS_CONFIG[flat.status] ?? STATUS_CONFIG.available;
  return (
    <button
      onClick={onClick}
      title={`Flat ${flat.flat_number} · ${flat.flat_type.toUpperCase()} · ${flat.carpet_area_sqft} sqft`}
      className="relative rounded-lg border transition-all group"
      style={{
        width: 52, height: 52,
        background: cfg.color,
        borderColor: isSelected ? "#1d1d1f" : cfg.border,
        borderWidth: isSelected ? 2 : 1,
        cursor: "pointer",
        transform: isSelected ? "scale(1.08)" : undefined,
        boxShadow: isSelected ? "0 4px 12px rgba(0,0,0,0.15)" : undefined,
        zIndex: isSelected ? 1 : 0,
        padding: 0,
      }}>
      {/* Type label */}
      <div style={{ fontSize: "0.6rem", fontWeight: 800, color: cfg.dot, lineHeight: 1, paddingTop: 6, paddingLeft: 5 }}>
        {FLAT_TYPE_SHORT[flat.flat_type] ?? "FL"}
      </div>
      {/* Flat number */}
      <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#1d1d1f", lineHeight: 1, padding: "2px 5px 0" }}
        className="truncate">
        {flat.flat_number}
      </div>
      {/* Area */}
      <div style={{ fontSize: "0.55rem", color: "rgba(0,0,0,0.45)", padding: "2px 5px 0" }}>
        {flat.carpet_area_sqft}
      </div>
      {/* Status dot */}
      <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: cfg.dot }} />
    </button>
  );
}

function FlatDetailPanel({ flat, onClose }: { flat: Flat; onClose: () => void }) {
  const cfg = STATUS_CONFIG[flat.status] ?? STATUS_CONFIG.available;
  return (
    <div className="rounded-2xl p-5" style={{ background: "#fff", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", border: "1px solid rgba(0,0,0,0.06)" }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <div style={{ fontWeight: 800, fontSize: "1.1rem", color: "#1d1d1f" }}>Flat {flat.flat_number}</div>
          <div style={{ fontSize: "0.78rem", color: "rgba(0,0,0,0.48)", marginTop: 2 }}>Floor {flat.floor}</div>
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: "#f5f5f7", border: "none", cursor: "pointer", color: "rgba(0,0,0,0.5)" }}>
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        {/* Status */}
        <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: cfg.color, border: `1px solid ${cfg.border}` }}>
          <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#1d1d1f" }}>Status</span>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: cfg.dot }} />
            <span style={{ fontSize: "0.8rem", fontWeight: 700, color: cfg.dot }}>{cfg.label}</span>
          </div>
        </div>

        {[
          { label: "Type", value: flat.flat_type.toUpperCase() },
          { label: "Carpet Area", value: `${flat.carpet_area_sqft} sq.ft` },
          { label: "Facing", value: flat.facing ?? "—" },
          { label: "Bathrooms", value: flat.bathrooms ? String(flat.bathrooms) : "—" },
          ...(flat.buyer_name ? [{ label: "Buyer", value: flat.buyer_name }] : []),
          { label: "Price", value: "On Request" },
        ].map(row => (
          <div key={row.label} className="flex items-center justify-between py-1"
            style={{ borderBottom: "1px solid rgba(0,0,0,0.05)", fontSize: "0.82rem" }}>
            <span style={{ color: "rgba(0,0,0,0.5)" }}>{row.label}</span>
            <span style={{ fontWeight: 600, color: "#1d1d1f" }}>{row.value}</span>
          </div>
        ))}
      </div>

      <a href="/admin/inventory"
        className="flex items-center justify-center gap-1.5 w-full mt-4 py-2.5 rounded-xl text-sm font-semibold"
        style={{ background: "#0071e3", color: "#fff", textDecoration: "none" }}>
        Edit in Inventory
      </a>
    </div>
  );
}

interface Props { projects: Project[] }

export default function InventoryHeatmap({ projects }: Props) {
  const [selectedProjectId, setSelectedProjectId] = useState(projects[0]?.id ?? "");
  const [selectedTowerIdx, setSelectedTowerIdx] = useState(0);
  const [selectedFlat, setSelectedFlat] = useState<Flat | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const project = projects.find(p => p.id === selectedProjectId) ?? projects[0];
  const tower = project?.towers[selectedTowerIdx];
  const flats = tower?.flats ?? [];

  // Group by floor, sorted desc
  const floorMap = useMemo(() => {
    const map = new Map<number, Flat[]>();
    for (const f of flats) {
      const arr = map.get(f.floor) ?? [];
      arr.push(f);
      map.set(f.floor, arr);
    }
    const sorted = Array.from(map.entries()).sort((a, b) => b[0] - a[0]);
    return new Map<number, Flat[]>(sorted);
  }, [flats]);

  // Stats
  const stats = useMemo(() => {
    const s = { available: 0, sold: 0, reserved: 0, held: 0, discussion: 0, total: 0 };
    for (const f of flats) {
      s.total++;
      if (f.status in s) (s as any)[f.status]++;
    }
    return s;
  }, [flats]);

  const filteredFloorMap = useMemo(() => {
    if (filterStatus === "all") return floorMap;
    const filtered = new Map<number, Flat[]>();
    Array.from(floorMap.entries()).forEach(([floor, fs]) => {
      const matching = fs.filter(f => f.status === filterStatus);
      if (matching.length > 0) filtered.set(floor, matching);
    });
    return filtered;
  }, [floorMap, filterStatus]);

  if (!project) return (
    <div className="p-8 text-center" style={{ color: "rgba(0,0,0,0.4)" }}>No projects found</div>
  );

  return (
    <div className="p-5 sm:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#1d1d1f", letterSpacing: "-0.02em" }}>
          Inventory Heatmap
        </h1>
        <p style={{ fontSize: "0.875rem", color: "rgba(0,0,0,0.48)", marginTop: 4 }}>
          Visual floor-by-floor view of all units. Click any flat to see details.
        </p>
      </div>

      {/* Controls row */}
      <div className="flex flex-wrap gap-3 mb-6 items-center">
        {/* Project selector */}
        <select
          value={selectedProjectId}
          onChange={e => { setSelectedProjectId(e.target.value); setSelectedTowerIdx(0); setSelectedFlat(null); }}
          className="px-3 py-2 rounded-xl text-sm font-medium outline-none"
          style={{ background: "#fff", border: "1.5px solid rgba(0,0,0,0.12)", color: "#1d1d1f", cursor: "pointer" }}>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>

        {/* Tower selector */}
        {project.towers.length > 1 && (
          <div className="flex gap-1 rounded-xl p-0.5" style={{ background: "#f0f0f2" }}>
            {project.towers.map((t, i) => (
              <button key={t.id} onClick={() => { setSelectedTowerIdx(i); setSelectedFlat(null); }}
                className="px-3 py-1.5 rounded-lg text-sm font-semibold transition-all"
                style={i === selectedTowerIdx
                  ? { background: "#fff", color: "#1d1d1f", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }
                  : { background: "transparent", color: "rgba(0,0,0,0.48)" }}>
                {t.name}
              </button>
            ))}
          </div>
        )}

        {/* Status filter chips */}
        <div className="flex gap-1.5 ml-auto flex-wrap">
          {[["all", "All", "#1d1d1f"], ...Object.entries(STATUS_CONFIG).map(([k, v]) => [k, v.label, v.dot])].map(([k, label, color]) => (
            <button key={k} onClick={() => setFilterStatus(k)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={{
                background: filterStatus === k ? color : "#f5f5f7",
                color: filterStatus === k ? "#fff" : "rgba(0,0,0,0.55)",
              }}>
              {k !== "all" && <span className="w-1.5 h-1.5 rounded-full" style={{ background: filterStatus === k ? "rgba(255,255,255,0.7)" : color as string }} />}
              {label}
              {k !== "all" && <span className="opacity-70">({(stats as any)[k] ?? 0})</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Status summary bar */}
      <div className="grid grid-cols-5 gap-2 mb-6">
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <div key={key} className="rounded-xl p-3 text-center" style={{ background: cfg.color, border: `1px solid ${cfg.border}` }}>
            <div style={{ fontSize: "1.25rem", fontWeight: 800, color: cfg.dot }}>{(stats as any)[key] ?? 0}</div>
            <div style={{ fontSize: "0.65rem", fontWeight: 600, color: "rgba(0,0,0,0.5)", marginTop: 2 }}>{cfg.label}</div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1 mb-4 flex-wrap">
        <Info className="w-3.5 h-3.5 shrink-0" style={{ color: "rgba(0,0,0,0.3)" }} />
        <span style={{ fontSize: "0.72rem", color: "rgba(0,0,0,0.4)" }}>Type abbreviations:</span>
        {Object.entries(FLAT_TYPE_SHORT).map(([k, v]) => (
          <span key={k} className="px-2 py-0.5 rounded" style={{ fontSize: "0.65rem", background: "#f5f5f7", color: "rgba(0,0,0,0.6)" }}>
            {v}={k.replace("_", " ")}
          </span>
        ))}
      </div>

      {/* Main grid + detail panel */}
      <div className="flex gap-6 items-start">
        {/* Heatmap grid */}
        <div className="flex-1 overflow-x-auto">
          {filteredFloorMap.size === 0 ? (
            <div className="py-16 text-center rounded-2xl" style={{ background: "#fff", color: "rgba(0,0,0,0.4)" }}>
              No units match this filter
            </div>
          ) : (
            <div className="space-y-1.5" style={{ minWidth: 400 }}>
              {Array.from(filteredFloorMap.entries()).map(([floor, floorFlats]: [number, Flat[]]) => {
                const av = floorFlats.filter((f: Flat) => f.status === "available").length;
                return (
                  <div key={floor} className="flex items-center gap-2">
                    <div className="shrink-0 w-12 text-right" style={{ fontSize: "0.72rem", fontWeight: 700, color: "rgba(0,0,0,0.38)" }}>
                      F{floor}
                      {av > 0 && (
                        <div style={{ fontSize: "0.6rem", color: "#16a34a", fontWeight: 600 }}>{av} free</div>
                      )}
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                      {floorFlats
                        .sort((a: Flat, b: Flat) => (a.position_on_floor ?? 0) - (b.position_on_floor ?? 0) || a.flat_number.localeCompare(b.flat_number))
                        .map((flat: Flat) => (
                          <FlatCell
                            key={flat.id}
                            flat={flat}
                            isSelected={selectedFlat?.id === flat.id}
                            onClick={() => setSelectedFlat(prev => prev?.id === flat.id ? null : flat)}
                          />
                        ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selectedFlat && (
          <div className="shrink-0 w-72 hidden lg:block sticky top-4">
            <FlatDetailPanel flat={selectedFlat} onClose={() => setSelectedFlat(null)} />
          </div>
        )}
      </div>

      {/* Mobile detail panel */}
      {selectedFlat && (
        <div className="lg:hidden fixed inset-x-0 bottom-0 z-50 p-4 pb-safe"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
          <FlatDetailPanel flat={selectedFlat} onClose={() => setSelectedFlat(null)} />
        </div>
      )}
    </div>
  );
}
