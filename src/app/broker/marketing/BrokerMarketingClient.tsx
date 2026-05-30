"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import type { Project } from "@/lib/types";
import {
  Sparkles, Download, MessageCircle, CheckCircle2, Loader2,
  ChevronRight, ChevronLeft, Zap, AlertCircle, Play,
  Copy, Check, Facebook, Instagram, MapPin, Home,
} from "lucide-react";

const FLAT_TYPE_ORDER = ["studio","1bhk","2bhk","3bhk","4bhk","penthouse","office_suite","office_floor"];
const FLAT_TYPE_LABEL: Record<string,string> = {
  studio:"Studio","1bhk":"1 BHK","2bhk":"2 BHK","3bhk":"3 BHK",
  "4bhk":"4 BHK",penthouse:"Penthouse",office_suite:"Office",office_floor:"Full Floor",
};

const COLOR_THEMES = [
  { id:"gold",    label:"Gold Luxury",   color:"#C9A84C", bg:"#080C18" },
  { id:"navy",    label:"Royal Navy",    color:"#4B8BF5", bg:"#03193B" },
  { id:"emerald", label:"Emerald",       color:"#2ECC71", bg:"#051A0F" },
  { id:"maroon",  label:"Maroon",        color:"#E8556A", bg:"#1A0508" },
  { id:"purple",  label:"Midnight Purple",color:"#9B59B6", bg:"#0D0720" },
];

const AUDIENCE_OPTIONS = [
  { id:"first_time_buyers", label:"First-Time Buyers",    desc:"Young professionals buying their first home", icon:"🏠" },
  { id:"investors",         label:"Real Estate Investors", desc:"Looking for investment & rental income",       icon:"📈" },
  { id:"it_professionals",  label:"IT Professionals",      desc:"Tech workers with high income",                icon:"💻" },
  { id:"nris",              label:"NRI Buyers",            desc:"Indians abroad looking to invest back home",   icon:"✈️" },
];
const BUDGET_PRESETS = [
  { label:"Starter", amount:500,  desc:"~2,000 reach/day", color:"#0071e3" },
  { label:"Growth",  amount:1500, desc:"~6,000 reach/day", color:"#7c3aed" },
  { label:"Power",   amount:3000, desc:"~12,000 reach/day",color:"#f59e0b" },
];
const DURATION_OPTIONS = [3,5,7,14];

interface Props {
  projects: Project[];
  brokerId: string;
  brokerName: string;
  brokerPhone: string;
  metaPageName?: string | null;
  metaConnected?: boolean;
}

type Step = "pick_project" | "preview" | "publish";

function projectStats(project: Project) {
  const allFlats = project.towers.flatMap(t => t.flats);
  const available = allFlats.filter(f => f.status === "available");
  const types = Array.from(new Set(available.map(f => f.flat_type)))
    .sort((a,b) => FLAT_TYPE_ORDER.indexOf(a) - FLAT_TYPE_ORDER.indexOf(b));
  const areas = available.map(f => f.carpet_area_sqft).filter(Boolean);
  const minArea = areas.length ? Math.min(...areas) : null;
  const maxArea = areas.length ? Math.max(...areas) : null;
  return { available: available.length, types, minArea, maxArea };
}

function configLabel(types: string[]): string {
  if (!types.length) return "Residences";
  const labels = types.map(t => FLAT_TYPE_LABEL[t] ?? t);
  if (labels.length === 1) return labels[0];
  if (labels.length === 2) return `${labels[0]} & ${labels[1]}`;
  return `${labels.slice(0,-1).join(", ")} & ${labels[labels.length-1]}`;
}

function areaLabel(min: number | null, max: number | null): string {
  if (!min && !max) return "On Request";
  if (min === max || !max) return `${min?.toLocaleString()} sq.ft`;
  return `${min?.toLocaleString()} – ${max?.toLocaleString()} sq.ft`;
}

