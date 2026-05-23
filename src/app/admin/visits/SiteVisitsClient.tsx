"use client";

import { useState, useTransition } from "react";
import { Calendar, Phone, Check, X, QrCode, MessageCircle, ChevronDown } from "lucide-react";
import { scheduleVisit, markVisitAttended, markVisitNoShow } from "./actions";

interface VisitLead {
  id: string; name: string; phone: string;
  project_name: string; visit_date: string | null;
  flat_number: string | null; status: string;
}

interface PendingLead {
  id: string; name: string; phone: string;
  project_name: string; created_at: string;
}

interface Props {
  scheduled: VisitLead[];
  pending: PendingLead[];
  stats: { total: number; thisWeek: number; attended: number; conversionPct: number };
}

function QrModal({ lead, onClose }: { lead: VisitLead; onClose: () => void }) {
  const code = `VISIT-${lead.id.slice(0, 8).toUpperCase()}`;
  return (
    <>
      <div className="fixed inset-0 z-50" style={{ background: "rgba(0,0,0,0.45)" }} onClick={onClose} />
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-xs mx-auto rounded-3xl p-6 text-center" style={{ background: "#fff" }}>
        <div style={{ fontWeight: 700, fontSize: "1rem", color: "#1d1d1f", marginBottom: 4 }}>Check-in Code</div>
        <div style={{ fontSize: "0.8rem", color: "rgba(0,0,0,0.5)", marginBottom: 20 }}>{lead.name}</div>
        {/* Simulated QR */}
        <div className="mx-auto mb-4 flex items-center justify-center rounded-2xl" style={{ width: 160, height: 160, background: "#f5f5f7" }}>
          <div className="grid grid-cols-5 gap-1">
            {Array.from({ length: 25 }).map((_, i) => (
              <div key={i} className="rounded-sm" style={{ width: 20, height: 20, background: (i % 3 === 0 || i % 7 === 0) ? "#1d1d1f" : "#f5f5f7" }} />
            ))}
          </div>
        </div>
        <div className="px-4 py-2.5 rounded-xl mb-4" style={{ background: "#f5f5f7", fontFamily: "monospace", fontWeight: 700, fontSize: "1rem", color: "#1d1d1f", letterSpacing: "0.1em" }}>
          {code}
        </div>
        <div style={{ fontSize: "0.75rem", color: "rgba(0,0,0,0.4)", marginBottom: 16 }}>Share this code with the visitor to verify on-site arrival</div>
        <button onClick={onClose} className="w-full py-2.5 rounded-xl text-sm font-semibold" style={{ background: "#1d1d1f", color: "#fff", border: "none", cursor: "pointer" }}>
          Close
        </button>
      </div>
    </>
  );
}

function FeedbackModal({ lead, onClose }: { lead: VisitLead; onClose: () => void }) {
  const [feedback, setFeedback] = useState("");
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);

  if (done) return null;

  return (
    <>
      <div className="fixed inset-0 z-50" style={{ background: "rgba(0,0,0,0.45)" }} onClick={onClose} />
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-sm mx-auto rounded-3xl p-6" style={{ background: "#fff" }}>
        <div style={{ fontWeight: 700, fontSize: "1rem", color: "#1d1d1f", marginBottom: 4 }}>Mark Visit Attended</div>
        <div style={{ fontSize: "0.8rem", color: "rgba(0,0,0,0.5)", marginBottom: 16 }}>{lead.name} · {lead.project_name}</div>
        <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={3}
          placeholder="Visit notes: interested in 3BHK, budget ~₹90L, needs parking..."
          className="w-full px-3 py-2.5 rounded-xl outline-none text-sm resize-none mb-4"
          style={{ background: "#f5f5f7", border: "1.5px solid rgba(0,0,0,0.07)" }} />
        <div className="flex gap-2">
          <button disabled={pending} onClick={() => start(async () => { const r = await markVisitAttended(lead.id, feedback); if (r.ok) setDone(true); })}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: "#1cc77f", color: "#fff", border: "none", cursor: "pointer" }}>
            <Check className="w-3.5 h-3.5 inline mr-1" />Attended
          </button>
          <button disabled={pending} onClick={() => start(async () => { const r = await markVisitNoShow(lead.id); if (r.ok) setDone(true); })}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "none", cursor: "pointer" }}>
            <X className="w-3.5 h-3.5 inline mr-1" />No Show
          </button>
        </div>
        <button onClick={onClose} className="w-full mt-2 py-2 rounded-xl text-xs" style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(0,0,0,0.4)" }}>
          Cancel
        </button>
      </div>
    </>
  );
}

