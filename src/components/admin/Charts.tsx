import { inrShort } from "@/lib/format";

// ── Area / line chart ─────────────────────────────────────────────────────────
export function AreaChart({
  data,
  height = 180,
  accent = "#0071e3",
}: {
  data: { month: string; value: number }[];
  height?: number;
  accent?: string;
}) {
  if (data.length === 0) return null;
  const W = 600;
  const H = height;
  const pad = { t: 16, r: 12, b: 28, l: 12 };
  const max = Math.max(...data.map((d) => d.value), 1);
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;

  const pts = data.map((d, i) => {
    const x = pad.l + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
    const y = pad.t + innerH - (d.value / max) * innerH;
    return { x, y, ...d };
  });

  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const areaPath = `${linePath} L${pts[pts.length - 1].x},${pad.t + innerH} L${pts[0].x},${pad.t + innerH} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{ display: "block" }}>
      <defs>
        <linearGradient id={`grad-${accent.slice(1)}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.28" />
          <stop offset="100%" stopColor={accent} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {/* gridlines */}
      {[0.25, 0.5, 0.75].map((g) => (
        <line key={g} x1={pad.l} x2={W - pad.r} y1={pad.t + innerH * g} y2={pad.t + innerH * g}
          stroke="rgba(0,0,0,0.06)" strokeWidth="1" />
      ))}
      <path d={areaPath} fill={`url(#grad-${accent.slice(1)})`} />
      <path d={linePath} fill="none" stroke={accent} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="3.5" fill="#fff" stroke={accent} strokeWidth="2" />
          <text x={p.x} y={H - 8} textAnchor="middle" fontSize="11" fill="rgba(0,0,0,0.4)">{p.month}</text>
        </g>
      ))}
    </svg>
  );
}

// ── Horizontal bar list ───────────────────────────────────────────────────────
export function BarList({
  items,
  accent = "#0071e3",
  valueFormat = "number",
}: {
  items: { label: string; value: number; sub?: string }[];
  accent?: string;
  valueFormat?: "number" | "currency";
}) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <div className="space-y-3">
      {items.map((it) => (
        <div key={it.label}>
          <div className="flex items-center justify-between mb-1">
            <span style={{ fontSize: "0.8125rem", fontWeight: 500, color: "#1d1d1f" }}>{it.label}</span>
            <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#1d1d1f" }}>
              {valueFormat === "currency" ? inrShort(it.value) : it.value}
              {it.sub && <span style={{ fontWeight: 400, color: "rgba(0,0,0,0.4)" }}> · {it.sub}</span>}
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.06)" }}>
            <div
              className="h-full rounded-full"
              style={{ width: `${Math.max((it.value / max) * 100, 3)}%`, background: accent, transition: "width 0.6s ease" }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Donut chart ───────────────────────────────────────────────────────────────
export function Donut({
  segments,
  size = 160,
  centerLabel,
  centerSub,
}: {
  segments: { label: string; value: number; color: string }[];
  size?: number;
  centerLabel?: string;
  centerSub?: string;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const r = size / 2 - 14;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="flex items-center gap-5">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth="14" />
        {segments.map((seg) => {
          const frac = seg.value / total;
          const dash = frac * circ;
          const el = (
            <circle
              key={seg.label}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth="14"
              strokeDasharray={`${dash} ${circ - dash}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
              transform={`rotate(-90 ${cx} ${cy})`}
            />
          );
          offset += dash;
          return el;
        })}
        {centerLabel && (
          <text x={cx} y={cy - 2} textAnchor="middle" fontSize="20" fontWeight="700" fill="#1d1d1f">
            {centerLabel}
          </text>
        )}
        {centerSub && (
          <text x={cx} y={cy + 16} textAnchor="middle" fontSize="10" fill="rgba(0,0,0,0.45)">
            {centerSub}
          </text>
        )}
      </svg>
      <div className="space-y-2">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: seg.color }} />
            <span style={{ fontSize: "0.8125rem", color: "rgba(0,0,0,0.6)" }}>{seg.label}</span>
            <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#1d1d1f", marginLeft: "auto" }}>{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Funnel ────────────────────────────────────────────────────────────────────
export function Funnel({ stages }: { stages: { stage: string; count: number }[] }) {
  const max = Math.max(...stages.map((s) => s.count), 1);
  const LABELS: Record<string, string> = {
    new: "New", contacted: "Contacted", qualified: "Qualified",
    site_visit: "Site Visit", negotiation: "Negotiation", won: "Won",
  };
  return (
    <div className="space-y-1.5">
      {stages.map((s, i) => {
        const pct = (s.count / max) * 100;
        const hue = 210 - i * 28;
        return (
          <div key={s.stage} className="flex items-center gap-3">
            <span style={{ width: 84, fontSize: "0.78rem", color: "rgba(0,0,0,0.55)" }}>
              {LABELS[s.stage] ?? s.stage}
            </span>
            <div className="flex-1 h-7 rounded-lg overflow-hidden" style={{ background: "rgba(0,0,0,0.04)" }}>
              <div
                className="h-full flex items-center px-2.5"
                style={{ width: `${Math.max(pct, 6)}%`, background: `hsl(${hue} 80% 55%)`, transition: "width 0.6s ease" }}
              >
                <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#fff" }}>{s.count}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
