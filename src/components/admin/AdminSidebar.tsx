"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, BarChart3, Users, FileText, CreditCard,
  Briefcase, Boxes, ChevronLeft, CalendarCheck, MessageCircle, Sparkles,
} from "lucide-react";
import clsx from "clsx";

const navItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard, exact: true },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { label: "Inventory", href: "/admin/inventory", icon: Boxes },
  { label: "Leads & CRM", href: "/admin/leads", icon: Users },
  { label: "Site Visits", href: "/admin/visits", icon: CalendarCheck },
  { label: "Bookings", href: "/admin/bookings", icon: FileText },
  { label: "Payments", href: "/admin/payments", icon: CreditCard },
  { label: "Brokers", href: "/admin/brokers", icon: Briefcase },
  { label: "WhatsApp", href: "/admin/whatsapp", icon: MessageCircle },
  { label: "AI Insights", href: "/admin/ai-insights", icon: Sparkles },
];

function isActiveLink(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex flex-col w-56 shrink-0 border-r"
        style={{ background: "#fff", borderColor: "rgba(0,0,0,0.08)", minHeight: "calc(100vh - 48px)" }}
      >
        <div className="px-4 py-4 border-b" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ background: "#0071e3" }}>
              FB
            </div>
            <div>
              <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#1d1d1f" }}>FlatBytes</div>
              <div style={{ fontSize: "0.68rem", color: "rgba(0,0,0,0.42)" }}>Builder Console</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-3 space-y-0.5">
          {navItems.map(({ label, href, icon: Icon, exact }) => {
            const active = isActiveLink(pathname, href, exact);
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all"
                style={
                  active
                    ? { background: "rgba(0,113,227,0.08)", color: "#0071e3", fontWeight: 600 }
                    : { color: "rgba(0,0,0,0.62)" }
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 pb-6 pt-2 border-t mt-auto" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
          <Link
            href="/projects"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
            style={{ color: "rgba(0,0,0,0.48)" }}
          >
            <ChevronLeft className="w-4 h-4" />
            Back to site
          </Link>
        </div>
      </aside>

      {/* Mobile top nav */}
      <div
        className="lg:hidden fixed left-0 right-0 z-30 flex gap-1 px-3 py-2 overflow-x-auto"
        style={{ top: 48, background: "#fff", borderBottom: "1px solid rgba(0,0,0,0.08)", scrollbarWidth: "none" }}
      >
        {navItems.map(({ label, href, icon: Icon, exact }) => {
          const active = isActiveLink(pathname, href, exact);
          return (
            <Link
              key={href}
              href={href}
              className={clsx("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap shrink-0")}
              style={
                active
                  ? { background: "#1d1d1f", color: "#fff", fontWeight: 600 }
                  : { background: "#f0f0f2", color: "rgba(0,0,0,0.6)" }
              }
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </Link>
          );
        })}
      </div>
    </>
  );
}
