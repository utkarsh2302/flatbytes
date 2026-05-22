"use client";

import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import type { Flat } from "@/lib/types";
import { X, Box, Camera } from "lucide-react";

const FlatInterior3D = dynamic(() => import("./FlatInterior3D"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center" style={{ background: "#1a2430" }}>
      <div className="w-12 h-12 rounded-full border-2 animate-spin" style={{ borderColor: "rgba(28,199,127,0.2)", borderTopColor: "#1cc77f" }} />
      <p className="text-sm mt-4" style={{ color: "rgba(255,255,255,0.7)" }}>Building 3D interior…</p>
    </div>
  ),
});

interface Props {
  flat: Flat;
  onClose: () => void;
}

export default function VirtualTourModal({ flat, onClose }: Props) {
  const has360 = Boolean(flat.view_360_url);
  const [tab, setTab] = useState<"3d" | "360">("3d");
  const [iframeError, setIframeError] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const iframeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartY = useRef(0);
  const isOffice = /office/.test(flat.flat_type);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const handleTouchStart = (e: React.TouchEvent) => { touchStartY.current = e.touches[0].clientY; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const delta = e.changedTouches[0].clientY - touchStartY.current;
    if (delta > 80) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: "#0d1117" }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header */}
      <div
        className="shrink-0 flex items-center justify-between gap-3 px-4 sm:px-5 py-3 pt-safe"
        style={{ background: "rgba(13,17,23,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(0,113,227,0.2)" }}>
            <Box className="w-4 h-4" style={{ color: "#2997ff" }} />
          </div>
          <div className="min-w-0">
            <div style={{ fontWeight: 600, fontSize: 14, color: "#fff" }} className="truncate">
              3D Walkthrough — {isOffice ? "Unit" : "Flat"} {flat.flat_number}
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 1 }}>
              {flat.flat_type.toUpperCase().replace("_", " ")} · Floor {flat.floor} · {flat.carpet_area_sqft} sq.ft
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {has360 && (
            <div className="flex items-center gap-0.5 rounded-xl p-0.5" style={{ background: "rgba(255,255,255,0.08)" }}>
              {([
                { id: "3d", label: "3D Model", icon: <Box className="w-3.5 h-3.5" /> },
                { id: "360", label: "360° Photo", icon: <Camera className="w-3.5 h-3.5" /> },
              ] as const).map((t) => (
                <button
                  key={t.id}
                  onClick={() => { setTab(t.id); setIframeError(false); setIframeLoaded(false); if (iframeTimerRef.current) clearTimeout(iframeTimerRef.current); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={tab === t.id ? { background: "#0071e3", color: "#fff" } : { color: "rgba(255,255,255,0.6)", background: "none", border: "none", cursor: "pointer" }}
                >
                  {t.icon}
                  <span className="hidden sm:inline">{t.label}</span>
                </button>
              ))}
            </div>
          )}
          <button
            onClick={onClose}
            aria-label="Close tour"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition-colors"
            style={{ color: "rgba(255,255,255,0.7)", background: "rgba(255,255,255,0.08)", border: "none", cursor: "pointer" }}
          >
            <X className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Close</span>
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 relative overflow-hidden">
        {has360 && tab === "360" ? (
          <div className="w-full h-full relative">
            {/* Loading state */}
            {!iframeLoaded && !iframeError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-10" style={{ background: "#1a2430" }}>
                <div className="w-12 h-12 rounded-full border-2 animate-spin" style={{ borderColor: "rgba(41,151,255,0.2)", borderTopColor: "#2997ff" }} />
                <p className="text-sm mt-4" style={{ color: "rgba(255,255,255,0.7)" }}>Loading 360° view…</p>
              </div>
            )}
            {/* Fallback */}
            {iframeError ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-10" style={{ background: "#1a2430" }}>
                <Camera className="w-12 h-12 mb-4" style={{ color: "rgba(255,255,255,0.3)" }} />
                <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>360° photo coming soon</p>
                <p className="text-xs mt-2" style={{ color: "rgba(255,255,255,0.4)" }}>Try the 3D walkthrough in the meantime</p>
                <button
                  onClick={() => setTab("3d")}
                  className="mt-5 px-5 py-2.5 rounded-xl text-xs font-semibold"
                  style={{ background: "#0071e3", color: "#fff", border: "none", cursor: "pointer" }}
                >
                  View 3D Interior
                </button>
              </div>
            ) : (
              <iframe
                src={flat.view_360_url!}
                className="w-full h-full"
                style={{ border: "none" }}
                allow="xr-spatial-tracking; gyroscope; accelerometer"
                allowFullScreen
                onLoad={() => { setIframeLoaded(true); if (iframeTimerRef.current) clearTimeout(iframeTimerRef.current); }}
                onError={() => setIframeError(true)}
                ref={(el) => {
                  if (el && !iframeLoaded) {
                    if (iframeTimerRef.current) clearTimeout(iframeTimerRef.current);
                    iframeTimerRef.current = setTimeout(() => setIframeError(true), 12000);
                  }
                }}
              />
            )}
          </div>
        ) : (
          <FlatInterior3D flat={flat} isOffice={isOffice} />
        )}
      </div>

      {/* Swipe hint on mobile */}
      <div className="shrink-0 flex justify-center py-2 md:hidden" style={{ background: "rgba(13,17,23,0.8)" }}>
        <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>Swipe down to close</p>
      </div>
    </div>
  );
}
