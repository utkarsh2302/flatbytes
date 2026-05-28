import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import Navbar from "@/components/layout/Navbar";
import FlatFinder from "@/components/home/FlatFinder";
import RecentProjects from "@/components/home/RecentProjects";
import { getProjects } from "@/lib/data";
import { getProjectStats, FLAT_TYPE_LABELS } from "@/lib/types";
import {
  MapPin, ChevronRight, Building2, Check,
  Box, Compass, Layers,
  Users, CreditCard, BarChart3, Bell, ShieldCheck,
} from "lucide-react";

export const revalidate = 60;

const Hero3DPreview = dynamic(() => import("@/components/home/Hero3DPreview"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full rounded-3xl" style={{ background: "rgba(255,255,255,0.04)", minHeight: 340 }} />
  ),
});

const buyerFeatures = [
  {
    icon: Box, emoji: "🏗",
    tag: "3D Tower Explorer",
    title: "Spin the building. Tap any floor.",
    desc: "A live 3D tower you can rotate and zoom. Tap any floor to see exactly which flats are available.",
    accent: "#0071e3",
  },
  {
    icon: Compass, emoji: "🚶",
    tag: "3D Interior Walkthrough",
    title: "Walk inside before you visit.",
    desc: "Step room-to-room through a real 3D model — living room, kitchen, balcony — from your phone.",
    accent: "#1cc77f",
  },
  {
    icon: Layers, emoji: "📐",
    tag: "Floor Plans",
    title: "See exactly where your flat sits.",
    desc: "Top-down layout of every floor. Check the size, direction it faces, and who your neighbours are.",
    accent: "#a855f7",
  },
];

const builderModules = [
  { icon: Building2, title: "Inventory",      desc: "All towers, floors, and flats in one live dashboard." },
  { icon: Users,     title: "CRM",            desc: "Leads, follow-ups, visits, and full pipeline." },
  { icon: CreditCard, title: "Bookings",      desc: "Booking forms, schedules, GST, receipts." },
  { icon: BarChart3,  title: "Analytics",     desc: "Revenue, conversions, and sales funnel." },
  { icon: Bell,       title: "Automation",    desc: "WhatsApp reminders and auto PDF invoices." },
  { icon: ShieldCheck, title: "Portals",      desc: "Commission tracking and payment history." },
];

