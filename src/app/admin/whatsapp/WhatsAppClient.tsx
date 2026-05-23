"use client";

import { useState } from "react";
import { MessageCircle, Plus, Trash2, Check, ChevronDown, ChevronUp, Send, Zap, Clock, ArrowDown } from "lucide-react";

// ── Automation workflow builder ────────────────────────────────────────────────

type TriggerType = "lead_created" | "visit_scheduled" | "visit_attended" | "no_show" | "booking_confirmed";
type ActionType = "send_brochure" | "send_greeting" | "send_site_visit_invite" | "send_followup" | "send_thankyou";
type DelayUnit = "minutes" | "hours" | "days";

interface WorkflowStep {
  id: string;
  type: "action" | "delay";
  action?: ActionType;
  delayAmount?: number;
  delayUnit?: DelayUnit;
}

interface Workflow {
  id: string;
  trigger: TriggerType;
  name: string;
  steps: WorkflowStep[];
  active: boolean;
}

const TRIGGER_LABELS: Record<TriggerType, string> = {
  lead_created: "When lead is created",
  visit_scheduled: "When visit is scheduled",
  visit_attended: "When visit is attended",
  no_show: "When visitor doesn't show",
  booking_confirmed: "When booking is confirmed",
};

const TRIGGER_ICONS: Record<TriggerType, string> = {
  lead_created: "✨",
  visit_scheduled: "📅",
  visit_attended: "✅",
  no_show: "⚠️",
  booking_confirmed: "🎉",
};

const ACTION_LABELS: Record<ActionType, string> = {
  send_brochure: "Send project brochure",
  send_greeting: "Send welcome message",
  send_site_visit_invite: "Send site visit invite",
  send_followup: "Send follow-up message",
  send_thankyou: "Send thank you message",
};

const ACTION_PREVIEWS: Record<ActionType, string> = {
  send_brochure: "Hi {name}, thanks for your interest in {project}! Here's our brochure: {link}",
  send_greeting: "Hi {name}! Welcome to {project}. We're excited to help you find your dream home. 🏠",
  send_site_visit_invite: "Hi {name}, we'd love to invite you for a site visit at {project}. When would work for you?",
  send_followup: "Hi {name}, just checking in on your interest in {project}. Any questions we can help with?",
  send_thankyou: "Thank you for visiting {project}, {name}! We hope you enjoyed the tour. Let us know if you'd like to proceed. 🙏",
};

const DEFAULT_WORKFLOWS: Workflow[] = [
  {
    id: "wf-1", name: "New Lead Nurture", active: true,
    trigger: "lead_created",
    steps: [
      { id: "s1", type: "action", action: "send_greeting" },
      { id: "s2", type: "delay", delayAmount: 1, delayUnit: "hours" },
      { id: "s3", type: "action", action: "send_brochure" },
      { id: "s4", type: "delay", delayAmount: 1, delayUnit: "days" },
      { id: "s5", type: "action", action: "send_site_visit_invite" },
    ],
  },
  {
    id: "wf-2", name: "Post-Visit Follow-up", active: true,
    trigger: "visit_attended",
    steps: [
      { id: "s1", type: "action", action: "send_thankyou" },
      { id: "s2", type: "delay", delayAmount: 24, delayUnit: "hours" },
      { id: "s3", type: "action", action: "send_followup" },
    ],
  },
  {
    id: "wf-3", name: "No Show Recovery", active: false,
    trigger: "no_show",
    steps: [
      { id: "s1", type: "delay", delayAmount: 2, delayUnit: "hours" },
      { id: "s2", type: "action", action: "send_followup" },
    ],
  },
];

