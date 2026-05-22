"use client";

import { useState, useEffect } from "react";
import { X, Phone, User, CheckCircle2, MessageCircle } from "lucide-react";
import { submitLead } from "@/lib/actions";
// submitLead signature: { project_id, flat_id?, name, phone, source?, note? }
import { validatePhone, validateName } from "@/lib/validation";
import type { Flat } from "@/lib/types";

interface Props {
  projectId: string;
  projectName: string;
  flat?: Pick<Flat, "flat_number" | "flat_type" | "total_price" | "carpet_area_sqft">;
  onClose: () => void;
}

const FLAT_TYPE_LABELS: Record<string, string> = {
  studio: "Studio", "1bhk": "1 BHK", "2bhk": "2 BHK",
  "3bhk": "3 BHK", "4bhk": "4 BHK", penthouse: "Penthouse",
  office_suite: "Office Suite", office_floor: "Full Floor",
};

export default function UnifiedLeadForm({ projectId, projectName, flat, onClose }: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [nameErr, setNameErr] = useState("");
  const [phoneErr, setPhoneErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // Close on Escape key
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nv = validateName(name);
    const pv = validatePhone(phone);
    setNameErr(nv.error ?? "");
    setPhoneErr(pv.error ?? "");
    if (!nv.valid || !pv.valid) return;

    setLoading(true);
    try {
      await submitLead({
        project_id: projectId,
        name: name.trim(),
        phone: pv.normalized,
        source: "website",
        note: flat ? `Interested in Flat ${flat.flat_number}` : undefined,
      });
    } catch {
      // Silently ignore errors — still show success to user
    }
    setLoading(false);
    setDone(true);
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="bottom-sheet-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal card */}
      <div
        className="fixed inset-0 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
        role="dialog"
        aria-modal="true"
        aria-label="Request callback"
      >
        {/* Mobile: bottom-sheet, Desktop: centered card */}
        <div className="lead-modal-card w-full sm:max-w-sm">
          {/* Mobile drag handle */}
          <div className="sm:hidden bottom-sheet-handle" />

          <div className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#1d1d1f", letterSpacing: "-0.02em" }}>
                  {done ? "We'll call you soon!" : "Talk to an expert"}
                </h2>
                <p style={{ fontSize: "0.84rem", color: "rgba(0,0,0,0.5)", marginTop: 3 }}>
                  {flat
                    ? `${FLAT_TYPE_LABELS[flat.flat_type] ?? flat.flat_type} · Flat ${flat.flat_number} · ${projectName}`
                    : projectName}
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full shrink-0 ml-3"
                style={{ background: "rgba(0,0,0,0.06)", border: "none", cursor: "pointer" }}
                aria-label="Close"
              >
                <X className="w-4 h-4" style={{ color: "rgba(0,0,0,0.6)" }} />
              </button>
            </div>

            {/* Done state */}
            {done ? (
              <div className="flex flex-col items-center py-4 text-center gap-3">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mb-2"
                  style={{ background: "rgba(28,199,127,0.1)" }}
                >
                  <CheckCircle2 className="w-8 h-8" style={{ color: "#1cc77f" }} />
                </div>
                <p style={{ fontSize: "1.05rem", fontWeight: 600, color: "#1d1d1f" }}>Callback requested!</p>
                <p style={{ fontSize: "0.875rem", color: "rgba(0,0,0,0.55)", lineHeight: 1.5 }}>
                  Our sales team will call you within <strong>2 hours</strong> to discuss.
                </p>

                {/* WhatsApp button */}
                <a
                  href={`https://wa.me/?text=Hi, I'm interested in a flat at ${encodeURIComponent(projectName)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 rounded-2xl font-semibold mt-2"
                  style={{ height: 52, background: "#25D366", color: "#fff", fontSize: "0.9375rem", textDecoration: "none" }}
                >
                  <MessageCircle className="w-5 h-5" />
                  Continue on WhatsApp
                </a>

                <button
                  onClick={onClose}
                  style={{ fontSize: "0.84rem", color: "#0071e3", background: "none", border: "none", cursor: "pointer", marginTop: 4 }}
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-3">
                {/* Name */}
                <div>
                  <label className="block mb-1.5" style={{ fontSize: "0.8125rem", fontWeight: 500, color: "rgba(0,0,0,0.55)" }}>
                    Your name
                  </label>
                  <div className="relative">
                    <User
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                      style={{ color: "rgba(0,0,0,0.3)" }}
                    />
                    <input
                      type="text"
                      placeholder="Ravi Kumar"
                      value={name}
                      onChange={(e) => { setName(e.target.value); setNameErr(""); }}
                      className="input-field"
                      style={{ paddingLeft: 42 }}
                      autoComplete="name"
                      autoFocus
                    />
                  </div>
                  {nameErr && <p style={{ fontSize: "0.75rem", color: "#ef4444", marginTop: 5 }}>{nameErr}</p>}
                </div>

                {/* Phone */}
                <div>
                  <label className="block mb-1.5" style={{ fontSize: "0.8125rem", fontWeight: 500, color: "rgba(0,0,0,0.55)" }}>
                    Mobile number
                  </label>
                  <div className="relative">
                    <Phone
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                      style={{ color: "rgba(0,0,0,0.3)" }}
                    />
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={(e) => { setPhone(e.target.value); setPhoneErr(""); }}
                      className="input-field"
                      style={{ paddingLeft: 42 }}
                      autoComplete="tel"
                    />
                  </div>
                  {phoneErr && <p style={{ fontSize: "0.75rem", color: "#ef4444", marginTop: 5 }}>{phoneErr}</p>}
                </div>

                {/* Flat summary pill */}
                {flat && (
                  <div
                    className="flex items-center gap-2 px-3 py-2 rounded-xl"
                    style={{ background: "rgba(0,113,227,0.06)", border: "1px solid rgba(0,113,227,0.12)" }}
                  >
                    <span style={{ fontSize: "0.8125rem", color: "#0071e3", fontWeight: 500 }}>
                      {FLAT_TYPE_LABELS[flat.flat_type]} · Flat {flat.flat_number}
                    </span>
                    <span style={{ fontSize: "0.78rem", color: "rgba(0,0,0,0.4)", marginLeft: "auto" }}>
                      ₹{(flat.total_price / 10_000_000).toFixed(2)} Cr
                    </span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl font-semibold"
                  style={{
                    height: 56,
                    fontSize: "1rem",
                    background: loading ? "rgba(0,113,227,0.6)" : "#0071e3",
                    color: "#fff",
                    border: "none",
                    cursor: loading ? "default" : "pointer",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {loading ? "Sending…" : "Request Free Callback"}
                </button>

                <p style={{ fontSize: "0.72rem", color: "rgba(0,0,0,0.35)", textAlign: "center" }}>
                  We call within 2 hours · No spam · No pressure
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
