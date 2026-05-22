"use client";

import { useState, useTransition } from "react";
import type { Project, Flat, FlatStatus } from "@/lib/types";
import { getProjectStats, STATUS_COLORS, STATUS_LABELS, FLAT_TYPE_LABELS } from "@/lib/types";
import StatusBadge from "@/components/ui/StatusBadge";
import { updateFlatStatus } from "@/lib/actions";
import { Building2, ChevronDown, Users, TrendingUp, Eye, CheckCircle, Home, RefreshCw, Clock, AlertCircle, Save, Plus } from "lucide-react";
import Link from "next/link";

interface LiveStats {
  totalLeads: number;
  newLeads: number;
  newThisWeek: number;
  wonLeads: number;
  totalFlats: number;
  availableFlats: number;
  soldFlats: number;
  reservedFlats: number;
}

interface Props {
  projects: Project[];
  liveStats?: LiveStats;
}

const NEXT_STATUS: Record<FlatStatus, FlatStatus> = {
  available: "reserved",
  reserved: "discussion",
  discussion: "sold",
  sold: "available",
  held: "available",
};

const CELL_STATUS: Record<FlatStatus, { bg: string; border: string; text: string }> = {
  available:  { bg: "rgba(52,199,89,0.1)",   border: "rgba(52,199,89,0.3)",   text: "#1a7f4a" },
  sold:       { bg: "rgba(255,59,48,0.1)",   border: "rgba(255,59,48,0.3)",   text: "#d70015" },
  reserved:   { bg: "rgba(255,149,0,0.1)",   border: "rgba(255,149,0,0.3)",   text: "#c25000" },
  held:       { bg: "rgba(168,85,247,0.1)",  border: "rgba(168,85,247,0.3)",  text: "#6c28d9" },
  discussion: { bg: "rgba(0,113,227,0.1)",   border: "rgba(0,113,227,0.3)",   text: "#0055b3" },
};

