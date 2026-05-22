"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Calculator, User, Grid3X3 } from "lucide-react";

const navItems = [
  { label: "Projects", href: "/projects", icon: Grid3X3 },
  { label: "EMI Calc", href: "/emi-calculator", icon: Calculator },
  { label: "Admin", href: "/admin", icon: Building2 },
  { label: "Sign In", href: "/login", icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();
  const hide =
    pathname.startsWith("/projects/") ||
    pathname.startsWith("/admin") ||
    pathname === "/";

  if (hide) return null;

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-50 flex items-center justify-around px-2 pb-safe"
      style={{
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(0,0,0,0.08)",
        height: 60,
      }}
    >
      {navItems.map(({ label, href, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-0.5 px-4 py-1 rounded-standard transition-colors"
            style={{ color: active ? "#0071e3" : "rgba(0,0,0,0.42)", minWidth: 60 }}
          >
            <Icon className="w-5 h-5" />
            <span style={{ fontSize: 10, fontWeight: active ? 600 : 400 }}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
