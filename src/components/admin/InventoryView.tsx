"use client";

import { useState, useMemo, useTransition } from "react";
import type { Project, Flat, FlatStatus } from "@/lib/types";
import { STATUS_COLORS, STATUS_LABELS, FLAT_TYPE_LABELS } from "@/lib/types";
import { inrShort, inrFull } from "@/lib/format";
import { updateFlatStatus } from "@/app/admin/inventory/actions";
import { Search, X, Building2, Layers, Maximize2, Compass, User, Check, Flame, BarChart3, Grid3x3 } from "lucide-react";

const STATUS_ORDER: FlatStatus[] = ["available", "reserved", "sold", "held", "discussion"];

function heatColor(pctSold: number): string {
  // 0% → green (#1cc77f), 50% → amber (#f59e0b), 100% → deep orange (#ea580c)
  if (pctSold < 50) {
    const t = pctSold / 50;
    const r = Math.round(28 + (245 - 28) * t);
    const g = Math.round(199 + (158 - 199) * t);
    const b = Math.round(127 + (11 - 127) * t);
    return `rgb(${r},${g},${b})`;
  }
  const t = (pctSold - 50) / 50;
  const r = Math.round(245 + (234 - 245) * t);
  const g = Math.round(158 + (88 - 158) * t);
  const b = Math.round(11 + (12 - 11) * t);
  return `rgb(${r},${g},${b})`;
}