export default async function HomePage() {
  const allProjects = await getProjects();
  const featuredProjects = allProjects.slice(0, 3);
  const demoProject = allProjects[0];

  const allFlats = allProjects.flatMap(p => p.towers.flatMap(t => t.flats));
  const totalAvailable = allFlats.filter(f => f.status === "available").length;
  const totalProjects = allProjects.length;

  return (
    <div className="min-h-screen" style={{ background: "#000" }}>
      <Navbar />

      {/* ══ HERO ══════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden"
        style={{ background: "radial-gradient(ellipse 80% 60% at 70% 0%, #0a2a4a 0%, #050c1a 55%, #000 100%)" }}
      >
        {/* Glow accents */}
        <div className="absolute pointer-events-none" style={{ top: "-10%", left: "5%", width: "min(420px, 80vw)", height: "min(420px, 80vw)", borderRadius: "50%", background: "radial-gradient(circle, rgba(0,113,227,0.22), transparent 70%)" }} />
        <div className="absolute pointer-events-none" style={{ bottom: "0%", right: "0%", width: "min(360px, 60vw)", height: "min(360px, 60vw)", borderRadius: "50%", background: "radial-gradient(circle, rgba(28,199,127,0.16), transparent 70%)" }} />

        <div className="relative max-w-7xl mx-auto px-5 pt-20 pb-12 sm:pt-32 sm:pb-24">
          <div className="grid lg:grid-cols-2 gap-10 items-start">

            {/* Left — copy + finder widget */}
            <div className="anim-fade-up">
              {/* Badge */}
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}
              >
                <span style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.8)", fontWeight: 500 }}>
                  🏆 Explore flats in 3D — India&apos;s easiest flat finder
                </span>
              </div>

              {/* Headline */}
              <h1
                style={{
                  fontSize: "clamp(2.2rem, 5vw, 3.6rem)",
                  fontWeight: 700,
                  color: "#fff",
                  letterSpacing: "-0.035em",
                  lineHeight: 1.07,
                  marginBottom: "0.5rem",
                }}
              >
                Find your perfect<br />
                <span className="gradient-text">flat in 3D.</span>
              </h1>

              <p
                className="mb-6 max-w-md"
                style={{ fontSize: "1rem", color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}
              >
                Pick how many bedrooms you want, set your budget, and see real available flats instantly.
              </p>

              {/* ⭐ The flat finder widget */}
              <FlatFinder />

              {/* Trust strip */}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-5">
                {[
                  "No login needed",
                  "RERA-verified projects",
                  "Live availability",
                ].map((t) => (
                  <div key={t} className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 shrink-0" style={{ color: "#1cc77f" }} />
                    <span style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.5)" }}>{t}</span>
                  </div>
                ))}
              </div>

              {/* Live stats pills */}
              {totalAvailable > 0 && (
                <div className="flex items-center gap-2 mt-4 flex-wrap">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                    style={{ background: "rgba(28,199,127,0.12)", border: "1px solid rgba(28,199,127,0.25)" }}>
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#1cc77f" }} />
                    <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#1cc77f" }}>
                      {totalAvailable} flats available now
                    </span>
                  </div>
                  <div className="px-3 py-1.5 rounded-full"
                    style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}>
                    <span style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.5)" }}>
                      across {totalProjects} project{totalProjects !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Right — 3D preview (desktop) */}
            <div className="hidden lg:block anim-fade-up anim-delay-2">
              <Hero3DPreview />
              <p className="text-center mt-3" style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.35)" }}>
                ↑ Drag to rotate · Scroll to zoom — live 3D model
              </p>
            </div>
          </div>
        </div>
        {/* Recently viewed projects — shows only after first project visit */}
        <RecentProjects />
      </section>

      {/* ══ HOW IT WORKS (3 steps, super simple) ═════════════ */}
      <section style={{ background: "#fff", padding: "72px 20px" }}>
        <div className="max-w-4xl mx-auto text-center">
          <p style={{ fontSize: "0.78rem", fontWeight: 700, color: "#0071e3", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
            How it works
          </p>
          <h2 style={{ fontSize: "clamp(1.7rem,3.5vw,2.4rem)", fontWeight: 700, color: "#1d1d1f", letterSpacing: "-0.025em", marginBottom: 40 }}>
            Find your flat in 3 easy steps
          </h2>

          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { step: "1", emoji: "🛏", title: "Pick BHK type", desc: "Choose how many bedrooms — Studio, 1, 2, 3, 4 BHK, or Penthouse." },
              { step: "2", emoji: "💰", title: "Set your budget", desc: "Tell us your price range. We'll show only what fits." },
              { step: "3", emoji: "🏗", title: "Explore in 3D", desc: "Spin the building, walk inside flats, see every detail." },
            ].map(({ step, emoji, title, desc }) => (
              <div
                key={step}
                className="flex flex-col items-center text-center p-6 rounded-2xl"
                style={{ background: "#f5f5f7" }}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 text-xl"
                  style={{ background: "rgba(0,113,227,0.1)" }}
                >
                  {emoji}
                </div>
                <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#0071e3", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>
                  Step {step}
                </div>
                <h3 style={{ fontSize: "1.0625rem", fontWeight: 700, color: "#1d1d1f", marginBottom: 8 }}>
                  {title}
                </h3>
                <p style={{ fontSize: "0.875rem", color: "rgba(0,0,0,0.55)", lineHeight: 1.55 }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>

          <Link
            href="/search"
            className="inline-flex items-center gap-2 mt-10 font-semibold rounded-full"
            style={{ background: "#0071e3", color: "#fff", padding: "14px 32px", fontSize: "0.9375rem", textDecoration: "none" }}
          >
            Browse All Available Flats
          </Link>
        </div>
      </section>

      {/* ══ FEATURED PROJECTS ═════════════════════════════════ */}
      {featuredProjects.length > 0 && (
        <section style={{ background: "#f5f5f7", padding: "80px 20px" }}>
          <div className="max-w-6xl mx-auto">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p style={{ fontSize: "0.78rem", fontWeight: 700, color: "#0071e3", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>
                  Live Projects
                </p>
                <h2 style={{ fontSize: "clamp(1.5rem,3vw,2.1rem)", fontWeight: 700, color: "#1d1d1f", letterSpacing: "-0.025em" }}>
                  Featured developments
                </h2>
              </div>
              <Link href="/projects" className="hidden sm:flex items-center gap-1 font-semibold" style={{ fontSize: "0.875rem", color: "#0071e3", textDecoration: "none" }}>
                View all <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {featuredProjects.map((project) => {
                const s = getProjectStats(project);
                const bhkChips = Array.from(new Set(
                  project.towers.flatMap(t => t.flats)
                    .filter(f => f.status === "available")
                    .map(f => f.flat_type)
                )).slice(0, 4);
                return (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="group block rounded-2xl overflow-hidden project-card-hover"
                    style={{ background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.04)", textDecoration: "none" }}
                  >
                    {/* Cover */}
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
                      {/* Status pill */}
                      {project.status && (
                        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full"
                          style={{
                            background: project.status === "completed" ? "#059669" : "rgba(0,0,0,0.52)",
                            backdropFilter: "blur(10px)",
                            color: "#fff",
                            fontSize: "0.68rem", fontWeight: 600,
                          }}>
                          {project.status === "completed" ? "Ready to Move" : project.status === "active" ? "Under Construction" : "Upcoming"}
                        </div>
                      )}
                      <div className="absolute bottom-3 left-3 right-3">
                        <h3 style={{ fontSize: "1.0625rem", fontWeight: 700, color: "#fff", textShadow: "0 1px 4px rgba(0,0,0,0.4)" }}>
                          {project.name}
                        </h3>
                        <div className="flex items-center gap-1 mt-0.5" style={{ color: "rgba(255,255,255,0.75)", fontSize: "0.78rem" }}>
                          <MapPin className="w-3 h-3" />
                          {project.city ?? project.location}
                        </div>
                      </div>
                    </div>
                    {/* Card body */}
                    <div className="p-4">
                      {/* Construction progress */}
                      {project.construction_percentage != null && project.status !== "completed" && (
                        <div className="mb-3">
                          <div className="flex justify-between mb-1" style={{ fontSize: "0.68rem", color: "rgba(0,0,0,0.4)" }}>
                            <span>{project.construction_stage ?? "In progress"}</span>
                            <span style={{ fontWeight: 600, color: "#d97706" }}>{project.construction_percentage}%</span>
                          </div>
                          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.07)" }}>
                            <div className="h-full rounded-full" style={{ width: `${project.construction_percentage}%`, background: "linear-gradient(90deg,#f59e0b,#d97706)" }} />
                          </div>
                        </div>
                      )}
                      {/* Availability + BHK chips */}
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ background: s.available > 0 ? "#34c759" : "#ff3b30" }} />
                          <span style={{ fontSize: "0.8rem", fontWeight: 600, color: s.available > 0 ? "#1a7f4a" : "#d70015" }}>
                            {s.available > 0 ? `${s.available} Available` : "Sold Out"}
                          </span>
                          {s.sold > 0 && <span style={{ fontSize: "0.72rem", color: "rgba(0,0,0,0.35)" }}>· {s.sold} sold</span>}
                        </div>
                        <div style={{ fontSize: "1rem", fontWeight: 700, color: "#0071e3" }}>On Request</div>
                      </div>
                      {bhkChips.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {bhkChips.map(type => (
                            <span key={type} className="px-2 py-0.5 rounded-full text-xs font-semibold"
                              style={{ background: "rgba(0,113,227,0.07)", color: "#0071e3", border: "1px solid rgba(0,113,227,0.15)" }}>
                              {FLAT_TYPE_LABELS[type] ?? type}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className="sm:hidden flex justify-center mt-6">
              <Link href="/projects" className="btn-outline" style={{ padding: "12px 28px" }}>
                View all projects
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ══ BUYER FEATURES ════════════════════════════════════ */}
      <section style={{ background: "#fff", padding: "80px 20px" }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p style={{ fontSize: "0.78rem", fontWeight: 700, color: "#0071e3", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              For Home Buyers
            </p>
            <h2 className="mt-2" style={{ fontSize: "clamp(1.7rem,3.5vw,2.4rem)", fontWeight: 700, color: "#1d1d1f", letterSpacing: "-0.025em" }}>
              See everything before you decide.
            </h2>
            <p className="mt-3 max-w-lg mx-auto" style={{ fontSize: "1rem", color: "rgba(0,0,0,0.5)" }}>
              Three ways to explore a flat from your phone — no site visit needed.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {buyerFeatures.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.tag}
                  className="rounded-2xl p-6"
                  style={{ background: "#f5f5f7" }}
                >
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 text-xl"
                    style={{ background: `${f.accent}14` }}
                  >
                    <Icon className="w-6 h-6" style={{ color: f.accent }} />
                  </div>
                  <p style={{ fontSize: "0.72rem", fontWeight: 700, color: f.accent, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>
                    {f.tag}
                  </p>
                  <h3 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#1d1d1f", letterSpacing: "-0.015em", lineHeight: 1.25, marginBottom: 8 }}>
                    {f.title}
                  </h3>
                  <p style={{ fontSize: "0.9rem", color: "rgba(0,0,0,0.55)", lineHeight: 1.55 }}>
                    {f.desc}
                  </p>
                </div>
              );
            })}
          </div>

          {demoProject && (
            <div className="flex justify-center mt-10">
              <Link
                href={`/projects/${demoProject.id}`}
                className="btn-primary"
                style={{ padding: "14px 32px", fontSize: "0.9375rem" }}
              >
                Try the 3D Explorer →
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ══ BUILDER SAAS ══════════════════════════════════════ */}
      <section style={{ background: "linear-gradient(180deg, #0a0e1a 0%, #060912 100%)", padding: "80px 20px" }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-10 items-center mb-12">
            <div>
              <p style={{ fontSize: "0.78rem", fontWeight: 700, color: "#1cc77f", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
                For Builders &amp; Developers
              </p>
              <h2 style={{ fontSize: "clamp(1.7rem,3.5vw,2.4rem)", fontWeight: 700, color: "#fff", letterSpacing: "-0.025em", lineHeight: 1.1 }}>
                Run your entire sales operation in one place.
              </h2>
            </div>
            <p style={{ fontSize: "1rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
              FlatBytes is a full real-estate SaaS — inventory, CRM, bookings, payments, broker portals
              and analytics. Everything you need to sell faster with less paperwork.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
            {builderModules.map((m) => {
              const Icon = m.icon;
              return (
                <div key={m.title} className="p-6" style={{ background: "rgba(255,255,255,0.022)" }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: "rgba(28,199,127,0.12)" }}>
                    <Icon className="w-5 h-5" style={{ color: "#1cc77f" }} />
                  </div>
                  <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#fff", marginBottom: 4 }}>{m.title}</h3>
                  <p style={{ fontSize: "0.84rem", color: "rgba(255,255,255,0.45)", lineHeight: 1.5 }}>{m.desc}</p>
                </div>
              );
            })}
          </div>

          <div className="flex justify-center mt-8">
            <Link
              href="/admin"
              className="flex items-center gap-2 px-6 py-3 rounded-full font-semibold"
              style={{ background: "#fff", color: "#0a0e1a", fontSize: "0.9375rem", textDecoration: "none" }}
            >
              Open Builder Dashboard →
            </Link>
          </div>
        </div>
      </section>

      {/* ══ CTA ═══════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden text-center"
        style={{ background: "radial-gradient(ellipse at center, #0a2a4a 0%, #050c1a 70%)", padding: "100px 20px" }}
      >
        <div className="relative max-w-xl mx-auto">
          <h2 style={{ fontSize: "clamp(1.8rem,4vw,2.6rem)", fontWeight: 700, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
            Ready to find your flat?
          </h2>
          <p className="mt-4" style={{ fontSize: "1rem", color: "rgba(255,255,255,0.55)" }}>
            Browse verified projects, explore in 3D, and book with confidence.
          </p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 mt-8">
            <Link href="/search" className="btn-primary text-center" style={{ padding: "14px 32px", fontSize: "0.9375rem" }}>
              Browse Available Flats
            </Link>
            <Link
              href="/projects"
              className="px-7 py-3.5 rounded-full font-medium text-center"
              style={{ background: "rgba(255,255,255,0.08)", color: "#fff", border: "1px solid rgba(255,255,255,0.18)", fontSize: "0.9375rem", textDecoration: "none" }}
            >
              All Projects
            </Link>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ════════════════════════════════════════════ */}
      <footer style={{ background: "#000", borderTop: "1px solid rgba(255,255,255,0.08)", padding: "28px 20px" }}>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.35)" }}>
            © 2026 FlatBytes by BrickBytes. All rights reserved.
          </p>
          <div className="flex gap-6">
            {["Privacy", "Terms", "Contact"].map((l) => (
              <a key={l} href="#" style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.35)", textDecoration: "none" }}>{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
