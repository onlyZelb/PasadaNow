import { useState, useEffect, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Circle, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

/* ── fix default leaflet icons ── */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const youIcon = L.divIcon({
  className: "",
  html: `<div style="width:16px;height:16px;background:#f08228;border-radius:50%;border:3px solid white;box-shadow:0 0 0 3px rgba(240,130,40,0.4),0 2px 8px rgba(0,0,0,.5);"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

function LocationMarker({ position, accuracy }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.setView(position, map.getZoom());
  }, [position]);
  if (!position) return null;
  return (
    <>
      <Marker position={position} icon={youIcon} />
      {accuracy && (
        <Circle
          center={position}
          radius={accuracy}
          pathOptions={{
            color: "#f08228",
            fillColor: "#f08228",
            fillOpacity: 0.08,
            weight: 1,
          }}
        />
      )}
    </>
  );
}

/* ─────────────────────────────────────────────
   MOCK API helpers  (replace with real calls)
───────────────────────────────────────────────*/
const API = {
  getProfile: async () => ({
    username: "Driver Name",
    plate_number: "ABC-123",
    license_no: "N04-12-345678",
    organization: "Center TODA",
    contact_no: "09171234567",
    address: "Baguio City",
    profile_pic: null,
    is_available: false,
  }),
  getStats: async () => ({
    all_time: { cnt: 0, total: 0 },
    today: { cnt: 0, total: 0 },
  }),
  getHistory: async () => [],
  toggleOnline: async (join) => {
    await new Promise((r) => setTimeout(r, 600));
    return { success: true, is_available: join ? 1 : 0 };
  },
  checkRequest: async () => null, // returns ride object or null
  updateStatus: async (status, tripId) => {
    await new Promise((r) => setTimeout(r, 400));
    return { success: true };
  },
  getNotifCount: async () => ({ count: 0 }),
  getNotifList: async () => ({ notifs: [] }),
  updateProfile: async (data) => ({ success: true, ...data }),
};

/* ── live clock ── */
function useClock() {
  const [clock, setClock] = useState("");
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
        ap = h >= 12 ? "PM" : "AM";
      h = h % 12 || 12;
      setClock(
        `${days[n.getDay()]}, ${months[n.getMonth()]} ${n.getDate()}, ${h}:${String(n.getMinutes()).padStart(2, "0")} ${ap}`,
      );
    };
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, []);
  return clock;
}

const BADGE = {
  completed: "bg-green-500/20 text-green-400",
  pending: "bg-orange-500/20 text-orange-400",
  accepted: "bg-blue-500/20 text-blue-400",
  ongoing: "bg-yellow-500/20 text-yellow-400",
  cancelled: "bg-red-500/20 text-red-400",
};
function Badge({ status }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${BADGE[status] || BADGE.cancelled}`}
    >
      ● {status?.charAt(0).toUpperCase() + status?.slice(1)}
    </span>
  );
}

function Toast({ msg, type, show }) {
  const colors = {
    green: "bg-green-500",
    red: "bg-red-500",
    blue: "bg-blue-500",
    orange: "bg-orange-500",
    purple: "bg-purple-500",
    yellow: "bg-yellow-400 !text-black",
  };
  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-full text-sm font-semibold text-white z-[9999] pointer-events-none transition-all duration-300 whitespace-nowrap ${colors[type] || colors.blue} ${show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
    >
      {msg}
    </div>
  );
}

