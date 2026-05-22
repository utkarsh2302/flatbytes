"use client";

import type { ReactNode } from "react";

interface Props {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

export default function EmptyState({ icon, title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      {icon && (
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: "#f5f5f7", fontSize: 32 }}>
          {icon}
        </div>
      )}
      <h3 style={{ fontSize: "1.0625rem", fontWeight: 700, color: "#1d1d1f", letterSpacing: "-0.02em", marginBottom: 6 }}>
        {title}
      </h3>
      {description && (
        <p style={{ fontSize: "0.875rem", color: "rgba(0,0,0,0.48)", maxWidth: 280, lineHeight: 1.5 }}>
          {description}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-5 px-5 py-2.5 rounded-standard"
          style={{ background: "#0071e3", color: "#fff", fontSize: "0.875rem", fontWeight: 600, border: "none", cursor: "pointer" }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
