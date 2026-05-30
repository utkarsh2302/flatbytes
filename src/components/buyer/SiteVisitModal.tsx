"use client";

import { useState, useTransition, useEffect } from "react";
import { X, Calendar, Clock, Phone, User, CheckCircle2, Loader2 } from "lucide-react";

interface Props {
  projectId: string;
  projectName: string;
  flatId?: string;
  flatNumber?: string;
  orgId?: string;
  onClose: () => void;
}

const SLOTS = [
  { id: "morning",   label: "Morning",   sub: "9 AM – 12 PM", icon: "🌅" },
  { id: "afternoon", label: "Afternoon", sub: "12 PM – 4 PM",  icon: "☀️" },
  { id: "evening",   label: "Evening",   sub: "4 PM – 7 PM",  icon: "🌆" },
];

// Minimum booking date = tomorrow
function minDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}
function maxDate() {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().split("T")[0];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });
}

export default function SiteVisitModal({ projectId, projectName, flatId, flatNumber, orgId, onClose }: Props) {
  const [step, setStep] = useState<"form" | "confirm" | "done">("form");
  const [pending, start] = useTransition();

  const [name, setName]         = useState("");
  const [phone, setPhone]       = useState("");
  const [date, setDate]         = useState(minDate());
  const [slot, setSlot]         = useState("morning");
  const [error, setError]       = useState("");

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // Esc to close
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const validate = () => {
    if (!name.trim()) return "Please enter your name";
    if (!/^\d{10}$/.test(phone.replace(/\s/g, ""))) return "Enter a valid 10-digit mobile number";
    if (!date) return "Please select a date";
    return "";
  };

  const handleConfirm = () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError("");
    setStep("confirm");
  };

  const handleBook = () => {
    start(async () => {
      try {
        const res = await fetch("/api/visit/book", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId, flatId: flatId ?? null, orgId: orgId ?? null,
            visitorName: name.trim(),
            visitorPhone: phone.replace(/\s/g, ""),
            preferredDate: date,
            preferredSlot: slot,
          }),
        });
        if (!res.ok) throw new Error("Booking failed");
        setStep("done");
      } catch {
        setError("Something went wrong. Please try WhatsApp instead.");
        setStep("form");
      }
    });
  };

  const selectedSlot = SLOTS.find(s => s.id === slot)!;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50" style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}
        onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-x-0 bottom-0 sm:inset-0 z-50 flex sm:items-center sm:justify-center p-0 sm:p-4">
        <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col"
          style={{ background: "#fff", maxHeight: "92svh", animation: "slideUpSheet 0.32s cubic-bezier(0.34,1.2,0.64,1)" }}>

          {/* Handle */}
          <div className="shrink-0 flex justify-center pt-3 pb-1 sm:hidden">
            <div className="w-10 h-1 rounded-full" style={{ background: "rgba(0,0,0,0.15)" }} />
          </div>

          {/* Header */}
          <div className="shrink-0 flex items-center justify-between px-6 py-4"
            style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: "1.1rem", color: "#1d1d1f" }}>
                {step === "done" ? "Visit Booked!" : "Book a Site Visit"}
              </div>
              <div style={{ fontSize: "0.78rem", color: "rgba(0,0,0,0.45)", marginTop: 2 }}>
                {projectName}{flatNumber ? ` · Flat ${flatNumber}` : ""}
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: "#f5f5f7", border: "none", cursor: "pointer", color: "rgba(0,0,0,0.5)" }}>
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-5">

            {/* ── DONE ── */}
            {step === "done" && (
              <div className="flex flex-col items-center text-center py-6 gap-5">
                <div className="w-20 h-20 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(28,199,127,0.1)" }}>
                  <CheckCircle2 className="w-10 h-10" style={{ color: "#1cc77f" }} />
                </div>
                <div>
                  <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#1d1d1f" }}>
                    You&#39;re confirmed!
                  </div>
                  <div style={{ fontSize: "0.875rem", color: "rgba(0,0,0,0.5)", marginTop: 8, lineHeight: 1.6 }}>
                    Your visit at <strong>{projectName}</strong> is booked for{" "}
                    <strong>{formatDate(date)}</strong> · {selectedSlot.label}.<br/>
                    Our team will call you on <strong>{phone}</strong> to confirm.
                  </div>
                </div>
                <div className="w-full rounded-2xl p-4" style={{ background: "#f7f7f8" }}>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 shrink-0" style={{ color: "#0071e3" }} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "#1d1d1f" }}>{formatDate(date)}</div>
                      <div style={{ fontSize: "0.75rem", color: "rgba(0,0,0,0.45)" }}>{selectedSlot.icon} {selectedSlot.label} · {selectedSlot.sub}</div>
                    </div>
                  </div>
                </div>
                <button onClick={onClose} className="w-full py-3 rounded-2xl font-semibold text-sm"
                  style={{ background: "#0071e3", color: "#fff", border: "none", cursor: "pointer" }}>
                  Done
                </button>
              </div>
            )}

            {/* ── CONFIRM ── */}
            {step === "confirm" && (
              <div className="space-y-4">
                <div style={{ fontSize: "0.9rem", color: "rgba(0,0,0,0.55)", lineHeight: 1.6 }}>
                  Please confirm your visit details:
                </div>
                <div className="rounded-2xl overflow-hidden" style={{ border: "1.5px solid rgba(0,0,0,0.08)" }}>
                  {[
                    { icon: <User className="w-4 h-4"/>, label: "Name", value: name },
                    { icon: <Phone className="w-4 h-4"/>, label: "Phone", value: phone },
                    { icon: <Calendar className="w-4 h-4"/>, label: "Date", value: formatDate(date) },
                    { icon: <Clock className="w-4 h-4"/>, label: "Time Slot", value: `${selectedSlot.icon} ${selectedSlot.label} · ${selectedSlot.sub}` },
                  ].map((row, i, arr) => (
                    <div key={row.label} className="flex items-center gap-3 px-4 py-3.5"
                      style={{ borderBottom: i < arr.length - 1 ? "1px solid rgba(0,0,0,0.06)" : "none" }}>
                      <div style={{ color: "#0071e3" }}>{row.icon}</div>
                      <div>
                        <div style={{ fontSize: "0.7rem", color: "rgba(0,0,0,0.42)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{row.label}</div>
                        <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#1d1d1f", marginTop: 1 }}>{row.value}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {error && <div className="text-sm py-2 px-3 rounded-xl" style={{ background: "rgba(239,68,68,0.08)", color: "#dc2626" }}>{error}</div>}

                <div className="flex gap-3 pt-1">
                  <button onClick={() => setStep("form")} className="flex-1 py-3 rounded-2xl font-semibold text-sm"
                    style={{ background: "#f5f5f7", color: "#1d1d1f", border: "none", cursor: "pointer" }}>
                    Edit
                  </button>
                  <button onClick={handleBook} disabled={pending}
                    className="flex-1 py-3 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2"
                    style={{ background: "#0071e3", color: "#fff", border: "none", cursor: "pointer" }}>
                    {pending ? <Loader2 className="w-4 h-4 animate-spin"/> : <CheckCircle2 className="w-4 h-4"/>}
                    Confirm Visit
                  </button>
                </div>
              </div>
            )}

            {/* ── FORM ── */}
            {step === "form" && (
              <div className="space-y-5">
                {/* Name */}
                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "rgba(0,0,0,0.55)", display: "block", marginBottom: 6 }}>
                    Your Name
                  </label>
                  <div className="flex items-center gap-2.5 px-3.5 py-3 rounded-2xl"
                    style={{ background: "#f7f7f8", border: "1.5px solid rgba(0,0,0,0.08)" }}>
                    <User className="w-4 h-4 shrink-0" style={{ color: "rgba(0,0,0,0.35)" }} />
                    <input value={name} onChange={e => setName(e.target.value)} placeholder="Enter your full name"
                      className="flex-1 outline-none bg-transparent text-sm" style={{ color: "#1d1d1f" }} />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "rgba(0,0,0,0.55)", display: "block", marginBottom: 6 }}>
                    Mobile Number
                  </label>
                  <div className="flex items-center gap-2.5 px-3.5 py-3 rounded-2xl"
                    style={{ background: "#f7f7f8", border: "1.5px solid rgba(0,0,0,0.08)" }}>
                    <Phone className="w-4 h-4 shrink-0" style={{ color: "rgba(0,0,0,0.35)" }} />
                    <span style={{ fontSize: "0.875rem", color: "rgba(0,0,0,0.55)", marginRight: 2 }}>+91</span>
                    <input value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      placeholder="10-digit mobile" inputMode="tel" className="flex-1 outline-none bg-transparent text-sm"
                      style={{ color: "#1d1d1f" }} />
                  </div>
                </div>

                {/* Date */}
                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "rgba(0,0,0,0.55)", display: "block", marginBottom: 6 }}>
                    Preferred Date
                  </label>
                  <div className="flex items-center gap-2.5 px-3.5 py-3 rounded-2xl"
                    style={{ background: "#f7f7f8", border: "1.5px solid rgba(0,0,0,0.08)" }}>
                    <Calendar className="w-4 h-4 shrink-0" style={{ color: "rgba(0,0,0,0.35)" }} />
                    <input type="date" value={date} min={minDate()} max={maxDate()} onChange={e => setDate(e.target.value)}
                      className="flex-1 outline-none bg-transparent text-sm" style={{ color: "#1d1d1f" }} />
                  </div>
                  {date && <div style={{ fontSize: "0.72rem", color: "rgba(0,0,0,0.4)", marginTop: 5 }}>{formatDate(date)}</div>}
                </div>

                {/* Time slot */}
                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "rgba(0,0,0,0.55)", display: "block", marginBottom: 8 }}>
                    Preferred Time Slot
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {SLOTS.map(s => (
                      <button key={s.id} onClick={() => setSlot(s.id)}
                        className="flex flex-col items-center py-3.5 rounded-2xl transition-all"
                        style={{
                          background: slot === s.id ? "rgba(0,113,227,0.08)" : "#f7f7f8",
                          border: `2px solid ${slot === s.id ? "#0071e3" : "transparent"}`,
                          cursor: "pointer",
                        }}>
                        <span style={{ fontSize: "1.25rem" }}>{s.icon}</span>
                        <span style={{ fontSize: "0.78rem", fontWeight: 700, color: slot === s.id ? "#0071e3" : "#1d1d1f", marginTop: 4 }}>{s.label}</span>
                        <span style={{ fontSize: "0.62rem", color: "rgba(0,0,0,0.4)", marginTop: 2 }}>{s.sub}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {error && <div className="text-sm py-2 px-3 rounded-xl" style={{ background: "rgba(239,68,68,0.08)", color: "#dc2626" }}>{error}</div>}

                <button onClick={handleConfirm}
                  className="w-full py-3.5 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 mt-2"
                  style={{ background: "#0071e3", color: "#fff", border: "none", cursor: "pointer" }}>
                  <Calendar className="w-4 h-4" />
                  Book Site Visit
                </button>

                <p className="text-center" style={{ fontSize: "0.72rem", color: "rgba(0,0,0,0.35)" }}>
                  Free, no commitment. Our team will call to confirm within 2 hours.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
