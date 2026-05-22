"use client";

import type { FlatType, FlatStatus } from "@/lib/types";
import { FLAT_TYPE_LABELS, STATUS_LABELS } from "@/lib/types";
import { SlidersHorizontal, X } from "lucide-react";

export interface FilterState {
  flatType: FlatType[];
  status: FlatStatus[];
  minFloor: number;
  maxFloor: number;
  minPrice: number;
  maxPrice: number;
  facing: string[];
}

interface Props {
  filters: FilterState;
  onChange: (f: FilterState) => void;
  totalFloors: number;
  maxPrice: number;
  onClose?: () => void;
}

const FLAT_TYPE_OPTIONS: FlatType[] = ["studio", "1bhk", "2bhk", "3bhk", "4bhk", "penthouse"];
const STATUS_OPTIONS: FlatStatus[] = ["available", "reserved", "discussion"];
const FACING_OPTIONS = ["North", "South", "East", "West", "North-East", "South-East"];

const sectionHeadStyle: React.CSSProperties = {
  fontSize: "0.75rem",
  fontWeight: 600,
  color: "rgba(0,0,0,0.42)",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  marginBottom: 10,
};

function ChipButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="transition-all rounded-pill text-micro"
      style={{
        padding: "5px 12px",
        background: active ? "#0071e3" : "#f5f5f7",
        color: active ? "#ffffff" : "rgba(0,0,0,0.7)",
        border: active ? "1px solid #0071e3" : "1px solid rgba(0,0,0,0.1)",
        fontWeight: active ? 500 : 400,
      }}
    >
      {label}
    </button>
  );
}

export default function FlatFilters({ filters, onChange, totalFloors, maxPrice, onClose }: Props) {
  const toggle = <T,>(arr: T[], val: T): T[] =>
    arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];

  const activeCount = filters.flatType.length + filters.status.length + filters.facing.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2" style={{ color: "#1d1d1f" }}>
          <SlidersHorizontal className="w-4 h-4" style={{ color: "#0071e3" }} />
          <span className="text-caption font-semibold">Filters</span>
          {activeCount > 0 && (
            <span
              className="text-micro px-1.5 py-0.5 rounded-pill"
              style={{ background: "rgba(0,113,227,0.1)", color: "#0071e3" }}
            >
              {activeCount}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {activeCount > 0 && (
            <button
              onClick={() =>
                onChange({ flatType: [], status: [], minFloor: 1, maxFloor: totalFloors, minPrice: 0, maxPrice, facing: [] })
              }
              className="text-micro"
              style={{ color: "#0066cc" }}
            >
              Clear all
            </button>
          )}
          {onClose && (
            <button onClick={onClose} style={{ color: "rgba(0,0,0,0.4)" }}>
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Flat Type */}
      <div>
        <div style={sectionHeadStyle}>Configuration</div>
        <div className="flex flex-wrap gap-2">
          {FLAT_TYPE_OPTIONS.map((b) => (
            <ChipButton
              key={b}
              active={filters.flatType.includes(b)}
              onClick={() => onChange({ ...filters, flatType: toggle(filters.flatType, b) })}
              label={FLAT_TYPE_LABELS[b]}
            />
          ))}
        </div>
      </div>

      {/* Status */}
      <div>
        <div style={sectionHeadStyle}>Availability</div>
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((s) => (
            <ChipButton
              key={s}
              active={filters.status.includes(s)}
              onClick={() => onChange({ ...filters, status: toggle(filters.status, s) })}
              label={STATUS_LABELS[s]}
            />
          ))}
        </div>
      </div>

      {/* Floor range */}
      <div>
        <div style={sectionHeadStyle}>Floor Range</div>
        <div
          className="flex justify-between text-micro mb-2"
          style={{ color: "rgba(0,0,0,0.56)" }}
        >
          <span>Floor {filters.minFloor}</span>
          <span>Floor {filters.maxFloor}</span>
        </div>
        <div className="flex flex-col gap-2">
          <input
            type="range"
            min={1}
            max={totalFloors}
            value={filters.minFloor}
            onChange={(e) =>
              onChange({ ...filters, minFloor: Math.min(Number(e.target.value), filters.maxFloor - 1) })
            }
            className="w-full"
            style={{ accentColor: "#0071e3" }}
          />
          <input
            type="range"
            min={1}
            max={totalFloors}
            value={filters.maxFloor}
            onChange={(e) =>
              onChange({ ...filters, maxFloor: Math.max(Number(e.target.value), filters.minFloor + 1) })
            }
            className="w-full"
            style={{ accentColor: "#0071e3" }}
          />
        </div>
      </div>

      {/* Budget */}
      <div>
        <div style={sectionHeadStyle}>Budget</div>
        <div className="text-micro mb-2" style={{ color: "rgba(0,0,0,0.56)" }}>
          Up to ₹{(filters.maxPrice / 10000000).toFixed(1)} Cr
        </div>
        <input
          type="range"
          min={0}
          max={maxPrice}
          step={500000}
          value={filters.maxPrice}
          onChange={(e) => onChange({ ...filters, maxPrice: Number(e.target.value) })}
          className="w-full"
          style={{ accentColor: "#0071e3" }}
        />
        <div className="flex justify-between text-micro mt-1" style={{ color: "rgba(0,0,0,0.38)" }}>
          <span>₹0</span>
          <span>₹{(maxPrice / 10000000).toFixed(1)} Cr</span>
        </div>
      </div>

      {/* Facing */}
      <div>
        <div style={sectionHeadStyle}>Facing</div>
        <div className="flex flex-wrap gap-2">
          {FACING_OPTIONS.map((d) => (
            <ChipButton
              key={d}
              active={filters.facing.includes(d)}
              onClick={() => onChange({ ...filters, facing: toggle(filters.facing, d) })}
              label={d}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function applyFilters(flats: import("@/lib/types").Flat[], f: FilterState) {
  return flats.filter((flat) => {
    if (f.flatType.length > 0 && !f.flatType.includes(flat.flat_type)) return false;
    if (f.status.length > 0 && !f.status.includes(flat.status)) return false;
    if (flat.floor < f.minFloor || flat.floor > f.maxFloor) return false;
    if (flat.total_price > f.maxPrice) return false;
    if (f.facing.length > 0 && flat.facing && !f.facing.includes(flat.facing)) return false;
    return true;
  });
}
