"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center section-light">
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center mb-8"
        style={{ background: "rgba(255,59,48,0.08)" }}
      >
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
          <circle cx="18" cy="18" r="14" stroke="#ff3b30" strokeWidth="2" opacity="0.3" />
          <path d="M18 10v10M18 24v2" stroke="#ff3b30" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </div>
      <h1
        className="mb-3"
        style={{ fontSize: "1.75rem", fontWeight: 700, color: "#1d1d1f", letterSpacing: "-0.02em" }}
      >
        Something went wrong
      </h1>
      <p className="text-body mb-10 max-w-sm" style={{ color: "rgba(0,0,0,0.56)" }}>
        An unexpected error occurred. Please try again or return to the homepage.
      </p>
      <div className="flex items-center gap-3">
        <button onClick={reset} className="btn-primary">
          Try again
        </button>
        <Link
          href="/"
          className="px-5 py-2.5 rounded-large text-sm font-medium"
          style={{ background: "#f5f5f7", color: "#1d1d1f" }}
        >
          Home
        </Link>
      </div>
    </div>
  );
}
