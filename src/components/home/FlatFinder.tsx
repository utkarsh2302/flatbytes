"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import type { FlatType } from "@/lib/types";

const BHK_OPTIONS: { type: FlatType; emoji: string; label: string }[] = [
  { type: "studio",    emoji: "🏢", label: "Studio" },
  { type: "1bhk",     emoji: "🛏",  label: "1 BHK"  },
  { type: "2bhk",     emoji: "🏠",  label: "2 BHK"  },
  { type: "3bhk",     emoji: "🏡",  label: "3 BHK"  },
  { type: "4bhk",     emoji: "🏘",  label: "4 BHK"  },
  { type: "penthouse", emoji: "👑", label: "Pent­house" },
];

const BUDGET_OPTIONS = [
  { label: "Under ₹50L",  max: 5_000_000  },
  { label: "₹50L – 1Cr",  max: 10_000_000 },
  { label: "₹1Cr – 2Cr",  max: 20_000_000 },
  { label: "₹2Cr+",       max: undefined  },
];

export default function FlatFinder() {
  const router = useRouter();
  const [selectedTypes, setSelectedTypes] = useState<FlatType[]>([]);
  const [selectedBudgetIdx, setSelectedBudgetIdx] = useState<number | null>(null);

  function toggleType(type: FlatType) {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  }

  function handleFind() {
    const params = new URLSearchParams();
    if (selectedTypes.length > 0) params.set("types", selectedTypes.join(","));
    if (selectedBudgetIdx !== null && BUDGET_OPTIONS[selectedBudgetIdx].max) {
      params.set("maxPrice", String(BUDGET_OPTIONS[selectedBudgetIdx].max));
    }
    router.push(`/search?${params.toString()}`);
  }

  const hasSelection = selectedTypes.length > 0 || selectedBudgetIdx !== null;

  return (
    <div
      className="w-full rounded-2xl p-5 sm:p-6"
      style={{
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.12)",
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Step 1 — BHK */}
      <p
        className="mb-3"
        style={{ fontSize: "0.78rem", fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "0.08em", textTransform: "uppercase" }}
      >
        Step 1 — How many bedrooms?
      </p>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-5">
        {BHK_OPTIONS.map(({ type, emoji, label }) => (
          <button
            key={type}
            onClick={() => toggleType(type)}
            className={`flat-finder-btn ${selectedTypes.includes(type) ? "selected" : ""}`}
            aria-pressed={selectedTypes.includes(type)}
            aria-label={`${label} flat`}
          >
            <span className="emoji">{emoji}</span>
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Step 2 — Budget */}
      <p
        className="mb-3"
        style={{ fontSize: "0.78rem", fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "0.08em", textTransform: "uppercase" }}
      >
        Step 2 — What&apos;s your budget?
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
        {BUDGET_OPTIONS.map(({ label }, idx) => (
          <button
            key={label}
            onClick={() => setSelectedBudgetIdx(idx === selectedBudgetIdx ? null : idx)}
            className={`budget-btn ${selectedBudgetIdx === idx ? "selected" : ""}`}
            aria-pressed={selectedBudgetIdx === idx}
          >
            {label}
          </button>
        ))}
      </div>

      {/* CTA */}
      <button
        onClick={handleFind}
        className="w-full flex items-center justify-center gap-2.5 rounded-2xl font-semibold transition-all"
        style={{
          height: 56,
          fontSize: "1rem",
          background: hasSelection ? "#0071e3" : "rgba(255,255,255,0.15)",
          color: "#fff",
          border: "none",
          cursor: "pointer",
          letterSpacing: "-0.01em",
        }}
        aria-label="Search for flats"
      >
        <Search className="w-5 h-5 shrink-0" />
        {hasSelection ? "Show Matching Flats" : "Browse All Available Flats"}
      </button>
    </div>
  );
}
