"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calculator, User, Grid3X3, Heart } from "lucide-react";
import { useState, useEffect } from "react";

export default function BottomNav() {
  const pathname = usePathname();
  const [wishCount, setWishCount] = useState(0);

  useEffect(() => {
    const sync = () => {
      try { setWishCount(JSON.parse(localStorage.getItem("flatbytes_wishlist") ?? "[]").length); } catch {}
    };
    sync();
    window.addEventListener("storage", sync);
    const interval = setInterval(sync, 2000);
    return () => { window.removeEventListener("storage", sync); clearInterval(interval); };
  }, []);

  const hide =
    pathname.startsWith("/projects/") ||
    pathname.startsWith("/admin") ||
    pathname === "/";

  if (hide) return null;

  const navItems = [
    { label: "Projects",  href: "/projects",      icon: Grid3X3,   badge: 0 },
    { label: "EMI Calc",  href: "/emi-calculator", icon: Calculator, badge: 0 },
    { label: "Shortlist", href: "/shortlist",       icon: Heart,     badge: wishCount },
    { label: "Sign In",   href: "/login",           icon: User,      badge: 0 },
  ];

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
      {navItems.map(({ label, href, icon: Icon, badge }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className="relative flex flex-col items-center gap-0.5 px-4 py-1 rounded-standard transition-colors"
            style={{ color: active ? "#0071e3" : "rgba(0,0,0,0.42)", minWidth: 60 }}
          >
            <div className="relative">
              <Icon className="w-5 h-5" />
              {badge > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
                  style={{ background: "#ff3b30", color: "#fff", fontSize: 9, fontWeight: 700 }}>
                  {badge > 9 ? "9+" : badge}
                </span>
              )}
            </div>
            <span style={{ fontSize: 10, fontWeight: active ? 600 : 400 }}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
