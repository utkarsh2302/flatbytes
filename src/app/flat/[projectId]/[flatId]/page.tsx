import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getProjectWithData } from "@/lib/data";
import { FLAT_TYPE_LABELS } from "@/lib/types";
import { analyzeLivingExperience } from "@/lib/living-experience";
import { MapPin, Shield, Compass, Layers, Maximize2, ChevronLeft } from "lucide-react";

interface Props {
  params: { projectId: string; flatId: string };
}

const STATUS_COLOR: Record<string, string> = {
  available: "#34c759", sold: "#ff3b30", reserved: "#ff9500", held: "#af52de", discussion: "#007aff",
};
const STATUS_LABEL: Record<string, string> = {
  available: "Available", sold: "Sold", reserved: "Reserved", held: "Held", discussion: "In Discussion",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const project = await getProjectWithData(params.projectId);
  const flat = project?.towers.flatMap((t) => t.flats).find((f) => f.id === params.flatId);
  if (!flat || !project) return { title: "Flat — FlatBytes" };
  return {
    title: `Flat ${flat.flat_number} · ${FLAT_TYPE_LABELS[flat.flat_type]} · ${project.name} — FlatBytes`,
    description: `${FLAT_TYPE_LABELS[flat.flat_type]}, Floor ${flat.floor}, ${flat.carpet_area_sqft} sq.ft, ${flat.facing ?? ""} facing at ${project.name}, ${project.location}.`,
    openGraph: {
      title: `Flat ${flat.flat_number} at ${project.name}`,
      description: `${FLAT_TYPE_LABELS[flat.flat_type]} · ${flat.carpet_area_sqft} sq.ft · Floor ${flat.floor}`,
      siteName: "FlatBytes",
    },
  };
}

