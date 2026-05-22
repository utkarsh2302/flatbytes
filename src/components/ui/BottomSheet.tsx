"use client";

import { useEffect, useRef, type ReactNode } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  maxHeight?: string;
}

export default function BottomSheet({ open, onClose, title, children, maxHeight = "90vh" }: Props) {
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  // Swipe-down to close
  const touchStartY = useRef(0);
  const handleTouchStart = (e: React.TouchEvent) => { touchStartY.current = e.touches[0].clientY; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const delta = e.changedTouches[0].clientY - touchStartY.current;
    if (delta > 60) onClose();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={sheetRef}
        className="absolute bottom-0 inset-x-0 flex flex-col rounded-t-2xl pb-safe"
        style={{
          background: "#fff",
          maxHeight,
          boxShadow: "0 -8px 40px rgba(0,0,0,0.2)",
          animation: "slideUp 0.3s cubic-bezier(0.32, 0.72, 0, 1) both",
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: "rgba(0,0,0,0.2)" }} />
        </div>

        {/* Title */}
        {title && (
          <div className="px-5 pt-1 pb-3 shrink-0" style={{ borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
            <h2 style={{ fontWeight: 700, fontSize: "1.0625rem", color: "#1d1d1f", letterSpacing: "-0.02em" }}>
              {title}
            </h2>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
