"use client";

import { useState, useMemo } from "react";
import type { BrokerInventoryFlat } from "@/lib/broker";
import { FLAT_TYPE_LABELS } from "@/lib/types";
import { Search, SlidersHorizontal, Star, Share2, MessageCircle, X } from "lucide-react";

interface Props {
  flats: BrokerInventoryFlat[];
  brokerId: string;
  brokerName: string;
  commissionPct: number;
}

const TYPE_OPTS = ["studio", "1bhk", "2bhk", "3bhk", "4bhk", "penthouse"];

function formatPrice(p: number) {
  if (p >= 10000000) return `₹${(p / 10000000).toFixed(2)} Cr`;
  return `₹${(p / 100000).toFixed(0)}L`;
}

export default function BrokerInventoryClient({ flats, brokerId, brokerName, commissionPct }: Props) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<"price_asc" | "price_desc" | "area_desc">("price_asc");
  const [reserveFlat, setReserveFlat] = useState<BrokerInventoryFlat | null>(null);
  const [reserveNote, setReserveNote] = useState("");
  const [reserveLoading, setReserveLoading] = useState(false);
  const [reservedIds, setReservedIds] = useState<Set<string>>(new Set());

  const priceMax = useMemo(() => Math.max(...flats.map((f) => f.total_price), 10000000), [flats]);

  const filtered = useMemo(() => {
    let list = flats.filter((f) => !reservedIds.has(f.id));
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((f) =>
        f.flat_number.toLowerCase().includes(q) ||
        f.project_name.toLowerCase().includes(q) ||
        FLAT_TYPE_LABELS[f.flat_type as keyof typeof FLAT_TYPE_LABELS]?.toLowerCase().includes(q)
      );
    }
    if (typeFilter.length > 0) list = list.filter((f) => typeFilter.includes(f.flat_type));
    if (maxPrice) list = list.filter((f) => f.total_price <= maxPrice);
    if (sortBy === "price_asc") list.sort((a, b) => a.total_price - b.total_price);
    if (sortBy === "price_desc") list.sort((a, b) => b.total_price - a.total_price);
    if (sortBy === "area_desc") list.sort((a, b) => b.carpet_area_sqft - a.carpet_area_sqft);
    return list;
  }, [flats, search, typeFilter, maxPrice, sortBy, reservedIds]);

  const commission = (price: number) => Math.round(price * commissionPct / 100);

  const waMsg = (flat: BrokerInventoryFlat) =>
    `https://wa.me/?text=${encodeURIComponent(
      `🏢 *${flat.project_name}* — Flat ${flat.flat_number}\n` +
      `📐 ${flat.carpet_area_sqft} sq.ft | ${FLAT_TYPE_LABELS[flat.flat_type as keyof typeof FLAT_TYPE_LABELS] ?? flat.flat_type}\n` +
      `🏢 Floor ${flat.floor}${flat.facing ? ` | ${flat.facing} Facing` : ""}\n` +
      `💰 *${formatPrice(flat.total_price)}*\n` +
      `\nContact me for a site visit! 📞`
    )}`;

  async function handleReserve() {
    if (!reserveFlat) return;
    setReserveLoading(true);
    await new Promise((r) => setTimeout(r, 800)); // simulate API
    setReservedIds((prev) => { const next = new Set(prev); next.add(reserveFlat!.id); return next; });
    setReserveFlat(null);
    setReserveLoading(false);
  }

  const toggleType = (t: string) => setTypeFilter((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#1d1d1f", letterSpacing: "-0.02em" }}>Live Inventory</h1>
          <p style={{ fontSize: "0.82rem", color: "rgba(0,0,0,0.48)", marginTop: 3 }}>
            {filtered.length} available units · Realtime pricing
          </p>
        </div>
        <span className="flex items-center gap-1 px-3 py-1.5 rounded-full" style={{ background: "rgba(28,199,127,0.1)", fontSize: "0.75rem", fontWeight: 600, color: "#1a7f4a" }}>
          🟢 Live
        </span>
      </div>

      {/* Filters */}
      <div className="rounded-2xl p-4 mb-5 space-y-3" style={{ background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "rgba(0,0,0,0.35)" }} />
            <input type="text" placeholder="Search project, flat, BHK…" value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: "#f5f5f7", border: "1px solid rgba(0,0,0,0.08)", color: "#1d1d1f" }} />
          </div>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-3 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: "#f5f5f7", border: "1px solid rgba(0,0,0,0.08)", color: "#1d1d1f", cursor: "pointer" }}>
            <option value="price_asc">Price ↑</option>
            <option value="price_desc">Price ↓</option>
            <option value="area_desc">Area ↓</option>
          </select>
        </div>

        <div className="flex flex-wrap gap-2">
          {TYPE_OPTS.map((t) => (
            <button key={t} onClick={() => toggleType(t)}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
              style={{
                background: typeFilter.includes(t) ? "#0071e3" : "#f5f5f7",
                color: typeFilter.includes(t) ? "#fff" : "rgba(0,0,0,0.6)",
                border: "none", cursor: "pointer"
              }}>
              {FLAT_TYPE_LABELS[t as keyof typeof FLAT_TYPE_LABELS] ?? t}
            </button>
          ))}
          {typeFilter.length > 0 && (
            <button onClick={() => setTypeFilter([])} style={{ color: "#0071e3", background: "none", border: "none", fontSize: "0.75rem", cursor: "pointer" }}>
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((flat) => (
          <div key={flat.id} className="rounded-2xl overflow-hidden" style={{ background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", transition: "box-shadow 0.2s" }}>
            {/* Header */}
            <div className="px-4 py-3 flex items-center justify-between" style={{ background: "#f5f5f7", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
              <div>
                <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "#1d1d1f" }}>
                  {flat.project_name}
                </span>
                <div style={{ fontSize: "0.72rem", color: "rgba(0,0,0,0.45)", marginTop: 1 }}>
                  {flat.tower_name ? `${flat.tower_name} · ` : ""}Flat {flat.flat_number}
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: "rgba(28,199,127,0.1)", color: "#1a7f4a" }}>
                Available
              </span>
            </div>

            {/* Body */}
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#1d1d1f" }}>{formatPrice(flat.total_price)}</div>
                  <div style={{ fontSize: "0.75rem", color: "rgba(0,0,0,0.45)", marginTop: 1 }}>
                    {flat.price_per_sqft ? `₹${Math.round(flat.price_per_sqft).toLocaleString("en-IN")}/sq.ft` : ""}
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-lg text-xs font-semibold"
                  style={{ background: "rgba(0,113,227,0.08)", color: "#0071e3" }}>
                  {FLAT_TYPE_LABELS[flat.flat_type as keyof typeof FLAT_TYPE_LABELS] ?? flat.flat_type}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3">
                {[
                  { label: "Area", value: `${flat.carpet_area_sqft} sqft` },
                  { label: "Floor", value: `Floor ${flat.floor}` },
                  { label: "Facing", value: flat.facing ?? "—" },
                ].map((d) => (
                  <div key={d.label} className="rounded-lg p-2 text-center" style={{ background: "#f5f5f7" }}>
                    <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#1d1d1f" }}>{d.value}</div>
                    <div style={{ fontSize: "0.62rem", color: "rgba(0,0,0,0.4)", marginTop: 1 }}>{d.label}</div>
                  </div>
                ))}
              </div>

              {/* Commission highlight */}
              <div className="flex items-center justify-between px-3 py-2 rounded-xl mb-3" style={{ background: "rgba(249,115,22,0.06)", border: "1px solid rgba(249,115,22,0.15)" }}>
                <span style={{ fontSize: "0.75rem", color: "rgba(0,0,0,0.5)" }}>Your commission</span>
                <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "#b35a00" }}>
                  {formatPrice(commission(flat.total_price))}
                </span>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => setReserveFlat(flat)}
                  className="py-2 rounded-xl text-xs font-semibold col-span-1"
                  style={{ background: "#0071e3", color: "#fff", border: "none", cursor: "pointer" }}>
                  <Star className="w-3.5 h-3.5 mx-auto" />
                </button>
                <a href={waMsg(flat)} target="_blank" rel="noopener noreferrer"
                  className="py-2 rounded-xl text-xs font-semibold flex items-center justify-center"
                  style={{ background: "rgba(37,211,102,0.1)", color: "#128c5e", textDecoration: "none" }}>
                  <MessageCircle className="w-3.5 h-3.5" />
                </a>
                <button onClick={() => navigator.share?.({ title: flat.project_name, text: `Flat ${flat.flat_number} – ${formatPrice(flat.total_price)}` })}
                  className="py-2 rounded-xl text-xs font-semibold"
                  style={{ background: "#f5f5f7", color: "#1d1d1f", border: "none", cursor: "pointer" }}>
                  <Share2 className="w-3.5 h-3.5 mx-auto" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-3 py-20 text-center rounded-2xl" style={{ background: "#fff" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>🏗️</div>
            <p style={{ fontSize: "0.9rem", color: "rgba(0,0,0,0.45)" }}>No flats match your filters</p>
            <button onClick={() => { setSearch(""); setTypeFilter([]); setMaxPrice(null); }}
              style={{ marginTop: 12, fontSize: "0.8rem", color: "#0071e3", background: "none", border: "none", cursor: "pointer" }}>
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Reserve Modal */}
      {reserveFlat && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setReserveFlat(null); }}>
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: "#fff" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#1d1d1f" }}>Reserve Unit</h3>
              <button onClick={() => setReserveFlat(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(0,0,0,0.4)" }}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="rounded-xl p-3 mb-4" style={{ background: "#f5f5f7" }}>
              <div style={{ fontWeight: 700, color: "#1d1d1f" }}>{reserveFlat.project_name} · Flat {reserveFlat.flat_number}</div>
              <div style={{ fontSize: "0.8rem", color: "rgba(0,0,0,0.48)", marginTop: 2 }}>
                {FLAT_TYPE_LABELS[reserveFlat.flat_type as keyof typeof FLAT_TYPE_LABELS]} · {formatPrice(reserveFlat.total_price)}
              </div>
            </div>
            <textarea placeholder="Client name and note (optional)…" value={reserveNote} onChange={(e) => setReserveNote(e.target.value)} rows={3}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none mb-4"
              style={{ background: "#f5f5f7", border: "1px solid rgba(0,0,0,0.1)", color: "#1d1d1f" }} />
            <p style={{ fontSize: "0.72rem", color: "rgba(0,0,0,0.45)", marginBottom: 12 }}>
              ⚠️ Reservation holds the unit for 48 hours. Builder will confirm.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setReserveFlat(null)}
                style={{ flex: 1, padding: "10px 0", borderRadius: 10, background: "#f5f5f7", color: "#1d1d1f", border: "none", cursor: "pointer", fontWeight: 600, fontSize: "0.85rem" }}>
                Cancel
              </button>
              <button onClick={handleReserve} disabled={reserveLoading}
                style={{ flex: 2, padding: "10px 0", borderRadius: 10, background: "#0071e3", color: "#fff", border: "none", cursor: "pointer", fontWeight: 600, fontSize: "0.85rem", opacity: reserveLoading ? 0.7 : 1 }}>
                {reserveLoading ? "Reserving…" : "Hold for 48 hrs"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
