import { useState } from "react";
import logo from "../assets/logo.png";
import trikeBg from "../assets/trike.png";

const EyeOpenIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeClosedIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const EmailIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="M2 7l10 7 10-7" />
  </svg>
);

const AlertIcon = ({ size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const CheckIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const FacebookIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877f2">
    <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
  </svg>
);

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

const LockIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0110 0v4" />
  </svg>
);

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [serverError, setServerError] = useState("");
  const [serverSuccess, setServerSuccess] = useState("");
  const [popup, setPopup] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const validateUsername = (val) => {
    if (!val.trim()) return "Please enter your username.";
    return "";
  };

  const validatePassword = (val) => {
    if (!val) return "Please enter your password.";
    if (val.length < 6) return "Password must be at least 6 characters.";
    return "";
  };

  const handleUsernameChange = (e) => {
    const val = e.target.value;
    setUsername(val);
    setUsernameError(validateUsername(val));
  };

  const handlePasswordChange = (e) => {
    const val = e.target.value;
    setPassword(val);
    setPasswordError(validatePassword(val));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const uErr = validateUsername(username);
    const pErr = validatePassword(password);
    setUsernameError(uErr);
    setPasswordError(pErr);
    if (uErr || pErr) return;

    setIsLoading(true);
    setServerError("");
    try {
      const res = await fetch("http://localhost:8080/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json();
      if (res.ok) {
        setServerSuccess("Login successful! Redirecting...");
        localStorage.setItem("user", JSON.stringify(data)); // ← save user + role
        window.location.href = "/dashboard";
      } else {
        setServerError(data.message || "Invalid username or password.");
      }
    } catch {
      setServerError("Cannot connect to server. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const inputBase =
    "w-full bg-[#0d2035] border border-[#1e4a72] rounded-lg px-4 py-3 text-[#e8f0f8] text-sm placeholder-[#4a7090] outline-none transition-all duration-200 focus:border-[#2878b4] focus:ring-2 focus:ring-[#2878b4]/30";
  const inputError = "!border-red-500 !ring-2 !ring-red-500/20";
  const inputSuccess = "!border-green-500 !ring-2 !ring-green-500/20";

  const getInputState = (val, err) => {
    if (err) return inputError;
    if (val && !err) return inputSuccess;
    return "";
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#0b1929] font-sans">
      {/* Left Panel */}
      <div className="hidden md:flex flex-[0_0_48%] relative overflow-hidden">
        <img
          src={trikeBg}
          alt="PasadaNow tricycle driver"
          className="w-full h-full object-cover object-top brightness-90 saturate-105"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0b1929]/10 to-[#0b1929]/55" />
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center bg-[#0f2236] px-8 py-10 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-[#2878b4]/18 pointer-events-none" />

        <div
          className="w-full max-w-[480px] bg-[#111f30] border border-[#1e4a72] rounded-2xl px-11 py-10 flex flex-col items-center text-center
            shadow-[0_0_0_1px_rgba(40,120,180,0.12),0_24px_64px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.04)]
            hover:border-[#2878b4]/50 transition-colors duration-300
            animate-[cardIn_0.55s_cubic-bezier(.22,1,.36,1)_both]"
        >
          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-1.5">
            <img src={logo} alt="PasadaNow Logo" className="w-12 h-12" />
            <div className="font-['Montserrat'] text-3xl font-extrabold leading-none tracking-tight">
              <span className="text-[#2878b4]">Pasada</span>
              <span className="text-[#e07820]">Now</span>
            </div>
          </div>
          <p className="text-[0.72rem] font-semibold tracking-[2px] uppercase text-[#7a9bb8] mb-7">
            Tricycle Ride Hailing System
          </p>

          <h1 className="font-['Montserrat'] text-3xl font-extrabold italic text-[#e8f0f8] mb-1">
            Welcome Back!
          </h1>
          <p className="text-sm italic text-[#7a9bb8] mb-7">
            Sign in to continue your journey
          </p>

          {/* Server Alerts */}
          {serverError && (
            <div className="w-full flex items-center gap-2 px-3.5 py-2.5 mb-4 rounded-lg bg-red-500/10 border border-red-500/35 text-red-400 text-sm text-left">
              <AlertIcon />
              {serverError}
            </div>
          )}
          {serverSuccess && (
            <div className="w-full flex items-center gap-2 px-3.5 py-2.5 mb-4 rounded-lg bg-green-500/10 border border-green-500/35 text-green-400 text-sm text-left">
              <CheckIcon />
              {serverSuccess}
            </div>
          )}

          <form onSubmit={handleSubmit} className="w-full" noValidate>
            {/* Username */}
            <div className="mb-4 text-left">
              <label className="block text-[0.82rem] font-bold italic text-[#e8f0f8] mb-2">
                Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={handleUsernameChange}
                  placeholder="Enter your username"
                  className={`${inputBase} pr-11 ${getInputState(username, usernameError)}`}
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#4a7090] pointer-events-none">
                  <EmailIcon />
                </span>
              </div>
              {usernameError && (
                <div className="flex items-center gap-1.5 mt-1.5 text-[0.76rem] font-semibold text-red-400 animate-[shakeIn_0.3s_ease]">
                  <AlertIcon size={13} />
                  {usernameError}
                </div>
              )}
            </div>

            {/* Password */}
            <div className="mb-6 text-left">
              <label className="block text-[0.82rem] font-bold italic text-[#e8f0f8] mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder="Enter your password"
                  className={`${inputBase} pr-11 ${getInputState(password, passwordError)}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#4a7090] hover:text-[#7a9bb8] transition-colors"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOpenIcon /> : <EyeClosedIcon />}
                </button>
              </div>
              {passwordError && (
                <div className="flex items-center gap-1.5 mt-1.5 text-[0.76rem] font-semibold text-red-400 animate-[shakeIn_0.3s_ease]">
                  <AlertIcon size={13} />
                  {passwordError}
                </div>
              )}
            </div>

            {/* Remember / Forgot */}
            <div className="flex items-center justify-between mb-7">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-[#7a9bb8] select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 accent-[#2878b4] cursor-pointer"
                />
                Remember me
              </label>
              <a
                href="/forgot-password"
                className="text-sm italic text-[#2878b4] hover:text-[#e07820] transition-colors"
              >
                Forgot Password?
              </a>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-gradient-to-br from-[#2878b4] to-[#1a5f9a] hover:brightness-110 active:translate-y-0
                text-white font-['Montserrat'] text-base font-extrabold italic tracking-wide rounded-lg
                shadow-[0_4px_20px_rgba(40,120,180,0.4)] hover:shadow-[0_8px_28px_rgba(40,120,180,0.5)]
                transition-all duration-200 hover:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4l3-3-3-3V4a10 10 0 100 20v-2a8 8 0 01-8-8z"
                    />
                  </svg>
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="w-full flex items-center gap-3 my-5 text-[#4a7090] text-[0.75rem] tracking-[1.5px] uppercase">
            <div className="flex-1 h-px bg-[#1e4a72]" />
            or continue with
            <div className="flex-1 h-px bg-[#1e4a72]" />
          </div>

          {/* Social */}
          <div className="w-full grid grid-cols-2 gap-3 mb-6">
            {[
              { label: "Facebook", icon: <FacebookIcon /> },
              { label: "Google", icon: <GoogleIcon /> },
            ].map(({ label, icon }) => (
              <button
                key={label}
                type="button"
                onClick={() => alert(`${label} login coming soon`)}
                className="flex items-center justify-center gap-2 py-2.5 px-4
                  bg-transparent border border-[#1e4a72] rounded-lg
                  text-[#e8f0f8] font-['Montserrat'] text-sm font-bold italic
                  hover:bg-[#2878b4]/08 hover:border-[#2878b4] transition-all duration-200"
              >
                {icon}
                {label}
              </button>
            ))}
          </div>

          {/* Register */}
          <p className="text-sm italic text-[#7a9bb8]">
            Don&apos;t have an account?{" "}
            <a
              href="/register"
              className="text-[#2878b4] font-semibold hover:text-[#e07820] transition-colors"
            >
              Sign Up
            </a>
          </p>
        </div>
      </div>

      {/* Unauthorized Popup */}
      {popup === "unauthorized" && (
        <Popup
          icon="🔒"
          title="Unauthorized Access"
          titleClass="text-[#e07820]"
          message="You must be logged in to access that page. Please sign in to continue your journey."
          btnClass="bg-gradient-to-br from-[#e07820] to-[#b85e10] shadow-[0_4px_20px_rgba(224,120,32,0.4)]"
          onClose={() => setPopup(null)}
        />
      )}

      {/* Invalid Role Popup */}
      {popup === "invalid_role" && (
        <Popup
          icon="⚠️"
          title="Invalid Role"
          titleClass="text-red-400"
          borderClass="border-red-500/40"
          message="Your account role is not recognized. Please contact the system administrator."
          btnClass="bg-gradient-to-br from-red-600 to-red-900 shadow-[0_4px_20px_rgba(220,50,50,0.4)]"
          onClose={() => setPopup(null)}
        />
      )}

      <style>{`
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shakeIn {
          0%   { transform: translateX(0); }
          25%  { transform: translateX(-6px); }
          50%  { transform: translateX(6px); }
          75%  { transform: translateX(-4px); }
          100% { transform: translateX(0); }
        }
        @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes popIn   { from { opacity: 0; transform: scale(0.85) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
      `}</style>
    </div>
  );
}

function Popup({
  icon,
  title,
  titleClass,
  borderClass = "border-[#e07820]/40",
  message,
  btnClass,
  onClose,
}) {
  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
      style={{ animation: "fadeIn 0.3s ease" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={`bg-[#111f30] border ${borderClass} rounded-2xl p-10 max-w-[380px] w-[90%] text-center
          shadow-[0_24px_60px_rgba(0,0,0,0.6)]`}
        style={{ animation: "popIn 0.4s cubic-bezier(.22,1,.36,1)" }}
      >
        <div className="text-[3.5rem] mb-4">{icon}</div>
        <h2
          className={`font-['Montserrat'] text-xl font-extrabold mb-2.5 ${titleClass}`}
        >
          {title}
        </h2>
        <p className="text-sm text-[#7a9bb8] mb-7 leading-7">{message}</p>
        <button
          onClick={onClose}
          className={`px-9 py-2.5 ${btnClass} text-white font-['Montserrat'] text-sm font-extrabold rounded-lg
            hover:brightness-110 hover:-translate-y-px active:translate-y-0 transition-all duration-200`}
        >
          OK, Got It
        </button>
      </div>
    </div>
  );
}
