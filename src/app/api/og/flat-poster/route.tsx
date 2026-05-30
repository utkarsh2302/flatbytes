import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

const THEMES: Record<string, { bg: string; accent: string; badge: string; badgeBg: string }> = {
  gold:    { bg: "linear-gradient(160deg,#080C18 0%,#0D1526 55%,#060A14 100%)", accent: "#C9A84C", badge: "#1cc77f", badgeBg: "rgba(28,199,127,0.15)" },
  navy:    { bg: "linear-gradient(160deg,#03193B 0%,#071E3D 55%,#021229 100%)", accent: "#4B8BF5", badge: "#4B8BF5", badgeBg: "rgba(75,139,245,0.15)" },
  emerald: { bg: "linear-gradient(160deg,#051A0F 0%,#0A2E1A 55%,#030F08 100%)", accent: "#2ECC71", badge: "#2ECC71", badgeBg: "rgba(46,204,113,0.15)" },
  maroon:  { bg: "linear-gradient(160deg,#1A0508 0%,#2D0A0F 55%,#110305 100%)", accent: "#E8556A", badge: "#E8556A", badgeBg: "rgba(232,85,106,0.15)" },
  purple:  { bg: "linear-gradient(160deg,#0D0720 0%,#160B35 55%,#080413 100%)", accent: "#9B59B6", badge: "#9B59B6", badgeBg: "rgba(155,89,182,0.15)" },
};

const FORMATS: Record<string, { w: number; h: number }> = {
  square:    { w: 1080, h: 1080 },
  landscape: { w: 1200, h: 628  },
  story:     { w: 1080, h: 1920 },
  whatsapp:  { w: 1080, h: 1920 }, // Portrait — WhatsApp Status is 9:16
};

