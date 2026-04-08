import { useState, useEffect, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Circle, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import api from "../config/axios";
import useWebSocket from "../hooks/useWebSocket";

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

export default function DriverDashboard() {
  const clock = useClock();
  const [page, setPage] = useState("dashboard");

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const driverId = user.id;

  const [isOnline, setIsOnline] = useState(false);
  const [pendingRide, setPendingRide] = useState(null);
  const [rideTimer, setRideTimer] = useState(30);
  const [activeTrip, setActiveTrip] = useState(null);
  const [history, setHistory] = useState([]);
  const [gpsPos, setGpsPos] = useState(null);
  const [gpsAcc, setGpsAcc] = useState(null);
  const [histSearch, setHistSearch] = useState("");
  const [tripDoneVisible, setTripDoneVisible] = useState(false);

  const timerRef = useRef(null);
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

  // WebSocket — listen for new ride requests
  useWebSocket({
    driverId,
    onRideRequest: (ride) => {
      if (!isOnline || activeTrip) return;
      if (ride.status === "PENDING") {
        showRideCard(ride);
      }
    },
  });

  // GPS
  useEffect(() => {
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

  // Load history
  useEffect(() => {
    api
      .get(`/api/rides/driver/${driverId}`)
      .then((res) => setHistory(res.data))
      .catch(() => {});
  }, [activeTrip]);

  function showRideCard(ride) {
    if (pendingRide?.id === ride.id) return;
    setPendingRide(ride);
    setRideTimer(30);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setRideTimer((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          declineRide(ride);
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

  async function acceptRide() {
    if (!pendingRide) return;
    const ride = pendingRide;
    hideRideCard();
    try {
      const res = await api.patch(
        `/api/rides/${ride.id}/accept?driverId=${driverId}`,
      );
      setActiveTrip(res.data);
      setIsOnline(false);
      showToast("✓ Ride accepted! Go pick up the commuter.", "green");
    } catch {
      showToast("Failed to accept ride.", "red");
    }
  }

  function declineRide(rideOverride) {
    hideRideCard();
    showToast("Ride declined.", "red");
  }

  async function completeRide() {
    if (!activeTrip) return;
    if (!confirm("Mark this trip as completed?")) return;
    try {
      await api.patch(`/api/rides/${activeTrip.id}/complete`);
      setActiveTrip(null);
      setIsOnline(true);
      setTripDoneVisible(true);
      showToast("✓ Trip completed! Back online.", "purple");
      setTimeout(() => setTripDoneVisible(false), 6000);
    } catch {
      showToast("Failed to complete ride.", "red");
    }
  }

  const completedRides = history.filter((r) => r.status === "COMPLETED");
  const totalEarned = completedRides.reduce((s, r) => s + (r.fare || 0), 0);
  const todayRides = completedRides.filter(
    (r) => new Date(r.createdAt).toDateString() === new Date().toDateString(),
  );
  const todayEarned = todayRides.reduce((s, r) => s + (r.fare || 0), 0);

  const filteredHistory = history.filter(
    (r) =>
      !histSearch ||
      JSON.stringify(r).toLowerCase().includes(histSearch.toLowerCase()),
  );

  return (
    <div className="flex h-screen bg-[#0a1628] text-[#cce0f5] font-['Outfit',sans-serif] overflow-hidden">
      {/* SIDEBAR */}
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
              {user.username?.substring(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[0.8rem] font-semibold truncate">
                {user.username}
              </div>
              <div className="text-[0.65rem] text-[#6a9cbf]">Driver</div>
            </div>
          </div>
          <div
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-full text-[0.68rem] font-semibold mb-2 transition-all ${isOnline ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-white/5 text-[#6a9cbf] border border-[rgba(99,160,220,0.15)]"}`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isOnline ? "bg-green-400 shadow-[0_0_6px_#22c55e] animate-pulse" : "bg-[#6a9cbf]"}`}
            />
            {isOnline ? "Online" : "Offline"}
          </div>
          <button
            onClick={() => {
              localStorage.clear();
              window.location.href = "/login";
            }}
            className="flex items-center gap-2 text-red-400 text-[0.8rem] font-medium px-2 py-1.5 rounded-md hover:bg-red-500/10 transition-colors w-full"
          >
            <span>⬡</span> Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between gap-4 px-7 py-3.5 bg-[#0f1f35] border-b border-[rgba(99,160,220,0.15)] flex-shrink-0">
          <h2 className="text-lg font-bold">
            {
              {
                dashboard: "PasadaNow Driver Portal",
                earnings: "Earnings & History",
                profile: "Profile Settings",
              }[page]
            }
          </h2>
          <span className="text-[0.78rem] text-[#6a9cbf]">{clock}</span>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          {/* DASHBOARD */}
          {page === "dashboard" && (
            <div className="animate-[fadeUp_0.25s_ease]">
              <div className="grid grid-cols-4 gap-3.5 mb-5">
                <StatCard
                  color="green"
                  icon="₱"
                  value={`₱${totalEarned.toFixed(2)}`}
                  label="Total Earned"
                />
                <StatCard
                  color="blue"
                  icon="🚗"
                  value={completedRides.length}
                  label="Total Trips"
                />
                <StatCard
                  color="orange"
                  icon="📊"
                  value={`₱${todayEarned.toFixed(2)}`}
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

              {/* Online toggle */}
              <div
                className={`flex items-center justify-between px-5 py-3.5 rounded-xl border mb-4 transition-all ${isOnline ? "bg-green-500/[0.04] border-green-500/30" : "bg-[#0f1f35] border-[rgba(99,160,220,0.15)]"}`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${isOnline ? "bg-green-400 shadow-[0_0_10px_#22c55e] animate-pulse" : "bg-[#6a9cbf]"}`}
                  />
                  <div>
                    <div className="text-[0.9rem] font-semibold">
                      {isOnline
                        ? "Online — Accepting Requests"
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
                  onClick={() => {
                    setIsOnline((o) => !o);
                    showToast(
                      !isOnline
                        ? "✓ You are now Online"
                        : "You are now Offline",
                      !isOnline ? "green" : "red",
                    );
                  }}
                  disabled={!!activeTrip}
                  className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all disabled:opacity-50 ${isOnline ? "bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20" : "bg-green-500 text-white shadow-[0_4px_16px_rgba(34,197,94,0.35)] hover:opacity-90"}`}
                >
                  {isOnline ? "Go Offline" : "Go Online"}
                </button>
              </div>

              {/* Active trip */}
              {activeTrip && (
                <div className="flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl border mb-4 bg-green-500/10 border-green-500/30">
                  <div>
                    <div className="text-[0.85rem] font-bold text-green-400">
                      Active Trip — Picking Up Commuter
                    </div>
                    <div className="text-[0.72rem] text-[#6a9cbf] mt-0.5">
                      {activeTrip.pickup} → {activeTrip.dropoff} ·{" "}
                      <b className="text-green-400">₱{activeTrip.fare}</b>
                    </div>
                  </div>
                  <button
                    onClick={completeRide}
                    className="px-4 py-2 bg-green-500 text-white text-sm font-bold rounded-lg hover:opacity-90"
                  >
                    Mark as Completed ✓
                  </button>
                </div>
              )}

              {tripDoneVisible && (
                <div className="flex items-center gap-3 px-4 py-3.5 bg-purple-500/10 border border-purple-500/30 rounded-xl mb-4">
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 border-2 border-purple-400/40 flex items-center justify-center text-purple-400 text-lg">
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

              {/* Map */}
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

                {/* Ride request overlay */}
                {pendingRide && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[92%] max-w-md bg-[#132540] border-2 border-orange-500 rounded-xl p-5 z-[1000] shadow-2xl animate-[slideUp_0.35s_ease]">
                    <div className="flex items-center gap-2.5 mb-3.5">
                      <div className="w-8 h-8 bg-orange-500/20 rounded-full flex items-center justify-center text-orange-400">
                        🔔
                      </div>
                      <div>
                        <div className="text-[0.95rem] font-bold text-orange-400">
                          New Ride Request!
                        </div>
                        <div className="text-[0.68rem] text-[#6a9cbf]">
                          Rider #{pendingRide.riderId}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {[
                        ["From", pendingRide.pickup],
                        ["To", pendingRide.dropoff],
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
                          ₱{pendingRide.fare}
                        </div>
                      </div>
                    </div>
                    <div className="text-[0.72rem] text-[#6a9cbf] mb-3">
                      Auto-decline in{" "}
                      <span className="text-[1rem] font-bold text-orange-400 mx-1">
                        {rideTimer}
                      </span>
                      s
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={acceptRide}
                        className="flex-1 py-2.5 bg-green-500 text-white font-bold rounded-lg text-sm hover:opacity-90"
                      >
                        ✓ Accept Ride
                      </button>
                      <button
                        onClick={() => declineRide()}
                        className="px-4 py-2.5 bg-red-500/10 text-red-400 border border-red-500/25 font-bold rounded-lg text-sm"
                      >
                        ✕ Decline
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* EARNINGS */}
          {page === "earnings" && (
            <div className="animate-[fadeUp_0.25s_ease]">
              <div className="grid grid-cols-3 gap-3.5 mb-5">
                <StatCard
                  color="green"
                  icon="₱"
                  value={`₱${totalEarned.toFixed(2)}`}
                  label="Total Earned"
                />
                <StatCard
                  color="blue"
                  icon="🚗"
                  value={completedRides.length}
                  label="Completed Trips"
                />
                <StatCard
                  color="orange"
                  icon="📊"
                  value={`₱${todayEarned.toFixed(2)}`}
                  label="Today's Earnings"
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
                  <span className="text-sm font-semibold">Trip History</span>
                </div>
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-[rgba(99,160,220,0.15)]">
                      {["#", "Pickup", "Dropoff", "Fare", "Status", "Date"].map(
                        (h) => (
                          <th
                            key={h}
                            className="px-3 py-2.5 text-left text-[0.65rem] font-bold uppercase tracking-widest text-[#6a9cbf]"
                          >
                            {h}
                          </th>
                        ),
                      )}
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
                            #{r.id}
                          </td>
                          <td className="px-3 py-2.5">{r.pickup}</td>
                          <td className="px-3 py-2.5">{r.dropoff}</td>
                          <td className="px-3 py-2.5 font-bold">₱{r.fare}</td>
                          <td className="px-3 py-2.5">
                            <Badge status={r.status?.toLowerCase()} />
                          </td>
                          <td className="px-3 py-2.5 text-[#6a9cbf]">
                            {new Date(r.createdAt).toLocaleDateString("en-PH", {
                              month: "short",
                              day: "2-digit",
                              year: "numeric",
                            })}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PROFILE */}
          {page === "profile" && (
            <div className="max-w-2xl animate-[fadeUp_0.25s_ease]">
              <div className="flex items-center gap-5 p-5 bg-[#132540] border border-[rgba(99,160,220,0.15)] rounded-xl mb-5">
                <div className="w-[72px] h-[72px] rounded-full bg-gradient-to-br from-orange-500 to-orange-800 flex items-center justify-center text-[1.4rem] font-extrabold text-white border-2 border-orange-400/40 flex-shrink-0">
                  {user.username?.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-1">
                    {user.username}
                  </h4>
                  <p className="text-[0.72rem] text-[#6a9cbf]">
                    Partner Driver
                  </p>
                </div>
              </div>
              <div className="bg-[#0f1f35] border border-[rgba(99,160,220,0.15)] rounded-xl p-5 text-[#6a9cbf] text-sm">
                Profile editing coming soon.
              </div>
            </div>
          )}
        </div>
      </main>

      <Toast {...toast} />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
        @keyframes fadeUp  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideUp { from{transform:translateX(-50%) translateY(24px);opacity:0} to{transform:translateX(-50%) translateY(0);opacity:1} }
        .leaflet-container { background: #0a1628; }
      `}</style>
    </div>
  );
}
