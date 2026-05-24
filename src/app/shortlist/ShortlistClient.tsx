"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Flat } from "@/lib/types";
import { FLAT_TYPE_LABELS } from "@/lib/types";
import { Heart, Building2, Share2, GitCompare, ChevronRight, Trash2, AlertTriangle } from "lucide-react";

const WISHLIST_KEY = "flatbytes_wishlist";

function getWishlistIds(): string[] {
  try { return JSON.parse(localStorage.getItem(WISHLIST_KEY) ?? "[]"); }
  catch { return []; }
}
function removeFromWishlist(id: string) {
  const list = getWishlistIds().filter((x) => x !== id);
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(list));
}

type FlatWithProject = Flat & { project_name: string; project_id: string; project_location: string };

const STATUS_COLOR: Record<string, string> = {
  available: "#34c759", sold: "#ff3b30", reserved: "#ff9500", held: "#af52de", discussion: "#007aff",
};
const STATUS_BG: Record<string, string> = {
  available: "rgba(52,199,89,0.1)", sold: "rgba(255,59,48,0.08)", reserved: "rgba(255,149,0,0.1)", held: "rgba(175,82,222,0.1)", discussion: "rgba(0,122,255,0.1)",
};
const STATUS_LABEL: Record<string, string> = {
  available: "Available", sold: "Sold", reserved: "Reserved", held: "Held", discussion: "In Discussion",
};

