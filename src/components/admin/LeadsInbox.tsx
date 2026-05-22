"use client";

import { useState, useTransition } from "react";
import type { LeadRow } from "@/lib/leads";
import { updateLeadStatus, updateLeadNote, type LeadStatus } from "@/lib/actions";
import { Phone, MessageCircle, ChevronDown, Trophy, Users, Search } from "lucide-react";

const STATUS_OPTIONS: { value: LeadStatus; label: string; color: string; bg: string }[] = [
  { value: "new", label: "New", color: "#0071e3", bg: "rgba(0,113,227,0.1)" },
  { value: "contacted", label: "Contacted", color: "#ff9f0a", bg: "rgba(255,159,10,0.1)" },
  { value: "visit_scheduled", label: "Visit Booked", color: "#af52de", bg: "rgba(175,82,222,0.1)" },
  { value: "negotiating", label: "Negotiating", color: "#ff6b00", bg: "rgba(255,107,0,0.1)" },
  { value: "won", label: "Won", color: "#34c759", bg: "rgba(52,199,89,0.1)" },
  { value: "lost", label: "Lost", color: "#ff3b30", bg: "rgba(255,59,48,0.1)" },
];

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function StatusPill({ status }: { status: string }) {
  const opt = STATUS_OPTIONS.find((s) => s.value === status) ?? STATUS_OPTIONS[0];
  return (
    <span
      className="text-micro px-2 py-0.5 rounded-pill font-medium"
      style={{ color: opt.color, background: opt.bg }}
    >
      {opt.label}
    </span>
  );
}

interface RowProps {
  lead: LeadRow;
}

