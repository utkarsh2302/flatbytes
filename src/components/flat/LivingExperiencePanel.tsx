"use client";

import { useState, useEffect } from "react";
import type { Flat } from "@/lib/types";
import {
  analyzeLivingExperience,
  type LivingExperienceData,
  type VastuRating,
  type TimeSlot,
} from "@/lib/living-experience";

type TabId = "overview" | "vastu" | "sunlight" | "atmosphere";

const VASTU_COLORS: Record<VastuRating, string> = {
  excellent: "#1cc77f",
  good: "#3b82f6",
  moderate: "#f59e0b",
  unfavorable: "#ef4444",
};

const VASTU_LABELS: Record<VastuRating, string> = {
  excellent: "Excellent",
  good: "Good",
  moderate: "Moderate",
  unfavorable: "Needs Attention",
};

// Deterministic pseudo-random for star/city-light positions
function seededVal(seed: number, max: number) {
  return ((seed * 2654435761) >>> 0) % max;
}

function ScoreRing({
  score, label, color, size = 52, mounted,
}: {
  score: number; label: string; color: string; size?: number; mounted: boolean;
}) {
  const r = (size - 8) / 2;
  const circumference = 2 * Math.PI * r;
  const dash = mounted ? (score / 100) * circumference : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={5} />
          <circle
            cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={5}
            strokeDasharray={`${dash} ${circumference - dash}`} strokeLinecap="round"
            style={{ transition: "stroke-dasharray 1.3s cubic-bezier(0.34,1.56,0.64,1)" }}
          />
        </svg>
        <div style={{
          position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "0.8125rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.02em",
        }}>
          {score}
        </div>
      </div>
      <div style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.45)", textAlign: "center", lineHeight: 1.2, maxWidth: size }}>
        {label}
      </div>
    </div>
  );
}

function CompassView({ facingAngle, facingLabel }: { facingAngle: number; facingLabel: string }) {
  const cx = 100, cy = 100, R = 68;
  const dirs = [
    { label: "N", angle: 0 }, { label: "NE", angle: 45 }, { label: "E", angle: 90 },
    { label: "SE", angle: 135 }, { label: "S", angle: 180 }, { label: "SW", angle: 225 },
    { label: "W", angle: 270 }, { label: "NW", angle: 315 },
  ];

  // SVG uses angle from 3-o'clock, compass uses from 12-o'clock
  const toRad = (compassDeg: number) => ((compassDeg - 90) * Math.PI) / 180;
  const fRad = toRad(facingAngle);
  const indicatorX = cx + R * Math.cos(fRad);
  const indicatorY = cy + R * Math.sin(fRad);
  const arrowEndX = cx + (R - 12) * Math.cos(fRad);
  const arrowEndY = cy + (R - 12) * Math.sin(fRad);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      <svg width={200} height={200} viewBox="0 0 200 200">
        <defs>
          <radialGradient id="cBg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1a2035" />
            <stop offset="100%" stopColor="#0d1117" />
          </radialGradient>
          <radialGradient id="facingGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#2997ff" stopOpacity={0.7} />
            <stop offset="100%" stopColor="#2997ff" stopOpacity={0} />
          </radialGradient>
        </defs>

        {/* Background */}
        <circle cx={cx} cy={cy} r={92} fill="url(#cBg)" stroke="rgba(255,255,255,0.04)" strokeWidth={1} />

        {/* Track circles */}
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={1} />
        <circle cx={cx} cy={cy} r={R * 0.6} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={1} strokeDasharray="3,6" />

        {/* Sun arc: East → (through South) → West */}
        <path
          d={`M ${cx + R},${cy} A ${R},${R} 0 0,1 ${cx - R},${cy}`}
          fill="none" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5,4" opacity={0.45}
        />
        <circle cx={cx + R} cy={cy} r={4.5} fill="#f59e0b" opacity={0.5} />
        <circle cx={cx - R} cy={cy} r={3.5} fill="#94a3b8" opacity={0.4} />

        {/* Direction ticks + labels */}
        {dirs.map(({ label, angle }) => {
          const rad = toRad(angle);
          const isFacing = angle === facingAngle;
          const lx = cx + (R + 14) * Math.cos(rad);
          const ly = cy + (R + 14) * Math.sin(rad);
          const t1x = cx + (R - 5) * Math.cos(rad);
          const t1y = cy + (R - 5) * Math.sin(rad);
          const t2x = cx + (R + 4) * Math.cos(rad);
          const t2y = cy + (R + 4) * Math.sin(rad);
          return (
            <g key={label}>
              <line
                x1={t1x} y1={t1y} x2={t2x} y2={t2y}
                stroke={isFacing ? "#2997ff" : "rgba(255,255,255,0.2)"}
                strokeWidth={isFacing ? 2 : label.length === 1 ? 1.5 : 1}
              />
              <text
                x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
                fontSize={label.length === 1 ? 11 : 8} fontWeight={isFacing ? "900" : "500"}
                fill={isFacing ? "#2997ff" : "rgba(255,255,255,0.4)"}
              >
                {label}
              </text>
            </g>
          );
        })}

        {/* Facing glow + arrow */}
        <circle cx={indicatorX} cy={indicatorY} r={16} fill="url(#facingGlow)" />
        <line
          x1={cx} y1={cy} x2={arrowEndX} y2={arrowEndY}
          stroke="#2997ff" strokeWidth={2.5} strokeLinecap="round" opacity={0.85}
        />
        <circle cx={indicatorX} cy={indicatorY} r={5.5} fill="#2997ff" />
        <circle cx={indicatorX} cy={indicatorY} r={3} fill="#e0f2fe" />

        {/* Center */}
        <circle cx={cx} cy={cy} r={5} fill="rgba(255,255,255,0.12)" />
        <circle cx={cx} cy={cy} r={2.5} fill="rgba(255,255,255,0.7)" />
      </svg>

      <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.45)", textAlign: "center" }}>
        <span style={{ color: "#2997ff", fontWeight: 700 }}>{facingLabel}</span>
        {" "}facing · Sun rises East → arcs South → sets West
      </div>
    </div>
  );
}

