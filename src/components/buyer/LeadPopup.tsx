"use client";

import { useEffect, useState, useTransition } from "react";
import { X, Phone, User } from "lucide-react";
import { submitLead } from "@/lib/actions";

interface Props {
  projectId: string;
  projectName: string;
}

export default function LeadPopup({ projectId, projectName }: Props) {
  const [show, setShow] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const key = `popup_shown_${projectId}`;
    if (sessionStorage.getItem(key)) return;
    const timer = setTimeout(() => {
      sessionStorage.setItem(key, "1");
      setShow(true);
    }, 25000);
    return () => clearTimeout(timer);
  }, [projectId]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      try {
        await submitLead({ project_id: projectId, name, phone, source: "popup" });
        setDone(true);
      } catch (err: any) {
        setError(err.message ?? "Something went wrong.");
      }
    });
  }

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl p-6"
        style={{ background: "#fff", boxShadow: "rgba(0,0,0,0.24) 0px 20px 60px" }}
      >
        <button
          onClick={() => setShow(false)}
          className="absolute top-4 right-4 p-1.5 rounded-full transition-colors"
          style={{ background: "#f5f5f7", color: "rgba(0,0,0,0.48)" }}
        >
          <X className="w-4 h-4" />
        </button>

        {done ? (
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: "rgba(28,199,127,0.1)" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M5 13l4 4L19 7" stroke="#1cc77f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="text-tile mb-1" style={{ color: "#1d1d1f" }}>We&apos;ll call you back!</p>
            <p className="text-body" style={{ color: "rgba(0,0,0,0.56)" }}>
              Our sales team will reach out shortly.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                style={{ background: "rgba(0,113,227,0.08)" }}>
                <Phone className="w-5 h-5" style={{ color: "#0071e3" }} />
              </div>
              <h3 className="text-tile mb-1" style={{ color: "#1d1d1f" }}>Interested in {projectName}?</h3>
              <p className="text-body" style={{ color: "rgba(0,0,0,0.56)" }}>
                Get a free callback from our sales team today.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "rgba(0,0,0,0.3)" }} />
                <input
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full pl-9 pr-4 py-2.5 rounded-standard text-sm outline-none transition-all"
                  style={{
                    background: "#f5f5f7",
                    border: "1px solid transparent",
                    color: "#1d1d1f",
                  }}
                  onFocus={(e) => (e.currentTarget.style.border = "1px solid #0071e3")}
                  onBlur={(e) => (e.currentTarget.style.border = "1px solid transparent")}
                />
              </div>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "rgba(0,0,0,0.3)" }} />
                <input
                  type="tel"
                  placeholder="Phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="w-full pl-9 pr-4 py-2.5 rounded-standard text-sm outline-none transition-all"
                  style={{
                    background: "#f5f5f7",
                    border: "1px solid transparent",
                    color: "#1d1d1f",
                  }}
                  onFocus={(e) => (e.currentTarget.style.border = "1px solid #0071e3")}
                  onBlur={(e) => (e.currentTarget.style.border = "1px solid transparent")}
                />
              </div>
              {error && <p className="text-micro" style={{ color: "#ff3b30" }}>{error}</p>}
              <button
                type="submit"
                disabled={isPending}
                className="w-full py-2.5 rounded-standard text-sm font-semibold transition-opacity"
                style={{ background: "#0071e3", color: "#fff", opacity: isPending ? 0.6 : 1 }}
              >
                {isPending ? "Sending…" : "Request free callback"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
