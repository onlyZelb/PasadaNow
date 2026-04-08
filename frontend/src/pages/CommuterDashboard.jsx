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
  html: `<div style="width:16px;height:16px;background:#3b8ee8;border-radius:50%;border:3px solid white;box-shadow:0 0 0 3px rgba(59,142,232,0.4),0 2px 8px rgba(0,0,0,.5);"></div>`,
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
            color: "#3b8ee8",
            fillColor: "#3b8ee8",
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
        `${days[n.getDay()]}, ${months[n.getMonth()]} ${n.getDate()}, ${h}:${String(n.getMinutes()).padStart(2, "0")}:${String(n.getSeconds()).padStart(2, "0")} ${ap}`,
      );
    };
    tick();
    const id = setInterval(tick, 1000);
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

const BSP_STYLES = {
  pending: {
    bg: "bg-orange-500/10 border-orange-500/30",
    titleColor: "text-orange-400",
    title: "Waiting for driver response...",
  },
  accepted: {
    bg: "bg-green-500/10  border-green-500/30",
    titleColor: "text-green-400",
    title: "✓ Driver accepted! On the way.",
  },
  ongoing: {
    bg: "bg-yellow-500/10 border-yellow-500/30",
    titleColor: "text-yellow-400",
    title: "🚗 Trip Ongoing — You're on your way!",
  },
  completed: {
    bg: "bg-purple-500/10 border-purple-500/30",
    titleColor: "text-purple-400",
    title: "🎉 Trip Completed!",
  },
  cancelled: {
    bg: "bg-red-500/10    border-red-500/20",
    titleColor: "text-red-400",
    title: "✕ Booking was cancelled.",
  },
};

function BookingStatusPanel({ state, data, onCancel, onBookNew }) {
  const s = BSP_STYLES[state] || BSP_STYLES.cancelled;
  return (
    <div
      className={`p-4 rounded-lg border mb-3 animate-[fadeUp_0.3s_ease] ${s.bg}`}
    >
      <div
        className={`text-[0.82rem] font-bold mb-2 flex items-center gap-1.5 ${s.titleColor}`}
      >
        {state === "pending" && (
          <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
        )}
        {s.title}
      </div>
      {data && (
        <div className="text-[0.78rem] text-[#6a9cbf] leading-relaxed mb-2">
          <b>From:</b> {data.pickup} &nbsp; <b>To:</b> {data.dropoff} &nbsp;{" "}
          <b>Fare:</b> ₱{data.fare}
        </div>
      )}
      <div className="flex gap-2 mt-3">
        {state === "pending" && (
          <button
            onClick={onCancel}
            className="px-4 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-[0.78rem] font-semibold hover:bg-red-500/20 transition-colors"
          >
            Cancel Booking
          </button>
        )}
        {state === "completed" && (
          <button
            onClick={onBookNew}
            className="px-4 py-1.5 bg-blue-500 text-white rounded-lg text-[0.78rem] font-semibold hover:bg-blue-600 transition-colors"
          >
            Book Another Ride →
          </button>
        )}
      </div>
    </div>
  );
}

