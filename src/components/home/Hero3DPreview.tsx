"use client";

import dynamic from "next/dynamic";

const ModelViewer = dynamic(() => import("@/components/tower/ModelViewer"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center" style={{ background: "#1a2430" }}>
      <div
        className="w-9 h-9 rounded-full border-2 animate-spin"
        style={{ borderColor: "rgba(28,199,127,0.2)", borderTopColor: "#1cc77f" }}
      />
    </div>
  ),
});

export default function Hero3DPreview() {
  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl"
      style={{ aspectRatio: "4/3", boxShadow: "0 30px 80px rgba(0,0,0,0.5)" }}
    >
      <ModelViewer buildingType="residential" isUnderConstruction={false} totalFloors={16} />
      <div
        className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full pointer-events-none"
        style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)" }}
      >
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#1cc77f", animation: "pulseGlow 2s infinite" }} />
        <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#fff", letterSpacing: "0.06em" }}>LIVE 3D</span>
      </div>
    </div>
  );
}
