import { useState, useEffect, useRef, useCallback } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import api from "../config/axios";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const user = JSON.parse(localStorage.getItem("user") || "{}");

// ── helpers ──────────────────────────────────────────────────────────────────
function Avatar({ name, src, size = 32, colorClass = "bg-blue-600" }) {
  const initials = (name || "?").slice(0, 2).toUpperCase();
  return (
    <div
      className={`flex items-center justify-center rounded-full font-bold text-white overflow-hidden flex-shrink-0 ${colorClass}`}
      style={{ width: size, height: size, fontSize: size * 0.32 }}
    >
      {src ? (
        <img src={src} alt="" className="w-full h-full object-cover" />
      ) : (
        initials
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    completed: "bg-green-900/40 text-green-400 border border-green-700/40",
    pending: "bg-orange-900/40 text-orange-400 border border-orange-700/40",
    accepted: "bg-blue-900/40 text-blue-400 border border-blue-700/40",
    ongoing: "bg-yellow-900/40 text-yellow-400 border border-yellow-700/40",
    cancelled: "bg-red-900/40 text-red-400 border border-red-700/40",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${map[status] || map.cancelled}`}
    >
      ● {status ? status.charAt(0).toUpperCase() + status.slice(1) : "Unknown"}
    </span>
  );
}

function StatCard({ icon, value, label, accent = "blue" }) {
  const accents = {
    blue: "bg-blue-900/30 text-blue-400",
    green: "bg-green-900/30 text-green-400",
    orange: "bg-orange-900/30 text-orange-400",
    purple: "bg-purple-900/30 text-purple-400",
  };
  return (
    <div className="bg-[#0f1f35] border border-[rgba(99,160,220,0.15)] rounded-xl p-5 relative overflow-hidden hover:border-[rgba(99,160,220,0.35)] transition-colors">
      <div
        className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${accents[accent]}`}
      >
        {icon}
      </div>
      <div className="text-2xl font-bold leading-none mb-1">{value}</div>
      <div className="text-xs text-[#6a9cbf] uppercase tracking-wide font-medium">
        {label}
      </div>
    </div>
  );
}

function Toast({ msg, type, show }) {
  const colors = {
    green: "bg-green-500",
    red: "bg-red-500",
    blue: "bg-blue-500",
    orange: "bg-orange-500",
    purple: "bg-purple-500",
    yellow: "bg-yellow-400 text-black",
  };
  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-full text-sm font-semibold text-white z-50 transition-all duration-300 pointer-events-none whitespace-nowrap ${colors[type] || colors.blue} ${show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
    >
      {msg}
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function CommuterDashboard() {
  const [view, setView] = useState("dashboard");
  const [toast, setToast] = useState({ show: false, msg: "", type: "blue" });
  const [drivers, setDrivers] = useState([]);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({
    totalRides: 0,
    onlineDrivers: 0,
    lastFare: "—",
  });
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [fare, setFare] = useState(null);
  const [bookingState, setBookingState] = useState("idle");
  const [bookingData, setBookingData] = useState(null);
  const [activeBookingId, setActiveBookingId] = useState(null);
  const [lastKnownStatus, setLastKnownStatus] = useState(null);
  const [historyFilter, setHistoryFilter] = useState("");
  const [driverPopup, setDriverPopup] = useState(null);
  const [driverPopupCount, setDriverPopupCount] = useState(0);
  const [completePopup, setCompletePopup] = useState(false);
  const [profile, setProfile] = useState({
    fullname: user.username || "",
    email: user.email || "",
    contact: "",
    address: "",
  });
  const [profilePic, setProfilePic] = useState(null);
  const [profileFile, setProfileFile] = useState(null);
  const [profileMsg, setProfileMsg] = useState({
    show: false,
    type: "success",
    text: "",
  });
  const [clock, setClock] = useState("");

  const pollRef = useRef(null);
  const lastCount = useRef(stats.onlineDrivers);
  const mapRef = useRef(null);
  const mapInited = useRef(false);
  const markerRef = useRef(null);
  const stompRef = useRef(null);

  // ── Clock ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const tick = () => {
      const n = new Date();
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      let h = n.getHours(),
        am = h >= 12 ? "PM" : "AM";
      h = h % 12 || 12;
      setClock(
        `${days[n.getDay()]}, ${months[n.getMonth()]} ${n.getDate()}, ${h}:${String(n.getMinutes()).padStart(2, "0")} ${am}`,
      );
    };
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, []);

  // ── Toast ─────────────────────────────────────────────────────────────────
  const showToast = useCallback((msg, type = "blue") => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 3500);
  }, []);

  // ── Map (GPS fixed) ───────────────────────────────────────────────────────
  useEffect(() => {
    if (view !== "dashboard") return;
    if (mapInited.current) return;
    if (!window.L) return; // don't lock mapInited until L is ready

    mapInited.current = true;

    const map = window.L.map(mapRef.current, { zoomControl: true }).setView(
      [16.6159, 120.3209],
      15,
    );
    window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);

    const icon = window.L.divIcon({
      className: "",
      html: `<div style="width:16px;height:16px;background:#f08228;border-radius:50%;border:3px solid white;box-shadow:0 0 0 3px rgba(240,130,40,0.4)"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });

    const onSuccess = ({ coords }) => {
      const ll = [coords.latitude, coords.longitude];
      if (markerRef.current) {
        markerRef.current.setLatLng(ll);
      } else {
        markerRef.current = window.L.marker(ll, { icon })
          .addTo(map)
          .bindPopup("<b>Your Location</b>")
          .openPopup();
        map.setView(ll, 16);
      }
    };

    const onError = (err) => {
      console.warn("GPS error:", err.code, err.message);
      if (!markerRef.current) {
        markerRef.current = window.L.marker([16.6159, 120.3209], { icon })
          .addTo(map)
          .bindPopup("<b>Default Location (GPS unavailable)</b>")
          .openPopup();
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(onSuccess, onError, {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 30000,
      });
      navigator.geolocation.watchPosition(onSuccess, onError, {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 30000,
      });
    } else {
      onError({ code: 0, message: "Geolocation not supported" });
    }
  }, [view]);

  // ── Load data ─────────────────────────────────────────────────────────────
  const loadDrivers = useCallback(async () => {
    try {
      const res = await api.get("?ajax=get_drivers");
      setDrivers(res.data || []);
    } catch {}
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const [dc, hist] = await Promise.all([
        api.get("?ajax=driver_count"),
        api.get("?ajax=history"),
      ]);
      const cnt = dc.data.count || 0;
      if (cnt > lastCount.current) {
        setDriverPopup("online");
        setDriverPopupCount(cnt);
        showToast(
          `🚗 ${cnt - lastCount.current} driver(s) just came online!`,
          "green",
        );
      } else if (cnt < lastCount.current) {
        setDriverPopup("offline");
        setDriverPopupCount(cnt);
        showToast(`⚠️ A driver went offline. ${cnt} remaining.`, "orange");
      }
      lastCount.current = cnt;
      setStats((s) => ({ ...s, onlineDrivers: cnt }));
      if (hist.data) setHistory(hist.data);
    } catch {}
  }, [showToast]);

  useEffect(() => {
    loadDrivers();
    loadStats();
    const id1 = setInterval(loadDrivers, 15000);
    const id2 = setInterval(loadStats, 5000);
    return () => {
      clearInterval(id1);
      clearInterval(id2);
    };
  }, [loadDrivers, loadStats]);

  // ── Fare compute ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (destination.length > 3) {
      const dist = 4 + Math.random() * 21;
      setFare({ amount: 15 + Math.max(0, dist - 4) * 2, dist });
    } else setFare(null);
  }, [destination]);

  // ── WebSocket ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS("http://localhost:8080/ws"),
      onConnect: () => {
        client.subscribe(`/topic/rider/${user.id}`, (msg) => {
          const data = JSON.parse(msg.body);
          handleStatusUpdate(data);
        });
      },
    });
    client.activate();
    stompRef.current = client;
    return () => client.deactivate();
  }, []);

  // ── Poll booking ──────────────────────────────────────────────────────────
  const pollBooking = useCallback(async () => {
    if (!activeBookingId) return;
    try {
      const res = await api.get(
        `?ajax=poll_booking&booking_id=${activeBookingId}`,
      );
      const data = res.data;
      if (!data || !data.id) {
        stopPolling();
        showToast("Booking not found.", "orange");
        resetForm();
        return;
      }
      if (parseInt(data.id) !== parseInt(activeBookingId)) return;
      if (data.status === lastKnownStatus) return;
      setLastKnownStatus(data.status);
      handleStatusUpdate(data);
    } catch {}
  }, [activeBookingId, lastKnownStatus]);

  const handleStatusUpdate = (data) => {
    if (!data) return;
    if (data.status === "completed") {
      stopPolling();
      setActiveBookingId(null);
      setBookingState("completed");
      setBookingData(data);
      setCompletePopup(true);
      showToast("🎉 Trip completed! Safe travels!", "purple");
      setTimeout(() => setCompletePopup(false), 10000);
    } else if (data.status === "ongoing") {
      setBookingState("ongoing");
      setBookingData(data);
      showToast("🚗 Trip is now ongoing!", "yellow");
    } else if (data.status === "accepted") {
      setBookingState("accepted");
      setBookingData(data);
      showToast("✓ Driver is on the way!", "green");
    } else if (data.status === "cancelled") {
      stopPolling();
      setActiveBookingId(null);
      setBookingState("cancelled");
      showToast("Driver cancelled. Please try another.", "red");
      setTimeout(resetForm, 4000);
    }
  };

  useEffect(() => {
    if (activeBookingId) {
      pollRef.current = setInterval(pollBooking, 3000);
    }
    return () => stopPolling();
  }, [activeBookingId, pollBooking]);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  // ── Book ride ─────────────────────────────────────────────────────────────
  const submitBooking = async () => {
    if (!origin) return showToast("Enter your pickup point.", "red");
    if (!destination) return showToast("Enter a destination.", "red");
    if (!selectedDriver) return showToast("Select a driver.", "red");
    if (!fare)
      return showToast("Enter a destination to calculate fare.", "red");
    try {
      const fd = new FormData();
      fd.append("ajax_book", "1");
      fd.append("origin", origin);
      fd.append("destination", destination);
      fd.append("driver_id", selectedDriver.id);
      fd.append("fare", fare.amount.toFixed(2));
      const res = await api.post("", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data.success) {
        setActiveBookingId(res.data.booking_id);
        setLastKnownStatus("pending");
        setBookingState("pending");
        setBookingData({ origin, destination, fare: fare.amount });
        loadDrivers();
      } else showToast(res.data.message || "Booking failed.", "red");
    } catch {
      showToast("Network error.", "red");
    }
  };

  const cancelBooking = async () => {
    if (!confirm("Cancel your current booking?")) return;
    await api.get("?ajax=cancel_booking");
    stopPolling();
    setLastKnownStatus(null);
    resetForm();
    showToast("Booking cancelled.", "red");
  };

  const resetForm = () => {
    setBookingState("idle");
    setBookingData(null);
    setActiveBookingId(null);
    setLastKnownStatus(null);
    setOrigin("");
    setDestination("");
    setFare(null);
    setSelectedDriver(null);
    loadDrivers();
  };

  // ── Profile save ──────────────────────────────────────────────────────────
  const saveProfile = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append("ajax_update_profile", "1");
    fd.append("fullname", profile.fullname);
    fd.append("email", profile.email);
    fd.append("contact", profile.contact);
    fd.append("address", profile.address);
    if (profileFile) fd.append("profile_pic", profileFile);
    try {
      const res = await api.post("", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data.success) {
        setProfileMsg({
          show: true,
          type: "success",
          text: "Profile updated successfully!",
        });
        if (res.data.profile_pic) setProfilePic(res.data.profile_pic);
        showToast("✓ Profile saved!", "green");
      } else
        setProfileMsg({
          show: true,
          type: "error",
          text: res.data.message || "Failed.",
        });
    } catch {
      setProfileMsg({ show: true, type: "error", text: "Network error." });
    }
    setTimeout(() => setProfileMsg((m) => ({ ...m, show: false })), 5000);
  };

  // ── Booking status panel ──────────────────────────────────────────────────
  const renderBookingPanel = () => {
    if (bookingState === "idle") return null;
    const stateConfig = {
      pending: {
        cls: "border-orange-500/30 bg-orange-950/20",
        titleCls: "text-orange-400",
        title: "⏳ Waiting for driver response...",
      },
      accepted: {
        cls: "border-green-500/30 bg-green-950/20",
        titleCls: "text-green-400",
        title: "✓ Driver accepted! On the way to you.",
      },
      ongoing: {
        cls: "border-yellow-500/30 bg-yellow-950/20",
        titleCls: "text-yellow-400",
        title: "🚗 Trip Ongoing — You're on your way!",
      },
      completed: {
        cls: "border-purple-500/30 bg-purple-950/20",
        titleCls: "text-purple-400",
        title: "🎉 Trip Completed! Thank you for riding.",
      },
      cancelled: {
        cls: "border-red-500/30 bg-red-950/20",
        titleCls: "text-red-400",
        title: "✕ Booking was cancelled.",
      },
    };
    const cfg = stateConfig[bookingState] || stateConfig.pending;
    const d = bookingData || {};
    return (
      <div className={`border rounded-xl p-4 mb-3 ${cfg.cls}`}>
        <div
          className={`font-semibold text-sm mb-2 flex items-center gap-2 ${cfg.titleCls}`}
        >
          {bookingState === "pending" && (
            <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
          )}
          {cfg.title}
        </div>
        <div className="text-xs text-[#6a9cbf] leading-relaxed">
          {d.origin && (
            <>
              <b className="text-[#cce0f5]">From:</b> {d.origin}
              <br />
            </>
          )}
          {d.destination && (
            <>
              <b className="text-[#cce0f5]">To:</b> {d.destination}
              <br />
            </>
          )}
          {d.fare && (
            <>
              <b className="text-[#cce0f5]">Fare:</b> ₱
              {parseFloat(d.fare).toFixed(2)}
            </>
          )}
        </div>

        {(bookingState === "accepted" ||
          bookingState === "ongoing" ||
          bookingState === "completed") &&
          d.driver_name && (
            <div className="grid grid-cols-2 gap-2 mt-3">
              {[
                ["Driver", d.driver_name],
                ["Plate", d.plate_number],
                ["Contact", d.contact_no],
                ["Fare", `₱${parseFloat(d.fare || 0).toFixed(2)}`],
              ].map(([label, val]) => (
                <div
                  key={label}
                  className={`rounded-lg p-2 ${bookingState === "ongoing" ? "bg-yellow-950/30 border border-yellow-700/20" : bookingState === "completed" ? "bg-purple-950/30 border border-purple-700/20" : "bg-green-950/30 border border-green-700/20"}`}
                >
                  <div
                    className={`text-[10px] font-bold uppercase tracking-widest mb-0.5 ${bookingState === "ongoing" ? "text-yellow-400" : bookingState === "completed" ? "text-purple-400" : "text-green-400"}`}
                  >
                    {label}
                  </div>
                  <div className="text-xs font-semibold text-[#cce0f5]">
                    {val || "—"}
                  </div>
                </div>
              ))}
            </div>
          )}

        {bookingState === "ongoing" && (
          <div
            className="mt-3 h-1.5 rounded-full overflow-hidden opacity-70"
            style={{
              background:
                "repeating-linear-gradient(90deg,#eab308 0,#eab308 20px,transparent 20px,transparent 40px)",
              backgroundSize: "60px 100%",
              animation: "roadAnim 0.8s linear infinite",
            }}
          />
        )}

        {bookingState === "pending" && (
          <button
            onClick={cancelBooking}
            className="mt-3 px-3 py-1.5 text-xs font-semibold text-red-400 bg-red-950/30 border border-red-700/30 rounded-lg hover:bg-red-950/50 transition-colors"
          >
            Cancel Booking
          </button>
        )}
        {bookingState === "completed" && (
          <button
            onClick={resetForm}
            className="mt-3 px-3 py-1.5 text-xs font-semibold text-blue-400 bg-blue-950/30 border border-blue-700/30 rounded-lg hover:bg-blue-950/50 transition-colors"
          >
            Book Another Ride →
          </button>
        )}
      </div>
    );
  };

  const navItems = [
    { id: "dashboard", label: "Overview", icon: "⊞" },
    { id: "history", label: "Trip Records", icon: "⏱" },
    { id: "profile", label: "Profile Settings", icon: "◉" },
  ];

  const filteredHistory = history.filter(
    (r) =>
      !historyFilter ||
      JSON.stringify(r).toLowerCase().includes(historyFilter.toLowerCase()),
  );

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{
        background: "#0a1628",
        color: "#cce0f5",
        fontFamily: "'Outfit', sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
        @keyframes roadAnim { 0%{background-position:0 0} 100%{background-position:60px 0} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideDown { from{opacity:0;transform:translateY(-20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse2 { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .pulse-dot { animation: pulse2 2s infinite; }
        .fade-up { animation: fadeUp 0.25s ease; }
        .slide-down { animation: slideDown 0.35s cubic-bezier(.22,1,.36,1); }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(99,160,220,0.35); border-radius: 4px; }
      `}</style>

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside
        style={{
          width: 230,
          background: "#0f1f35",
          borderRight: "1px solid rgba(99,160,220,0.15)",
        }}
        className="flex flex-col flex-shrink-0"
      >
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-[rgba(99,160,220,0.15)]">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
            P
          </div>
          <div className="text-xl font-black leading-none">
            <span className="text-blue-400">Pasada</span>
            <span className="text-orange-400">Now</span>
          </div>
        </div>
        <div className="px-5 pt-4 pb-1.5 text-[10px] font-bold text-[#6a9cbf] uppercase tracking-widest">
          Commuter
        </div>
        <nav className="flex-1 px-2.5">
          {navItems.map((n) => (
            <button
              key={n.id}
              onClick={() => setView(n.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium mb-0.5 transition-all text-left ${view === n.id ? "bg-blue-950/50 text-blue-400 font-semibold border border-[rgba(99,160,220,0.35)]" : "text-[#6a9cbf] hover:bg-white/[0.04] hover:text-[#cce0f5]"}`}
            >
              <span className="text-base">{n.icon}</span>
              {n.label}
              {view === n.id && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400" />
              )}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-[rgba(99,160,220,0.15)]">
          <div className="flex items-center gap-2.5 p-2 rounded-lg bg-[#132540] mb-3">
            <Avatar
              name={user.username || "C"}
              src={profilePic}
              size={32}
              colorClass="bg-blue-600"
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate">
                {user.username || "Commuter"}
              </div>
              <div className="text-[11px] text-[#6a9cbf]">Commuter</div>
            </div>
          </div>
          <a
            href="/logout"
            className="flex items-center gap-2 text-red-400 text-sm font-medium px-2 py-1.5 rounded-lg hover:bg-red-950/20 transition-colors"
          >
            <span>→</span> Sign Out
          </a>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header
          className="flex items-center gap-4 px-7 py-3.5 border-b border-[rgba(99,160,220,0.15)] flex-shrink-0"
          style={{ background: "#0f1f35" }}
        >
          <h2 className="text-lg font-bold whitespace-nowrap">
            {
              {
                dashboard: "PasadaNow Commuter Portal",
                history: "Trip Records",
                profile: "Profile Settings",
              }[view]
            }
          </h2>
          <div className="flex items-center gap-2 flex-1 max-w-xs bg-[#132540] border border-[rgba(99,160,220,0.15)] rounded-lg px-3.5 py-1.5">
            <span className="text-[#6a9cbf] text-xs">🔍</span>
            <input
              className="bg-transparent border-none outline-none text-[#cce0f5] text-sm w-full placeholder-[#6a9cbf]"
              placeholder="Search routes, drivers..."
            />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs text-[#6a9cbf] whitespace-nowrap">
              {clock}
            </span>
            <div className="relative w-8 h-8 bg-[#132540] border border-[rgba(99,160,220,0.15)] rounded-lg flex items-center justify-center cursor-pointer text-[#6a9cbf] hover:text-[#cce0f5] transition-colors text-sm">
              🔔
              {stats.onlineDrivers > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-orange-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                  {stats.onlineDrivers}
                </span>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-7">
          {/* ── DASHBOARD ─────────────────────────────────────────────── */}
          {view === "dashboard" && (
            <div className="fade-up">
              <div className="grid grid-cols-4 gap-3.5 mb-5">
                <StatCard
                  icon={<span className="text-blue-400 text-base">🚌</span>}
                  value={stats.totalRides || 0}
                  label="Total Bookings"
                  accent="blue"
                />
                <StatCard
                  icon={<span className="text-green-400 text-base">👥</span>}
                  value={stats.onlineDrivers}
                  label="Online Drivers"
                  accent="green"
                />
                <StatCard
                  icon={
                    <span className="text-orange-400 font-bold text-base">
                      ₱
                    </span>
                  }
                  value={stats.lastFare}
                  label="Last Fare"
                  accent="orange"
                />
                <StatCard
                  icon={<span className="text-purple-400 text-base">⏰</span>}
                  value={<span className="text-sm">COMMUTER</span>}
                  label="Account Type"
                  accent="purple"
                />
              </div>

              <div
                ref={mapRef}
                className="rounded-xl border border-[rgba(99,160,220,0.15)] mb-4"
                style={{ height: 260 }}
              />

              <div
                className="grid gap-4"
                style={{ gridTemplateColumns: "1.3fr 0.7fr" }}
              >
                {/* Book a Ride */}
                <div className="bg-[#0f1f35] border border-[rgba(99,160,220,0.15)] rounded-xl p-5">
                  <div className="flex items-center gap-2 text-sm font-semibold mb-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_6px_#3b8ee8]" />
                    Book a Ride
                  </div>
                  {renderBookingPanel()}
                  {bookingState === "idle" && (
                    <div>
                      <div className="mb-3">
                        <label className="block text-[11px] font-bold uppercase tracking-widest text-[#6a9cbf] mb-1.5">
                          Pickup Point
                        </label>
                        <input
                          value={origin}
                          onChange={(e) => setOrigin(e.target.value)}
                          className="w-full px-3 py-2.5 bg-[#132540] border border-[rgba(99,160,220,0.15)] rounded-lg text-sm text-[#cce0f5] outline-none focus:border-blue-500 transition-colors placeholder-[#6a9cbf]"
                          placeholder="Your current location..."
                        />
                      </div>
                      <div className="mb-3">
                        <label className="block text-[11px] font-bold uppercase tracking-widest text-[#6a9cbf] mb-1.5">
                          Destination
                        </label>
                        <input
                          value={destination}
                          onChange={(e) => setDestination(e.target.value)}
                          className="w-full px-3 py-2.5 bg-[#132540] border border-[rgba(99,160,220,0.15)] rounded-lg text-sm text-[#cce0f5] outline-none focus:border-blue-500 transition-colors placeholder-[#6a9cbf]"
                          placeholder="Enter destination..."
                        />
                      </div>
                      <div className="mb-3">
                        <label className="block text-[11px] font-bold uppercase tracking-widest text-[#6a9cbf] mb-1.5">
                          Select Driver
                        </label>
                        <select
                          value={selectedDriver?.id || ""}
                          onChange={(e) => {
                            const d = drivers.find(
                              (x) => x.id == e.target.value,
                            );
                            setSelectedDriver(d || null);
                          }}
                          className="w-full px-3 py-2.5 bg-[#132540] border border-[rgba(99,160,220,0.15)] rounded-lg text-sm text-[#cce0f5] outline-none focus:border-blue-500 transition-colors cursor-pointer"
                        >
                          <option value="">— Choose an online driver —</option>
                          {drivers.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.username} ({d.plate_number || "No plate"})
                            </option>
                          ))}
                        </select>
                      </div>
                      {fare && (
                        <div className="mb-3 px-3 py-2.5 bg-green-950/30 border border-green-700/20 rounded-lg">
                          <div className="text-[10px] font-bold uppercase tracking-widest text-green-400 mb-0.5">
                            Estimated Fare
                          </div>
                          <div className="text-2xl font-bold text-green-400">
                            ₱{fare.amount.toFixed(2)}
                          </div>
                          <div className="text-[11px] text-green-600 mt-0.5">
                            ~{fare.dist.toFixed(1)} km · ₱15.00 base + ₱2.00/km
                          </div>
                        </div>
                      )}
                      <button
                        onClick={submitBooking}
                        className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:opacity-90 transition-opacity"
                      >
                        Find a Driver →
                      </button>
                    </div>
                  )}
                </div>

                {/* Driver list */}
                <div className="bg-[#0f1f35] border border-[rgba(99,160,220,0.15)] rounded-xl p-5">
                  <div className="flex items-center gap-2 text-sm font-semibold mb-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_6px_#22c55e]" />
                    Nearest Drivers
                  </div>
                  {drivers.length === 0 ? (
                    <div className="text-center py-6 text-[#6a9cbf] text-sm">
                      No drivers online right now.
                    </div>
                  ) : (
                    drivers.map((d) => (
                      <div
                        key={d.id}
                        onClick={() => setSelectedDriver(d)}
                        className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors mb-0.5 border ${selectedDriver?.id === d.id ? "bg-blue-950/40 border-[rgba(99,160,220,0.35)]" : "border-transparent hover:bg-blue-950/20"}`}
                      >
                        <Avatar
                          name={d.username}
                          size={34}
                          colorClass="bg-blue-700"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold truncate">
                            {d.username}
                          </div>
                          <div className="text-[11px] text-[#6a9cbf]">
                            {d.plate_number || "No plate"} · Tricycle
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-green-400 bg-green-950/30 px-2 py-1 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400 pulse-dot" />
                          Online
                        </div>
                      </div>
                    ))
                  )}
                  <div className="mt-4 pt-3 border-t border-[rgba(99,160,220,0.15)]">
                    <div className="text-[11px] font-bold uppercase tracking-widest text-[#6a9cbf] mb-2">
                      Fleet Summary
                    </div>
                    {[
                      ["Online Drivers", stats.onlineDrivers],
                      ["Last Fare Paid", stats.lastFare],
                    ].map(([k, v]) => (
                      <div
                        key={k}
                        className="flex justify-between text-sm py-1.5 border-b border-[rgba(99,160,220,0.08)] last:border-none"
                      >
                        <span className="text-[#6a9cbf]">{k}</span>
                        <span className="font-bold text-[#cce0f5]">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── HISTORY ───────────────────────────────────────────────── */}
          {view === "history" && (
            <div className="fade-up bg-[#0f1f35] border border-[rgba(99,160,220,0.15)] rounded-xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-2 flex-1 bg-[#132540] border border-[rgba(99,160,220,0.15)] rounded-lg px-3 py-1.5">
                  <span className="text-xs text-[#6a9cbf]">🔍</span>
                  <input
                    value={historyFilter}
                    onChange={(e) => setHistoryFilter(e.target.value)}
                    className="bg-transparent border-none outline-none text-sm text-[#cce0f5] w-full placeholder-[#6a9cbf]"
                    placeholder="Filter trips..."
                  />
                </div>
                <span className="text-sm font-semibold text-blue-400 border border-[rgba(99,160,220,0.35)] px-3 py-1.5 rounded-lg">
                  Trip Records
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[rgba(99,160,220,0.15)]">
                      {[
                        "Trip ID",
                        "Date",
                        "Route",
                        "Driver",
                        "Fare",
                        "Status",
                      ].map((h) => (
                        <th
                          key={h}
                          className="text-left py-2.5 px-3 text-[11px] font-bold uppercase tracking-widest text-[#6a9cbf]"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHistory.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="text-center py-8 text-[#6a9cbf]"
                        >
                          No trip records yet.
                        </td>
                      </tr>
                    ) : (
                      filteredHistory.map((r) => (
                        <tr
                          key={r.id}
                          className="border-b border-[rgba(99,160,220,0.08)] hover:bg-blue-950/10 last:border-none"
                        >
                          <td className="py-3 px-3 text-[#6a9cbf]">
                            #TRP-{String(r.id).padStart(3, "0")}
                          </td>
                          <td className="py-3 px-3 text-xs">
                            {new Date(r.created_at).toLocaleDateString(
                              "en-PH",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )}
                          </td>
                          <td className="py-3 px-3 text-xs">
                            {r.origin} → {r.destination}
                          </td>
                          <td className="py-3 px-3">{r.driver}</td>
                          <td className="py-3 px-3 font-semibold">
                            ₱{parseFloat(r.fare).toFixed(2)}
                          </td>
                          <td className="py-3 px-3">
                            <StatusBadge status={r.status} />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── PROFILE ───────────────────────────────────────────────── */}
          {view === "profile" && (
            <div className="fade-up max-w-2xl">
              {profileMsg.show && (
                <div
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-sm font-semibold mb-4 ${profileMsg.type === "success" ? "bg-green-950/30 border border-green-700/30 text-green-400" : "bg-red-950/30 border border-red-700/30 text-red-400"}`}
                >
                  {profileMsg.text}
                </div>
              )}
              <form onSubmit={saveProfile}>
                <div className="flex items-center gap-5 p-5 bg-[#132540] border border-[rgba(99,160,220,0.15)] rounded-xl mb-4">
                  <div className="w-[72px] h-[72px] rounded-full bg-blue-700 border-2 border-[rgba(99,160,220,0.4)] flex items-center justify-center text-white text-2xl font-black overflow-hidden flex-shrink-0">
                    {profilePic ? (
                      <img
                        src={profilePic}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      (profile.fullname?.[0] || "C").toUpperCase()
                    )}
                  </div>
                  <div>
                    <div className="font-semibold mb-0.5">
                      {profile.fullname}
                    </div>
                    <div className="text-xs text-[#6a9cbf] mb-2.5">
                      Commuter Account · {profile.email}
                    </div>
                    <label className="relative inline-block cursor-pointer px-3.5 py-1.5 text-xs font-semibold bg-[#0f1f35] border border-[rgba(99,160,220,0.35)] rounded-lg text-[#cce0f5] hover:border-[rgba(99,160,220,0.6)] transition-colors">
                      Change Photo
                      <input
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={(e) => {
                          const f = e.target.files[0];
                          if (!f) return;
                          setProfileFile(f);
                          const reader = new FileReader();
                          reader.onload = (ev) =>
                            setProfilePic(ev.target.result);
                          reader.readAsDataURL(f);
                        }}
                      />
                    </label>
                  </div>
                </div>
                <div className="bg-[#0f1f35] border border-[rgba(99,160,220,0.15)] rounded-xl p-5">
                  <div className="flex items-center gap-2 text-sm font-semibold mb-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_6px_#3b8ee8]" />
                    Personal Information
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    {[
                      [
                        "Full Name",
                        "text",
                        profile.fullname,
                        (v) => setProfile((p) => ({ ...p, fullname: v })),
                      ],
                      [
                        "Contact Number",
                        "text",
                        profile.contact,
                        (v) => setProfile((p) => ({ ...p, contact: v })),
                      ],
                    ].map(([label, type, val, setter]) => (
                      <div key={label}>
                        <label className="block text-[11px] font-bold uppercase tracking-widest text-[#6a9cbf] mb-1.5">
                          {label}
                        </label>
                        <input
                          type={type}
                          value={val}
                          onChange={(e) => setter(e.target.value)}
                          className="w-full px-3 py-2.5 bg-[#132540] border border-[rgba(99,160,220,0.15)] rounded-lg text-sm text-[#cce0f5] outline-none focus:border-blue-500 transition-colors"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="mb-3">
                    <label className="block text-[11px] font-bold uppercase tracking-widest text-[#6a9cbf] mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) =>
                        setProfile((p) => ({ ...p, email: e.target.value }))
                      }
                      className="w-full px-3 py-2.5 bg-[#132540] border border-[rgba(99,160,220,0.15)] rounded-lg text-sm text-[#cce0f5] outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="block text-[11px] font-bold uppercase tracking-widest text-[#6a9cbf] mb-1.5">
                      Home Address
                    </label>
                    <textarea
                      value={profile.address}
                      onChange={(e) =>
                        setProfile((p) => ({ ...p, address: e.target.value }))
                      }
                      rows={3}
                      className="w-full px-3 py-2.5 bg-[#132540] border border-[rgba(99,160,220,0.15)] rounded-lg text-sm text-[#cce0f5] outline-none focus:border-blue-500 transition-colors resize-y"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-[11px] font-bold uppercase tracking-widest text-[#6a9cbf] mb-1.5">
                      New Password{" "}
                      <span className="font-normal text-[#6a9cbf]">
                        (leave blank to keep)
                      </span>
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="w-full px-3 py-2.5 bg-[#132540] border border-[rgba(99,160,220,0.15)] rounded-lg text-sm text-[#cce0f5] outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div className="flex gap-2.5">
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:opacity-90 transition-opacity"
                    >
                      Save Changes
                    </button>
                    <button
                      type="button"
                      className="px-6 py-2.5 bg-[#132540] text-[#cce0f5] border border-[rgba(99,160,220,0.35)] rounded-lg text-sm font-bold hover:border-[rgba(99,160,220,0.6)] transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>

      {/* ── Driver Online Popup ───────────────────────────────────────────── */}
      {driverPopup === "online" && (
        <div className="fixed top-20 right-6 w-80 bg-[#0f1f35] border border-green-500/50 rounded-xl p-4 z-50 slide-down shadow-2xl">
          <div className="flex items-center gap-2.5 mb-2.5">
            <div className="w-9 h-9 rounded-full bg-green-950/50 border-2 border-green-500/40 flex items-center justify-center text-green-400 text-base">
              🚗
            </div>
            <div>
              <div className="text-sm font-bold text-green-400">
                Driver Now Available!
              </div>
              <div className="text-xs text-[#6a9cbf]">
                A driver just came online near you
              </div>
            </div>
          </div>
          <div className="text-sm text-[#cce0f5] mb-3">
            <span className="font-bold text-green-400">{driverPopupCount}</span>{" "}
            driver(s) available and ready.
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setDriverPopup(null);
                setView("dashboard");
              }}
              className="flex-1 py-2 bg-green-500 text-white rounded-lg text-sm font-bold hover:opacity-90 transition-opacity"
            >
              Book Now →
            </button>
            <button
              onClick={() => setDriverPopup(null)}
              className="px-3 py-2 bg-[#132540] text-[#6a9cbf] border border-[rgba(99,160,220,0.15)] rounded-lg text-sm"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
      {driverPopup === "offline" && (
        <div className="fixed bottom-20 right-6 w-80 bg-[#0f1f35] border border-red-500/50 rounded-xl p-4 z-50 slide-down shadow-2xl">
          <div className="flex items-center gap-2.5 mb-2.5">
            <div className="w-9 h-9 rounded-full bg-red-950/50 border-2 border-red-500/40 flex items-center justify-center text-red-400 text-base">
              🚫
            </div>
            <div>
              <div className="text-sm font-bold text-red-400">
                Driver Went Offline
              </div>
              <div className="text-xs text-[#6a9cbf]">
                {driverPopupCount === 0
                  ? "No drivers available"
                  : `${driverPopupCount} driver(s) still online`}
              </div>
            </div>
          </div>
          <button
            onClick={() => setDriverPopup(null)}
            className="w-full py-2 bg-red-950/30 text-red-400 border border-red-700/30 rounded-lg text-sm font-bold"
          >
            OK, Got It
          </button>
        </div>
      )}

      {/* ── Trip Complete Popup ───────────────────────────────────────────── */}
      {completePopup && bookingData && (
        <div className="fixed top-20 right-6 w-80 bg-[#0f1f35] border border-purple-500/50 rounded-xl p-4 z-50 slide-down shadow-2xl">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-9 h-9 rounded-full bg-purple-950/50 border-2 border-purple-500/40 flex items-center justify-center text-purple-400 text-base">
              ✓
            </div>
            <div>
              <div className="text-sm font-bold text-purple-400">
                Trip Completed!
              </div>
              <div className="text-xs text-[#6a9cbf]">
                Your ride has been finished
              </div>
            </div>
          </div>
          <div className="text-xs text-[#6a9cbf] mb-1">
            {bookingData.origin} → {bookingData.destination}
          </div>
          <div className="text-2xl font-black text-purple-400 mb-3">
            ₱{parseFloat(bookingData.fare || 0).toFixed(2)}
          </div>
          <div className="text-sm text-[#cce0f5] mb-3">
            Thank you for riding with{" "}
            <span className="font-bold text-purple-400">PasadaNow</span>! 🎉
          </div>
          <button
            onClick={() => setCompletePopup(false)}
            className="w-full py-2 bg-purple-950/30 text-purple-400 border border-purple-700/30 rounded-lg text-sm font-bold"
          >
            Done
          </button>
        </div>
      )}

      <Toast {...toast} />
    </div>
  );
}