function StatCard({ color, icon, value, label }) {
  const ICON_COLORS = {
    blue: "bg-blue-500/10 text-blue-400",
    green: "bg-green-500/10 text-green-400",
    orange: "bg-orange-500/10 text-orange-400",
    purple: "bg-purple-500/10 text-purple-400",
  };
  return (
    <div className="relative overflow-hidden bg-[#0f1f35] border border-[rgba(99,160,220,0.15)] rounded-xl p-5 hover:border-[rgba(99,160,220,0.35)] transition-colors">
      <div
        className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${ICON_COLORS[color]}`}
      >
        {icon}
      </div>
      <div className="text-2xl font-bold leading-none mb-1">{value}</div>
      <div className="text-[0.65rem] text-[#6a9cbf] uppercase tracking-wide font-medium">
        {label}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div>
      {label && (
        <label className="block text-[0.65rem] font-semibold uppercase tracking-widest text-[#6a9cbf] mb-1.5">
          {label}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 bg-[#132540] border border-[rgba(99,160,220,0.15)] rounded-lg text-[#cce0f5] text-sm outline-none focus:border-blue-400 transition-all placeholder-[#6a9cbf]"
      />
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════*/
export default function DriverDashboard() {
  const clock = useClock();
  const [page, setPage] = useState("dashboard");

  /* state */
  const [profile, setProfile] = useState({
    username: "Driver",
    plate_number: "",
    license_no: "",
    organization: "",
    contact_no: "",
    address: "",
    profile_pic: null,
    is_available: false,
  });
  const [stats, setStats] = useState({
    all_time: { cnt: 0, total: 0 },
    today: { cnt: 0, total: 0 },
  });
  const [history, setHistory] = useState([]);
  const [isOnline, setIsOnline] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  /* ride request */
  const [pendingRide, setPendingRide] = useState(null);
  const [rideTimer, setRideTimer] = useState(30);
  const timerRef = useRef(null);
  const pollRef = useRef(null);

  /* active trip */
  const [activeTrip, setActiveTrip] = useState(null); // null | { id, status, ... }
  const [tripDoneVisible, setTripDoneVisible] = useState(false);

  /* notifications */
  const [notifCount, setNotifCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifList, setNotifList] = useState([]);

  /* GPS */
  const [gpsPos, setGpsPos] = useState(null);
  const [gpsAcc, setGpsAcc] = useState(null);

  /* profile form */
  const [profileForm, setProfileForm] = useState({});
  const [profileMsg, setProfileMsg] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  /* history search */
  const [histSearch, setHistSearch] = useState("");

  /* toast */
  const [toast, setToast] = useState({ msg: "", type: "blue", show: false });
  const toastTimer = useRef(null);
  const showToast = useCallback((msg, type = "blue") => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, type, show: true });
    toastTimer.current = setTimeout(
      () => setToast((t) => ({ ...t, show: false })),
      3500,
    );
  }, []);

  /* ── init ── */
  useEffect(() => {
    API.getProfile().then((p) => {
      setProfile(p);
      setIsOnline(!!p.is_available);
      setProfileForm({
        username: p.username,
        contact_no: p.contact_no,
        address: p.address,
        plate_number: p.plate_number,
        license_no: p.license_no,
        organization: p.organization,
        new_password: "",
      });
    });
    API.getStats().then(setStats);
    API.getHistory().then(setHistory);

    if ("geolocation" in navigator) {
      const id = navigator.geolocation.watchPosition(
        ({ coords }) => {
          setGpsPos([coords.latitude, coords.longitude]);
          setGpsAcc(coords.accuracy);
        },
        () => setGpsPos([16.6159, 120.3209]),
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 },
      );
      return () => navigator.geolocation.clearWatch(id);
    } else {
      setGpsPos([16.6159, 120.3209]);
    }
  }, []);

  /* notif poll */
  useEffect(() => {
    const id = setInterval(async () => {
      const { count } = await API.getNotifCount();
      setNotifCount(count);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  /* ride request poll (when online, no active trip) */
  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (isOnline && !activeTrip) {
      pollRef.current = setInterval(async () => {
        if (pendingRide) return;
        const ride = await API.checkRequest();
        if (ride && ride.id) showRideCard(ride);
      }, 3000);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [isOnline, activeTrip, pendingRide]);

  /* toggle online */
  async function toggleQueue() {
    setIsToggling(true);
    const res = await API.toggleOnline(!isOnline);
    setIsToggling(false);
    if (res.success) {
      const online = res.is_available === 1;
      setIsOnline(online);
      showToast(
        online
          ? "✓ You are now Online — Accepting rides"
          : "You are now Offline",
        online ? "green" : "red",
      );
    }
  }

  /* ride card */
  function showRideCard(ride) {
    if (pendingRide && pendingRide.id === ride.id) return;
    setPendingRide(ride);
    setRideTimer(30);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setRideTimer((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          respondToRide("declined", ride);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    showToast("🔔 New ride request!", "orange");
  }

  function hideRideCard() {
    if (timerRef.current) clearInterval(timerRef.current);
    setPendingRide(null);
    setRideTimer(30);
  }

  async function respondToRide(action, rideOverride) {
    const ride = rideOverride || pendingRide;
    if (!ride) return;
    hideRideCard();
    const res = await API.updateStatus(action, ride.id);
    if (res.success && action === "accepted") {
      setIsOnline(false);
      setActiveTrip({ ...ride, status: "accepted" });
      showToast("✓ Ride accepted! Go pick up the commuter.", "green");
    } else if (action === "declined") {
      showToast("Ride declined.", "red");
    }
  }

  async function startTrip() {
    if (!activeTrip) return;
    if (!confirm("Start the trip now?")) return;
    const res = await API.updateStatus("ongoing", activeTrip.id);
    if (res.success) {
      setActiveTrip((t) => ({ ...t, status: "ongoing" }));
      showToast("🚗 Trip started! En route to destination.", "yellow");
    }
  }

  async function completeTrip() {
    if (!activeTrip) return;
    if (!confirm("Mark this trip as completed?")) return;
    const res = await API.updateStatus("completed", activeTrip.id);
    if (res.success) {
      setActiveTrip(null);
      setIsOnline(true);
      setTripDoneVisible(true);
      showToast("✓ Trip completed! Back online now.", "purple");
      setTimeout(() => setTripDoneVisible(false), 8000);
    }
  }

  async function saveProfile(e) {
    e.preventDefault();
    setIsSaving(true);
    const res = await API.updateProfile(profileForm);
    setIsSaving(false);
    if (res.success) {
      setProfile((p) => ({ ...p, ...profileForm }));
      setProfileMsg({ type: "success", text: "Profile updated successfully!" });
      showToast("✓ Profile saved!", "green");
      setTimeout(() => setProfileMsg(null), 4000);
    }
  }

  const filteredHistory = history.filter(
    (r) =>
      !histSearch ||
      JSON.stringify(r).toLowerCase().includes(histSearch.toLowerCase()),
  );

  /* ─── RENDER ─── */
  return (
    <div className="flex h-screen bg-[#0a1628] text-[#cce0f5] font-['Outfit',sans-serif] overflow-hidden">
      {/* ══ SIDEBAR ══ */}
      <aside className="w-[230px] bg-[#0f1f35] border-r border-[rgba(99,160,220,0.15)] flex flex-col flex-shrink-0">
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-[rgba(99,160,220,0.15)]">
          <div className="w-9 h-9 rounded-lg bg-orange-500/20 flex items-center justify-center text-sm font-black text-orange-400">
            P
          </div>
          <div className="text-xl font-black leading-none">
            <span className="text-blue-400">Pasada</span>
            <span className="text-orange-400">Now</span>
          </div>
        </div>

        <div className="px-5 pt-5 pb-1.5 text-[0.6rem] font-bold text-[#6a9cbf] uppercase tracking-widest">
          Driver
        </div>
        {[
          { id: "dashboard", label: "Dashboard", icon: "⊞" },
          { id: "earnings", label: "Earnings & History", icon: "₱" },
          { id: "fare_matrix", label: "Fare Matrix", icon: "📋" },
          { id: "profile", label: "My Profile", icon: "👤" },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setPage(item.id)}
            className={`flex items-center gap-2.5 mx-2.5 my-0.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-all text-left w-[calc(100%-20px)] ${page === item.id ? "bg-blue-500/10 text-blue-400 font-semibold border border-[rgba(99,160,220,0.35)]" : "text-[#6a9cbf] hover:bg-white/[0.04] hover:text-[#cce0f5]"}`}
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
            {page === item.id && (
              <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_6px_#3b8ee8]" />
            )}
          </button>
        ))}

        <div className="mt-auto p-4 border-t border-[rgba(99,160,220,0.15)]">
          <div className="flex items-center gap-2.5 p-2 rounded-lg bg-[#132540] mb-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-orange-800 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
              {profile.username?.substring(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[0.8rem] font-semibold truncate">
                {profile.username}
              </div>
              <div className="text-[0.65rem] text-[#6a9cbf]">
                {profile.plate_number || "Driver"}
              </div>
            </div>
          </div>
          {/* online indicator */}
          <div
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-full text-[0.68rem] font-semibold mb-2 transition-all ${isOnline ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-white/5 text-[#6a9cbf] border border-[rgba(99,160,220,0.15)]"}`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isOnline ? "bg-green-400 shadow-[0_0_6px_#22c55e] animate-pulse" : "bg-[#6a9cbf]"}`}
            />
            {isOnline ? "Online — Accepting Rides" : "Offline"}
          </div>
          <a
            href="/logout"
            className="flex items-center gap-2 text-red-400 text-[0.8rem] font-medium px-2 py-1.5 rounded-md hover:bg-red-500/10 transition-colors w-full"
          >
            <span>⬡</span> Sign Out
          </a>
        </div>
      </aside>

      {/* ══ MAIN ══ */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between gap-4 px-7 py-3.5 bg-[#0f1f35] border-b border-[rgba(99,160,220,0.15)] flex-shrink-0">
          <h2 className="text-lg font-bold whitespace-nowrap">
            {
              {
                dashboard: "PasadaNow Driver Portal",
                earnings: "Earnings & History",
                fare_matrix: "Fare Matrix",
                profile: "Profile Settings",
              }[page]
            }
          </h2>
          <div className="flex-1 max-w-xs flex items-center bg-[#132540] border border-[rgba(99,160,220,0.15)] rounded-lg px-3.5 py-1.5 gap-2 text-sm text-[#6a9cbf]">
            <span>🔍</span>
            <input
              className="bg-transparent outline-none text-[#cce0f5] placeholder-[#6a9cbf] w-full text-[0.8rem]"
              placeholder="Search trips, commuters..."
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[0.78rem] text-[#6a9cbf] whitespace-nowrap">
              {clock}
            </span>
            {/* notification bell */}
            <div className="relative">
              <button
                onClick={() => {
                  setNotifOpen((o) => !o);
                  if (!notifOpen)
                    API.getNotifList().then(({ notifs }) =>
                      setNotifList(notifs),
                    );
                }}
                className="w-8 h-8 bg-[#132540] border border-[rgba(99,160,220,0.15)] rounded-lg flex items-center justify-center text-[#6a9cbf] hover:border-[rgba(99,160,220,0.35)] transition-colors"
              >
                🔔
              </button>
              {notifCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[0.5rem] font-bold min-w-[14px] h-3.5 px-0.5 rounded-full flex items-center justify-center">
                  {notifCount}
                </span>
              )}
              {notifOpen && (
                <div className="absolute top-full right-0 mt-2 w-80 bg-[#0f1f35] border border-[rgba(99,160,220,0.35)] rounded-xl shadow-2xl z-50 animate-[fadeUp_0.18s_ease]">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(99,160,220,0.15)]">
                    <span className="text-sm font-bold">
                      Pending Ride Requests
                    </span>
                    <button
                      onClick={() => setNotifOpen(false)}
                      className="text-[0.68rem] text-blue-400"
                    >
                      Close
                    </button>
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {notifList.length === 0 ? (
                      <div className="text-center text-[#6a9cbf] text-sm py-7">
                        No pending requests
                      </div>
                    ) : (
                      notifList.map((n) => (
                        <div
                          key={n.id}
                          className="flex items-start gap-2.5 px-4 py-3 border-b border-[rgba(99,160,220,0.08)] hover:bg-blue-500/5 cursor-pointer"
                        >
                          <span className="w-2 h-2 mt-1 rounded-full bg-orange-500 flex-shrink-0 shadow-[0_0_6px_#f08228]" />
                          <div>
                            <div className="text-[0.78rem] font-semibold">
                              Ride from {n.commuter_name}
                            </div>
                            <div className="text-[0.68rem] text-[#6a9cbf] truncate">
                              {n.origin} → {n.destination}
                            </div>
                            <div className="text-[0.72rem] font-bold text-green-400">
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

        <div className="flex-1 overflow-y-auto p-6">
          {/* ════════ DASHBOARD ════════ */}
          {page === "dashboard" && (
            <div className="animate-[fadeUp_0.25s_ease]">
              <div className="grid grid-cols-4 gap-3.5 mb-5">
                <StatCard
                  color="green"
                  icon="₱"
                  value={`₱${parseFloat(stats.all_time.total).toFixed(2)}`}
                  label="Total Earned"
                />
                <StatCard
                  color="blue"
                  icon="🚗"
                  value={stats.all_time.cnt}
                  label="Total Trips"
                />
                <StatCard
                  color="orange"
                  icon="📊"
                  value={`₱${parseFloat(stats.today.total).toFixed(2)}`}
                  label="Today's Earnings"
                />
                <StatCard
                  color="purple"
                  icon="⏱"
                  value={
                    <span
                      className={isOnline ? "text-green-400" : "text-[#6a9cbf]"}
                    >
                      {isOnline ? "ONLINE" : "OFFLINE"}
                    </span>
                  }
                  label="Current Status"
                />
              </div>

              {/* status bar */}
              <div
                className={`flex items-center justify-between px-5 py-3.5 rounded-xl border mb-4 transition-all ${isOnline ? "bg-green-500/[0.04] border-green-500/30" : "bg-[#0f1f35] border-[rgba(99,160,220,0.15)]"}`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${isOnline ? "bg-green-400 shadow-[0_0_10px_#22c55e] animate-pulse" : "bg-[#6a9cbf]"}`}
                  />
                  <div>
                    <div className="text-[0.9rem] font-semibold">
                      {isOnline
                        ? "System Online — Accepting Requests"
                        : "System Offline"}
                    </div>
                    <div className="text-[0.72rem] text-[#6a9cbf]">
                      {isOnline
                        ? "Waiting for passenger booking requests..."
                        : "Toggle online to start receiving rides."}
                    </div>
                  </div>
                </div>
                <button
                  onClick={toggleQueue}
                  disabled={isToggling || !!activeTrip}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all disabled:opacity-50 ${isOnline ? "bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20" : "bg-green-500 text-white shadow-[0_4px_16px_rgba(34,197,94,0.35)] hover:opacity-90"}`}
                >
                  {isToggling && (
                    <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  )}
                  {isOnline ? "Go Offline" : "Go Online"}
                </button>
              </div>

              {/* active trip banner */}
              {activeTrip && (
                <div
                  className={`flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl border mb-4 animate-[fadeUp_0.3s_ease] ${activeTrip.status === "ongoing" ? "bg-yellow-500/10 border-yellow-500/30" : "bg-green-500/10 border-green-500/30"}`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-2.5 h-2.5 rounded-full flex-shrink-0 animate-pulse ${activeTrip.status === "ongoing" ? "bg-yellow-400 shadow-[0_0_8px_#eab308]" : "bg-green-400 shadow-[0_0_8px_#22c55e]"}`}
                    />
                    <div>
                      <div
                        className={`text-[0.85rem] font-bold ${activeTrip.status === "ongoing" ? "text-yellow-400" : "text-green-400"}`}
                      >
                        {activeTrip.status === "ongoing"
                          ? "Trip Ongoing — En Route"
                          : "Active Trip — Picking Up Commuter"}
                      </div>
                      <div className="text-[0.72rem] text-[#6a9cbf] mt-0.5">
                        <b>{activeTrip.commuter_name}</b> · {activeTrip.origin}{" "}
                        → {activeTrip.destination} ·{" "}
                        <b className="text-green-400">
                          ₱{parseFloat(activeTrip.fare).toFixed(2)}
                        </b>
                      </div>
                      {activeTrip.status === "ongoing" && (
                        <div
                          className="mt-1.5 h-1 w-40 rounded overflow-hidden"
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
                        className="px-4 py-2 bg-yellow-400 text-black text-sm font-bold rounded-lg hover:opacity-90 transition-opacity"
                      >
                        🚗 Start Trip
                      </button>
                    )}
                    {activeTrip.status === "ongoing" && (
                      <button
                        onClick={completeTrip}
                        className="px-4 py-2 bg-green-500 text-white text-sm font-bold rounded-lg hover:opacity-90 transition-opacity"
                      >
                        Mark as Completed ✓
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* trip done banner */}
              {tripDoneVisible && (
                <div className="flex items-center gap-3 px-4 py-3.5 bg-purple-500/10 border border-purple-500/30 rounded-xl mb-4 animate-[fadeUp_0.3s_ease]">
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 border-2 border-purple-400/40 flex items-center justify-center text-purple-400 text-lg animate-[bounceIn_0.5s_ease]">
                    ✓
                  </div>
                  <div>
                    <div className="text-[0.85rem] font-bold text-purple-400">
                      Trip Completed Successfully!
                    </div>
                    <div className="text-[0.72rem] text-[#6a9cbf]">
                      You are back online and ready for new rides.
                    </div>
                  </div>
                </div>
              )}

              {/* map */}
              <div
                className="rounded-xl overflow-hidden border border-[rgba(99,160,220,0.15)] mb-4 relative"
                style={{ height: 360 }}
              >
                <MapContainer
                  center={gpsPos || [16.6159, 120.3209]}
                  zoom={15}
                  style={{ height: "100%", width: "100%" }}
                  zoomControl
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution="© OpenStreetMap contributors"
                  />
                  <LocationMarker position={gpsPos} accuracy={gpsAcc} />
                </MapContainer>

                {/* ride request overlay */}
                {pendingRide && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[92%] max-w-md bg-[#132540] border-2 border-orange-500 rounded-xl p-5 z-[1000] shadow-2xl animate-[slideUp_0.35s_ease]">
                    <div className="flex items-center gap-2.5 mb-3.5">
                      <div className="w-8 h-8 bg-orange-500/20 rounded-full flex items-center justify-center text-orange-400 flex-shrink-0">
                        🔔
                      </div>
                      <div>
                        <div className="text-[0.95rem] font-bold text-orange-400">
                          New Ride Request!
                        </div>
                        <div className="text-[0.68rem] text-[#6a9cbf]">
                          From: {pendingRide.commuter_name}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {[
                        ["From", pendingRide.origin],
                        ["To", pendingRide.destination],
                      ].map(([l, v]) => (
                        <div key={l} className="bg-[#0f1f35] rounded-lg p-2.5">
                          <div className="text-[0.58rem] text-[#6a9cbf] uppercase tracking-widest font-bold mb-1">
                            {l}
                          </div>
                          <div className="text-[0.82rem] font-semibold truncate">
                            {v}
                          </div>
                        </div>
                      ))}
                      <div className="bg-[#0f1f35] rounded-lg p-2.5 text-center">
                        <div className="text-[0.58rem] text-[#6a9cbf] uppercase tracking-widest font-bold mb-1">
                          Fare
                        </div>
                        <div className="text-xl font-extrabold text-green-400">
                          ₱{parseFloat(pendingRide.fare).toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <div className="text-[0.72rem] text-[#6a9cbf] mb-3 flex items-center gap-1">
                      Auto-decline in{" "}
                      <span className="text-[1rem] font-bold text-orange-400 mx-1 min-w-[20px]">
                        {rideTimer}
                      </span>
                      s
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => respondToRide("accepted")}
                        className="flex-1 py-2.5 bg-green-500 text-white font-bold rounded-lg text-sm hover:opacity-90 transition-opacity"
                      >
                        ✓ Accept Ride
                      </button>
                      <button
                        onClick={() => respondToRide("declined")}
                        className="px-4 py-2.5 bg-red-500/10 text-red-400 border border-red-500/25 font-bold rounded-lg text-sm"
                      >
                        ✕ Decline
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* vehicle + today summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#0f1f35] border border-[rgba(99,160,220,0.15)] rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shadow-[0_0_6px_#f08228]" />
                    <span className="text-sm font-semibold">Vehicle Info</span>
                  </div>
                  <table className="w-full text-sm">
                    {[
                      ["Plate Number", profile.plate_number || "—"],
                      ["License No.", profile.license_no || "—"],
                      ["Organization", profile.organization || "—"],
                      ["Contact", profile.contact_no || "—"],
                    ].map(([l, v]) => (
                      <tr key={l}>
                        <td className="py-2 text-[#6a9cbf] w-32">{l}</td>
                        <td className="py-2 font-semibold">{v}</td>
                      </tr>
                    ))}
                  </table>
                </div>
                <div className="bg-[#0f1f35] border border-[rgba(99,160,220,0.15)] rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_6px_#22c55e]" />
                    <span className="text-sm font-semibold">
                      Today's Summary
                    </span>
                  </div>
                  <table className="w-full text-sm">
                    {[
                      ["Trips Today", stats.today.cnt],
                      [
                        "Earned Today",
                        `₱${parseFloat(stats.today.total).toFixed(2)}`,
                      ],
                      [
                        "Avg. Fare",
                        stats.all_time.cnt > 0
                          ? `₱${(stats.all_time.total / stats.all_time.cnt).toFixed(2)}`
                          : "₱0.00",
                      ],
                      [
                        "All-time",
                        `₱${parseFloat(stats.all_time.total).toFixed(2)}`,
                      ],
                    ].map(([l, v]) => (
                      <tr key={l}>
                        <td className="py-2 text-[#6a9cbf] w-32">{l}</td>
                        <td
                          className={`py-2 font-bold ${l.includes("Earned") || l.includes("time") ? "text-green-400" : ""}`}
                        >
                          {v}
                        </td>
                      </tr>
                    ))}
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ════════ EARNINGS ════════ */}
          {page === "earnings" && (
            <div className="animate-[fadeUp_0.25s_ease]">
              <div className="grid grid-cols-4 gap-3.5 mb-5">
                <StatCard
                  color="green"
                  icon="₱"
                  value={`₱${parseFloat(stats.all_time.total).toFixed(2)}`}
                  label="Total Earned"
                />
                <StatCard
                  color="blue"
                  icon="🚗"
                  value={stats.all_time.cnt}
                  label="Completed Trips"
                />
                <StatCard
                  color="orange"
                  icon="📊"
                  value={`₱${parseFloat(stats.today.total).toFixed(2)}`}
                  label="Today's Earnings"
                />
                <StatCard
                  color="purple"
                  icon="📈"
                  value={
                    stats.all_time.cnt > 0
                      ? `₱${(stats.all_time.total / stats.all_time.cnt).toFixed(2)}`
                      : "₱0.00"
                  }
                  label="Avg. Fare / Trip"
                />
              </div>
              <div className="bg-[#0f1f35] border border-[rgba(99,160,220,0.15)] rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center bg-[#132540] border border-[rgba(99,160,220,0.15)] rounded-lg px-3 py-1.5 gap-2 flex-1 max-w-xs">
                    <span className="text-[#6a9cbf] text-sm">🔍</span>
                    <input
                      value={histSearch}
                      onChange={(e) => setHistSearch(e.target.value)}
                      className="bg-transparent outline-none text-[#cce0f5] placeholder-[#6a9cbf] text-[0.8rem] w-full"
                      placeholder="Filter trips..."
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_6px_#3b8ee8]" />
                    <span className="text-sm font-semibold">Trip History</span>
                  </div>
                </div>
                <table className="w-full text-sm border-collapse">
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
                          className="px-3 py-2.5 text-left text-[0.65rem] font-bold uppercase tracking-widest text-[#6a9cbf]"
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
                          className="text-center text-[#6a9cbf] py-9 text-sm"
                        >
                          No trip records yet.
                        </td>
                      </tr>
                    ) : (
                      filteredHistory.map((r) => (
                        <tr
                          key={r.id}
                          className="border-b border-[rgba(99,160,220,0.08)] hover:bg-blue-500/[0.03]"
                        >
                          <td className="px-3 py-2.5 text-[#6a9cbf]">
                            {new Date(r.created_at).toLocaleString("en-PH", {
                              month: "short",
                              day: "2-digit",
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </td>
                          <td className="px-3 py-2.5">{r.commuter}</td>
                          <td className="px-3 py-2.5">{r.origin}</td>
                          <td className="px-3 py-2.5">{r.destination}</td>
                          <td className="px-3 py-2.5 font-bold">
                            ₱{parseFloat(r.fare).toFixed(2)}
                          </td>
                          <td className="px-3 py-2.5">
                            <Badge status={r.status} />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ════════ FARE MATRIX ════════ */}
          {page === "fare_matrix" && (
            <div className="animate-[fadeUp_0.25s_ease]">
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  ["₱15.00", "Base Fare (First 4 km)"],
                  ["+₱2.00", "Per Succeeding km"],
                  ["4.0 km", "Minimum Distance"],
                ].map(([v, l]) => (
                  <div
                    key={l}
                    className="bg-[#132540] border border-[rgba(99,160,220,0.15)] rounded-xl p-4 text-center"
                  >
                    <div className="text-2xl font-bold text-orange-400 mb-1">
                      {v}
                    </div>
                    <div className="text-[0.68rem] text-[#6a9cbf] uppercase tracking-wide">
                      {l}
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-[#0f1f35] border border-[rgba(99,160,220,0.15)] rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shadow-[0_0_6px_#f08228]" />
                  <span className="text-sm font-semibold">
                    Official Fare Schedule (LTFRB)
                  </span>
                </div>
                <table className="w-full text-sm border-collapse">
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
                          className="px-3 py-2.5 text-left text-[0.65rem] font-bold uppercase tracking-widest text-[#6a9cbf]"
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
                    ].map(([d, b, a, t]) => (
                      <tr
                        key={d}
                        className="border-b border-[rgba(99,160,220,0.08)] hover:bg-blue-500/[0.03]"
                      >
                        <td className="px-3 py-2.5">{d}</td>
                        <td className="px-3 py-2.5 text-green-400 font-bold">
                          {b}
                        </td>
                        <td className="px-3 py-2.5">{a}</td>
                        <td
                          className={`px-3 py-2.5 font-bold ${parseFloat(t.replace("₱", "")) >= 37 ? "text-orange-400" : ""}`}
                        >
                          {t}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-[0.72rem] text-[#6a9cbf] mt-3.5">
                  * Formula: ₱15.00 base + (distance − 4) × ₱2.00/km. Based on
                  official LTFRB guidelines.
                </p>
              </div>
            </div>
          )}

          {/* ════════ PROFILE ════════ */}
          {page === "profile" && (
            <div className="max-w-2xl animate-[fadeUp_0.25s_ease]">
              {profileMsg && (
                <div
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-sm font-semibold mb-4 ${profileMsg.type === "success" ? "bg-green-500/10 border border-green-500/20 text-green-400" : "bg-red-500/10 border border-red-500/20 text-red-400"}`}
                >
                  {profileMsg.text}
                </div>
              )}
              <div className="flex items-center gap-5 p-5 bg-[#132540] border border-[rgba(99,160,220,0.15)] rounded-xl mb-5">
                <div className="w-[72px] h-[72px] rounded-full bg-gradient-to-br from-orange-500 to-orange-800 flex items-center justify-center text-[1.4rem] font-extrabold text-white border-2 border-orange-400/40 flex-shrink-0">
                  {profile.username?.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-1">
                    {profile.username}
                  </h4>
                  <p className="text-[0.72rem] text-[#6a9cbf] mb-2.5">
                    Partner Driver · {profile.plate_number || "No plate set"}
                  </p>
                  <button className="px-3.5 py-1.5 bg-[#0f1f35] border border-[rgba(99,160,220,0.15)] rounded-lg text-[0.8rem] text-[#cce0f5] hover:border-[rgba(99,160,220,0.35)] transition-colors">
                    Change Photo
                  </button>
                </div>
              </div>

              <form
                onSubmit={saveProfile}
                className="bg-[#0f1f35] border border-[rgba(99,160,220,0.15)] rounded-xl p-5 space-y-3"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_6px_#3b8ee8]" />
                  <span className="text-sm font-semibold">
                    Personal Information
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field
                    label="Complete Name"
                    value={profileForm.username || ""}
                    onChange={(v) =>
                      setProfileForm((f) => ({ ...f, username: v }))
                    }
                  />
                  <Field
                    label="Contact No."
                    value={profileForm.contact_no || ""}
                    onChange={(v) =>
                      setProfileForm((f) => ({ ...f, contact_no: v }))
                    }
                  />
                </div>
                <Field
                  label="Home Address"
                  value={profileForm.address || ""}
                  onChange={(v) =>
                    setProfileForm((f) => ({ ...f, address: v }))
                  }
                />

                <div className="text-[0.68rem] font-bold uppercase tracking-widest text-[#6a9cbf] pt-2 pb-1 border-b border-[rgba(99,160,220,0.15)]">
                  Vehicle &amp; License
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field
                    label="Branch / TODA"
                    value={profileForm.organization || ""}
                    onChange={(v) =>
                      setProfileForm((f) => ({ ...f, organization: v }))
                    }
                    placeholder="e.g. Center TODA"
                  />
                  <Field
                    label="Plate Number"
                    value={profileForm.plate_number || ""}
                    onChange={(v) =>
                      setProfileForm((f) => ({ ...f, plate_number: v }))
                    }
                  />
                  <Field
                    label="License No."
                    value={profileForm.license_no || ""}
                    onChange={(v) =>
                      setProfileForm((f) => ({ ...f, license_no: v }))
                    }
                  />
                  <Field
                    label="New Password (blank to keep)"
                    value={profileForm.new_password || ""}
                    onChange={(v) =>
                      setProfileForm((f) => ({ ...f, new_password: v }))
                    }
                    type="password"
                    placeholder="••••••••"
                  />
                </div>
                <div className="flex gap-2.5 pt-2">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-semibold rounded-lg text-sm transition-colors"
                  >
                    {isSaving ? "Saving..." : "Save Changes"}
                  </button>
                  <a
                    href="?page=profile"
                    className="px-6 py-2.5 bg-[#132540] border border-[rgba(99,160,220,0.15)] hover:border-[rgba(99,160,220,0.35)] text-[#cce0f5] font-semibold rounded-lg text-sm transition-colors"
                  >
                    Cancel
                  </a>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>

      <Toast {...toast} />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
        @keyframes fadeUp    { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideUp   { from{transform:translateX(-50%) translateY(24px);opacity:0} to{transform:translateX(-50%) translateY(0);opacity:1} }
        @keyframes bounceIn  { 0%{transform:scale(.7);opacity:0} 60%{transform:scale(1.08)} 100%{transform:scale(1);opacity:1} }
        @keyframes roadAnim  { 0%{background-position:0 0} 100%{background-position:60px 0} }
        .leaflet-container { background: #0a1628; }
      `}</style>
    </div>
  );
}
