"use client";

import { useState } from "react";
import { Share2, Check, Copy } from "lucide-react";

interface Props {
  title: string;
  text?: string;
}

export default function ShareButton({ title, text }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, text: text ?? title, url });
      } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <button
      onClick={handleShare}
      title="Share this project"
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-standard text-micro transition-all"
      style={{ background: "#f5f5f7", color: "rgba(0,0,0,0.64)" }}
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5" style={{ color: "#1cc77f" }} />
          <span className="hidden sm:inline" style={{ color: "#1cc77f" }}>Copied!</span>
        </>
      ) : (
        <>
          <Share2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Share</span>
        </>
      )}
    </button>
  );
}
