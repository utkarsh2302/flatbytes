"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Building2, CheckCircle2, Phone, User, Mail, FileText, Shield } from "lucide-react";

const STEPS = ["Account", "Identity", "Business", "Done"];

export default function BrokerRegisterClient() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 0: OTP phone auth
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  // Step 1: Identity
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  // Step 2: Business
  const [reraId, setReraId] = useState("");
  const [city, setCity] = useState("");
  const [experience, setExperience] = useState("1-3");

  async function sendOtp() {
    setLoading(true); setError("");
    const normalizedPhone = phone.startsWith("+") ? phone : `+91${phone.replace(/\D/g, "").slice(-10)}`;
    const { error: e } = await supabase.auth.signInWithOtp({ phone: normalizedPhone });
    setLoading(false);
    if (e) { setError(e.message); return; }
    setOtpSent(true);
  }

  async function verifyOtp() {
    setLoading(true); setError("");
    const normalizedPhone = phone.startsWith("+") ? phone : `+91${phone.replace(/\D/g, "").slice(-10)}`;
    const { error: e } = await supabase.auth.verifyOtp({ phone: normalizedPhone, token: otp, type: "sms" });
    setLoading(false);
    if (e) { setError(e.message); return; }
    setStep(1);
  }

  async function submitRegistration() {
    setLoading(true); setError("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Session expired. Please refresh."); setLoading(false); return; }

    // Get org_id from any active project (default org)
    const { data: orgs } = await supabase.from("organizations").select("id").limit(1).maybeSingle();
    const orgId = orgs?.id;
    if (!orgId) { setError("No organization found. Contact support."); setLoading(false); return; }

    const { error: insertErr } = await supabase.from("brokers").insert({
      user_id: user.id,
      org_id: orgId,
      name: name.trim(),
      phone: user.phone ?? phone,
      email: email.trim() || null,
      rera_id: reraId.trim() || null,
      tier: "free",
      is_active: false, // pending approval
      commission_pct: 2,
    });

    setLoading(false);
    if (insertErr) { setError(insertErr.message); return; }
    setStep(3);
  }

  const inputCls = "w-full px-4 py-3 rounded-xl outline-none text-sm";
  const inputStyle = { background: "#f5f5f7", border: "1px solid rgba(0,0,0,0.1)", color: "#1d1d1f" };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "linear-gradient(135deg, #0d1117 0%, #1a2030 100%)" }}>
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(0,113,227,0.15)", border: "1px solid rgba(0,113,227,0.3)" }}>
            <Building2 className="w-7 h-7" style={{ color: "#2997ff" }} />
          </div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>Join as Broker</h1>
          <p style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.5)", marginTop: 6 }}>Get live inventory access & earn commissions</p>
        </div>

        {/* Progress */}
        {step < 3 && (
          <div className="flex items-center gap-2 mb-6 px-2">
            {STEPS.slice(0, 3).map((s, i) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: i <= step ? "#0071e3" : "rgba(255,255,255,0.1)", color: i <= step ? "#fff" : "rgba(255,255,255,0.4)" }}>
                    {i < step ? "✓" : i + 1}
                  </div>
                  <span style={{ fontSize: "0.72rem", color: i <= step ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.35)", fontWeight: i === step ? 600 : 400 }}>{s}</span>
                </div>
                {i < 2 && <div className="flex-1 h-px" style={{ background: i < step ? "#0071e3" : "rgba(255,255,255,0.12)" }} />}
              </div>
            ))}
          </div>
        )}

        {/* Card */}
        <div className="rounded-2xl p-6" style={{ background: "#fff" }}>
          {error && (
            <div className="mb-4 px-3 py-2 rounded-lg text-xs" style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
              {error}
            </div>
          )}

          {/* Step 0: Phone auth */}
          {step === 0 && (
            <div className="space-y-4">
              <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#1d1d1f" }}>Verify your number</h2>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "rgba(0,0,0,0.35)" }} />
                <input type="tel" placeholder="+91 98765 43210" value={phone} onChange={(e) => setPhone(e.target.value)}
                  className={inputCls} style={{ ...inputStyle, paddingLeft: 42 }} disabled={otpSent} />
              </div>
              {otpSent && (
                <div className="relative">
                  <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "rgba(0,0,0,0.35)" }} />
                  <input type="text" placeholder="6-digit OTP" value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={6}
                    className={inputCls} style={{ ...inputStyle, paddingLeft: 42, letterSpacing: "0.2em" }} />
                </div>
              )}
              <button onClick={otpSent ? verifyOtp : sendOtp} disabled={loading || (!otpSent && phone.replace(/\D/g,"").length < 10)}
                className="w-full py-3 rounded-xl font-semibold text-sm"
                style={{ background: "#0071e3", color: "#fff", opacity: loading ? 0.7 : 1, border: "none", cursor: "pointer" }}>
                {loading ? "Please wait…" : otpSent ? "Verify OTP" : "Send OTP"}
              </button>
              {otpSent && (
                <button onClick={() => setOtpSent(false)} style={{ width: "100%", fontSize: "0.8rem", color: "#0071e3", background: "none", border: "none", cursor: "pointer" }}>
                  Change number
                </button>
              )}
            </div>
          )}

          {/* Step 1: Identity */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#1d1d1f" }}>Your details</h2>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "rgba(0,0,0,0.35)" }} />
                <input type="text" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)}
                  className={inputCls} style={{ ...inputStyle, paddingLeft: 42 }} />
              </div>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "rgba(0,0,0,0.35)" }} />
                <input type="email" placeholder="Email (optional)" value={email} onChange={(e) => setEmail(e.target.value)}
                  className={inputCls} style={{ ...inputStyle, paddingLeft: 42 }} />
              </div>
              <button onClick={() => name.trim().length > 1 && setStep(2)} disabled={name.trim().length < 2}
                className="w-full py-3 rounded-xl font-semibold text-sm"
                style={{ background: "#0071e3", color: "#fff", opacity: name.trim().length < 2 ? 0.4 : 1, border: "none", cursor: "pointer" }}>
                Continue
              </button>
            </div>
          )}

          {/* Step 2: Business */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#1d1d1f" }}>Business info</h2>
              <div className="relative">
                <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "rgba(0,0,0,0.35)" }} />
                <input type="text" placeholder="RERA ID (optional)" value={reraId} onChange={(e) => setReraId(e.target.value)}
                  className={inputCls} style={{ ...inputStyle, paddingLeft: 42 }} />
              </div>
              <input type="text" placeholder="Your city" value={city} onChange={(e) => setCity(e.target.value)}
                className={inputCls} style={inputStyle} />
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 500, color: "rgba(0,0,0,0.55)", display: "block", marginBottom: 8 }}>Years of experience</label>
                <div className="flex gap-2">
                  {["< 1yr", "1-3", "3-7", "7+"].map((v) => (
                    <button key={v} onClick={() => setExperience(v)}
                      style={{ flex: 1, padding: "8px 0", borderRadius: 10, fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", border: "1.5px solid",
                        background: experience === v ? "#0071e3" : "transparent",
                        color: experience === v ? "#fff" : "rgba(0,0,0,0.55)",
                        borderColor: experience === v ? "#0071e3" : "rgba(0,0,0,0.15)" }}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={submitRegistration} disabled={loading}
                className="w-full py-3 rounded-xl font-semibold text-sm"
                style={{ background: "#0071e3", color: "#fff", opacity: loading ? 0.7 : 1, border: "none", cursor: "pointer" }}>
                {loading ? "Submitting…" : "Submit Application"}
              </button>
            </div>
          )}

          {/* Step 3: Done */}
          {step === 3 && (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ background: "rgba(28,199,127,0.1)" }}>
                <CheckCircle2 className="w-9 h-9" style={{ color: "#1cc77f" }} />
              </div>
              <div>
                <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1d1d1f" }}>Application Submitted!</h2>
                <p style={{ fontSize: "0.875rem", color: "rgba(0,0,0,0.55)", marginTop: 6, lineHeight: 1.5 }}>
                  Our team will review your application and activate your account within 24 hours. You&apos;ll receive an SMS confirmation.
                </p>
              </div>
              <button onClick={() => router.push("/login")}
                className="w-full py-3 rounded-xl font-semibold text-sm"
                style={{ background: "#f5f5f7", color: "#1d1d1f", border: "none", cursor: "pointer" }}>
                Back to Login
              </button>
            </div>
          )}
        </div>

        {/* Features */}
        {step === 0 && (
          <div className="mt-6 grid grid-cols-3 gap-3">
            {[
              { emoji: "🏢", text: "Live inventory access" },
              { emoji: "💰", text: "Track commissions" },
              { emoji: "📊", text: "Sales analytics" },
            ].map((f) => (
              <div key={f.text} className="text-center p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div style={{ fontSize: "1.5rem", marginBottom: 4 }}>{f.emoji}</div>
                <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.3 }}>{f.text}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