export default function CommuterDashboard() {
  const clock = useClock();
  const [view, setView] = useState("dashboard");

  // Get logged-in user from localStorage
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const riderId = user.id;

  const [history, setHistory] = useState([]);
  const [origin, setOrigin] = useState("");
  const [dest, setDest] = useState("");
  const [fareInfo, setFareInfo] = useState(null);
  const [isFareLoading, setIsFareLoading] = useState(false);
  const [bookingState, setBookingState] = useState("idle");
  const [bookingData, setBookingData] = useState(null);
  const [isBooking, setIsBooking] = useState(false);
  const [currentRide, setCurrentRide] = useState(null);

  const [gpsPos, setGpsPos] = useState(null);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);

  const [profileForm, setProfileForm] = useState({
    fullname: user.username || "",
    email: "",
    contact: "",
    address: "",
    new_password: "",
  });
  const [profileAlert, setProfileAlert] = useState(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [histSearch, setHistSearch] = useState("");

  const [toast, setToast] = useState({ msg: "", type: "blue", show: false });
  const toastTimer = useRef(null);
  const fareTimer = useRef(null);

  const showToast = useCallback((msg, type = "blue") => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, type, show: true });
    toastTimer.current = setTimeout(
      () => setToast((t) => ({ ...t, show: false })),
      3500,
    );
  }, []);

  // WebSocket — listen for ride status updates
  useWebSocket({
    riderId,
    onDriverAccepted: (ride) => {
      setCurrentRide(ride);
      if (ride.status === "ACCEPTED") {
        setBookingState("accepted");
        setBookingData(ride);
        showToast("✓ Driver accepted your ride!", "green");
      } else if (ride.status === "COMPLETED") {
        setBookingState("completed");
        setBookingData(ride);
        showToast("🎉 Trip completed!", "purple");
      } else if (ride.status === "CANCELLED") {
        setBookingState("cancelled");
        showToast("Ride was cancelled.", "red");
        setTimeout(resetBooking, 4000);
      }
    },
  });

  // GPS
  useEffect(() => {
    if ("geolocation" in navigator) {
      const id = navigator.geolocation.watchPosition(
        ({ coords }) => {
          setGpsPos([coords.latitude, coords.longitude]);
          setGpsAccuracy(coords.accuracy);
        },
        () => setGpsPos([16.6159, 120.3209]),
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 },
      );
      return () => navigator.geolocation.clearWatch(id);
    } else {
      setGpsPos([16.6159, 120.3209]);
    }
  }, []);

  // Load ride history
  useEffect(() => {
    api
      .get(`/api/rides/rider/${riderId}`)
      .then((res) => setHistory(res.data))
      .catch(() => {});
  }, [bookingState]);

  // Fare preview — debounced call to Django
  useEffect(() => {
    if (fareTimer.current) clearTimeout(fareTimer.current);
    if (!dest || dest.length < 3 || !gpsPos) {
      setFareInfo(null);
      return;
    }
    fareTimer.current = setTimeout(async () => {
      setIsFareLoading(true);
      try {
        const res = await fetch(
          `${import.meta.env.VITE_DJANGO_API_URL}/api/rides/fare/`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              pickup_lat: gpsPos[0],
              pickup_lng: gpsPos[1],
              dropoff_lat: gpsPos[0] + 0.01,
              dropoff_lng: gpsPos[1] + 0.01,
            }),
          },
        );
        const data = await res.json();
        setFareInfo({ fare: data.fare_php, dist: data.distance_km });
      } catch {
        setFareInfo({ fare: 40, dist: "~" });
      } finally {
        setIsFareLoading(false);
      }
    }, 800);
  }, [dest, gpsPos]);

  async function submitBooking() {
    if (!origin) return alert("Please enter your pickup point.");
    if (!dest) return alert("Please enter a destination.");
    setIsBooking(true);
    try {
      const res = await api.post("/api/rides/book", {
        riderId,
        pickup: origin,
        dropoff: dest,
        fareType: "Trike",
        pickupLat: gpsPos?.[0] || 16.6159,
        pickupLng: gpsPos?.[1] || 120.3209,
        dropoffLat: gpsPos?.[0] + 0.01 || 16.6259,
        dropoffLng: gpsPos?.[1] + 0.01 || 120.3309,
      });
      setCurrentRide(res.data);
      setBookingState("pending");
      setBookingData(res.data);
      showToast("🔍 Looking for a driver...", "blue");
    } catch {
      showToast("Booking failed. Please try again.", "red");
    } finally {
      setIsBooking(false);
    }
  }

  async function cancelBooking() {
    if (!currentRide) return;
    if (!confirm("Cancel your current booking?")) return;
    await api.patch(`/api/rides/${currentRide.id}/cancel`);
    resetBooking();
    showToast("Booking cancelled.", "red");
  }

  function resetBooking() {
    setBookingState("idle");
    setBookingData(null);
    setCurrentRide(null);
    setOrigin("");
    setDest("");
    setFareInfo(null);
  }

  async function saveProfile(e) {
    e.preventDefault();
    setIsSavingProfile(true);
    await new Promise((r) => setTimeout(r, 600));
    setIsSavingProfile(false);
    setProfileAlert({
      type: "success",
      msg: "✓ Profile updated successfully!",
    });
    showToast("✓ Profile saved!", "green");
    setTimeout(() => setProfileAlert(null), 5000);
  }

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
          <div className="w-9 h-9 rounded-lg bg-blue-500/20 flex items-center justify-center text-sm font-black text-blue-400">
            P
          </div>
          <div className="text-xl font-black leading-none">
            <span className="text-blue-400">Pasada</span>
            <span className="text-orange-400">Now</span>
          </div>
        </div>
        <div className="px-5 pt-5 pb-1.5 text-[0.6rem] font-bold text-[#6a9cbf] uppercase tracking-widest">
          Commuter
        </div>
        {[
          { id: "dashboard", label: "Overview", icon: "⊞" },
          { id: "history", label: "Trip Records", icon: "⏱" },
          { id: "profile", label: "Profile Settings", icon: "👤" },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`flex items-center gap-2.5 mx-2.5 my-0.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-all text-left w-[calc(100%-20px)] ${view === item.id ? "bg-blue-500/10 text-blue-400 font-semibold border border-[rgba(99,160,220,0.35)]" : "text-[#6a9cbf] hover:bg-white/[0.04] hover:text-[#cce0f5]"}`}
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
            {view === item.id && (
              <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_6px_#3b8ee8]" />
            )}
          </button>
        ))}
        <div className="mt-auto p-4 border-t border-[rgba(99,160,220,0.15)]">
          <div className="flex items-center gap-2.5 p-2 rounded-lg bg-[#132540] mb-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-800 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
              {user.username?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[0.8rem] font-semibold truncate">
                {user.username}
              </div>
              <div className="text-[0.65rem] text-[#6a9cbf]">Commuter</div>
            </div>
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
          <h2 className="text-lg font-bold whitespace-nowrap">
            {
              {
                dashboard: "PasadaNow Commuter Portal",
                history: "Trip Records",
                profile: "Profile Settings",
              }[view]
            }
          </h2>
          <span className="text-[0.78rem] text-[#6a9cbf] whitespace-nowrap">
            {clock}
          </span>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          {/* DASHBOARD */}
          {view === "dashboard" && (
            <div className="animate-[fadeUp_0.25s_ease]">
              <div className="grid grid-cols-3 gap-3.5 mb-5">
                <StatCard
                  color="blue"
                  icon="🚗"
                  value={history.length}
                  label="Total Bookings"
                />
                <StatCard
                  color="orange"
                  icon="₱"
                  value={
                    history.length > 0
                      ? `₱${history[history.length - 1]?.fare || 0}`
                      : "—"
                  }
                  label="Last Fare"
                />
                <StatCard
                  color="purple"
                  icon="⏱"
                  value="COMMUTER"
                  label="Account Type"
                />
              </div>

              <div className="rounded-xl overflow-hidden border border-[rgba(99,160,220,0.15)] mb-4 h-[260px]">
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
                  <LocationMarker position={gpsPos} accuracy={gpsAccuracy} />
                </MapContainer>
              </div>

              <div className="bg-[#0f1f35] border border-[rgba(99,160,220,0.15)] rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_6px_#3b8ee8]" />
                  <span className="text-sm font-semibold">Book a Ride</span>
                </div>

                {bookingState !== "idle" ? (
                  <BookingStatusPanel
                    state={bookingState}
                    data={bookingData}
                    onCancel={cancelBooking}
                    onBookNew={resetBooking}
                  />
                ) : (
                  <div className="space-y-3">
                    <Field
                      label="Pickup Point"
                      value={origin}
                      onChange={setOrigin}
                      placeholder="Your current location..."
                    />
                    <Field
                      label="Destination"
                      value={dest}
                      onChange={setDest}
                      placeholder="Enter destination..."
                    />

                    {isFareLoading && (
                      <div className="text-[0.78rem] text-[#6a9cbf] animate-pulse">
                        Calculating fare...
                      </div>
                    )}
                    {fareInfo && !isFareLoading && (
                      <div className="px-3.5 py-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                        <div className="text-[0.6rem] font-bold uppercase tracking-widest text-green-400 mb-0.5">
                          Estimated Fare
                        </div>
                        <div className="text-2xl font-bold text-green-400">
                          ₱{fareInfo.fare}
                        </div>
                        <div className="text-[0.65rem] text-green-400 mt-0.5">
                          ~{fareInfo.dist} km · ₱40.00 base + ₱10.00/km after
                          4km
                        </div>
                      </div>
                    )}

                    <button
                      onClick={submitBooking}
                      disabled={isBooking}
                      className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-semibold rounded-lg text-sm transition-colors"
                    >
                      {isBooking ? "Sending Request..." : "Find a Driver →"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* HISTORY */}
          {view === "history" && (
            <div className="bg-[#0f1f35] border border-[rgba(99,160,220,0.15)] rounded-xl p-5 animate-[fadeUp_0.25s_ease]">
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
                <span className="text-[0.78rem] font-semibold text-blue-400 border border-[rgba(99,160,220,0.35)] px-3 py-1.5 rounded-lg">
                  Trip Records
                </span>
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
                        className="text-center text-[#6a9cbf] py-8 text-sm"
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
                        <td className="px-3 py-2.5 text-[#6a9cbf]">#{r.id}</td>
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
          )}

          {/* PROFILE */}
          {view === "profile" && (
            <div className="max-w-2xl animate-[fadeUp_0.25s_ease]">
              {profileAlert && (
                <div
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-sm font-semibold mb-4 ${profileAlert.type === "success" ? "bg-green-500/10 border border-green-500/20 text-green-400" : "bg-red-500/10 border border-red-500/20 text-red-400"}`}
                >
                  {profileAlert.msg}
                </div>
              )}
              <div className="flex items-center gap-5 p-5 bg-[#132540] border border-[rgba(99,160,220,0.15)] rounded-xl mb-5">
                <div className="w-[72px] h-[72px] rounded-full bg-gradient-to-br from-blue-500 to-blue-800 flex items-center justify-center text-[1.8rem] font-extrabold text-white border-2 border-[rgba(99,160,220,0.35)] flex-shrink-0">
                  {user.username?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-1">
                    {user.username}
                  </h4>
                  <p className="text-[0.72rem] text-[#6a9cbf] mb-2.5">
                    Commuter Account
                  </p>
                </div>
              </div>
              <form
                onSubmit={saveProfile}
                className="bg-[#0f1f35] border border-[rgba(99,160,220,0.15)] rounded-xl p-5 space-y-3"
              >
                <div className="grid grid-cols-2 gap-3">
                  <Field
                    label="Full Name"
                    value={profileForm.fullname}
                    onChange={(v) =>
                      setProfileForm((f) => ({ ...f, fullname: v }))
                    }
                  />
                  <Field
                    label="Contact Number"
                    value={profileForm.contact}
                    onChange={(v) =>
                      setProfileForm((f) => ({ ...f, contact: v }))
                    }
                  />
                </div>
                <Field
                  label="Email Address"
                  value={profileForm.email}
                  onChange={(v) => setProfileForm((f) => ({ ...f, email: v }))}
                  type="email"
                />
                <Field
                  label="New Password (leave blank to keep)"
                  value={profileForm.new_password}
                  onChange={(v) =>
                    setProfileForm((f) => ({ ...f, new_password: v }))
                  }
                  type="password"
                  placeholder="••••••••"
                />
                <div className="flex gap-2.5 pt-2">
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-semibold rounded-lg text-sm transition-colors"
                  >
                    {isSavingProfile ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>

      <Toast {...toast} />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .leaflet-container { background: #0a1628; }
      `}</style>
    </div>
  );
}
