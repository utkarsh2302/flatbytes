"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Building2, Users, Calculator, Share2, ChevronLeft } from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/broker", icon: LayoutDashboard, exact: true },
  { label: "Live Inventory", href: "/broker/inventory", icon: Building2 },
  { label: "My Leads", href: "/broker/leads", icon: Users },
  { label: "Commission Calc", href: "/broker/calculator", icon: Calculator },
  { label: "Marketing Kit", href: "/broker/marketing", icon: Share2 },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

export default function BrokerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen" style={{ background: "#f5f5f7" }}>
      {/* Top bar */}
      <header
        className="fixed top-0 inset-x-0 z-50 flex items-center px-5 gap-4"
        style={{ height: 48, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div className="flex items-center gap-2.5 mr-auto">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ background: "#0071e3" }}>B</div>
          <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>
            Broker<span style={{ color: "#2997ff" }}>Portal</span>
          </span>
        </div>
        <nav className="hidden md:flex items-center gap-0.5">
          {navItems.map(({ label, href, icon: Icon, exact }) => {
            const active = isActive(pathname, href, exact);
            return (
              <Link key={href} href={href}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-standard text-xs transition-all"
                style={active ? { background: "rgba(255,255,255,0.12)", color: "#fff", fontWeight: 600 } : { color: "rgba(255,255,255,0.65)" }}
              >
                <Icon className="w-3.5 h-3.5" /> {label}
              </Link>
            );
          })}
        </nav>
        <Link href="/projects" style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.45)", display: "flex", alignItems: "center", gap: 4 }}>
          <ChevronLeft className="w-3.5 h-3.5" /> Site
        </Link>
      </header>

      {/* Mobile nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 flex items-center justify-around pb-safe" style={{ background: "rgba(255,255,255,0.96)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(0,0,0,0.08)", height: 60 }}>
        {navItems.map(({ label, href, icon: Icon, exact }) => {
          const active = isActive(pathname, href, exact);
          return (
            <Link key={href} href={href} className="flex flex-col items-center gap-0.5 px-3 py-1"
              style={{ color: active ? "#0071e3" : "rgba(0,0,0,0.42)", minWidth: 56 }}>
              <Icon className="w-5 h-5" />
              <span style={{ fontSize: 9, fontWeight: active ? 700 : 400 }}>{label}</span>
            </Link>
          );
        })}
      </nav>

      <main className="pt-[48px] pb-[72px] md:pb-8">
        {children}
      </main>
    </div>
  );
}
