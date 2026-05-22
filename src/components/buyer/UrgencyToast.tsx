"use client";

import { useEffect, useState } from "react";
import { Flame, X } from "lucide-react";

interface Props {
  available: number;
  reserved: number;
  sold: number;
  total: number;
}

function getMessages(available: number, reserved: number, sold: number, total: number) {
  const msgs: string[] = [];
  if (available <= 10 && available > 0) msgs.push(`Only ${available} flats left`);
  if (reserved > 0) msgs.push(`${reserved} flat${reserved > 1 ? "s" : ""} reserved recently`);
  if (total > 0 && sold / total > 0.7) msgs.push(`${Math.round((sold / total) * 100)}% already sold`);
  if (available <= 5 && available > 0) msgs.push("Limited inventory — act fast");
  return msgs.length > 0 ? msgs : null;
}

export default function UrgencyToast({ available, reserved, sold, total }: Props) {
  const [visible, setVisible] = useState(false);
  const [msgIndex, setMsgIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  const messages = getMessages(available, reserved, sold, total);

  useEffect(() => {
    if (!messages || dismissed) return;
    const showTimer = setTimeout(() => setVisible(true), 8000);
    return () => clearTimeout(showTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dismissed]);

  useEffect(() => {
    if (!visible || !messages) return;
    const cycle = setInterval(() => {
      setMsgIndex((i) => (i + 1) % messages.length);
    }, 4000);
    return () => clearInterval(cycle);
  }, [visible, messages]);

  if (!messages || dismissed || !visible) return null;

  return (
    <div
      className="fixed bottom-20 left-4 z-40 flex items-center gap-2.5 px-4 py-2.5 rounded-large shadow-lg"
      style={{
        background: "#1d1d1f",
        color: "#fff",
        maxWidth: 280,
        animation: "fadeSlideUp 0.3s ease",
      }}
    >
      <Flame className="w-4 h-4 shrink-0" style={{ color: "#ff9f0a" }} />
      <span className="text-micro flex-1" style={{ color: "rgba(255,255,255,0.9)" }}>
        {messages[msgIndex]}
      </span>
      <button
        onClick={() => { setDismissed(true); setVisible(false); }}
        className="shrink-0 rounded-full p-0.5 hover:bg-white/10 transition-colors"
      >
        <X className="w-3 h-3" style={{ color: "rgba(255,255,255,0.5)" }} />
      </button>
    </div>
  );
}
