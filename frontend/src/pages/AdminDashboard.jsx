import { useState, useEffect, useRef } from "react";
import logo from "../assets/logo.png";
import { useAuth } from "../hooks/useAuth";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
);

// ─── Config ───────────────────────────────────────────────────────────────────
const DJANGO_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

// ─── Helper ───────────────────────────────────────────────────────────────────
function authFetch(url, options = {}) {
  return fetch(url, {
    ...options,
    credentials: "omit",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(options.headers || {}),
    },
  });
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const Icon = ({ name, size = 16 }) => {
  const icons = {
    grid: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
    clock: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15.5 14" />
      </svg>
    ),
    users: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    tricycle: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="5" cy="17" r="2.5" /><circle cx="17" cy="17" r="2.5" />
        <path d="M5 17H3V9l4-4h7l3 5 2 1v6h-2" /><path d="M9 5v6h8" />
      </svg>
    ),
    logout: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
      </svg>
    ),
    check: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
    x: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    ),
    refresh: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
      </svg>
    ),
    fare: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="16" y2="6" /><line x1="8" y1="10" x2="16" y2="10" />
        <path d="M8 6v12" /><path d="M8 10c0 0 8 0 8-4s-8-4-8-4" />
      </svg>
    ),
    bell: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
    shield: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    zap: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
  };
  return icons[name] || null;
};

// ─── Nav config ───────────────────────────────────────────────────────────────
const NAV = [
  { id: "overview",  label: "Overview",       icon: "grid",     accent: "#60a5fa" },
  { id: "trips",     label: "Trip Records",    icon: "clock",    accent: "#a78bfa" },
  { id: "commuters", label: "Commuters",       icon: "users",    accent: "#34d399" },
  { id: "drivers",   label: "Partner Drivers", icon: "tricycle", accent: "#fb923c" },
  { id: "fare",      label: "Fare Settings",   icon: "fare",     accent: "#4ade80" },
];

const TITLES = {
  overview:  "Command Center",
  drivers:   "Partner Drivers",
  commuters: "Commuters",
  trips:     "Trip Records",
  fare:      "Fare Settings",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getDisplayName(u) { return u?.full_name || u?.fullName || u?.name || u?.username || "?"; }
function getPhone(u) { return u?.phone || u?.contact_no || u?.contactNo || u?.contact_number || "—"; }
function getPlateNo(u) { return u?.plate_no || u?.plate_number || u?.plateNo || u?.plateNumber || null; }
function getLicenseNo(u) { return u?.license_no || u?.license_number || u?.licenseNo || null; }
function getOrganization(u) { return u?.toda_no || u?.organization || u?.todaNo || u?.branch || null; }
function getAddress(u) { return u?.address || u?.home_address || u?.homeAddress || null; }
function getAge(u) { return u?.age || null; }
function isDriverOnline(d) {
  if (typeof d.is_online === "boolean") return d.is_online;
  if (d.is_online === 1 || d.is_online === "1" || d.is_online === "true") return true;
  if (d.is_available === "1" || d.is_available === 1) return true;
  return false;
}
function getTripOrigin(t) { return t?.pickup_location || t?.origin || "—"; }
function getTripDestination(t) { return t?.destination || "—"; }
function ini(n) {
  const p = (n || "?").trim().split(" ");
  return (p[0][0] + (p[1] ? p[1][0] : "")).toUpperCase();
}
function fmtP(n) {
  return "₱" + Number(n || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 });
}
function fmtD(s) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}
function fmtDT(s) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// ─── Monthly data helpers ─────────────────────────────────────────────────────
const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function getLastNMonths(n = 6) {
  const result = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push({ label: `${MONTH_LABELS[d.getMonth()]} ${d.getFullYear()}`, year: d.getFullYear(), month: d.getMonth() });
  }
  return result;
}

function buildMonthlyUsers(users, months) {
  const drivers   = months.map(() => 0);
  const commuters = months.map(() => 0);
  users.forEach((u) => {
    if (!u.created_at) return;
    const d = new Date(u.created_at);
    months.forEach((m, i) => {
      if (d.getFullYear() === m.year && d.getMonth() === m.month) {
        if (u.role === "driver")   drivers[i]++;
        if (u.role === "commuter") commuters[i]++;
      }
    });
  });
  return { drivers, commuters };
}

function buildMonthlyRevenue(trips, months) {
  return months.map((m) =>
    trips
      .filter((t) => {
        if (t.status !== "completed" || !t.created_at) return false;
        const d = new Date(t.created_at);
        return d.getFullYear() === m.year && d.getMonth() === m.month;
      })
      .reduce((sum, t) => sum + Number(t.fare || 0), 0)
  );
}

