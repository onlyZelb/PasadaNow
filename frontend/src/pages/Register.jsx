import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import trikeBg from "../assets/trike.png";

/* ─── Shared tiny components ─────────────────────────────── */

const inputBase =
  "w-full bg-[#0d2035] border border-[#1e4a72] rounded-lg px-3 py-2 text-[#e8f0f8] text-sm placeholder-[#4a7090] outline-none transition-all duration-200";

function TextInput({ focusColor = "blue", ...props }) {
  const focus = {
    blue: "focus:border-[#2878b4] focus:ring-2 focus:ring-[#2878b4]/20",
    orange: "focus:border-[#e07820] focus:ring-2 focus:ring-[#e07820]/20",
  }[focusColor];
  return <input className={`${inputBase} ${focus}`} {...props} />;
}

function PasswordField({
  id,
  name,
  placeholder,
  focusColor,
  show,
  onToggle,
  value,
  onChange,
}) {
  const focus = {
    blue: "focus:border-[#2878b4] focus:ring-2 focus:ring-[#2878b4]/20",
    orange: "focus:border-[#e07820] focus:ring-2 focus:ring-[#e07820]/20",
  }[focusColor];
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        id={id}
        name={name}
        placeholder={placeholder}
        required
        value={value}
        onChange={onChange}
        className={`${inputBase} pr-10 ${focus}`}
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#4a7090] hover:text-[#7a9bb8] transition-colors"
      >
        {show ? (
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        ) : (
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
            <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
        )}
      </button>
    </div>
  );
}

