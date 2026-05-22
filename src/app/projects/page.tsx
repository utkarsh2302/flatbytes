import Navbar from "@/components/layout/Navbar";
import { getProjects } from "@/lib/data";
import ProjectsClient from "./ProjectsClient";

export const revalidate = 60;

export default async function ProjectsPage() {
  const projects = await getProjects();

  const residentialCount = projects.filter((p) => p.project_type === "residential").length;
  const commercialCount = projects.filter((p) => p.project_type === "commercial").length;

  return (
    <div className="min-h-screen" style={{ background: "#f5f5f7" }}>
      <Navbar />
      <div className="pt-20 pb-24 px-5 sm:px-8">
        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <div className="pt-10 pb-8">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <p className="text-xs font-semibold mb-2 tracking-widest uppercase" style={{ color: "#0071e3" }}>
                  Digital Showroom
                </p>
                <h1 style={{ fontSize: "clamp(1.75rem,4vw,2.5rem)", fontWeight: 700, color: "#1d1d1f", letterSpacing: "-0.025em", lineHeight: 1.1 }}>
                  Explore Projects
                </h1>
                <p className="mt-2 text-sm" style={{ color: "rgba(0,0,0,0.52)" }}>
                  {projects.length} properties · {residentialCount} residential · {commercialCount} commercial
                </p>
              </div>
              <div className="flex gap-2">
                {[
                  { label: "Interactive 3D", icon: "🏗️" },
                  { label: "Live Inventory", icon: "📊" },
                  { label: "Floor Plans", icon: "📐" },
                ].map((f) => (
                  <div
                    key={f.label}
                    className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium"
                    style={{ background: "#fff", color: "rgba(0,0,0,0.56)", boxShadow: "0 1px 3px rgba(0,0,0,0.07)" }}
                  >
                    <span>{f.icon}</span>
                    {f.label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <ProjectsClient projects={projects} />
        </div>
      </div>
    </div>
  );
}
