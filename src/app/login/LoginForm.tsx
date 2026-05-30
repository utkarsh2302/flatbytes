"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Phone, Mail, ArrowRight, ChevronLeft } from "lucide-react";

type BuyerStep = "phone" | "otp";
type LoginMode = "phone" | "email";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") ?? "/projects";

  const supabase = createClient();

  const [buyerStep, setBuyerStep] = useState<BuyerStep>("phone");

  // Buyer state
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    setError("");
  }, [buyerStep]);

  // ── Buyer: send OTP ───────────────────────────────────────────
  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!phone.trim()) { setError("Enter your phone number."); return; }

    const normalized = phone.startsWith("+") ? phone : `+91${phone.replace(/\D/g, "")}`;
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ phone: normalized });
    setLoading(false);

    if (error) { setError(error.message); return; }
    setSent(true);
    setBuyerStep("otp");
  }

  // ── Buyer: verify OTP ─────────────────────────────────────────
  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (otp.length < 4) { setError("Enter the OTP sent to your phone."); return; }

    const normalized = phone.startsWith("+") ? phone : `+91${phone.replace(/\D/g, "")}`;
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      phone: normalized,
      token: otp,
      type: "sms",
    });
    setLoading(false);

    if (error) { setError(error.message); return; }
    router.push(nextPath);
    router.refresh();
  }


  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "11px 14px",
    borderRadius: 10,
    border: "1.5px solid rgba(0,0,0,0.12)",
    fontSize: 15,
    color: "#1d1d1f",
    background: "#ffffff",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.15s",
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "#000" }}
    >
      {/* Back to home */}
      <Link
        href="/"
        className="fixed top-6 left-6 flex items-center gap-1.5 text-white/60 hover:text-white/90 transition-colors"
        style={{ fontSize: 13 }}
      >
        <ChevronLeft className="w-4 h-4" />
        FlatBytes
      </Link>

      <div
        className="w-full max-w-sm"
        style={{
          background: "#fff",
          borderRadius: 18,
          boxShadow: "rgba(0,0,0,0.5) 0px 20px 60px 0px",
          padding: "32px 28px",
        }}
      >
        {/* Logo mark */}
        <div className="flex items-center gap-2 mb-6">
          <svg width="22" height="22" viewBox="0 0 18 18" fill="none">
            <rect x="2" y="8" width="14" height="9" rx="1.5" fill="#0071e3" />
            <rect x="5" y="3" width="8" height="6" rx="1" fill="#0071e3" opacity="0.7" />
            <rect x="7" y="10" width="4" height="5" rx="0.5" fill="white" opacity="0.9" />
          </svg>
          <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: "-0.02em", color: "#1d1d1f" }}>
            Flat<span style={{ color: "#0071e3" }}>Bytes</span>
          </span>
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1d1d1f", letterSpacing: "-0.025em", marginBottom: 4 }}>
          Sign in
        </h1>
        <p style={{ fontSize: 13, color: "rgba(0,0,0,0.5)", marginBottom: 24 }}>
          Welcome back. Sign in to view your properties.
        </p>

        {/* ── Buyer flow ── */}
        {buyerStep === "phone" ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: "rgba(0,0,0,0.5)", display: "block", marginBottom: 6 }}>
                Phone number
              </label>
              <div className="relative">
                <Phone
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                  style={{ color: "rgba(0,0,0,0.35)" }}
                />
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{ ...inputStyle, paddingLeft: 38 }}
                  autoComplete="tel"
                  autoFocus
                />
              </div>
              <p style={{ fontSize: 11, color: "rgba(0,0,0,0.38)", marginTop: 5 }}>
                Include country code · e.g. +91 for India
              </p>
            </div>

            {error && (
              <p style={{ fontSize: 12, color: "#d70015", background: "rgba(215,0,21,0.06)", padding: "8px 12px", borderRadius: 8 }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 btn-primary"
              style={{ padding: "11px 0", fontSize: 14, opacity: loading ? 0.6 : 1 }}
            >
              {loading ? "Sending…" : "Send OTP"}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <button
              type="button"
              onClick={() => { setBuyerStep("phone"); setOtp(""); setError(""); }}
              className="flex items-center gap-1 text-micro"
              style={{ color: "#0071e3", background: "none", border: "none", cursor: "pointer", padding: 0, marginBottom: 4 }}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Change number
            </button>

            <p style={{ fontSize: 13, color: "rgba(0,0,0,0.55)" }}>
              OTP sent to <strong style={{ color: "#1d1d1f" }}>{phone}</strong>
            </p>

            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: "rgba(0,0,0,0.5)", display: "block", marginBottom: 6 }}>
                6-digit OTP
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="123456"
                value={otp}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "");
                  setOtp(v);
                  if (v.length === 6) {
                    setTimeout(() => {
                      (e.target.closest("form") as HTMLFormElement | null)?.requestSubmit();
                    }, 80);
                  }
                }}
                style={{ ...inputStyle, letterSpacing: "0.25em", textAlign: "center", fontSize: 20 }}
                autoFocus
                autoComplete="one-time-code"
              />
            </div>

            {error && (
              <p style={{ fontSize: 12, color: "#d70015", background: "rgba(215,0,21,0.06)", padding: "8px 12px", borderRadius: 8 }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 btn-primary"
              style={{ padding: "11px 0", fontSize: 14, opacity: loading ? 0.6 : 1 }}
            >
              {loading ? "Verifying…" : "Verify & Sign In"}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={handleSendOtp}
              disabled={loading}
              style={{ width: "100%", fontSize: 12, color: "#0071e3", background: "none", border: "none", cursor: "pointer", padding: "4px 0" }}
            >
              Resend OTP
            </button>
          </form>
        )}

        <p style={{ fontSize: 11, color: "rgba(0,0,0,0.32)", textAlign: "center", marginTop: 20 }}>
          By continuing, you agree to our{" "}
          <a href="#" style={{ color: "#0071e3" }}>Terms</a> and{" "}
          <a href="#" style={{ color: "#0071e3" }}>Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}
