"use client";

// LivingExperience3D — fullscreen visual "live in this flat" experience.
// No paragraphs. Sun arcs across the sky, light fills the rooms, airflow
// streams through, Vastu glows on the floor plan. Drive it with the time
// slider or hit play to watch a full day pass.

import { useState, useEffect, useMemo } from "react";
import { X, Sun, Wind, Shield, Thermometer, Sparkles, Play, Pause, MoveHorizontal } from "lucide-react";
import type { Flat } from "@/lib/types";
import {
  analyzeLivingExperience,
  type VastuRating,
} from "@/lib/living-experience";

type Mode = "sunlight" | "vastu" | "airflow" | "heat" | "privacy";

const VASTU_HUE: Record<VastuRating, string> = {
  excellent: "#1cc77f",
  good: "#3b82f6",
  moderate: "#f59e0b",
  unfavorable: "#ef4444",
};

// ── Floor plan layouts (in SVG units) ─────────────────────────────────────────
// All layouts are 360w × 280h. Balcony always at the top (facing direction).

interface RoomRect {
  id: string;
  x: number; y: number; w: number; h: number;
  name: string; emoji: string;
  vastuKey: string;
  // which compass side of the flat the room sits on (relative to center):
  // "front"=top, "right", "back"=bottom, "left", "center"
  edge: "front" | "right" | "back" | "left" | "center";
}

const FLAT_W = 360;
const FLAT_H = 280;

function getLayout(flatType: string): RoomRect[] {
  switch (flatType) {
    case "studio":
      return [
        { id: "balcony", x: 0, y: 0, w: 360, h: 50, name: "Balcony", emoji: "🌿", vastuKey: "Balcony", edge: "front" },
        { id: "main", x: 0, y: 60, w: 240, h: 220, name: "Living + Bed", emoji: "🛋", vastuKey: "Living Room", edge: "left" },
        { id: "kitchen", x: 250, y: 60, w: 110, h: 110, name: "Kitchenette", emoji: "🍳", vastuKey: "Kitchen", edge: "right" },
        { id: "bath", x: 250, y: 180, w: 110, h: 100, name: "Bath", emoji: "🚿", vastuKey: "Bathroom", edge: "right" },
      ];
    case "1bhk":
      return [
        { id: "balcony", x: 0, y: 0, w: 360, h: 50, name: "Balcony", emoji: "🌿", vastuKey: "Balcony", edge: "front" },
        { id: "living", x: 0, y: 60, w: 220, h: 110, name: "Living", emoji: "🛋", vastuKey: "Living Room", edge: "left" },
        { id: "kitchen", x: 230, y: 60, w: 130, h: 110, name: "Kitchen", emoji: "🍳", vastuKey: "Kitchen", edge: "right" },
        { id: "master", x: 0, y: 180, w: 240, h: 100, name: "Bedroom", emoji: "🛏", vastuKey: "Master Bedroom", edge: "back" },
        { id: "bath", x: 250, y: 180, w: 110, h: 100, name: "Bath", emoji: "🚿", vastuKey: "Bathroom", edge: "back" },
      ];
    case "3bhk":
    case "4bhk":
    case "penthouse":
      return [
        { id: "balcony", x: 0, y: 0, w: 360, h: 50, name: "Balcony", emoji: "🌿", vastuKey: "Balcony", edge: "front" },
        { id: "living", x: 0, y: 60, w: 180, h: 100, name: "Living", emoji: "🛋", vastuKey: "Living Room", edge: "front" },
        { id: "dining", x: 190, y: 60, w: 80, h: 100, name: "Dining", emoji: "🍽", vastuKey: "Dining Area", edge: "center" },
        { id: "kitchen", x: 280, y: 60, w: 80, h: 100, name: "Kitchen", emoji: "🍳", vastuKey: "Kitchen", edge: "right" },
        { id: "bed2", x: 0, y: 170, w: 110, h: 110, name: "Bedroom 2", emoji: "🛏", vastuKey: "Children's Room", edge: "left" },
        { id: "bed3", x: 120, y: 170, w: 110, h: 60, name: "Bedroom 3", emoji: "🛏", vastuKey: "Children's Room", edge: "back" },
        { id: "pooja", x: 120, y: 240, w: 110, h: 40, name: "Pooja", emoji: "🪔", vastuKey: "Pooja Room", edge: "back" },
        { id: "master", x: 240, y: 170, w: 120, h: 110, name: "Master Bed", emoji: "🛏", vastuKey: "Master Bedroom", edge: "right" },
      ];
    default: // 2bhk
      return [
        { id: "balcony", x: 0, y: 0, w: 360, h: 50, name: "Balcony", emoji: "🌿", vastuKey: "Balcony", edge: "front" },
        { id: "living", x: 0, y: 60, w: 220, h: 110, name: "Living", emoji: "🛋", vastuKey: "Living Room", edge: "left" },
        { id: "kitchen", x: 230, y: 60, w: 130, h: 110, name: "Kitchen", emoji: "🍳", vastuKey: "Kitchen", edge: "right" },
        { id: "master", x: 0, y: 180, w: 150, h: 100, name: "Master Bed", emoji: "🛏", vastuKey: "Master Bedroom", edge: "back" },
        { id: "bed2", x: 160, y: 180, w: 110, h: 100, name: "Bedroom 2", emoji: "🛏", vastuKey: "Children's Room", edge: "back" },
        { id: "bath", x: 280, y: 180, w: 80, h: 100, name: "Bath", emoji: "🚿", vastuKey: "Bathroom", edge: "back" },
      ];
  }
}