export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams;
  const projectName = sp.get("project")   ?? "Luxury Residences";
  const location    = sp.get("location")  ?? "Hyderabad";
  const configs     = sp.get("configs")   ?? "2, 3 & 4 BHK";
  const areaRange   = sp.get("area")      ?? "1200 – 2800 sq.ft";
  const available   = sp.get("available") ?? "12";
  const brokerPhone = sp.get("phone")     ?? "+91 98765 43210";
  const coverUrl    = sp.get("cover")    ?? null;
  const theme       = sp.get("theme")    ?? "gold";
  const tagline     = sp.get("tagline")  ?? "";
  const format      = sp.get("format")   ?? "square";
  const badge       = sp.get("badge")    ?? "";
  const contact     = sp.get("contact")  ?? "whatsapp";

  const t = THEMES[theme] ?? THEMES.gold;
  const { w, h } = FORMATS[format] ?? FORMATS.square;
  const isLandscape  = w > h;
  const isStory      = h > w; // portrait: story + whatsapp

  const contactIcon   = contact === "call" ? "📞" : "💬";
  const contactColor  = contact === "call" ? "#4B8BF5" : "#25D366";
  const contactBg     = contact === "call" ? "rgba(75,139,245,0.1)" : "rgba(37,211,102,0.1)";
  const contactBorder = contact === "call" ? "rgba(75,139,245,0.4)" : "rgba(37,211,102,0.4)";

  // Punchy call-to-action (no broker name on poster — just the number + CTA)
  const ctaKicker = contact === "call" ? "📞 CALL NOW" : "💬 WHATSAPP NOW";
  const ctaLine   = "Book your site visit today";

  // ── LANDSCAPE (Facebook feed / WhatsApp) ──────────────────────────────
  if (isLandscape) {
    return new ImageResponse((
      <div style={{ width:`${w}px`, height:`${h}px`, background:t.bg, display:"flex", flexDirection:"row", fontFamily:"sans-serif", position:"relative", overflow:"hidden" }}>
        {/* Left: cover photo */}
        <div style={{ display:"flex", width:"45%", height:"100%", position:"relative", flexShrink:0 }}>
          {coverUrl
            ? <img src={coverUrl} width={w*0.45} height={h} style={{ width:"100%", height:"100%", objectFit:"cover", opacity:0.85 }} />
            : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:80 }}>🏢</div>}
          <div style={{ position:"absolute", top:0, right:0, bottom:0, width:120, background:"linear-gradient(to right,transparent,rgba(0,0,0,0.8))", display:"flex" }} />
          {/* Accent bar left */}
          <div style={{ position:"absolute", left:0, top:0, bottom:0, width:"6px", background:t.accent, display:"flex" }} />
        </div>

        {/* Right: text */}
        <div style={{ display:"flex", flexDirection:"column", justifyContent:"center", flex:1, padding:"40px 44px 40px 32px", position:"relative" }}>
          {/* FlatBytes */}
          <div style={{ display:"flex", flexDirection:"row", alignItems:"center", gap:8, marginBottom:20 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"center", width:28, height:28, background:"#0071e3", borderRadius:6 }}>
              <div style={{ display:"flex", color:"#fff", fontSize:11, fontWeight:900 }}>FB</div>
            </div>
            <div style={{ display:"flex", color:"rgba(255,255,255,0.4)", fontSize:13, fontWeight:700, letterSpacing:3 }}>FLATBYTES</div>
          </div>

          {/* Project name */}
          <div style={{ display:"flex", color:"#fff", fontSize:42, fontWeight:900, lineHeight:1.05, letterSpacing:-1, marginBottom:8 }}>{projectName}</div>

          {/* Tagline */}
          {tagline && <div style={{ display:"flex", color:"rgba(255,255,255,0.6)", fontSize:17, fontStyle:"italic", marginBottom:14 }}>{tagline}</div>}

          {/* Location */}
          <div style={{ display:"flex", flexDirection:"row", alignItems:"center", gap:6, marginBottom:20 }}>
            <div style={{ display:"flex", fontSize:15 }}>📍</div>
            <div style={{ display:"flex", color:"rgba(255,255,255,0.75)", fontSize:16 }}>{location}</div>
          </div>

          {/* Gold line */}
          <div style={{ display:"flex", width:60, height:3, background:t.accent, borderRadius:2, marginBottom:22 }} />

          {/* Specs */}
          <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:24 }}>
            <div style={{ display:"flex", flexDirection:"row", gap:8, alignItems:"center" }}>
              <div style={{ display:"flex", color:t.accent, fontSize:11, fontWeight:800, letterSpacing:2, width:110 }}>CONFIG</div>
              <div style={{ display:"flex", color:"#fff", fontSize:17, fontWeight:700 }}>{configs}</div>
            </div>
            <div style={{ display:"flex", flexDirection:"row", gap:8, alignItems:"center" }}>
              <div style={{ display:"flex", color:t.accent, fontSize:11, fontWeight:800, letterSpacing:2, width:110 }}>AREA</div>
              <div style={{ display:"flex", color:"#fff", fontSize:17, fontWeight:700 }}>{areaRange}</div>
            </div>
            <div style={{ display:"flex", flexDirection:"row", gap:8, alignItems:"center" }}>
              <div style={{ display:"flex", color:t.accent, fontSize:11, fontWeight:800, letterSpacing:2, width:110 }}>AVAILABLE</div>
              <div style={{ display:"flex", color:t.badge, fontSize:17, fontWeight:700 }}>{available} Units</div>
            </div>
            <div style={{ display:"flex", flexDirection:"row", gap:8, alignItems:"center" }}>
              <div style={{ display:"flex", color:t.accent, fontSize:11, fontWeight:800, letterSpacing:2, width:110 }}>PRICE</div>
              <div style={{ display:"flex", color:"rgba(255,255,255,0.7)", fontSize:17, fontWeight:600 }}>On Request</div>
            </div>
          </div>

          {/* Badge */}
          {badge ? (
            <div style={{ display:"flex", flexDirection:"row", alignItems:"center", gap:8, background:`${t.accent}18`, border:`1px solid ${t.accent}55`, borderRadius:100, padding:"8px 18px", marginBottom:16 }}>
              <div style={{ display:"flex", color:t.accent, fontSize:14, fontWeight:800 }}>{badge}</div>
            </div>
          ) : null}

          {/* Call-to-action */}
          <div style={{ display:"flex", flexDirection:"row", alignItems:"center", gap:12, background:contactBg, border:`1.5px solid ${contactBorder}`, borderRadius:14, padding:"14px 20px" }}>
            <div style={{ display:"flex", fontSize:24 }}>{contactIcon}</div>
            <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
              <div style={{ display:"flex", color:contactColor, fontSize:12, fontWeight:800, letterSpacing:1.5 }}>{contact === "call" ? "CALL NOW — BOOK A VISIT" : "WHATSAPP NOW — BOOK A VISIT"}</div>
              <div style={{ display:"flex", color:"#fff", fontSize:21, fontWeight:900, letterSpacing:0.5 }}>{brokerPhone}</div>
            </div>
          </div>
        </div>

        {/* Accent top bar */}
        <div style={{ position:"absolute", top:0, left:0, right:0, height:4, background:`linear-gradient(90deg,${t.accent},${t.accent}aa,${t.accent})`, display:"flex" }} />
      </div>
    ), { width:w, height:h });
  }

  // ── STORY / PORTRAIT (Instagram Story 9:16) ─────────────────────────
  if (isStory) {
    return new ImageResponse((
      <div style={{ width:`${w}px`, height:`${h}px`, background:t.bg, display:"flex", flexDirection:"column", fontFamily:"sans-serif", position:"relative", overflow:"hidden" }}>
        {/* Cover photo — top half */}
        {coverUrl && <img src={coverUrl} width={w} height={h*0.5} style={{ position:"absolute", top:0, left:0, width:"100%", height:"50%", objectFit:"cover", opacity:0.35 }} />}
        <div style={{ position:"absolute", top:0, left:0, right:0, bottom:0, background:"linear-gradient(to bottom,rgba(0,0,0,0.1) 0%,rgba(0,0,0,0) 30%,rgba(0,0,0,0.7) 55%,rgba(0,0,0,1) 70%)", display:"flex" }} />

        {/* Accent bars */}
        <div style={{ position:"absolute", top:0, left:0, right:0, height:6, background:t.accent, display:"flex" }} />
        <div style={{ position:"absolute", bottom:0, left:0, right:0, height:6, background:t.accent, display:"flex" }} />

        {/* Top: FlatBytes + badge */}
        <div style={{ display:"flex", flexDirection:"row", justifyContent:"space-between", alignItems:"center", padding:"60px 56px 0", position:"relative", zIndex:10 }}>
          <div style={{ display:"flex", flexDirection:"row", alignItems:"center", gap:10 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"center", width:44, height:44, background:"#0071e3", borderRadius:10 }}>
              <div style={{ display:"flex", color:"#fff", fontSize:17, fontWeight:900 }}>FB</div>
            </div>
            <div style={{ display:"flex", color:"rgba(255,255,255,0.45)", fontSize:22, fontWeight:700, letterSpacing:4 }}>FLATBYTES</div>
          </div>
          <div style={{ display:"flex", flexDirection:"row", alignItems:"center", gap:10, background:t.badgeBg, border:`1px solid ${t.badge}55`, borderRadius:100, padding:"10px 22px" }}>
            <div style={{ display:"flex", width:10, height:10, borderRadius:"50%", background:t.badge }} />
            <div style={{ display:"flex", color:t.badge, fontSize:18, fontWeight:800 }}>{available} AVAILABLE</div>
          </div>
        </div>

        {/* Middle content */}
        <div style={{ display:"flex", flexDirection:"column", flex:1, justifyContent:"flex-end", padding:"0 56px 80px", position:"relative", zIndex:10 }}>
          {/* Location */}
          <div style={{ display:"flex", flexDirection:"row", alignItems:"center", gap:10, marginBottom:28 }}>
            <div style={{ display:"flex", flexDirection:"row", alignItems:"center", gap:8, background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:100, padding:"10px 24px" }}>
              <div style={{ display:"flex", fontSize:20 }}>📍</div>
              <div style={{ display:"flex", color:"rgba(255,255,255,0.8)", fontSize:22 }}>{location}</div>
            </div>
          </div>

          {/* Project name */}
          <div style={{ display:"flex", color:"#fff", fontSize:88, fontWeight:900, lineHeight:0.95, letterSpacing:-3, marginBottom:16 }}>{projectName}</div>
          {tagline && <div style={{ display:"flex", color:"rgba(255,255,255,0.6)", fontSize:30, fontStyle:"italic", marginBottom:24 }}>{tagline}</div>}

          {/* Highlight badge */}
          {badge ? (
            <div style={{ display:"flex", marginBottom:28 }}>
              <div style={{ display:"flex", alignItems:"center", background:t.accent, borderRadius:100, padding:"12px 30px" }}>
                <div style={{ display:"flex", color:"#0a0a0a", fontSize:28, fontWeight:900, letterSpacing:1 }}>{badge.toUpperCase()}</div>
              </div>
            </div>
          ) : null}

          {/* Gold divider */}
          <div style={{ display:"flex", width:100, height:4, background:t.accent, borderRadius:2, marginBottom:44 }} />

          {/* Specs — 2 col grid */}
          <div style={{ display:"flex", flexDirection:"row", gap:40, marginBottom:48 }}>
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              <div style={{ display:"flex", color:t.accent, fontSize:15, fontWeight:800, letterSpacing:3 }}>CONFIGURATIONS</div>
              <div style={{ display:"flex", color:"#fff", fontSize:38, fontWeight:800 }}>{configs}</div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              <div style={{ display:"flex", color:t.accent, fontSize:15, fontWeight:800, letterSpacing:3 }}>AREA</div>
              <div style={{ display:"flex", color:"#fff", fontSize:38, fontWeight:800 }}>{areaRange}</div>
            </div>
          </div>

          {/* Price */}
          <div style={{ display:"flex", flexDirection:"row", marginBottom:48 }}>
            <div style={{ display:"flex", flexDirection:"row", alignItems:"center", gap:12, background:`${t.accent}18`, border:`1px solid ${t.accent}55`, borderRadius:14, padding:"16px 32px" }}>
              <div style={{ display:"flex", fontSize:24 }}>💰</div>
              <div style={{ display:"flex", color:t.accent, fontSize:24, fontWeight:800, letterSpacing:2 }}>PRICE ON REQUEST</div>
            </div>
          </div>

          {/* Divider */}
          <div style={{ display:"flex", height:1, background:"rgba(255,255,255,0.08)", marginBottom:44 }} />

          {/* Call-to-action */}
          <div style={{ display:"flex", flexDirection:"row", alignItems:"center", justifyContent:"space-between" }}>
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              <div style={{ display:"flex", color:contactColor, fontSize:32, fontWeight:900, letterSpacing:1 }}>{ctaKicker}</div>
              <div style={{ display:"flex", color:"rgba(255,255,255,0.75)", fontSize:23 }}>{ctaLine}</div>
            </div>
            <div style={{ display:"flex", flexDirection:"row", alignItems:"center", gap:16, background:contactBg, border:`2px solid ${contactBorder}`, borderRadius:100, padding:"20px 36px" }}>
              <div style={{ display:"flex", fontSize:28 }}>{contactIcon}</div>
              <div style={{ display:"flex", color:contactColor, fontSize:32, fontWeight:900 }}>{brokerPhone}</div>
            </div>
          </div>
        </div>
      </div>
    ), { width:w, height:h });
  }

  // ── SQUARE (Instagram Feed / default) ────────────────────────────────
  return new ImageResponse((
    <div style={{ width:`${w}px`, height:`${h}px`, background:t.bg, display:"flex", flexDirection:"column", fontFamily:"sans-serif", position:"relative", overflow:"hidden" }}>
      {coverUrl && <img src={coverUrl} width={w} height={h} style={{ position:"absolute", top:0, left:0, width:"100%", height:"100%", objectFit:"cover", opacity:0.2 }} />}
      <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"700px", background:"linear-gradient(to top,rgba(0,0,0,1) 0%,rgba(0,0,0,0.88) 45%,transparent 100%)", display:"flex" }} />
      <div style={{ position:"absolute", top:0, left:0, right:0, height:5, background:`linear-gradient(90deg,transparent,${t.accent},transparent)`, display:"flex" }} />
      <div style={{ position:"absolute", bottom:0, left:0, right:0, height:5, background:`linear-gradient(90deg,transparent,${t.accent},transparent)`, display:"flex" }} />

      {/* Top */}
      <div style={{ display:"flex", flexDirection:"row", alignItems:"center", justifyContent:"space-between", padding:"52px 64px 0", position:"relative", zIndex:10 }}>
        <div style={{ display:"flex", flexDirection:"row", alignItems:"center", gap:12 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", width:40, height:40, background:"#0071e3", borderRadius:10 }}>
            <div style={{ display:"flex", color:"#fff", fontSize:16, fontWeight:900 }}>FB</div>
          </div>
          <div style={{ display:"flex", color:"rgba(255,255,255,0.45)", fontSize:20, fontWeight:700, letterSpacing:4 }}>FLATBYTES</div>
        </div>
        <div style={{ display:"flex", flexDirection:"row", alignItems:"center", gap:10, background:t.badgeBg, border:`1px solid ${t.badge}55`, borderRadius:100, padding:"12px 26px" }}>
          <div style={{ display:"flex", width:10, height:10, borderRadius:"50%", background:t.badge }} />
          <div style={{ display:"flex", color:t.badge, fontSize:18, fontWeight:800 }}>{available} UNITS AVAILABLE</div>
        </div>
      </div>

      {/* Main */}
      <div style={{ display:"flex", flexDirection:"column", justifyContent:"flex-end", flex:1, padding:"0 64px 60px", position:"relative", zIndex:10 }}>
        <div style={{ display:"flex", flexDirection:"row", alignItems:"center", marginBottom:24 }}>
          <div style={{ display:"flex", flexDirection:"row", alignItems:"center", gap:10, background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.14)", borderRadius:100, padding:"10px 24px" }}>
            <div style={{ display:"flex", fontSize:20 }}>📍</div>
            <div style={{ display:"flex", color:"rgba(255,255,255,0.85)", fontSize:21 }}>{location}</div>
          </div>
        </div>
        <div style={{ display:"flex", color:"#fff", fontSize:78, fontWeight:900, lineHeight:1, letterSpacing:-2, marginBottom:16 }}>{projectName}</div>
        {tagline && <div style={{ display:"flex", color:"rgba(255,255,255,0.6)", fontSize:26, fontStyle:"italic", marginBottom:20 }}>{tagline}</div>}
        {badge ? (
          <div style={{ display:"flex", marginBottom:24 }}>
            <div style={{ display:"flex", alignItems:"center", background:t.accent, borderRadius:100, padding:"11px 28px" }}>
              <div style={{ display:"flex", color:"#0a0a0a", fontSize:26, fontWeight:900, letterSpacing:1 }}>{badge.toUpperCase()}</div>
            </div>
          </div>
        ) : null}
        <div style={{ display:"flex", width:90, height:4, background:t.accent, borderRadius:2, marginBottom:40 }} />
        <div style={{ display:"flex", flexDirection:"row", marginBottom:44 }}>
          <div style={{ display:"flex", flexDirection:"column", paddingRight:60, marginRight:60, borderRight:"1px solid rgba(255,255,255,0.12)" }}>
            <div style={{ display:"flex", color:t.accent, fontSize:14, fontWeight:800, letterSpacing:3, marginBottom:10 }}>CONFIGURATIONS</div>
            <div style={{ display:"flex", color:"#fff", fontSize:34, fontWeight:800 }}>{configs}</div>
          </div>
          <div style={{ display:"flex", flexDirection:"column" }}>
            <div style={{ display:"flex", color:t.accent, fontSize:14, fontWeight:800, letterSpacing:3, marginBottom:10 }}>CARPET AREA</div>
            <div style={{ display:"flex", color:"#fff", fontSize:34, fontWeight:800 }}>{areaRange}</div>
          </div>
        </div>
        <div style={{ display:"flex", flexDirection:"row", marginBottom:48 }}>
          <div style={{ display:"flex", flexDirection:"row", alignItems:"center", gap:12, background:`${t.accent}18`, border:`1px solid ${t.accent}55`, borderRadius:12, padding:"14px 28px" }}>
            <div style={{ display:"flex", fontSize:20 }}>💰</div>
            <div style={{ display:"flex", color:t.accent, fontSize:20, fontWeight:800, letterSpacing:2 }}>PRICE ON REQUEST</div>
          </div>
        </div>
        <div style={{ display:"flex", height:1, background:"rgba(255,255,255,0.08)", marginBottom:40 }} />
        <div style={{ display:"flex", flexDirection:"row", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            <div style={{ display:"flex", color:contactColor, fontSize:30, fontWeight:900, letterSpacing:1 }}>{ctaKicker}</div>
            <div style={{ display:"flex", color:"rgba(255,255,255,0.75)", fontSize:21 }}>{ctaLine}</div>
          </div>
          <div style={{ display:"flex", flexDirection:"row", alignItems:"center", gap:16, background:contactBg, border:`2px solid ${contactBorder}`, borderRadius:100, padding:"18px 36px" }}>
            <div style={{ display:"flex", fontSize:26 }}>{contactIcon}</div>
            <div style={{ display:"flex", color:contactColor, fontSize:30, fontWeight:900 }}>{brokerPhone}</div>
          </div>
        </div>
      </div>
    </div>
  ), { width:w, height:h });
}