const TEMPLATES_LIST = [
  { id: "t1", name: "New Launch Announcement", category: "Marketing", preview: "🏢 Exciting news! *{project}* is now officially open for bookings!\n\n📍 {location}\n💰 Starting {price}\n\nLimited units available. Reply to book your preferred unit now!\n\n📞 {phone}" },
  { id: "t2", name: "Site Visit Confirmation", category: "Visit", preview: "Hi {name}! ✅\n\nYour site visit to *{project}* is confirmed for *{date}* at *{time}*.\n\n📍 Address: {address}\n\nSee you there! Reply if you need to reschedule. — {agent}" },
  { id: "t3", name: "Payment Reminder", category: "Finance", preview: "Hi {name},\n\nFriendly reminder: Your payment of *₹{amount}* for Flat {flat} at *{project}* is due on *{date}*.\n\nPlease ensure timely payment to avoid any delays. 🙏\n\n— {builder}" },
  { id: "t4", name: "Booking Congratulations", category: "Booking", preview: "🎉 Congratulations, {name}!\n\nYou are now the proud owner of *Flat {flat}* at *{project}*!\n\nWelcome to the {project} family. We'll share all documentation shortly.\n\n— {builder} Team" },
  { id: "t5", name: "Construction Update", category: "Update", preview: "Hi {name},\n\n📸 Construction Update — {month} {year}\n\n{project} has reached *{milestone}*. Your flat is progressing as scheduled.\n\n[View latest photos] {link}\n\n— {builder}" },
  { id: "t6", name: "Follow-up (72 hours)", category: "CRM", preview: "Hi {name},\n\nHope you're doing well! Just checking in about your interest in *{project}*.\n\nWe have some great options in the {bhk} range that fit your budget. Would you like to schedule a call?\n\n📞 {phone}" },
];

const CATEGORY_COLORS: Record<string, { bg: string; color: string }> = {
  Marketing: { bg: "rgba(0,113,227,0.1)", color: "#0071e3" },
  Visit: { bg: "rgba(28,199,127,0.1)", color: "#1a7f4a" },
  Finance: { bg: "rgba(245,158,11,0.1)", color: "#b45309" },
  Booking: { bg: "rgba(124,58,237,0.1)", color: "#7c3aed" },
  Update: { bg: "rgba(99,102,241,0.1)", color: "#4f46e5" },
  CRM: { bg: "rgba(239,68,68,0.1)", color: "#dc2626" },
};

// ── Workflow step card ─────────────────────────────────────────────────────────

function StepCard({ step, onRemove }: { step: WorkflowStep; onRemove: () => void }) {
  if (step.type === "delay") return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 flex-1 px-3 py-2.5 rounded-xl" style={{ background: "rgba(99,102,241,0.08)", border: "1.5px dashed rgba(99,102,241,0.3)" }}>
        <Clock className="w-3.5 h-3.5" style={{ color: "#4f46e5", flexShrink: 0 }} />
        <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#4f46e5" }}>Wait {step.delayAmount} {step.delayUnit}</span>
      </div>
      <button onClick={onRemove} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
        <Trash2 className="w-3.5 h-3.5" style={{ color: "rgba(0,0,0,0.3)" }} />
      </button>
    </div>
  );

  const preview = step.action ? ACTION_PREVIEWS[step.action] : "";
  return (
    <div className="flex items-start gap-2">
      <div className="flex-1 rounded-xl overflow-hidden" style={{ border: "1.5px solid rgba(37,211,102,0.3)", background: "rgba(37,211,102,0.04)" }}>
        <div className="flex items-center gap-2 px-3 py-2.5" style={{ borderBottom: "1px solid rgba(37,211,102,0.15)" }}>
          <MessageCircle className="w-3.5 h-3.5" style={{ color: "#128c5e", flexShrink: 0 }} />
          <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#128c5e" }}>{step.action ? ACTION_LABELS[step.action] : ""}</span>
        </div>
        <div className="px-3 py-2" style={{ fontSize: "0.72rem", color: "rgba(0,0,0,0.55)", lineHeight: 1.55, whiteSpace: "pre-wrap" }}>
          {preview.slice(0, 120)}{preview.length > 120 ? "…" : ""}
        </div>
      </div>
      <button onClick={onRemove} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, marginTop: 8 }}>
        <Trash2 className="w-3.5 h-3.5" style={{ color: "rgba(0,0,0,0.3)" }} />
      </button>
    </div>
  );
}

// ── Workflow editor ────────────────────────────────────────────────────────────