interface Props {
  flat: Flat;
}

export default function LivingExperiencePanel({ flat }: Props) {
  const [tab, setTab] = useState<TabId>("overview");
  const [sunSlot, setSunSlot] = useState<TimeSlot>("morning");
  const [balconyTime, setBalconyTime] = useState<"day" | "evening" | "night">("day");
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setTimeout(() => setMounted(true), 120); }, []);

  const data: LivingExperienceData = analyzeLivingExperience(
    flat.facing ?? null,
    flat.floor,
    flat.flat_type,
    flat.carpet_area_sqft ?? 0,
  );

  const activeSunPhase = data.sunPhases.find((p) => p.id === sunSlot)!;
  const activeGradient = balconyTime === "day" ? data.balcony.dayGradient
    : balconyTime === "evening" ? data.balcony.eveningGradient
    : data.balcony.nightGradient;
  const activeMood = balconyTime === "day" ? data.balcony.dayMood
    : balconyTime === "evening" ? data.balcony.eveningMood
    : data.balcony.nightMood;

  const overallColor = data.scores.overall >= 80 ? "#1cc77f" : data.scores.overall >= 65 ? "#f59e0b" : "#f97316";

  const rings = [
    { label: "Vastu", score: data.scores.vastu, color: "#a855f7" },
    { label: "Sunlight", score: data.scores.sunlight, color: "#f59e0b" },
    { label: "Airflow", score: data.scores.ventilation, color: "#0ea5e9" },
    { label: "Privacy", score: data.scores.privacy, color: "#1cc77f" },
    { label: "Comfort", score: data.scores.comfort, color: "#f97316" },
  ];

  const bg = "#0d1117";
  const card = "rgba(255,255,255,0.04)";
  const border = "rgba(255,255,255,0.07)";

  return (
    <div style={{ background: bg, borderRadius: 20, overflow: "hidden", color: "#fff" }}>

      {/* Header */}
      <div style={{ padding: "20px 20px 0", background: "linear-gradient(180deg, rgba(26,32,53,0.9) 0%, transparent 100%)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: "0.625rem", fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 5 }}>
              Living Experience Intelligence
            </div>
            <div style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>
              {data.facingLabel} Facing · Floor {flat.floor}
            </div>
            <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", marginTop: 3 }}>
              {data.environmental.mood}
            </div>
          </div>
          <div style={{ textAlign: "center", flexShrink: 0 }}>
            <div style={{ fontSize: "2.25rem", fontWeight: 900, color: overallColor, lineHeight: 1, letterSpacing: "-0.04em" }}>
              {data.scores.overall}
            </div>
            <div style={{ fontSize: "0.5625rem", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Overall</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 0, borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          {(["overview", "vastu", "sunlight", "atmosphere"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              style={{
                flex: 1, padding: "9px 4px", fontSize: "0.72rem", fontWeight: tab === t ? 700 : 500, cursor: "pointer",
                background: "none", border: "none", color: tab === t ? "#2997ff" : "rgba(255,255,255,0.4)",
                borderBottom: `2px solid ${tab === t ? "#2997ff" : "transparent"}`,
                marginBottom: -1, transition: "all 0.2s",
              }}>
              {t === "overview" ? "Overview" : t === "vastu" ? "Vastu" : t === "sunlight" ? "Sunlight" : "Atmosphere"}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: 20 }}>

        {/* ── OVERVIEW ── */}
        {tab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Score rings */}
            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 4 }}>
              {rings.map((r) => (
                <ScoreRing key={r.label} score={r.score} label={r.label} color={r.color} mounted={mounted} />
              ))}
            </div>

            {/* Top tags */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {data.topTags.map((tag) => (
                <span key={tag} style={{
                  padding: "4px 11px", borderRadius: 100, fontSize: "0.6875rem", fontWeight: 600,
                  background: "rgba(41,151,255,0.1)", color: "#64b5ff", border: "1px solid rgba(41,151,255,0.18)",
                }}>
                  {tag}
                </span>
              ))}
            </div>

            {/* Summary */}
            <div style={{ background: card, borderRadius: 14, padding: 16, border: `1px solid ${border}` }}>
              <div style={{ fontSize: "0.625rem", fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                Experience Summary
              </div>
              <p style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.65)", lineHeight: 1.72, margin: 0 }}>
                {data.summary}
              </p>
            </div>

            {/* Lifestyle match */}
            <div style={{ background: "rgba(41,151,255,0.06)", borderRadius: 14, padding: 16, border: "1px solid rgba(41,151,255,0.12)" }}>
              <div style={{ fontSize: "0.625rem", fontWeight: 700, color: "rgba(41,151,255,0.65)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                Lifestyle Match
              </div>
              <p style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.6)", lineHeight: 1.65, margin: "0 0 12px" }}>
                {data.environmental.lifestyle}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {data.environmental.insights.map((ins, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <span style={{ color: "#2997ff", flexShrink: 0, fontSize: "0.75rem", marginTop: 2 }}>→</span>
                    <span style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>{ins}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── VASTU ── */}
        {tab === "vastu" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Score + summary row */}
            <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
              <div style={{ flexShrink: 0, textAlign: "center" }}>
                <div style={{
                  fontSize: "2.75rem", fontWeight: 900, lineHeight: 1, letterSpacing: "-0.04em",
                  color: data.scores.vastu >= 85 ? "#1cc77f" : data.scores.vastu >= 70 ? "#f59e0b" : "#ef4444",
                }}>
                  {data.scores.vastu}
                </div>
                <div style={{ fontSize: "0.625rem", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Vastu Score
                </div>
              </div>
              <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.58)", lineHeight: 1.68, margin: 0 }}>
                {data.vastuSummary}
              </p>
            </div>

            {/* Room grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {data.vastuRooms.map((room) => (
                <div key={room.name} style={{ background: card, borderRadius: 13, padding: 12, border: `1px solid ${border}` }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 7 }}>
                    <span style={{ fontSize: "1.375rem" }}>{room.emoji}</span>
                    <span style={{
                      fontSize: "0.58rem", fontWeight: 700, padding: "2px 7px", borderRadius: 100, textTransform: "uppercase", letterSpacing: "0.04em",
                      background: VASTU_COLORS[room.rating] + "22", color: VASTU_COLORS[room.rating],
                    }}>
                      {VASTU_LABELS[room.rating]}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#fff", marginBottom: 2 }}>{room.name}</div>
                  <div style={{ fontSize: "0.63rem", color: "rgba(255,255,255,0.35)", marginBottom: 7 }}>{room.direction}</div>
                  <div style={{ fontSize: "0.69rem", color: "rgba(255,255,255,0.52)", lineHeight: 1.5 }}>{room.insight}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SUNLIGHT ── */}
        {tab === "sunlight" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Compass */}
            <CompassView facingAngle={data.facingAngle} facingLabel={data.facingLabel} />

            {/* Phase selector */}
            <div style={{ display: "flex", gap: 4 }}>
              {data.sunPhases.map((phase) => (
                <button key={phase.id} onClick={() => setSunSlot(phase.id)}
                  style={{
                    flex: 1, padding: "8px 4px", borderRadius: 11, cursor: "pointer", border: "none",
                    background: sunSlot === phase.id
                      ? `linear-gradient(180deg, ${phase.skyTop}, ${phase.skyBottom})`
                      : "rgba(255,255,255,0.05)",
                    transition: "all 0.3s",
                  }}>
                  <div style={{ fontSize: "1.1rem", marginBottom: 3 }}>{phase.icon}</div>
                  <div style={{ fontSize: "0.6rem", fontWeight: 700, color: sunSlot === phase.id ? "#fff" : "rgba(255,255,255,0.38)" }}>
                    {phase.label}
                  </div>
                </button>
              ))}
            </div>

            {/* Phase detail card */}
            <div style={{
              borderRadius: 16, padding: 16, overflow: "hidden",
              background: `linear-gradient(150deg, ${activeSunPhase.skyTop} 0%, ${activeSunPhase.skyBottom} 100%)`,
              transition: "background 0.5s ease",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: "1.5rem", marginBottom: 4 }}>{activeSunPhase.icon}</div>
                  <div style={{ fontSize: "0.9375rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>{activeSunPhase.label}</div>
                  <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.65)" }}>{activeSunPhase.time}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>
                    Intensity
                  </div>
                  <div style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#fff", textTransform: "capitalize" }}>
                    {activeSunPhase.intensity === "none" ? "No sun" : activeSunPhase.intensity}
                  </div>
                </div>
              </div>

              <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.82)", lineHeight: 1.65, margin: "0 0 12px" }}>
                {activeSunPhase.description}
              </p>

              {activeSunPhase.rooms.length > 0 ? (
                <div>
                  <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>Rooms receiving light:</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {activeSunPhase.rooms.map((room) => (
                      <span key={room} style={{ fontSize: "0.7rem", fontWeight: 600, padding: "3px 9px", borderRadius: 100, background: "rgba(255,255,255,0.15)", color: "#fff" }}>
                        {room}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.45)", fontStyle: "italic" }}>
                  Indirect ambient light only — no direct sun enters during this phase.
                </div>
              )}
            </div>

            {/* Sunlight score bar */}
            <div style={{ background: card, borderRadius: 14, padding: 16, border: `1px solid ${border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#fff" }}>Overall Sunlight Score</div>
                <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#f59e0b" }}>{data.scores.sunlight}</div>
              </div>
              <div style={{ height: 5, borderRadius: 5, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 5, background: "linear-gradient(90deg, #d97706, #fcd34d)",
                  width: mounted ? `${data.scores.sunlight}%` : "0%", transition: "width 1.2s ease",
                }} />
              </div>
            </div>
          </div>
        )}

        {/* ── ATMOSPHERE ── */}
        {tab === "atmosphere" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

            {/* Balcony cinematic */}
            <div>
              <div style={{ fontSize: "0.625rem", fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                Balcony Experience · {data.balcony.direction} Facing
              </div>

              {/* Time picker */}
              <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
                {(["day", "evening", "night"] as const).map((t) => (
                  <button key={t} onClick={() => setBalconyTime(t)}
                    style={{
                      flex: 1, padding: "7px 8px", borderRadius: 10, fontSize: "0.75rem", fontWeight: 700, cursor: "pointer", border: "none",
                      background: balconyTime === t ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.05)",
                      color: balconyTime === t ? "#fff" : "rgba(255,255,255,0.38)",
                      transition: "all 0.2s",
                    }}>
                    {t === "day" ? "☀️ Day" : t === "evening" ? "🌅 Evening" : "🌙 Night"}
                  </button>
                ))}
              </div>

              {/* Sky canvas */}
              <div style={{
                borderRadius: 18, overflow: "hidden", position: "relative", height: 150,
                background: `linear-gradient(180deg, ${activeGradient[0]} 0%, ${activeGradient[1]} 50%, ${activeGradient[2]} 100%)`,
                transition: "background 0.7s ease",
              }}>
                {/* Night stars */}
                {balconyTime === "night" && [...Array(22)].map((_, i) => (
                  <div key={i} style={{
                    position: "absolute", borderRadius: "50%", background: "#fff",
                    opacity: 0.35 + (seededVal(i * 7, 6)) * 0.1,
                    width: 1 + (seededVal(i * 3, 2)),
                    height: 1 + (seededVal(i * 3, 2)),
                    top: `${8 + seededVal(i * 13, 55)}%`,
                    left: `${seededVal(i * 23, 98)}%`,
                  }} />
                ))}

                {/* Sun orb */}
                {balconyTime === "day" && (
                  <div style={{
                    position: "absolute", top: "18%", right: "22%", width: 34, height: 34, borderRadius: "50%",
                    background: "radial-gradient(circle, #fffde7, #ffd54f)",
                    boxShadow: "0 0 22px 10px rgba(255,213,79,0.45)",
                  }} />
                )}

                {/* Evening sunset orb */}
                {balconyTime === "evening" && (
                  <div style={{
                    position: "absolute", bottom: "18%", right: "18%", width: 38, height: 38, borderRadius: "50%",
                    background: "radial-gradient(circle, #ff8f00, #e64a19)",
                    boxShadow: "0 0 32px 14px rgba(230,74,25,0.55)",
                  }} />
                )}

                {/* Moon */}
                {balconyTime === "night" && (
                  <div style={{
                    position: "absolute", top: "12%", right: "28%", width: 26, height: 26, borderRadius: "50%",
                    background: "radial-gradient(circle, #f0f4f8, #c9d6e0)",
                    boxShadow: "0 0 16px 6px rgba(207,216,220,0.28)",
                  }} />
                )}

                {/* City lights silhouette */}
                {(balconyTime === "evening" || balconyTime === "night") && (
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 44, background: "rgba(0,0,0,0.55)" }}>
                    {[...Array(18)].map((_, i) => (
                      <div key={i} style={{
                        position: "absolute",
                        bottom: 3 + seededVal(i * 7, 20),
                        left: `${(i / 18) * 100 + seededVal(i, 4)}%`,
                        width: 2 + seededVal(i * 5, 3),
                        height: 5 + seededVal(i * 11, 14),
                        background: "#ffd700",
                        opacity: 0.45 + seededVal(i * 3, 5) * 0.08,
                      }} />
                    ))}
                  </div>
                )}

                {/* Atmosphere label */}
                <div style={{ position: "absolute", bottom: balconyTime === "night" || balconyTime === "evening" ? 52 : 14, left: 14 }}>
                  <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "rgba(255,255,255,0.85)", textShadow: "0 1px 6px rgba(0,0,0,0.5)" }}>
                    {data.balcony.atmosphere}
                  </div>
                </div>
              </div>

              {/* Mood text */}
              <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.58)", lineHeight: 1.68, margin: "10px 0 10px" }}>
                {activeMood}
              </p>

              {/* Highlight chips */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {data.balcony.highlights.map((h) => (
                  <span key={h} style={{
                    fontSize: "0.69rem", padding: "3px 9px", borderRadius: 100, fontWeight: 600,
                    background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.09)",
                  }}>
                    ✦ {h}
                  </span>
                ))}
              </div>
            </div>

            {/* Ventilation */}
            <div style={{ background: card, borderRadius: 14, padding: 16, border: `1px solid ${border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: "0.625rem", fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
                    Ventilation & Airflow
                  </div>
                  <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "#fff" }}>{data.ventilation.headline}</div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: "1.375rem", fontWeight: 800, color: "#0ea5e9" }}>{data.scores.ventilation}</div>
                  {data.ventilation.crossVentilation && (
                    <div style={{ fontSize: "0.6rem", color: "#1cc77f", fontWeight: 700 }}>Cross-vent ✓</div>
                  )}
                </div>
              </div>
              <div style={{ height: 4, borderRadius: 4, background: "rgba(255,255,255,0.08)", overflow: "hidden", marginBottom: 10 }}>
                <div style={{
                  height: "100%", borderRadius: 4, background: "#0ea5e9",
                  width: mounted ? `${data.scores.ventilation}%` : "0%", transition: "width 1.2s ease",
                }} />
              </div>
              <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.52)", lineHeight: 1.62, margin: "0 0 10px" }}>
                {data.ventilation.description}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {data.ventilation.paths.map((p, i) => (
                  <div key={i} style={{ display: "flex", gap: 7, alignItems: "flex-start" }}>
                    <span style={{ color: "#0ea5e9", fontSize: "0.75rem", flexShrink: 0, marginTop: 1 }}>→</span>
                    <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.47)" }}>{p}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Privacy */}
            <div style={{ background: card, borderRadius: 14, padding: 16, border: `1px solid ${border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: "0.625rem", fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
                    Privacy & Seclusion
                  </div>
                  <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "#fff" }}>{data.privacy.headline}</div>
                </div>
                <div style={{ fontSize: "1.375rem", fontWeight: 800, color: "#1cc77f", flexShrink: 0 }}>
                  {data.scores.privacy}
                </div>
              </div>
              <div style={{ height: 4, borderRadius: 4, background: "rgba(255,255,255,0.08)", overflow: "hidden", marginBottom: 10 }}>
                <div style={{
                  height: "100%", borderRadius: 4, background: "#1cc77f",
                  width: mounted ? `${data.scores.privacy}%` : "0%", transition: "width 1.2s ease",
                }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {data.privacy.insights.map((ins, i) => (
                  <div key={i} style={{ display: "flex", gap: 7, alignItems: "flex-start" }}>
                    <span style={{ color: "#1cc77f", fontSize: "0.75rem", flexShrink: 0, marginTop: 1 }}>→</span>
                    <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.47)" }}>{ins}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Heat */}
            <div style={{ background: card, borderRadius: 14, padding: 16, border: `1px solid ${border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: "0.625rem", fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
                    Heat Exposure
                  </div>
                  <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "#fff" }}>{data.heat.headline}</div>
                </div>
                <span style={{
                  fontSize: "0.75rem", fontWeight: 700, padding: "4px 11px", borderRadius: 100, textTransform: "capitalize", flexShrink: 0,
                  background: data.heat.level === "low" ? "rgba(28,199,127,0.15)" : data.heat.level === "moderate" ? "rgba(245,158,11,0.15)" : "rgba(239,68,68,0.15)",
                  color: data.heat.level === "low" ? "#1cc77f" : data.heat.level === "moderate" ? "#f59e0b" : "#ef4444",
                }}>
                  {data.heat.level}
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 12 }}>
                {data.heat.insights.map((ins, i) => (
                  <div key={i} style={{ display: "flex", gap: 7, alignItems: "flex-start" }}>
                    <span style={{
                      fontSize: "0.75rem", flexShrink: 0, marginTop: 1,
                      color: data.heat.level === "low" ? "#1cc77f" : data.heat.level === "moderate" ? "#f59e0b" : "#f97316",
                    }}>•</span>
                    <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.47)" }}>{ins}</span>
                  </div>
                ))}
              </div>
              {data.heat.coolRooms.length > 0 && (
                <>
                  <div style={{ fontSize: "0.625rem", color: "rgba(255,255,255,0.3)", marginBottom: 7, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Cool zones in this flat:
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {data.heat.coolRooms.map((room) => (
                      <span key={room} style={{
                        fontSize: "0.69rem", padding: "3px 9px", borderRadius: 100, fontWeight: 600,
                        background: "rgba(28,199,127,0.1)", color: "#1cc77f", border: "1px solid rgba(28,199,127,0.2)",
                      }}>
                        {room}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
