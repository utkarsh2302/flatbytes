"use client";

import { useState, useTransition } from "react";
import type { Flat } from "@/lib/types";
import { FLAT_TYPE_LABELS } from "@/lib/types";
import StatusBadge from "@/components/ui/StatusBadge";
import { submitLead } from "@/lib/actions";
import { X, Maximize2, Compass, DollarSign, Layers, Phone, MessageCircle, Heart, ChevronRight, GitCompare, Eye, CheckCircle2 } from "lucide-react";

interface Props {
  flat: Flat;
  projectName: string;
  projectId: string;
  onClose: () => void;
  isInCompare?: boolean;
  onToggleCompare?: () => void;
  onOpenTour?: () => void;
}

export default function FlatDetailPanel({ flat, projectName, projectId, onClose, isInCompare, onToggleCompare, onOpenTour }: Props) {
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [leadError, setLeadError] = useState("");
  const [isPending, startTransition] = useTransition();

  const formatPrice = (p: number) =>
    p >= 10000000
      ? `₹${(p / 10000000).toFixed(2)} Cr`
      : `₹${(p / 100000).toFixed(0)} L`;

  const emi = Math.round((flat.total_price * 0.8 * 0.009) / (1 - Math.pow(1.009, -240)));

  const handleLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || phone.trim().length < 10) return;
    setLeadError("");
    startTransition(async () => {
      try {
        await submitLead({ project_id: projectId, flat_id: flat.id, name, phone });
        setSubmitted(true);
      } catch {
        setLeadError("Couldn't save — please try again.");
      }
    });
  };

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
    `Hi, I'm interested in Flat ${flat.flat_number} (${FLAT_TYPE_LABELS[flat.flat_type]}, Floor ${flat.floor}) at ${projectName}. Priced at ${formatPrice(flat.total_price)}. Please share more details.`
  )}`;

  const inputStyle = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: 8,
    border: "1px solid rgba(0,0,0,0.14)",
    background: "#fafafc",
    fontSize: "0.9375rem",
    color: "#1d1d1f",
    outline: "none",
    letterSpacing: "-0.022em",
  } as React.CSSProperties;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="flex items-start justify-between p-5"
        style={{ borderBottom: "1px solid rgba(0,0,0,0.08)" }}
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span style={{ fontSize: "1.125rem", fontWeight: 600, color: "#1d1d1f", letterSpacing: "-0.01em" }}>
              Flat {flat.flat_number}
            </span>
            <StatusBadge status={flat.status} size="sm" />
          </div>
          <p className="text-micro" style={{ color: "rgba(0,0,0,0.48)" }}>{projectName}</p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-standard transition-colors"
          style={{ color: "rgba(0,0,0,0.4)" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#f5f5f7"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2.5 p-5">
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
            icon: <DollarSign className="w-3.5 h-3.5" />,
            label: "Total Price",
            value: formatPrice(flat.total_price),
            sub: flat.price_per_sqft ? `₹${Math.round(flat.price_per_sqft).toLocaleString()}/sq.ft` : "—",
          },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-standard p-3.5"
            style={{ background: "#f5f5f7" }}
          >
            <div
              className="flex items-center gap-1.5 mb-2 text-micro"
              style={{ color: "rgba(0,0,0,0.42)" }}
            >
              {item.icon}
              {item.label}
            </div>
            <div className="text-caption" style={{ fontWeight: 600, color: "#1d1d1f" }}>{item.value}</div>
            <div className="text-micro mt-0.5" style={{ color: "rgba(0,0,0,0.42)" }}>{item.sub}</div>
          </div>
        ))}
      </div>

      {/* EMI strip */}
      <a
        href="/emi-calculator"
        target="_blank"
        rel="noopener noreferrer"
        className="mx-5 mb-3 px-4 py-3 rounded-standard flex items-center justify-between"
        style={{ background: "rgba(0,113,227,0.06)", border: "1px solid rgba(0,113,227,0.15)", display: "flex", textDecoration: "none" }}
      >
        <div>
          <div className="text-micro mb-0.5" style={{ color: "rgba(0,0,0,0.48)" }}>
            EMI estimate · 20yr @ 8.5%
          </div>
          <div style={{ fontSize: "1.0625rem", fontWeight: 600, color: "#1d1d1f" }}>
            ₹{emi.toLocaleString()}
            <span className="text-micro font-normal" style={{ color: "rgba(0,0,0,0.48)" }}>/month</span>
          </div>
        </div>
        <ChevronRight className="w-4 h-4" style={{ color: "rgba(0,0,0,0.32)" }} />
      </a>

      {/* Quick action row: Compare + Virtual Tour */}
      <div className="mx-5 mb-3 flex gap-2">
        <button
          onClick={onToggleCompare}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-standard text-micro font-medium transition-all"
          style={
            isInCompare
              ? { background: "#0071e3", color: "#fff", border: "1.5px solid #0071e3" }
              : { background: "#f5f5f7", color: "#1d1d1f", border: "1.5px solid rgba(0,0,0,0.1)" }
          }
        >
          <GitCompare className="w-3.5 h-3.5" />
          {isInCompare ? "In Compare" : "Compare"}
        </button>
        <button
          onClick={onOpenTour}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-standard text-micro font-medium transition-all"
          style={{ background: "#f5f5f7", color: "#1d1d1f", border: "1.5px solid rgba(0,0,0,0.1)" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#ebebed")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "#f5f5f7")}
        >
          <Eye className="w-3.5 h-3.5" />
          360° Tour
        </button>
      </div>

      {/* Actions */}
      <div className="px-5 flex flex-col gap-2.5 flex-1">
        {flat.status === "available" && !submitted && (
          <>
            {!showLeadForm ? (
              <button
                onClick={() => setShowLeadForm(true)}
                className="btn-primary w-full justify-center"
                style={{ borderRadius: 8, padding: "12px 22px" }}
              >
                <Phone className="w-4 h-4" />
                Schedule a Visit
              </button>
            ) : (
              <form onSubmit={handleLeadSubmit} className="flex flex-col gap-2">
                <input
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={inputStyle}
                  required
                />
                <input
                  type="tel"
                  placeholder="Phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={inputStyle}
                  minLength={10}
                  maxLength={12}
                  required
                />
                {leadError && (
                  <p style={{ fontSize: 12, color: "#d70015" }}>{leadError}</p>
                )}
                <button
                  type="submit"
                  disabled={isPending}
                  className="btn-primary w-full justify-center"
                  style={{ borderRadius: 8, padding: "11px 22px", opacity: isPending ? 0.6 : 1 }}
                >
                  {isPending ? "Sending…" : "Request Callback"}
                </button>
              </form>
            )}

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 rounded-standard text-caption font-normal transition-colors flex items-center justify-center gap-2"
              style={{ background: "#f5f5f7", color: "#1d1d1f", border: "1px solid rgba(0,0,0,0.1)", textDecoration: "none" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#ebebed")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "#f5f5f7")}
            >
              <MessageCircle className="w-4 h-4" style={{ color: "#25d366" }} />
              WhatsApp Inquiry
            </a>
          </>
        )}

        {submitted && (
          <div
            className="rounded-standard p-4 text-center"
            style={{ background: "rgba(52,199,89,0.08)", border: "1px solid rgba(52,199,89,0.25)" }}
          >
            <CheckCircle2 className="w-6 h-6 mx-auto mb-2" style={{ color: "#1a7f4a" }} />
            <div className="text-caption font-semibold mb-1" style={{ color: "#1a7f4a" }}>
              Request Sent!
            </div>
            <div className="text-micro" style={{ color: "rgba(0,0,0,0.56)" }}>
              Our team will call you within 2 hours.
            </div>
          </div>
        )}

        <button
          className="w-full py-2.5 rounded-standard text-caption font-normal flex items-center justify-center gap-2 transition-colors"
          style={{ background: "#f5f5f7", color: "rgba(0,0,0,0.56)", border: "1px solid rgba(0,0,0,0.08)" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#ebebed")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "#f5f5f7")}
        >
          <Heart className="w-4 h-4" />
          Save to Wishlist
        </button>

        {flat.status !== "available" && (
          <div
            className="rounded-standard p-4 text-center text-caption"
            style={{ background: "#f5f5f7", color: "rgba(0,0,0,0.56)" }}
          >
            This flat is{" "}
            <span style={{ fontWeight: 600, color: "#1d1d1f" }}>
              {flat.status}
            </span>
            . Similar available flats are nearby.
          </div>
        )}
      </div>

      {/* Price breakdown */}
      <div
        className="p-5 mt-auto"
        style={{ borderTop: "1px solid rgba(0,0,0,0.08)" }}
      >
        <div className="text-micro mb-3" style={{ fontWeight: 600, color: "rgba(0,0,0,0.48)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Price Breakdown
        </div>
        <div className="space-y-2">
          {[
            ["Base Price", formatPrice(Math.round(flat.total_price * 0.88))],
            ["Parking", "₹3,50,000"],
            ["Club Membership", "₹75,000"],
            ["PLC", `₹${Math.round(flat.carpet_area_sqft * 50).toLocaleString()}`],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between text-caption" style={{ color: "rgba(0,0,0,0.56)" }}>
              <span>{k}</span>
              <span style={{ color: "#1d1d1f" }}>{v}</span>
            </div>
          ))}
          <div
            className="flex justify-between text-caption font-semibold pt-2"
            style={{ borderTop: "1px solid rgba(0,0,0,0.08)", color: "#1d1d1f" }}
          >
            <span>All-in Price</span>
            <span style={{ color: "#0071e3" }}>{formatPrice(flat.total_price)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