function WorkflowEditor({ wf, onClose }: { wf: Workflow; onClose: () => void }) {
  const [steps, setSteps] = useState<WorkflowStep[]>(wf.steps);
  const [saved, setSaved] = useState(false);

  const addAction = (action: ActionType) => setSteps((prev) => [...prev, { id: `s${Date.now()}`, type: "action", action }]);
  const addDelay = () => setSteps((prev) => [...prev, { id: `s${Date.now()}`, type: "delay", delayAmount: 1, delayUnit: "days" }]);
  const removeStep = (id: string) => setSteps((prev) => prev.filter((s) => s.id !== id));

  return (
    <>
      <div className="fixed inset-0 z-50" style={{ background: "rgba(0,0,0,0.45)" }} onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[440px] overflow-y-auto" style={{ background: "#fff", boxShadow: "-8px 0 40px rgba(0,0,0,0.15)" }}>
        <div className="flex items-center justify-between px-5 py-4 sticky top-0 bg-white z-10" style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#1d1d1f" }}>{wf.name}</div>
            <div style={{ fontSize: "0.72rem", color: "rgba(0,0,0,0.45)", marginTop: 1 }}>{TRIGGER_ICONS[wf.trigger]} {TRIGGER_LABELS[wf.trigger]}</div>
          </div>
          <button onClick={onClose} style={{ background: "#f0f0f2", border: "none", cursor: "pointer", padding: "6px 10px", borderRadius: 10, fontSize: "0.8rem" }}>
            Close
          </button>
        </div>

        <div className="p-5 space-y-3">
          {/* Trigger */}
          <div className="rounded-xl p-3 flex items-center gap-2.5" style={{ background: "rgba(0,113,227,0.06)", border: "1.5px solid rgba(0,113,227,0.2)" }}>
            <Zap className="w-4 h-4" style={{ color: "#0071e3", flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: "0.7rem", fontWeight: 600, color: "#0071e3", textTransform: "uppercase", letterSpacing: "0.05em" }}>Trigger</div>
              <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#1d1d1f" }}>{TRIGGER_LABELS[wf.trigger]}</div>
            </div>
          </div>

          {/* Steps */}
          {steps.map((step, idx) => (
            <div key={step.id}>
              <div className="flex justify-center my-1"><ArrowDown className="w-4 h-4" style={{ color: "rgba(0,0,0,0.2)" }} /></div>
              <StepCard step={step} onRemove={() => removeStep(step.id)} />
            </div>
          ))}

          {/* Add step buttons */}
          <div className="flex justify-center my-1"><ArrowDown className="w-4 h-4" style={{ color: "rgba(0,0,0,0.2)" }} /></div>
          <div className="rounded-xl p-3 space-y-2" style={{ background: "#f5f5f7" }}>
            <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "rgba(0,0,0,0.5)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Add Step</div>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(ACTION_LABELS) as ActionType[]).map((a) => (
                <button key={a} onClick={() => addAction(a)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold"
                  style={{ background: "rgba(37,211,102,0.1)", color: "#128c5e", border: "none", cursor: "pointer" }}>
                  <MessageCircle className="w-3 h-3" /> {ACTION_LABELS[a]}
                </button>
              ))}
              <button onClick={addDelay}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold"
                style={{ background: "rgba(99,102,241,0.1)", color: "#4f46e5", border: "none", cursor: "pointer" }}>
                <Clock className="w-3 h-3" /> Add Delay
              </button>
            </div>
          </div>

          <button onClick={() => { setSaved(true); setTimeout(() => { setSaved(false); onClose(); }, 1200); }}
            className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
            style={{ background: saved ? "#1cc77f" : "#0071e3", color: "#fff", border: "none", cursor: "pointer", marginTop: 8 }}>
            {saved ? <><Check className="w-4 h-4" /> Saved!</> : "Save Workflow"}
          </button>
        </div>
      </div>
    </>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function WhatsAppClient({ leadCount }: { leadCount: number }) {
  const [activeTab, setActiveTab] = useState<"automation" | "templates" | "broadcast">("automation");
  const [workflows, setWorkflows] = useState<Workflow[]>(DEFAULT_WORKFLOWS);
  const [editingWf, setEditingWf] = useState<Workflow | null>(null);
  const [copiedTemplate, setCopiedTemplate] = useState<string | null>(null);
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [broadcastSent, setBroadcastSent] = useState(false);

  const toggleWorkflow = (id: string) => setWorkflows((prev) => prev.map((w) => w.id === id ? { ...w, active: !w.active } : w));

  const copyTemplate = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTemplate(id);
    setTimeout(() => setCopiedTemplate(null), 2000);
  };

  return (
    <div className="p-5 sm:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(37,211,102,0.1)" }}>
            <MessageCircle className="w-5 h-5" style={{ color: "#128c5e" }} />
          </div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 700, color: "#1d1d1f", letterSpacing: "-0.02em" }}>WhatsApp Automation</h1>
        </div>
        <p className="mt-1" style={{ fontSize: "0.9rem", color: "rgba(0,0,0,0.5)" }}>Automate follow-ups, send broadcasts, manage message templates.</p>
      </div>

      {/* KPI bar */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Active Workflows", value: String(workflows.filter((w) => w.active).length), color: "#1cc77f" },
          { label: "Message Templates", value: String(TEMPLATES_LIST.length), color: "#0071e3" },
          { label: "Leads in Pipeline", value: String(leadCount), color: "#a855f7" },
        ].map((k) => (
          <div key={k.label} className="rounded-2xl p-4" style={{ background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: "1.4rem", fontWeight: 700, color: k.color }}>{k.value}</div>
            <div style={{ fontSize: "0.72rem", color: "rgba(0,0,0,0.45)", marginTop: 2 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl mb-6 w-fit" style={{ background: "#f5f5f7" }}>
        {(["automation", "templates", "broadcast"] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className="px-4 py-2 rounded-lg text-sm font-medium capitalize"
            style={{ background: activeTab === tab ? "#fff" : "transparent", color: activeTab === tab ? "#1d1d1f" : "rgba(0,0,0,0.5)", boxShadow: activeTab === tab ? "0 1px 3px rgba(0,0,0,0.08)" : "none", border: "none", cursor: "pointer" }}>
            {tab === "automation" ? "Automation" : tab === "templates" ? "Templates" : "Broadcast"}
          </button>
        ))}
      </div>

      {/* Automation tab */}
      {activeTab === "automation" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <p style={{ fontSize: "0.82rem", color: "rgba(0,0,0,0.5)" }}>IF-THEN workflows that auto-send WhatsApp messages based on lead events.</p>
          </div>
          {workflows.map((wf) => (
            <div key={wf.id} className="rounded-2xl overflow-hidden" style={{ background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <div className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0" style={{ background: "#f5f5f7" }}>
                  {TRIGGER_ICONS[wf.trigger]}
                </div>
                <div className="flex-1 min-w-0">
                  <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#1d1d1f" }}>{wf.name}</div>
                  <div style={{ fontSize: "0.74rem", color: "rgba(0,0,0,0.45)", marginTop: 2 }}>
                    {TRIGGER_LABELS[wf.trigger]} · {wf.steps.filter((s) => s.type === "action").length} messages
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {/* Toggle */}
                  <button onClick={() => toggleWorkflow(wf.id)}
                    className="relative w-10 h-6 rounded-full transition-all"
                    style={{ background: wf.active ? "#1cc77f" : "#d1d5db", border: "none", cursor: "pointer" }}>
                    <span className="absolute top-0.5 transition-all rounded-full w-5 h-5 bg-white shadow-sm"
                      style={{ left: wf.active ? "calc(100% - 22px)" : 2 }} />
                  </button>
                  <button onClick={() => setEditingWf(wf)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                    style={{ background: "#f5f5f7", color: "#1d1d1f", border: "none", cursor: "pointer" }}>
                    Edit
                  </button>
                </div>
              </div>
              {/* Step preview strip */}
              <div className="px-4 pb-4 flex items-center gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                {wf.steps.map((step, idx) => (
                  <div key={step.id} className="flex items-center gap-1.5 shrink-0">
                    {idx > 0 && <ArrowDown className="w-3 h-3 rotate-[-90deg]" style={{ color: "rgba(0,0,0,0.2)" }} />}
                    <div className="px-2.5 py-1 rounded-lg text-xs font-medium"
                      style={{ background: step.type === "delay" ? "rgba(99,102,241,0.08)" : "rgba(37,211,102,0.08)", color: step.type === "delay" ? "#4f46e5" : "#128c5e" }}>
                      {step.type === "delay" ? `⏱ ${step.delayAmount}${step.delayUnit?.[0]}` : `💬 ${step.action ? ACTION_LABELS[step.action].split(" ")[1] : ""}`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Templates tab */}
      {activeTab === "templates" && (
        <div className="grid sm:grid-cols-2 gap-4">
          {TEMPLATES_LIST.map((t) => {
            const catStyle = CATEGORY_COLORS[t.category] ?? CATEGORY_COLORS.CRM;
            return (
              <div key={t.id} className="rounded-2xl p-5" style={{ background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: catStyle.bg, color: catStyle.color }}>{t.category}</span>
                    <div style={{ fontWeight: 700, fontSize: "0.875rem", color: "#1d1d1f", marginTop: 4 }}>{t.name}</div>
                  </div>
                  <button onClick={() => copyTemplate(t.id, t.preview)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
                    style={{ background: copiedTemplate === t.id ? "rgba(28,199,127,0.1)" : "rgba(0,113,227,0.08)", color: copiedTemplate === t.id ? "#1cc77f" : "#0071e3", border: "none", cursor: "pointer" }}>
                    {copiedTemplate === t.id ? <><Check className="w-3 h-3" /> Copied!</> : "Copy"}
                  </button>
                </div>
                <div className="p-3 rounded-xl whitespace-pre-wrap" style={{ background: "#f5f5f7", fontSize: "0.75rem", color: "rgba(0,0,0,0.65)", lineHeight: 1.6 }}>
                  {t.preview}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Broadcast tab */}
      {activeTab === "broadcast" && (
        <div className="max-w-xl">
          <div className="rounded-2xl p-5" style={{ background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <h3 style={{ fontWeight: 700, fontSize: "0.95rem", color: "#1d1d1f", marginBottom: 4 }}>Send Broadcast</h3>
            <p style={{ fontSize: "0.8rem", color: "rgba(0,0,0,0.5)", marginBottom: 16 }}>
              Send a message to all {leadCount} leads in your pipeline.
            </p>
            <div className="mb-3">
              <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "rgba(0,0,0,0.55)", display: "block", marginBottom: 6 }}>Message</label>
              <textarea value={broadcastMsg} onChange={(e) => setBroadcastMsg(e.target.value)} rows={5}
                placeholder="Type your broadcast message here. Use {name} for lead name, {project} for project name."
                className="w-full px-3 py-2.5 rounded-xl outline-none text-sm resize-none"
                style={{ background: "#f5f5f7", border: "1.5px solid rgba(0,0,0,0.07)" }} />
            </div>
            <div className="px-3 py-2 rounded-xl mb-4" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
              <p style={{ fontSize: "0.74rem", color: "#b45309", fontWeight: 600 }}>
                ⚠️ Requires WhatsApp Business API (Interakt/Gupshup). Connect in Settings → Integrations before sending.
              </p>
            </div>
            {broadcastSent ? (
              <div className="py-3 rounded-xl text-center" style={{ background: "rgba(28,199,127,0.1)", color: "#1cc77f" }}>
                <Check className="w-4 h-4 inline mr-2" /><span style={{ fontWeight: 700 }}>Broadcast queued for {leadCount} leads</span>
              </div>
            ) : (
              <button onClick={() => { if (broadcastMsg.trim()) setBroadcastSent(true); }}
                disabled={!broadcastMsg.trim()}
                className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                style={{ background: broadcastMsg.trim() ? "#128c5e" : "#f0f0f2", color: broadcastMsg.trim() ? "#fff" : "rgba(0,0,0,0.3)", border: "none", cursor: broadcastMsg.trim() ? "pointer" : "default" }}>
                <Send className="w-4 h-4" /> Send to {leadCount} Leads
              </button>
            )}
          </div>
        </div>
      )}

      {editingWf && <WorkflowEditor wf={editingWf} onClose={() => setEditingWf(null)} />}
    </div>
  );
}
