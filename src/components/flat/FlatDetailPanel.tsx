"use client";

import { useState, useEffect } from "react";
import type { Flat } from "@/lib/types";
import { FLAT_TYPE_LABELS } from "@/lib/types";
import StatusBadge from "@/components/ui/StatusBadge";
import UnifiedLeadForm from "@/components/buyer/UnifiedLeadForm";
import { X, Maximize2, Compass, Layers, GitCompare, Eye, Heart, HeartOff, ChevronDown, ChevronUp, MessageCircle } from "lucide-react";

interface Props {
  flat: Flat;
  projectName: string;
  projectId: string;
  onClose: () => void;
  isInCompare?: boolean;
  onToggleCompare?: () => void;
  onOpenTour?: () => void;
}

function formatPrice(p: number) {
  if (p >= 10000000) return `₹${(p / 10000000).toFixed(2)} Cr`;
  if (p >= 100000) return `₹${(p / 100000).toFixed(1)} L`;
  return `₹${p.toLocaleString("en-IN")}`;
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
  const [loanPct, setLoanPct] = useState(80);
  const [rate, setRate] = useState(8.5);
  const [tenure, setTenure] = useState(20);

  useEffect(() => {
    setWishlisted(getWishlist().includes(flat.id));
  }, [flat.id]);

  const loanAmount = Math.round(flat.total_price * loanPct / 100);
  const emi = calcEMI(loanAmount, rate, tenure);
  const totalPayable = emi * tenure * 12;
  const interest = totalPayable - loanAmount;

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
    `Hi, I'm interested in Flat ${flat.flat_number} (${FLAT_TYPE_LABELS[flat.flat_type]}, Floor ${flat.floor}) at ${projectName}. Price: ${formatPrice(flat.total_price)}. Please share details.`
  )}`;

  const handleWishlist = () => {
    const added = toggleWishlistItem(flat.id);
    setWishlisted(added);
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
            value: formatPrice(flat.total_price),
            sub: flat.price_per_sqft ? `₹${Math.round(flat.price_per_sqft).toLocaleString("en-IN")}/sq.ft` : "—",
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

      {/* EMI Calculator */}
      <div className="mx-5 mb-3 rounded-standard overflow-hidden" style={{ border: "1px solid rgba(0,113,227,0.2)", background: "rgba(0,113,227,0.03)" }}>
        <button
          onClick={() => setShowEmi(!showEmi)}
          className="w-full flex items-center justify-between px-4 py-3"
          style={{ background: "transparent", border: "none", cursor: "pointer" }}
        >
          <div>
            <div style={{ fontSize: "0.75rem", color: "rgba(0,0,0,0.48)", marginBottom: 2 }}>EMI estimate · {tenure}yr @ {rate}%</div>
            <div style={{ fontSize: "1.0625rem", fontWeight: 700, color: "#0071e3" }}>
              ₹{emi.toLocaleString("en-IN")}<span style={{ fontSize: "0.8125rem", fontWeight: 400, color: "rgba(0,0,0,0.48)" }}>/month</span>
            </div>
          </div>
          {showEmi ? <ChevronUp className="w-4 h-4" style={{ color: "rgba(0,0,0,0.4)" }} /> : <ChevronDown className="w-4 h-4" style={{ color: "rgba(0,0,0,0.4)" }} />}
        </button>

        {showEmi && (
          <div className="px-4 pb-4" style={{ borderTop: "1px solid rgba(0,113,227,0.15)" }}>
            <div className="space-y-4 pt-3">
              {/* Loan % slider */}
              <div>
                <div className="flex justify-between mb-1.5" style={{ fontSize: "0.8125rem", color: "rgba(0,0,0,0.56)" }}>
                  <span>Loan Amount</span>
                  <span style={{ fontWeight: 600, color: "#1d1d1f" }}>{loanPct}% · {formatPrice(loanAmount)}</span>
                </div>
                <input type="range" min={10} max={90} step={5} value={loanPct}
                  onChange={(e) => setLoanPct(Number(e.target.value))}
                  style={{ width: "100%", accentColor: "#0071e3" }} />
              </div>

              {/* Rate slider */}
              <div>
                <div className="flex justify-between mb-1.5" style={{ fontSize: "0.8125rem", color: "rgba(0,0,0,0.56)" }}>
                  <span>Interest Rate</span>
                  <span style={{ fontWeight: 600, color: "#1d1d1f" }}>{rate}% p.a.</span>
                </div>
                <input type="range" min={6} max={14} step={0.25} value={rate}
                  onChange={(e) => setRate(Number(e.target.value))}
                  style={{ width: "100%", accentColor: "#0071e3" }} />
              </div>

              {/* Tenure selector */}
              <div>
                <div className="mb-1.5" style={{ fontSize: "0.8125rem", color: "rgba(0,0,0,0.56)" }}>Tenure</div>
                <div className="flex gap-2">
                  {[10, 15, 20, 25, 30].map((t) => (
                    <button key={t} onClick={() => setTenure(t)}
                      style={{
                        flex: 1, padding: "6px 0", borderRadius: 8, fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer",
                        background: tenure === t ? "#0071e3" : "#ebebed",
                        color: tenure === t ? "#fff" : "#1d1d1f",
                        border: "none",
                      }}>
                      {t}yr
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="flex gap-2 pt-1">
                <div className="flex-1 rounded-standard p-2.5 text-center" style={{ background: "rgba(52,199,89,0.08)" }}>
                  <div style={{ fontSize: "0.6875rem", color: "rgba(0,0,0,0.48)", marginBottom: 2 }}>Monthly EMI</div>
                  <div style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#1a7f4a" }}>₹{emi.toLocaleString("en-IN")}</div>
                </div>
                <div className="flex-1 rounded-standard p-2.5 text-center" style={{ background: "rgba(255,149,0,0.08)" }}>
                  <div style={{ fontSize: "0.6875rem", color: "rgba(0,0,0,0.48)", marginBottom: 2 }}>Total Interest</div>
                  <div style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#b35a00" }}>{formatPrice(interest)}</div>
                </div>
                <div className="flex-1 rounded-standard p-2.5 text-center" style={{ background: "#f5f5f7" }}>
                  <div style={{ fontSize: "0.6875rem", color: "rgba(0,0,0,0.48)", marginBottom: 2 }}>Total Payable</div>
                  <div style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#1d1d1f" }}>{formatPrice(totalPayable)}</div>
                </div>
              </div>
            </div>
          </div>
        )}
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
      {flat.status === "available" && (
        <div className="px-5 flex flex-col gap-2">
          <button
            onClick={() => setShowLeadForm(true)}
            className="btn-primary w-full justify-center"
            style={{ borderRadius: 10, padding: "13px 22px", fontSize: "0.9375rem" }}
          >
            Schedule a Visit
          </button>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 rounded-standard flex items-center justify-center gap-2"
            style={{ background: "#f5f5f7", color: "#1d1d1f", border: "1px solid rgba(0,0,0,0.1)", textDecoration: "none", fontSize: "0.9rem", fontWeight: 500 }}
          >
            <MessageCircle className="w-4 h-4" style={{ color: "#25d366" }} />
            WhatsApp Inquiry
          </a>
        </div>
      )}

      {flat.status !== "available" && (
        <div
          className="mx-5 rounded-standard p-4 text-center"
          style={{ background: "#f5f5f7", color: "rgba(0,0,0,0.56)", fontSize: "0.875rem" }}
        >
          This flat is <span style={{ fontWeight: 700, color: "#1d1d1f" }}>{flat.status}</span>. Other available flats are shown below.
        </div>
      )}

      {/* Price breakdown */}
      <div className="p-5 mt-4" style={{ borderTop: "1px solid rgba(0,0,0,0.08)" }}>
        <div style={{ fontSize: "0.6875rem", fontWeight: 700, color: "rgba(0,0,0,0.4)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
          Price Breakdown
        </div>
        <div className="space-y-2">
          {[
            ["Base Price", formatPrice(Math.round(flat.total_price * 0.88))],
            ["Car Parking", "₹3,50,000"],
            ["Club Membership", "₹75,000"],
            ["PLC / Preferential", `₹${Math.round(flat.carpet_area_sqft * 48).toLocaleString("en-IN")}`],
            ["GST (5%)", formatPrice(Math.round(flat.total_price * 0.05))],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between" style={{ fontSize: "0.875rem", color: "rgba(0,0,0,0.56)" }}>
              <span>{k}</span>
              <span style={{ color: "#1d1d1f" }}>{v}</span>
            </div>
          ))}
          <div
            className="flex justify-between pt-2"
            style={{ borderTop: "1.5px solid rgba(0,0,0,0.1)", fontSize: "0.9375rem", fontWeight: 700, color: "#1d1d1f" }}
          >
            <span>All-in Price</span>
            <span style={{ color: "#0071e3" }}>{formatPrice(flat.total_price)}</span>
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
