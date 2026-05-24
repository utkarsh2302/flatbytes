"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Menu, X, LogOut, User, Heart } from "lucide-react";
import clsx from "clsx";
import { createClient } from "@/lib/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";

const links = [
  { label: "Projects", href: "/projects" },
  { label: "EMI Calc", href: "/emi-calculator" },
  { label: "Admin", href: "/admin" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const supabase = createClient();

  const [wishCount, setWishCount] = useState(0);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const sync = () => {
      try { setWishCount(JSON.parse(localStorage.getItem("flatbytes_wishlist") ?? "[]").length); } catch {}
    };
    sync();
    window.addEventListener("storage", sync);
    const interval = setInterval(sync, 2000);
    return () => { window.removeEventListener("storage", sync); clearInterval(interval); };
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const userInitial = user?.phone
    ? user.phone.slice(-2)
    : user?.email
    ? user.email[0].toUpperCase()
    : null;

  return (
    <header className="fixed top-0 inset-x-0 z-50 pt-safe">
      {/* Apple-style dark glass nav */}
      <nav
        className="nav-glass"
        style={{ height: 48, display: "flex", alignItems: "center" }}
      >
        <div className="w-full max-w-6xl mx-auto px-6 flex items-center justify-between h-full">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 text-white font-semibold tracking-tight"
            style={{ fontSize: 15, letterSpacing: "-0.02em" }}
          >
            {/* Simple flat icon */}
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="2" y="8" width="14" height="9" rx="1.5" fill="#0071e3" />
              <rect x="5" y="3" width="8" height="6" rx="1" fill="#0071e3" opacity="0.7" />
              <rect x="7" y="10" width="4" height="5" rx="0.5" fill="white" opacity="0.9" />
            </svg>
            Flat<span style={{ color: "#2997ff" }}>Bytes</span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {links.map((l) => {
              const active = pathname === l.href || pathname.startsWith(l.href + "/");
              return (
                <Link
                  key={l.label}
                  href={l.href}
                  className={clsx(
                    "px-3 py-1 rounded-standard text-micro font-normal transition-colors",
                    active
                      ? "text-white bg-white/10"
                      : "text-white/80 hover:text-white hover:bg-white/8"
                  )}
                  style={{ fontSize: 12, letterSpacing: "-0.008em" }}
                >
                  {l.label}
                </Link>
              );
            })}
          </div>

          {/* Shortlist heart icon (desktop) */}
          <Link href="/shortlist" className="hidden md:flex items-center relative p-1.5 rounded-standard transition-colors"
            style={{ color: "rgba(255,255,255,0.7)" }}
            title="My Shortlist">
            <Heart className="w-4 h-4" />
            {wishCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold"
                style={{ background: "#ff3b30", color: "#fff" }}>
                {wishCount > 9 ? "9+" : wishCount}
              </span>
            )}
          </Link>

          {/* CTA / Auth */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                <div
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-standard"
                  style={{ background: "rgba(255,255,255,0.1)", fontSize: 12, color: "rgba(255,255,255,0.8)" }}
                >
                  <User className="w-3 h-3" />
                  {user.phone ?? user.email ?? "Signed in"}
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-standard text-white/70 hover:text-white hover:bg-white/8 transition-colors"
                  style={{ fontSize: 12, background: "none", border: "none", cursor: "pointer" }}
                  title="Sign out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3 py-1.5 rounded-standard text-white/70 hover:text-white hover:bg-white/8 transition-colors"
                  style={{ fontSize: 12 }}
                >
                  Sign In
                </Link>
                <Link
                  href="/projects"
                  className="btn-primary"
                  style={{ padding: "6px 16px", fontSize: 13 }}
                >
                  Explore Flats
                </Link>
              </div>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden text-white/80 hover:text-white p-1"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden nav-glass border-t border-white/10 px-4 py-3 flex flex-col gap-1">
          <Link href="/shortlist" onClick={() => setOpen(false)}
            className="flex items-center justify-between px-3 py-2.5 rounded-standard text-sm text-white/70 hover:text-white hover:bg-white/8 transition-colors">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              My Shortlist
            </div>
            {wishCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                style={{ background: "#ff3b30", color: "#fff" }}>
                {wishCount}
              </span>
            )}
          </Link>
          {links.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              onClick={() => setOpen(false)}
              className={clsx(
                "px-3 py-2.5 rounded-standard text-sm transition-colors",
                pathname === l.href
                  ? "text-white bg-white/10"
                  : "text-white/70 hover:text-white hover:bg-white/8"
              )}
            >
              {l.label}
            </Link>
          ))}
          {user ? (
            <button
              onClick={() => { setOpen(false); handleSignOut(); }}
              className="flex items-center gap-2 px-3 py-2.5 rounded-standard text-sm text-white/70 hover:text-white hover:bg-white/8 transition-colors w-full text-left mt-1"
              style={{ background: "none", border: "none", cursor: "pointer" }}
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          ) : (
            <>
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="px-3 py-2.5 rounded-standard text-sm text-white/70 hover:text-white hover:bg-white/8 transition-colors mt-1"
              >
                Sign In
              </Link>
              <Link
                href="/projects"
                onClick={() => setOpen(false)}
                className="btn-primary mt-2 justify-center"
              >
                Explore Flats
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
