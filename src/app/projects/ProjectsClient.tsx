"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Project } from "@/lib/types";
import { getProjectStats } from "@/lib/types";
import { MapPin, Search, X, Building2, Briefcase, Layers, TrendingUp, Check } from "lucide-react";
import { FLAT_TYPE_LABELS } from "@/lib/types";

interface Props {
  projects: Project[];
}

const TYPE_META = {
  residential: { label: "Residential", icon: Building2, color: "#0071e3", bg: "rgba(0,113,227,0.08)", border: "rgba(0,113,227,0.18)" },
  commercial: { label: "Commercial", icon: Briefcase, color: "#8b5cf6", bg: "rgba(139,92,246,0.08)", border: "rgba(139,92,246,0.2)" },
  mixed_use: { label: "Mixed Use", icon: Layers, color: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)" },
};

const STATUS_META = {
  active: { label: "Under Construction", color: "#d97706", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.25)" },
  completed: { label: "Ready to Move", color: "#059669", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.25)" },
  upcoming: { label: "Upcoming", color: "#6b7280", bg: "rgba(107,114,128,0.1)", border: "rgba(107,114,128,0.2)" },
};

function ProjectCard({ project }: { project: Project }) {
  const stats = getProjectStats(project);
  const typeMeta = TYPE_META[project.project_type] ?? TYPE_META.residential;
  const statusMeta = STATUS_META[project.status] ?? STATUS_META.upcoming;
  const TypeIcon = typeMeta.icon;

  const availableBhkTypes = Array.from(
    new Set(
      project.towers.flatMap(t => t.flats)
        .filter(f => f.status === "available")
        .map(f => f.flat_type)
    )
  ).slice(0, 4);

  return (
    <Link
      href={`/projects/${project.id}`}
      className="group block rounded-2xl overflow-hidden transition-all duration-300"
      style={{
        background: "#ffffff",
        boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.04)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(0,0,0,0.1), 0 16px 40px rgba(0,0,0,0.1)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 3px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.04)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
      }}
    >
      {/* Cover image */}
      <div className="relative w-full overflow-hidden" style={{ height: 200, background: "#f0f0f2" }}>
        {project.cover_image_url ? (
          <Image
            src={project.cover_image_url}
            alt={project.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              background: project.project_type === "commercial"
                ? "linear-gradient(135deg, #1c2028 0%, #2a3444 100%)"
                : "linear-gradient(135deg, #e8e2d8 0%, #d4cec4 100%)",
            }}
          >
            <TypeIcon
              className="w-12 h-12 opacity-20"
              style={{ color: project.project_type === "commercial" ? "#fff" : "#555" }}
            />
          </div>
        )}

        {/* Gradient overlay */}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)" }}
        />

        {/* Type badge */}
        <div
          className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full"
          style={{
            background: "rgba(0,0,0,0.52)",
            backdropFilter: "blur(10px)",
            color: "#fff",
            fontSize: "0.7rem",
            fontWeight: 600,
            letterSpacing: "0.03em",
          }}
        >
          <TypeIcon className="w-3 h-3" />
          {typeMeta.label}
        </div>

        {/* Status badge */}
        <div
          className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full"
          style={{
            background: project.status === "completed" ? "#059669" : statusMeta.bg,
            border: `1px solid ${statusMeta.border}`,
            backdropFilter: "blur(10px)",
            color: project.status === "completed" ? "#fff" : statusMeta.color,
            fontSize: "0.68rem",
            fontWeight: 600,
          }}
        >
          {project.status === "completed" && <Check className="w-2.5 h-2.5" />}
          {statusMeta.label}
        </div>

        {/* Name overlay on image */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3
            style={{
              fontSize: "1.0625rem",
              fontWeight: 700,
              color: "#fff",
              letterSpacing: "-0.01em",
              lineHeight: 1.25,
              textShadow: "0 1px 4px rgba(0,0,0,0.4)",
            }}
          >
            {project.name}
          </h3>
          <div className="flex items-center gap-1 mt-0.5" style={{ color: "rgba(255,255,255,0.72)", fontSize: "0.78rem" }}>
            <MapPin className="w-3 h-3 shrink-0" />
            {project.city ?? project.location}
          </div>
        </div>
      </div>

      {/* Card body */}
      <div className="p-4">

        {/* Construction progress */}
        {project.construction_percentage != null && project.status !== "completed" && (
          <div className="mb-3">
            <div className="flex justify-between mb-1.5" style={{ fontSize: "0.7rem", color: "rgba(0,0,0,0.45)" }}>
              <span>{project.construction_stage ?? "In progress"}</span>
              <span style={{ fontWeight: 600, color: "#d97706" }}>{project.construction_percentage}%</span>
            </div>
            <div className="relative h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.07)" }}>
              <div
                className="absolute left-0 top-0 h-full rounded-full"
                style={{
                  width: `${project.construction_percentage}%`,
                  background: "linear-gradient(90deg, #f59e0b, #d97706)",
                  transition: "width 0.8s ease",
                }}
              />
            </div>
          </div>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-3 mb-3">
          {[
            { value: stats.available, label: "Available", color: "#059669" },
            { value: stats.sold, label: "Sold", color: "#ef4444" },
            { value: stats.reserved, label: "Reserved", color: "#f59e0b" },
          ].map((s) => (
            <div key={s.label} className="flex-1 text-center py-2 rounded-xl" style={{ background: "#f7f7f8" }}>
              <div style={{ fontSize: "1.1rem", fontWeight: 700, color: s.value > 0 ? s.color : "rgba(0,0,0,0.25)", lineHeight: 1 }}>
                {s.value}
              </div>
              <div style={{ fontSize: "0.63rem", color: "rgba(0,0,0,0.4)", marginTop: 2, fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* BHK type chips */}
        {availableBhkTypes.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {availableBhkTypes.map(type => (
              <span key={type} className="px-2 py-0.5 rounded-full text-xs font-semibold"
                style={{ background: "rgba(0,113,227,0.07)", color: "#0071e3", border: "1px solid rgba(0,113,227,0.15)" }}>
                {FLAT_TYPE_LABELS[type] ?? type}
              </span>
            ))}
          </div>
        )}

        {/* Price + Possession + CTA */}
        <div className="flex items-center justify-between">
          <div>
            <div style={{ fontSize: "0.65rem", color: "rgba(0,0,0,0.4)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Pricing
            </div>
            <div style={{ fontSize: "1.0625rem", fontWeight: 700, color: "#0071e3", letterSpacing: "-0.01em" }}>On Request</div>
            {project.possession_date && (
              <div style={{ fontSize: "0.7rem", color: "rgba(0,0,0,0.38)", marginTop: 2 }}>
                {new Date(project.possession_date) <= new Date()
                  ? "Ready to Move"
                  : `Possession: ${new Date(project.possession_date).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}`}
              </div>
            )}
          </div>

          <div
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: "rgba(0,113,227,0.08)",
              color: "#0071e3",
              fontSize: "0.8125rem",
            }}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Explore 3D
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function ProjectsClient({ projects }: Props) {
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");

  const cities = useMemo(() => {
    const set = new Set(projects.map((p) => p.city ?? p.location.split(",")[0].trim()));
    return ["All", ...Array.from(set)];
  }, [projects]);

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      const matchCity = city === "All" || (p.city ?? p.location).includes(city);
      const matchType = typeFilter === "All" || p.project_type === typeFilter;
      const q = query.toLowerCase();
      const matchQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.city ?? p.location).toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q);
      return matchCity && matchType && matchQuery;
    });
  }, [projects, query, city, typeFilter]);

  const residentialCount = projects.filter((p) => p.project_type === "residential").length;
  const commercialCount = projects.filter((p) => p.project_type === "commercial").length;

  return (
    <>
      {/* Filter bar */}
      <div
        className="mb-8 rounded-2xl overflow-hidden"
        style={{ background: "#ffffff", boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.04)" }}
      >
        {/* Search row */}
        <div className="p-3 pb-2">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "rgba(0,0,0,0.38)" }} />
            <input
              type="text"
              placeholder="Search projects…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-9 rounded-xl outline-none text-sm"
              style={{
                height: 44,
                background: "#f7f7f8",
                border: "1.5px solid rgba(0,0,0,0.06)",
                color: "#1d1d1f",
              }}
            />
            {query ? (
              <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "rgba(0,0,0,0.35)" }}>
                <X className="w-4 h-4" />
              </button>
            ) : null}
          </div>
        </div>

        {/* Filter chips row — horizontal scroll on mobile */}
        <div className="flex items-center gap-2 px-3 pb-3 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {[
            { id: "All", label: "All" },
            { id: "residential", label: `Residential` },
            { id: "commercial", label: `Commercial` },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTypeFilter(t.id)}
              className="shrink-0 px-3.5 rounded-full text-xs font-semibold transition-all"
              style={{
                height: 34,
                ...(typeFilter === t.id
                  ? { background: "#1d1d1f", color: "#fff" }
                  : { background: "#f7f7f8", color: "rgba(0,0,0,0.56)" }),
              }}
            >
              {t.label}
            </button>
          ))}

          {cities.length > 2 && cities.slice(0, 4).map((c) => (
            <button
              key={c}
              onClick={() => setCity(c)}
              className="shrink-0 px-3.5 rounded-full text-xs font-semibold transition-all"
              style={{
                height: 34,
                ...(city === c
                  ? { background: "#0071e3", color: "#fff" }
                  : { background: "#f7f7f8", color: "rgba(0,0,0,0.56)" }),
              }}
            >
              {c}
            </button>
          ))}

          <span className="ml-auto shrink-0 text-xs" style={{ color: "rgba(0,0,0,0.38)", whiteSpace: "nowrap" }}>
            {filtered.length} of {projects.length}
          </span>
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-24" style={{ color: "rgba(0,0,0,0.35)" }}>
          <Search className="w-10 h-10 mx-auto mb-4 opacity-25" />
          <p className="text-base font-medium mb-1" style={{ color: "rgba(0,0,0,0.45)" }}>No projects match</p>
          <p className="text-sm mb-4" style={{ color: "rgba(0,0,0,0.32)" }}>Try a different search or filter</p>
          <button
            onClick={() => { setQuery(""); setCity("All"); setTypeFilter("All"); }}
            className="text-sm px-4 py-2 rounded-xl"
            style={{ background: "#f7f7f8", color: "#0071e3", fontWeight: 600 }}
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </>
  );
}
