import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/layout/Navbar";
import Hero3DPreview from "@/components/home/Hero3DPreview";
import { getProjects } from "@/lib/data";
import { getProjectStats } from "@/lib/types";
import {
  ArrowRight, MapPin, ChevronRight, Box, Compass, Layers, Building2,
  Users, CreditCard, BarChart3, Bell, ShieldCheck, Sparkles, Check,
} from "lucide-react";

export const revalidate = 60;

const PRESTIGE_ID = "00000000-0000-0000-0000-000000000010";

const stats = [
  { label: "Flats showcased", value: "12,000+" },
  { label: "Builders onboard", value: "48" },
  { label: "Cities covered", value: "12" },
  { label: "Buyers served", value: "85,000+" },
];

const buyerFeatures = [
  {
    icon: Box,
    tag: "3D Tower Explorer",
    title: "Rotate the building. Tap any floor.",
    desc: "A live, interactive 3D tower. Spin it, zoom it, and click a floor to see exactly which flats are available, reserved, or sold — updated in real time.",
    accent: "#0071e3",
  },
  {
    icon: Compass,
    tag: "3D Interior Walkthrough",
    title: "Step inside before you visit.",
    desc: "Walk room to room through a true 3D model of the flat — living room, bedrooms, kitchen, balcony. Dollhouse view or first-person, right from your phone.",
    accent: "#1cc77f",
  },
  {
    icon: Layers,
    tag: "Interactive Floor Plans",
    title: "See where your flat sits.",
    desc: "A precise top-down plan of every floor. Understand the layout, facing direction, and who your neighbours are — then book the unit you love.",
    accent: "#a855f7",
  },
];

const builderModules = [
  { icon: Building2, title: "Project & Inventory", desc: "Towers, floors, flats, amenities — all managed in one place with live availability." },
  { icon: Users, title: "CRM & Sales Pipeline", desc: "Leads, follow-ups, site visits, and salesperson assignment across every stage." },
  { icon: CreditCard, title: "Bookings & Payments", desc: "Booking forms, allotment letters, construction-linked schedules, GST and receipts." },
  { icon: BarChart3, title: "Analytics Dashboard", desc: "Revenue, tower-wise sales, conversion funnels, and lead-source attribution." },
  { icon: Bell, title: "Automation", desc: "WhatsApp reminders, email notifications, and auto-generated PDF invoices." },
  { icon: ShieldCheck, title: "Broker & Customer Portals", desc: "Commission tracking for channel partners, payment history for buyers." },
];

