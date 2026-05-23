"use client";

import { useState } from "react";
import type { Project } from "@/lib/types";
import Image from "next/image";
import { Copy, Share2, MessageCircle, Check, Download, ExternalLink, QrCode } from "lucide-react";

interface Props {
  projects: Project[];
  brokerId: string;
  brokerName: string;
  brokerPhone: string;
}

function BrokerShareLink({ project, brokerId, brokerName }: { project: Project; brokerId: string; brokerName: string }) {
  const [copied, setCopied] = useState(false);
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://flatbytes.in";
  const shareUrl = `${baseUrl}/projects/${project.id}?ref=${brokerId}`;

  const waText = encodeURIComponent(
    `🏢 *${project.name}*\n📍 ${project.location}${project.city ? `, ${project.city}` : ""}\n` +
    `${project.price_starting ? `💰 Starting ${Math.round(Number(project.price_starting) / 100000)}L onwards\n` : ""}` +
    `\n🔗 Explore in 3D: ${shareUrl}\n\n*${brokerName}* | Channel Partner`
  );

  const copy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
      {project.cover_image_url && (
        <div className="h-36 bg-gray-100 overflow-hidden relative">
          <Image src={project.cover_image_url} alt={project.name} fill className="object-cover" unoptimized />
        </div>
      )}
      <div className="p-4">
        <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#1d1d1f" }}>{project.name}</div>
        <div style={{ fontSize: "0.75rem", color: "rgba(0,0,0,0.45)", marginTop: 2 }}>
          {project.location}{project.city ? `, ${project.city}` : ""}
          {project.price_starting ? ` · ₹${Math.round(Number(project.price_starting) / 100000)}L+` : ""}
        </div>

        {/* Share link */}
        <div className="flex items-center gap-2 mt-3 p-2 rounded-xl" style={{ background: "#f5f5f7" }}>
          <span style={{ fontSize: "0.68rem", color: "rgba(0,0,0,0.4)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {shareUrl}
          </span>
          <button onClick={copy} className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: copied ? "rgba(28,199,127,0.15)" : "rgba(0,113,227,0.1)", color: copied ? "#1a7f4a" : "#0071e3", border: "none", cursor: "pointer" }}>
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mt-3">
          <a href={`https://wa.me/?text=${waText}`} target="_blank" rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold"
            style={{ background: "rgba(37,211,102,0.1)", color: "#128c5e", textDecoration: "none" }}>
            <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
          </a>
          <a href={shareUrl} target="_blank" rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold"
            style={{ background: "rgba(0,113,227,0.08)", color: "#0071e3", textDecoration: "none" }}>
            <ExternalLink className="w-3.5 h-3.5" /> Preview
          </a>
          <button onClick={() => navigator.share?.({ title: project.name, url: shareUrl })}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold"
            style={{ background: "#f5f5f7", color: "#1d1d1f", border: "none", cursor: "pointer" }}>
            <Share2 className="w-3.5 h-3.5" /> Share
          </button>
        </div>
      </div>
    </div>
  );
}

const TEMPLATES = [
  {
    id: "new_launch",
    title: "New Launch",
    emoji: "🚀",
    preview: "🏢 *{PROJECT}* is now OPEN!\n📍 {LOCATION}\n💰 Starting {PRICE}\n\nBook a site visit today!\n📞 {PHONE}",
  },
  {
    id: "limited_units",
    title: "Limited Units",
    emoji: "⚡",
    preview: "⚡ LAST FEW UNITS at *{PROJECT}*!\n\n✅ {BHK} flats available\n📍 {LOCATION}\n💰 {PRICE}\n\nCall now to book! 📞 {PHONE}",
  },
  {
    id: "site_visit",
    title: "Site Visit Invite",
    emoji: "📅",
    preview: "Hi {NAME},\n\nYou're invited for a FREE site visit to *{PROJECT}*!\n\n📍 {LOCATION}\n📅 This weekend\n🎁 Free architect consultation\n\n📞 {PHONE}",
  },
  {
    id: "follow_up",
    title: "Follow-up",
    emoji: "💬",
    preview: "Hi {NAME},\n\nJust checking in on your interest in *{PROJECT}*.\n\n🏠 We have excellent {BHK} options in your budget.\n\nWould you like to schedule a visit? 📞 {PHONE}",
  },
];

