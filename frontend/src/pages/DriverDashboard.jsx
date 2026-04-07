import { useState, useEffect, useRef, useCallback } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import api from "../config/axios";

const user = JSON.parse(localStorage.getItem("user") || "{}");

// ── helpers ──────────────────────────────────────────────────────────────────
function Avatar({ name, src, size = 32, colorClass = "bg-orange-600" }) {
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

// ── Main Component ──────────────────────────────────────────────────────────
export default function DriverDashboard() {
  const [view, setView] = useState("dashboard");
  const [toast, setToast] = useState({ show: false, msg: "", type: "blue" });
  const [isOnline, setIsOnline] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [stats, setStats] = useState({
    totalEarned: 0,
    totalTrips: 0,
    todayEarned: 0,
    todayTrips: 0,
  });
  const [driverInfo, setDriverInfo] = useState({});
  const [history, setHistory] = useState([]);
  const [historyFilter, setHistoryFilter] = useState("");
  const [notifList, setNotifList] = useState([]);
  const [notifCount, setNotifCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [rideRequest, setRideRequest] = useState(null);
  const [rideTimer, setRideTimer] = useState(30);
  const [activeTrip, setActiveTrip] = useState(null);
  const [tripDone, setTripDone] = useState(false);
  const [clock, setClock] = useState("");
  const [profile, setProfile] = useState({
    username: "",
    contact_no: "",
    address: "",
    plate_number: "",
    license_no: "",
    organization: "",
    new_password: "",
  });
  const [profilePic, setProfilePic] = useState(null);
  const [profileFile, setProfileFile] = useState(null);
  const [profileMsg, setProfileMsg] = useState("");

  const mapRef = useRef(null);
  const mapInited = useRef(false);
  const markerRef = useRef(null);
  const mapObj = useRef(null);
  const pollRef = useRef(null);
  const timerRef = useRef(null);
  const currentRide = useRef(null);
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
    mapObj.current = map;

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

  // ── Load initial data ─────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      const [profileRes, statsRes, histRes] = await Promise.all([
        api.get("?ajax=driver_profile"),
        api.get("?ajax=driver_stats"),
        api.get("?ajax=driver_history"),
      ]);
      if (profileRes.data) {
        setDriverInfo(profileRes.data);
        setIsOnline(!!profileRes.data.is_available);
        setProfile((p) => ({ ...p, ...profileRes.data }));
        if (profileRes.data.profile_pic)
          setProfilePic(`../images/profiles/${profileRes.data.profile_pic}`);
      }
      if (statsRes.data) setStats(statsRes.data);
      if (histRes.data) setHistory(histRes.data);
    } catch {}
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── WebSocket ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS("http://localhost:8080/ws"),
      onConnect: () => {
        client.subscribe("/topic/rides", (msg) => {
          const data = JSON.parse(msg.body);
          if (data.driver_id === user.id) showRideCard(data);
        });
      },
    });
    client.activate();
    stompRef.current = client;
    return () => client.deactivate();
  }, []);

  // ── Notifications ─────────────────────────────────────────────────────────
  const refreshNotifCount = useCallback(async () => {
    try {
      const res = await api.get("?ajax=notif_count");
      setNotifCount(res.data.count || 0);
    } catch {}
  }, []);

  const loadNotifList = useCallback(async () => {
    try {
      const res = await api.get("?ajax=notif_list");
      setNotifList(res.data.notifs || []);
    } catch {}
  }, []);

  useEffect(() => {
    refreshNotifCount();
    const id = setInterval(refreshNotifCount, 5000);
    return () => clearInterval(id);
  }, [refreshNotifCount]);

  // ── Polling for ride requests ──────────────────────────────────────────────
  const checkForRequest = useCallback(async () => {
    if (!isOnline || activeTrip) return;
    if (rideRequest) return;
    try {
      const res = await api.get("?ajax=check_request");
      if (res.data && res.data.id) showRideCard(res.data);
    } catch {}
  }, [isOnline, activeTrip, rideRequest]);

  useEffect(() => {
    if (isOnline && !activeTrip) {
      pollRef.current = setInterval(checkForRequest, 3000);
      checkForRequest();
    } else {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [isOnline, activeTrip, checkForRequest]);

  // ── Show ride card ─────────────────────────────────────────────────────────
  const showRideCard = (data) => {
    if (currentRide.current && currentRide.current.id === data.id) return;
    currentRide.current = data;
    setRideRequest(data);
    setRideTimer(30);
    refreshNotifCount();
    showToast("🔔 New ride request!", "orange");
    if (timerRef.current) clearInterval(timerRef.current);
    let secs = 30;
    timerRef.current = setInterval(() => {
      secs--;
      setRideTimer(secs);
      if (secs <= 0) {
        clearInterval(timerRef.current);
        timerRef.current = null;
        respondToRide("declined");
      }
    }, 1000);
  };

  const hideRideCard = () => {
    setRideRequest(null);
    currentRide.current = null;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // ── Respond to ride ────────────────────────────────────────────────────────
  const respondToRide = async (action) => {
    if (!currentRide.current) return;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    const snap = { ...currentRide.current };
    hideRideCard();
    try {
      const fd = new FormData();
      fd.append("status", action);
      fd.append("trip_id", snap.id);
      const res = await api.post("?ajax=update_status", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data.success) {
        if (action === "accepted") {
          setActiveTrip({ ...snap, status: "accepted" });
          setIsOnline(false);
          showToast("✓ Ride accepted! Go pick up the commuter.", "green");
        } else showToast("Ride declined.", "red");
        refreshNotifCount();
      } else showToast("Failed to update. Please retry.", "red");
    } catch {
      showToast("Network error.", "red");
    }
  };

  // ── Start trip ──────────────────────────────────────────────────────────────
  const startTrip = async () => {
    if (!activeTrip) return;
    if (!confirm("Start the trip now?")) return;
    try {
      const fd = new FormData();
      fd.append("status", "ongoing");
      fd.append("trip_id", activeTrip.id);
      const res = await api.post("?ajax=update_status", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data.success) {
        setActiveTrip((t) => ({ ...t, status: "ongoing" }));
        showToast("🚗 Trip started! En route to destination.", "yellow");
      } else showToast("Failed to start trip.", "red");
    } catch {
      showToast("Network error.", "red");
    }
  };

  // ── Complete trip ───────────────────────────────────────────────────────────
  const completeTrip = async () => {
    if (!activeTrip) return;
    if (!confirm("Mark this trip as completed?")) return;
    try {
      const fd = new FormData();
      fd.append("status", "completed");
      fd.append("trip_id", activeTrip.id);
      const res = await api.post("?ajax=update_status", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data.success) {
        setActiveTrip(null);
        setIsOnline(true);
        setTripDone(true);
        showToast("✓ Trip completed! Back online now.", "purple");
        loadData();
        setTimeout(() => setTripDone(false), 8000);
      } else showToast("Failed to complete trip.", "red");
    } catch {
      showToast("Network error.", "red");
    }
  };

  // ── Toggle online ──────────────────────────────────────────────────────────
  const toggleQueue = async () => {
    setToggleLoading(true);
    try {
      const fd = new FormData();
      fd.append("status", isOnline ? "leave" : "join");
      const res = await api.post("?ajax=toggle_queue", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data.success) {
        const newState = res.data.is_available === 1;
        setIsOnline(newState);
        showToast(
          newState ? "✓ You are now Online" : "You are now Offline",
          newState ? "green" : "red",
        );
      } else showToast("Failed to update status.", "red");
    } catch {
      showToast("Network error.", "red");
    }
    setToggleLoading(false);
  };

  // ── Profile save ───────────────────────────────────────────────────────────
  const saveProfile = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(profile).forEach(([k, v]) => fd.append(k, v));
    fd.append("update_profile", "1");
    if (profileFile) fd.append("profile_img", profileFile);
    try {
      await api.post("", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setProfileMsg("Profile updated successfully!");
      setTimeout(() => setProfileMsg(""), 4000);
      showToast("✓ Profile saved!", "green");
    } catch {
      showToast("Failed to save.", "red");
    }
  };

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "⊞" },
    { id: "earnings", label: "Earnings & History", icon: "₱" },
    { id: "fare_matrix", label: "Fare Matrix", icon: "📋" },
    { id: "profile", label: "My Profile", icon: "◉" },
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
        @keyframes slideUp2 { from{opacity:0;transform:translateX(-50%) translateY(24px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
        @keyframes ringPulse { 0%{box-shadow:0 0 0 0 rgba(240,130,40,0.7)} 70%{box-shadow:0 0 0 18px rgba(240,130,40,0)} 100%{box-shadow:0 0 0 0 rgba(240,130,40,0)} }
        @keyframes pulse2 { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes spin { to{transform:rotate(360deg)} }
        .ride-card-anim { animation: slideUp2 0.35s ease, ringPulse 1.5s 3; }
        .pulse-dot { animation: pulse2 2s infinite; }
        .fade-up { animation: fadeUp 0.25s ease; }
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
          Driver
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
          <div className="flex items-center gap-2.5 p-2 rounded-lg bg-[#132540] mb-2">
            <Avatar
              name={driverInfo.username || user.username || "D"}
              src={profilePic}
              size={32}
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate">
                {driverInfo.username || user.username}
              </div>
              <div className="text-[11px] text-[#6a9cbf]">
                {driverInfo.plate_number || "Driver"}
              </div>
            </div>
          </div>
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold mb-2.5 transition-all ${isOnline ? "bg-green-950/30 text-green-400 border border-green-700/20" : "bg-white/5 text-[#6a9cbf] border border-[rgba(99,160,220,0.15)]"}`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isOnline ? "bg-green-400 pulse-dot" : "bg-[#6a9cbf]"}`}
            />
            {isOnline ? "Online — Accepting Rides" : "Offline"}
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
                dashboard: "PasadaNow Driver Portal",
                earnings: "Earnings & History",
                fare_matrix: "Fare Matrix",
                profile: "Profile Settings",
              }[view]
            }
          </h2>
          <div className="flex items-center gap-2 flex-1 max-w-xs bg-[#132540] border border-[rgba(99,160,220,0.15)] rounded-lg px-3.5 py-1.5">
            <span className="text-[#6a9cbf] text-xs">🔍</span>
            <input
              className="bg-transparent border-none outline-none text-[#cce0f5] text-sm w-full placeholder-[#6a9cbf]"
              placeholder="Search trips, commuters..."
            />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs text-[#6a9cbf] whitespace-nowrap">
              {clock}
            </span>
            <div className="relative">
              <button
                onClick={() => {
                  setNotifOpen((o) => !o);
                  loadNotifList();
                }}
                className="w-8 h-8 bg-[#132540] border border-[rgba(99,160,220,0.15)] rounded-lg flex items-center justify-center cursor-pointer text-[#6a9cbf] hover:text-[#cce0f5] transition-colors text-sm"
              >
                🔔
                {notifCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                    {notifCount}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div
                  className="absolute top-full right-0 mt-2.5 w-80 bg-[#0f1f35] border border-[rgba(99,160,220,0.35)] rounded-xl shadow-2xl z-50"
                  style={{ animation: "fadeUp 0.18s ease" }}
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(99,160,220,0.15)]">
                    <span className="text-sm font-bold">
                      Pending Ride Requests
                    </span>
                    <button
                      onClick={() => setNotifOpen(false)}
                      className="text-xs text-blue-400"
                    >
                      Close
                    </button>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifList.length === 0 ? (
                      <div className="text-center py-6 text-[#6a9cbf] text-sm">
                        No pending requests
                      </div>
                    ) : (
                      notifList.map((n) => (
                        <div
                          key={n.id}
                          className="flex items-start gap-2.5 px-4 py-3 border-b border-[rgba(99,160,220,0.08)] hover:bg-blue-950/20 cursor-pointer transition-colors last:border-none"
                        >
                          <div className="w-2 h-2 rounded-full bg-orange-500 mt-1 flex-shrink-0 shadow-[0_0_6px_#f08228]" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold">
                              Ride from {n.commuter_name}
                            </div>
                            <div className="text-xs text-[#6a9cbf] truncate">
                              {n.origin} → {n.destination}
                            </div>
                            <div className="text-xs font-bold text-green-400 mt-0.5">
                              ₱{parseFloat(n.fare).toFixed(2)}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-7">
          {/* ── DASHBOARD ───────────────────────────────────────────────── */}
          {view === "dashboard" && (
            <div className="fade-up">
              <div className="grid grid-cols-4 gap-3.5 mb-5">
                <StatCard
                  icon={<span className="text-green-400 font-bold">₱</span>}
                  value={`₱${Number(stats.totalEarned || 0).toFixed(2)}`}
                  label="Total Earned"
                  accent="green"
                />
                <StatCard
                  icon={<span className="text-blue-400 text-base">🚌</span>}
                  value={stats.totalTrips || 0}
                  label="Total Trips"
                  accent="blue"
                />
                <StatCard
                  icon={<span className="text-orange-400 font-bold">₱</span>}
                  value={`₱${Number(stats.todayEarned || 0).toFixed(2)}`}
                  label="Today's Earnings"
                  accent="orange"
                />
                <StatCard
                  icon={<span className="text-purple-400 text-base">⏰</span>}
                  value={
                    <span
                      className={`text-sm font-bold ${isOnline ? "text-green-400" : "text-[#6a9cbf]"}`}
                    >
                      {isOnline ? "ONLINE" : "OFFLINE"}
                    </span>
                  }
                  label="Current Status"
                  accent="purple"
                />
              </div>

              {/* Status toggle bar */}
              <div
                className={`flex items-center justify-between px-5 py-3.5 rounded-xl border mb-4 transition-all ${isOnline ? "border-green-500/30 bg-green-950/10" : "border-[rgba(99,160,220,0.15)] bg-[#0f1f35]"}`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${isOnline ? "bg-green-400 shadow-[0_0_10px_#22c55e] pulse-dot" : "bg-[#6a9cbf]"}`}
                  />
                  <div>
                    <div className="text-sm font-semibold">
                      {isOnline
                        ? "System Online — Accepting Requests"
                        : "System Offline"}
                    </div>
                    <div className="text-xs text-[#6a9cbf] mt-0.5">
                      {isOnline
                        ? "Waiting for passenger booking requests..."
                        : "Toggle online to start receiving rides."}
                    </div>
                  </div>
                </div>
                <button
                  onClick={toggleQueue}
                  disabled={toggleLoading || !!activeTrip}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all disabled:opacity-60 disabled:cursor-not-allowed ${isOnline ? "bg-red-950/30 text-red-400 border border-red-700/30" : "bg-green-500 text-white shadow-[0_4px_16px_rgba(34,197,94,0.35)]"}`}
                >
                  {toggleLoading && (
                    <span
                      className="w-3 h-3 border-2 border-current border-t-transparent rounded-full"
                      style={{ animation: "spin 0.7s linear infinite" }}
                    />
                  )}
                  {isOnline ? "Go Offline" : "Go Online"}
                </button>
              </div>

              {/* Active trip banner */}
              {activeTrip && (
                <div
                  className={`flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl border mb-4 fade-up ${activeTrip.status === "ongoing" ? "border-yellow-500/30 bg-yellow-950/10" : "border-green-500/30 bg-green-950/10"}`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2.5 h-2.5 rounded-full flex-shrink-0 pulse-dot ${activeTrip.status === "ongoing" ? "bg-yellow-400 shadow-[0_0_8px_#eab308]" : "bg-green-400 shadow-[0_0_8px_#22c55e]"}`}
                    />
                    <div>
                      <div
                        className={`text-sm font-bold ${activeTrip.status === "ongoing" ? "text-yellow-400" : "text-green-400"}`}
                      >
                        {activeTrip.status === "ongoing"
                          ? "Trip Ongoing — En Route"
                          : "Active Trip — Picking Up Commuter"}
                      </div>
                      <div className="text-xs text-[#6a9cbf] mt-0.5">
                        <b className="text-[#cce0f5]">
                          {activeTrip.commuter_name}
                        </b>{" "}
                        · {activeTrip.origin} → {activeTrip.destination} ·{" "}
                        <b className="text-green-400">
                          ₱{parseFloat(activeTrip.fare).toFixed(2)}
                        </b>
                        {activeTrip.commuter_phone && (
                          <>
                            {" "}
                            · <span>{activeTrip.commuter_phone}</span>
                          </>
                        )}
                      </div>
                      {activeTrip.status === "ongoing" && (
                        <div
                          className="mt-1.5 h-1 rounded overflow-hidden w-44 opacity-70"
                          style={{
                            background:
                              "repeating-linear-gradient(90deg,#eab308 0,#eab308 18px,transparent 18px,transparent 36px)",
                            backgroundSize: "54px 100%",
                            animation: "roadAnim 0.7s linear infinite",
                          }}
                        />
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {activeTrip.status === "accepted" && (
                      <button
                        onClick={startTrip}
                        className="px-4 py-2.5 bg-yellow-400 text-black rounded-lg text-sm font-bold hover:opacity-90 transition-opacity"
                      >
                        🚗 Start Trip
                      </button>
                    )}
                    {activeTrip.status === "ongoing" && (
                      <button
                        onClick={completeTrip}
                        className="px-4 py-2.5 bg-green-500 text-white rounded-lg text-sm font-bold hover:opacity-90 transition-opacity"
                      >
                        Mark as Completed ✓
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Trip done banner */}
              {tripDone && (
                <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl border border-purple-500/30 bg-purple-950/20 mb-4 fade-up">
                  <div className="w-9 h-9 rounded-full bg-purple-950/50 border-2 border-purple-500/40 flex items-center justify-center text-purple-400">
                    ✓
                  </div>
                  <div>
                    <div className="text-sm font-bold text-purple-400">
                      Trip Completed Successfully!
                    </div>
                    <div className="text-xs text-[#6a9cbf] mt-0.5">
                      You are back online and ready for new rides.
                    </div>
                  </div>
                </div>
              )}

              {/* Map with ride request overlay */}
              <div className="relative rounded-xl border border-[rgba(99,160,220,0.15)] overflow-hidden mb-4">
                <div ref={mapRef} style={{ height: 360 }} />
                {rideRequest && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[92%] max-w-md bg-[#132540] border-2 border-orange-500 rounded-xl p-5 z-10 shadow-2xl ride-card-anim">
                    <div className="flex items-center gap-2.5 mb-3.5">
                      <div className="w-8 h-8 bg-orange-950/50 rounded-full flex items-center justify-center text-orange-400 text-base flex-shrink-0">
                        🔔
                      </div>
                      <div>
                        <div className="text-base font-bold text-orange-400">
                          New Ride Request!
                        </div>
                        <div className="text-xs text-[#6a9cbf]">
                          From: {rideRequest.commuter_name}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 mb-3">
                      {[
                        ["From", rideRequest.origin],
                        ["To", rideRequest.destination],
                      ].map(([l, v]) => (
                        <div
                          key={l}
                          className="flex-1 bg-[#0f1f35] rounded-lg p-2.5"
                        >
                          <div className="text-[10px] font-bold uppercase tracking-widest text-[#6a9cbf] mb-0.5">
                            {l}
                          </div>
                          <div className="text-xs font-semibold truncate">
                            {v}
                          </div>
                        </div>
                      ))}
                      <div className="bg-[#0f1f35] rounded-lg p-2.5 text-center">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-[#6a9cbf] mb-0.5">
                          Fare
                        </div>
                        <div className="text-xl font-black text-green-400">
                          ₱{parseFloat(rideRequest.fare).toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-[#6a9cbf] mb-3">
                      Auto-decline in{" "}
                      <span className="text-base font-bold text-orange-400 min-w-[24px]">
                        {rideTimer}s
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => respondToRide("accepted")}
                        className="flex-1 py-2.5 bg-green-500 text-white rounded-lg text-sm font-bold hover:opacity-90 transition-opacity"
                      >
                        ✓ Accept Ride
                      </button>
                      <button
                        onClick={() => respondToRide("declined")}
                        className="px-4 py-2.5 bg-red-950/30 text-red-400 border border-red-700/30 rounded-lg text-sm font-bold"
                      >
                        ✕ Decline
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#0f1f35] border border-[rgba(99,160,220,0.15)] rounded-xl p-5">
                  <div className="flex items-center gap-2 text-sm font-semibold mb-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shadow-[0_0_6px_#f08228]" />
                    Vehicle Info
                  </div>
                  {[
                    ["Plate Number", driverInfo.plate_number],
                    ["License No.", driverInfo.license_no],
                    ["Organization", driverInfo.organization],
                    ["Contact", driverInfo.contact_no],
                  ].map(([k, v]) => (
                    <div
                      key={k}
                      className="flex py-2.5 border-b border-[rgba(99,160,220,0.08)] last:border-none"
                    >
                      <span className="text-[#6a9cbf] text-sm w-32 flex-shrink-0">
                        {k}
                      </span>
                      <span className="text-sm font-semibold">{v || "—"}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-[#0f1f35] border border-[rgba(99,160,220,0.15)] rounded-xl p-5">
                  <div className="flex items-center gap-2 text-sm font-semibold mb-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_6px_#22c55e]" />
                    Today's Summary
                  </div>
                  {[
                    ["Trips Today", stats.todayTrips || 0],
                    [
                      "Earned Today",
                      `₱${Number(stats.todayEarned || 0).toFixed(2)}`,
                    ],
                    [
                      "Avg. Fare",
                      stats.totalTrips > 0
                        ? `₱${(stats.totalEarned / stats.totalTrips).toFixed(2)}`
                        : "₱0.00",
                    ],
                    [
                      "All-time",
                      `₱${Number(stats.totalEarned || 0).toFixed(2)}`,
                    ],
                  ].map(([k, v]) => (
                    <div
                      key={k}
                      className="flex py-2.5 border-b border-[rgba(99,160,220,0.08)] last:border-none"
                    >
                      <span className="text-[#6a9cbf] text-sm w-32 flex-shrink-0">
                        {k}
                      </span>
                      <span
                        className={`text-sm font-bold ${k.includes("Earned") || k === "All-time" ? "text-green-400" : ""}`}
                      >
                        {v}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── EARNINGS ──────────────────────────────────────────────── */}
          {view === "earnings" && (
            <div className="fade-up">
              <div className="grid grid-cols-4 gap-3.5 mb-5">
                <StatCard
                  icon={<span className="text-green-400 font-bold">₱</span>}
                  value={`₱${Number(stats.totalEarned || 0).toFixed(2)}`}
                  label="Total Earned"
                  accent="green"
                />
                <StatCard
                  icon={<span className="text-blue-400 text-base">🚌</span>}
                  value={stats.totalTrips || 0}
                  label="Completed Trips"
                  accent="blue"
                />
                <StatCard
                  icon={<span className="text-orange-400 font-bold">₱</span>}
                  value={`₱${Number(stats.todayEarned || 0).toFixed(2)}`}
                  label="Today's Earnings"
                  accent="orange"
                />
                <StatCard
                  icon={<span className="text-purple-400 text-base">📈</span>}
                  value={
                    stats.totalTrips > 0
                      ? `₱${(stats.totalEarned / stats.totalTrips).toFixed(2)}`
                      : "₱0.00"
                  }
                  label="Avg. Fare / Trip"
                  accent="purple"
                />
              </div>
              <div className="bg-[#0f1f35] border border-[rgba(99,160,220,0.15)] rounded-xl p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center gap-2 flex-1 bg-[#132540] border border-[rgba(99,160,220,0.15)] rounded-lg px-3 py-1.5">
                    <span className="text-xs text-[#6a9cbf]">🔍</span>
                    <input
                      value={historyFilter}
                      onChange={(e) => setHistoryFilter(e.target.value)}
                      placeholder="Filter trips..."
                      className="bg-transparent border-none outline-none text-sm text-[#cce0f5] w-full placeholder-[#6a9cbf]"
                    />
                  </div>
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_6px_#3b8ee8]" />
                    Trip History
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[rgba(99,160,220,0.15)]">
                        {[
                          "Date",
                          "Commuter",
                          "Origin",
                          "Destination",
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
                            <td className="py-3 px-3 text-xs text-[#6a9cbf]">
                              {new Date(r.created_at).toLocaleDateString(
                                "en-PH",
                                {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}
                            </td>
                            <td className="py-3 px-3">{r.commuter}</td>
                            <td className="py-3 px-3 text-xs">{r.origin}</td>
                            <td className="py-3 px-3 text-xs">
                              {r.destination}
                            </td>
                            <td className="py-3 px-3 font-bold">
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
            </div>
          )}

          {/* ── FARE MATRIX ───────────────────────────────────────────── */}
          {view === "fare_matrix" && (
            <div className="fade-up">
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  ["₱15.00", "Base Fare (First 4 km)"],
                  ["+ ₱2.00", "Per Succeeding km"],
                  ["4.0 km", "Minimum Distance"],
                ].map(([v, l]) => (
                  <div
                    key={l}
                    className="bg-[#132540] border border-[rgba(99,160,220,0.15)] rounded-xl p-4 text-center"
                  >
                    <div className="text-2xl font-bold text-orange-400 mb-1">
                      {v}
                    </div>
                    <div className="text-xs text-[#6a9cbf] uppercase tracking-wide">
                      {l}
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-[#0f1f35] border border-[rgba(99,160,220,0.15)] rounded-xl p-5">
                <div className="flex items-center gap-2 text-sm font-semibold mb-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shadow-[0_0_6px_#f08228]" />
                  Official Fare Schedule (LTFRB)
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[rgba(99,160,220,0.15)]">
                      {[
                        "Distance",
                        "Base Fare",
                        "Additional",
                        "Total Fare",
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
                    {[
                      ["Up to 4.0 km", "₱15.00", "—", "₱15.00"],
                      ["5 km", "₱15.00", "+₱2.00", "₱17.00"],
                      ["8 km", "₱15.00", "+₱8.00", "₱23.00"],
                      ["10 km", "₱15.00", "+₱12.00", "₱27.00"],
                      ["15 km", "₱15.00", "+₱22.00", "₱37.00"],
                      ["20 km", "₱15.00", "+₱32.00", "₱47.00"],
                    ].map(([dist, base, add, total]) => (
                      <tr
                        key={dist}
                        className="border-b border-[rgba(99,160,220,0.08)] hover:bg-blue-950/10 last:border-none"
                      >
                        <td className="py-3 px-3">{dist}</td>
                        <td className="py-3 px-3 text-green-400 font-bold">
                          {base}
                        </td>
                        <td className="py-3 px-3 text-[#6a9cbf]">{add}</td>
                        <td
                          className={`py-3 px-3 font-bold ${total === "₱15.00" ? "text-green-400" : "text-orange-400"}`}
                        >
                          {total}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-xs text-[#6a9cbf] mt-3">
                  * Formula: ₱15.00 base + (distance − 4) × ₱2.00 per km. Based
                  on official LTFRB guidelines.
                </p>
              </div>
            </div>
          )}

          {/* ── PROFILE ───────────────────────────────────────────────── */}
          {view === "profile" && (
            <div className="fade-up max-w-2xl">
              {profileMsg && (
                <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-sm font-semibold mb-4 bg-green-950/30 border border-green-700/30 text-green-400">
                  {profileMsg}
                </div>
              )}
              <form onSubmit={saveProfile}>
                <div className="flex items-center gap-5 p-5 bg-[#132540] border border-[rgba(99,160,220,0.15)] rounded-xl mb-4">
                  <div className="w-[72px] h-[72px] rounded-full bg-gradient-to-br from-orange-500 to-orange-900 border-2 border-orange-500/40 flex items-center justify-center text-white text-2xl font-black overflow-hidden flex-shrink-0">
                    {profilePic ? (
                      <img
                        src={profilePic}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      (profile.username?.[0] || "D").toUpperCase()
                    )}
                  </div>
                  <div>
                    <div className="font-semibold mb-0.5">
                      {profile.username}
                    </div>
                    <div className="text-xs text-[#6a9cbf] mb-2.5">
                      Partner Driver ·{" "}
                      {driverInfo.plate_number || "No plate set"}
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
                          const r = new FileReader();
                          r.onload = (ev) => setProfilePic(ev.target.result);
                          r.readAsDataURL(f);
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
                      ["Complete Name", "text", "username"],
                      ["Contact No.", "text", "contact_no"],
                    ].map(([label, type, field]) => (
                      <div key={field}>
                        <label className="block text-[11px] font-bold uppercase tracking-widest text-[#6a9cbf] mb-1.5">
                          {label}
                        </label>
                        <input
                          type={type}
                          value={profile[field] || ""}
                          onChange={(e) =>
                            setProfile((p) => ({
                              ...p,
                              [field]: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2.5 bg-[#132540] border border-[rgba(99,160,220,0.15)] rounded-lg text-sm text-[#cce0f5] outline-none focus:border-blue-500 transition-colors"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="mb-3">
                    <label className="block text-[11px] font-bold uppercase tracking-widest text-[#6a9cbf] mb-1.5">
                      Home Address
                    </label>
                    <input
                      type="text"
                      value={profile.address || ""}
                      onChange={(e) =>
                        setProfile((p) => ({ ...p, address: e.target.value }))
                      }
                      className="w-full px-3 py-2.5 bg-[#132540] border border-[rgba(99,160,220,0.15)] rounded-lg text-sm text-[#cce0f5] outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div className="text-[11px] font-bold uppercase tracking-widest text-[#6a9cbf] py-3 border-b border-[rgba(99,160,220,0.15)] mb-3">
                    Vehicle &amp; License
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {[
                      ["Branch / TODA / Party", "organization"],
                      ["Plate Number", "plate_number"],
                      ["Driver's License No.", "license_no"],
                      ["New Password", "new_password"],
                    ].map(([label, field]) => (
                      <div key={field}>
                        <label className="block text-[11px] font-bold uppercase tracking-widest text-[#6a9cbf] mb-1.5">
                          {label}{" "}
                          {field === "new_password" && (
                            <span className="font-normal">(blank = keep)</span>
                          )}
                        </label>
                        <input
                          type={field === "new_password" ? "password" : "text"}
                          value={profile[field] || ""}
                          onChange={(e) =>
                            setProfile((p) => ({
                              ...p,
                              [field]: e.target.value,
                            }))
                          }
                          placeholder={
                            field === "new_password" ? "••••••••" : ""
                          }
                          className="w-full px-3 py-2.5 bg-[#132540] border border-[rgba(99,160,220,0.15)] rounded-lg text-sm text-[#cce0f5] outline-none focus:border-blue-500 transition-colors"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2.5">
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:opacity-90 transition-opacity"
                    >
                      Save Changes
                    </button>
                    <a
                      href={`?page=profile`}
                      className="px-6 py-2.5 bg-[#132540] text-[#cce0f5] border border-[rgba(99,160,220,0.35)] rounded-lg text-sm font-bold hover:border-[rgba(99,160,220,0.6)] transition-colors"
                    >
                      Cancel
                    </a>
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>

      <Toast {...toast} />
    </div>
  );
}
