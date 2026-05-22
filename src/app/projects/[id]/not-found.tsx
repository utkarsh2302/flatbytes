import Link from "next/link";
import Navbar from "@/components/layout/Navbar";

export default function ProjectNotFound() {
  return (
    <div className="min-h-screen section-light">
      <Navbar />
      <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center mb-8"
          style={{ background: "rgba(0,113,227,0.08)" }}
        >
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <rect x="4" y="16" width="28" height="18" rx="3" fill="#0071e3" opacity="0.2" />
            <rect x="10" y="6" width="16" height="12" rx="2" fill="#0071e3" opacity="0.4" />
            <rect x="14" y="20" width="8" height="10" rx="1" fill="#0071e3" />
          </svg>
        </div>
        <h1
          className="mb-2"
          style={{ fontSize: "1.75rem", fontWeight: 700, color: "#1d1d1f", letterSpacing: "-0.02em" }}
        >
          Project not found
        </h1>
        <p className="text-body mb-10 max-w-sm" style={{ color: "rgba(0,0,0,0.56)" }}>
          This project may have been removed or the link is incorrect.
        </p>
        <Link href="/projects" className="btn-primary">
          View all projects
        </Link>
      </div>
    </div>
  );
}