// ── Time → sun + sky ──────────────────────────────────────────────────────────

function sunCompassAngle(hour: number): number | null {
  if (hour < 6 || hour > 18) return null;
  return 90 + ((hour - 6) / 12) * 180; // 6am=E(90), 12pm=S(180), 6pm=W(270)
}

function skyForHour(hour: number): [string, string, string] {
  if (hour < 5) return ["#020617", "#0f172a", "#1e293b"];
  if (hour < 6) return ["#1e1b4b", "#7c3aed", "#f472b6"];
  if (hour < 7) return ["#dc2626", "#f59e0b", "#fde68a"];
  if (hour < 10) return ["#0284c7", "#0ea5e9", "#bae6fd"];
  if (hour < 15) return ["#0369a1", "#0ea5e9", "#7dd3fc"];
  if (hour < 17) return ["#0c4a6e", "#f59e0b", "#fed7aa"];
  if (hour < 18.5) return ["#b91c1c", "#ea580c", "#fbbf24"];
  if (hour < 20) return ["#4c1d95", "#c2410c", "#dc2626"];
  return ["#020617", "#0f172a", "#1e293b"];
}

function sunWarmth(hour: number): string {
  if (hour < 7) return "#fda4af"; // rose
  if (hour < 10) return "#fcd34d"; // gold
  if (hour < 15) return "#fef3c7"; // bright
  if (hour < 17) return "#fbbf24"; // amber
  if (hour < 19) return "#fb923c"; // sunset
  return "#cbd5e1"; // moonlight
}

// Which rooms receive direct sunlight given sun's relative angle (0=front, 90=right, ±180=back, -90=left)
function roomsLitBy(relAngle: number, rooms: RoomRect[]): Set<string> {
  const lit = new Set<string>();
  // Normalize to -180..180
  let a = relAngle;
  while (a > 180) a -= 360;
  while (a < -180) a += 360;
  for (const r of rooms) {
    if (r.edge === "front" && Math.abs(a) < 65) lit.add(r.id);
    if (r.edge === "right" && a > 20 && a < 160) lit.add(r.id);
    if (r.edge === "left" && a < -20 && a > -160) lit.add(r.id);
    if (r.edge === "back" && Math.abs(a) > 130) lit.add(r.id);
    if (r.edge === "center" && Math.abs(a) < 30) lit.add(r.id);
  }
  return lit;
}

// Pick a Vastu rating for each room from the analysis data
function vastuRatingFor(vastuKey: string, rooms: ReturnType<typeof analyzeLivingExperience>["vastuRooms"]): VastuRating {
  const exact = rooms.find((r) => r.name === vastuKey);
  if (exact) return exact.rating;
  return "good";
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  flat: Flat;
  projectName?: string;
  onClose: () => void;
}

