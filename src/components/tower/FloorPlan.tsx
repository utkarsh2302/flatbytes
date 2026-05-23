"use client";

import type { Flat, FlatStatus } from "@/lib/types";
import { STATUS_LABELS, FLAT_TYPE_LABELS } from "@/lib/types";
import StatusBadge from "@/components/ui/StatusBadge";

function fmtPrice(p: number) {
  if (p >= 10000000) return `₹${(p / 10000000).toFixed(1)}Cr`;
  if (p >= 100000) return `₹${(p / 100000).toFixed(0)}L`;
  return `₹${p.toLocaleString("en-IN")}`;
}

interface Props {
  flats: Flat[];
  floor: number;
  totalFloors: number;
  onFlatSelect: (flat: Flat) => void;
  onFloorChange: (floor: number) => void;
  selectedFlatId?: string;
}

const LIGHT_STATUS: Record<FlatStatus, { bg: string; border: string; text: string }> = {
  available:  { bg: "rgba(52,199,89,0.08)",   border: "rgba(52,199,89,0.3)",   text: "#1a7f4a" },
  sold:       { bg: "rgba(255,59,48,0.08)",   border: "rgba(255,59,48,0.3)",   text: "#d70015" },
  reserved:   { bg: "rgba(255,149,0,0.08)",   border: "rgba(255,149,0,0.3)",   text: "#c25000" },
  held:       { bg: "rgba(168,85,247,0.08)",  border: "rgba(168,85,247,0.3)",  text: "#6c28d9" },
  discussion: { bg: "rgba(0,113,227,0.08)",   border: "rgba(0,113,227,0.3)",   text: "#0055b3" },
};

const FLAT_W = 124;
const FLAT_H = 96;
const COLS = 2;
const GAP = 12;

