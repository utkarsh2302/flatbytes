"use client";

import { useMemo, useState, useTransition } from "react";
import { BookOpen, Check, Building2, IndianRupee, Phone, User, ChevronRight } from "lucide-react";
import type { BrokerInventoryFlat } from "@/lib/broker";
import { inrShort, inrFull } from "@/lib/format";
import { bookFlat } from "./actions";

interface RecentBooking {
  id: string; buyerName: string; buyerPhone: string; agreementValue: number;
  status: string; bookedAt: string; flatNumber: string; projectName: string;
}

export default function BookFlatClient({ inventory, recent }: { inventory: BrokerInventoryFlat[]; recent: RecentBooking[] }) {
  const [projectId, setProjectId] = useState("");
  const [flatId, setFlatId]       = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [notes, setNotes]         = useState("");
  const [agreementValue, setAgreementValue] = useState<number | "">("");

  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; error?: string } | null>(null);

  // Unique projects from available inventory
  const projects = useMemo(() => {
    const map = new Map<string, string>();
    inventory.forEach((f) => map.set(f.project_id, f.project_name));
    return Array.from(map, ([id, name]) => ({ id, name }));
  }, [inventory]);

  const flatsForProject = useMemo(
    () => inventory.filter((f) => f.project_id === projectId),
    [inventory, projectId]
  );
  const selectedFlat = inventory.find((f) => f.id === flatId) ?? null;

  function chooseFlat(f: BrokerInventoryFlat) {
    setFlatId(f.id);
    setAgreementValue(f.total_price);
  }

  function submit() {
    setResult(null);
    startTransition(async () => {
      const r = await bookFlat({
        flatId, projectId,
        agreementValue: typeof agreementValue === "number" ? agreementValue : 0,
        buyerName, buyerPhone, notes,
      });
      setResult(r);
      if (r.ok) {
        setBuyerName(""); setBuyerPhone(""); setNotes("");
        setFlatId(""); setAgreementValue("");
      }
    });
  }

  const canSubmit = projectId && flatId && buyerName.trim() && buyerPhone.trim() && !pending;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(0,113,227,0.1)" }}>
          <BookOpen className="w-5 h-5" style={{ color: "#0071e3" }} />
        </div>
        <div>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#1d1d1f" }}>Book a Flat</h1>
          <p style={{ fontSize: "0.8rem", color: "rgba(0,0,0,0.5)" }}>Record a confirmed booking for your client</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Form */}
        <div className="lg:col-span-2 space-y-4">
          {/* 1. Project */}
          <div className="rounded-2xl p-5" style={{ background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "rgba(0,0,0,0.45)", letterSpacing: "0.05em", textTransform: "uppercase" }}>Step 1 · Project</label>
            <select
              value={projectId}
              onChange={(e) => { setProjectId(e.target.value); setFlatId(""); setAgreementValue(""); }}
              className="w-full mt-2 px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: "#f7f7f8", border: "1.5px solid rgba(0,0,0,0.08)", color: "#1d1d1f" }}>
              <option value="">Select a project…</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          {/* 2. Flat */}
          {projectId && (
            <div className="rounded-2xl p-5" style={{ background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "rgba(0,0,0,0.45)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                Step 2 · Available Flat ({flatsForProject.length})
              </label>
              {flatsForProject.length === 0 ? (
                <p className="mt-3 text-sm" style={{ color: "rgba(0,0,0,0.4)" }}>No available flats in this project.</p>
              ) : (
                <div className="mt-3 grid sm:grid-cols-2 gap-2 max-h-72 overflow-auto">
                  {flatsForProject.map((f) => {
                    const active = f.id === flatId;
                    return (
                      <button key={f.id} onClick={() => chooseFlat(f)}
                        className="text-left p-3 rounded-xl transition-all"
                        style={{ background: active ? "rgba(0,113,227,0.06)" : "#f7f7f8", border: `1.5px solid ${active ? "#0071e3" : "transparent"}`, cursor: "pointer" }}>
                        <div className="flex items-center justify-between">
                          <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "#1d1d1f" }}>Flat {f.flat_number}</span>
                          {active && <Check className="w-4 h-4" style={{ color: "#0071e3" }} />}
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "rgba(0,0,0,0.5)", marginTop: 2 }}>
                          {f.flat_type} · Floor {f.floor} · {f.carpet_area_sqft} sq.ft
                        </div>
                        <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#0071e3", marginTop: 4 }}>{inrShort(f.total_price)}</div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 3. Client + value */}
          {selectedFlat && (
            <div className="rounded-2xl p-5 space-y-3" style={{ background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "rgba(0,0,0,0.45)", letterSpacing: "0.05em", textTransform: "uppercase" }}>Step 3 · Client Details</label>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "rgba(0,0,0,0.3)" }} />
                  <input value={buyerName} onChange={(e) => setBuyerName(e.target.value)} placeholder="Client full name"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: "#f7f7f8", border: "1.5px solid rgba(0,0,0,0.08)", color: "#1d1d1f" }} />
                </div>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "rgba(0,0,0,0.3)" }} />
                  <input value={buyerPhone} onChange={(e) => setBuyerPhone(e.target.value)} placeholder="Client phone" inputMode="tel"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: "#f7f7f8", border: "1.5px solid rgba(0,0,0,0.08)", color: "#1d1d1f" }} />
                </div>
              </div>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "rgba(0,0,0,0.3)" }} />
                <input value={agreementValue} onChange={(e) => setAgreementValue(e.target.value === "" ? "" : Number(e.target.value.replace(/\D/g, "")))}
                  placeholder="Agreement value" inputMode="numeric"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: "#f7f7f8", border: "1.5px solid rgba(0,0,0,0.08)", color: "#1d1d1f" }} />
                {typeof agreementValue === "number" && agreementValue > 0 && (
                  <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: "0.72rem", color: "rgba(0,0,0,0.4)" }}>{inrFull(agreementValue)}</span>
                )}
              </div>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (optional)" rows={2}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: "#f7f7f8", border: "1.5px solid rgba(0,0,0,0.08)", color: "#1d1d1f" }} />

              {result && (
                <div className="rounded-xl px-3 py-2.5 text-sm" style={{ background: result.ok ? "rgba(28,199,127,0.1)" : "rgba(239,68,68,0.08)", color: result.ok ? "#1a7f4a" : "#b91c1c" }}>
                  {result.ok ? "✅ Booking recorded successfully." : result.error}
                </div>
              )}

              <button onClick={submit} disabled={!canSubmit}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm"
                style={{ background: canSubmit ? "#0071e3" : "#c7c7cc", color: "#fff", border: "none", cursor: canSubmit ? "pointer" : "not-allowed" }}>
                {pending ? "Recording…" : <>Confirm Booking <ChevronRight className="w-4 h-4" /></>}
              </button>
            </div>
          )}
        </div>

        {/* Recent bookings */}
        <div className="rounded-2xl p-5 h-fit" style={{ background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <h2 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#1d1d1f", marginBottom: 12 }}>Your Recent Bookings</h2>
          {recent.length === 0 ? (
            <div className="py-8 text-center" style={{ color: "rgba(0,0,0,0.35)", fontSize: "0.82rem" }}>
              <Building2 className="w-6 h-6 mx-auto mb-2" style={{ color: "rgba(0,0,0,0.18)" }} />
              No bookings yet.
            </div>
          ) : (
            <div className="space-y-2">
              {recent.map((b) => (
                <div key={b.id} className="p-3 rounded-xl" style={{ background: "#f7f7f8" }}>
                  <div className="flex items-center justify-between">
                    <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#1d1d1f" }}>{b.buyerName}</span>
                    <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#1a7f4a" }}>{inrShort(b.agreementValue)}</span>
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "rgba(0,0,0,0.5)", marginTop: 2 }}>
                    {b.projectName} · Flat {b.flatNumber}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