function FieldGroup({ label, children }) {
  return (
    <div className="mb-2 w-full text-left">
      <label className="block text-[0.75rem] font-bold text-[#e8f0f8] mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}

function SectionDivider({ label }) {
  return (
    <div className="w-full flex items-center gap-2.5 my-2 text-[0.6rem] font-bold tracking-[1.5px] uppercase text-[#4a7090]">
      <div className="flex-1 h-px bg-[#1e4a72]" />
      {label}
      <div className="flex-1 h-px bg-[#1e4a72]" />
    </div>
  );
}

function ErrorAlert({ message }) {
  if (!message) return null;
  return (
    <div className="w-full px-3 py-2 mb-2 rounded-lg bg-red-500/10 border border-red-500/35 text-red-400 text-[0.8rem] text-left">
      {message}
    </div>
  );
}

/* ─── Shared page shell ───────────────────────────────────── */

function PageShell({ accentColor, onBack, showBack, children }) {
  const border = {
    none: "border-[#1e4a72]/40",
    blue: "border-[#2878b4]/25",
    orange: "border-[#e07820]/25",
  }[accentColor];

  return (
    <div className="flex h-screen overflow-hidden bg-[#0b1929]">
      <div className="hidden md:flex flex-[0_0_48%] relative overflow-hidden">
        <img
          src={trikeBg}
          alt="PasadaNow tricycle"
          className="w-full h-full object-cover object-top brightness-90 saturate-105"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0b1929]/10 to-[#0b1929]/55" />
      </div>

      <div className="flex-1 flex items-center justify-center bg-[#0f2236] px-8 py-5 overflow-y-auto">
        <div
          className={`w-full max-w-[540px] bg-[#111f30] border ${border} rounded-2xl px-9 py-6
          flex flex-col items-center text-center shadow-[0_20px_60px_rgba(0,0,0,0.6)]
          animate-[cardIn_0.45s_cubic-bezier(.22,1,.36,1)_both]`}
        >
          {showBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-xs text-[#4a7090] hover:text-[#2878b4] transition-colors mb-2 self-start"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
              Back to role selection
            </button>
          )}

          <div className="flex items-center gap-2.5 mb-0.5">
            <img src={logo} alt="Logo" className="w-8 h-8 object-contain" />
            <div className="font-['Montserrat'] text-[1.35rem] font-extrabold leading-none">
              <span className="text-[#2878b4]">Pasada</span>
              <span className="text-[#e07820]">Now</span>
            </div>
          </div>
          <p className="text-[0.62rem] font-bold tracking-[2.5px] uppercase text-[#7a9bb8] mb-3">
            Tricycle Ride Hailing System
          </p>

          {children}
        </div>
      </div>

      <style>{`
        @keyframes cardIn {
          from { opacity:0; transform:translateY(24px); }
          to   { opacity:1; transform:translateY(0); }
        }
      `}</style>
    </div>
  );
}

/* ─── Step 0: Role selection ──────────────────────────────── */

function RoleSelection({ onSelect }) {
  const roles = [
    {
      key: "commuter",
      label: "Commuter",
      desc: "Book rides and travel around the city with ease.",
      border: "border-[#2878b4]/30 hover:border-[#2878b4]",
      badge: "bg-[#2878b4]/10 text-[#2878b4]",
      btn: "bg-gradient-to-br from-[#2878b4] to-[#1a5f9a] shadow-[0_4px_16px_rgba(40,120,180,0.4)]",
      icon: (
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
        </svg>
      ),
    },
    {
      key: "driver",
      label: "Trike Driver",
      desc: "Register your tricycle and start earning today.",
      border: "border-[#e07820]/30 hover:border-[#e07820]",
      badge: "bg-[#e07820]/10 text-[#e07820]",
      btn: "bg-gradient-to-br from-[#e07820] to-[#b85e10] shadow-[0_4px_16px_rgba(224,120,32,0.4)]",
      icon: (
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <circle cx="5" cy="18" r="3" />
          <circle cx="19" cy="18" r="3" />
          <path d="M5 15V9l3-6h8l3 6v6" />
          <path d="M5 15h14" />
        </svg>
      ),
    },
  ];

  return (
    <PageShell accentColor="none" showBack={false}>
      <h1 className="font-['Montserrat'] text-xl font-extrabold text-[#e8f0f8] mb-1">
        Create Account
      </h1>
      <p className="text-[0.82rem] text-[#7a9bb8] mb-6">
        Choose how you want to use PasadaNow
      </p>

      <div className="w-full grid grid-cols-2 gap-4 mb-6">
        {roles.map((r) => (
          <button
            key={r.key}
            onClick={() => onSelect(r.key)}
            className={`flex flex-col items-center gap-3 p-5 bg-[#0d1e2e] border ${r.border}
              rounded-xl transition-all duration-200 hover:bg-[#0f2438] hover:-translate-y-0.5 text-center`}
          >
            <div
              className={`w-14 h-14 rounded-xl ${r.badge} flex items-center justify-center`}
            >
              {r.icon}
            </div>
            <div>
              <p className="font-['Montserrat'] font-extrabold text-[0.95rem] text-[#e8f0f8] mb-1">
                {r.label}
              </p>
              <p className="text-[0.72rem] text-[#7a9bb8] leading-relaxed">
                {r.desc}
              </p>
            </div>
            <span
              className={`w-full py-2 rounded-lg text-white text-[0.8rem] font-bold font-['Montserrat']
              hover:brightness-110 transition-all ${r.btn}`}
            >
              Select
            </span>
          </button>
        ))}
      </div>

      <p className="text-[0.82rem] text-[#7a9bb8]">
        Already have an account?{" "}
        <Link
          to="/login"
          className="text-[#2878b4] font-semibold hover:text-[#e07820] transition-colors"
        >
          Sign in
        </Link>
      </p>
    </PageShell>
  );
}

/* ─── Step 1a: Commuter form ──────────────────────────────── */

function CommuterForm({ onBack }) {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw1, setShowPw1] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [terms, setTerms] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!fullName.trim()) return setError("Full name is required.");
    if (!email.trim()) return setError("Email address is required.");
    if (!username.trim()) return setError("Username is required.");
    if (password !== confirm) return setError("Passwords do not match.");
    if (password.length < 6)
      return setError("Password must be at least 6 characters.");
    if (!terms) return setError("You must agree to the Terms & Conditions.");

    setLoading(true);
    try {
      const res = await fetch("http://localhost:8080/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          username: username.trim(),
          password,
          role: "commuter",
          fullName: fullName.trim(),
          phone: phone.trim(),
          email: email.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        // ── Save user to localStorage so ProtectedRoute & DashboardRouter work ──
        localStorage.setItem(
          "user",
          JSON.stringify({
            username: data.username,
            role: "commuter",
            fullName: fullName.trim(),
            phone: phone.trim(),
            email: email.trim(),
          }),
        );
        navigate("/dashboard");
      } else {
        setError(data.message || "Registration failed. Please try again.");
      }
    } catch {
      setError("Cannot connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell accentColor="blue" onBack={onBack} showBack>
      <div
        className="inline-flex items-center gap-1.5 bg-[#2878b4]/10 border border-[#2878b4]/30
        rounded-full px-3 py-0.5 text-[0.68rem] font-bold uppercase tracking-wide text-[#2878b4] mb-1.5"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
        </svg>
        Commuter
      </div>
      <h1 className="font-['Montserrat'] text-xl font-extrabold text-[#e8f0f8] mb-0.5">
        Create Account
      </h1>
      <p className="text-[0.78rem] text-[#7a9bb8] mb-2">
        Join PasadaNow and ride today!
      </p>

      <ErrorAlert message={error} />

      <form onSubmit={handleSubmit} className="w-full" noValidate>
        <SectionDivider label="Personal Info" />
        <div className="grid grid-cols-2 gap-2 w-full">
          <FieldGroup label="Full Name">
            <TextInput
              focusColor="blue"
              type="text"
              placeholder="Full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </FieldGroup>
          <FieldGroup label="Phone Number">
            <TextInput
              focusColor="blue"
              type="tel"
              placeholder="09xx-xxx-xxxx"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </FieldGroup>
        </div>
        <FieldGroup label="Email Address">
          <TextInput
            focusColor="blue"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </FieldGroup>

        <SectionDivider label="Account Info" />
        <FieldGroup label="Username">
          <TextInput
            focusColor="blue"
            type="text"
            placeholder="Choose a username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </FieldGroup>

        <SectionDivider label="Account Security" />
        <div className="grid grid-cols-2 gap-2 w-full">
          <FieldGroup label="Password">
            <PasswordField
              id="c-pw1"
              name="password"
              placeholder="Password"
              focusColor="blue"
              show={showPw1}
              onToggle={() => setShowPw1((s) => !s)}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </FieldGroup>
          <FieldGroup label="Confirm Password">
            <PasswordField
              id="c-pw2"
              name="confirm_password"
              placeholder="Confirm"
              focusColor="blue"
              show={showPw2}
              onToggle={() => setShowPw2((s) => !s)}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </FieldGroup>
        </div>

        <label className="flex items-center gap-2 mb-2.5 w-full cursor-pointer">
          <input
            type="checkbox"
            checked={terms}
            onChange={(e) => setTerms(e.target.checked)}
            className="w-4 h-4 accent-[#2878b4] cursor-pointer flex-shrink-0"
          />
          <span className="text-[0.78rem] text-[#7a9bb8] text-left">
            I agree to the{" "}
            <a
              href="#"
              className="text-[#2878b4] hover:underline"
              onClick={(e) => e.preventDefault()}
            >
              Terms &amp; Conditions
            </a>
          </span>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 mb-2.5 text-white font-['Montserrat'] text-[0.9rem] font-extrabold rounded-lg
            bg-gradient-to-br from-[#2878b4] to-[#1a5f9a] shadow-[0_4px_20px_rgba(40,120,180,0.4)]
            hover:brightness-110 hover:-translate-y-px active:translate-y-0 transition-all duration-200
            disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Creating account…" : "Create Commuter Account"}
        </button>
      </form>

      <p className="text-[0.8rem] text-[#7a9bb8]">
        Already have an account?{" "}
        <Link
          to="/login"
          className="text-[#2878b4] font-semibold hover:text-[#e07820] transition-colors"
        >
          Sign in
        </Link>
      </p>
    </PageShell>
  );
}

/* ─── Step 1b: Driver form ────────────────────────────────── */

function DriverForm({ onBack }) {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [licenseNo, setLicenseNo] = useState("");
  const [plateNo, setPlateNo] = useState("");
  const [todaNo, setTodaNo] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw1, setShowPw1] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [terms, setTerms] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!fullName.trim()) return setError("Full name is required.");
    if (!email.trim()) return setError("Email address is required.");
    if (!licenseNo.trim())
      return setError("Driver's license number is required.");
    if (!plateNo.trim()) return setError("Tricycle plate number is required.");
    if (!username.trim()) return setError("Username is required.");
    if (password !== confirm) return setError("Passwords do not match.");
    if (password.length < 6)
      return setError("Password must be at least 6 characters.");
    if (!terms) return setError("You must agree to the Terms & Conditions.");

    setLoading(true);
    try {
      const res = await fetch("http://localhost:8080/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          username: username.trim(),
          password,
          role: "driver",
          fullName: fullName.trim(),
          phone: phone.trim(),
          email: email.trim(),
          licenseNo: licenseNo.trim(),
          plateNo: plateNo.trim(),
          todaNo: todaNo.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        // ── Save user to localStorage so ProtectedRoute & DashboardRouter work ──
        localStorage.setItem(
          "user",
          JSON.stringify({
            username: data.username,
            role: "driver",
            fullName: fullName.trim(),
            phone: phone.trim(),
            email: email.trim(),
            licenseNo: licenseNo.trim(),
            plateNo: plateNo.trim(),
            todaNo: todaNo.trim(),
          }),
        );
        navigate("/dashboard");
      } else {
        setError(data.message || "Registration failed. Please try again.");
      }
    } catch {
      setError("Cannot connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell accentColor="orange" onBack={onBack} showBack>
      <div
        className="inline-flex items-center gap-1.5 bg-[#e07820]/10 border border-[#e07820]/35
        rounded-full px-3 py-0.5 text-[0.68rem] font-bold uppercase tracking-wide text-[#e07820] mb-1.5"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="5" cy="18" r="3" />
          <circle cx="19" cy="18" r="3" />
          <path d="M5 15V9l3-6h8l3 6v6" />
          <path d="M5 15h14" />
        </svg>
        Trike Driver
      </div>
      <h1 className="font-['Montserrat'] text-xl font-extrabold text-[#e8f0f8] mb-0.5">
        Driver Registration
      </h1>
      <p className="text-[0.78rem] text-[#7a9bb8] mb-2">
        Register your tricycle and start earning
      </p>

      <ErrorAlert message={error} />

      <form onSubmit={handleSubmit} className="w-full" noValidate>
        <SectionDivider label="Personal Info" />
        <div className="grid grid-cols-2 gap-2 w-full">
          <FieldGroup label="Full Name">
            <TextInput
              focusColor="orange"
              type="text"
              placeholder="Full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </FieldGroup>
          <FieldGroup label="Phone Number">
            <TextInput
              focusColor="orange"
              type="tel"
              placeholder="09xx-xxx-xxxx"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </FieldGroup>
        </div>
        <FieldGroup label="Email Address">
          <TextInput
            focusColor="orange"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </FieldGroup>

        <SectionDivider label="Vehicle &amp; Accreditation" />
        <div className="grid grid-cols-2 gap-2 w-full">
          <FieldGroup label="Driver's License No.">
            <TextInput
              focusColor="orange"
              type="text"
              placeholder="e.g. N01-23-456789"
              value={licenseNo}
              onChange={(e) => setLicenseNo(e.target.value)}
              required
            />
          </FieldGroup>
          <FieldGroup label="Tricycle Plate No.">
            <TextInput
              focusColor="orange"
              type="text"
              placeholder="e.g. ABC 1234"
              value={plateNo}
              onChange={(e) => setPlateNo(e.target.value)}
              required
            />
          </FieldGroup>
        </div>
        <FieldGroup label="TODA Membership / Franchise No.">
          <TextInput
            focusColor="orange"
            type="text"
            placeholder="Enter TODA or franchise number"
            value={todaNo}
            onChange={(e) => setTodaNo(e.target.value)}
          />
        </FieldGroup>

        <SectionDivider label="Account Info" />
        <FieldGroup label="Username">
          <TextInput
            focusColor="orange"
            type="text"
            placeholder="Choose a username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </FieldGroup>

        <SectionDivider label="Account Security" />
        <div className="grid grid-cols-2 gap-2 w-full">
          <FieldGroup label="Password">
            <PasswordField
              id="d-pw1"
              name="password"
              placeholder="Password"
              focusColor="orange"
              show={showPw1}
              onToggle={() => setShowPw1((s) => !s)}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </FieldGroup>
          <FieldGroup label="Confirm Password">
            <PasswordField
              id="d-pw2"
              name="confirm_password"
              placeholder="Confirm"
              focusColor="orange"
              show={showPw2}
              onToggle={() => setShowPw2((s) => !s)}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </FieldGroup>
        </div>

        <label className="flex items-center gap-2 mb-2.5 w-full cursor-pointer">
          <input
            type="checkbox"
            checked={terms}
            onChange={(e) => setTerms(e.target.checked)}
            className="w-4 h-4 accent-[#e07820] cursor-pointer flex-shrink-0"
          />
          <span className="text-[0.78rem] text-[#7a9bb8] text-left">
            I agree to the{" "}
            <a
              href="#"
              className="text-[#e07820] hover:underline"
              onClick={(e) => e.preventDefault()}
            >
              Terms &amp; Conditions
            </a>{" "}
            and Driver Guidelines
          </span>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 mb-2.5 text-white font-['Montserrat'] text-[0.9rem] font-extrabold rounded-lg
            bg-gradient-to-br from-[#e07820] to-[#b85e10] shadow-[0_4px_20px_rgba(224,120,32,0.4)]
            hover:brightness-110 hover:-translate-y-px active:translate-y-0 transition-all duration-200
            disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Registering…" : "Register as Driver"}
        </button>
      </form>

      <p className="text-[0.8rem] text-[#7a9bb8]">
        Already have an account?{" "}
        <Link
          to="/login"
          className="text-[#e07820] font-semibold hover:text-[#2878b4] transition-colors"
        >
          Sign in
        </Link>
      </p>
    </PageShell>
  );
}

/* ─── Main export ─────────────────────────────────────────── */

export default function Register() {
  const [step, setStep] = useState("select");
  if (step === "commuter")
    return <CommuterForm onBack={() => setStep("select")} />;
  if (step === "driver") return <DriverForm onBack={() => setStep("select")} />;
  return <RoleSelection onSelect={setStep} />;
}
