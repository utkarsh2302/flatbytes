"use client";

import { useState, useEffect, useMemo } from "react";
import type { Flat } from "@/lib/types";
import { FLAT_TYPE_LABELS } from "@/lib/types";
import StatusBadge from "@/components/ui/StatusBadge";
import UnifiedLeadForm from "@/components/buyer/UnifiedLeadForm";
import { analyzeLivingExperience } from "@/lib/living-experience";
import { X, Maximize2, Compass, Layers, GitCompare, Eye, Heart, Share2 } from "lucide-react";

interface Props {
  flat: Flat;
  projectName: string;
  projectId: string;
  onClose: () => void;
  isInCompare?: boolean;
  onToggleCompare?: () => void;
  onOpenTour?: () => void;
}

function calcEMI(principal: number, annualRate: number, tenureYears: number) {
  const r = annualRate / 100 / 12;
  const n = tenureYears * 12;
  if (r === 0) return Math.round(principal / n);
  return Math.round((principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));
}

const WISHLIST_KEY = "flatbytes_wishlist";

function getWishlist(): string[] {
  try {
    return JSON.parse(localStorage.getItem(WISHLIST_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function toggleWishlistItem(id: string): boolean {
  const list = getWishlist();
  const idx = list.indexOf(id);
  if (idx === -1) {
    list.push(id);
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(list));
    return true;
  } else {
    list.splice(idx, 1);
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(list));
    return false;
  }
}

export default function FlatDetailPanel({ flat, projectName, projectId, onClose, isInCompare, onToggleCompare, onOpenTour }: Props) {
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [showEmi, setShowEmi] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [loanPct, setLoanPct] = useState(80);
  const [rate, setRate] = useState(8.5);
  const [tenure, setTenure] = useState(20);
  const [budgetCr, setBudgetCr] = useState(1.5);

  useEffect(() => {
    setWishlisted(getWishlist().includes(flat.id));
  }, [flat.id]);

  const budgetRs = Math.round(budgetCr * 10000000);
  const loanAmount = Math.round(budgetRs * loanPct / 100);
  const emi = calcEMI(loanAmount, rate, tenure);
  const totalPayable = emi * tenure * 12;
  const interest = totalPayable - loanAmount;

  // Living Experience Intelligence
  const lifeData = useMemo(
    () => analyzeLivingExperience(flat.facing ?? null, flat.floor, flat.flat_type, flat.carpet_area_sqft ?? 0),
    [flat.facing, flat.floor, flat.flat_type, flat.carpet_area_sqft],
  );
  const vastuScore = lifeData.scores.vastu;
  const vastuLabel = vastuScore >= 8 ? "Excellent Vastu" : vastuScore >= 6 ? "Good Vastu" : vastuScore >= 4 ? "Moderate Vastu" : "Check Vastu";
  const vastuColor = vastuScore >= 8 ? "#1a7f4a" : vastuScore >= 6 ? "#0055b3" : vastuScore >= 4 ? "#c25000" : "#d70015";
  const vastuBg    = vastuScore >= 8 ? "rgba(52,199,89,0.08)" : vastuScore >= 6 ? "rgba(0,122,255,0.08)" : vastuScore >= 4 ? "rgba(255,149,0,0.08)" : "rgba(255,59,48,0.08)";
  const sunLabel   = ["north-east","east"].includes(lifeData.facing) ? "🌅 Morning Sun"
    : ["south-east","south"].includes(lifeData.facing)               ? "☀ Afternoon Sun"
    : ["south-west","west","north-west"].includes(lifeData.facing)   ? "🌇 Evening Sun"
    : "🌤 Indirect Light";
  const heatLabel  = lifeData.heat.level === "low" ? "🌿 Low Heat Zone" : lifeData.heat.level === "moderate" ? "🌡 Moderate Heat" : "🔥 High Heat Zone";
  const heatColor  = lifeData.heat.level === "low" ? "#1a7f4a" : lifeData.heat.level === "moderate" ? "#c25000" : "#d70015";
  const heatBg     = lifeData.heat.level === "low" ? "rgba(52,199,89,0.08)" : lifeData.heat.level === "moderate" ? "rgba(255,149,0,0.08)" : "rgba(255,59,48,0.08)";

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
    `Hi, I'm interested in Flat ${flat.flat_number} (${FLAT_TYPE_LABELS[flat.flat_type]}, Floor ${flat.floor}) at ${projectName}. Please share the pricing and availability details.`
  )}`;

  const handleWishlist = () => {
    const added = toggleWishlistItem(flat.id);
    setWishlisted(added);
  };

  const handleShare = () => {
    const url = `${window.location.origin}/flat/${projectId}/${flat.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    });
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ scrollbarWidth: "none" }}>
      {/* Header */}
      <div className="flex items-start justify-between p-5" style={{ borderBottom: "1px solid rgba(0,0,0,0.08)", position: "sticky", top: 0, background: "#fff", zIndex: 2 }}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span style={{ fontSize: "1.125rem", fontWeight: 700, color: "#1d1d1f", letterSpacing: "-0.02em" }}>
              Flat {flat.flat_number}
            </span>
            <StatusBadge status={flat.status} size="sm" />
          </div>
          <p style={{ fontSize: "0.8125rem", color: "rgba(0,0,0,0.48)" }}>{projectName}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleShare}
            title="Share this flat"
            style={{ padding: "6px", borderRadius: 8, background: shareCopied ? "rgba(0,113,227,0.1)" : "transparent", color: shareCopied ? "#0071e3" : "rgba(0,0,0,0.4)", border: "none", cursor: "pointer", display: "flex" }}
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleWishlist}
            title={wishlisted ? "Remove from wishlist" : "Save to wishlist"}
            style={{ padding: "6px", borderRadius: 8, background: wishlisted ? "rgba(255,59,48,0.08)" : "transparent", color: wishlisted ? "#ff3b30" : "rgba(0,0,0,0.4)", border: "none", cursor: "pointer", display: "flex" }}
          >
            {wishlisted ? <Heart className="w-4 h-4" fill="currentColor" /> : <Heart className="w-4 h-4" />}
          </button>
          <button
            onClick={onClose}
            style={{ padding: "6px", borderRadius: 8, background: "transparent", color: "rgba(0,0,0,0.4)", border: "none", cursor: "pointer", display: "flex" }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2.5 p-5 pb-3">
        {[
          {
            icon: <Maximize2 className="w-3.5 h-3.5" />,
            label: "Carpet Area",
            value: `${flat.carpet_area_sqft} sq.ft`,
            sub: flat.super_area_sqft ? `${flat.super_area_sqft} super built-up` : "—",
          },
          {
            icon: <Layers className="w-3.5 h-3.5" />,
            label: "Configuration",
            value: FLAT_TYPE_LABELS[flat.flat_type],
            sub: `Floor ${flat.floor}`,
          },
          {
            icon: <Compass className="w-3.5 h-3.5" />,
            label: "Facing",
            value: flat.facing ?? "—",
            sub: flat.bathrooms ? `${flat.bathrooms} Bath · ${flat.balcony_count ?? 0} Balcony` : "Direction",
          },
          {
            icon: null,
            label: "Total Price",
            value: "On Request",
            sub: "Contact for pricing",
          },
        ].map((item) => (
          <div key={item.label} className="rounded-standard p-3.5" style={{ background: "#f5f5f7" }}>
            <div className="flex items-center gap-1.5 mb-1.5" style={{ fontSize: "0.75rem", color: "rgba(0,0,0,0.42)" }}>
              {item.icon}{item.label}
            </div>
            <div style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#1d1d1f" }}>{item.value}</div>
            <div style={{ fontSize: "0.75rem", color: "rgba(0,0,0,0.42)", marginTop: 2 }}>{item.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Living Intelligence strip ───────────────────────────────── */}
      <div className="mx-5 mb-3 rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
        <div className="px-3.5 pt-3 pb-2" style={{ background: "linear-gradient(135deg,#f0f7ff 0%,#f5fff8 100%)" }}>
          <div className="flex items-center justify-between mb-2.5">
            <span style={{ fontSize: "0.6875rem", fontWeight: 700, color: "rgba(0,0,0,0.38)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Living Intelligence
            </span>
            {onOpenTour && (
              <button
                onClick={onOpenTour}
                style={{ fontSize: "0.6875rem", fontWeight: 600, color: "#0071e3", background: "none", border: "none", cursor: "pointer", padding: 0 }}
              >
                Explore in 3D →
              </button>
            )}
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-0.5" style={{ scrollbarWidth: "none" }}>
            <span className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
              style={{ background: "rgba(0,113,227,0.09)", color: "#0055b3", border: "1px solid rgba(0,113,227,0.15)" }}>
              🧭 {lifeData.facingLabel}
            </span>
            <span className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
              style={{ background: vastuBg, color: vastuColor, border: `1px solid ${vastuColor}30` }}>
              ✨ {vastuLabel}
            </span>
            <span className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
              style={{ background: "rgba(245,158,11,0.08)", color: "#b45309", border: "1px solid rgba(245,158,11,0.2)" }}>
              {sunLabel}
            </span>
            <span className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
              style={{ background: heatBg, color: heatColor, border: `1px solid ${heatColor}30` }}>
              {heatLabel}
            </span>
          </div>
        </div>
        {/* Vastu summary line */}
        <div className="px-3.5 py-2" style={{ background: "#fff", borderTop: "1px solid rgba(0,0,0,0.05)", fontSize: "0.75rem", color: "rgba(0,0,0,0.48)", lineHeight: 1.5 }}>
          {lifeData.vastuSummary}
        </div>
      </div>

      {/* Price on request strip */}
      <div className="mx-5 mb-3 rounded-standard px-4 py-3 flex items-center gap-3" style={{ background: "rgba(0,113,227,0.06)", border: "1px solid rgba(0,113,227,0.18)" }}>
        <div className="flex-1">
          <div style={{ fontSize: "0.75rem", color: "rgba(0,0,0,0.48)", marginBottom: 2 }}>Pricing</div>
          <div style={{ fontSize: "1rem", fontWeight: 700, color: "#0071e3" }}>On Request</div>
        </div>
        <button
          onClick={() => setShowLeadForm(true)}
          style={{ padding: "7px 14px", borderRadius: 8, background: "#0071e3", color: "#fff", border: "none", cursor: "pointer", fontSize: "0.8125rem", fontWeight: 600, whiteSpace: "nowrap" }}
        >
          Get Price
        </button>
      </div>

      {/* Compare + Tour */}
      <div className="mx-5 mb-3 flex gap-2">
        <button
          onClick={onToggleCompare}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-standard transition-all"
          style={{
            fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer", border: "1.5px solid",
            ...(isInCompare
              ? { background: "#0071e3", color: "#fff", borderColor: "#0071e3" }
              : { background: "#f5f5f7", color: "#1d1d1f", borderColor: "rgba(0,0,0,0.1)" })
          }}
        >
          <GitCompare className="w-3.5 h-3.5" />
          {isInCompare ? "In Compare" : "Compare"}
        </button>
        <button
          onClick={onOpenTour}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-standard transition-all"
          style={{ fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer", background: "#f5f5f7", color: "#1d1d1f", border: "1.5px solid rgba(0,0,0,0.1)" }}
        >
          <Eye className="w-3.5 h-3.5" />
          360° Tour
        </button>
      </div>

      {/* CTA buttons */}
      <div className="px-5 flex flex-col gap-2">
        {/* WhatsApp — always primary */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-3.5 rounded-xl flex items-center justify-center gap-2.5"
          style={{
            background: "linear-gradient(135deg,#25d366 0%,#128c4a 100%)",
            color: "#fff", textDecoration: "none", fontSize: "0.9375rem", fontWeight: 700,
            boxShadow: "0 4px 16px rgba(37,211,102,0.35)",
            letterSpacing: "-0.01em",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          Chat on WhatsApp
        </a>

        {flat.status === "available" ? (
          <button
            onClick={() => setShowLeadForm(true)}
            className="w-full py-3 rounded-xl flex items-center justify-center gap-2"
            style={{ background: "#f5f5f7", color: "#1d1d1f", border: "1.5px solid rgba(0,0,0,0.12)", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer" }}
          >
            Schedule a Visit
          </button>
        ) : (
          <div
            className="w-full py-3 rounded-xl text-center"
            style={{ background: "#fafafa", color: "rgba(0,0,0,0.5)", border: "1px solid rgba(0,0,0,0.07)", fontSize: "0.8125rem" }}
          >
            This flat is <span style={{ fontWeight: 700, color: "#1d1d1f" }}>{flat.status}</span> — WhatsApp us for alternatives
          </div>
        )}
      </div>

      {/* EMI Calculator */}
      <div className="mx-5 mb-3 rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.08)" }}>
        <button
          onClick={() => setShowEmi(v => !v)}
          className="w-full flex items-center justify-between px-4 py-3"
          style={{ background: "#f9f9fb", border: "none", cursor: "pointer" }}
        >
          <div className="flex items-center gap-2">
            <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#1d1d1f" }}>EMI Calculator</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: "rgba(0,113,227,0.1)", color: "#0055b3" }}>
              Estimate
            </span>
          </div>
          <span style={{ fontSize: "0.75rem", color: "rgba(0,0,0,0.35)", transform: showEmi ? "rotate(180deg)" : "none", display: "inline-block", transition: "transform 0.2s" }}>▼</span>
        </button>
        {showEmi && (
          <div className="px-4 pt-1 pb-4" style={{ background: "#fff", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
            <p style={{ fontSize: "0.72rem", color: "rgba(0,0,0,0.4)", marginBottom: 12, lineHeight: 1.5 }}>
              Enter your expected budget to estimate monthly EMI. Contact us for actual pricing.
            </p>

            {/* Budget slider */}
            <div className="mb-3">
              <div className="flex justify-between mb-1" style={{ fontSize: "0.72rem", color: "rgba(0,0,0,0.45)" }}>
                <span>Your Budget</span>
                <span style={{ fontWeight: 700, color: "#1d1d1f" }}>₹{budgetCr.toFixed(1)} Cr</span>
              </div>
              <input type="range" min={0.3} max={10} step={0.1} value={budgetCr}
                onChange={e => setBudgetCr(Number(e.target.value))}
                className="w-full" style={{ accentColor: "#0071e3" }} />
              <div className="flex justify-between mt-0.5" style={{ fontSize: "0.65rem", color: "rgba(0,0,0,0.3)" }}>
                <span>₹30L</span><span>₹10Cr</span>
              </div>
            </div>

            {/* Loan % */}
            <div className="mb-3">
              <div className="flex justify-between mb-1" style={{ fontSize: "0.72rem", color: "rgba(0,0,0,0.45)" }}>
                <span>Home Loan</span>
                <span style={{ fontWeight: 700, color: "#1d1d1f" }}>{loanPct}%</span>
              </div>
              <input type="range" min={50} max={90} step={5} value={loanPct}
                onChange={e => setLoanPct(Number(e.target.value))}
                className="w-full" style={{ accentColor: "#0071e3" }} />
            </div>

            {/* Interest rate row */}
            <div className="mb-3">
              <div className="flex justify-between mb-1.5" style={{ fontSize: "0.72rem", color: "rgba(0,0,0,0.45)" }}>
                <span>Interest Rate</span>
                <span style={{ fontWeight: 700, color: "#1d1d1f" }}>{rate.toFixed(1)}% p.a.</span>
              </div>
              <div className="flex gap-1.5">
                {[7.0, 8.0, 8.5, 9.0, 10.0].map(r => (
                  <button key={r} onClick={() => setRate(r)}
                    className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={rate === r
                      ? { background: "#0071e3", color: "#fff", border: "none", cursor: "pointer" }
                      : { background: "#f5f5f7", color: "rgba(0,0,0,0.56)", border: "none", cursor: "pointer" }}>
                    {r}%
                  </button>
                ))}
              </div>
            </div>

            {/* Tenure row */}
            <div className="flex gap-1.5 mb-4">
              {[10, 15, 20, 25, 30].map(y => (
                <button key={y} onClick={() => setTenure(y)}
                  className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={tenure === y
                    ? { background: "#0071e3", color: "#fff", border: "none", cursor: "pointer" }
                    : { background: "#f5f5f7", color: "rgba(0,0,0,0.56)", border: "none", cursor: "pointer" }}>
                  {y}yr
                </button>
              ))}
            </div>

            {/* EMI result */}
            <div className="rounded-xl p-3.5" style={{ background: "linear-gradient(135deg,rgba(0,113,227,0.07),rgba(0,113,227,0.03))", border: "1px solid rgba(0,113,227,0.14)" }}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div style={{ fontSize: "0.65rem", color: "rgba(0,0,0,0.4)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Est. Monthly EMI</div>
                  <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0071e3", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
                    ₹{emi >= 100000
                      ? `${(emi / 100000).toFixed(1)}L`
                      : emi.toLocaleString("en-IN")}
                    <span style={{ fontSize: "0.75rem", fontWeight: 500, color: "rgba(0,0,0,0.4)" }}>/mo</span>
                  </div>
                </div>
                <div className="text-right">
                  <div style={{ fontSize: "0.65rem", color: "rgba(0,0,0,0.4)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Total Interest</div>
                  <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#1d1d1f" }}>
                    {interest >= 10000000
                      ? `₹${(interest / 10000000).toFixed(2)} Cr`
                      : `₹${(interest / 100000).toFixed(1)}L`}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between" style={{ fontSize: "0.7rem", color: "rgba(0,0,0,0.38)" }}>
                <span>Loan: {loanAmount >= 10000000 ? `₹${(loanAmount/10000000).toFixed(2)} Cr` : `₹${(loanAmount/100000).toFixed(1)}L`} @ {rate}%</span>
                <span>{tenure} years</span>
              </div>
            </div>
            <p style={{ fontSize: "0.65rem", color: "rgba(0,0,0,0.3)", marginTop: 8, fontStyle: "italic" }}>
              Indicative only. Consult your bank for exact figures.
            </p>
          </div>
        )}
      </div>

      {/* What's included */}
      <div className="p-5 mt-2 pb-8" style={{ borderTop: "1px solid rgba(0,0,0,0.08)" }}>
        <div style={{ fontSize: "0.6875rem", fontWeight: 700, color: "rgba(0,0,0,0.4)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
          Included in Price
        </div>
        <div className="space-y-2">
          {["Covered Car Parking", "Club Membership", "Modular Kitchen Provision", "Branded Fittings & Fixtures", "RERA-compliant pricing"].map((item) => (
            <div key={item} className="flex items-center gap-2" style={{ fontSize: "0.8125rem", color: "rgba(0,0,0,0.64)" }}>
              <span style={{ color: "#34c759", fontSize: "0.75rem" }}>✓</span>
              {item}
            </div>
          ))}
          <div className="mt-3 pt-3" style={{ borderTop: "1px solid rgba(0,0,0,0.06)", fontSize: "0.75rem", color: "rgba(0,0,0,0.4)", fontStyle: "italic" }}>
            GST, stamp duty & registration charges extra. Get exact cost sheet from our team.
          </div>
        </div>
      </div>

      {/* Lead form modal */}
      {showLeadForm && (
        <UnifiedLeadForm
          projectId={projectId}
          projectName={projectName}
          flat={{ flat_number: flat.flat_number, flat_type: flat.flat_type, total_price: flat.total_price, carpet_area_sqft: flat.carpet_area_sqft }}
          onClose={() => setShowLeadForm(false)}
        />
      )}
    </div>
  );
}