export default function FloorPlan({
  flats, floor, totalFloors, onFlatSelect, onFloorChange, selectedFlatId,
}: Props) {
  const floorFlats = flats.filter((f) => f.floor === floor);

  return (
    <div className="flex flex-col h-full">
      {/* Floor selector */}
      <div className="flex items-center gap-1.5 mb-5 overflow-x-auto pb-1">
        {Array.from({ length: totalFloors }, (_, i) => i + 1)
          .reverse()
          .map((f) => (
            <button
              key={f}
              onClick={() => onFloorChange(f)}
              className="shrink-0 w-9 h-9 rounded-standard text-caption transition-all"
              style={
                f === floor
                  ? { background: "#0071e3", color: "#fff", fontWeight: 600 }
                  : { background: "#ffffff", color: "rgba(0,0,0,0.56)", border: "1px solid rgba(0,0,0,0.1)" }
              }
            >
              {f}
            </button>
          ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mb-5 overflow-x-auto pb-0.5" style={{ scrollbarWidth: "none" }}>
        {(["available", "sold", "reserved", "discussion"] as FlatStatus[]).map((s) => (
          <StatusBadge key={s} status={s} size="sm" />
        ))}
      </div>

      {/* Floor summary strip */}
      {floorFlats.length > 0 && (() => {
        const avail = floorFlats.filter(f => f.status === "available").length;
        const sold = floorFlats.filter(f => f.status === "sold").length;
        const res = floorFlats.filter(f => f.status === "reserved").length;
        const prices = floorFlats.filter(f => f.total_price > 0).map(f => f.total_price);
        const minP = prices.length ? Math.min(...prices) : 0;
        const maxP = prices.length ? Math.max(...prices) : 0;
        return (
          <div className="flex items-center gap-2.5 mb-4 px-3.5 py-2 rounded-standard overflow-x-auto" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.06)", scrollbarWidth: "none", flexShrink: 0, minHeight: 36 }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#1d1d1f", whiteSpace: "nowrap" }}>Floor {floor}</span>
            <span style={{ width: 1, height: 12, background: "rgba(0,0,0,0.12)", flexShrink: 0 }} />
            {avail > 0 && <span style={{ fontSize: "0.75rem", color: "#1a7f4a", fontWeight: 600, whiteSpace: "nowrap" }}>{avail} Available</span>}
            {sold > 0 && <span style={{ fontSize: "0.75rem", color: "#d70015", fontWeight: 600, whiteSpace: "nowrap" }}>{sold} Sold</span>}
            {res > 0 && <span style={{ fontSize: "0.75rem", color: "#c25000", fontWeight: 600, whiteSpace: "nowrap" }}>{res} Reserved</span>}
            <span style={{ width: 1, height: 12, background: "rgba(0,0,0,0.12)", flexShrink: 0 }} />
            <span style={{ fontSize: "0.75rem", color: "rgba(0,0,0,0.45)", whiteSpace: "nowrap", fontStyle: "italic" }}>Price on request</span>
          </div>
        );
      })()}

      {/* Floor grid */}
      <div className="flex-1 overflow-auto">
        {floorFlats.length === 0 ? (
          <div
            className="flex items-center justify-center h-40 rounded-large text-caption"
            style={{ background: "#ffffff", color: "rgba(0,0,0,0.32)" }}
          >
            No data for Floor {floor}
          </div>
        ) : (
          <div className="flex justify-center">
            <div
              className="relative rounded-large overflow-hidden"
              style={{
                background: "#ffffff",
                padding: 24,
                boxShadow: "rgba(0,0,0,0.12) 0px 2px 16px 0px",
                border: "1px solid rgba(0,0,0,0.06)",
              }}
            >
              {/* Floor label */}
              <div
                className="absolute top-3 right-4 text-micro"
                style={{ color: "rgba(0,0,0,0.35)", fontWeight: 500 }}
              >
                Floor {floor}
              </div>

              {/* Corridor line */}
              <div
                className="absolute left-1/2 -translate-x-px"
                style={{ top: 24, bottom: 24, width: 1, background: "rgba(0,0,0,0.08)" }}
              />
              <div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-micro select-none"
                style={{
                  color: "rgba(0,0,0,0.2)",
                  transform: "translateX(-50%) translateY(-50%) rotate(90deg)",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                }}
              >
                Corridor
              </div>

              {/* Flat cells */}
              <div
                className="grid"
                style={{
                  gridTemplateColumns: `repeat(${COLS}, ${FLAT_W}px)`,
                  gap: GAP,
                }}
              >
                {floorFlats.map((flat) => {
                  const s = LIGHT_STATUS[flat.status];
                  const isSelected = flat.id === selectedFlatId;
                  return (
                    <button
                      key={flat.id}
                      onClick={() => onFlatSelect(flat)}
                      className="relative rounded-standard text-left p-3 transition-all hover:scale-[1.03]"
                      style={{
                        width: FLAT_W,
                        height: FLAT_H,
                        background: isSelected ? s.bg.replace("0.08", "0.18") : s.bg,
                        border: `1.5px solid ${isSelected ? s.border.replace("0.3", "0.7") : s.border}`,
                        boxShadow: isSelected ? `0 0 0 3px ${s.border}` : "none",
                      }}
                    >
                      <div className="text-micro font-semibold mb-1" style={{ color: s.text }}>
                        {flat.flat_number}
                      </div>
                      <div className="text-micro font-medium" style={{ color: "#1d1d1f" }}>
                        {FLAT_TYPE_LABELS[flat.flat_type]}
                      </div>
                      <div style={{ fontSize: "0.6875rem", color: "rgba(0,0,0,0.42)", marginTop: 2 }}>
                        {flat.carpet_area_sqft} sq.ft
                      </div>
                      <div style={{ fontSize: "0.6875rem", fontWeight: 600, color: s.text, marginTop: 3 }}>
                        On Request
                      </div>
                      {flat.facing && (
                        <div
                          className="absolute bottom-2 right-2"
                          style={{ fontSize: "0.625rem", color: s.text, opacity: 0.7 }}
                        >
                          {facingArrow(flat.facing)}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function facingArrow(facing: string): string {
  const m: Record<string, string> = {
    North: "↑N", South: "↓S", East: "→E", West: "←W",
    "North-East": "↗NE", "North-West": "↖NW", "South-East": "↘SE", "South-West": "↙SW",
    "north": "↑N", "south": "↓S", "east": "→E", "west": "←W",
    "north_east": "↗NE", "north_west": "↖NW", "south_east": "↘SE", "south_west": "↙SW",
  };
  return m[facing] ?? facing.charAt(0).toUpperCase();
}