function LeadRow({ lead }: RowProps) {
  const [status, setStatus] = useState<LeadStatus>((lead.status as LeadStatus) ?? "new");
  const [note, setNote] = useState(lead.note ?? "");
  const [editingNote, setEditingNote] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [isPending, startTransition] = useTransition();

  function changeStatus(s: LeadStatus) {
    setStatus(s);
    startTransition(() => updateLeadStatus(lead.id, s));
  }

  function saveNote() {
    setEditingNote(false);
    startTransition(() => updateLeadNote(lead.id, note));
  }

  return (
    <div
      className="rounded-large overflow-hidden transition-shadow"
      style={{ background: "#fff", boxShadow: "rgba(0,0,0,0.06) 0px 1px 8px" }}
    >
      {/* Main row */}
      <div
        className="flex items-center gap-4 px-5 py-4 cursor-pointer"
        onClick={() => setExpanded((e) => !e)}
      >
        {/* Avatar */}
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-semibold"
          style={{ background: "rgba(0,113,227,0.1)", color: "#0071e3" }}
        >
          {lead.name.charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-caption font-semibold" style={{ color: "#1d1d1f" }}>{lead.name}</span>
            <StatusPill status={status} />
          </div>
          <div className="text-micro mt-0.5 truncate" style={{ color: "rgba(0,0,0,0.48)" }}>
            {lead.project_name}
            {lead.flat_number && ` · Flat ${lead.flat_number}`}
            {lead.flat_type && ` · ${lead.flat_type.toUpperCase()}`}
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 shrink-0">
          {status !== "won" && (
            <button
              onClick={(e) => { e.stopPropagation(); changeStatus("won"); }}
              title="Mark as Won"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-standard text-micro font-semibold transition-colors"
              style={{ background: "rgba(52,199,89,0.12)", color: "#1a7f4a", border: "1px solid rgba(52,199,89,0.2)" }}
            >
              <Trophy className="w-3 h-3" />
              Won
            </button>
          )}
          <a
            href={`tel:+91${lead.phone}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-standard text-micro font-medium transition-colors"
            style={{ background: "rgba(0,113,227,0.08)", color: "#0071e3" }}
          >
            <Phone className="w-3.5 h-3.5" />
            Call
          </a>
          <a
            href={`https://wa.me/91${lead.phone}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-standard text-micro font-medium transition-colors"
            style={{ background: "rgba(37,211,102,0.1)", color: "#128c7e" }}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            WhatsApp
          </a>
        </div>

        <div className="text-micro shrink-0" style={{ color: "rgba(0,0,0,0.36)" }}>
          {timeAgo(lead.created_at)}
        </div>

        <ChevronDown
          className="w-4 h-4 shrink-0 transition-transform"
          style={{ color: "rgba(0,0,0,0.3)", transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </div>

      {/* Expanded */}
      {expanded && (
        <div className="px-5 pb-4 border-t" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
          <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Lead details */}
            <div className="space-y-2">
              <p className="text-micro font-semibold uppercase tracking-wide" style={{ color: "rgba(0,0,0,0.4)" }}>Details</p>
              <div className="text-caption" style={{ color: "#1d1d1f" }}>
                <span style={{ color: "rgba(0,0,0,0.5)" }}>Phone: </span>
                <a href={`tel:+91${lead.phone}`} style={{ color: "#0071e3" }}>+91 {lead.phone}</a>
              </div>
              <div className="text-caption" style={{ color: "#1d1d1f" }}>
                <span style={{ color: "rgba(0,0,0,0.5)" }}>Source: </span>{lead.source}
              </div>
              <div className="text-caption" style={{ color: "#1d1d1f" }}>
                <span style={{ color: "rgba(0,0,0,0.5)" }}>Received: </span>
                {new Date(lead.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>

            {/* Status + note */}
            <div className="space-y-3">
              <p className="text-micro font-semibold uppercase tracking-wide" style={{ color: "rgba(0,0,0,0.4)" }}>Update status</p>
              <div className="flex flex-wrap gap-1.5">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => changeStatus(opt.value)}
                    className="px-3 py-1 rounded-pill text-micro font-medium transition-all"
                    style={
                      status === opt.value
                        ? { background: opt.color, color: "#fff" }
                        : { background: opt.bg, color: opt.color }
                    }
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Note */}
              <div>
                <p className="text-micro font-semibold uppercase tracking-wide mb-1.5" style={{ color: "rgba(0,0,0,0.4)" }}>Note</p>
                {editingNote ? (
                  <div className="space-y-2">
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 rounded-standard text-sm outline-none resize-none"
                      style={{ background: "#f5f5f7", border: "1px solid rgba(0,113,227,0.3)", color: "#1d1d1f" }}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button onClick={saveNote} className="px-3 py-1 rounded-standard text-micro font-medium" style={{ background: "#0071e3", color: "#fff" }}>Save</button>
                      <button onClick={() => setEditingNote(false)} className="px-3 py-1 rounded-standard text-micro" style={{ background: "#f5f5f7", color: "rgba(0,0,0,0.6)" }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => setEditingNote(true)}
                    className="px-3 py-2 rounded-standard text-sm cursor-text min-h-[36px]"
                    style={{ background: "#f5f5f7", color: note ? "#1d1d1f" : "rgba(0,0,0,0.3)" }}
                  >
                    {note || "Add a note…"}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile quick actions */}
          <div className="sm:hidden flex gap-2 mt-4">
            <a href={`tel:+91${lead.phone}`}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-standard text-sm font-medium"
              style={{ background: "rgba(0,113,227,0.08)", color: "#0071e3" }}>
              <Phone className="w-4 h-4" /> Call
            </a>
            <a href={`https://wa.me/91${lead.phone}`} target="_blank" rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-standard text-sm font-medium"
              style={{ background: "rgba(37,211,102,0.1)", color: "#128c7e" }}>
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </a>
            {status !== "won" && (
              <button
                onClick={() => changeStatus("won")}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-standard text-sm font-semibold"
                style={{ background: "rgba(52,199,89,0.12)", color: "#1a7f4a" }}>
                <Trophy className="w-4 h-4" /> Won
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function LeadsInbox({ leads }: { leads: LeadRow[] }) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filtered = leads.filter((l) => {
    const matchSearch = !search || l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.phone.includes(search) || l.project_name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || l.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-heading" style={{ color: "#1d1d1f" }}>Leads</h1>
          <p className="text-body mt-1" style={{ color: "rgba(0,0,0,0.48)" }}>
            {leads.length} lead{leads.length !== 1 ? "s" : ""} total
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "rgba(0,0,0,0.3)" }} />
          <input
            type="text"
            placeholder="Search by name, phone, project…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-standard text-sm outline-none"
            style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.1)", color: "#1d1d1f" }}
          />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {["all", ...STATUS_OPTIONS.map((s) => s.value)].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className="px-3 py-1.5 rounded-pill text-micro font-medium transition-all"
              style={
                filterStatus === s
                  ? { background: "#0071e3", color: "#fff" }
                  : { background: "#fff", color: "rgba(0,0,0,0.56)", border: "1px solid rgba(0,0,0,0.1)" }
              }
            >
              {s === "all" ? "All" : STATUS_OPTIONS.find((o) => o.value === s)?.label}
            </button>
          ))}
        </div>
      </div>

      {/* Leads list */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="text-body" style={{ color: "rgba(0,0,0,0.4)" }}>
            {leads.length === 0 ? "No leads yet. Share your project link to start capturing enquiries." : "No leads match your filter."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((lead) => (
            <LeadRow key={lead.id} lead={lead} />
          ))}
        </div>
      )}
    </div>
  );
}