function ScheduleModal({ lead, onClose }: { lead: PendingLead; onClose: () => void }) {
  const today = new Date().toISOString().slice(0, 16);
  const [date, setDate] = useState(today);
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);

  if (done) return null;

  return (
    <>
      <div className="fixed inset-0 z-50" style={{ background: "rgba(0,0,0,0.45)" }} onClick={onClose} />
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-sm mx-auto rounded-3xl p-6" style={{ background: "#fff" }}>
        <div style={{ fontWeight: 700, fontSize: "1rem", color: "#1d1d1f", marginBottom: 4 }}>Schedule Site Visit</div>
        <div style={{ fontSize: "0.8rem", color: "rgba(0,0,0,0.5)", marginBottom: 16 }}>{lead.name} · {lead.project_name}</div>
        <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "rgba(0,0,0,0.55)", display: "block", marginBottom: 6 }}>Visit Date & Time</label>
        <input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} min={today}
          className="w-full px-3 py-2.5 rounded-xl outline-none text-sm mb-5"
          style={{ background: "#f5f5f7", border: "1.5px solid rgba(0,0,0,0.07)" }} />
        <div className="flex gap-2">
          <button disabled={pending || !date} onClick={() => start(async () => { const r = await scheduleVisit(lead.id, date); if (r.ok) setDone(true); })}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: "#0071e3", color: "#fff", border: "none", cursor: "pointer" }}>
            <Calendar className="w-3.5 h-3.5 inline mr-1" />Confirm Visit
          </button>
          <button onClick={onClose} className="py-2.5 px-4 rounded-xl text-sm" style={{ background: "#f5f5f7", border: "none", cursor: "pointer", color: "rgba(0,0,0,0.5)" }}>
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}