export default function BrokerMarketingClient({ projects, brokerId, brokerName, brokerPhone }: Props) {
  const [activeTab, setActiveTab] = useState<"links" | "templates" | "tips">("links");
  const [copiedTemplate, setCopiedTemplate] = useState<string | null>(null);

  const copyTemplate = (id: string, text: string) => {
    const filled = text.replace(/{PHONE}/g, brokerPhone).replace(/{BROKER}/g, brokerName);
    navigator.clipboard.writeText(filled);
    setCopiedTemplate(id);
    setTimeout(() => setCopiedTemplate(null), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="mb-5">
        <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#1d1d1f", letterSpacing: "-0.02em" }}>Marketing Kit</h1>
        <p style={{ fontSize: "0.82rem", color: "rgba(0,0,0,0.48)", marginTop: 3 }}>Shareable links, WhatsApp templates, and growth tips</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 p-1 rounded-xl w-fit" style={{ background: "#f5f5f7" }}>
        {(["links", "templates", "tips"] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className="px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all"
            style={{ background: activeTab === tab ? "#fff" : "transparent", color: activeTab === tab ? "#1d1d1f" : "rgba(0,0,0,0.48)", boxShadow: activeTab === tab ? "0 1px 3px rgba(0,0,0,0.08)" : "none", border: "none", cursor: "pointer" }}>
            {tab === "links" ? "Share Links" : tab === "templates" ? "WA Templates" : "Growth Tips"}
          </button>
        ))}
      </div>

      {/* Share Links */}
      {activeTab === "links" && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <BrokerShareLink key={p.id} project={p} brokerId={brokerId} brokerName={brokerName} />
          ))}
          {projects.length === 0 && (
            <div className="col-span-3 py-16 text-center rounded-2xl" style={{ background: "#fff" }}>
              <p style={{ color: "rgba(0,0,0,0.4)" }}>No projects available</p>
            </div>
          )}
        </div>
      )}

      {/* WhatsApp Templates */}
      {activeTab === "templates" && (
        <div className="grid sm:grid-cols-2 gap-4">
          {TEMPLATES.map((t) => (
            <div key={t.id} className="rounded-2xl p-5" style={{ background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: "1.25rem" }}>{t.emoji}</span>
                  <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "#1d1d1f" }}>{t.title}</span>
                </div>
                <button onClick={() => copyTemplate(t.id, t.preview)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                  style={{ background: copiedTemplate === t.id ? "rgba(28,199,127,0.1)" : "rgba(0,113,227,0.08)", color: copiedTemplate === t.id ? "#1a7f4a" : "#0071e3", border: "none", cursor: "pointer" }}>
                  {copiedTemplate === t.id ? <><Check className="w-3 h-3" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy</>}
                </button>
              </div>
              <div className="p-3 rounded-xl whitespace-pre-wrap" style={{ background: "#f5f5f7", fontSize: "0.78rem", color: "rgba(0,0,0,0.7)", lineHeight: 1.6 }}>
                {t.preview.replace(/{PHONE}/g, brokerPhone).replace(/{BROKER}/g, brokerName)}
              </div>
              <p style={{ fontSize: "0.68rem", color: "rgba(0,0,0,0.35)", marginTop: 8 }}>
                Replace {"{PROJECT}"}, {"{LOCATION}"}, {"{PRICE}"}, {"{NAME}"} with actual details.
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Growth Tips */}
      {activeTab === "tips" && (
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { emoji: "🎯", title: "Share on WhatsApp Status", tip: "Post project images + your link on WhatsApp Status every morning. 200+ contacts see it for free." },
            { emoji: "📲", title: "Send 10 messages daily", tip: "Reach out to 10 new/warm leads each day. Consistency beats volume. Focus on qualified buyers." },
            { emoji: "🏠", title: "Invite to site visits", tip: "Buyers who visit are 3x more likely to book. Always push for a physical visit, never just sharing a brochure." },
            { emoji: "💬", title: "Follow up in 24 hours", tip: "If a lead doesn't respond, follow up once in 24 hours and once in 72 hours. After that, move on." },
            { emoji: "📸", title: "Share real photos", tip: "Construction progress photos, site visit photos (with permission), floor plan previews — real visuals convert better than stock images." },
            { emoji: "🤝", title: "Build your network", tip: "Each happy buyer becomes a referral source. Ask for 3 references after every booking — this compounds over time." },
          ].map((tip) => (
            <div key={tip.title} className="rounded-2xl p-5 flex gap-4" style={{ background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <span style={{ fontSize: "1.75rem", flexShrink: 0 }}>{tip.emoji}</span>
              <div>
                <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "#1d1d1f", marginBottom: 4 }}>{tip.title}</div>
                <div style={{ fontSize: "0.8rem", color: "rgba(0,0,0,0.55)", lineHeight: 1.5 }}>{tip.tip}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
