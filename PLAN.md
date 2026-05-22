# FlatBytes — Demo Build Plan

## What FlatBytes Is

**Done-for-you agency.** FlatBytes builds custom discovery web apps for real estate builders.

- FlatBytes seeds all project data — builders don't self-serve
- No payment integration — pure discovery and showcase
- One deployment per builder (separate apps per client)
- Builder's sales team gets login to see leads + flat status
- Lead inbox lives in-app only
- **The demo IS the sales pitch** — it must be so convincing a builder writes a cheque on the spot

---

## What's Already Built

- Project listing page + individual project explorer
- 3D model viewer (Three.js / OBJ) with material overrides
- Floor plan viewer with flat-level detail
- Flat inventory table with status (Available / Reserved / Sold)
- AI chatbot (Claude Haiku, streaming) with lead capture
- Lead popup (25s delay, sessionStorage-gated)
- Urgency toast (scarcity messaging)
- Sticky contact bar (desktop pill + mobile bottom bar)
- Share button (Web Share API + clipboard fallback)
- Admin dashboard with live stats
- Leads inbox (expandable rows, status pipeline, notes, call/WhatsApp CTA)
- Dynamic OG/Twitter metadata per project
- DM Sans font, BottomNav (mobile)
- Supabase schema: leads (status, note, source), projects (model_3d_url)

---

## What's Been Cut (not needed for this model)

- User signup / auth flows for builders
- Project creation wizard
- Razorpay billing / subscription
- Multi-tenant RLS (one app = one builder)
- Broker portal
- WhatsApp broadcast (Interakt)

---

## Workstreams

### W1 — 3D Showpiece (highest demo impact)
- Premium ModelViewer: glass shimmer, subtle AO, better lighting, environment feel
- Clickable floor rings / hotspots on the 3D model that drill into floor plan view
- Smooth camera transition when a floor is selected

### W2 — Flagship Sample Project (content makes the demo)
- Seed one "Prestige Heights" project with:
  - Real-looking cover photo + gallery (use Unsplash construction/building images)
  - Full amenities list (pool, gym, club, EV parking, concierge…)
  - Construction milestone timeline (Foundation → Structure → Finishing → Handover)
  - Rich flat inventory: mix of 2 BHK, 3 BHK, 4 BHK at realistic INR prices
  - Realistic builder details, location (Bangalore / Pune / Mumbai)

### W3 — Buyer Journey & Landing Page
- Homepage redesign: hero section, "how it works," project cards
- Rich project landing page sections: Hero, Specs, Amenities gallery, Location map stub, Why Invest, Construction progress
- Polish ChatWidget: better welcome message, smarter starter questions

### W4 — Mobile Pass
- Pixel-perfect on 375px (iPhone 14)
- 3D viewer touch controls
- Sticky bar + chat widget don't overlap
- BottomNav stays clear of content

### W5 — Admin Trim
- Remove "New Project" CTA and "Broadcasts" from AdminSidebar
- Simplify leads inbox for a non-technical sales person
- Add "Mark as Won" quick action

### W6 — Demo Hardening
- Zero console errors
- Sub-2s LCP on project page
- Coherent narrative: every screen tells the same story
- Add "Powered by FlatBytes" watermark (subtle — shows customizability)
- Final smoke test: homepage → project → chat → lead → admin inbox
