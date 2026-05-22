"use client";

import type { Flat } from "@/lib/types";
import { FLAT_TYPE_LABELS, STATUS_LABELS } from "@/lib/types";
import StatusBadge from "@/components/ui/StatusBadge";
import { X, Check, Minus } from "lucide-react";

interface Props {
  flats: Flat[];
  projectName: string;
  onClose: () => void;
}

const formatPrice = (p: number) =>
  p >= 10000000 ? `₹${(p / 10000000).toFixed(2)} Cr` : `₹${(p / 100000).toFixed(0)}L`;

const calcEmi = (price: number) =>
  Math.round((price * 0.8 * 0.009) / (1 - Math.pow(1.009, -240)));

type RowDef = {
  label: string;
  get: (f: Flat) => string | number | null;
  best?: "max" | "min";
  format?: (v: string | number | null) => string;
};

const ROWS: RowDef[] = [
  { label: "Configuration", get: (f) => FLAT_TYPE_LABELS[f.flat_type] },
  { label: "Floor", get: (f) => f.floor, best: "max" },
  { label: "Carpet Area", get: (f) => f.carpet_area_sqft, best: "max", format: (v) => v ? `${v} sq.ft` : "—" },
  { label: "Super Area", get: (f) => f.super_area_sqft, best: "max", format: (v) => v ? `${v} sq.ft` : "—" },
  { label: "Facing", get: (f) => f.facing },
  { label: "Bathrooms", get: (f) => f.bathrooms, format: (v) => v != null ? String(v) : "—" },
  { label: "Balconies", get: (f) => f.balcony_count, format: (v) => v != null ? String(v) : "—" },
  { label: "Total Price", get: (f) => f.total_price, best: "min", format: (v) => v ? formatPrice(Number(v)) : "—" },
  { label: "Price/sq.ft", get: (f) => f.price_per_sqft, best: "min", format: (v) => v ? `₹${Math.round(Number(v)).toLocaleString()}` : "—" },
  { label: "Est. EMI", get: (f) => calcEmi(f.total_price), best: "min", format: (v) => `₹${Number(v).toLocaleString()}/mo` },
  { label: "Status", get: (f) => f.status },
];

export default function CompareModal({ flats, projectName, onClose }: Props) {
  // For numeric rows, find best value
  const getBestIdx = (row: RowDef): number | null => {
    if (!row.best) return null;
    const vals = flats.map((f) => {
      const v = row.get(f);
      return typeof v === "number" ? v : null;
    });
    if (vals.every((v) => v === null)) return null;
    const filtered = vals.map((v, i) => ({ v, i })).filter((x) => x.v !== null) as { v: number; i: number }[];
    if (filtered.length === 0) return null;
    return row.best === "max"
      ? filtered.reduce((a, b) => (a.v > b.v ? a : b)).i
      : filtered.reduce((a, b) => (a.v < b.v ? a : b)).i;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(8px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden rounded-2xl"
        style={{ background: "#ffffff", boxShadow: "rgba(0,0,0,0.5) 0px 24px 80px 0px" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 shrink-0"
          style={{ borderBottom: "1px solid rgba(0,0,0,0.08)" }}
        >
          <div>
            <h2 style={{ fontWeight: 700, fontSize: 18, color: "#1d1d1f", letterSpacing: "-0.02em" }}>
              Compare Flats
            </h2>
            <p className="text-micro" style={{ color: "rgba(0,0,0,0.45)", marginTop: 2 }}>{projectName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-standard transition-colors"
            style={{ color: "rgba(0,0,0,0.4)" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#f5f5f7")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Table */}
        <div className="overflow-auto flex-1">
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f5f5f7" }}>
                <th
                  style={{
                    width: 140,
                    minWidth: 110,
                    padding: "12px 20px",
                    textAlign: "left",
                    fontSize: 11,
                    fontWeight: 600,
                    color: "rgba(0,0,0,0.42)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    position: "sticky",
                    left: 0,
                    background: "#f5f5f7",
                    borderBottom: "1px solid rgba(0,0,0,0.08)",
                  }}
                >
                  Feature
                </th>
                {flats.map((flat) => (
                  <th
                    key={flat.id}
                    style={{
                      minWidth: 160,
                      padding: "12px 20px",
                      textAlign: "center",
                      borderBottom: "1px solid rgba(0,0,0,0.08)",
                      borderLeft: "1px solid rgba(0,0,0,0.06)",
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: 15, color: "#1d1d1f" }}>
                      Flat {flat.flat_number}
                    </div>
                    <div className="mt-1 flex justify-center">
                      <StatusBadge status={flat.status} size="sm" />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row, ri) => {
                const bestIdx = getBestIdx(row);
                return (
                  <tr
                    key={row.label}
                    style={{ background: ri % 2 === 0 ? "#fff" : "#fafafa" }}
                  >
                    <td
                      style={{
                        padding: "11px 20px",
                        fontSize: 13,
                        fontWeight: 500,
                        color: "rgba(0,0,0,0.55)",
                        borderBottom: "1px solid rgba(0,0,0,0.05)",
                        position: "sticky",
                        left: 0,
                        background: ri % 2 === 0 ? "#fff" : "#fafafa",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {row.label}
                    </td>
                    {flats.map((flat, fi) => {
                      const raw = row.get(flat);
                      const display = row.format ? row.format(raw) : raw != null ? String(raw) : "—";
                      const isBest = bestIdx === fi && flats.length > 1;
                      const isStatus = row.label === "Status";

                      return (
                        <td
                          key={flat.id}
                          style={{
                            padding: "11px 20px",
                            textAlign: "center",
                            borderBottom: "1px solid rgba(0,0,0,0.05)",
                            borderLeft: "1px solid rgba(0,0,0,0.06)",
                            background: isBest ? "rgba(52,199,89,0.06)" : undefined,
                          }}
                        >
                          {isStatus ? (
                            <StatusBadge status={flat.status} size="sm" />
                          ) : (
                            <div className="flex items-center justify-center gap-1.5">
                              {isBest && (
                                <span
                                  className="w-4 h-4 rounded-full flex items-center justify-center"
                                  style={{ background: "rgba(52,199,89,0.15)" }}
                                >
                                  <Check className="w-2.5 h-2.5" style={{ color: "#1a7f4a" }} />
                                </span>
                              )}
                              <span
                                style={{
                                  fontSize: 14,
                                  fontWeight: isBest ? 600 : 400,
                                  color: isBest ? "#1a7f4a" : "#1d1d1f",
                                }}
                              >
                                {display}
                              </span>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer CTA */}
        <div
          className="flex items-center justify-end gap-3 px-6 py-4 shrink-0"
          style={{ borderTop: "1px solid rgba(0,0,0,0.08)", background: "#f5f5f7" }}
        >
          <p className="text-micro flex-1" style={{ color: "rgba(0,0,0,0.42)" }}>
            Green highlights indicate the better value. EMI based on 80% loan at 8.5% for 20 years.
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-standard text-caption font-medium"
            style={{ background: "#e5e5ea", color: "#1d1d1f", border: "none", cursor: "pointer" }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
