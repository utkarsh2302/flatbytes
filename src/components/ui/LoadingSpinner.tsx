"use client";

interface Props {
  size?: "sm" | "md" | "lg";
  message?: string;
}

const sizes = { sm: 16, md: 24, lg: 36 };

export default function LoadingSpinner({ size = "md", message }: Props) {
  const px = sizes[size];
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <svg width={px} height={px} viewBox="0 0 24 24" fill="none" style={{ animation: "spin 0.7s linear infinite" }}>
        <circle cx="12" cy="12" r="10" stroke="rgba(0,0,0,0.08)" strokeWidth="3" />
        <path d="M12 2a10 10 0 0 1 10 10" stroke="#0071e3" strokeWidth="3" strokeLinecap="round" />
      </svg>
      {message && (
        <p style={{ fontSize: "0.8125rem", color: "rgba(0,0,0,0.48)" }}>{message}</p>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