export default async function FlatSharePage({ params }: Props) {
  const project = await getProjectWithData(params.projectId);
  const flat = project?.towers.flatMap((t) => t.flats).find((f) => f.id === params.flatId);
  if (!flat || !project) notFound();

  const lifeData = analyzeLivingExperience(flat.facing ?? null, flat.floor, flat.flat_type, flat.carpet_area_sqft ?? 0);
  const vastuScore = lifeData.scores.vastu;
  const vastuLabel = vastuScore >= 8 ? "Excellent Vastu" : vastuScore >= 6 ? "Good Vastu" : vastuScore >= 4 ? "Moderate Vastu" : "Check Vastu";
  const vastuColor = vastuScore >= 8 ? "#1a7f4a" : vastuScore >= 6 ? "#0055b3" : vastuScore >= 4 ? "#c25000" : "#d70015";
  const sunLabel   = ["north-east","east"].includes(lifeData.facing) ? "🌅 Morning Sun"
    : ["south-east","south"].includes(lifeData.facing)               ? "☀ Afternoon Sun"
    : ["south-west","west","north-west"].includes(lifeData.facing)   ? "🌇 Evening Sun"
    : "🌤 Indirect Light";
  const sc = STATUS_COLOR[flat.status] ?? "#aaa";

  const waMessage = encodeURIComponent(
    `Hi, I'm interested in Flat ${flat.flat_number} (${FLAT_TYPE_LABELS[flat.flat_type]}, Floor ${flat.floor}) at ${project.name}. Please share more details.`
  );

  return (
    <div style={{ background: "#f5f5f7", minHeight: "100vh", paddingTop: 64 }}>
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Back */}
        <Link href={`/projects/${project.id}`}
          className="inline-flex items-center gap-1.5 mb-6 text-sm font-medium"
          style={{ color: "rgba(0,0,0,0.45)", textDecoration: "none" }}>
          <ChevronLeft className="w-4 h-4" /> Back to {project.name}
        </Link>

        {/* Hero card */}
        <div className="rounded-3xl overflow-hidden" style={{ background: "#fff", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>

          {/* Header gradient */}
          <div className="px-6 pt-6 pb-5" style={{ background: "linear-gradient(135deg,#0a1628 0%,#1a3a5c 100%)" }}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <div style={{ fontSize: "2rem", fontWeight: 900, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1 }}>
                  Flat {flat.flat_number}
                </div>
                <div style={{ fontSize: "0.9375rem", color: "rgba(255,255,255,0.6)", marginTop: 6 }}>
                  {project.name}
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold mt-1"
                style={{ background: `${sc}22`, color: sc, border: `1px solid ${sc}44` }}>
                {STATUS_LABEL[flat.status] ?? flat.status}
              </span>
            </div>

            {/* Key specs inline */}
            <div className="flex flex-wrap gap-3">
              {[
                { icon: <Layers className="w-3.5 h-3.5" />, v: FLAT_TYPE_LABELS[flat.flat_type] },
                { icon: <Maximize2 className="w-3.5 h-3.5" />, v: `${flat.carpet_area_sqft} sq.ft` },
                { icon: <Layers className="w-3.5 h-3.5" />, v: `Floor ${flat.floor}` },
                ...(flat.facing ? [{ icon: <Compass className="w-3.5 h-3.5" />, v: flat.facing }] : []),
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-1.5"
                  style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.75)", fontWeight: 500 }}>
                  {s.icon} {s.v}
                </div>
              ))}
            </div>
          </div>

          {/* Project info */}
          <div className="px-6 py-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
            <div className="flex items-center gap-2 flex-wrap">
              <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: "rgba(0,0,0,0.4)" }} />
              <span style={{ fontSize: "0.875rem", color: "rgba(0,0,0,0.6)" }}>{project.location}</span>
              {project.rera_number && (
                <>
                  <span style={{ color: "rgba(0,0,0,0.2)" }}>·</span>
                  <Shield className="w-3.5 h-3.5 shrink-0" style={{ color: "#34c759" }} />
                  <span style={{ fontSize: "0.8125rem", color: "#1a7f4a", fontWeight: 600 }}>RERA {project.rera_number}</span>
                </>
              )}
            </div>
          </div>

          {/* Living Intelligence */}
          <div className="px-6 py-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)", background: "linear-gradient(135deg,#f0f7ff 0%,#f5fff8 100%)" }}>
            <div style={{ fontSize: "0.6875rem", fontWeight: 700, color: "rgba(0,0,0,0.38)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
              Living Intelligence
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: "rgba(0,113,227,0.09)", color: "#0055b3" }}>🧭 {lifeData.facingLabel}</span>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: vastuColor + "15", color: vastuColor }}>✨ {vastuLabel}</span>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: "rgba(245,158,11,0.08)", color: "#b45309" }}>{sunLabel}</span>
            </div>
            <p style={{ fontSize: "0.8125rem", color: "rgba(0,0,0,0.5)", marginTop: 8, lineHeight: 1.5 }}>{lifeData.vastuSummary}</p>
          </div>

          {/* Pricing */}
          <div className="px-6 py-4 flex items-center justify-between gap-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)", background: "rgba(0,113,227,0.03)" }}>
            <div>
              <div style={{ fontSize: "0.6875rem", fontWeight: 700, color: "rgba(0,0,0,0.38)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
                Pricing
              </div>
              <div style={{ fontSize: "1.125rem", fontWeight: 700, color: "#0071e3" }}>On Request</div>
              <div style={{ fontSize: "0.75rem", color: "rgba(0,0,0,0.4)", marginTop: 2 }}>WhatsApp us for a personalised cost sheet</div>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0" style={{ background: "rgba(0,113,227,0.1)", color: "#0071e3", border: "1px solid rgba(0,113,227,0.2)" }}>
              Get Details →
            </div>
          </div>

          {/* CTAs */}
          <div className="px-6 pb-6 pt-4 flex flex-col gap-2.5">
            <a
              href={`https://wa.me/?text=${waMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 rounded-xl flex items-center justify-center gap-2.5"
              style={{
                background: "linear-gradient(135deg,#25d366 0%,#128c4a 100%)",
                color: "#fff", textDecoration: "none", fontSize: "1rem", fontWeight: 700,
                boxShadow: "0 4px 16px rgba(37,211,102,0.3)",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Chat on WhatsApp
            </a>
            <Link
              href={`/projects/${project.id}`}
              className="w-full py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold"
              style={{ background: "#f5f5f7", color: "#1d1d1f", textDecoration: "none", border: "1.5px solid rgba(0,0,0,0.1)" }}
            >
              Explore Full Project in 3D
            </Link>
          </div>
        </div>

        {/* FlatBytes footer */}
        <div className="mt-6 text-center">
          <p style={{ fontSize: "0.8125rem", color: "rgba(0,0,0,0.35)" }}>
            Shared via <Link href="/" style={{ color: "#0071e3", textDecoration: "none", fontWeight: 600 }}>FlatBytes</Link> · India&apos;s 3D flat explorer
          </p>
        </div>
      </div>
    </div>
  );
}