export default function SiteVisitsClient({ scheduled, pending, stats }: Props) {
  const [qrLead, setQrLead] = useState<VisitLead | null>(null);
  const [feedbackLead, setFeedbackLead] = useState<VisitLead | null>(null);
  const [scheduleLead, setScheduleLead] = useState<PendingLead | null>(null);
  const [showPending, setShowPending] = useState(true);

  const today = new Date().toDateString();
  const todayVisits = scheduled.filter((v) => v.visit_date && new Date(v.visit_date).toDateString() === today);
  const upcomingVisits = scheduled.filter((v) => v.visit_date && new Date(v.visit_date).toDateString() !== today);

  return (
    <div className="p-5 sm:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 style={{ fontSize: "1.6rem", fontWeight: 700, color: "#1d1d1f", letterSpacing: "-0.02em" }}>Site Visit Management</h1>
        <p className="mt-1" style={{ fontSize: "0.9rem", color: "rgba(0,0,0,0.5)" }}>Schedule visits, track attendance, measure visit-to-booking conversion.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Scheduled", value: String(stats.total), color: "#0071e3" },
          { label: "This Week", value: String(stats.thisWeek), color: "#a855f7" },
          { label: "Attended", value: String(stats.attended), color: "#1cc77f" },
          { label: "Visit→Booking", value: `${stats.conversionPct}%`, color: "#f59e0b" },
        ].map((k) => (
          <div key={k.label} className="rounded-2xl p-4" style={{ background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: "1.4rem", fontWeight: 700, color: k.color }}>{k.value}</div>
            <div style={{ fontSize: "0.72rem", color: "rgba(0,0,0,0.45)", marginTop: 2 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Today's visits */}
      {todayVisits.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#1d1d1f" }}>Today</h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: "rgba(0,113,227,0.1)", color: "#0071e3" }}>{todayVisits.length}</span>
          </div>
          <div className="space-y-3">
            {todayVisits.map((v) => <VisitCard key={v.id} visit={v} onQr={setQrLead} onFeedback={setFeedbackLead} isToday />)}
          </div>
        </div>
      )}

      {/* Upcoming */}
      {upcomingVisits.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-3" style={{ fontSize: "1rem", fontWeight: 700, color: "#1d1d1f" }}>Upcoming</h2>
          <div className="space-y-3">
            {upcomingVisits.map((v) => <VisitCard key={v.id} visit={v} onQr={setQrLead} onFeedback={setFeedbackLead} isToday={false} />)}
          </div>
        </div>
      )}

      {scheduled.length === 0 && (
        <div className="rounded-2xl py-12 text-center mb-6" style={{ background: "#fff" }}>
          <Calendar className="w-10 h-10 mx-auto mb-3" style={{ color: "rgba(0,0,0,0.2)" }} />
          <p style={{ color: "rgba(0,0,0,0.4)", fontSize: "0.9rem" }}>No visits scheduled. Schedule one from a lead below.</p>
        </div>
      )}

      {/* Pending scheduling */}
      {pending.length > 0 && (
        <div>
          <button onClick={() => setShowPending((v) => !v)}
            className="flex items-center gap-2 mb-3 w-full text-left"
            style={{ background: "none", border: "none", cursor: "pointer" }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#1d1d1f" }}>Schedule a Visit</h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: "rgba(245,158,11,0.1)", color: "#b45309" }}>{pending.length} leads</span>
            <ChevronDown className="w-4 h-4 ml-auto" style={{ color: "rgba(0,0,0,0.4)", transform: showPending ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
          </button>
          {showPending && (
            <div className="space-y-2.5">
              {pending.map((l) => (
                <div key={l.id} className="rounded-2xl p-4 flex items-center gap-4" style={{ background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                  <div className="flex-1 min-w-0">
                    <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "#1d1d1f" }}>{l.name}</div>
                    <div style={{ fontSize: "0.72rem", color: "rgba(0,0,0,0.45)", marginTop: 2 }}>{l.project_name} · {l.phone}</div>
                  </div>
                  <button onClick={() => setScheduleLead(l)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
                    style={{ background: "rgba(0,113,227,0.08)", color: "#0071e3", border: "none", cursor: "pointer" }}>
                    <Calendar className="w-3.5 h-3.5" /> Schedule
                  </button>
                  <a href={`tel:${l.phone}`} className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: "rgba(28,199,127,0.1)", color: "#1cc77f" }}>
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {qrLead && <QrModal lead={qrLead} onClose={() => setQrLead(null)} />}
      {feedbackLead && <FeedbackModal lead={feedbackLead} onClose={() => setFeedbackLead(null)} />}
      {scheduleLead && <ScheduleModal lead={scheduleLead} onClose={() => setScheduleLead(null)} />}
    </div>
  );
}

function VisitCard({ visit, onQr, onFeedback, isToday }: { visit: VisitLead; onQr: (v: VisitLead) => void; onFeedback: (v: VisitLead) => void; isToday: boolean }) {
  const date = visit.visit_date ? new Date(visit.visit_date) : null;
  return (
    <div className="rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-4"
      style={{ background: "#fff", boxShadow: isToday ? "0 2px 8px rgba(0,113,227,0.1)" : "0 1px 3px rgba(0,0,0,0.06)", border: isToday ? "1.5px solid rgba(0,113,227,0.15)" : "none" }}>
      <div className="shrink-0 w-12 h-12 rounded-xl flex flex-col items-center justify-center" style={{ background: isToday ? "rgba(0,113,227,0.08)" : "#f5f5f7" }}>
        <span style={{ fontSize: "0.9rem", fontWeight: 800, color: isToday ? "#0071e3" : "#1d1d1f", lineHeight: 1 }}>
          {date ? date.getDate() : "—"}
        </span>
        <span style={{ fontSize: "0.6rem", color: isToday ? "#0071e3" : "rgba(0,0,0,0.4)", fontWeight: 600 }}>
          {date ? date.toLocaleDateString("en-IN", { month: "short" }) : ""}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#1d1d1f" }}>{visit.name}</div>
        <div style={{ fontSize: "0.74rem", color: "rgba(0,0,0,0.5)", marginTop: 2 }}>
          {visit.project_name}{visit.flat_number ? ` · Flat ${visit.flat_number}` : ""}
          {date ? ` · ${date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}` : ""}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <a href={`https://wa.me/${visit.phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Hi ${visit.name}, confirming your site visit at ${visit.project_name} today. Please let us know if you have any questions!`)}`}
          target="_blank" rel="noopener noreferrer"
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: "rgba(37,211,102,0.1)", color: "#128c5e" }}>
          <MessageCircle className="w-3.5 h-3.5" />
        </a>
        <button onClick={() => onQr(visit)} className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: "rgba(168,85,247,0.1)", color: "#a855f7", border: "none", cursor: "pointer" }}>
          <QrCode className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => onFeedback(visit)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
          style={{ background: isToday ? "#0071e3" : "#f5f5f7", color: isToday ? "#fff" : "rgba(0,0,0,0.6)", border: "none", cursor: "pointer" }}>
          <Check className="w-3 h-3" /> Update
        </button>
      </div>
    </div>
  );
}
