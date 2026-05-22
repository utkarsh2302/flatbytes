import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProjectWithData } from "@/lib/data";
import { getProjectStats } from "@/lib/types";
import ProjectExplorer from "./ProjectExplorer";
import Navbar from "@/components/layout/Navbar";

interface Props {
  params: { id: string };
}

export const revalidate = 60;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const project = await getProjectWithData(params.id);
  if (!project) return { title: "Project not found" };

  const stats = getProjectStats(project);
  const priceStr = project.price_starting
    ? `from ₹${(project.price_starting / 100000).toFixed(0)}L`
    : "";
  const description = `${project.name} in ${project.location} — ${stats.available} flats available ${priceStr}. Explore in 3D, view floor plans, track construction.`;

  return {
    title: `${project.name} — ${project.location}`,
    description,
    openGraph: {
      title: `${project.name} | FlatBytes`,
      description,
      type: "website",
      images: project.cover_image_url
        ? [{ url: project.cover_image_url, width: 1200, height: 630, alt: project.name }]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title: project.name,
      description,
      images: project.cover_image_url ? [project.cover_image_url] : [],
    },
  };
}

export default async function ProjectPage({ params }: Props) {
  const project = await getProjectWithData(params.id);
  if (!project) notFound();

  return (
    <div className="min-h-screen" style={{ background: "#020917" }}>
      <Navbar />
      <ProjectExplorer project={project} />
    </div>
  );
}
