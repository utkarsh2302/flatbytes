import Link from "next/link";
import Navbar from "@/components/layout/Navbar";

export default function NotFound() {
  return (
    <div className="min-h-screen section-light">
      <Navbar />
      <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center mb-8"
          style={{ background: "rgba(0,113,227,0.08)" }}
        >
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <rect x="4" y="16" width="28" height="18" rx="3" fill="#0071e3" opacity="0.15" />
            <rect x="10" y="6" width="16" height="12" rx="2" fill="#0071e3" opacity="0.3" />
            <rect x="14" y="20" width="8" height="10" rx="1" fill="#0071e3" />
          </svg>
        </div>
        <h1
          className="mb-3"
          style={{ fontSize: "3rem", fontWeight: 700, color: "#1d1d1f", letterSpacing: "-0.03em", lineHeight: 1.1 }}
        >
          404
        </h1>
        <p className="text-title mb-2" style={{ color: "#1d1d1f" }}>
          Page not found
        </p>
        <p className="text-body mb-10 max-w-sm" style={{ color: "rgba(0,0,0,0.56)" }}>
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex items-center gap-3">
          <Link href="/projects" className="btn-primary">
            Browse Projects
          </Link>
          <Link
            href="/"
            className="px-5 py-2.5 rounded-large text-sm font-medium transition-colors"
            style={{ background: "#f5f5f7", color: "#1d1d1f" }}
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
