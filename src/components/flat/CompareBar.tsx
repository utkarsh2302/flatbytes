"use client";

import type { Flat } from "@/lib/types";
import { FLAT_TYPE_LABELS } from "@/lib/types";
import { X, GitCompare } from "lucide-react";

interface Props {
  flats: Flat[];
  onRemove: (id: string) => void;
  onCompare: () => void;
  onClear: () => void;
}

export default function CompareBar({ flats, onRemove, onCompare, onClear }: Props) {
  const canCompare = flats.length >= 2;

  return (
    <div
      className="shrink-0 flex items-center gap-3 px-5 py-3"
      style={{
        background: "#1d1d1f",
        borderTop: "1px solid rgba(255,255,255,0.1)",
        zIndex: 30,
      }}
    >
      <div className="flex items-center gap-2 mr-1">
        <GitCompare className="w-4 h-4" style={{ color: "#0071e3" }} />
        <span className="text-micro font-semibold text-white/80">Compare</span>
      </div>

      {/* Flat slots */}
      <div className="flex items-center gap-2 flex-1 overflow-x-auto">
        {flats.map((flat) => (
          <div
            key={flat.id}
            className="flex items-center gap-2 shrink-0 rounded-standard px-3 py-1.5"
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
          >
            <div>
              <div className="text-micro font-semibold text-white leading-tight">
                {flat.flat_number}
              </div>
              <div className="text-[10px] text-white/50 leading-tight">
                {FLAT_TYPE_LABELS[flat.flat_type]} · Fl {flat.floor}
              </div>
            </div>
            <button
              onClick={() => onRemove(flat.id)}
              className="text-white/40 hover:text-white/80 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}

        {/* Empty slots */}
        {Array.from({ length: Math.max(0, 3 - flats.length) }).map((_, i) => (
          <div
            key={i}
            className="shrink-0 w-24 h-10 rounded-standard flex items-center justify-center text-[10px]"
            style={{ border: "1.5px dashed rgba(255,255,255,0.14)", color: "rgba(255,255,255,0.28)" }}
          >
            + Add flat
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onClear}
          className="text-micro text-white/40 hover:text-white/70 transition-colors px-2"
          style={{ background: "none", border: "none", cursor: "pointer" }}
        >
          Clear
        </button>
        <button
          onClick={onCompare}
          disabled={!canCompare}
          className="flex items-center gap-1.5 px-4 py-2 rounded-standard text-micro font-semibold transition-all"
          style={
            canCompare
              ? { background: "#0071e3", color: "#fff", cursor: "pointer" }
              : { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.28)", cursor: "not-allowed" }
          }
        >
          <GitCompare className="w-3.5 h-3.5" />
          Compare {flats.length >= 2 ? `(${flats.length})` : ""}
        </button>
      </div>
    </div>
  );
}
