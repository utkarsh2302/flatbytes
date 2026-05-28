"use client";

import { useEffect, useState } from "react";
import type { ToastType } from "@/lib/toast";

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

const TYPE_STYLE: Record<ToastType, { bg: string; color: string; border: string }> = {
  success: { bg: "rgba(28,199,127,0.95)", color: "#fff", border: "rgba(28,199,127,0.3)" },
  info:    { bg: "rgba(0,113,227,0.95)",  color: "#fff", border: "rgba(0,113,227,0.3)"  },
  error:   { bg: "rgba(255,59,48,0.95)",  color: "#fff", border: "rgba(255,59,48,0.3)"  },
};

const TYPE_ICON: Record<ToastType, string> = {
  success: "✓",
  info:    "ℹ",
  error:   "✕",
};

export default function Toaster() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const handler = (e: Event) => {
      const { message, type } = (e as CustomEvent<{ message: string; type: ToastType }>).detail;
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev.slice(-3), { id, message, type }]);
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 2800);
    };
    window.addEventListener("flatbytes:toast", handler);
    return () => window.removeEventListener("flatbytes:toast", handler);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed z-[200] flex flex-col gap-2 pointer-events-none"
      style={{
        bottom: "calc(72px + env(safe-area-inset-bottom, 0px))",
        left: "50%",
        transform: "translateX(-50%)",
        width: "max-content",
        maxWidth: "min(90vw, 360px)",
      }}
    >
      {toasts.map((t) => {
        const s = TYPE_STYLE[t.type];
        return (
          <div
            key={t.id}
            className="flex items-center gap-2.5 px-4 py-3 rounded-2xl text-sm font-semibold"
            style={{
              background: s.bg,
              color: s.color,
              backdropFilter: "blur(12px)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
              border: `1px solid ${s.border}`,
              letterSpacing: "-0.01em",
              animation: "toastIn 0.28s cubic-bezier(0.22,1,0.36,1) both",
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ fontSize: "0.875rem", fontWeight: 700 }}>{TYPE_ICON[t.type]}</span>
            {t.message}
          </div>
        );
      })}
    </div>
  );
}
