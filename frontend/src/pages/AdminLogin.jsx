import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from '../hooks/useAuth';
import logo from '../assets/logo.png';
import angkel from '../assets/angkel.png';

// ── Eye Icons ────────────────────────────────────────────────────────────────
const EyeOff = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);
const EyeOn = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

// ── Forgot Password Modal ─────────────────────────────────────────────────────
function ForgotModal({ onClose }) {
  const [email, setEmail]     = useState("");
  const [step, setStep]       = useState(1);
  const [err, setErr]         = useState("");
  const [loading, setLoading] = useState(false);

  const validate = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const handleSend = async () => {
    if (!email) { setErr("Please enter your email address."); return; }
    if (!validate(email)) { setErr("Please enter a valid email address."); return; }
    setErr("");
    setLoading(true);
    await new Promise(r => setTimeout(r, 900));
    setLoading(false);
    setStep(2);
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999] animate-[fadeIn_0.3s_ease]"
      onClick={onClose}
    >
      <div
        className="bg-[#111f30] border border-blue-500/40 rounded-2xl p-10 max-w-sm w-[90%] text-center shadow-[0_0_0_1px_rgba(40,120,180,0.12),0_24px_60px_rgba(0,0,0,0.6)] animate-[popIn_0.4s_cubic-bezier(.22,1,.36,1)]"
        onClick={e => e.stopPropagation()}
      >
        {step === 1 ? (
          <>
            <div className="text-5xl mb-4">🔑</div>
            <h2 className="font-['Montserrat',sans-serif] text-xl font-black text-[#2878b4] mb-2">Forgot Password?</h2>
            <p className="text-[#7a9bb8] text-sm mb-6 leading-relaxed">
              No worries! Enter your registered email and we'll send you a reset link.
            </p>

            {err && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-3 py-2 text-[0.82rem] mb-4 text-left">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {err}
              </div>
            )}

            <div className="relative mb-5 text-left">
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setErr(""); }}
                onKeyDown={e => e.key === "Enter" && handleSend()}
                placeholder="Enter your email address"
                className="w-full bg-[#0d2035] border border-[#1e4a72] rounded-lg px-4 py-3 pr-11 text-[#e8f0f8] text-[0.92rem] outline-none focus:border-[#2878b4] focus:shadow-[0_0_0_3px_rgba(40,120,180,0.18)] transition placeholder-[#4a7090] font-['Inter',sans-serif]"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#4a7090]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 7l10 7 10-7"/>
                </svg>
              </span>
            </div>

            <button
              onClick={handleSend}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-br from-[#2878b4] to-[#1a5f9a] rounded-lg text-white font-['Montserrat',sans-serif] font-black text-[0.9rem] shadow-[0_4px_20px_rgba(40,120,180,0.4)] hover:brightness-110 hover:-translate-y-px transition disabled:opacity-70 disabled:cursor-not-allowed disabled:translate-y-0"
            >
              {loading ? "Sending…" : "Send Reset Link"}
            </button>
            <button
              onClick={onClose}
              className="mt-4 text-[0.83rem] text-[#4a7090] hover:text-[#2878b4] transition bg-none border-none cursor-pointer font-['Inter',sans-serif]"
            >
              ← Back to Sign In
            </button>
          </>
        ) : (
          <>
            <div className="text-5xl mb-4">📧</div>
            <h2 className="font-['Montserrat',sans-serif] text-xl font-black text-[#2878b4] mb-2">Check Your Inbox!</h2>
            <p className="text-[#7a9bb8] text-sm mb-6 leading-relaxed">
              If that email is registered, a reset link has been sent.<br/>
              Please check your email and follow the instructions.
            </p>
            <button
              onClick={onClose}
              className="py-3 px-9 bg-gradient-to-br from-[#2878b4] to-[#1a5f9a] rounded-lg text-white font-['Montserrat',sans-serif] font-black text-[0.9rem] shadow-[0_4px_20px_rgba(40,120,180,0.4)] hover:brightness-110 hover:-translate-y-px transition"
            >
              OK, Got It
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Error Modal ───────────────────────────────────────────────────────────────
function ErrorModal({ message, onClose }) {
  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999] animate-[fadeIn_0.3s_ease]"
      onClick={onClose}
    >
      <div
        className="bg-[#111f30] border border-red-500/40 rounded-2xl p-10 max-w-sm w-[90%] text-center shadow-[0_0_0_1px_rgba(220,50,50,0.15),0_24px_60px_rgba(0,0,0,0.6)] animate-[popIn_0.4s_cubic-bezier(.22,1,.36,1)]"
        onClick={e => e.stopPropagation()}
      >
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="font-['Montserrat',sans-serif] text-xl font-black text-red-400 mb-2">Access Denied</h2>
        <p className="text-[#7a9bb8] text-sm mb-6 leading-relaxed">{message}</p>
        <button
          onClick={onClose}
          className="py-3 px-9 bg-gradient-to-br from-red-600 to-red-900 rounded-lg text-white font-['Montserrat',sans-serif] font-black text-[0.9rem] shadow-[0_4px_20px_rgba(220,50,50,0.4)] hover:brightness-110 hover:-translate-y-px transition"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

// ── Main Login Page ───────────────────────────────────────────────────────────
export default function AdminLogin() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");
  const [showPw, setShowPw]         = useState(false);
  const [remember, setRemember]     = useState(false);
  const [emailErr, setEmailErr]     = useState("");
  const [pwErr, setPwErr]           = useState("");
  const [loading, setLoading]       = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [errorModal, setErrorModal] = useState("");

  // Load remembered email
  useEffect(() => {
    const saved = localStorage.getItem("adminEmail");
    if (saved) { setEmail(saved); setRemember(true); }
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b1929]">
        <svg className="animate-spin w-8 h-8 text-[#2878b4]" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
      </div>
    );
  }

  if (isAuthenticated) return <Navigate to="/admin" replace />;

  const validateEmail = (v) => {
    if (!v) return "Please enter your email address.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Please enter a valid email address.";
    return "";
  };
  const validatePassword = (v) => {
    if (!v) return "Please enter your password.";
    if (v.length < 6) return "Password must be at least 6 characters.";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const eErr = validateEmail(email);
    const pErr = validatePassword(password);
    setEmailErr(eErr);
    setPwErr(pErr);
    if (eErr || pErr) return;

    setLoading(true);
    await new Promise(r => setTimeout(r, 700));

    if (remember) localStorage.setItem("adminEmail", email);
    else localStorage.removeItem("adminEmail");

    const ok = login(email, password);
    if (!ok) {
      setErrorModal("Invalid email or password. Please check your credentials and try again.");
    }

    setLoading(false);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#0b1929] text-[#e8f0f8]" style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&family=Inter:wght@300;400;500&display=swap');
        @keyframes cardIn  { from { opacity:0; transform:translateY(28px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn  { from { opacity:0; } to { opacity:1; } }
        @keyframes popIn   { from { opacity:0; transform:scale(0.85) translateY(20px); } to { opacity:1; transform:scale(1) translateY(0); } }
        @keyframes shakeX  { 0%{transform:translateX(0)} 25%{transform:translateX(-6px)} 50%{transform:translateX(6px)} 75%{transform:translateX(-4px)} 100%{transform:translateX(0)} }
        .shake { animation: shakeX 0.3s ease; }
      `}</style>

      {/* ── Left Panel ── */}
      <div className="hidden md:flex flex-[0_0_48%] relative overflow-hidden">

        {/* Full-cover background image */}
        <img
          src={angkel}
          alt="Angkel Tricycle"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />

        {/* Gradient overlay — darkens bottom for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b1929]/85 via-[#0b1929]/25 to-transparent" />

        {/* Subtle grid lines overlay */}
        <svg
          className="absolute inset-0 w-full h-full opacity-10"
          viewBox="0 0 600 900"
          preserveAspectRatio="xMidYMid slice"
        >
          {[...Array(12)].map((_, i) => (
            <line key={`v${i}`} x1={i * 55} y1="0" x2={i * 55} y2="900" stroke="#63a0dc" strokeWidth="1"/>
          ))}
          {[...Array(18)].map((_, i) => (
            <line key={`h${i}`} x1="0" y1={i * 55} x2="600" y2={i * 55} stroke="#63a0dc" strokeWidth="1"/>
          ))}
        </svg>

        {/* Bottom branding text */}
        <div className="absolute bottom-12 w-full flex flex-col items-center gap-2 select-none">
          <p className="font-['Montserrat',sans-serif] text-3xl font-black text-white/90 tracking-tight drop-shadow-lg">
            PasadaNow
          </p>
          <p className="text-[#7a9bb8] text-sm tracking-[3px] uppercase font-semibold drop-shadow">
            Tricycle Ride-Hailing
          </p>
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div className="flex-1 flex items-center justify-center bg-[#0f2236] px-8 py-10 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-[radial-gradient(circle,rgba(40,120,180,0.18)_0%,transparent_70%)] pointer-events-none" />

        <div
          className="w-full max-w-[480px] bg-[#111f30] border border-[#1e4a72] rounded-2xl px-11 py-11 shadow-[0_0_0_1px_rgba(40,120,180,0.12),0_24px_64px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.04)] flex flex-col items-center text-center hover:border-[#2878b4]/50 transition-colors duration-300"
          style={{ animation: "cardIn 0.55s cubic-bezier(.22,1,.36,1) both" }}
        >
          {/* ── Logo ── */}
          <div className="flex items-center justify-center gap-2.5 mb-1.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#2878b4] to-[#e07820] flex items-center justify-center shadow-lg overflow-hidden">
              <img src={logo} alt="PasadaNow Logo" className="w-full h-full object-contain" />
            </div>
            <div className="font-['Montserrat',sans-serif] text-[2rem] font-black leading-none tracking-tight">
              <span className="text-[#2878b4]">Pasada</span><span className="text-[#e07820]">Now</span>
            </div>
          </div>

          <div className="text-[0.72rem] font-semibold tracking-[2px] uppercase text-[#7a9bb8] mb-7">
            Admin Portal
          </div>

          <h1 className="font-['Montserrat',sans-serif] text-[1.85rem] font-black italic text-[#e8f0f8] mb-1">
            Welcome Back!
          </h1>
          <p className="text-[0.88rem] italic text-[#7a9bb8] mb-8">
            Sign in to access the admin dashboard
          </p>

          {/* ── Form ── */}
          <form onSubmit={handleSubmit} noValidate className="w-full">

            {/* Email */}
            <div className="mb-4 text-left">
              <label className="block text-[0.82rem] font-bold italic text-[#e8f0f8] mb-2">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setEmailErr(validateEmail(e.target.value)); }}
                  placeholder="Enter your email"
                  className={`w-full bg-[#0d2035] border rounded-lg px-4 py-3 pr-11 text-[#e8f0f8] text-[0.92rem] outline-none transition placeholder-[#4a7090] font-['Inter',sans-serif]
                    ${emailErr
                      ? "border-red-500 shadow-[0_0_0_3px_rgba(234,84,85,0.18)]"
                      : email && !emailErr
                        ? "border-green-500 shadow-[0_0_0_3px_rgba(40,199,111,0.18)]"
                        : "border-[#1e4a72] focus:border-[#2878b4] focus:shadow-[0_0_0_3px_rgba(40,120,180,0.18)]"
                    }`}
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#4a7090] pointer-events-none">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 7l10 7 10-7"/>
                  </svg>
                </span>
              </div>
              {emailErr && (
                <div className="flex items-center gap-1.5 mt-1.5 text-[0.76rem] text-red-400 font-semibold animate-[shakeX_0.3s_ease]">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {emailErr}
                </div>
              )}
            </div>

            {/* Password */}
            <div className="mb-4 text-left">
              <label className="block text-[0.82rem] font-bold italic text-[#e8f0f8] mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setPwErr(validatePassword(e.target.value)); }}
                  placeholder="Enter your password"
                  className={`w-full bg-[#0d2035] border rounded-lg px-4 py-3 pr-11 text-[#e8f0f8] text-[0.92rem] outline-none transition placeholder-[#4a7090] font-['Inter',sans-serif]
                    ${pwErr
                      ? "border-red-500 shadow-[0_0_0_3px_rgba(234,84,85,0.18)]"
                      : password && !pwErr
                        ? "border-green-500 shadow-[0_0_0_3px_rgba(40,199,111,0.18)]"
                        : "border-[#1e4a72] focus:border-[#2878b4] focus:shadow-[0_0_0_3px_rgba(40,120,180,0.18)]"
                    }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#4a7090] hover:text-[#7a9bb8] transition flex items-center"
                >
                  {showPw ? <EyeOn /> : <EyeOff />}
                </button>
              </div>
              {pwErr && (
                <div className="flex items-center gap-1.5 mt-1.5 text-[0.76rem] text-red-400 font-semibold animate-[shakeX_0.3s_ease]">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {pwErr}
                </div>
              )}
            </div>

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between mb-7">
              <label className="flex items-center gap-2 cursor-pointer text-[0.85rem] text-[#7a9bb8] select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={e => setRemember(e.target.checked)}
                  className="w-4 h-4 accent-[#2878b4] cursor-pointer"
                />
                Remember me
              </label>
              <button
                type="button"
                onClick={() => setShowForgot(true)}
                className="text-[0.85rem] italic text-[#2878b4] hover:text-[#e07820] transition bg-none border-none cursor-pointer font-['Inter',sans-serif]"
              >
                Forgot Password?
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-br from-[#2878b4] to-[#1a5f9a] rounded-lg text-white font-['Montserrat',sans-serif] font-black italic text-[1rem] tracking-wide shadow-[0_4px_20px_rgba(40,120,180,0.4)] hover:brightness-110 hover:-translate-y-px active:translate-y-0 transition disabled:opacity-70 disabled:cursor-not-allowed disabled:translate-y-0"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Signing In…
                </span>
              ) : "Sign In"}
            </button>
          </form>

          <p className="mt-6 text-[0.78rem] italic text-[#4a7090]">
            Admin access only — commuters & drivers use the mobile app
          </p>
        </div>
      </div>

      {showForgot && <ForgotModal onClose={() => setShowForgot(false)} />}
      {errorModal && <ErrorModal message={errorModal} onClose={() => setErrorModal("")} />}
    </div>
  );
}