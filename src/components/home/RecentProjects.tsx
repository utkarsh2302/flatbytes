"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Clock, ArrowRight } from "lucide-react";

interface RecentEntry {
  id: string;
  name: string;
  location: string;
  cover: string | null;
  available: number;
  ts: number;
}

export default function RecentProjects() {
  const [items, setItems] = useState<RecentEntry[]>([]);

  useEffect(() => {
    try {
      const stored: RecentEntry[] = JSON.parse(localStorage.getItem("flatbytes_recent_projects") ?? "[]");
      setItems(stored.slice(0, 4));
    } catch {}
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="max-w-7xl mx-auto px-5 pb-10">
      <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
        <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" style={{ color: "rgba(255,255,255,0.5)" }} />
            <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "rgba(255,255,255,0.75)", letterSpacing: "-0.01em" }}>
              Continue browsing
            </span>
          </div>
          <Link href="/projects" className="flex items-center gap-1 text-xs font-medium"
            style={{ color: "rgba(255,255,255,0.4)", textDecoration: "none" }}>
            See all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="flex gap-3 p-3 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/projects/${item.id}`}
              className="shrink-0 flex items-center gap-3 rounded-xl p-2.5 transition-all"
              style={{
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.1)",
                minWidth: 180, maxWidth: 220,
                textDecoration: "none",
              }}
            >
              {item.cover ? (
                <div className="relative shrink-0 rounded-lg overflow-hidden" style={{ width: 44, height: 44 }}>
                  <Image src={item.cover} alt={item.name} fill className="object-cover" sizes="44px" />
                </div>
              ) : (
                <div className="shrink-0 rounded-lg flex items-center justify-center" style={{ width: 44, height: 44, background: "rgba(0,113,227,0.2)" }}>
                  <span style={{ fontSize: "1.25rem" }}>🏢</span>
                </div>
              )}
              <div className="min-w-0">
                <div className="truncate" style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#fff", letterSpacing: "-0.01em" }}>
                  {item.name}
                </div>
                <div className="truncate" style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.45)", marginTop: 1 }}>
                  {item.location}
                </div>
                {item.available > 0 && (
                  <div style={{ fontSize: "0.68rem", color: "#4ade80", fontWeight: 600, marginTop: 2 }}>
                    {item.available} available
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