export default function AdminDashboard({ projects, liveStats }: Props) {
  const [selectedProjectId, setSelectedProjectId] = useState(projects[0]?.id ?? "");
  const [selectedTowerIdx, setSelectedTowerIdx] = useState(0);
  const [flatStatuses, setFlatStatuses] = useState<Record<string, FlatStatus>>({});
  const [selectedFlat, setSelectedFlat] = useState<Flat | null>(null);
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [saving, setSaving] = useState<string | null>(null); // flatId being saved
  const [savedFlash, setSavedFlash] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const project = projects.find((p) => p.id === selectedProjectId) ?? projects[0];
  const stats = getProjectStats(project);
  const activeTower = project?.towers[selectedTowerIdx];
  const floors = Array.from({ length: activeTower?.total_floors ?? 0 }, (_, i) => i + 1).reverse();

  const getFlatStatus = (flat: Flat): FlatStatus => flatStatuses[flat.id] ?? flat.status;

  const setStatus = (flat: Flat, status: FlatStatus) => {
    setFlatStatuses((prev) => ({ ...prev, [flat.id]: status }));
    setSaving(flat.id);
    startTransition(async () => {
      try {
        await updateFlatStatus(flat.id, status);
        setSavedFlash(flat.id);
        setTimeout(() => setSavedFlash(null), 1800);
      } catch {
        // revert on error
        setFlatStatuses((prev) => ({ ...prev, [flat.id]: flat.status }));
      } finally {
        setSaving(null);
      }
    });
  };

  const cardStyle: React.CSSProperties = {
    background: "#ffffff",
    borderRadius: 12,
    padding: "20px 24px",
    boxShadow: "rgba(0,0,0,0.08) 0px 2px 12px 0px",
  };

  if (!project) return null;

  return (
    <div className="pt-12 min-h-screen" style={{ background: "#f5f5f7" }}>
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-micro mb-0.5" style={{ color: "rgba(0,0,0,0.42)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Builder Portal
            </p>
            <h1 className="text-heading" style={{ color: "#1d1d1f" }}>Dashboard</h1>
          </div>

          {/* Project picker */}
          <div className="relative">
            <button
              onClick={() => setShowProjectPicker(!showProjectPicker)}
              className="flex items-center gap-2 rounded-comfortable px-4 py-2.5"
              style={{ background: "#ffffff", boxShadow: "var(--shadow-sm)", border: "1px solid rgba(0,0,0,0.08)" }}
            >
              <Building2 className="w-4 h-4" style={{ color: "#0071e3" }} />
              <span className="text-caption font-semibold" style={{ color: "#1d1d1f" }}>{project.name}</span>
              <ChevronDown className="w-4 h-4" style={{ color: "rgba(0,0,0,0.4)" }} />
            </button>
            {showProjectPicker && (
              <div
                className="absolute right-0 top-full mt-2 w-64 rounded-large overflow-hidden z-20"
                style={{ background: "#ffffff", boxShadow: "rgba(0,0,0,0.22) 3px 5px 30px 0px" }}
              >
                {projects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelectedProjectId(p.id);
                      setSelectedTowerIdx(0);
                      setSelectedFlat(null);
                      setShowProjectPicker(false);
                    }}
                    className="w-full text-left px-4 py-3 transition-colors"
                    style={p.id === selectedProjectId
                      ? { background: "rgba(0,113,227,0.06)", color: "#0071e3" }
                      : { color: "#1d1d1f" }
                    }
                    onMouseEnter={(e) => { if (p.id !== selectedProjectId) (e.currentTarget as HTMLElement).style.background = "#f5f5f7"; }}
                    onMouseLeave={(e) => { if (p.id !== selectedProjectId) (e.currentTarget as HTMLElement).style.background = ""; }}
                  >
                    <div className="text-caption font-medium">{p.name}</div>
                    <div className="text-micro" style={{ color: "rgba(0,0,0,0.42)" }}>{p.city ?? p.location}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Stats tiles */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Flats", value: stats.total, icon: <Home className="w-5 h-5" />, accent: false },
            { label: "Available", value: stats.available, icon: <CheckCircle className="w-5 h-5" />, accent: true },
            { label: "Sold", value: stats.sold, icon: <TrendingUp className="w-5 h-5" />, color: "#d70015" },
            { label: "Reserved", value: stats.reserved, icon: <Clock className="w-5 h-5" />, color: "#c25000" },
          ].map((s) => (
            <div key={s.label} style={cardStyle}>
              <div style={{ color: s.accent ? "#0071e3" : (s.color ?? "rgba(0,0,0,0.4)"), marginBottom: 12 }}>
                {s.icon}
              </div>
              <div style={{ fontSize: "2rem", fontWeight: 600, color: s.accent ? "#0071e3" : (s.color ?? "#1d1d1f"), letterSpacing: "-0.03em" }}>
                {s.value}
              </div>
              <div className="text-caption mt-1" style={{ color: "rgba(0,0,0,0.48)" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Construction progress */}
        {project.construction_percentage != null && (
          <div style={cardStyle}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-caption font-semibold" style={{ color: "#1d1d1f" }}>Construction Progress</h2>
              <span style={{ fontWeight: 600, color: "#0071e3" }}>{project.construction_percentage}%</span>
            </div>
            <div className="h-1.5 rounded-pill overflow-hidden" style={{ background: "rgba(0,0,0,0.06)" }}>
              <div
                className="h-full rounded-pill"
                style={{ width: `${project.construction_percentage}%`, background: "#0071e3" }}
              />
            </div>
            <div className="flex justify-between mt-2 text-micro" style={{ color: "rgba(0,0,0,0.4)" }}>
              <span>{project.construction_stage ?? "In progress"}</span>
              {project.possession_date && (
                <span>Possession: {new Date(project.possession_date).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}</span>
              )}
            </div>
          </div>
        )}

        {/* Tower Map */}
        <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
          <div
            className="px-6 py-4 flex items-center justify-between"
            style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}
          >
            <div>
              <h2 className="text-caption font-semibold" style={{ color: "#1d1d1f" }}>Tower Map</h2>
              <p className="text-micro" style={{ color: "rgba(0,0,0,0.4)" }}>
                Click a flat to select · double-click to cycle status
              </p>
            </div>
            {project.towers.length > 1 && (
              <div className="flex gap-1 rounded-comfortable p-1" style={{ background: "#f5f5f7" }}>
                {project.towers.map((t, i) => (
                  <button
                    key={t.id}
                    onClick={() => { setSelectedTowerIdx(i); setSelectedFlat(null); }}
                    className="px-3 py-1.5 rounded-standard text-micro transition-all"
                    style={
                      i === selectedTowerIdx
                        ? { background: "#0071e3", color: "#fff" }
                        : { background: "transparent", color: "rgba(0,0,0,0.48)" }
                    }
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {activeTower ? (
            <div className="p-5 overflow-x-auto">
              {/* Legend */}
              <div className="flex flex-wrap gap-4 mb-4">
                {(["available", "sold", "reserved", "discussion"] as FlatStatus[]).map((s) => (
                  <div key={s} className="flex items-center gap-1.5 text-micro" style={{ color: "rgba(0,0,0,0.56)" }}>
                    <span
                      className="w-3 h-3 rounded-micro"
                      style={{ background: CELL_STATUS[s].bg, border: `1px solid ${CELL_STATUS[s].border}` }}
                    />
                    {STATUS_LABELS[s]}
                  </div>
                ))}
                <div className="flex items-center gap-1.5 text-micro ml-auto" style={{ color: "rgba(0,0,0,0.4)" }}>
                  <RefreshCw className="w-3 h-3" /> Double-click to change status
                </div>
              </div>

              {/* Floor grid */}
              <div className="space-y-1">
                {floors.map((floor) => {
                  const floorFlats = activeTower.flats.filter((f) => f.floor === floor);
                  return (
                    <div key={floor} className="flex items-center gap-2">
                      <div
                        className="w-8 text-right text-micro shrink-0"
                        style={{ color: "rgba(0,0,0,0.35)", fontWeight: 500 }}
                      >
                        {floor < 10 ? `0${floor}` : floor}
                      </div>
                      <div className="flex gap-1.5 flex-1">
                        {floorFlats.map((flat) => {
                          const status = getFlatStatus(flat);
                          const cs = CELL_STATUS[status];
                          const isSelected = selectedFlat?.id === flat.id;
                          return (
                            <button
                              key={flat.id}
                              onClick={() => setSelectedFlat(flat)}
                              onDoubleClick={() => setStatus(flat, NEXT_STATUS[status])}
                              title={`${flat.flat_number} — ${STATUS_LABELS[status]}`}
                              className="relative flex-1 h-7 min-w-[44px] rounded-micro text-[10px] font-semibold transition-all hover:scale-110 hover:z-10 overflow-hidden"
                              style={{
                                background: cs.bg,
                                border: `1.5px solid ${isSelected ? cs.border.replace("0.3", "0.8") : cs.border}`,
                                color: cs.text,
                                boxShadow: isSelected ? `0 0 0 2px ${cs.border}` : "none",
                              }}
                            >
                              {saving === flat.id ? (
                                <span className="absolute inset-0 flex items-center justify-center">
                                  <span className="w-2.5 h-2.5 border border-current rounded-full animate-spin" style={{ borderTopColor: "transparent" }} />
                                </span>
                              ) : savedFlash === flat.id ? (
                                <span className="absolute inset-0 flex items-center justify-center text-[9px]">✓</span>
                              ) : flat.flat_number.slice(-1)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center" style={{ color: "rgba(0,0,0,0.32)" }}>
              <AlertCircle className="w-8 h-8 mx-auto mb-3 opacity-40" />
              <p className="text-caption">No tower data for this project.</p>
            </div>
          )}
        </div>

        {/* Selected flat detail */}
        {selectedFlat && (
          <div style={{ ...cardStyle, border: "1.5px solid rgba(0,113,227,0.2)" }}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-caption font-semibold mb-1" style={{ color: "#1d1d1f" }}>
                  Flat {selectedFlat.flat_number} — {activeTower?.name}
                </h3>
                <div className="flex items-center gap-2">
                  <StatusBadge status={getFlatStatus(selectedFlat)} />
                  {saving === selectedFlat.id && (
                    <span className="text-micro" style={{ color: "rgba(0,0,0,0.4)" }}>Saving…</span>
                  )}
                  {savedFlash === selectedFlat.id && (
                    <span className="text-micro" style={{ color: "#1a7f4a" }}>✓ Saved</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedFlat(null)}
                className="text-micro"
                style={{ color: "rgba(0,0,0,0.4)" }}
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {[
                ["Type", FLAT_TYPE_LABELS[selectedFlat.flat_type]],
                ["Floor", `Floor ${selectedFlat.floor}`],
                ["Carpet", `${selectedFlat.carpet_area_sqft} sq.ft`],
                ["Price", `₹${(selectedFlat.total_price / 100000).toFixed(0)}L`],
              ].map(([k, v]) => (
                <div key={k} className="rounded-standard p-3" style={{ background: "#f5f5f7" }}>
                  <div className="text-micro mb-1" style={{ color: "rgba(0,0,0,0.42)" }}>{k}</div>
                  <div className="text-caption font-semibold" style={{ color: "#1d1d1f" }}>{v}</div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 flex-wrap">
              {(["available", "reserved", "discussion", "sold"] as FlatStatus[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(selectedFlat, s)}
                  className="px-3 py-1.5 rounded-pill text-micro transition-all"
                  style={
                    getFlatStatus(selectedFlat) === s
                      ? { background: "#0071e3", color: "#fff", border: "1px solid #0071e3" }
                      : { background: "#f5f5f7", color: "rgba(0,0,0,0.6)", border: "1px solid rgba(0,0,0,0.1)" }
                  }
                >
                  Mark as {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Live KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-8">
          {[
            {
              label: "Total Leads",
              count: liveStats?.totalLeads ?? "—",
              sub: liveStats ? `${liveStats.newThisWeek} this week` : "",
              icon: <Users className="w-5 h-5" />,
              href: "/admin/leads",
              accent: "#0071e3",
            },
            {
              label: "New Leads",
              count: liveStats?.newLeads ?? "—",
              sub: "Awaiting contact",
              icon: <Eye className="w-5 h-5" />,
              href: "/admin/leads",
              accent: "#ff9f0a",
            },
            {
              label: "Under Discussion",
              count: stats.discussion,
              sub: `of ${stats.total} flats`,
              icon: <Clock className="w-5 h-5" />,
              href: null,
              accent: "#0071e3",
            },
            {
              label: "Won",
              count: liveStats?.wonLeads ?? "—",
              sub: "Leads converted",
              icon: <CheckCircle className="w-5 h-5" />,
              href: "/admin/leads",
              accent: "#34c759",
            },
          ].map((item) => {
            const Tag = item.href ? "a" : "div";
            return (
              <Tag
                key={item.label}
                href={item.href ?? undefined}
                className="text-left rounded-large p-5 transition-shadow"
                style={{ background: "#ffffff", boxShadow: "rgba(0,0,0,0.08) 0px 2px 12px 0px", display: "block", textDecoration: "none" }}
                onMouseEnter={(e: any) => (e.currentTarget.style.boxShadow = "rgba(0,0,0,0.16) 0px 4px 20px 0px")}
                onMouseLeave={(e: any) => (e.currentTarget.style.boxShadow = "rgba(0,0,0,0.08) 0px 2px 12px 0px")}
              >
                <div style={{ color: item.accent, marginBottom: 12 }}>{item.icon}</div>
                <div style={{ fontSize: "1.75rem", fontWeight: 600, color: "#1d1d1f", letterSpacing: "-0.03em" }}>{item.count}</div>
                <div className="text-caption mt-0.5" style={{ color: "rgba(0,0,0,0.48)" }}>{item.label}</div>
                {item.sub && <div className="text-micro mt-0.5" style={{ color: "rgba(0,0,0,0.36)" }}>{item.sub}</div>}
              </Tag>
            );
          })}
        </div>

      </div>
    </div>
  );
}