export default function BrokerMarketingClient({
  projects, brokerId, brokerName, brokerPhone, metaPageName, metaConnected,
}: Props) {
  const [step, setStep] = useState<Step>("pick_project");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const [captions, setCaptions] = useState({ facebook:"", instagram:"", whatsapp:"" });
  const [activePlatform, setActivePlatform] = useState<"facebook"|"instagram"|"whatsapp">("whatsapp");
  const [generatingCaption, setGeneratingCaption] = useState(false);
  const [captionCopied, setCaptionCopied] = useState(false);

  const [postPending, startPost] = useTransition();
  const [adPending,  startAd]   = useTransition();
  const [postResult, setPostResult] = useState<{ok?:boolean;error?:string}|null>(null);
  const [adResult,   setAdResult]   = useState<{ok?:boolean;error?:string}|null>(null);

  const [audienceType, setAudienceType] = useState("first_time_buyers");
  const [budgetInr,    setBudgetInr]    = useState(1500);
  const [durationDays, setDurationDays] = useState(5);
  const [showAdSetup,  setShowAdSetup]  = useState(false);

  // Poster customization
  const [posterTheme,   setPosterTheme]   = useState("gold");
  const [posterFormat,  setPosterFormat]  = useState("square");
  const [posterTagline, setPosterTagline] = useState("");
  const [editLocation,  setEditLocation]  = useState("");
  const [editPhone,     setEditPhone]     = useState("");
  const [ctaBadge,      setCtaBadge]      = useState("none");
  const [contactType,   setContactType]   = useState<"whatsapp"|"call">("whatsapp");

  // Only projects with available units
  const advertisableProjects = projects.filter(p => {
    const allFlats = p.towers.flatMap(t => t.flats);
    return allFlats.some(f => f.status === "available");
  });

  function getPosterUrl(project: Project): string {
    const stats = projectStats(project);
    return `/api/og/flat-poster?${new URLSearchParams({
      project:   project.name,
      location:  editLocation || project.location,
      configs:   configLabel(stats.types),
      area:      areaLabel(stats.minArea, stats.maxArea),
      available: String(stats.available),
      broker:    brokerName,
      phone:     editPhone || brokerPhone,
      theme:     posterTheme,
      format:    posterFormat,
      contact:   contactType,
      ...(posterTagline ? { tagline: posterTagline } : {}),
      ...(ctaBadge !== "none" ? { badge: ctaBadge } : {}),
      ...(project.cover_image_url ? { cover: project.cover_image_url } : {}),
    }).toString()}`;
  }

  async function generateCaptions(project: Project) {
    const stats = projectStats(project);
    setGeneratingCaption(true);
    try {
      const platforms = ["facebook","instagram","whatsapp"] as const;
      const results = await Promise.all(
        platforms.map(async platform => {
          const res = await fetch("/api/broker/caption", {
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body: JSON.stringify({
              projectName: project.name,
              flatType:    configLabel(stats.types),
              floor:       "Multiple floors",
              area:        areaLabel(stats.minArea, stats.maxArea),
              facing:      "Multiple facings",
              location:    project.location,
              brokerName, brokerPhone, platform,
            }),
          });
          const data = await res.json();
          return { platform, caption: data.caption ?? "" };
        })
      );
      const c = { facebook:"", instagram:"", whatsapp:"" };
      results.forEach(r => { (c as Record<string,string>)[r.platform] = r.caption; });
      setCaptions(c);
    } finally {
      setGeneratingCaption(false);
    }
  }

  const handleSelectProject = (project: Project) => {
    setSelectedProject(project);
    setStep("preview");
    setCaptions({ facebook:"", instagram:"", whatsapp:"" });
    setPostResult(null);
    setAdResult(null);
    setEditLocation(project.location);
    setEditPhone(brokerPhone);
    setPosterTagline("");
    setCtaBadge("none");
  };

  const copyCaption = async () => {
    const text = captions[activePlatform];
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCaptionCopied(true);
    setTimeout(() => setCaptionCopied(false), 2000);
  };

  const handlePost = (platform:"facebook"|"instagram"|"both") => {
    if (!selectedProject) return;
    startPost(async () => {
      setPostResult(null);
      const res = await fetch("/api/broker/meta/post", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          posterUrl: `${window.location.origin}${getPosterUrl(selectedProject)}`,
          caption:   captions.facebook || captions.whatsapp,
          platform,
        }),
      });
      const data = await res.json();
      setPostResult(data.ok ? { ok:true } : { error:data.error });
    });
  };

  const handleRunAd = () => {
    if (!selectedProject) return;
    const stats = projectStats(selectedProject);
    startAd(async () => {
      setAdResult(null);
      const res = await fetch("/api/broker/meta/ad", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          posterUrl:    `${window.location.origin}${getPosterUrl(selectedProject)}`,
          caption:      captions.facebook || captions.whatsapp,
          budgetInr, durationDays, audienceType,
          city:         selectedProject.city ?? selectedProject.location.split(",").slice(-1)[0]?.trim() ?? "Hyderabad",
          flatType:     configLabel(stats.types),
        }),
      });
      const data = await res.json();
      setAdResult(data.ok ? { ok:true } : { error:data.error });
      if (data.ok) setShowAdSetup(false);
    });
  };

  const stepLabels = ["1. Pick Project","2. Preview Ad","3. Publish"];
  const stepKeys: Step[] = ["pick_project","preview","publish"];

  return (
    <div className="min-h-screen" style={{ background:"#f5f5f7" }}>
      {/* Header */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-5 py-4"
        style={{ background:"rgba(255,255,255,0.95)", backdropFilter:"blur(20px)", borderBottom:"1px solid rgba(0,0,0,0.07)" }}>
        <div>
          <h1 style={{ fontSize:"1.25rem", fontWeight:800, color:"#1d1d1f", letterSpacing:"-0.02em" }}>Marketing Hub</h1>
          <p style={{ fontSize:"0.75rem", color:"rgba(0,0,0,0.45)", marginTop:2 }}>
            Create property ads · Post on Meta · Run paid campaigns
          </p>
        </div>
        {metaConnected ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
            style={{ background:"rgba(28,199,127,0.08)", border:"1px solid rgba(28,199,127,0.2)" }}>
            <CheckCircle2 className="w-3.5 h-3.5" style={{ color:"#1cc77f" }} />
            <span style={{ fontSize:"0.75rem", fontWeight:600, color:"#1a7f4a" }}>{metaPageName ?? "Page connected"}</span>
          </div>
        ) : (
          <a href="/api/broker/meta/connect"
            className="flex items-center gap-2 px-3 py-2 rounded-xl font-semibold text-sm"
            style={{ background:"#1877F2", color:"#fff", textDecoration:"none" }}>
            <Facebook className="w-4 h-4" /> Connect Facebook
          </a>
        )}
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Steps */}
        <div className="flex items-center gap-2 mb-6">
          {stepKeys.map((s, i) => {
            const active = step === s;
            const done   = stepKeys.indexOf(step) > i;
            return (
              <div key={s} className="flex items-center gap-2">
                <button onClick={() => { if (done || active) setStep(s); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                  style={{
                    background: active ? "#1d1d1f" : done ? "rgba(28,199,127,0.1)" : "#f0f0f2",
                    color:      active ? "#fff"    : done ? "#1a7f4a"              : "rgba(0,0,0,0.45)",
                    border:"none", cursor: done || active ? "pointer" : "default",
                  }}>
                  {done && <Check className="w-3 h-3" />}
                  {stepLabels[i]}
                </button>
                {i < 2 && <ChevronRight className="w-3.5 h-3.5" style={{ color:"rgba(0,0,0,0.2)" }} />}
              </div>
            );
          })}
        </div>

        {/* ── STEP 1: Pick Project ── */}
        {step === "pick_project" && (
          <div>
            <div className="mb-5">
              <h2 style={{ fontSize:"1.1rem", fontWeight:700, color:"#1d1d1f" }}>Which property do you want to advertise?</h2>
              <p style={{ fontSize:"0.82rem", color:"rgba(0,0,0,0.45)", marginTop:4 }}>
                Each ad promotes the entire project — buyers contact you for unit details.
              </p>
            </div>

            {advertisableProjects.length === 0 ? (
              <div className="rounded-2xl py-16 text-center" style={{ background:"#fff" }}>
                <Home className="w-10 h-10 mx-auto mb-3" style={{ color:"rgba(0,0,0,0.2)" }} />
                <p style={{ color:"rgba(0,0,0,0.4)", fontSize:"0.9rem" }}>No projects with available units found.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {advertisableProjects.map(project => {
                  const stats = projectStats(project);
                  return (
                    <button key={project.id} onClick={() => handleSelectProject(project)}
                      className="text-left rounded-2xl overflow-hidden group transition-all"
                      style={{ background:"#fff", border:"1.5px solid rgba(0,0,0,0.07)", cursor:"pointer", padding:0 }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.border = "1.5px solid #0071e3"; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(0,113,227,0.12)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.border = "1.5px solid rgba(0,0,0,0.07)"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}>
                      {/* Project cover */}
                      <div className="relative overflow-hidden" style={{ height:180, background:"#0a0f1a" }}>
                        {project.cover_image_url
                          ? <Image src={project.cover_image_url} alt={project.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="400px" />
                          : <div className="w-full h-full flex items-center justify-center text-5xl">🏢</div>}
                        <div className="absolute inset-0" style={{ background:"linear-gradient(to top,rgba(0,0,0,0.85) 0%,transparent 60%)" }} />
                        {/* Available units badge */}
                        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                          style={{ background:"rgba(28,199,127,0.9)", backdropFilter:"blur(8px)" }}>
                          <div style={{ width:6,height:6,borderRadius:"50%",background:"#fff",flexShrink:0 }} />
                          <span style={{ fontSize:"0.72rem", fontWeight:800, color:"#fff" }}>{stats.available} Available</span>
                        </div>
                        {/* Project name overlay */}
                        <div className="absolute bottom-3 left-4 right-4">
                          <div style={{ fontWeight:800, fontSize:"1.1rem", color:"#fff", lineHeight:1.2 }}>{project.name}</div>
                          <div className="flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3" style={{ color:"rgba(255,255,255,0.65)", flexShrink:0 }} />
                            <span style={{ fontSize:"0.72rem", color:"rgba(255,255,255,0.65)" }}>{project.location}</span>
                          </div>
                        </div>
                      </div>
                      {/* Stats */}
                      <div className="p-4">
                        <div className="flex items-center gap-2 flex-wrap mb-3">
                          {stats.types.map(t => (
                            <span key={t} className="px-2 py-0.5 rounded-lg text-xs font-semibold"
                              style={{ background:"rgba(0,113,227,0.08)", color:"#0055b3" }}>
                              {FLAT_TYPE_LABEL[t] ?? t}
                            </span>
                          ))}
                        </div>
                        <div style={{ fontSize:"0.75rem", color:"rgba(0,0,0,0.45)" }}>
                          {areaLabel(stats.minArea, stats.maxArea)}
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop:"1px solid rgba(0,0,0,0.06)" }}>
                          <span style={{ fontSize:"0.78rem", fontWeight:600, color:"#1d1d1f", fontStyle:"italic" }}>Price on Request</span>
                          <span className="flex items-center gap-1 font-semibold" style={{ fontSize:"0.78rem", color:"#0071e3" }}>
                            Create Ad <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── STEP 2: Preview ── */}
        {step === "preview" && selectedProject && (
          <div className="grid lg:grid-cols-2 gap-6">
            <div>
              <div className="flex justify-between items-center mb-3">
                <h2 style={{ fontWeight:700, fontSize:"1rem", color:"#1d1d1f" }}>Ad Poster — {selectedProject.name}</h2>
                <button onClick={() => setStep("pick_project")}
                  className="flex items-center gap-1 text-sm"
                  style={{ color:"#0071e3", background:"none", border:"none", cursor:"pointer" }}>
                  <ChevronLeft className="w-3.5 h-3.5" /> Change project
                </button>
              </div>
              {/* Live poster preview */}
              {(() => {
                const dims: Record<string,{w:number;h:number}> = { square:{w:540,h:540}, landscape:{w:540,h:282}, story:{w:304,h:540}, whatsapp:{w:540,h:284} };
                const d = dims[posterFormat] ?? dims.square;
                return (
                  <div className="rounded-2xl overflow-hidden shadow-xl flex justify-center" style={{ background:"#1d1d1f", padding: posterFormat==="story" ? "12px" : 0 }}>
                    <Image src={getPosterUrl(selectedProject)} alt="Ad Poster" width={d.w} height={d.h}
                      style={{ width:"100%", height:"auto", maxHeight:540, objectFit:"contain" }}
                      unoptimized key={`${posterTheme}-${posterFormat}-${posterTagline}-${editPhone}-${editLocation}-${ctaBadge}-${contactType}`} />
                  </div>
                );
              })()}

              {/* Customization panel */}
              <div className="rounded-2xl p-4 mt-3 space-y-4" style={{ background:"#fff", boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
                <div style={{ fontSize:"0.75rem", fontWeight:700, color:"rgba(0,0,0,0.45)", textTransform:"uppercase", letterSpacing:"0.06em" }}>Customise Poster</div>

                {/* Format / Size */}
                <div>
                  <div style={{ fontSize:"0.72rem", fontWeight:600, color:"rgba(0,0,0,0.5)", marginBottom:8 }}>Size & Format</div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id:"square",    label:"Instagram Feed",  size:"1080×1080", icon:"📷" },
                      { id:"story",     label:"Instagram Story", size:"1080×1920", icon:"📱" },
                      { id:"landscape", label:"Facebook Feed",   size:"1200×628",  icon:"👍" },
                      { id:"whatsapp",  label:"WhatsApp Status", size:"1080×1920", icon:"💬" },
                    ].map(f => (
                      <button key={f.id} onClick={() => setPosterFormat(f.id)}
                        className="text-left p-3 rounded-xl transition-all"
                        style={{ background:posterFormat===f.id?"rgba(0,113,227,0.08)":"#f7f7f8", border:`1.5px solid ${posterFormat===f.id?"#0071e3":"transparent"}`, cursor:"pointer" }}>
                        <div style={{ fontSize:"1.2rem", marginBottom:4 }}>{f.icon}</div>
                        <div style={{ fontSize:"0.78rem", fontWeight:700, color:posterFormat===f.id?"#0071e3":"#1d1d1f" }}>{f.label}</div>
                        <div style={{ fontSize:"0.65rem", color:"rgba(0,0,0,0.4)", marginTop:2 }}>{f.size}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color themes */}
                <div>
                  <div style={{ fontSize:"0.72rem", fontWeight:600, color:"rgba(0,0,0,0.5)", marginBottom:8 }}>Colour Theme</div>
                  <div className="flex gap-2 flex-wrap">
                    {COLOR_THEMES.map(t => (
                      <button key={t.id} onClick={() => setPosterTheme(t.id)}
                        title={t.label}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all"
                        style={{
                          background: posterTheme===t.id ? t.bg : "#f5f5f7",
                          border: `2px solid ${posterTheme===t.id ? t.color : "transparent"}`,
                          cursor:"pointer",
                        }}>
                        <div style={{ width:14, height:14, borderRadius:"50%", background:t.color, flexShrink:0 }} />
                        <span style={{ fontSize:"0.72rem", fontWeight:600, color: posterTheme===t.id ? t.color : "#1d1d1f" }}>{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Contact type */}
                <div>
                  <div style={{ fontSize:"0.72rem", fontWeight:600, color:"rgba(0,0,0,0.5)", marginBottom:8 }}>Contact Type</div>
                  <div className="flex gap-2">
                    {([
                      { id:"whatsapp", label:"WhatsApp", icon:"💬" },
                      { id:"call",     label:"Call",     icon:"📞" },
                    ] as const).map(c => (
                      <button key={c.id} onClick={() => setContactType(c.id)}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm"
                        style={{ background:contactType===c.id?"#1d1d1f":"#f7f7f8", color:contactType===c.id?"#fff":"#1d1d1f", border:"none", cursor:"pointer" }}>
                        {c.icon} {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Text fields */}
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label style={{ fontSize:"0.72rem", fontWeight:600, color:"rgba(0,0,0,0.5)", display:"block", marginBottom:5 }}>
                      Mobile Number on Poster
                    </label>
                    <input
                      value={editPhone}
                      onChange={e => setEditPhone(e.target.value)}
                      placeholder={brokerPhone}
                      inputMode="tel"
                      className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                      style={{ background:"#f7f7f8", border:"1.5px solid rgba(0,0,0,0.08)", color:"#1d1d1f" }}
                    />
                    <p style={{ fontSize:"0.65rem", color:"rgba(0,0,0,0.35)", marginTop:4 }}>Use a different number if needed (e.g. team/office number)</p>
                  </div>
                  <div>
                    <label style={{ fontSize:"0.72rem", fontWeight:600, color:"rgba(0,0,0,0.5)", display:"block", marginBottom:5 }}>Location on Poster</label>
                    <input
                      value={editLocation}
                      onChange={e => setEditLocation(e.target.value)}
                      placeholder={selectedProject.location}
                      className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                      style={{ background:"#f7f7f8", border:"1.5px solid rgba(0,0,0,0.08)", color:"#1d1d1f" }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize:"0.72rem", fontWeight:600, color:"rgba(0,0,0,0.5)", display:"block", marginBottom:5 }}>Tagline (optional)</label>
                    <input
                      value={posterTagline}
                      onChange={e => setPosterTagline(e.target.value)}
                      placeholder='e.g. "Where luxury meets comfort"'
                      className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                      style={{ background:"#f7f7f8", border:"1.5px solid rgba(0,0,0,0.08)", color:"#1d1d1f" }}
                    />
                  </div>
                </div>

                {/* CTA Badge */}
                <div>
                  <div style={{ fontSize:"0.72rem", fontWeight:600, color:"rgba(0,0,0,0.5)", marginBottom:8 }}>Highlight Badge</div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id:"none",              label:"None" },
                      { id:"Book Free Site Visit", label:"🏡 Free Site Visit" },
                      { id:"Limited Units",     label:"⚡ Limited Units" },
                      { id:"RERA Approved",     label:"✅ RERA Approved" },
                      { id:"Zero Brokerage",    label:"🎯 Zero Brokerage" },
                      { id:"Ready to Move",     label:"🔑 Ready to Move" },
                      { id:"New Launch",        label:"🚀 New Launch" },
                    ].map(b => (
                      <button key={b.id} onClick={() => setCtaBadge(b.id)}
                        className="px-3 py-1.5 rounded-full text-xs font-semibold"
                        style={{ background:ctaBadge===b.id?"#1d1d1f":"#f5f5f7", color:ctaBadge===b.id?"#fff":"rgba(0,0,0,0.6)", border:"none", cursor:"pointer" }}>
                        {b.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <a href={getPosterUrl(selectedProject)} download={`FlatBytes-${selectedProject.name}.png`}
                className="flex items-center justify-center gap-2 w-full mt-3 py-3 rounded-2xl font-semibold text-sm"
                style={{ background:"#1d1d1f", color:"#fff", textDecoration:"none" }}>
                <Download className="w-4 h-4" /> Download 1080×1080 PNG
              </a>
            </div>

            <div className="space-y-4">
              {/* AI Captions */}
              <div className="rounded-2xl p-5" style={{ background:"#fff", boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
                <div className="flex items-center justify-between mb-4">
                  <h2 style={{ fontWeight:700, fontSize:"1rem", color:"#1d1d1f" }}>AI Ad Captions</h2>
                  <button onClick={() => generateCaptions(selectedProject)} disabled={generatingCaption}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
                    style={{ background:"rgba(124,58,237,0.1)", color:"#7c3aed", border:"none", cursor:generatingCaption?"not-allowed":"pointer" }}>
                    {generatingCaption ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    {captions.facebook ? "Regenerate" : "Generate All 3"}
                  </button>
                </div>

                <div className="flex gap-1 mb-4 rounded-xl p-1" style={{ background:"#f5f5f7" }}>
                  {(["facebook","instagram","whatsapp"] as const).map(p => {
                    const icons = { facebook:<Facebook className="w-3.5 h-3.5"/>, instagram:<Instagram className="w-3.5 h-3.5"/>, whatsapp:<MessageCircle className="w-3.5 h-3.5"/> };
                    return (
                      <button key={p} onClick={() => setActivePlatform(p)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold"
                        style={activePlatform===p
                          ? { background:"#fff", color:"#1d1d1f", boxShadow:"0 1px 3px rgba(0,0,0,0.1)" }
                          : { background:"transparent", color:"rgba(0,0,0,0.48)" }}>
                        {icons[p]} {p.charAt(0).toUpperCase()+p.slice(1)}
                      </button>
                    );
                  })}
                </div>

                <div className="relative">
                  <textarea
                    value={captions[activePlatform]}
                    onChange={e => setCaptions(prev => ({ ...prev, [activePlatform]:e.target.value }))}
                    placeholder={generatingCaption ? "Writing your ad copy..." : "Click 'Generate All 3' for platform-specific captions →"}
                    rows={7}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
                    style={{ background:"#f7f7f8", border:"1.5px solid rgba(0,0,0,0.08)", color:"#1d1d1f", lineHeight:1.6 }}
                  />
                  {captions[activePlatform] && (
                    <button onClick={copyCaption}
                      className="absolute top-3 right-3 w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ background:"rgba(0,0,0,0.06)", border:"none", cursor:"pointer" }}>
                      {captionCopied ? <Check className="w-3.5 h-3.5" style={{ color:"#1cc77f" }}/> : <Copy className="w-3.5 h-3.5" style={{ color:"rgba(0,0,0,0.5)" }}/>}
                    </button>
                  )}
                </div>
              </div>

              <button onClick={() => setStep("publish")} disabled={!captions.facebook && !captions.whatsapp}
                className="w-full py-4 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2"
                style={{
                  background: captions.facebook||captions.whatsapp ? "#0071e3" : "#f5f5f7",
                  color:      captions.facebook||captions.whatsapp ? "#fff"    : "rgba(0,0,0,0.35)",
                  border:"none", cursor: captions.facebook||captions.whatsapp ? "pointer" : "not-allowed",
                }}>
                Continue to Publish <ChevronRight className="w-4 h-4" />
              </button>
              {!captions.facebook && !captions.whatsapp && (
                <p className="text-center text-xs" style={{ color:"rgba(0,0,0,0.4)" }}>Generate captions first to continue</p>
              )}
            </div>
          </div>
        )}

        {/* ── STEP 3: Publish ── */}
        {step === "publish" && selectedProject && (
          <div className="grid lg:grid-cols-2 gap-6">
            <div>
              <div className="rounded-2xl overflow-hidden shadow-xl mb-3">
                <Image src={getPosterUrl(selectedProject)} alt="Ad" width={540} height={540} className="w-full" unoptimized />
              </div>
              <a href={getPosterUrl(selectedProject)} download
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-2xl font-semibold text-sm"
                style={{ background:"#f5f5f7", color:"#1d1d1f", textDecoration:"none" }}>
                <Download className="w-4 h-4" /> Download Poster
              </a>
            </div>

            <div className="space-y-4">
              {/* WhatsApp */}
              <div className="rounded-2xl p-5" style={{ background:"#fff", boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <MessageCircle className="w-4 h-4" style={{ color:"#25D366" }} />
                  <span style={{ fontWeight:700, fontSize:"0.9rem", color:"#1d1d1f" }}>WhatsApp</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background:"rgba(28,199,127,0.1)", color:"#1a7f4a" }}>No setup needed</span>
                </div>
                <a href={`https://wa.me/?text=${encodeURIComponent(captions.whatsapp||captions.facebook)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm"
                  style={{ background:"#25D366", color:"#fff", textDecoration:"none" }}>
                  <MessageCircle className="w-4 h-4" /> Send via WhatsApp
                </a>
                <p className="text-center text-xs mt-2" style={{ color:"rgba(0,0,0,0.35)" }}>Caption pre-filled. Download poster & attach it.</p>
              </div>

              {/* Facebook + Instagram */}
              <div className="rounded-2xl p-5" style={{ background:"#fff", boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Facebook className="w-4 h-4" style={{ color:"#1877F2" }} />
                    <span style={{ fontWeight:700, fontSize:"0.9rem", color:"#1d1d1f" }}>Facebook + Instagram</span>
                  </div>
                  {metaConnected
                    ? <span className="text-xs font-semibold flex items-center gap-1" style={{ color:"#1cc77f" }}><CheckCircle2 className="w-3 h-3"/>{metaPageName}</span>
                    : <a href="/api/broker/meta/connect" style={{ fontSize:"0.75rem", fontWeight:600, color:"#1877F2", textDecoration:"none" }}>Connect →</a>}
                </div>
                {postResult?.ok && (
                  <div className="flex items-center gap-2 p-3 rounded-xl mb-3" style={{ background:"rgba(28,199,127,0.08)", border:"1px solid rgba(28,199,127,0.2)" }}>
                    <CheckCircle2 className="w-4 h-4" style={{ color:"#1cc77f" }} />
                    <span style={{ fontSize:"0.82rem", color:"#1a7f4a", fontWeight:600 }}>Posted to your page!</span>
                  </div>
                )}
                {postResult?.error && (
                  <div className="flex items-center gap-2 p-3 rounded-xl mb-3" style={{ background:"rgba(239,68,68,0.06)", border:"1px solid rgba(239,68,68,0.2)" }}>
                    <AlertCircle className="w-4 h-4" style={{ color:"#ef4444" }} />
                    <span style={{ fontSize:"0.78rem", color:"#dc2626" }}>{postResult.error}</span>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => handlePost("facebook")} disabled={!metaConnected||postPending}
                    className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-semibold text-sm"
                    style={{ background:metaConnected?"#1877F2":"#f5f5f7", color:metaConnected?"#fff":"rgba(0,0,0,0.3)", border:"none", cursor:metaConnected?"pointer":"not-allowed" }}>
                    {postPending ? <Loader2 className="w-4 h-4 animate-spin"/> : <Facebook className="w-4 h-4"/>} Facebook
                  </button>
                  <button onClick={() => handlePost("both")} disabled={!metaConnected||postPending}
                    className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-semibold text-sm"
                    style={{ background:metaConnected?"linear-gradient(135deg,#833AB4,#FD1D1D,#FCAF45)":"#f5f5f7", color:metaConnected?"#fff":"rgba(0,0,0,0.3)", border:"none", cursor:metaConnected?"pointer":"not-allowed" }}>
                    {postPending ? <Loader2 className="w-4 h-4 animate-spin"/> : <Instagram className="w-4 h-4"/>} FB + IG
                  </button>
                </div>
              </div>

              {/* Paid Ad */}
              <div className="rounded-2xl overflow-hidden" style={{ background:"#fff", boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
                <button onClick={() => setShowAdSetup(v => !v)}
                  className="w-full flex items-center justify-between p-5"
                  style={{ background:"none", border:"none", cursor:"pointer" }}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background:"linear-gradient(135deg,#f59e0b,#f97316)" }}>
                      <Zap className="w-4 h-4 text-white" style={{ color:"#fff" }} />
                    </div>
                    <div className="text-left">
                      <div style={{ fontWeight:700, fontSize:"0.9rem", color:"#1d1d1f" }}>Run Paid Ad</div>
                      <div style={{ fontSize:"0.72rem", color:"rgba(0,0,0,0.45)" }}>Reach thousands · Leads auto-flow to your inbox</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4" style={{ color:"rgba(0,0,0,0.3)", transform:showAdSetup?"rotate(90deg)":"none", transition:"transform 0.2s" }} />
                </button>

                {showAdSetup && (
                  <div className="px-5 pb-5 border-t" style={{ borderColor:"rgba(0,0,0,0.06)" }}>
                    <div style={{ fontSize:"0.7rem", fontWeight:700, color:"rgba(0,0,0,0.4)", textTransform:"uppercase", letterSpacing:"0.06em", margin:"16px 0 10px" }}>Target Audience</div>
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {AUDIENCE_OPTIONS.map(a => (
                        <button key={a.id} onClick={() => setAudienceType(a.id)}
                          className="text-left p-3 rounded-xl"
                          style={{ background:audienceType===a.id?"rgba(0,113,227,0.08)":"#f7f7f8", border:`1.5px solid ${audienceType===a.id?"#0071e3":"transparent"}`, cursor:"pointer" }}>
                          <div style={{ fontSize:"1.1rem", marginBottom:4 }}>{a.icon}</div>
                          <div style={{ fontSize:"0.78rem", fontWeight:700, color:audienceType===a.id?"#0071e3":"#1d1d1f" }}>{a.label}</div>
                          <div style={{ fontSize:"0.65rem", color:"rgba(0,0,0,0.45)", marginTop:2, lineHeight:1.3 }}>{a.desc}</div>
                        </button>
                      ))}
                    </div>

                    <div style={{ fontSize:"0.7rem", fontWeight:700, color:"rgba(0,0,0,0.4)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:10 }}>Daily Budget</div>
                    <div className="flex gap-2 mb-4">
                      {BUDGET_PRESETS.map(b => (
                        <button key={b.amount} onClick={() => setBudgetInr(b.amount)}
                          className="flex-1 py-3 rounded-xl text-center"
                          style={{ background:budgetInr===b.amount?b.color:"#f7f7f8", border:"none", cursor:"pointer" }}>
                          <div style={{ fontSize:"0.9rem", fontWeight:800, color:budgetInr===b.amount?"#fff":"#1d1d1f" }}>₹{b.amount}</div>
                          <div style={{ fontSize:"0.62rem", color:budgetInr===b.amount?"rgba(255,255,255,0.7)":"rgba(0,0,0,0.45)", marginTop:2 }}>{b.label}</div>
                          <div style={{ fontSize:"0.6rem", color:budgetInr===b.amount?"rgba(255,255,255,0.55)":"rgba(0,0,0,0.32)", marginTop:1 }}>{b.desc}</div>
                        </button>
                      ))}
                    </div>

                    <div style={{ fontSize:"0.7rem", fontWeight:700, color:"rgba(0,0,0,0.4)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:10 }}>Duration</div>
                    <div className="flex gap-2 mb-4">
                      {DURATION_OPTIONS.map(d => (
                        <button key={d} onClick={() => setDurationDays(d)}
                          className="flex-1 py-2.5 rounded-xl font-semibold text-sm"
                          style={{ background:durationDays===d?"#1d1d1f":"#f7f7f8", color:durationDays===d?"#fff":"#1d1d1f", border:"none", cursor:"pointer" }}>
                          {d}d
                        </button>
                      ))}
                    </div>

                    <div className="p-3 rounded-xl mb-4" style={{ background:"rgba(245,158,11,0.06)", border:"1px solid rgba(245,158,11,0.2)" }}>
                      <div style={{ fontSize:"0.82rem", fontWeight:600, color:"#1d1d1f" }}>
                        Total: ₹{(budgetInr*durationDays).toLocaleString("en-IN")} · {durationDays} days
                      </div>
                      <div style={{ fontSize:"0.72rem", color:"rgba(0,0,0,0.45)", marginTop:3 }}>
                        Est. reach: {((budgetInr/500)*2000*durationDays).toLocaleString("en-IN")}+ people
                      </div>
                    </div>

                    {adResult?.ok && (
                      <div className="flex items-center gap-2 p-3 rounded-xl mb-3" style={{ background:"rgba(28,199,127,0.08)", border:"1px solid rgba(28,199,127,0.2)" }}>
                        <CheckCircle2 className="w-4 h-4" style={{ color:"#1cc77f" }} />
                        <span style={{ fontSize:"0.82rem", color:"#1a7f4a", fontWeight:600 }}>Ad is live! Leads flowing to your inbox.</span>
                      </div>
                    )}
                    {adResult?.error && (
                      <div className="p-3 rounded-xl mb-3" style={{ background:"rgba(239,68,68,0.06)", border:"1px solid rgba(239,68,68,0.2)" }}>
                        <span style={{ fontSize:"0.78rem", color:"#dc2626" }}>{adResult.error}</span>
                      </div>
                    )}

                    <button onClick={handleRunAd} disabled={!metaConnected||adPending}
                      className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                      style={{ background:metaConnected?"linear-gradient(135deg,#f59e0b,#f97316)":"#f5f5f7", color:metaConnected?"#fff":"rgba(0,0,0,0.3)", border:"none", cursor:metaConnected?"pointer":"not-allowed" }}>
                      {adPending ? <Loader2 className="w-4 h-4 animate-spin"/> : <Play className="w-4 h-4"/>}
                      {metaConnected ? `Launch Ad — ₹${(budgetInr*durationDays).toLocaleString("en-IN")} total` : "Connect Facebook first"}
                    </button>
                  </div>
                )}
              </div>

              <button onClick={() => setStep("pick_project")}
                className="w-full py-2.5 rounded-2xl font-semibold text-sm"
                style={{ background:"#f5f5f7", color:"#1d1d1f", border:"none", cursor:"pointer" }}>
                Advertise Another Project
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