export default function LivingExperience3D({ flat, projectName, onClose }: Props) {
  const [time, setTime] = useState(9); // 9 AM default
  const [mode, setMode] = useState<Mode>("sunlight");
  const [playing, setPlaying] = useState(false);
  const [hoveredRoom, setHoveredRoom] = useState<string | null>(null);

  // Auto-play through the day
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setTime((t) => (t + 0.25) % 24), 90);
    return () => clearInterval(id);
  }, [playing]);

  // ESC to close
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const data = useMemo(
    () => analyzeLivingExperience(flat.facing ?? null, flat.floor, flat.flat_type, flat.carpet_area_sqft ?? 0),
    [flat.facing, flat.floor, flat.flat_type, flat.carpet_area_sqft]
  );
  const rooms = useMemo(() => getLayout(flat.flat_type), [flat.flat_type]);

  const sunComp = sunCompassAngle(time);
  const isNight = sunComp === null;
  const relAngle = sunComp !== null ? sunComp - data.facingAngle : null;
  const sky = skyForHour(time);
  const warmth = sunWarmth(time);
  const litRooms = useMemo(
    () => (relAngle !== null ? roomsLitBy(relAngle, rooms) : new Set<string>()),
    [relAngle, rooms]
  );

  // Sun position on screen (orbits the floor plan)
  const planCx = FLAT_W / 2; // 180
  const planCy = FLAT_H / 2; // 140
  // SVG world: plan sits at (120, 130), so its center is (300, 270)
  const stageCx = 300;
  const stageCy = 270;
  const sunOrbit = 240;
  const sunPos = relAngle !== null ? {
    x: stageCx + sunOrbit * Math.sin((relAngle * Math.PI) / 180),
    y: stageCy - sunOrbit * Math.cos((relAngle * Math.PI) / 180),
  } : null;

  // Moon (opposite side at night)
  const moonHour = isNight ? (time < 6 ? time + 12 : time - 12) : 0;
  const moonComp = isNight && moonHour >= 6 && moonHour <= 18
    ? 90 + ((moonHour - 6) / 12) * 180
    : 180;
  const moonRel = moonComp - data.facingAngle;
  const moonPos = isNight ? {
    x: stageCx + sunOrbit * Math.sin((moonRel * Math.PI) / 180),
    y: stageCy - sunOrbit * Math.cos((moonRel * Math.PI) / 180),
  } : null;

  // Time labels
  const hr = Math.floor(time);
  const mn = Math.floor((time - hr) * 60);
  const hr12 = hr === 0 ? 12 : hr > 12 ? hr - 12 : hr;
  const ampm = hr < 12 ? "AM" : "PM";
  const timeLabel = `${hr12}:${String(mn).padStart(2, "0")} ${ampm}`;

  // Heat tint per room (only in heat mode)
  const heatFor = (r: RoomRect): string | null => {
    if (mode !== "heat") return null;
    // Front rooms heat from the facing direction
    const facing = data.facing;
    const isWestish = facing === "west" || facing === "south-west" || facing === "north-west";
    const isNorthish = facing === "north" || facing === "north-east";
    if (r.edge === "front" || r.edge === "left" || r.edge === "right") {
      if (isWestish) return "rgba(239,68,68,0.32)";
      if (isNorthish) return "rgba(59,130,246,0.22)";
      return "rgba(245,158,11,0.22)";
    }
    return "rgba(59,130,246,0.18)"; // back rooms cooler
  };

  // Modes config
  const MODES: { id: Mode; label: string; icon: React.ReactNode; color: string }[] = [
    { id: "sunlight", label: "Sunlight", icon: <Sun className="w-3.5 h-3.5" />, color: "#f59e0b" },
    { id: "vastu", label: "Vastu", icon: <Sparkles className="w-3.5 h-3.5" />, color: "#a855f7" },
    { id: "airflow", label: "Airflow", icon: <Wind className="w-3.5 h-3.5" />, color: "#0ea5e9" },
    { id: "heat", label: "Heat", icon: <Thermometer className="w-3.5 h-3.5" />, color: "#ef4444" },
    { id: "privacy", label: "Privacy", icon: <Shield className="w-3.5 h-3.5" />, color: "#1cc77f" },
  ];

  // Hovered room tooltip data
  const hovered = hoveredRoom ? rooms.find((r) => r.id === hoveredRoom) : null;
  const hoveredVastu = hovered ? data.vastuRooms.find((v) => v.name === hovered.vastuKey) : null;

  // Plan transform origin & x offset
  const planX = 120, planY = 130;

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: `linear-gradient(180deg, ${sky[0]} 0%, ${sky[1]} 55%, ${sky[2]} 100%)`,
        transition: "background 0.8s ease",
        display: "flex", flexDirection: "column",
      }}
    >
      {/* Stars at night */}
      {(time < 5.5 || time > 19) && (
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
          {[...Array(50)].map((_, i) => {
            const seed = (i * 2654435761) >>> 0;
            return (
              <div key={i} style={{
                position: "absolute", borderRadius: "50%", background: "#fff",
                opacity: 0.3 + ((seed % 7) / 10),
                width: 1 + (seed % 3), height: 1 + (seed % 3),
                top: `${(seed >> 4) % 40}%`,
                left: `${(seed >> 9) % 100}%`,
              }} />
            );
          })}
        </div>
      )}

      {/* Top bar */}
      <div style={{
        position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 20px", background: "rgba(0,0,0,0.18)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}>
        <div>
          <div style={{ fontSize: "0.625rem", fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
            Living Experience · {data.facingLabel} Facing
          </div>
          <div style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#fff", marginTop: 2 }}>
            Flat {flat.flat_number} · Floor {flat.floor}
            {projectName && <span style={{ color: "rgba(255,255,255,0.5)", fontWeight: 500 }}> · {projectName}</span>}
          </div>
        </div>
        <button onClick={onClose} aria-label="Close"
          style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.12)", color: "#fff", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center" }}>
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Mode pills */}
      <div style={{ display: "flex", justifyContent: "center", padding: "12px 16px 0", gap: 6, flexWrap: "wrap" }}>
        {MODES.map((m) => (
          <button key={m.id} onClick={() => setMode(m.id)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "7px 12px", borderRadius: 100, fontSize: "0.72rem", fontWeight: 700, cursor: "pointer",
              background: mode === m.id ? m.color : "rgba(255,255,255,0.08)",
              color: mode === m.id ? "#fff" : "rgba(255,255,255,0.6)",
              border: `1px solid ${mode === m.id ? m.color : "rgba(255,255,255,0.1)"}`,
              transition: "all 0.2s",
              boxShadow: mode === m.id ? `0 0 20px ${m.color}55` : "none",
            }}>
            {m.icon} {m.label}
          </button>
        ))}
      </div>

      {/* The stage */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, minHeight: 0 }}>
        <svg viewBox="0 0 600 540" style={{ maxWidth: "100%", maxHeight: "100%", width: "min(640px, 92vw)" }}>
          <defs>
            {/* Sun radial gradient */}
            <radialGradient id="sunGrad">
              <stop offset="0%" stopColor="#fffbeb" stopOpacity={1} />
              <stop offset="40%" stopColor={warmth} stopOpacity={0.9} />
              <stop offset="100%" stopColor={warmth} stopOpacity={0} />
            </radialGradient>
            <radialGradient id="moonGrad">
              <stop offset="0%" stopColor="#f1f5f9" stopOpacity={0.95} />
              <stop offset="60%" stopColor="#cbd5e1" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#cbd5e1" stopOpacity={0} />
            </radialGradient>
            {/* Light beam */}
            <linearGradient id="lightBeam" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={warmth} stopOpacity={0.55} />
              <stop offset="100%" stopColor={warmth} stopOpacity={0} />
            </linearGradient>
            {/* Room interior at night */}
            <radialGradient id="roomGlow">
              <stop offset="0%" stopColor="#fde68a" stopOpacity={0.85} />
              <stop offset="100%" stopColor="#fb923c" stopOpacity={0} />
            </radialGradient>
          </defs>

          {/* Compass needle (top-left) */}
          <g transform="translate(60, 70)">
            <circle cx={0} cy={0} r={32} fill="rgba(0,0,0,0.35)" stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
            <g transform={`rotate(${-data.facingAngle})`}>
              <line x1={0} y1={0} x2={0} y2={-22} stroke="#ef4444" strokeWidth={2} strokeLinecap="round" />
              <line x1={0} y1={0} x2={0} y2={22} stroke="rgba(255,255,255,0.5)" strokeWidth={1.5} strokeLinecap="round" />
              <text x={0} y={-28} fontSize={9} fontWeight="700" fill="#ef4444" textAnchor="middle">N</text>
            </g>
            <text x={0} y={50} fontSize={8} fontWeight="700" fill="rgba(255,255,255,0.55)" textAnchor="middle">
              FACING {data.facingLabel.toUpperCase()}
            </text>
          </g>

          {/* Sun orbit ring (subtle) */}
          {!isNight && (
            <circle cx={stageCx} cy={stageCy} r={sunOrbit} fill="none"
              stroke="rgba(255,255,255,0.08)" strokeWidth={1} strokeDasharray="2,6" />
          )}

          {/* Sun */}
          {sunPos && (
            <g>
              <circle cx={sunPos.x} cy={sunPos.y} r={50} fill="url(#sunGrad)" />
              <circle cx={sunPos.x} cy={sunPos.y} r={14} fill={warmth} opacity={0.95} />
              <circle cx={sunPos.x} cy={sunPos.y} r={8} fill="#fffbeb" />
            </g>
          )}

          {/* Moon */}
          {moonPos && (
            <g>
              <circle cx={moonPos.x} cy={moonPos.y} r={36} fill="url(#moonGrad)" />
              <circle cx={moonPos.x} cy={moonPos.y} r={10} fill="#e2e8f0" opacity={0.85} />
              <circle cx={moonPos.x - 3} cy={moonPos.y - 2} r={2} fill="#94a3b8" opacity={0.6} />
              <circle cx={moonPos.x + 4} cy={moonPos.y + 3} r={1.5} fill="#94a3b8" opacity={0.5} />
            </g>
          )}

          {/* Sunlight beams pointing into lit rooms */}
          {mode === "sunlight" && sunPos && rooms.filter((r) => litRooms.has(r.id)).map((r) => {
            const rx = planX + r.x + r.w / 2;
            const ry = planY + r.y + r.h / 2;
            return (
              <line key={`beam-${r.id}`}
                x1={sunPos.x} y1={sunPos.y} x2={rx} y2={ry}
                stroke={warmth} strokeWidth={2} strokeLinecap="round"
                opacity={0.18} />
            );
          })}

          {/* Floor plan group */}
          <g transform={`translate(${planX}, ${planY})`}>
            {/* Floor base shadow */}
            <rect x={-6} y={-6} width={FLAT_W + 12} height={FLAT_H + 12} rx={14}
              fill="rgba(0,0,0,0.4)" />
            <rect x={0} y={0} width={FLAT_W} height={FLAT_H} rx={10}
              fill="#1a1f2e" stroke="rgba(255,255,255,0.08)" strokeWidth={1} />

            {/* Rooms */}
            {rooms.map((r) => {
              const isBalcony = r.id === "balcony";
              const isLit = litRooms.has(r.id);
              const isHovered = hoveredRoom === r.id;
              const vastuR = mode === "vastu" ? vastuRatingFor(r.vastuKey, data.vastuRooms) : null;
              const heatColor = heatFor(r);
              const roomFill = isBalcony
                ? `linear-gradient(${sky[0]}, ${sky[2]})`
                : "#2a3142";

              return (
                <g key={r.id}
                  onMouseEnter={() => setHoveredRoom(r.id)}
                  onMouseLeave={() => setHoveredRoom(null)}
                  style={{ cursor: "pointer" }}>
                  {/* Base room rect */}
                  <rect
                    x={r.x} y={r.y} width={r.w} height={r.h} rx={6}
                    fill={isBalcony ? sky[2] : "#252b3d"}
                    stroke={vastuR ? VASTU_HUE[vastuR] : isHovered ? "#fff" : "rgba(255,255,255,0.1)"}
                    strokeWidth={vastuR ? 2.5 : isHovered ? 2 : 1}
                    style={{ transition: "stroke 0.2s, stroke-width 0.2s" }}
                  />

                  {/* Night room glow (lights on at night, non-balcony) */}
                  {isNight && !isBalcony && (
                    <rect x={r.x} y={r.y} width={r.w} height={r.h} rx={6}
                      fill="url(#roomGlow)" opacity={0.55} />
                  )}

                  {/* Sunlight wash on lit rooms */}
                  {mode === "sunlight" && isLit && !isBalcony && (
                    <rect x={r.x} y={r.y} width={r.w} height={r.h} rx={6}
                      fill={warmth} opacity={0.32} />
                  )}

                  {/* Heat overlay */}
                  {heatColor && (
                    <rect x={r.x} y={r.y} width={r.w} height={r.h} rx={6} fill={heatColor} />
                  )}

                  {/* Room label */}
                  <text x={r.x + r.w / 2} y={r.y + r.h / 2 - 6} textAnchor="middle"
                    fontSize={r.w < 100 ? 16 : 20} dominantBaseline="middle">
                    {r.emoji}
                  </text>
                  <text x={r.x + r.w / 2} y={r.y + r.h / 2 + 14} textAnchor="middle"
                    fontSize={9} fontWeight="700" fill="rgba(255,255,255,0.75)">
                    {r.name}
                  </text>

                  {/* Vastu corner badge */}
                  {vastuR && (
                    <circle cx={r.x + r.w - 8} cy={r.y + 8} r={4}
                      fill={VASTU_HUE[vastuR]} stroke="#0d1117" strokeWidth={1.5} />
                  )}
                </g>
              );
            })}

            {/* Airflow streams */}
            {mode === "airflow" && (
              <g>
                {[0.2, 0.5, 0.8].map((frac, i) => {
                  const startX = FLAT_W * frac;
                  return (
                    <g key={i}>
                      <path
                        d={`M ${startX},10 Q ${startX + 20},${FLAT_H / 2} ${startX},${FLAT_H - 10}`}
                        fill="none" stroke="#0ea5e9" strokeWidth={2}
                        strokeDasharray="6,8" strokeLinecap="round" opacity={0.7}>
                        <animate attributeName="stroke-dashoffset"
                          from={0} to={-28} dur="1.4s" repeatCount="indefinite" />
                      </path>
                      {/* Arrow head at bottom */}
                      <path
                        d={`M ${startX - 4},${FLAT_H - 16} L ${startX},${FLAT_H - 8} L ${startX + 4},${FLAT_H - 16}`}
                        fill="none" stroke="#0ea5e9" strokeWidth={2} strokeLinecap="round" />
                    </g>
                  );
                })}
                {/* "Cross-vent" badge if applicable */}
                {data.ventilation.crossVentilation && (
                  <g transform={`translate(${FLAT_W / 2}, ${FLAT_H + 22})`}>
                    <rect x={-58} y={-9} width={116} height={18} rx={9}
                      fill="rgba(14,165,233,0.18)" stroke="rgba(14,165,233,0.4)" />
                    <text x={0} y={3} textAnchor="middle" fontSize={9} fontWeight="700" fill="#67e8f9">
                      ✓ CROSS-VENTILATION
                    </text>
                  </g>
                )}
              </g>
            )}

            {/* Privacy mode: floor altitude indicator */}
            {mode === "privacy" && (
              <g>
                {/* Neighbor tower silhouettes — closer if low floor */}
                {(() => {
                  const closeness = Math.max(0.1, 1 - flat.floor / 25);
                  const towerH = 60 + closeness * 80;
                  const towerW = 30 + closeness * 20;
                  const towerOpacity = 0.25 + closeness * 0.4;
                  return (
                    <>
                      <rect x={-90} y={FLAT_H - towerH} width={towerW} height={towerH} rx={2}
                        fill="#475569" opacity={towerOpacity} />
                      <rect x={FLAT_W + 60} y={FLAT_H - towerH * 0.85} width={towerW} height={towerH * 0.85} rx={2}
                        fill="#475569" opacity={towerOpacity} />
                      <text x={-75} y={FLAT_H + 14} fontSize={8} fontWeight="700"
                        fill={flat.floor >= 10 ? "rgba(28,199,127,0.8)" : "rgba(245,158,11,0.8)"}>
                        FLOOR {flat.floor} · {flat.floor >= 10 ? "Above neighbours" : "Mid level"}
                      </text>
                    </>
                  );
                })()}
              </g>
            )}
          </g>
        </svg>

        {/* Floating room tooltip */}
        {hovered && (
          <div style={{
            position: "absolute", bottom: 130, left: "50%", transform: "translateX(-50%)",
            background: "rgba(13,17,23,0.95)", backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: "10px 14px",
            display: "flex", alignItems: "center", gap: 10, color: "#fff",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)", maxWidth: 360,
          }}>
            <span style={{ fontSize: "1.5rem" }}>{hovered.emoji}</span>
            <div>
              <div style={{ fontSize: "0.8rem", fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                {hovered.name}
                {mode === "vastu" && hoveredVastu && (
                  <span style={{
                    fontSize: "0.6rem", fontWeight: 700, padding: "2px 7px", borderRadius: 100, textTransform: "uppercase", letterSpacing: "0.04em",
                    background: VASTU_HUE[hoveredVastu.rating] + "33", color: VASTU_HUE[hoveredVastu.rating],
                  }}>{hoveredVastu.rating}</span>
                )}
                {mode === "sunlight" && (
                  <span style={{
                    fontSize: "0.6rem", fontWeight: 700, padding: "2px 7px", borderRadius: 100,
                    background: litRooms.has(hovered.id) ? "rgba(245,158,11,0.2)" : "rgba(255,255,255,0.06)",
                    color: litRooms.has(hovered.id) ? "#fbbf24" : "rgba(255,255,255,0.4)",
                  }}>{litRooms.has(hovered.id) ? "☀ LIT" : "shaded"}</span>
                )}
              </div>
              <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.55)", marginTop: 1 }}>
                {mode === "vastu" && hoveredVastu ? hoveredVastu.direction
                  : mode === "sunlight" ? (litRooms.has(hovered.id) ? `Direct ${warmth === "#fcd34d" ? "morning" : warmth === "#fbbf24" ? "afternoon" : warmth === "#fb923c" ? "evening" : "sun"} light` : "No direct sun right now")
                  : mode === "airflow" ? "Air flows " + (hovered.edge === "front" || hovered.edge === "back" ? "through" : "across")
                  : mode === "heat" ? (heatFor(hovered)?.includes("239") ? "Warm zone" : heatFor(hovered)?.includes("59,130") ? "Cool zone" : "Moderate")
                  : "Floor " + flat.floor}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom: time slider + scores strip */}
      <div style={{
        background: "rgba(0,0,0,0.45)", backdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(255,255,255,0.08)", padding: "16px 20px",
      }}>
        {/* Quick scores */}
        <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
          {[
            { l: "Vastu", v: data.scores.vastu, c: "#a855f7" },
            { l: "Sun", v: data.scores.sunlight, c: "#f59e0b" },
            { l: "Air", v: data.scores.ventilation, c: "#0ea5e9" },
            { l: "Privacy", v: data.scores.privacy, c: "#1cc77f" },
            { l: "Comfort", v: data.scores.comfort, c: "#f97316" },
            { l: "Overall", v: data.scores.overall, c: data.scores.overall >= 80 ? "#1cc77f" : data.scores.overall >= 65 ? "#f59e0b" : "#f97316", bold: true },
          ].map((s) => (
            <div key={s.l} style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "5px 11px", borderRadius: 100,
              background: s.bold ? s.c + "22" : "rgba(255,255,255,0.06)",
              border: `1px solid ${s.bold ? s.c + "55" : "rgba(255,255,255,0.08)"}`,
            }}>
              <span style={{ fontSize: "0.625rem", color: "rgba(255,255,255,0.55)", fontWeight: 600 }}>{s.l}</span>
              <span style={{ fontSize: "0.78rem", fontWeight: 800, color: s.c }}>{s.v}</span>
            </div>
          ))}
        </div>

        {/* Time slider */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, maxWidth: 640, margin: "0 auto" }}>
          <button onClick={() => setPlaying(!playing)}
            style={{
              width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
              background: playing ? "#0071e3" : "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.15)", color: "#fff", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
            {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" style={{ marginLeft: 2 }} />}
          </button>

          <div style={{ flex: 1, position: "relative" }}>
            <input type="range" min={0} max={23.75} step={0.25} value={time}
              onChange={(e) => { setTime(Number(e.target.value)); setPlaying(false); }}
              style={{ width: "100%", accentColor: warmth, height: 4 }} />
            {/* Sunrise/sunset markers */}
            <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
              {[
                { h: 6, l: "🌅" },
                { h: 12, l: "☀️" },
                { h: 18, l: "🌇" },
                { h: 0, l: "🌙" },
              ].map((m) => (
                <div key={m.h} style={{
                  position: "absolute", top: -22, fontSize: "0.7rem",
                  left: `${(m.h / 24) * 100}%`, transform: "translateX(-50%)",
                  opacity: 0.55,
                }}>{m.l}</div>
              ))}
            </div>
          </div>

          <div style={{ width: 84, textAlign: "right", flexShrink: 0 }}>
            <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>
              {timeLabel}
            </div>
            <div style={{ fontSize: "0.625rem", color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 1 }}>
              {isNight ? "Night" : time < 12 ? "Morning" : time < 17 ? "Afternoon" : "Evening"}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 8, color: "rgba(255,255,255,0.35)", fontSize: "0.7rem" }}>
          <MoveHorizontal className="w-3 h-3" />
          <span>Drag time · tap modes to explore · hover rooms for details</span>
        </div>
      </div>
    </div>
  );
}