export default function ShortlistClient() {
  const [flats, setFlats] = useState<FlatWithProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [shareMsg, setShareMsg] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);

  const loadFlats = useCallback(async () => {
    const ids = getWishlistIds();
    if (ids.length === 0) { setFlats([]); setLoading(false); return; }
    const supabase = createClient();
    const { data } = await supabase
      .from("flats")
      .select("*, projects(id, name, location)")
      .in("id", ids);
    if (data) {
      setFlats(data.map((row: Record<string, unknown>) => {
        const proj = row.projects as { id: string; name: string; location: string } | null;
        return {
          ...row,
          project_name: proj?.name ?? "—",
          project_id: proj?.id ?? row.project_id,
          project_location: proj?.location ?? "",
        } as FlatWithProject;
      }));
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadFlats(); }, [loadFlats]);

  const remove = (id: string) => {
    removeFromWishlist(id);
    setFlats((prev) => prev.filter((f) => f.id !== id));
  };

  const handleShare = () => {
    const ids = flats.map((f) => f.id);
    const url = `${window.location.origin}/shortlist?ids=${ids.join(",")}`;
    navigator.clipboard.writeText(url).then(() => {
      setShareMsg(true);
      setTimeout(() => setShareMsg(false), 2500);
    });
  };

  const toggleCompare = (id: string) => {
    setCompareIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 3 ? [...prev, id] : prev
    );
  };

  // Load shared shortlist from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shared = params.get("ids");
    if (!shared) return;
    const ids = shared.split(",").filter(Boolean);
    const supabase = createClient();
    supabase
      .from("flats")
      .select("*, projects(id, name, location)")
      .in("id", ids)
      .then(({ data }) => {
        if (data) {
          setFlats(data.map((row: Record<string, unknown>) => {
            const proj = row.projects as { id: string; name: string; location: string } | null;
            return {
              ...row,
              project_name: proj?.name ?? "—",
              project_id: proj?.id ?? row.project_id,
              project_location: proj?.location ?? "",
            } as FlatWithProject;
          }));
          setLoading(false);
        }
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen" style={{ background: "#f5f5f7", paddingTop: 64 }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 pb-28 md:pb-12">

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 style={{ fontSize: "clamp(1.375rem,4vw,1.625rem)", fontWeight: 800, color: "#1d1d1f", letterSpacing: "-0.03em" }}>
                My Shortlist
              </h1>
              <p style={{ fontSize: "0.875rem", color: "rgba(0,0,0,0.45)", marginTop: 4 }}>
                {flats.length === 0 ? "No saved flats yet" : `${flats.length} flat${flats.length !== 1 ? "s" : ""} saved`}
              </p>
            </div>
            {flats.length > 0 && (
              <button
                onClick={handleShare}
                className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all"
                style={{ background: "#fff", color: "#1d1d1f", border: "1px solid rgba(0,0,0,0.12)", cursor: "pointer" }}
              >
                <Share2 className="w-4 h-4" />
                {shareMsg ? "Copied!" : "Share"}
              </button>
            )}
          </div>
          {compareIds.length >= 2 && (
            <div className="mt-3">
              <Link
                href={`/projects/${flats.find((f) => f.id === compareIds[0])?.project_id}?compare=${compareIds.join(",")}`}
                className="flex items-center justify-center gap-2 w-full sm:w-auto sm:inline-flex px-5 py-3 rounded-xl text-sm font-semibold"
                style={{ background: "#0071e3", color: "#fff", textDecoration: "none" }}
              >
                <GitCompare className="w-4 h-4" />
                Compare {compareIds.length} Flats
              </Link>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-8 h-8 rounded-full border-2 animate-spin"
              style={{ borderColor: "rgba(0,113,227,0.15)", borderTopColor: "#0071e3" }} />
            <p style={{ fontSize: "0.875rem", color: "rgba(0,0,0,0.4)" }}>Loading your shortlist…</p>
          </div>
        ) : flats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-5">
            <div style={{ width: 72, height: 72, borderRadius: 20, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
              <Heart className="w-8 h-8" style={{ color: "rgba(0,0,0,0.2)" }} />
            </div>
            <div className="text-center">
              <p style={{ fontSize: "1rem", fontWeight: 600, color: "rgba(0,0,0,0.45)" }}>No saved flats</p>
              <p style={{ fontSize: "0.875rem", color: "rgba(0,0,0,0.3)", marginTop: 4 }}>
                Tap the ♡ on any flat to save it here
              </p>
            </div>
            <Link href="/projects"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: "#0071e3", color: "#fff", textDecoration: "none" }}>
              Browse Projects <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {flats.map((flat) => {
              const sc = STATUS_COLOR[flat.status] ?? "#aaa";
              const sb = STATUS_BG[flat.status] ?? "rgba(0,0,0,0.05)";
              const inCompare = compareIds.includes(flat.id);
              const isSold = flat.status === "sold";
              return (
                <div
                  key={flat.id}
                  className="relative rounded-2xl overflow-hidden flex flex-col"
                  style={{
                    background: "#fff",
                    boxShadow: inCompare
                      ? "0 0 0 2px #0071e3, 0 8px 24px rgba(0,113,227,0.12)"
                      : "0 2px 8px rgba(0,0,0,0.06)",
                    border: "1px solid rgba(0,0,0,0.06)",
                  }}
                >
                  {/* Status banner */}
                  {isSold && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl"
                      style={{ background: "rgba(0,0,0,0.42)", backdropFilter: "blur(4px)" }}>
                      <div className="flex items-center gap-2 px-4 py-2 rounded-xl"
                        style={{ background: "rgba(255,59,48,0.9)", color: "#fff" }}>
                        <AlertTriangle className="w-4 h-4" />
                        <span style={{ fontWeight: 700, fontSize: 14 }}>This flat is now Sold</span>
                      </div>
                    </div>
                  )}

                  {/* Card header */}
                  <div className="px-4 pt-4 pb-3" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div style={{ fontSize: "1.125rem", fontWeight: 800, color: "#1d1d1f", letterSpacing: "-0.02em" }}>
                          Flat {flat.flat_number}
                        </div>
                        <div style={{ fontSize: "0.8125rem", color: "rgba(0,0,0,0.6)", marginTop: 1, fontWeight: 500 }}>{flat.project_name}</div>
                        {flat.project_location && (
                          <div style={{ fontSize: "0.75rem", color: "rgba(0,0,0,0.38)", marginTop: 1 }}>📍 {flat.project_location}</div>
                        )}
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold shrink-0 mt-1"
                        style={{ background: sb, color: sc, border: `1px solid ${sc}30` }}>
                        {STATUS_LABEL[flat.status] ?? flat.status}
                      </span>
                    </div>
                  </div>

                  {/* Specs */}
                  <div className="px-4 py-3 flex-1">
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: "Type",    value: FLAT_TYPE_LABELS[flat.flat_type] ?? flat.flat_type },
                        { label: "Floor",   value: `Floor ${flat.floor}` },
                        { label: "Area",    value: `${flat.carpet_area_sqft} sq.ft` },
                        { label: "Facing",  value: flat.facing ?? "—" },
                      ].map((s) => (
                        <div key={s.label} className="rounded-xl p-2.5" style={{ background: "#f5f5f7" }}>
                          <div style={{ fontSize: "0.6875rem", color: "rgba(0,0,0,0.4)", marginBottom: 2 }}>{s.label}</div>
                          <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#1d1d1f" }}>{s.value}</div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 rounded-xl px-3 py-2" style={{ background: "rgba(0,113,227,0.06)", border: "1px solid rgba(0,113,227,0.12)" }}>
                      <div style={{ fontSize: "0.6875rem", color: "rgba(0,0,0,0.4)" }}>Pricing</div>
                      <div style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#0071e3" }}>On Request</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="px-4 pb-4 flex gap-2">
                    <Link
                      href={`/projects/${flat.project_id}?flat=${flat.id}&types=${flat.flat_type}`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold"
                      style={{ background: "#0071e3", color: "#fff", textDecoration: "none" }}
                    >
                      <Building2 className="w-3.5 h-3.5" /> View in 3D
                    </Link>
                    {!isSold && (
                      <button
                        onClick={() => toggleCompare(flat.id)}
                        className="flex items-center justify-center px-3 py-2.5 rounded-xl transition-all"
                        title={inCompare ? "Remove from compare" : "Add to compare"}
                        style={inCompare
                          ? { background: "#0071e3", color: "#fff", border: "none", cursor: "pointer" }
                          : { background: "#f5f5f7", color: "rgba(0,0,0,0.56)", border: "none", cursor: "pointer" }}
                      >
                        <GitCompare className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => remove(flat.id)}
                      className="flex items-center justify-center px-3 py-2.5 rounded-xl"
                      title="Remove from shortlist"
                      style={{ background: "rgba(255,59,48,0.07)", color: "#d70015", border: "none", cursor: "pointer" }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