export default async function HomePage() {
  const allProjects = await getProjects();
  const featuredProjects = allProjects.slice(0, 3);
  const demoProjectId = allProjects.find((p) => p.id === PRESTIGE_ID)?.id ?? allProjects[0]?.id ?? "";

  return (
    <div className="min-h-screen" style={{ background: "#000" }}>
      <Navbar />

      {/* ══ HERO ══════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden"
        style={{ background: "radial-gradient(ellipse 80% 60% at 70% 0%, #0a2a4a 0%, #050c1a 55%, #000 100%)" }}
      >
        {/* glow accents */}
        <div className="absolute pointer-events-none" style={{ top: "-10%", left: "10%", width: 420, height: 420, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,113,227,0.22), transparent 70%)" }} />
        <div className="absolute pointer-events-none" style={{ bottom: "0%", right: "5%", width: 360, height: 360, borderRadius: "50%", background: "radial-gradient(circle, rgba(28,199,127,0.16), transparent 70%)" }} />

        <div className="relative max-w-7xl mx-auto px-6 pt-32 pb-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left — copy */}
            <div className="anim-fade-up">
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}
              >
                <Sparkles className="w-3.5 h-3.5" style={{ color: "#1cc77f" }} />
                <span style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.82)", fontWeight: 500 }}>
                  The digital showroom for modern real estate
                </span>
              </div>

              <h1
                style={{
                  fontSize: "clamp(2.5rem, 5.5vw, 4rem)",
                  fontWeight: 700,
                  color: "#fff",
                  letterSpacing: "-0.035em",
                  lineHeight: 1.05,
                }}
              >
                Explore flats like<br />
                <span className="gradient-text">never before.</span>
              </h1>

              <p
                className="mt-6 max-w-lg"
                style={{ fontSize: "1.0625rem", color: "rgba(255,255,255,0.62)", lineHeight: 1.6 }}
              >
                Rotate a 3D building. Walk inside the flat. Track construction live.
                And for builders — a complete SaaS to manage inventory, leads, bookings
                and payments end to end.
              </p>

              <div className="flex flex-wrap items-center gap-3 mt-8">
                <Link
                  href={demoProjectId ? `/projects/${demoProjectId}` : "/projects"}
                  className="flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all"
                  style={{ background: "#0071e3", color: "#fff", fontSize: "0.9375rem" }}
                >
                  Try the 3D Explorer <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/projects"
                  className="flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all"
                  style={{ background: "rgba(255,255,255,0.08)", color: "#fff", border: "1px solid rgba(255,255,255,0.16)", fontSize: "0.9375rem" }}
                >
                  Browse Projects
                </Link>
              </div>

              {/* trust strip */}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-9">
                {["No login to explore", "RERA-verified projects", "Live availability"].map((t) => (
                  <div key={t} className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" style={{ color: "#1cc77f" }} />
                    <span style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.55)" }}>{t}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — 3D preview */}
            <div className="anim-fade-up anim-delay-2">
              <Hero3DPreview />
              <p className="text-center mt-3" style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.4)" }}>
                ↑ Drag to rotate · scroll to zoom — this is a live 3D model
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px mt-20 rounded-2xl overflow-hidden anim-fade-up anim-delay-3" style={{ background: "rgba(255,255,255,0.08)" }}>
            {stats.map((s) => (
              <div key={s.label} className="py-7 px-4 text-center" style={{ background: "rgba(255,255,255,0.025)" }}>
                <div style={{ fontSize: "1.85rem", fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>{s.value}</div>
                <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.45)", marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ BUYER FEATURES ════════════════════════════════════ */}
      <section style={{ background: "#f5f5f7", padding: "100px 24px" }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p style={{ fontSize: "0.8rem", fontWeight: 700, color: "#0071e3", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              For Home Buyers
            </p>
            <h2 className="mt-2" style={{ fontSize: "clamp(1.8rem,3.5vw,2.6rem)", fontWeight: 700, color: "#1d1d1f", letterSpacing: "-0.025em" }}>
              Buy with total confidence.
            </h2>
            <p className="mt-3 max-w-xl mx-auto" style={{ fontSize: "1rem", color: "rgba(0,0,0,0.55)" }}>
              Three immersive ways to explore a property before you ever step on site.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {buyerFeatures.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.tag}
                  className="rounded-2xl p-7 transition-all"
                  style={{ background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 8px 28px rgba(0,0,0,0.05)" }}
                >
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
                    style={{ background: `${f.accent}14` }}
                  >
                    <Icon className="w-6 h-6" style={{ color: f.accent }} />
                  </div>
                  <p style={{ fontSize: "0.72rem", fontWeight: 700, color: f.accent, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                    {f.tag}
                  </p>
                  <h3 className="mt-1.5" style={{ fontSize: "1.1875rem", fontWeight: 700, color: "#1d1d1f", letterSpacing: "-0.015em", lineHeight: 1.25 }}>
                    {f.title}
                  </h3>
                  <p className="mt-2.5" style={{ fontSize: "0.9rem", color: "rgba(0,0,0,0.56)", lineHeight: 1.55 }}>
                    {f.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══ BUILDER SAAS ══════════════════════════════════════ */}
      <section
        style={{ background: "linear-gradient(180deg, #0a0e1a 0%, #060912 100%)", padding: "100px 24px" }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <p style={{ fontSize: "0.8rem", fontWeight: 700, color: "#1cc77f", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                For Builders & Developers
              </p>
              <h2 className="mt-2" style={{ fontSize: "clamp(1.8rem,3.5vw,2.6rem)", fontWeight: 700, color: "#fff", letterSpacing: "-0.025em", lineHeight: 1.1 }}>
                Run your entire sales operation in one place.
              </h2>
            </div>
            <p style={{ fontSize: "1rem", color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>
              FlatBytes is a full real-estate SaaS — inventory visualization, CRM,
              booking management, construction-linked payments, broker portals and
              analytics. Everything your team needs to sell faster, with less paperwork.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
            {builderModules.map((m) => {
              const Icon = m.icon;
              return (
                <div key={m.title} className="p-7" style={{ background: "rgba(255,255,255,0.022)" }}>
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: "rgba(28,199,127,0.12)" }}>
                    <Icon className="w-5 h-5" style={{ color: "#1cc77f" }} />
                  </div>
                  <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "#fff", letterSpacing: "-0.01em" }}>{m.title}</h3>
                  <p className="mt-1.5" style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>{m.desc}</p>
                </div>
              );
            })}
          </div>

          <div className="flex justify-center mt-10">
            <Link
              href="/admin"
              className="flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all"
              style={{ background: "#fff", color: "#0a0e1a", fontSize: "0.9375rem" }}
            >
              Open Builder Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ══ FEATURED PROJECTS ═════════════════════════════════ */}
      <section style={{ background: "#f5f5f7", padding: "100px 24px" }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p style={{ fontSize: "0.8rem", fontWeight: 700, color: "#0071e3", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Live Projects
              </p>
              <h2 className="mt-2" style={{ fontSize: "clamp(1.6rem,3vw,2.2rem)", fontWeight: 700, color: "#1d1d1f", letterSpacing: "-0.025em" }}>
                Explore featured developments
              </h2>
            </div>
            <Link href="/projects" className="hidden sm:flex items-center gap-1 text-sm font-semibold" style={{ color: "#0071e3" }}>
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {featuredProjects.map((project) => {
              const s = getProjectStats(project);
              return (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="group block rounded-2xl overflow-hidden project-card-hover"
                  style={{ background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.04)" }}
                >
                  <div className="relative h-48 overflow-hidden" style={{ background: "#f0f0f2" }}>
                    {project.cover_image_url ? (
                      <Image
                        src={project.cover_image_url}
                        alt={project.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 1024px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(135deg,#e8e2d8,#d4cec4)" }}>
                        <Building2 className="w-10 h-10 opacity-20" />
                      </div>
                    )}
                    <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.5), transparent 55%)" }} />
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#fff", textShadow: "0 1px 4px rgba(0,0,0,0.4)" }}>
                        {project.name}
                      </h3>
                      <div className="flex items-center gap-1 mt-0.5" style={{ color: "rgba(255,255,255,0.75)", fontSize: "0.78rem" }}>
                        <MapPin className="w-3 h-3" />
                        {project.city ?? project.location}
                      </div>
                    </div>
                  </div>
                  <div className="p-4 flex items-center justify-between">
                    <div>
                      <div style={{ fontSize: "0.68rem", color: "rgba(0,0,0,0.4)", textTransform: "uppercase", letterSpacing: "0.05em" }}>From</div>
                      <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "#1d1d1f" }}>
                        {project.price_starting != null ? `₹${(project.price_starting / 100000).toFixed(0)}L` : "On request"}
                      </div>
                    </div>
                    <div className="text-right">
                      <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#059669" }}>{s.available}</div>
                      <div style={{ fontSize: "0.68rem", color: "rgba(0,0,0,0.4)" }}>available</div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══ CTA ═══════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden text-center"
        style={{ background: "radial-gradient(ellipse at center, #0a2a4a 0%, #050c1a 70%)", padding: "110px 24px" }}
      >
        <div className="absolute pointer-events-none" style={{ top: "-20%", left: "50%", transform: "translateX(-50%)", width: 500, height: 300, background: "radial-gradient(circle, rgba(0,113,227,0.2), transparent 70%)" }} />
        <div className="relative max-w-2xl mx-auto">
          <h2 style={{ fontSize: "clamp(1.9rem,4vw,2.8rem)", fontWeight: 700, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
            Ready to find your flat?
          </h2>
          <p className="mt-4" style={{ fontSize: "1.0625rem", color: "rgba(255,255,255,0.6)" }}>
            Browse verified projects, explore them in 3D, and book with confidence.
          </p>
          <div className="flex items-center justify-center gap-3 mt-9 flex-wrap">
            <Link
              href="/projects"
              className="flex items-center gap-2 px-7 py-3.5 rounded-full font-semibold"
              style={{ background: "#0071e3", color: "#fff", fontSize: "0.95rem" }}
            >
              Browse All Projects <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href={demoProjectId ? `/projects/${demoProjectId}` : "/projects"}
              className="px-7 py-3.5 rounded-full font-medium"
              style={{ background: "rgba(255,255,255,0.08)", color: "#fff", border: "1px solid rgba(255,255,255,0.18)", fontSize: "0.95rem" }}
            >
              Try 3D Explorer
            </Link>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ════════════════════════════════════════════ */}
      <footer style={{ background: "#000", borderTop: "1px solid rgba(255,255,255,0.08)", padding: "32px 24px" }}>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.4)" }}>
            © 2026 FlatBytes by BrickBytes. All rights reserved.
          </p>
          <div className="flex gap-6">
            {["Privacy", "Terms", "Contact"].map((l) => (
              <a key={l} href="#" style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.4)" }}>{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