function useClock() {
  const [clock, setClock] = useState("");
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const D = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
      const M = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      let h = now.getHours();
      const ap = h >= 12 ? "PM" : "AM";
      h = h % 12 || 12;
      setClock(`${D[now.getDay()]}, ${M[now.getMonth()]} ${now.getDate()} · ${h}:${String(now.getMinutes()).padStart(2,"0")}:${String(now.getSeconds()).padStart(2,"0")} ${ap}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return clock;
}

async function callVerify(uid, role, newStatus, setUsers, setModalId) {
  try {
    const res = await authFetch(`${DJANGO_URL}/api/admin/users/${uid}/verify`, {
      method: "PATCH",
      body: JSON.stringify({ role, action: newStatus }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    setUsers((prev) =>
      prev.map((u) =>
        u.id === uid && u.role === role ? { ...u, status: newStatus, verified_status: newStatus } : u
      )
    );
    setModalId(null);
  } catch (e) {
    console.error("Verify failed:", e);
    alert("Could not update status.");
  }
}

function toImgSrc(val) {
  if (!val) return null;
  if (typeof val !== "string") return null;
  if (val.startsWith("data:")) return val;
  if (val.startsWith("http://") || val.startsWith("https://")) return val;
  if (val.length < 100) return null;
  return `data:image/jpeg;base64,${val}`;
}

// ─── Notification Panel ───────────────────────────────────────────────────────
function NotificationPanel({ users, trips, onClose }) {
  const pendingDrivers   = users.filter((u) => u.role === "driver"   && u.status === "pending");
  const pendingCommuters = users.filter((u) => u.role === "commuter" && u.status === "pending");
  const recentTrips      = trips.filter((t) => t.status === "active").slice(0, 3);

  const notifications = [
    ...pendingDrivers.map((d) => ({
      id: `driver-${d.id}`,
      type: "warning",
      icon: "tricycle",
      title: "Driver pending review",
      desc: getDisplayName(d) + " awaiting verification",
      time: fmtD(d.created_at),
      color: "#fb923c",
      bg: "rgba(251,146,60,.08)",
      border: "rgba(251,146,60,.2)",
    })),
    ...pendingCommuters.map((c) => ({
      id: `commuter-${c.id}`,
      type: "info",
      icon: "users",
      title: "New commuter registered",
      desc: getDisplayName(c) + " joined the platform",
      time: fmtD(c.created_at),
      color: "#60a5fa",
      bg: "rgba(96,165,250,.08)",
      border: "rgba(96,165,250,.2)",
    })),
    ...recentTrips.map((t) => ({
      id: `trip-${t.id}`,
      type: "active",
      icon: "zap",
      title: "Active trip in progress",
      desc: `Trip #${t.id} · ${getTripOrigin(t)} → ${getTripDestination(t)}`,
      time: fmtDT(t.created_at),
      color: "#4ade80",
      bg: "rgba(74,222,128,.08)",
      border: "rgba(74,222,128,.2)",
    })),
  ];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300 }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "absolute", top: 52, right: 16,
          width: 340, maxHeight: "70vh",
          background: "linear-gradient(145deg,#0e1f33,#091828)",
          border: "1px solid rgba(60,110,160,.25)",
          borderRadius: 16, overflow: "hidden",
          boxShadow: "0 24px 60px rgba(0,0,0,.7), 0 0 0 1px rgba(96,165,250,.05)",
          display: "flex", flexDirection: "column",
        }}
      >
        <div style={{ padding: "14px 16px 12px", borderBottom: "1px solid rgba(60,110,160,.12)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(96,165,250,.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#60a5fa" }}>
              <Icon name="bell" size={13} />
            </div>
            <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#cce0f5" }}>Notifications</span>
            {notifications.length > 0 && (
              <span style={{ background: "linear-gradient(135deg,#3b82f6,#2563eb)", color: "#fff", fontSize: "0.5rem", fontWeight: 800, padding: "2px 7px", borderRadius: 20 }}>{notifications.length}</span>
            )}
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(60,110,160,.15)", borderRadius: 6, color: "#3a5a7a", cursor: "pointer", width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="x" size={12} />
          </button>
        </div>
        <div style={{ overflowY: "auto", flex: 1 }}>
          {notifications.length === 0 ? (
            <div style={{ padding: "40px 20px", textAlign: "center" }}>
              <div style={{ fontSize: "0.7rem", color: "#2a4a6a" }}>No new notifications</div>
            </div>
          ) : (
            notifications.map((n) => (
              <div key={n.id} style={{ padding: "11px 16px", borderBottom: "1px solid rgba(60,110,160,.06)", display: "flex", gap: 11, alignItems: "flex-start", background: "transparent", transition: "background .15s", cursor: "default" }}
                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,.02)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              >
                <div style={{ width: 30, height: 30, borderRadius: 8, background: n.bg, border: `1px solid ${n.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: n.color, flexShrink: 0, marginTop: 1 }}>
                  <Icon name={n.icon} size={13} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "#cce0f5", marginBottom: 2 }}>{n.title}</div>
                  <div style={{ fontSize: "0.65rem", color: "#4a6a88", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{n.desc}</div>
                  <div style={{ fontSize: "0.58rem", color: "#2a3a52", marginTop: 4 }}>{n.time}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Shared Components ────────────────────────────────────────────────────────
function Avatar({ name, role, size = 32 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.3 + "px", fontWeight: 700, color: "#fff", flexShrink: 0,
      background: role === "driver"
        ? "linear-gradient(135deg,#f97316,#c2410c)"
        : "linear-gradient(135deg,#3b82f6,#1d4ed8)",
    }}>
      {ini(name)}
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    completed: { bg: "rgba(74,222,128,.08)",  color: "#4ade80", dot: "#4ade80", border: "rgba(74,222,128,.2)"  },
    pending:   { bg: "rgba(250,204,21,.08)",  color: "#facc15", dot: "#facc15", border: "rgba(250,204,21,.2)"  },
    cancelled: { bg: "rgba(248,113,113,.08)", color: "#f87171", dot: "#f87171", border: "rgba(248,113,113,.2)" },
    active:    { bg: "rgba(96,165,250,.08)",  color: "#60a5fa", dot: "#60a5fa", border: "rgba(96,165,250,.2)"  },
    verified:  { bg: "rgba(74,222,128,.08)",  color: "#4ade80", dot: "#4ade80", border: "rgba(74,222,128,.2)"  },
    rejected:  { bg: "rgba(248,113,113,.08)", color: "#f87171", dot: "#f87171", border: "rgba(248,113,113,.2)" },
  };
  const c = map[status] || map.active;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 9px", borderRadius: 20, fontSize: "0.58rem", fontWeight: 700, background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: c.dot, flexShrink: 0 }} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function StatCard({ icon, value, label, color = "blue" }) {
  const colors = {
    blue:   { icon: "rgba(59,130,246,.12)",  iconColor: "#60a5fa" },
    green:  { icon: "rgba(74,222,128,.1)",   iconColor: "#4ade80" },
    orange: { icon: "rgba(251,146,60,.1)",   iconColor: "#fb923c" },
    yellow: { icon: "rgba(250,204,21,.1)",   iconColor: "#facc15" },
    red:    { icon: "rgba(248,113,113,.1)",  iconColor: "#f87171" },
    purple: { icon: "rgba(192,132,252,.1)",  iconColor: "#c084fc" },
  };
  const c = colors[color] || colors.blue;
  return (
    <div style={ds.statCard}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", background: c.icon, color: c.iconColor }}>
          <Icon name={icon} size={17} />
        </div>
      </div>
      <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#d4e8ff", marginBottom: 3, letterSpacing: "-.3px" }}>{value}</div>
      <div style={{ fontSize: "0.54rem", textTransform: "uppercase", letterSpacing: "1.8px", color: "#2a4a6a", fontWeight: 700 }}>{label}</div>
    </div>
  );
}

function EmptyState({ icon, title, desc }) {
  return (
    <div style={{ textAlign: "center", padding: "60px 20px" }}>
      <div style={{ fontSize: 40, marginBottom: 14, opacity: 0.4 }}><Icon name={icon} size={40} /></div>
      <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "#3a5a7a", marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: "0.75rem", color: "#1e3a52" }}>{desc}</div>
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div style={{ background: "rgba(0,0,0,.25)", border: "1px solid rgba(60,110,160,.1)", borderRadius: 8, padding: "9px 11px" }}>
      <div style={{ fontSize: "0.54rem", fontWeight: 700, textTransform: "uppercase", color: "#1e5a8a", letterSpacing: "1.2px", marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: "0.77rem", fontWeight: 600, color: "#cce0f5" }}>{value || "—"}</div>
    </div>
  );
}

function reviewBtnStyle(status) {
  const pending = status === "pending";
  return {
    padding: "4px 13px",
    background: pending ? "rgba(251,146,60,.06)" : "rgba(255,255,255,.04)",
    border: `1px solid ${pending ? "rgba(251,146,60,.3)" : "rgba(60,110,160,.18)"}`,
    borderRadius: 7,
    color: pending ? "#fb923c" : "#8ab4d4",
    fontSize: "0.63rem", fontWeight: 700, cursor: "pointer",
  };
}

function CredentialPhoto({ label, value }) {
  const [expanded, setExpanded] = useState(false);
  const [failed, setFailed] = useState(false);
  const src = toImgSrc(value);
  const showImage = src && !failed;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ fontSize: "0.54rem", fontWeight: 700, textTransform: "uppercase", color: "#1e5a8a", letterSpacing: "1.2px" }}>{label}</div>
      {showImage ? (
        <>
          <div onClick={() => setExpanded(true)} style={{ width: "100%", aspectRatio: "4/3", borderRadius: 8, overflow: "hidden", cursor: "zoom-in", position: "relative", border: "1px solid rgba(60,110,160,.18)", background: "rgba(0,0,0,.35)" }}>
            <img src={src} alt={label} onError={() => setFailed(true)} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          </div>
          {expanded && (
            <div onClick={() => setExpanded(false)} style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,.93)", backdropFilter: "blur(8px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, cursor: "zoom-out" }}>
              <div style={{ fontSize: "0.62rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "2px", color: "#3a5a7a", marginBottom: 16 }}>{label}</div>
              <img src={src} alt={label} style={{ maxWidth: "88vw", maxHeight: "80vh", objectFit: "contain", borderRadius: 10, boxShadow: "0 30px 80px rgba(0,0,0,.9)" }} />
              <div style={{ marginTop: 16, fontSize: "0.63rem", color: "#2a4a6a" }}>click anywhere to close</div>
            </div>
          )}
        </>
      ) : (
        <div style={{ width: "100%", aspectRatio: "4/3", borderRadius: 8, border: "1px dashed rgba(60,110,160,.18)", background: "rgba(0,0,0,.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", color: "#1e3a52" }}>
          {failed ? "Failed to load" : "Not uploaded"}
        </div>
      )}
    </div>
  );
}

function FField({ label, field, unit, hint, value, onChange }) {
  return (
    <div style={{ background: "rgba(0,0,0,.28)", border: "1px solid rgba(60,110,160,.14)", borderRadius: 10, padding: "13px 15px" }}>
      <div style={{ fontSize: "0.52rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.6px", color: "#1e5a8a", marginBottom: 7 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {unit && <span style={{ color: "#4ade80", fontWeight: 800, fontSize: "0.9rem", minWidth: 14, flexShrink: 0 }}>{unit}</span>}
        <input
          type="number" min="0" step="0.01" value={value}
          onChange={(e) => onChange(field, e.target.value)}
          style={{ flex: 1, background: "rgba(255,255,255,.04)", border: "1px solid rgba(60,110,160,.2)", borderRadius: 7, padding: "8px 10px", color: "#d4e8ff", fontSize: "0.88rem", fontWeight: 700, fontFamily: "inherit", outline: "none", WebkitAppearance: "none" }}
        />
      </div>
      {hint && <div style={{ fontSize: "0.58rem", color: "#2a4a6a", marginTop: 5 }}>{hint}</div>}
    </div>
  );
}

const chartBaseOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: "rgba(7,17,31,.95)",
      borderColor: "rgba(60,110,160,.3)",
      borderWidth: 1,
      titleColor: "#8ab4d4",
      bodyColor: "#cce0f5",
      padding: 10,
      cornerRadius: 8,
    },
  },
  scales: {
    x: {
      ticks: { color: "#3a5a7a", font: { size: 10 } },
      grid: { color: "rgba(60,110,160,.06)" },
    },
    y: {
      ticks: { color: "#3a5a7a", font: { size: 10 } },
      grid: { color: "rgba(60,110,160,.06)" },
      beginAtZero: true,
    },
  },
};

// ─── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewView({ users, trips, onRefresh, refreshing }) {
  const drivers   = users.filter((u) => u.role === "driver");
  const commuters = users.filter((u) => u.role === "commuter");
  const completed = trips.filter((t) => t.status === "completed");
  const revenue   = completed.reduce((a, t) => a + Number(t.fare || 0), 0);
  const months        = getLastNMonths(6);
  const monthLabels   = months.map((m) => m.label);
  const { drivers: driversByMonth, commuters: commutersByMonth } = buildMonthlyUsers(users, months);
  const revenueByMonth = buildMonthlyRevenue(trips, months);

  const monthlyUsersData = {
    labels: monthLabels,
    datasets: [
      { label: "Commuters", data: commutersByMonth, backgroundColor: "rgba(96,165,250,.7)", borderColor: "#60a5fa", borderWidth: 1, borderRadius: 5 },
      { label: "Drivers",   data: driversByMonth,   backgroundColor: "rgba(249,115,22,.7)",  borderColor: "#f97316",  borderWidth: 1, borderRadius: 5 },
    ],
  };

  const monthlyRevenueData = {
    labels: monthLabels,
    datasets: [{
      label: "Revenue (₱)", data: revenueByMonth,
      borderColor: "#fb923c", backgroundColor: "rgba(251,146,60,.12)",
      borderWidth: 2, pointBackgroundColor: "#fb923c", pointBorderColor: "#fb923c",
      pointRadius: 4, pointHoverRadius: 6, tension: 0.4, fill: true,
    }],
  };

  const usersChartOptions = {
    ...chartBaseOptions,
    plugins: {
      ...chartBaseOptions.plugins,
      legend: { display: true, labels: { color: "#5a8ab0", font: { size: 10 }, boxWidth: 10, boxHeight: 10, borderRadius: 3 } },
      tooltip: { ...chartBaseOptions.plugins.tooltip, callbacks: { label: (ctx) => ` ${ctx.dataset.label}: ${ctx.parsed.y}` } },
    },
  };

  const revenueChartOptions = {
    ...chartBaseOptions,
    plugins: { ...chartBaseOptions.plugins, tooltip: { ...chartBaseOptions.plugins.tooltip, callbacks: { label: (ctx) => ` Revenue: ${fmtP(ctx.parsed.y)}` } } },
    scales: { ...chartBaseOptions.scales, y: { ...chartBaseOptions.scales.y, ticks: { ...chartBaseOptions.scales.y.ticks, callback: (v) => "₱" + Number(v).toLocaleString("en-PH") } } },
  };

  const refreshBtnBase = { padding: "4px 12px", borderRadius: 7, fontSize: "0.6rem", fontWeight: 700, cursor: refreshing ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 5, border: "none" };

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 14 }}>
        <StatCard icon="clock"    value={trips.length}     label="Total Bookings"  color="blue"   />
        <StatCard icon="tricycle" value={drivers.length}   label="Active Drivers"  color="green"  />
        <StatCard icon="users"    value={commuters.length} label="Total Commuters" color="purple" />
        <StatCard icon="check"    value={fmtP(revenue)}    label="Total Revenue"   color="orange" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
        <div style={ds.tableCard}>
          <div style={ds.tcHead}>
            <div style={ds.tcTitle}><span style={ds.dotPulse} />Monthly Active Users</div>
            <button onClick={onRefresh} disabled={refreshing} style={{ ...refreshBtnBase, background: "rgba(59,130,246,.08)", border: "1px solid rgba(59,130,246,.22)", color: refreshing ? "#2a4a6a" : "#60a5fa" }}>
              <Icon name="refresh" size={11} />{refreshing ? "Refreshing…" : "Refresh"}
            </button>
          </div>
          <div style={{ padding: "12px 16px 14px" }}>
            <div style={{ position: "relative", height: 200 }}><Bar data={monthlyUsersData} options={usersChartOptions} /></div>
            <div style={{ display: "flex", gap: 16, marginTop: 10 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.62rem", color: "#5a8ab0" }}><span style={{ width: 8, height: 8, borderRadius: 2, background: "#60a5fa", display: "inline-block" }} />Commuters <strong style={{ color: "#8ab4d4" }}>{commuters.length}</strong></span>
              <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.62rem", color: "#5a8ab0" }}><span style={{ width: 8, height: 8, borderRadius: 2, background: "#f97316", display: "inline-block" }} />Drivers <strong style={{ color: "#8ab4d4" }}>{drivers.length}</strong></span>
            </div>
          </div>
        </div>
        <div style={ds.tableCard}>
          <div style={ds.tcHead}>
            <div style={ds.tcTitle}><span style={{ ...ds.dotPulse, background: "#fb923c" }} />Monthly Revenue</div>
            <button onClick={onRefresh} disabled={refreshing} style={{ ...refreshBtnBase, background: "rgba(251,146,60,.08)", border: "1px solid rgba(251,146,60,.22)", color: refreshing ? "#2a4a6a" : "#fb923c" }}>
              <Icon name="refresh" size={11} />{refreshing ? "Refreshing…" : "Refresh"}
            </button>
          </div>
          <div style={{ padding: "12px 16px 14px" }}>
            <div style={{ position: "relative", height: 200 }}><Line data={monthlyRevenueData} options={revenueChartOptions} /></div>
            <div style={{ display: "flex", gap: 16, marginTop: 10 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.62rem", color: "#5a8ab0" }}><span style={{ width: 8, height: 8, borderRadius: 2, background: "#fb923c", display: "inline-block" }} />Total Revenue <strong style={{ color: "#fb923c" }}>{fmtP(revenue)}</strong></span>
              <span style={{ fontSize: "0.62rem", color: "#3a5a7a" }}>from {completed.length} completed trip{completed.length !== 1 ? "s" : ""}</span>
            </div>
          </div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr .4fr", gap: 10 }}>
        <div style={ds.tableCard}>
          <div style={ds.tcHead}><div style={ds.tcTitle}><span style={ds.dotPulse} />Recent Trips</div></div>
          {trips.length === 0 ? (
            <EmptyState icon="clock" title="No trips yet" desc="Trip records will appear here once bookings are made." />
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr>{["Trip ID","Commuter","Driver","Route","Fare","Status"].map((h) => <th key={h} style={ds.th}>{h}</th>)}</tr></thead>
                <tbody>
                  {trips.slice(0, 5).map((t) => (
                    <tr key={t.id} style={ds.tr}>
                      <td style={ds.td}><span style={ds.tripId}>#{t.id}</span></td>
                      <td style={{ ...ds.td, color: "#cce0f5", fontWeight: 500 }}>{t.commuter_name}</td>
                      <td style={{ ...ds.td, color: "#8ab4d4" }}>{t.driver_name}</td>
                      <td style={{ ...ds.td, fontSize: "0.68rem", color: "#5a8ab0" }}>{getTripOrigin(t)} → {getTripDestination(t)}</td>
                      <td style={{ ...ds.td, color: "#4ade80", fontWeight: 700 }}>{fmtP(t.fare)}</td>
                      <td style={ds.td}><StatusBadge status={t.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div style={{ ...ds.tableCard, padding: 14 }}>
          <div style={ds.tcTitle}><span style={ds.dotPulse} />Fleet Summary</div>
          <div style={{ borderTop: "1px solid rgba(60,110,160,.08)", marginTop: 12, paddingTop: 10 }}>
            {[
              ["Total Drivers",   drivers.length,                                       null],
              ["Total Commuters", commuters.length,                                     null],
              ["Total Bookings",  trips.length,                                         null],
              ["Verified Users",  users.filter((u) => u.status === "verified").length,  "#4ade80"],
              ["Total Revenue",   fmtP(revenue),                                        "#fb923c"],
            ].map(([l, v, col]) => (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(60,110,160,.05)", fontSize: "0.73rem", color: "#3a5a7a" }}>
                <span>{l}</span><span style={{ fontWeight: 700, color: col || "#aec8e0" }}>{v}</span>
              </div>
            ))}
          </div>
          {users.filter((u) => u.status === "pending").length > 0 && (
            <div style={{ marginTop: 14, padding: "10px 12px", background: "rgba(251,146,60,.06)", border: "1px solid rgba(251,146,60,.18)", borderRadius: 9 }}>
              <div style={{ fontSize: "0.56rem", fontWeight: 700, textTransform: "uppercase", color: "#fb923c", letterSpacing: "1.2px" }}>⚠ Pending Action</div>
              <div style={{ fontSize: "0.72rem", color: "#ffd699", marginTop: 3 }}>
                {users.filter((u) => u.status === "pending").length} user{users.filter((u) => u.status === "pending").length !== 1 ? "s" : ""} awaiting verification
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Trips Tab ────────────────────────────────────────────────────────────────
const PER = 8;

function TripsView({ trips }) {
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const filtered = trips.filter((t) => filter === "all" || t.status === filter);
  const total = Math.max(1, Math.ceil(filtered.length / PER));
  const cur = Math.min(page, total);
  const rows = filtered.slice((cur - 1) * PER, cur * PER);
  const revenue = trips.filter((t) => t.status === "completed").reduce((a, t) => a + Number(t.fare || 0), 0);
  const statuses = ["all", "completed", "active", "pending", "cancelled"];
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10, marginBottom: 14 }}>
        <StatCard icon="grid"  value={trips.length}                                         label="Total Trips" color="blue"   />
        <StatCard icon="check" value={trips.filter((t) => t.status === "completed").length} label="Completed"   color="green"  />
        <StatCard icon="clock" value={trips.filter((t) => t.status === "active").length}    label="Active"      color="blue"   />
        <StatCard icon="clock" value={trips.filter((t) => t.status === "pending").length}   label="Pending"     color="yellow" />
        <StatCard icon="x"     value={trips.filter((t) => t.status === "cancelled").length} label="Cancelled"   color="red"    />
      </div>
      {trips.length > 0 && (
        <div style={{ background: "rgba(251,146,60,.06)", border: "1px solid rgba(251,146,60,.18)", borderRadius: 12, padding: "14px 20px", marginBottom: 14 }}>
          <div style={{ fontSize: "0.56rem", fontWeight: 700, textTransform: "uppercase", color: "#b06030", letterSpacing: "1.5px", marginBottom: 4 }}>Total Revenue · Completed Trips</div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#fb923c", letterSpacing: "-.5px" }}>{fmtP(revenue)}</div>
        </div>
      )}
      <div style={ds.tableCard}>
        <div style={{ ...ds.tcHead, flexWrap: "wrap", gap: 8 }}>
          <div style={ds.tcTitle}><span style={ds.dotPulse} />All Trips</div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {statuses.map((st) => (
              <button key={st} onClick={() => { setFilter(st); setPage(1); }} style={{ ...ds.pill, ...(filter === st ? ds.pillActive : {}) }}>
                {st.charAt(0).toUpperCase() + st.slice(1)}
              </button>
            ))}
          </div>
        </div>
        {trips.length === 0 ? (
          <EmptyState icon="clock" title="No trip records" desc="All bookings will be listed here." />
        ) : (
          <>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr>{["Trip ID","Commuter","Driver","Origin","Destination","Fare","Date","Status"].map((h) => <th key={h} style={ds.th}>{h}</th>)}</tr></thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr><td colSpan="8" style={{ textAlign: "center", padding: "40px", color: "#1e3a52", fontSize: "0.78rem" }}>No trips match this filter.</td></tr>
                  ) : (
                    rows.map((t) => (
                      <tr key={t.id} style={ds.tr}>
                        <td style={ds.td}><span style={ds.tripId}>#{t.id}</span></td>
                        <td style={{ ...ds.td, color: "#cce0f5", fontWeight: 500 }}>{t.commuter_name}</td>
                        <td style={{ ...ds.td, color: "#8ab4d4" }}>{t.driver_name}</td>
                        <td style={{ ...ds.td, fontSize: "0.7rem", color: "#8ab4d4" }}>{getTripOrigin(t)}</td>
                        <td style={{ ...ds.td, fontSize: "0.7rem" }}>{getTripDestination(t)}</td>
                        <td style={{ ...ds.td, color: "#4ade80", fontWeight: 700 }}>{fmtP(t.fare)}</td>
                        <td style={{ ...ds.td, fontSize: "0.65rem", color: "#5a8ab0" }}>{fmtDT(t.created_at)}</td>
                        <td style={ds.td}><StatusBadge status={t.status} /></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {total > 1 && (
              <div style={ds.pager}>
                <span style={{ fontSize: "0.62rem", color: "#1e3a52" }}>{filtered.length} records · page {cur}/{total}</span>
                <div style={{ display: "flex", gap: 3 }}>
                  <button style={ds.pgBtn} disabled={cur <= 1} onClick={() => setPage((p) => p - 1)}>‹ Prev</button>
                  <button style={ds.pgBtn} disabled={cur >= total} onClick={() => setPage((p) => p + 1)}>Next ›</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

function CommutterModal({ user, onClose }) {
  const name = getDisplayName(user);
  return (
    <div onClick={(e) => e.target === e.currentTarget && onClose()} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.85)", backdropFilter: "blur(5px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "linear-gradient(145deg,#0e1f33,#0a1724)", border: "1px solid rgba(60,110,160,.22)", borderRadius: 16, width: "100%", maxWidth: 500, maxHeight: "90vh", overflowY: "auto", padding: 26, boxShadow: "0 40px 100px rgba(0,0,0,.8)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, paddingBottom: 14, borderBottom: "1px solid rgba(60,110,160,.12)" }}>
          <div style={{ fontSize: "0.98rem", fontWeight: 700, color: "#d4e8ff" }}>Commuter Details</div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(60,110,160,.18)", borderRadius: 8, color: "#3a5a7a", cursor: "pointer", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="x" size={14} />
          </button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 13, marginBottom: 18, padding: "13px 14px", background: "rgba(255,255,255,.025)", border: "1px solid rgba(60,110,160,.12)", borderRadius: 11 }}>
          {toImgSrc(user.profile_photo) ? (
            <img src={toImgSrc(user.profile_photo)} alt="Profile" onError={(e) => { e.currentTarget.style.display = "none"; }} style={{ width: 46, height: 46, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "2px solid rgba(59,130,246,.4)" }} />
          ) : <Avatar name={name} role="commuter" size={46} />}
          <div>
            <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "#e2f0ff", marginBottom: 5 }}>{name}</div>
            <StatusBadge status={user.status} />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <InfoItem label="Username" value={user.username} />
          <InfoItem label="Full Name" value={getDisplayName(user)} />
          <InfoItem label="Email" value={user.email} />
          <InfoItem label="Phone" value={getPhone(user)} />
          <InfoItem label="Age" value={getAge(user)} />
          <InfoItem label="Address" value={getAddress(user)} />
          <InfoItem label="Joined" value={fmtD(user.created_at)} />
          <InfoItem label="Status" value={user.status} />
        </div>
      </div>
    </div>
  );
}

function CommutersView({ users, setUsers }) {
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [modalId, setModalId] = useState(null);
  const commuters = users.filter((u) => u.role === "commuter");
  const filtered = commuters.filter((c) => filter === "all" || c.status === filter);
  const total = Math.max(1, Math.ceil(filtered.length / PER));
  const cur = Math.min(page, total);
  const rows = filtered.slice((cur - 1) * PER, cur * PER);
  const modalUser = users.find((u) => u.id === modalId && u.role === "commuter");
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 14 }}>
        <StatCard icon="users" value={commuters.length}                                         label="Total Commuters" color="blue"   />
        <StatCard icon="clock" value={commuters.filter((c) => c.status === "pending").length}   label="Pending"         color="yellow" />
        <StatCard icon="check" value={commuters.filter((c) => c.status === "verified").length}  label="Verified"        color="green"  />
        <StatCard icon="x"     value={commuters.filter((c) => c.status === "rejected").length}  label="Rejected"        color="red"    />
      </div>
      <div style={ds.tableCard}>
        <div style={{ ...ds.tcHead, flexWrap: "wrap", gap: 8 }}>
          <div style={ds.tcTitle}><span style={ds.dotPulse} />Commuter Registry</div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {["all","pending","verified","rejected"].map((st) => (
              <button key={st} onClick={() => { setFilter(st); setPage(1); }} style={{ ...ds.pill, ...(filter === st ? ds.pillActive : {}) }}>
                {st.charAt(0).toUpperCase() + st.slice(1)}
                <span style={{ marginLeft: 4, background: "rgba(255,255,255,.06)", padding: "1px 5px", borderRadius: 10, fontSize: "0.55rem" }}>
                  {st === "all" ? commuters.length : commuters.filter((c) => c.status === st).length}
                </span>
              </button>
            ))}
          </div>
        </div>
        {commuters.length === 0 ? (
          <EmptyState icon="users" title="No commuters yet" desc="Registered commuters will appear here." />
        ) : (
          <>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr>{["#","Name","Username","Email","Phone","Age","Address","Status","Joined","Action"].map((h) => <th key={h} style={ds.th}>{h}</th>)}</tr></thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr><td colSpan="10" style={{ textAlign: "center", padding: "40px", color: "#1e3a52", fontSize: "0.78rem" }}>No commuters match this filter.</td></tr>
                  ) : (
                    rows.map((c) => {
                      const name = getDisplayName(c);
                      return (
                        <tr key={`commuter-${c.id}`} style={ds.tr}>
                          <td style={{ ...ds.td, fontSize: "0.65rem", color: "#3a5a7a" }}>#{c.id}</td>
                          <td style={ds.td}>
                            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                              {toImgSrc(c.profile_photo) ? (
                                <img src={toImgSrc(c.profile_photo)} alt={name} onError={(e) => { e.currentTarget.style.display = "none"; }} style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "2px solid rgba(59,130,246,.3)" }} />
                              ) : <Avatar name={name} role="commuter" />}
                              <span style={{ color: "#cce0f5", fontWeight: 500 }}>{name}</span>
                            </div>
                          </td>
                          <td style={{ ...ds.td, fontSize: "0.7rem", color: "#5a8ab0" }}>{c.username || "—"}</td>
                          <td style={{ ...ds.td, fontSize: "0.72rem", color: "#8ab4d4" }}>{c.email || "—"}</td>
                          <td style={{ ...ds.td, fontSize: "0.72rem" }}>{getPhone(c)}</td>
                          <td style={{ ...ds.td, fontSize: "0.72rem", color: "#8ab4d4" }}>{getAge(c) || "—"}</td>
                          <td style={{ ...ds.td, maxWidth: 130, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "0.72rem", color: "#8ab4d4" }}>{getAddress(c) || "—"}</td>
                          <td style={ds.td}><StatusBadge status={c.status} /></td>
                          <td style={{ ...ds.td, fontSize: "0.65rem", color: "#5a8ab0" }}>{fmtD(c.created_at)}</td>
                          <td style={ds.td}><button onClick={() => setModalId(c.id)} style={reviewBtnStyle(c.status)}>View</button></td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            {total > 1 && (
              <div style={ds.pager}>
                <span style={{ fontSize: "0.62rem", color: "#1e3a52" }}>{filtered.length} records · page {cur}/{total}</span>
                <div style={{ display: "flex", gap: 3 }}>
                  <button style={ds.pgBtn} disabled={cur <= 1} onClick={() => setPage((p) => p - 1)}>‹ Prev</button>
                  <button style={ds.pgBtn} disabled={cur >= total} onClick={() => setPage((p) => p + 1)}>Next ›</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      {modalUser && <CommutterModal user={modalUser} onClose={() => setModalId(null)} />}
    </>
  );
}

function DriverModal({ user, onClose, onUpdateStatus }) {
  const [confirming, setConfirming] = useState(null);
  const [photos, setPhotos] = useState(null);
  const [photosLoading, setPhotosLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setPhotosLoading(true);
    authFetch(`${DJANGO_URL}/api/admin/users/${user.id}/photos`)
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((data) => { if (!cancelled) { setPhotos(data); setPhotosLoading(false); } })
      .catch(() => {
        if (!cancelled) {
          setPhotos({ photo_license: user.photo_license ?? null, photo_plate: user.photo_plate ?? null, photo_toda: user.photo_toda ?? null, profile_photo: user.profile_photo ?? null });
          setPhotosLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [user.id]);

  const handle = (action) => {
    if (confirming === action) { onUpdateStatus(user.id, action); setConfirming(null); }
    else setConfirming(action);
  };

  const name         = getDisplayName(user);
  const licensePhoto = photos?.photo_license ?? null;
  const platePhoto   = photos?.photo_plate   ?? null;
  const todaPhoto    = photos?.photo_toda    ?? null;
  const profilePhoto = photos?.profile_photo ?? null;
  const hasPhotos    = licensePhoto || platePhoto || todaPhoto;
  const online       = isDriverOnline(user);

  return (
    <div onClick={(e) => e.target === e.currentTarget && onClose()} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.85)", backdropFilter: "blur(5px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "linear-gradient(145deg,#0e1f33,#0a1724)", border: "1px solid rgba(60,110,160,.22)", borderRadius: 16, width: "100%", maxWidth: 620, maxHeight: "92vh", overflowY: "auto", padding: 26, boxShadow: "0 40px 100px rgba(0,0,0,.8)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, paddingBottom: 14, borderBottom: "1px solid rgba(60,110,160,.12)" }}>
          <div style={{ fontSize: "0.98rem", fontWeight: 700, color: "#d4e8ff" }}>Driver Verification</div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(60,110,160,.18)", borderRadius: 8, color: "#3a5a7a", cursor: "pointer", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="x" size={14} />
          </button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 13, marginBottom: 18, padding: "13px 14px", background: "rgba(255,255,255,.025)", border: "1px solid rgba(60,110,160,.12)", borderRadius: 11 }}>
          {profilePhoto ? (
            <img src={toImgSrc(profilePhoto)} alt="Profile" onError={(e) => { e.currentTarget.style.display = "none"; }} style={{ width: 46, height: 46, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "2px solid rgba(249,115,22,.4)" }} />
          ) : <Avatar name={name} role="driver" size={46} />}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "#e2f0ff", marginBottom: 5 }}>{name}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <StatusBadge status={user.status} />
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 9px", borderRadius: 20, fontSize: "0.58rem", fontWeight: 700, background: online ? "rgba(74,222,128,.07)" : "rgba(255,255,255,.04)", color: online ? "#4ade80" : "#3a5a7a", border: `1px solid ${online ? "rgba(74,222,128,.18)" : "rgba(60,110,160,.15)"}` }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: online ? "#4ade80" : "#3a5a7a" }} />{online ? "Online" : "Offline"}
              </span>
            </div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 18 }}>
          <InfoItem label="Username"    value={user.username}         />
          <InfoItem label="Full Name"   value={user.full_name}        />
          <InfoItem label="Email"       value={user.email}            />
          <InfoItem label="Contact"     value={getPhone(user)}        />
          <InfoItem label="Age"         value={getAge(user)}          />
          <InfoItem label="Address"     value={getAddress(user)}      />
          <InfoItem label="TODA / Org"  value={getOrganization(user)} />
          <InfoItem label="Plate No."   value={getPlateNo(user)}      />
          <InfoItem label="License No." value={getLicenseNo(user)}    />
          <InfoItem label="Joined"      value={fmtD(user.created_at)} />
        </div>
        <div style={{ marginBottom: 18, padding: "14px 14px 16px", background: "rgba(0,0,0,.2)", border: "1px solid rgba(60,110,160,.12)", borderRadius: 11 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 14, fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.8px", color: "#1e5a8a" }}>Credential Documents</div>
          {photosLoading ? (
            <div style={{ textAlign: "center", padding: "20px 0", fontSize: "0.7rem", color: "#2a4a62" }}>Loading documents…</div>
          ) : hasPhotos ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              <CredentialPhoto label="Driver's License" value={licensePhoto} />
              <CredentialPhoto label="Vehicle / Plate"  value={platePhoto}   />
              <CredentialPhoto label="TODA Clearance"   value={todaPhoto}    />
            </div>
          ) : (
            <div style={{ padding: "16px 0", textAlign: "center", fontSize: "0.7rem", color: "#2a4a62" }}>No credential photos found.</div>
          )}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => handle("verified")} style={{ flex: 1, padding: 10, background: "linear-gradient(135deg,#2563eb,#1d4ed8)", border: "none", borderRadius: 9, color: "#fff", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
            <Icon name="check" size={14} />{confirming === "verified" ? "Confirm Approve?" : "Approve Driver"}
          </button>
          <button onClick={() => handle("rejected")} style={{ flex: 1, padding: 10, background: "rgba(239,68,68,.07)", border: "1px solid rgba(239,68,68,.22)", borderRadius: 9, color: "#f87171", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
            <Icon name="x" size={14} />{confirming === "rejected" ? "Confirm Reject?" : "Reject"}
          </button>
        </div>
        {confirming && <div style={{ fontSize: "0.63rem", color: "#facc15", textAlign: "center", marginTop: 6, fontWeight: 600 }}>⚠ Click again to confirm your action</div>}
      </div>
    </div>
  );
}

function DriversView({ users, setUsers }) {
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [modalId, setModalId] = useState(null);
  const drivers = users.filter((u) => u.role === "driver");
  const filtered = drivers.filter((d) => filter === "all" || d.status === filter);
  const total = Math.max(1, Math.ceil(filtered.length / PER));
  const cur = Math.min(page, total);
  const rows = filtered.slice((cur - 1) * PER, cur * PER);
  const modalUser = users.find((u) => u.id === modalId && u.role === "driver");
  const updateStatus = (uid, newStatus) => callVerify(uid, "driver", newStatus, setUsers, setModalId);
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 14 }}>
        <StatCard icon="tricycle" value={drivers.length}                                        label="Total Drivers"  color="blue"   />
        <StatCard icon="grid"     value={drivers.filter((d) => isDriverOnline(d)).length}       label="Online Now"     color="green"  />
        <StatCard icon="clock"    value={drivers.filter((d) => d.status === "pending").length}  label="Pending Review" color="yellow" />
        <StatCard icon="check"    value={drivers.filter((d) => d.status === "verified").length} label="Verified"       color="green"  />
      </div>
      <div style={ds.tableCard}>
        <div style={{ ...ds.tcHead, flexWrap: "wrap", gap: 8 }}>
          <div style={ds.tcTitle}><span style={ds.dotPulse} />Driver Registry</div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {["all","pending","verified","rejected"].map((st) => (
              <button key={st} onClick={() => { setFilter(st); setPage(1); }} style={{ ...ds.pill, ...(filter === st ? ds.pillActive : {}) }}>
                {st.charAt(0).toUpperCase() + st.slice(1)}
                <span style={{ marginLeft: 4, background: "rgba(255,255,255,.06)", padding: "1px 5px", borderRadius: 10, fontSize: "0.55rem" }}>
                  {st === "all" ? drivers.length : drivers.filter((d) => d.status === st).length}
                </span>
              </button>
            ))}
          </div>
        </div>
        {drivers.length === 0 ? (
          <EmptyState icon="tricycle" title="No drivers yet" desc="Partner drivers will appear here once they register." />
        ) : (
          <>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr>{["Driver","Username","Plate No.","License","TODA / Org","Age","Contact","Online","Status","Joined","Action"].map((h) => <th key={h} style={ds.th}>{h}</th>)}</tr></thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr><td colSpan="11" style={{ textAlign: "center", padding: "40px", color: "#1e3a52", fontSize: "0.78rem" }}>No drivers match this filter.</td></tr>
                  ) : (
                    rows.map((d) => {
                      const name = getDisplayName(d);
                      const online = isDriverOnline(d);
                      return (
                        <tr key={`driver-${d.id}`} style={ds.tr}>
                          <td style={ds.td}>
                            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                              {toImgSrc(d.profile_photo) ? (
                                <img src={toImgSrc(d.profile_photo)} alt={name} onError={(e) => { e.currentTarget.style.display = "none"; }} style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "2px solid rgba(249,115,22,.3)" }} />
                              ) : <Avatar name={name} role="driver" />}
                              <div>
                                <div style={{ color: "#cce0f5", fontWeight: 500 }}>{name}</div>
                                <div style={{ fontSize: "0.62rem", color: "#4a6a88" }}>{d.email}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ ...ds.td, fontSize: "0.7rem", color: "#5a8ab0" }}>{d.username || "—"}</td>
                          <td style={ds.td}>
                            {getPlateNo(d) ? (
                              <span style={{ background: "#0a1f0a", border: "1px solid rgba(74,222,128,.2)", color: "#6ee7a0", padding: "2px 9px", borderRadius: 5, fontSize: "0.67rem", fontWeight: 700, fontFamily: "monospace" }}>{getPlateNo(d)}</span>
                            ) : <span style={{ color: "#2a4a62" }}>—</span>}
                          </td>
                          <td style={{ ...ds.td, fontSize: "0.7rem", color: "#8ab4d4" }}>{getLicenseNo(d) || <span style={{ color: "#2a4a62" }}>—</span>}</td>
                          <td style={{ ...ds.td, fontSize: "0.72rem" }}>{getOrganization(d) || <span style={{ color: "#2a4a62" }}>—</span>}</td>
                          <td style={{ ...ds.td, fontSize: "0.72rem", color: "#8ab4d4" }}>{getAge(d) || <span style={{ color: "#2a4a62" }}>—</span>}</td>
                          <td style={{ ...ds.td, fontSize: "0.72rem", color: "#8ab4d4" }}>{getPhone(d)}</td>
                          <td style={ds.td}>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 9px", borderRadius: 20, fontSize: "0.58rem", fontWeight: 700, background: online ? "rgba(74,222,128,.07)" : "rgba(255,255,255,.04)", color: online ? "#4ade80" : "#3a5a7a", border: `1px solid ${online ? "rgba(74,222,128,.18)" : "rgba(60,110,160,.15)"}` }}>
                              <span style={{ width: 5, height: 5, borderRadius: "50%", background: online ? "#4ade80" : "#3a5a7a" }} />{online ? "Online" : "Offline"}
                            </span>
                          </td>
                          <td style={ds.td}><StatusBadge status={d.status} /></td>
                          <td style={{ ...ds.td, fontSize: "0.65rem", color: "#5a8ab0" }}>{fmtD(d.created_at)}</td>
                          <td style={ds.td}><button onClick={() => setModalId(d.id)} style={reviewBtnStyle(d.status)}>{d.status === "pending" ? "⚡ Review" : "View"}</button></td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            {total > 1 && (
              <div style={ds.pager}>
                <span style={{ fontSize: "0.62rem", color: "#1e3a52" }}>{filtered.length} records · page {cur}/{total}</span>
                <div style={{ display: "flex", gap: 3 }}>
                  <button style={ds.pgBtn} disabled={cur <= 1} onClick={() => setPage((p) => p - 1)}>‹ Prev</button>
                  <button style={ds.pgBtn} disabled={cur >= total} onClick={() => setPage((p) => p + 1)}>Next ›</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      {modalUser && <DriverModal user={modalUser} onClose={() => setModalId(null)} onUpdateStatus={updateStatus} />}
    </>
  );
}

function FareSettingsView() {
  const [form, setForm] = useState(null);
  const [orig, setOrig] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const normalize = (d) => ({
    base_fare: Number(d.base_fare), per_km_rate: Number(d.per_km_rate),
    minimum_fare: Number(d.minimum_fare), booking_fee: Number(d.booking_fee),
    surge_multiplier: Number(d.surge_multiplier), surge_active: Boolean(d.surge_active),
    updated_at: d.updated_at ?? null,
  });

  useEffect(() => {
    authFetch(`${DJANGO_URL}/api/admin/fare-config`)
      .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then((d) => { const n = normalize(d); setForm(n); setOrig(n); setLoading(false); })
      .catch(() => { setError("Could not load fare config from Django."); setLoading(false); });
  }, []);

  const handleChange = (field, value) => { setForm((prev) => ({ ...prev, [field]: value })); setSaved(false); };

  const save = async () => {
    setSaving(true); setError(null);
    const payload = { base_fare: Number(form.base_fare), per_km_rate: Number(form.per_km_rate), minimum_fare: Number(form.minimum_fare), booking_fee: Number(form.booking_fee), surge_multiplier: Number(form.surge_multiplier), surge_active: Boolean(form.surge_active) };
    try {
      const res = await authFetch(`${DJANGO_URL}/api/admin/fare-config`, { method: "PATCH", body: JSON.stringify(payload) });
      if (!res.ok) throw new Error(res.status);
      const d = await res.json();
      const n = normalize(d);
      setForm(n); setOrig(n); setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    } catch (e) { setError("Save failed — " + e.message); }
    setSaving(false);
  };

  const reset = () => { setForm(orig); setSaved(false); setError(null); };

  const preview = (km) => {
    if (!form) return 0;
    const b = Number(form.base_fare || 0), r = Number(form.per_km_rate || 0), m = Number(form.minimum_fare || 0), f = Number(form.booking_fee || 0);
    const s = form.surge_active ? Number(form.surge_multiplier || 1) : 1;
    return Math.max(m, (b + r * km) * s) + f;
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 220, gap: 10, color: "#3a5a7a", fontSize: "0.78rem" }}>
      <svg style={{ animation: "spin .8s linear infinite", width: 22, height: 22 }} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity=".2" />
        <path fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
      </svg>
      Loading fare config…
    </div>
  );

  if (!form) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 220, gap: 8, color: "#f87171", fontSize: "0.78rem" }}>
      <Icon name="x" size={16} /> {error || "Failed to load."}
    </div>
  );

  const isDirty = Number(form.base_fare) !== Number(orig.base_fare) || Number(form.per_km_rate) !== Number(orig.per_km_rate) || Number(form.minimum_fare) !== Number(orig.minimum_fare) || Number(form.booking_fee) !== Number(orig.booking_fee) || Number(form.surge_multiplier) !== Number(orig.surge_multiplier) || Boolean(form.surge_active) !== Boolean(orig.surge_active);

  return (
    <>
      <div style={{ background: "rgba(74,222,128,.04)", border: "1px solid rgba(74,222,128,.15)", borderRadius: 12, padding: "13px 18px", marginBottom: 14, display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 9, background: "rgba(74,222,128,.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#4ade80", flexShrink: 0 }}><Icon name="fare" size={18} /></div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "0.84rem", fontWeight: 700, color: "#cce0f5" }}>Fare Rate Configuration</div>
          <div style={{ fontSize: "0.63rem", color: "#3a5a7a", marginTop: 2 }}>Changes are saved to Django and served live to all driver &amp; commuter apps via <code style={{ background: "rgba(74,222,128,.08)", color: "#4ade80", padding: "1px 6px", borderRadius: 4, marginLeft: 5, fontSize: "0.6rem" }}>GET /api/fare-config</code></div>
        </div>
        <div style={{ fontSize: "0.58rem", color: "#2a4a6a", textAlign: "right", flexShrink: 0 }}>
          <div>Last saved</div>
          <div style={{ color: "#3a5a7a", fontWeight: 600, marginTop: 2 }}>{form.updated_at ? fmtDT(form.updated_at) : "—"}</div>
        </div>
      </div>
      {error && <div style={{ background: "rgba(248,113,113,.08)", border: "1px solid rgba(248,113,113,.2)", borderRadius: 8, padding: "10px 14px", marginBottom: 12, fontSize: "0.74rem", color: "#f87171", display: "flex", gap: 8, alignItems: "center" }}><Icon name="x" size={13} /> {error}</div>}
      {isDirty && !saving && <div style={{ background: "rgba(250,204,21,.05)", border: "1px solid rgba(250,204,21,.2)", borderRadius: 8, padding: "8px 14px", marginBottom: 12, fontSize: "0.68rem", color: "#facc15", display: "flex", alignItems: "center", gap: 8 }}>⚠ You have unsaved changes — click Save to push to all apps.</div>}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
        <FField label="Base Fare" field="base_fare" unit="₱" hint="Flat charge at trip start" value={form.base_fare} onChange={handleChange} />
        <FField label="Per-KM Rate" field="per_km_rate" unit="₱" hint="Added per kilometer traveled" value={form.per_km_rate} onChange={handleChange} />
        <FField label="Minimum Fare" field="minimum_fare" unit="₱" hint="Floor — no trip goes below this" value={form.minimum_fare} onChange={handleChange} />
        <FField label="Booking Fee" field="booking_fee" unit="₱" hint="Platform fee added on top" value={form.booking_fee} onChange={handleChange} />
        <FField label="Surge Multiplier" field="surge_multiplier" unit="×" hint="1.0 = normal · 1.5 = 50% surge" value={form.surge_multiplier} onChange={handleChange} />
        <div style={{ background: "rgba(0,0,0,.28)", border: `1px solid ${form.surge_active ? "rgba(250,204,21,.3)" : "rgba(60,110,160,.14)"}`, borderRadius: 10, padding: "13px 15px", display: "flex", flexDirection: "column", justifyContent: "space-between", transition: "border-color .2s" }}>
          <div style={{ fontSize: "0.52rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.6px", color: form.surge_active ? "#facc15" : "#1e5a8a", marginBottom: 8 }}>Surge Pricing</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "0.7rem", color: form.surge_active ? "#ffd699" : "#3a5a7a" }}>{form.surge_active ? `⚡ Active · ×${form.surge_multiplier}` : "Off · standard rates"}</span>
            <button onClick={() => handleChange("surge_active", !form.surge_active)} style={{ width: 46, height: 26, borderRadius: 13, border: "none", cursor: "pointer", position: "relative", flexShrink: 0, transition: "background .2s", background: form.surge_active ? "linear-gradient(135deg,#f59e0b,#d97706)" : "rgba(255,255,255,.1)" }}>
              <span style={{ position: "absolute", top: 4, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left .2s", left: form.surge_active ? 24 : 4 }} />
            </button>
          </div>
          <div style={{ fontSize: "0.55rem", color: "#1e3a52", marginTop: 6 }}>Applied on top of base + km calculation</div>
        </div>
      </div>
      <div style={{ ...ds.tableCard, marginBottom: 14 }}>
        <div style={ds.tcHead}>
          <div style={ds.tcTitle}>
            <span style={{ ...ds.dotPulse, background: form.surge_active ? "#facc15" : "#fb923c" }} />Live Fare Preview
            {form.surge_active && <span style={{ marginLeft: 8, fontSize: "0.58rem", color: "#facc15", background: "rgba(250,204,21,.08)", border: "1px solid rgba(250,204,21,.2)", padding: "2px 8px", borderRadius: 10 }}>⚡ Surge ×{form.surge_multiplier} ON</span>}
          </div>
          <span style={{ fontSize: "0.58rem", color: "#2a4a6a" }}>Updates as you type — not yet saved</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)" }}>
          {[1, 2, 3, 5, 10].map((km, i) => (
            <div key={km} style={{ padding: "18px 14px", textAlign: "center", borderRight: i < 4 ? "1px solid rgba(60,110,160,.08)" : "none" }}>
              <div style={{ fontSize: "0.55rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", color: "#2a4a6a", marginBottom: 6 }}>{km} km</div>
              <div style={{ fontSize: "1.15rem", fontWeight: 800, color: form.surge_active ? "#facc15" : "#fb923c" }}>{fmtP(preview(km))}</div>
              <div style={{ fontSize: "0.56rem", color: "#1e3a52", marginTop: 4 }}>₱{Number(form.base_fare || 0).toFixed(0)} + ₱{(Number(form.per_km_rate || 0) * km).toFixed(0)}{Number(form.booking_fee || 0) > 0 && ` + ₱${Number(form.booking_fee).toFixed(0)} fee`}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ background: "rgba(59,130,246,.04)", border: "1px solid rgba(59,130,246,.12)", borderRadius: 9, padding: "10px 14px", marginBottom: 14, fontSize: "0.65rem", color: "#3a5a7a", display: "flex", alignItems: "center", gap: 10 }}>
        <Icon name="grid" size={12} />
        <span>Formula: <code style={{ color: "#60a5fa", fontSize: "0.63rem" }}>max(minimum_fare, (base_fare + per_km_rate × km) × surge_multiplier) + booking_fee</code></span>
      </div>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <button onClick={save} disabled={saving || !isDirty} style={{ padding: "10px 22px", background: saved ? "linear-gradient(135deg,#16a34a,#15803d)" : isDirty ? "linear-gradient(135deg,#2563eb,#1d4ed8)" : "rgba(255,255,255,.04)", border: isDirty ? "none" : "1px solid rgba(60,110,160,.18)", borderRadius: 10, color: isDirty ? "#fff" : "#2a4a6a", fontSize: "0.8rem", fontWeight: 700, cursor: saving || !isDirty ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 8, fontFamily: "inherit", opacity: saving ? 0.7 : 1, transition: "all .2s" }}>
          <Icon name={saved ? "check" : "refresh"} size={14} />
          {saving ? "Saving to Django…" : saved ? "Saved! All apps updated." : "Save Fare Config"}
        </button>
        <button onClick={reset} disabled={saving || !isDirty} style={{ padding: "10px 16px", background: "rgba(255,255,255,.04)", border: "1px solid rgba(60,110,160,.18)", borderRadius: 10, color: isDirty ? "#8ab4d4" : "#2a4a6a", fontSize: "0.78rem", fontWeight: 600, cursor: saving || !isDirty ? "not-allowed" : "pointer", fontFamily: "inherit" }}>Reset</button>
        {saved && <span style={{ fontSize: "0.65rem", color: "#4ade80", display: "flex", alignItems: "center", gap: 5 }}><Icon name="check" size={12} /> Drivers &amp; commuters now use updated rates</span>}
      </div>
    </>
  );
}

// ─── Sidebar fare quick-info ──────────────────────────────────────────────────
function FareQuickInfo() {
  const [info, setInfo] = useState(null);
  useEffect(() => {
    authFetch(`${DJANGO_URL}/api/admin/fare-config`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => d && setInfo(d))
      .catch(() => {});
  }, []);
  if (!info) return <div style={{ fontSize: "0.65rem", color: "#2a4a6a" }}>—</div>;
  return (
    <div>
      <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "#4ade80", letterSpacing: "-.3px" }}>
        {fmtP(info.base_fare)}<span style={{ fontSize: "0.55rem", fontWeight: 500, color: "#2a6a4a", marginLeft: 4 }}>base</span>
      </div>
      <div style={{ fontSize: "0.6rem", color: "#2a5a3a", marginTop: 2 }}>
        +{fmtP(info.per_km_rate)}/km{info.surge_active && <span style={{ marginLeft: 6, color: "#facc15" }}>⚡ surge ×{info.surge_multiplier}</span>}
      </div>
    </div>
  );
}

// ─── Dashboard Shell ──────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user, logout } = useAuth();
  const [view, setView] = useState("overview");
  const clock = useClock();
  const [users, setUsers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);

  const loadData = async () => {
    setRefreshing(true);
    if (!users.length) setLoading(true);
    setError(null);
    try {
      const res = await authFetch(`${DJANGO_URL}/api/admin/users`);
      if (!res.ok) throw new Error(`Users API returned ${res.status}`);
      const data = await res.json();
      setUsers(data.map((u) => ({ ...u, status: u.verified_status ?? u.status ?? "pending" })));
    } catch (e) {
      console.error("Failed to load users:", e);
      setError("Could not connect to Django. Make sure it is running on port 8000.");
    }
    try {
      const res = await authFetch(`${DJANGO_URL}/api/admin/rides`);
      if (res.ok) setTrips(await res.json());
    } catch (e) { console.error("Failed to load trips:", e); }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { loadData(); }, []);

  const pendingDrivers   = users.filter((u) => u.role === "driver"   && u.status === "pending").length;
  const pendingCommuters = users.filter((u) => u.role === "commuter" && u.status === "pending").length;
  const totalNotifications = pendingDrivers + pendingCommuters + trips.filter((t) => t.status === "active").length;
  const activeNavItem = NAV.find((n) => n.id === view);

  return (
    <div style={ds.root}>
      <style>{dashCss}</style>

      {/* ── Enhanced Sidebar ── */}
      <aside style={ds.sidebar}>

        {/* Logo area with gradient banner */}
        <div style={ds.logoWrap}>
          <div style={ds.logoBanner} />
          <div style={ds.logoContent}>
            <div style={ds.logoIconWrap}>
              <img src={logo} alt="Logo" style={{ width: 22, height: "auto", position: "relative", zIndex: 1 }} />
            </div>
            <div>
              <div style={{ fontSize: "1.05rem", fontWeight: 800, letterSpacing: "-.3px", lineHeight: 1.1 }}>
                <span style={{ color: "#60a5fa" }}>Pasada</span><span style={{ color: "#fb923c" }}>Now</span>
              </div>
              <div style={{ fontSize: "0.45rem", color: "#2a5a8a", fontWeight: 600, textTransform: "uppercase", letterSpacing: "2.5px", marginTop: 1 }}>Admin Console</div>
            </div>
          </div>
          {/* Decorative dots */}
          <div style={{ position: "absolute", top: 10, right: 12, display: "flex", gap: 4 }}>
            {["#f87171","#facc15","#4ade80"].map((c, i) => <div key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: c, opacity: 0.4 }} />)}
          </div>
        </div>

        {/* Admin profile card */}
        <div style={ds.profileCard}>
          <div style={ds.profileAvatar}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#3b82f6,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.78rem", fontWeight: 800, color: "#fff", flexShrink: 0 }}>A</div>
            <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#4ade80", border: "2px solid #0b1829", position: "absolute", bottom: 0, right: 0 }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "0.76rem", fontWeight: 700, color: "#cce0f5", marginBottom: 1 }}>Administrator</div>
            <div style={{ fontSize: "0.58rem", color: "#2a4a6a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.email || "admin@pasadanow.com"}</div>
          </div>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", flexShrink: 0 }} />
        </div>

        {/* Navigation label */}
        <div style={ds.navLabel}>
          <span style={{ flex: 1, height: 1, background: "linear-gradient(90deg,transparent,rgba(60,110,160,.2))" }} />
          <span style={{ fontSize: "0.45rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "2.5px", color: "#1a3a56", padding: "0 8px" }}>Navigation</span>
          <span style={{ flex: 1, height: 1, background: "linear-gradient(90deg,rgba(60,110,160,.2),transparent)" }} />
        </div>

        {/* Nav items */}
        <nav style={{ display: "flex", flexDirection: "column", gap: 3, padding: "2px 10px" }}>
          {NAV.map((n) => {
            const isActive = view === n.id;
            const badge = n.id === "drivers" ? pendingDrivers : n.id === "commuters" ? pendingCommuters : 0;
            return (
              <button
                key={n.id}
                onClick={() => setView(n.id)}
                className="nav-btn"
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 12px", borderRadius: 10,
                  border: isActive ? `1px solid ${n.accent}28` : "1px solid transparent",
                  background: isActive
                    ? `linear-gradient(135deg,${n.accent}12,${n.accent}06)`
                    : "transparent",
                  color: isActive ? n.accent : "#3a5a7a",
                  fontSize: "0.76rem", fontWeight: isActive ? 650 : 500,
                  cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                  width: "100%", position: "relative", transition: "all .18s",
                }}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <span style={{ position: "absolute", left: 0, top: "20%", height: "60%", width: 3, borderRadius: "0 3px 3px 0", background: `linear-gradient(180deg,${n.accent},${n.accent}88)`, boxShadow: `0 0 8px ${n.accent}60` }} />
                )}
                {/* Icon wrapper */}
                <span style={{
                  width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  background: isActive ? `${n.accent}18` : "rgba(255,255,255,.03)",
                  border: isActive ? `1px solid ${n.accent}25` : "1px solid rgba(60,110,160,.08)",
                  color: isActive ? n.accent : "#2a4a6a",
                  transition: "all .18s",
                }}>
                  <Icon name={n.icon} size={14} />
                </span>
                <span style={{ flex: 1 }}>{n.label}</span>
                {badge > 0 && (
                  <span style={{ background: "linear-gradient(135deg,#f97316,#ea580c)", color: "#fff", fontSize: "0.48rem", fontWeight: 800, padding: "2px 6px", borderRadius: 20, boxShadow: "0 2px 6px rgba(249,115,22,.4)", minWidth: 16, textAlign: "center" }}>{badge}</span>
                )}
                {isActive && (
                  <span style={{ width: 4, height: 4, borderRadius: "50%", background: n.accent, opacity: 0.8, flexShrink: 0 }} />
                )}
              </button>
            );
          })}
        </nav>

        {/* Divider */}
        <div style={{ margin: "10px 10px 8px", height: 1, background: "linear-gradient(90deg,transparent,rgba(60,110,160,.12),transparent)" }} />

        {/* Fare quick info */}
        <div style={{ margin: "0 10px", padding: "10px 12px", background: "linear-gradient(135deg,rgba(74,222,128,.04),rgba(74,222,128,.02))", border: "1px solid rgba(74,222,128,.12)", borderRadius: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <div style={{ width: 16, height: 16, borderRadius: 5, background: "rgba(74,222,128,.12)", display: "flex", alignItems: "center", justifyContent: "center", color: "#4ade80" }}>
              <Icon name="fare" size={10} />
            </div>
            <div style={{ fontSize: "0.48rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", color: "#2a6a4a" }}>Live Base Fare</div>
          </div>
          <FareQuickInfo />
        </div>

        {/* Refresh button */}
        <div style={{ padding: "8px 10px 0" }}>
          <button onClick={loadData} disabled={refreshing} className="refresh-btn" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%", padding: "7px 10px", borderRadius: 8, background: "rgba(59,130,246,.05)", border: "1px solid rgba(59,130,246,.12)", color: refreshing ? "#1e3a52" : "#3a6a9a", fontSize: "0.63rem", fontWeight: 600, cursor: refreshing ? "not-allowed" : "pointer", fontFamily: "inherit", transition: "all .18s" }}>
            <span style={{ display: "inline-block", animation: refreshing ? "spin .8s linear infinite" : "none" }}><Icon name="refresh" size={11} /></span>
            {refreshing ? "Refreshing…" : "Refresh Data"}
          </button>
        </div>

        {/* System status */}
        <div style={{ margin: "8px 10px 0", padding: "9px 12px", background: error ? "rgba(248,113,113,.04)" : "rgba(74,222,128,.03)", border: `1px solid ${error ? "rgba(248,113,113,.15)" : "rgba(74,222,128,.1)"}`, borderRadius: 10 }}>
          <div style={{ fontSize: "0.45rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", color: error ? "#7a3a3a" : "#2a6a4a", marginBottom: 5 }}>System Status</div>
          <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: "0.66rem", color: "#aec8e0" }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: error ? "#f87171" : refreshing ? "#facc15" : "#4ade80", flexShrink: 0, boxShadow: `0 0 6px ${error ? "#f87171" : refreshing ? "#facc15" : "#4ade80"}60` }} />
            {error ? "Django unreachable" : refreshing ? "Refreshing…" : loading ? "Loading…" : "All systems normal"}
          </div>
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Bottom: sign out */}
        <div style={{ padding: "10px 10px 12px", borderTop: "1px solid rgba(60,110,160,.1)" }}>
          <button onClick={logout} className="logout-btn" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", padding: "9px 12px", borderRadius: 10, background: "rgba(248,113,113,.04)", border: "1px solid rgba(248,113,113,.18)", color: "#f87171", fontSize: "0.7rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all .18s" }}>
            <Icon name="logout" size={13} /> Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", height: "100%" }}>

        {/* Enhanced Header */}
        <header style={ds.header}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Breadcrumb-style icon */}
            {activeNavItem && (
              <div style={{ width: 32, height: 32, borderRadius: 9, background: `${activeNavItem.accent}12`, border: `1px solid ${activeNavItem.accent}25`, display: "flex", alignItems: "center", justifyContent: "center", color: activeNavItem.accent }}>
                <Icon name={activeNavItem.icon} size={15} />
              </div>
            )}
            <div>
              <div style={{ fontSize: "0.46rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "2px", color: "#1e3a52", marginBottom: 1 }}>PasadaNow · Admin</div>
              <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#cce0f5", letterSpacing: "-.2px" }}>{TITLES[view]}</div>
            </div>
          </div>

          <div style={{ flex: 1 }} />

          {/* Clock */}
          <div style={{ fontSize: "0.64rem", color: "#4a7a9a", background: "rgba(7,17,31,.8)", border: "1px solid rgba(60,110,160,.1)", padding: "5px 11px", borderRadius: 7, fontVariantNumeric: "tabular-nums", fontWeight: 500, whiteSpace: "nowrap" }}>{clock}</div>

          {/* Bell notification button */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowNotifications((v) => !v)}
              className="bell-btn"
              style={{
                width: 36, height: 36, borderRadius: 10,
                background: showNotifications ? "rgba(96,165,250,.12)" : "rgba(255,255,255,.04)",
                border: showNotifications ? "1px solid rgba(96,165,250,.3)" : "1px solid rgba(60,110,160,.15)",
                color: showNotifications ? "#60a5fa" : "#3a5a7a",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", transition: "all .18s", position: "relative",
              }}
            >
              <Icon name="bell" size={15} />
              {totalNotifications > 0 && (
                <span style={{
                  position: "absolute", top: -4, right: -4,
                  background: "linear-gradient(135deg,#ef4444,#dc2626)",
                  color: "#fff", fontSize: "0.45rem", fontWeight: 800,
                  padding: "1px 5px", borderRadius: 20,
                  border: "1.5px solid #07111f",
                  minWidth: 14, textAlign: "center",
                  boxShadow: "0 2px 6px rgba(239,68,68,.5)",
                  animation: "bellPulse 2s ease-in-out infinite",
                }}>
                  {totalNotifications > 9 ? "9+" : totalNotifications}
                </span>
              )}
            </button>
            {showNotifications && (
              <NotificationPanel users={users} trips={trips} onClose={() => setShowNotifications(false)} />
            )}
          </div>

          {/* Shield / security icon */}
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(74,222,128,.05)", border: "1px solid rgba(74,222,128,.12)", display: "flex", alignItems: "center", justifyContent: "center", color: "#4ade80" }}>
            <Icon name="shield" size={15} />
          </div>
        </header>

        {error && (
          <div style={{ background: "rgba(248,113,113,.08)", border: "1px solid rgba(248,113,113,.2)", borderRadius: 8, margin: "12px 20px 0", padding: "10px 14px", fontSize: "0.75rem", color: "#f87171", display: "flex", alignItems: "center", gap: 8 }}>
            <Icon name="x" size={14} /> {error}
          </div>
        )}

        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60%", flexDirection: "column", gap: 12 }}>
              <svg style={{ animation: "spin .8s linear infinite", width: 28, height: 28, color: "#3b82f6" }} viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity=".2" />
                <path fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              <div style={{ fontSize: "0.78rem", color: "#3a5a7a" }}>Loading data from Django…</div>
            </div>
          ) : (
            <>
              {view === "overview"  && <OverviewView  users={users} trips={trips} onRefresh={loadData} refreshing={refreshing} />}
              {view === "trips"     && <TripsView     trips={trips} />}
              {view === "commuters" && <CommutersView users={users} setUsers={setUsers} />}
              {view === "drivers"   && <DriversView   users={users} setUsers={setUsers} />}
              {view === "fare"      && <FareSettingsView />}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const ds = {
  root:        { display: "flex", width: "100vw", height: "100vh", background: "#07111f", color: "#aec8e0", fontFamily: "'Outfit', 'Inter', sans-serif", fontSize: 13, overflow: "hidden", position: "fixed", top: 0, left: 0 },
  sidebar:     { width: 224, background: "linear-gradient(180deg,#0b1829 0%,#080f1c 100%)", borderRight: "1px solid rgba(60,110,160,.12)", display: "flex", flexDirection: "column", flexShrink: 0, height: "100%", position: "relative" },

  // Logo
  logoWrap:    { position: "relative", padding: "0 0 0", borderBottom: "1px solid rgba(60,110,160,.1)", overflow: "hidden" },
  logoBanner:  { position: "absolute", inset: 0, background: "linear-gradient(135deg,rgba(59,130,246,.08) 0%,rgba(251,146,60,.05) 60%,transparent 100%)", pointerEvents: "none" },
  logoContent: { position: "relative", display: "flex", alignItems: "center", gap: 10, padding: "16px 14px 15px" },
  logoIconWrap:{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,rgba(59,130,246,.15),rgba(124,58,237,.1))", border: "1px solid rgba(59,130,246,.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 4px 12px rgba(59,130,246,.15)" },

  // Profile
  profileCard: { margin: "10px 10px 6px", padding: "9px 11px", background: "rgba(255,255,255,.025)", border: "1px solid rgba(60,110,160,.1)", borderRadius: 10, display: "flex", alignItems: "center", gap: 9 },
  profileAvatar:{ position: "relative", flexShrink: 0 },

  // Nav
  navLabel:    { display: "flex", alignItems: "center", padding: "10px 10px 6px" },

  // Header
  header:      { background: "linear-gradient(90deg,#0b1829,#080f1c)", borderBottom: "1px solid rgba(60,110,160,.12)", padding: "8px 16px", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 },

  // Cards/tables
  statCard:    { background: "linear-gradient(145deg,#0d1e30,#0a1724)", border: "1px solid rgba(60,110,160,.15)", borderRadius: 12, padding: "15px 15px 14px", position: "relative", overflow: "hidden" },
  tableCard:   { background: "linear-gradient(145deg,#0d1e30,#0a1724)", border: "1px solid rgba(60,110,160,.12)", borderRadius: 12, overflow: "hidden", marginBottom: 12 },
  tcHead:      { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid rgba(60,110,160,.1)" },
  tcTitle:     { display: "flex", alignItems: "center", gap: 8, fontSize: "0.8rem", fontWeight: 600, color: "#cce0f5" },
  dotPulse:    { width: 7, height: 7, borderRadius: "50%", background: "#3b82f6", flexShrink: 0, display: "inline-block" },
  th:          { padding: "8px 14px", textAlign: "left", fontSize: "0.54rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.8px", color: "#1e3a52", background: "#07111f", whiteSpace: "nowrap", borderBottom: "1px solid rgba(60,110,160,.08)" },
  td:          { padding: "10px 14px", fontSize: "0.74rem", color: "#5a8ab0", verticalAlign: "middle", borderBottom: "1px solid rgba(60,110,160,.05)" },
  tr:          {},
  tripId:      { background: "rgba(59,130,246,.08)", color: "#60a5fa", padding: "2px 8px", borderRadius: 5, fontSize: "0.68rem", fontWeight: 700, border: "1px solid rgba(59,130,246,.15)" },
  pager:       { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 16px", borderTop: "1px solid rgba(60,110,160,.08)" },
  pgBtn:       { padding: "4px 10px", fontSize: "0.62rem", border: "1px solid rgba(60,110,160,.14)", background: "#070f1c", color: "#2a4a6a", borderRadius: 6, cursor: "pointer", fontFamily: "inherit", transition: "all .15s" },
  pill:        { padding: "4px 11px", fontSize: "0.62rem", fontWeight: 600, border: "1px solid rgba(60,110,160,.14)", background: "#070f1c", color: "#2a4a6a", borderRadius: 6, cursor: "pointer", fontFamily: "inherit", transition: "all .15s", display: "flex", alignItems: "center" },
  pillActive:  { background: "rgba(59,130,246,.12)", borderColor: "rgba(59,130,246,.35)", color: "#60a5fa" },
};

const dashCss = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(59,130,246,.15); border-radius: 4px; }
  .nav-btn:hover { background: rgba(255,255,255,.04) !important; color: #8ab4d4 !important; border-color: rgba(60,110,160,.12) !important; }
  .nav-btn:hover span:first-of-type { background: rgba(255,255,255,.06) !important; }
  .logout-btn:hover { background: rgba(248,113,113,.1) !important; border-color: rgba(248,113,113,.4) !important; }
  .bell-btn:hover { background: rgba(96,165,250,.1) !important; border-color: rgba(96,165,250,.25) !important; color: #60a5fa !important; }
  .refresh-btn:hover { background: rgba(59,130,246,.1) !important; border-color: rgba(59,130,246,.25) !important; color: #60a5fa !important; }
  input[type=number]::-webkit-inner-spin-button,
  input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
  input[type=number] { -moz-appearance: textfield; }
  input[type=number]:focus { border-color: rgba(74,222,128,.4) !important; box-shadow: 0 0 0 2px rgba(74,222,128,.08); }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes bellPulse {
    0%, 100% { box-shadow: 0 2px 6px rgba(239,68,68,.5); }
    50% { box-shadow: 0 2px 12px rgba(239,68,68,.8); transform: scale(1.1); }
  }
`;