export default function InventoryView({ projects }: { projects: Project[] }) {
  const [projectIdx, setProjectIdx] = useState(0);
  const [towerIdx, setTowerIdx] = useState(0);
  const [selected, setSelected] = useState<Flat | null>(null);
  const [statusFilter, setStatusFilter] = useState<FlatStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [pending, startTransition] = useTransition();
  const [toast, setToast] = useState<string | null>(null);
  const [buyerName, setBuyerName] = useState("");
  const [viewMode, setViewMode] = useState<"status" | "heatmap">("status");

  const project = projects[projectIdx];
  const tower = project?.towers[towerIdx];

  // KPIs across the whole selected project
  const kpi = useMemo(() => {
    const flats = project?.towers.flatMap((t) => t.flats) ?? [];
    const by = (s: FlatStatus) => flats.filter((f) => f.status === s);
    const sold = by("sold");
    const avail = by("available");
    return {
      total: flats.length,
      available: avail.length,
      reserved: by("reserved").length,
      sold: sold.length,
      held: by("held").length,
      discussion: by("discussion").length,
      valueSold: sold.reduce((s, f) => s + f.total_price, 0),
      valueAvailable: avail.reduce((s, f) => s + f.total_price, 0),
      pctSold: flats.length ? Math.round((sold.length / flats.length) * 100) : 0,
    };
  }, [project]);

  // Stacking plan: floors (desc) -> units sorted by position
  const floors = useMemo(() => {
    if (!tower) return [];
    const map = new Map<number, Flat[]>();
    for (const f of tower.flats) {
      if (!map.has(f.floor)) map.set(f.floor, []);
      map.get(f.floor)!.push(f);
    }
    return Array.from(map.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([floor, flats]) => ({
        floor,
        flats: flats.sort((a, b) => (a.position_on_floor ?? 0) - (b.position_on_floor ?? 0) || a.flat_number.localeCompare(b.flat_number)),
      }));
  }, [tower]);

  const maxCols = useMemo(() => Math.max(1, ...floors.map((f) => f.flats.length)), [floors]);

  const floorStats = useMemo(() =>
    floors.map(({ floor, flats }) => {
      const total = flats.length;
      const sold = flats.filter((f) => f.status === "sold").length;
      const reserved = flats.filter((f) => f.status === "reserved").length;
      const available = flats.filter((f) => f.status === "available").length;
      const pctSold = total ? Math.round(((sold + reserved) / total) * 100) : 0;
      return { floor, total, sold, reserved, available, pctSold };
    }),
  [floors]);

  const hotFloor = useMemo(() => {
    if (!floorStats.length) return null;
    return floorStats.reduce((best, cur) => cur.pctSold > best.pctSold ? cur : best, floorStats[0]);
  }, [floorStats]);

  const typeStats = useMemo(() => {
    if (!tower) return [];
    const map = new Map<string, { total: number; sold: number }>();
    for (const f of tower.flats) {
      if (!map.has(f.flat_type)) map.set(f.flat_type, { total: 0, sold: 0 });
      const s = map.get(f.flat_type)!;
      s.total++;
      if (f.status === "sold" || f.status === "reserved") s.sold++;
    }
    return Array.from(map.entries())
      .map(([type, s]) => ({ type, ...s, pct: Math.round((s.sold / s.total) * 100) }))
      .sort((a, b) => b.pct - a.pct);
  }, [tower]);

  function cellDim(f: Flat) {
    if (statusFilter !== "all" && f.status !== statusFilter) return true;
    if (search && !f.flat_number.toLowerCase().includes(search.toLowerCase())) return true;
    return false;
  }

  function changeStatus(flat: Flat, status: FlatStatus) {
    const fd = new FormData();
    fd.set("flatId", flat.id);
    fd.set("status", status);
    fd.set("buyerName", buyerName);
    startTransition(async () => {
      const res = await updateFlatStatus(fd);
      if (res.ok) {
        setToast(`${flat.flat_number} → ${STATUS_LABELS[status]}`);
        setSelected({ ...flat, status, buyer_name: buyerName || (status === "available" ? null : flat.buyer_name) });
      } else {
        setToast(`Error: ${res.error}`);
      }
      setTimeout(() => setToast(null), 2600);
    });
  }

  return (
    <div className="p-5 sm:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 style={{ fontSize: "1.6rem", fontWeight: 700, color: "#1d1d1f", letterSpacing: "-0.02em" }}>
          Inventory Management
        </h1>
        <p className="mt-1" style={{ fontSize: "0.9rem", color: "rgba(0,0,0,0.5)" }}>
          Live unit availability across every tower — click a unit to update its status.
        </p>
      </div>

      {/* Project tabs */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        {projects.map((p, i) => (
          <button
            key={p.id}
            onClick={() => { setProjectIdx(i); setTowerIdx(0); setSelected(null); }}
            className="px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap shrink-0 transition-all"
            style={
              projectIdx === i
                ? { background: "#1d1d1f", color: "#fff" }
                : { background: "#fff", color: "rgba(0,0,0,0.6)", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }
            }
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
        {[
          { label: "Total Units", value: String(kpi.total), color: "#1d1d1f" },
          { label: "Available", value: String(kpi.available), color: STATUS_COLORS.available },
          { label: "Reserved", value: String(kpi.reserved), color: STATUS_COLORS.reserved },
          { label: "Sold", value: String(kpi.sold), color: STATUS_COLORS.sold },
          { label: "Value Sold", value: inrShort(kpi.valueSold), color: "#1d1d1f" },
          { label: "Available Value", value: inrShort(kpi.valueAvailable), color: "#1d1d1f" },
        ].map((k) => (
          <div key={k.label} className="rounded-2xl p-4" style={{ background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: "1.2rem", fontWeight: 700, color: k.color }}>{k.value}</div>
            <div style={{ fontSize: "0.7rem", color: "rgba(0,0,0,0.46)", marginTop: 2 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Sell-through bar */}
      <div className="rounded-2xl p-4 mb-5" style={{ background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <div className="flex items-center justify-between mb-2">
          <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1d1d1f" }}>Sell-through</span>
          <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#0071e3" }}>{kpi.pctSold}% sold</span>
        </div>
        <div className="flex h-3 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.05)" }}>
          {STATUS_ORDER.map((s) => {
            const count = s === "available" ? kpi.available : s === "reserved" ? kpi.reserved : s === "sold" ? kpi.sold : s === "held" ? kpi.held : kpi.discussion;
            const w = kpi.total ? (count / kpi.total) * 100 : 0;
            return w > 0 ? <div key={s} style={{ width: `${w}%`, background: STATUS_COLORS[s] }} title={`${STATUS_LABELS[s]}: ${count}`} /> : null;
          })}
        </div>
      </div>

      {/* View mode toggle */}
      <div className="flex gap-1.5 mb-4">
        <button onClick={() => setViewMode("status")}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
          style={viewMode === "status" ? { background: "#1d1d1f", color: "#fff" } : { background: "#fff", color: "rgba(0,0,0,0.6)", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <Grid3x3 className="w-3.5 h-3.5" /> Status View
        </button>
        <button onClick={() => setViewMode("heatmap")}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
          style={viewMode === "heatmap" ? { background: "#ea580c", color: "#fff" } : { background: "#fff", color: "rgba(0,0,0,0.6)", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <Flame className="w-3.5 h-3.5" /> Demand Heatmap
        </button>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2.5 mb-4">
        {/* Tower chips */}
        {project && project.towers.length > 1 && (
          <div className="flex gap-1.5">
            {project.towers.map((t, i) => (
              <button
                key={t.id}
                onClick={() => { setTowerIdx(i); setSelected(null); }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all"
                style={towerIdx === i ? { background: "#0071e3", color: "#fff" } : { background: "#fff", color: "rgba(0,0,0,0.6)", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
              >
                <Building2 className="w-3.5 h-3.5" />
                {t.name}
              </button>
            ))}
          </div>
        )}
        {/* Search */}
        <div className="relative flex-1 min-w-44">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "rgba(0,0,0,0.38)" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Find a unit number…"
            className="w-full pl-9 pr-3 py-2 rounded-xl outline-none text-sm"
            style={{ background: "#fff", border: "1.5px solid rgba(0,0,0,0.07)" }}
          />
        </div>
        {/* Status legend / filter */}
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setStatusFilter("all")}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium"
            style={statusFilter === "all" ? { background: "#1d1d1f", color: "#fff" } : { background: "#fff", color: "rgba(0,0,0,0.55)", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
          >
            All
          </button>
          {STATUS_ORDER.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(statusFilter === s ? "all" : s)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium"
              style={statusFilter === s ? { background: STATUS_COLORS[s], color: "#fff" } : { background: "#fff", color: "rgba(0,0,0,0.55)", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
            >
              <span className="w-2 h-2 rounded-sm" style={{ background: statusFilter === s ? "#fff" : STATUS_COLORS[s] }} />
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Stacking plan */}
      <div className="rounded-2xl p-4 overflow-x-auto" style={{ background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        {viewMode === "heatmap" && (
          <div className="flex items-center gap-3 mb-4 pb-3" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
            <Flame className="w-4 h-4" style={{ color: "#ea580c", flexShrink: 0 }} />
            <span style={{ fontSize: "0.78rem", color: "rgba(0,0,0,0.55)" }}>Color = floor sell-through</span>
            <div className="flex items-center gap-1.5 ml-auto">
              {[0, 25, 50, 75, 100].map((p) => (
                <div key={p} className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded" style={{ background: heatColor(p) }} />
                  <span style={{ fontSize: "0.65rem", color: "rgba(0,0,0,0.4)" }}>{p}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {floors.length === 0 ? (
          <div className="py-16 text-center" style={{ color: "rgba(0,0,0,0.35)" }}>
            <Layers className="w-9 h-9 mx-auto mb-3 opacity-30" />
            <p style={{ fontSize: "0.9rem" }}>No units in this tower</p>
          </div>
        ) : (
          <div style={{ minWidth: maxCols * 78 + (viewMode === "heatmap" ? 130 : 56) }}>
            {floors.map(({ floor, flats }, idx) => {
              const stats = floorStats[idx];
              const isHot = hotFloor?.floor === floor && stats.pctSold > 50;
              return (
                <div key={floor} className="flex items-center gap-1.5 mb-1.5">
                  {/* Floor label */}
                  <div className="shrink-0 flex flex-col items-center justify-center rounded-lg gap-0.5"
                    style={{ width: viewMode === "heatmap" ? 80 : 44, height: 52, background: viewMode === "heatmap" ? heatColor(stats.pctSold) : "#f0f0f2" }}>
                    <span style={{ fontSize: "0.7rem", fontWeight: 700, color: viewMode === "heatmap" ? "#fff" : "rgba(0,0,0,0.45)" }}>
                      {isHot ? "🔥 " : ""}L{floor}
                    </span>
                    {viewMode === "heatmap" && (
                      <span style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.85)", fontWeight: 600 }}>{stats.pctSold}% sold</span>
                    )}
                  </div>
                  {flats.map((f) => {
                    const dim = cellDim(f);
                    const isSel = selected?.id === f.id;
                    const bg = viewMode === "heatmap"
                      ? (f.status === "sold" ? "#b91c1c" : f.status === "reserved" ? "#92400e" : f.status === "available" ? "#15803d" : STATUS_COLORS[f.status])
                      : STATUS_COLORS[f.status];
                    return (
                      <button
                        key={f.id}
                        onClick={() => { setSelected(f); setBuyerName(f.buyer_name ?? ""); }}
                        className="shrink-0 rounded-lg flex flex-col items-center justify-center transition-all"
                        style={{
                          width: 72,
                          height: 52,
                          background: bg,
                          opacity: dim ? 0.18 : 1,
                          outline: isSel ? "2.5px solid #1d1d1f" : "none",
                          outlineOffset: 1,
                          cursor: "pointer",
                        }}
                      >
                        <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "#fff" }}>{f.flat_number}</span>
                        <span style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.85)" }}>
                          {FLAT_TYPE_LABELS[f.flat_type] ?? f.flat_type}
                        </span>
                      </button>
                    );
                  })}
                  {/* Per-floor stats bar (heatmap mode only) */}
                  {viewMode === "heatmap" && (
                    <div className="shrink-0 ml-2 flex items-center gap-2 pl-2" style={{ borderLeft: "1px solid rgba(0,0,0,0.06)" }}>
                      <div className="text-right">
                        <div style={{ fontSize: "0.72rem", fontWeight: 700, color: heatColor(stats.pctSold) }}>{stats.sold + stats.reserved}/{stats.total}</div>
                        <div style={{ fontSize: "0.6rem", color: "rgba(0,0,0,0.4)" }}>sold+res</div>
                      </div>
                      <div className="text-right">
                        <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#1cc77f" }}>{stats.available}</div>
                        <div style={{ fontSize: "0.6rem", color: "rgba(0,0,0,0.4)" }}>avail</div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Demand analytics (heatmap mode) */}
      {viewMode === "heatmap" && typeStats.length > 0 && (
        <div className="mt-4 rounded-2xl p-5" style={{ background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4" style={{ color: "#0071e3" }} />
            <h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: "#1d1d1f" }}>Demand by Unit Type</h3>
            {hotFloor && (
              <span className="ml-auto flex items-center gap-1 px-2.5 py-1 rounded-full" style={{ background: "rgba(234,88,12,0.1)", color: "#ea580c", fontSize: "0.72rem", fontWeight: 700 }}>
                🔥 Floor {hotFloor.floor} hottest ({hotFloor.pctSold}% sold)
              </span>
            )}
          </div>
          <div className="space-y-3">
            {typeStats.map((t) => (
              <div key={t.type}>
                <div className="flex justify-between mb-1" style={{ fontSize: "0.78rem" }}>
                  <span style={{ fontWeight: 600, color: "#1d1d1f" }}>{FLAT_TYPE_LABELS[t.type as keyof typeof FLAT_TYPE_LABELS] ?? t.type}</span>
                  <span style={{ color: "rgba(0,0,0,0.5)" }}>{t.sold}/{t.total} · <span style={{ fontWeight: 700, color: heatColor(t.pct) }}>{t.pct}%</span></span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.05)" }}>
                  <div style={{ width: `${t.pct}%`, height: "100%", background: heatColor(t.pct), borderRadius: 999, transition: "width 0.5s" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detail / status drawer */}
      {selected && (
        <>
          <div className="fixed inset-0 z-40" style={{ background: "rgba(0,0,0,0.35)" }} onClick={() => setSelected(null)} />
          <aside
            className="fixed top-0 right-0 bottom-0 z-50 w-full sm:w-[400px] overflow-y-auto"
            style={{ background: "#fff", boxShadow: "-8px 0 40px rgba(0,0,0,0.2)" }}
          >
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#1d1d1f" }}>Unit {selected.flat_number}</h2>
              <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg" style={{ background: "#f0f0f2" }}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Status banner */}
              <div className="rounded-2xl p-4 flex items-center justify-between" style={{ background: STATUS_COLORS[selected.status] }}>
                <div>
                  <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.8)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Current Status
                  </div>
                  <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "#fff" }}>{STATUS_LABELS[selected.status]}</div>
                </div>
                <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "#fff" }}>{inrShort(selected.total_price)}</div>
              </div>

              {/* Specs */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Building2, label: "Type", value: FLAT_TYPE_LABELS[selected.flat_type] ?? selected.flat_type },
                  { icon: Layers, label: "Floor", value: `Level ${selected.floor}` },
                  { icon: Maximize2, label: "Carpet Area", value: `${selected.carpet_area_sqft} sq.ft` },
                  { icon: Compass, label: "Facing", value: selected.facing ?? "—" },
                ].map((s) => {
                  const Icon = s.icon;
                  return (
                    <div key={s.label} className="rounded-xl p-3" style={{ background: "#f7f7f8" }}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <Icon className="w-3 h-3" style={{ color: "rgba(0,0,0,0.4)" }} />
                        <span style={{ fontSize: "0.66rem", color: "rgba(0,0,0,0.45)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{s.label}</span>
                      </div>
                      <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1d1d1f" }}>{s.value}</div>
                    </div>
                  );
                })}
              </div>

              <div className="rounded-xl p-3" style={{ background: "#f7f7f8" }}>
                <div style={{ fontSize: "0.78rem", color: "rgba(0,0,0,0.5)" }}>Total Price</div>
                <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "#1d1d1f" }}>{inrFull(selected.total_price)}</div>
              </div>

              {/* Buyer name */}
              <div>
                <label className="flex items-center gap-1.5 mb-1.5" style={{ fontSize: "0.74rem", fontWeight: 600, color: "rgba(0,0,0,0.55)" }}>
                  <User className="w-3.5 h-3.5" /> Buyer name (for Sold / Reserved)
                </label>
                <input
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  placeholder="Enter buyer name"
                  className="w-full px-3 py-2 rounded-xl outline-none text-sm"
                  style={{ background: "#f7f7f8", border: "1.5px solid rgba(0,0,0,0.07)" }}
                />
              </div>

              {/* Status changer */}
              <div>
                <div style={{ fontSize: "0.74rem", fontWeight: 600, color: "rgba(0,0,0,0.55)", marginBottom: 8 }}>
                  Change status
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {STATUS_ORDER.map((s) => {
                    const isCurrent = s === selected.status;
                    return (
                      <button
                        key={s}
                        disabled={pending || isCurrent}
                        onClick={() => changeStatus(selected, s)}
                        className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all"
                        style={{
                          background: isCurrent ? "#f0f0f2" : STATUS_COLORS[s],
                          color: isCurrent ? "rgba(0,0,0,0.4)" : "#fff",
                          opacity: pending ? 0.6 : 1,
                          cursor: isCurrent ? "default" : "pointer",
                        }}
                      >
                        {isCurrent && <Check className="w-3 h-3" />}
                        {STATUS_LABELS[s]}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </aside>
        </>
      )}

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] px-4 py-2.5 rounded-xl"
          style={{ background: "#1d1d1f", color: "#fff", fontSize: "0.82rem", boxShadow: "0 8px 30px rgba(0,0,0,0.3)" }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}
