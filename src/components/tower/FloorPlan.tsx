"use client";

import type { Flat, FlatStatus } from "@/lib/types";
import { FLAT_TYPE_LABELS } from "@/lib/types";
import StatusBadge from "@/components/ui/StatusBadge";

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

export default function FloorPlan({
  flats, floor, totalFloors, onFlatSelect, onFloorChange, selectedFlatId,
}: Props) {
  const floorFlats = flats.filter((f) => f.floor === floor);

  // Determine column count based on flat count — always fills screen width
  const cols = floorFlats.length <= 2 ? 2
    : floorFlats.length <= 6 ? 3
    : 4;

  return (
    <div className="flex flex-col h-full">
      {/* Floor selector */}
      <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
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
      <div className="flex items-center gap-3 mb-4 overflow-x-auto pb-0.5" style={{ scrollbarWidth: "none" }}>
        {(["available", "sold", "reserved", "held", "discussion"] as FlatStatus[]).map((s) => (
          <StatusBadge key={s} status={s} size="sm" />
        ))}
      </div>

      {/* Floor summary strip */}
      {floorFlats.length > 0 && (() => {
        const avail = floorFlats.filter(f => f.status === "available").length;
        const sold  = floorFlats.filter(f => f.status === "sold").length;
        const res   = floorFlats.filter(f => f.status === "reserved").length;
        const disc  = floorFlats.filter(f => f.status === "discussion").length;
        const held  = floorFlats.filter(f => f.status === "held").length;
        return (
          <div
            className="flex items-center gap-2.5 mb-4 px-3.5 py-2 rounded-standard overflow-x-auto"
            style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.06)", flexShrink: 0, scrollbarWidth: "none" }}
          >
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#1d1d1f", flexShrink: 0 }}>Floor {floor}</span>
            <span style={{ width: 1, height: 12, background: "rgba(0,0,0,0.12)", flexShrink: 0 }} />
            {avail > 0 && <span style={{ fontSize: "0.75rem", color: "#1a7f4a", fontWeight: 600, flexShrink: 0 }}>{avail} Available</span>}
            {sold  > 0 && <span style={{ fontSize: "0.75rem", color: "#d70015", fontWeight: 600, flexShrink: 0 }}>{sold} Sold</span>}
            {res   > 0 && <span style={{ fontSize: "0.75rem", color: "#c25000", fontWeight: 600, flexShrink: 0 }}>{res} Reserved</span>}
            {disc  > 0 && <span style={{ fontSize: "0.75rem", color: "#0055b3", fontWeight: 600, flexShrink: 0 }}>{disc} In Discussion</span>}
            {held  > 0 && <span style={{ fontSize: "0.75rem", color: "#6c28d9", fontWeight: 600, flexShrink: 0 }}>{held} Held</span>}
            <span style={{ width: 1, height: 12, background: "rgba(0,0,0,0.12)", flexShrink: 0 }} />
            <span style={{ fontSize: "0.75rem", color: "rgba(0,0,0,0.45)", fontStyle: "italic", flexShrink: 0 }}>Pricing on request</span>
          </div>
        );
      })()}

      {/* Floor grid — fluid, fills available width */}
      <div className="flex-1">
        {floorFlats.length === 0 ? (
          <div
            className="flex items-center justify-center h-40 rounded-large text-caption"
            style={{ background: "#ffffff", color: "rgba(0,0,0,0.32)" }}
          >
            No data for Floor {floor}
          </div>
        ) : (
          <div
            className="relative rounded-2xl overflow-hidden w-full"
            style={{
              background: "#ffffff",
              padding: 14,
              boxShadow: "0 2px 16px rgba(0,0,0,0.08)",
              border: "1px solid rgba(0,0,0,0.06)",
            }}
          >
            {/* Floor label */}
            <div
              className="absolute top-2.5 right-3 text-micro"
              style={{ color: "rgba(0,0,0,0.3)", fontWeight: 500, zIndex: 1 }}
            >
              Floor {floor}
            </div>

            {/* Corridor divider — only when 2 even columns */}
            {cols === 2 && (
              <>
                <div
                  className="absolute left-1/2 -translate-x-px"
                  style={{ top: 14, bottom: 14, width: 1, background: "rgba(0,0,0,0.07)" }}
                />
                <div
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none"
                  style={{
                    color: "rgba(0,0,0,0.15)",
                    fontSize: "0.6rem",
                    fontWeight: 600,
                    transform: "translateX(-50%) translateY(-50%) rotate(90deg)",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    whiteSpace: "nowrap",
                    zIndex: 0,
                  }}
                >
                  Corridor
                </div>
              </>
            )}

            {/* Fluid grid — tiles fill the screen, no fixed widths */}
            <div
              className="grid w-full"
              style={{
                gridTemplateColumns: `repeat(${cols}, 1fr)`,
                gap: 10,
              }}
            >
              {floorFlats.map((flat) => {
                const s = LIGHT_STATUS[flat.status];
                const isSelected = flat.id === selectedFlatId;
                return (
                  <button
                    key={flat.id}
                    onClick={() => onFlatSelect(flat)}
                    className="relative rounded-xl text-left transition-all active:scale-95"
                    style={{
                      padding: "10px 10px 24px",
                      minHeight: 88,
                      background: isSelected ? s.bg.replace("0.08", "0.18") : s.bg,
                      border: `1.5px solid ${isSelected ? s.border.replace("0.3", "0.7") : s.border}`,
                      boxShadow: isSelected ? `0 0 0 2px ${s.border}` : "none",
                      width: "100%",
                    }}
                  >
                    <div style={{ fontSize: "0.72rem", fontWeight: 700, color: s.text, marginBottom: 2 }}>
                      {flat.flat_number}
                    </div>
                    <div style={{ fontSize: "0.7rem", fontWeight: 600, color: "#1d1d1f", lineHeight: 1.2 }}>
                      {FLAT_TYPE_LABELS[flat.flat_type]}
                    </div>
                    <div style={{ fontSize: "0.65rem", color: "rgba(0,0,0,0.42)", marginTop: 2 }}>
                      {flat.carpet_area_sqft} sq.ft
                    </div>
                    <div style={{ fontSize: "0.62rem", fontWeight: 600, color: s.text, marginTop: 2 }}>
                      On Request
                    </div>
                    {flat.facing && (
                      <div
                        className="absolute bottom-2 right-2"
                        style={{ fontSize: "0.6rem", color: s.text, opacity: 0.65 }}
                      >
                        {facingArrow(flat.facing)}
                      </div>
                    )}
                  </button>
                );
              })}
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
