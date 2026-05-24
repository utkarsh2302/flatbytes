"use client";

import { useState } from "react";
import Image from "next/image";
import type { ConstructionMilestone } from "@/lib/types";
import { CheckCircle, Clock, Circle, X, ChevronLeft, ChevronRight, Camera } from "lucide-react";

interface Props {
  milestones: ConstructionMilestone[];
  overallPercentage: number;
}

export default function ConstructionTracker({ milestones, overallPercentage }: Props) {
  const [lightbox, setLightbox] = useState<{ urls: string[]; idx: number } | null>(null);

  return (
    <>
    <div className="apple-card p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-tile" style={{ color: "#1d1d1f" }}>Construction Progress</h3>
        <span style={{ fontSize: "1.5rem", fontWeight: 600, color: "#0071e3" }}>{overallPercentage}%</span>
      </div>

      {/* Overall bar */}
      <div
        className="h-1.5 rounded-pill overflow-hidden mb-7"
        style={{ background: "rgba(0,0,0,0.08)" }}
      >
        <div
          className="h-full rounded-pill"
          style={{ width: `${overallPercentage}%`, background: "#0071e3", transition: "width 0.7s ease" }}
        />
      </div>

      {/* Milestones */}
      <div className="relative">
        <div
          className="absolute left-[9px] top-0 bottom-0 w-px"
          style={{ background: "rgba(0,0,0,0.1)" }}
        />

        <div className="space-y-5">
          {milestones.map((m) => (
            <div key={m.id} className="relative flex items-start gap-4 pl-8">
              {/* Icon */}
              <div className="absolute left-0 top-0">
                {m.is_completed ? (
                  <CheckCircle className="w-5 h-5" style={{ color: "#34c759" }} />
                ) : m.completed_date == null && m.target_date ? (
                  <Clock className="w-5 h-5" style={{ color: "#0071e3" }} />
                ) : (
                  <Circle className="w-5 h-5" style={{ color: "rgba(0,0,0,0.2)" }} />
                )}
              </div>

              <div className="flex-1">
                <span
                  className="text-caption"
                  style={{
                    fontWeight: 500,
                    color: m.is_completed
                      ? "#1a7f4a"
                      : m.target_date
                      ? "#0071e3"
                      : "rgba(0,0,0,0.38)",
                  }}
                >
                  {m.title}
                </span>

                {m.description && (
                  <div className="text-micro mt-0.5" style={{ color: "rgba(0,0,0,0.48)" }}>
                    {m.description}
                  </div>
                )}

                <div className="text-micro mt-0.5" style={{ color: "rgba(0,0,0,0.4)" }}>
                  {m.is_completed && m.completed_date
                    ? `Completed ${formatDate(m.completed_date)}`
                    : m.target_date
                    ? `Target: ${formatDate(m.target_date)}`
                    : "—"}
                </div>

                {/* Photo thumbnails */}
                {m.photo_urls && m.photo_urls.length > 0 && (
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {m.photo_urls.slice(0, 4).map((url, i) => (
                      <button
                        key={i}
                        onClick={() => setLightbox({ urls: m.photo_urls!, idx: i })}
                        className="relative rounded-lg overflow-hidden shrink-0"
                        style={{ width: 52, height: 44 }}
                        aria-label={`View photo ${i + 1}`}
                      >
                        <Image src={url} alt={`${m.title} photo ${i + 1}`} fill className="object-cover" sizes="52px" />
                        {i === 3 && m.photo_urls!.length > 4 && (
                          <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.55)" }}>
                            <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#fff" }}>+{m.photo_urls!.length - 4}</span>
                          </div>
                        )}
                      </button>
                    ))}
                    <button
                      onClick={() => setLightbox({ urls: m.photo_urls!, idx: 0 })}
                      className="flex items-center gap-1 px-2 rounded-lg"
                      style={{ background: "rgba(0,113,227,0.07)", color: "#0071e3", fontSize: "0.65rem", fontWeight: 600, height: 44 }}
                    >
                      <Camera className="w-3 h-3" />
                      {m.photo_urls.length}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>

      {/* Photo lightbox */}

      {lightbox && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.9)" }}
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 p-2 rounded-full"
            style={{ background: "rgba(255,255,255,0.15)" }}
            aria-label="Close"
          >
            <X className="w-5 h-5" style={{ color: "#fff" }} />
          </button>

          {lightbox.urls.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setLightbox(l => l && ({ ...l, idx: (l.idx - 1 + l.urls.length) % l.urls.length })); }}
                className="absolute left-3 p-2.5 rounded-full"
                style={{ background: "rgba(255,255,255,0.15)" }}
              >
                <ChevronLeft className="w-5 h-5" style={{ color: "#fff" }} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setLightbox(l => l && ({ ...l, idx: (l.idx + 1) % l.urls.length })); }}
                className="absolute right-3 p-2.5 rounded-full"
                style={{ background: "rgba(255,255,255,0.15)" }}
              >
                <ChevronRight className="w-5 h-5" style={{ color: "#fff" }} />
              </button>
            </>
          )}

          <div
            className="relative w-full max-w-2xl mx-4 rounded-2xl overflow-hidden"
            style={{ aspectRatio: "16/10", maxHeight: "80vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={lightbox.urls[lightbox.idx]}
              alt={`Construction photo ${lightbox.idx + 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 672px"
            />
            <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full" style={{ background: "rgba(0,0,0,0.5)" }}>
              <span style={{ fontSize: "0.75rem", color: "#fff", fontWeight: 600 }}>{lightbox.idx + 1} / {lightbox.urls.length}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}
