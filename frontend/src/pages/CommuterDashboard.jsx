import { useState, useEffect, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Circle, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

/* ── fix default leaflet marker icons in bundlers ── */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

/* ── orange "you are here" icon ── */
const youIcon = L.divIcon({
  className: "",
  html: `<div style="width:16px;height:16px;background:#f08228;border-radius:50%;border:3px solid white;box-shadow:0 0 0 3px rgba(240,130,40,0.4),0 2px 8px rgba(0,0,0,.5);"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

/* ── tiny helper to keep map synced with position ── */
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

/* ─────────────────────────────────────────────
   MOCK API helpers  (swap for real fetch calls)
───────────────────────────────────────────────*/
const API = {
  getDrivers: async () => {
    // Replace with: fetch('/api/commuter/drivers')
    return [
      {
        id: 1,
        username: "Juan Dela Cruz",
        plate_number: "ABC-123",
        contact_no: "09171234567",
      },
      {
        id: 2,
        username: "Pedro Santos",
        plate_number: "XYZ-789",
        contact_no: "09271234567",
      },
    ];
  },
  submitBooking: async (payload) => {
    // Replace with: fetch('/api/commuter/bookings', { method:'POST', body: JSON.stringify(payload) })
    await new Promise((r) => setTimeout(r, 800));
    return { success: true, booking_id: Math.floor(Math.random() * 10000) };
  },
  pollBooking: async (bookingId) => {
    // Replace with: fetch(`/api/commuter/bookings/${bookingId}/status`)
    await new Promise((r) => setTimeout(r, 300));
    return null; // null = still pending
  },
  cancelBooking: async () => {
    // Replace with: fetch('/api/commuter/bookings/cancel', { method:'POST' })
    return { success: true };
  },
  getDriverCount: async () => {
    // Replace with: fetch('/api/commuter/driver-count')
    return { count: 2 };
  },
  getHistory: async () => {
    // Replace with: fetch('/api/commuter/history')
    return [];
  },
  getProfile: async () => {
    // Replace with: fetch('/api/commuter/profile')
    return {
      username: "Commuter",
      email: "commuter@email.com",
      phone: "",
      address: "",
      profile_pic: null,
      total_rides: 0,
      last_fare: null,
    };
  },
  updateProfile: async (data) => {
    // Replace with: fetch('/api/commuter/profile', { method:'PUT', body: JSON.stringify(data) })
    return { success: true, ...data };
  },
};

/* ── fare computation ── */
function computeFare(dest) {
  if (!dest || dest.length <= 3) return null;
  const dist = 4 + Math.random() * 21;
  const fare = 15 + Math.max(0, dist - 4) * 2;
  return { dist: dist.toFixed(1), fare: fare.toFixed(2) };
}

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
        `${days[n.getDay()]}, ${months[n.getMonth()]} ${n.getDate()}, ${h}:${String(n.getMinutes()).padStart(2, "0")}:${String(n.getSeconds()).padStart(2, "0")} ${ap}`,
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return clock;
}

/* ═══════════════════════════════════════════
   STATUS BADGE
═══════════════════════════════════════════*/
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

/* ═══════════════════════════════════════════
   TOAST
═══════════════════════════════════════════*/
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

/* ═══════════════════════════════════════════
   STAT CARD
═══════════════════════════════════════════*/
const ICON_COLORS = {
  blue: "bg-blue-500/10 text-blue-400",
  green: "bg-green-500/10 text-green-400",
  orange: "bg-orange-500/10 text-orange-400",
  purple: "bg-purple-500/10 text-purple-400",
};
function StatCard({ color, icon, value, label }) {
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
      <div
        className={`absolute -bottom-5 -right-5 w-20 h-20 rounded-full opacity-[0.07] ${color === "blue" ? "bg-blue-500" : color === "green" ? "bg-green-500" : color === "orange" ? "bg-orange-500" : "bg-purple-500"}`}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════*/
export default function CommuterDashboard() {
  const clock = useClock();
  const [view, setView] = useState("dashboard");

  /* profile */
  const [profile, setProfile] = useState({
    username: "Commuter",
    email: "",
    phone: "",
    address: "",
    profile_pic: null,
    total_rides: 0,
    last_fare: null,
  });
  const [history, setHistory] = useState([]);

  /* booking */
  const [drivers, setDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [origin, setOrigin] = useState("");
  const [dest, setDest] = useState("");
  const [fareInfo, setFareInfo] = useState(null);
  const [bookingState, setBookingState] = useState("idle"); // idle | pending | accepted | ongoing | completed | cancelled
  const [bookingData, setBookingData] = useState(null);
  const [bookingId, setBookingId] = useState(null);
  const [isBooking, setIsBooking] = useState(false);

  /* driver count */
  const [onlineDrivers, setOnlineDrivers] = useState(0);
  const [prevDriverCount, setPrevDriverCount] = useState(0);
  const [driverPopup, setDriverPopup] = useState(false); // online popup
  const [offlinePopup, setOfflinePopup] = useState(false);
  const [completePopup, setCompletePopup] = useState(false);
  const [notifCount, setNotifCount] = useState(0);

  /* GPS */
  const [gpsPos, setGpsPos] = useState(null);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);

  /* profile form */
  const [profileForm, setProfileForm] = useState({
    fullname: "",
    email: "",
    contact: "",
    address: "",
    new_password: "",
  });
  const [profileAlert, setProfileAlert] = useState(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

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

  /* poll ref */
  const pollRef = useRef(null);

  /* ── init ── */
  useEffect(() => {
    API.getProfile().then((p) => {
      setProfile(p);
      setProfileForm({
        fullname: p.username,
        email: p.email,
        contact: p.phone,
        address: p.address,
        new_password: "",
      });
    });
    API.getHistory().then(setHistory);
    loadDrivers();

    /* GPS */
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

  /* driver count poll */
  useEffect(() => {
    const id = setInterval(async () => {
      const { count } = await API.getDriverCount();
      setOnlineDrivers(count);
      setNotifCount(count);
      if (count > prevDriverCount) {
        setDriverPopup(true);
        showToast(
          `🚗 ${count - prevDriverCount} driver(s) just came online!`,
          "green",
        );
        loadDrivers();
      }
      if (count < prevDriverCount) {
        setOfflinePopup(true);
        showToast(`⚠️ A driver went offline. ${count} remaining.`, "orange");
        loadDrivers();
      }
      setPrevDriverCount(count);
    }, 5000);
    API.getDriverCount().then(({ count }) => {
      setOnlineDrivers(count);
      setNotifCount(count);
      setPrevDriverCount(count);
    });
    return () => clearInterval(id);
  }, [prevDriverCount]);

  async function loadDrivers() {
    const data = await API.getDrivers();
    setDrivers(data);
    setOnlineDrivers(data.length);
  }

  /* dest → fare */
  useEffect(() => {
    setFareInfo(computeFare(dest));
  }, [dest]);

  /* booking poll */
  function startPolling(id) {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      const data = await API.pollBooking(id);
      if (!data) return;
      if (data.status === bookingState) return;
      if (data.status === "accepted") {
        setBookingState("accepted");
        setBookingData(data);
        showToast("✓ Driver is on the way!", "green");
      }
      if (data.status === "ongoing") {
        setBookingState("ongoing");
        setBookingData(data);
        showToast("🚗 Trip is now ongoing!", "yellow");
      }
      if (data.status === "completed") {
        clearInterval(pollRef.current);
        setBookingState("completed");
        setBookingData(data);
        setCompletePopup(true);
        showToast("🎉 Trip completed!", "purple");
      }
      if (data.status === "cancelled") {
        clearInterval(pollRef.current);
        setBookingState("cancelled");
        showToast("Driver cancelled. Please try another.", "red");
        setTimeout(resetBooking, 4000);
      }
    }, 3000);
  }

  async function submitBooking() {
    if (!origin) return alert("Please enter your pickup point.");
    if (!dest) return alert("Please enter a destination.");
    if (!selectedDriver) return alert("Please select a driver.");
    if (!fareInfo) return alert("Enter destination to calculate fare.");
    setIsBooking(true);
    const result = await API.submitBooking({
      origin,
      destination: dest,
      driver_id: selectedDriver.id,
      fare: fareInfo.fare,
    });
    setIsBooking(false);
    if (result.success) {
      setBookingId(result.booking_id);
      setBookingState("pending");
      setBookingData({ origin, destination: dest, fare: fareInfo.fare });
      setTimeout(() => startPolling(result.booking_id), 500);
      loadDrivers();
    } else {
      alert(result.message || "Booking failed.");
    }
  }

  async function cancelBooking() {
    if (!confirm("Cancel your current booking?")) return;
    await API.cancelBooking();
    if (pollRef.current) clearInterval(pollRef.current);
    resetBooking();
    showToast("Booking cancelled.", "red");
  }

  function resetBooking() {
    setBookingState("idle");
    setBookingData(null);
    setBookingId(null);
    setOrigin("");
    setDest("");
    setFareInfo(null);
    setSelectedDriver(null);
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    loadDrivers();
  }

  async function saveProfile(e) {
    e.preventDefault();
    setIsSavingProfile(true);
    const result = await API.updateProfile(profileForm);
    setIsSavingProfile(false);
    if (result.success) {
      setProfile((p) => ({
        ...p,
        username: profileForm.fullname,
        email: profileForm.email,
        phone: profileForm.contact,
        address: profileForm.address,
      }));
      setProfileAlert({
        type: "success",
        msg: "✓ Profile updated successfully!",
      });
      showToast("✓ Profile saved!", "green");
      setTimeout(() => setProfileAlert(null), 5000);
    } else {
      setProfileAlert({ type: "error", msg: "Error saving profile." });
    }
  }

  const filteredHistory = history.filter(
    (r) =>
      !histSearch ||
      JSON.stringify(r).toLowerCase().includes(histSearch.toLowerCase()),
  );

  /* ─────────── RENDER ─────────── */
  return (
    <div className="flex h-screen bg-[#0a1628] text-[#cce0f5] font-['Outfit',sans-serif] overflow-hidden">
      {/* ══ SIDEBAR ══ */}
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
              {profile.username?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[0.8rem] font-semibold truncate">
                {profile.username}
              </div>
              <div className="text-[0.65rem] text-[#6a9cbf]">Commuter</div>
            </div>
          </div>
          <a
            href="/logout"
            className="flex items-center gap-2 text-red-400 text-[0.8rem] font-medium px-2 py-1.5 rounded-md hover:bg-red-500/10 transition-colors"
          >
            <span>⬡</span> Sign Out
          </a>
        </div>
      </aside>

      {/* ══ MAIN ══ */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* topbar */}
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
          <div className="flex-1 max-w-xs flex items-center bg-[#132540] border border-[rgba(99,160,220,0.15)] rounded-lg px-3.5 py-1.5 gap-2 text-sm text-[#6a9cbf]">
            <span>🔍</span>
            <input
              className="bg-transparent outline-none text-[#cce0f5] placeholder-[#6a9cbf] w-full text-[0.8rem]"
              placeholder="Search routes, drivers..."
            />
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[0.78rem] text-[#6a9cbf] whitespace-nowrap">
              {clock}
            </span>
            <div className="relative">
              <button className="w-8 h-8 bg-[#132540] border border-[rgba(99,160,220,0.15)] rounded-lg flex items-center justify-center text-[#6a9cbf] hover:border-[rgba(99,160,220,0.35)] transition-colors">
                🔔
              </button>
              {notifCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[0.5rem] font-bold min-w-[14px] h-3.5 px-0.5 rounded-full flex items-center justify-center">
                  {notifCount}
                </span>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-[rgba(99,160,220,0.3)]">
          {/* ════════ DASHBOARD ════════ */}
          {view === "dashboard" && (
            <div className="animate-[fadeUp_0.25s_ease]">
              {/* stats */}
              <div className="grid grid-cols-4 gap-3.5 mb-5">
                <StatCard
                  color="blue"
                  icon="🚗"
                  value={profile.total_rides}
                  label="Total Bookings"
                />
                <StatCard
                  color="green"
                  icon="👥"
                  value={onlineDrivers}
                  label="Online Drivers"
                />
                <StatCard
                  color="orange"
                  icon="₱"
                  value={
                    profile.last_fare
                      ? `₱${parseFloat(profile.last_fare).toFixed(2)}`
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

              {/* map */}
              <div className="rounded-xl overflow-hidden border border-[rgba(99,160,220,0.15)] mb-4 h-[280px]">
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

              <div className="grid grid-cols-[1.3fr_0.7fr] gap-4">
                {/* booking card */}
                <div className="bg-[#0f1f35] border border-[rgba(99,160,220,0.15)] rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_6px_#3b8ee8]" />
                    <span className="text-sm font-semibold">Book a Ride</span>
                  </div>

                  {/* ── STATUS PANELS ── */}
                  {bookingState === "pending" && (
                    <BookingStatusPanel
                      state="pending"
                      data={bookingData}
                      onCancel={cancelBooking}
                    />
                  )}
                  {bookingState === "accepted" && (
                    <BookingStatusPanel state="accepted" data={bookingData} />
                  )}
                  {bookingState === "ongoing" && (
                    <BookingStatusPanel state="ongoing" data={bookingData} />
                  )}
                  {bookingState === "completed" && (
                    <BookingStatusPanel
                      state="completed"
                      data={bookingData}
                      onBookNew={resetBooking}
                    />
                  )}
                  {bookingState === "cancelled" && (
                    <BookingStatusPanel state="cancelled" data={null} />
                  )}

                  {/* ── BOOKING FORM ── */}
                  {bookingState === "idle" && (
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

                      <div>
                        <label className="block text-[0.65rem] font-semibold uppercase tracking-widest text-[#6a9cbf] mb-1.5">
                          Select Driver
                        </label>
                        <select
                          className="w-full px-3 py-2.5 bg-[#132540] border border-[rgba(99,160,220,0.15)] rounded-lg text-[#cce0f5] text-sm outline-none focus:border-blue-400 transition-colors cursor-pointer"
                          value={selectedDriver?.id || ""}
                          onChange={(e) => {
                            const d = drivers.find(
                              (d) => d.id === +e.target.value,
                            );
                            setSelectedDriver(d || null);
                          }}
                        >
                          <option value="">— Choose an online driver —</option>
                          {drivers.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.username} ({d.plate_number || "No plate"})
                            </option>
                          ))}
                        </select>
                      </div>

                      {fareInfo && (
                        <div className="px-3.5 py-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                          <div className="text-[0.6rem] font-bold uppercase tracking-widest text-green-400 mb-0.5">
                            Estimated Fare
                          </div>
                          <div className="text-2xl font-bold text-green-400">
                            ₱{fareInfo.fare}
                          </div>
                          <div className="text-[0.65rem] text-green-400 mt-0.5">
                            ~{fareInfo.dist} km · ₱15.00 base + ₱2.00/km
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

                {/* drivers list card */}
                <div className="bg-[#0f1f35] border border-[rgba(99,160,220,0.15)] rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_6px_#22c55e]" />
                    <span className="text-sm font-semibold">
                      Nearest Drivers
                    </span>
                  </div>
                  {drivers.length === 0 ? (
                    <p className="text-center text-[#6a9cbf] text-sm py-6">
                      No drivers online right now.
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {drivers.map((d) => (
                        <div
                          key={d.id}
                          onClick={() => setSelectedDriver(d)}
                          className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors border ${selectedDriver?.id === d.id ? "bg-blue-500/10 border-[rgba(99,160,220,0.35)]" : "border-transparent hover:bg-blue-500/5"}`}
                        >
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-800 to-blue-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                            {d.username.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[0.8rem] font-semibold truncate">
                              {d.username}
                            </div>
                            <div className="text-[0.65rem] text-[#6a9cbf]">
                              {d.plate_number || "No plate"} · Tricycle
                            </div>
                          </div>
                          <div className="flex items-center gap-1 text-[0.65rem] font-semibold text-green-400 bg-green-500/10 px-2 py-1 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_6px_#22c55e]" />
                            Online
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mt-4 pt-3 border-t border-[rgba(99,160,220,0.15)] space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#6a9cbf]">Online Drivers</span>
                      <span className="font-bold">{onlineDrivers}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#6a9cbf]">Your Bookings</span>
                      <span className="font-bold">{profile.total_rides}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#6a9cbf]">Last Fare</span>
                      <span className="font-bold text-green-400">
                        {profile.last_fare
                          ? `₱${parseFloat(profile.last_fare).toFixed(2)}`
                          : "—"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════════ HISTORY ════════ */}
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
                        <td className="px-3 py-2.5 text-[#6a9cbf]">
                          #TRP-{String(r.id).padStart(3, "0")}
                        </td>
                        <td className="px-3 py-2.5">
                          {new Date(r.created_at).toLocaleDateString("en-PH", {
                            month: "short",
                            day: "2-digit",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-3 py-2.5">
                          {r.origin} → {r.destination}
                        </td>
                        <td className="px-3 py-2.5">{r.driver}</td>
                        <td className="px-3 py-2.5 font-semibold">
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
          )}

          {/* ════════ PROFILE ════════ */}
          {view === "profile" && (
            <div className="max-w-2xl animate-[fadeUp_0.25s_ease]">
              {profileAlert && (
                <div
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-sm font-semibold mb-4 ${profileAlert.type === "success" ? "bg-green-500/10 border border-green-500/20 text-green-400" : "bg-red-500/10 border border-red-500/20 text-red-400"}`}
                >
                  {profileAlert.msg}
                </div>
              )}
              {/* pic row */}
              <div className="flex items-center gap-5 p-5 bg-[#132540] border border-[rgba(99,160,220,0.15)] rounded-xl mb-5">
                <div className="w-[72px] h-[72px] rounded-full bg-gradient-to-br from-blue-500 to-blue-800 flex items-center justify-center text-[1.8rem] font-extrabold text-white border-2 border-[rgba(99,160,220,0.35)] flex-shrink-0">
                  {profile.username?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-1">
                    {profile.username}
                  </h4>
                  <p className="text-[0.72rem] text-[#6a9cbf] mb-2.5">
                    Commuter Account · {profile.email}
                  </p>
                  <button className="px-3.5 py-1.5 bg-[#0f1f35] border border-[rgba(99,160,220,0.15)] rounded-lg text-[0.8rem] text-[#cce0f5] hover:border-[rgba(99,160,220,0.35)] transition-colors">
                    Change Photo
                  </button>
                </div>
              </div>

              <form
                onSubmit={saveProfile}
                className="bg-[#0f1f35] border border-[rgba(99,160,220,0.15)] rounded-xl p-5"
              >
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_6px_#3b8ee8]" />
                  <span className="text-sm font-semibold">
                    Personal Information
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
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
                  className="mb-3"
                />
                <div className="mb-3">
                  <label className="block text-[0.65rem] font-semibold uppercase tracking-widest text-[#6a9cbf] mb-1.5">
                    Home / Saved Address
                  </label>
                  <textarea
                    rows={3}
                    value={profileForm.address}
                    onChange={(e) =>
                      setProfileForm((f) => ({ ...f, address: e.target.value }))
                    }
                    className="w-full px-3 py-2.5 bg-[#132540] border border-[rgba(99,160,220,0.15)] rounded-lg text-[#cce0f5] text-sm outline-none focus:border-blue-400 transition-colors resize-y"
                  />
                </div>
                <Field
                  label="New Password (leave blank to keep)"
                  value={profileForm.new_password}
                  onChange={(v) =>
                    setProfileForm((f) => ({ ...f, new_password: v }))
                  }
                  type="password"
                  placeholder="••••••••"
                  className="mb-4"
                />
                <div className="flex gap-2.5">
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-semibold rounded-lg text-sm transition-colors"
                  >
                    {isSavingProfile ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setProfileForm({
                        fullname: profile.username,
                        email: profile.email,
                        contact: profile.phone,
                        address: profile.address,
                        new_password: "",
                      })
                    }
                    className="px-6 py-2.5 bg-[#132540] border border-[rgba(99,160,220,0.15)] hover:border-[rgba(99,160,220,0.35)] text-[#cce0f5] font-semibold rounded-lg text-sm transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>

      {/* ══ DRIVER ONLINE POPUP ══ */}
      {driverPopup && (
        <Popup
          title="Driver Now Available!"
          sub="A driver just came online near you"
          color="green"
          count={`${onlineDrivers} driver(s) available and ready.`}
          onDismiss={() => setDriverPopup(false)}
          onAction={() => {
            setDriverPopup(false);
            setView("dashboard");
            showToast("Select a driver and enter your destination!", "green");
          }}
          actionLabel="Book Now →"
        />
      )}

      {/* ══ DRIVER OFFLINE POPUP ══ */}
      {offlinePopup && (
        <Popup
          title="Driver Went Offline"
          sub="A driver just went offline"
          color="red"
          count={`${onlineDrivers} driver(s) still available.`}
          onDismiss={() => setOfflinePopup(false)}
        />
      )}

      {/* ══ TRIP COMPLETE POPUP ══ */}
      {completePopup && bookingData && (
        <div className="fixed top-20 right-6 w-80 bg-[#0f1f35] border border-purple-500/50 rounded-xl p-5 z-[9997] shadow-2xl animate-[slideDown_0.4s_ease]">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-9 h-9 rounded-full bg-purple-500/20 border-2 border-purple-400/40 flex items-center justify-center text-purple-400 text-lg">
              ✓
            </div>
            <div>
              <div className="text-sm font-bold text-purple-400">
                Trip Completed!
              </div>
              <div className="text-[0.68rem] text-[#6a9cbf]">
                Your ride has been finished
              </div>
            </div>
          </div>
          <div className="text-[0.78rem] text-[#6a9cbf] mb-1">
            {bookingData.origin} → {bookingData.destination}
          </div>
          <div className="text-3xl font-extrabold text-purple-400 mb-3">
            ₱{parseFloat(bookingData.fare).toFixed(2)}
          </div>
          <button
            onClick={() => setCompletePopup(false)}
            className="w-full py-2 bg-[#132540] border border-purple-500/30 text-purple-400 text-sm font-semibold rounded-lg hover:bg-purple-500/10 transition-colors"
          >
            Done
          </button>
        </div>
      )}

      <Toast {...toast} />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
        @keyframes fadeUp    { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideDown { from{opacity:0;transform:translateY(-20px)} to{opacity:1;transform:translateY(0)} }
        .scrollbar-thin::-webkit-scrollbar { width: 4px; }
        .scrollbar-thumb-\\[rgba\\(99\\,160\\,220\\,0\\.3\\)\\]::-webkit-scrollbar-thumb { background: rgba(99,160,220,0.3); border-radius:4px; }
        .leaflet-container { background: #0a1628; }
      `}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════
   FIELD COMPONENT
═══════════════════════════════════════════*/
function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  className = "",
}) {
  return (
    <div className={className}>
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
        className="w-full px-3 py-2.5 bg-[#132540] border border-[rgba(99,160,220,0.15)] rounded-lg text-[#cce0f5] text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/25 transition-all placeholder-[#6a9cbf]"
      />
    </div>
  );
}

/* ═══════════════════════════════════════════
   BOOKING STATUS PANEL
═══════════════════════════════════════════*/
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
          <b>From:</b> {data.origin} &nbsp; <b>To:</b> {data.destination} &nbsp;{" "}
          <b>Fare:</b> ₱{parseFloat(data.fare).toFixed(2)}
        </div>
      )}
      {(state === "accepted" || state === "ongoing" || state === "completed") &&
        data?.driver_name && (
          <div className="grid grid-cols-2 gap-2 mt-2.5">
            {[
              ["Driver", data.driver_name],
              ["Plate No.", data.plate_number],
              ["Contact", data.contact_no],
              ["Fare", `₱${parseFloat(data.fare).toFixed(2)}`],
            ].map(([l, v]) => (
              <div
                key={l}
                className={`p-2 rounded-lg border ${state === "completed" ? "bg-purple-500/8 border-purple-500/20" : state === "ongoing" ? "bg-yellow-500/8 border-yellow-500/20" : "bg-green-500/8 border-green-500/20"}`}
              >
                <div
                  className={`text-[0.58rem] font-bold uppercase tracking-widest mb-0.5 ${state === "completed" ? "text-purple-400" : state === "ongoing" ? "text-yellow-400" : "text-green-400"}`}
                >
                  {l}
                </div>
                <div className="text-[0.82rem] font-semibold">{v}</div>
              </div>
            ))}
          </div>
        )}
      {state === "ongoing" && (
        <div
          className="mt-3 h-1.5 rounded-full overflow-hidden"
          style={{
            background:
              "repeating-linear-gradient(90deg,#eab308 0,#eab308 18px,transparent 18px,transparent 36px)",
            backgroundSize: "54px 100%",
            animation: "roadAnim 0.7s linear infinite",
          }}
        />
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

/* ═══════════════════════════════════════════
   POPUP (driver online / offline)
═══════════════════════════════════════════*/
function Popup({ title, sub, color, count, onDismiss, onAction, actionLabel }) {
  const COLORS = {
    green: {
      border: "border-green-500/50",
      icon: "bg-green-500/20 text-green-400",
      titleC: "text-green-400",
      bar: "bg-green-500",
      dismiss: "text-green-400 border-green-500/30",
    },
    red: {
      border: "border-red-500/50",
      icon: "bg-red-500/20 text-red-400",
      titleC: "text-red-400",
      bar: "bg-red-500",
      dismiss: "text-red-400 border-red-500/30",
    },
  };
  const c = COLORS[color] || COLORS.green;
  return (
    <div
      className={`fixed top-20 right-6 w-80 bg-[#0f1f35] border ${c.border} rounded-xl p-4 z-[9999] shadow-2xl animate-[slideDown_0.4s_ease]`}
    >
      <div className="flex items-center gap-2.5 mb-2.5">
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center text-lg flex-shrink-0 ${c.icon}`}
        >
          🚗
        </div>
        <div>
          <div className={`text-sm font-bold ${c.titleC}`}>{title}</div>
          <div className="text-[0.68rem] text-[#6a9cbf]">{sub}</div>
        </div>
      </div>
      <div className="text-[0.82rem] text-[#cce0f5] mb-3">{count}</div>
      <div className="flex gap-2">
        {onAction && (
          <button
            onClick={onAction}
            className="flex-1 py-2 bg-green-500 text-white text-sm font-bold rounded-lg hover:opacity-90 transition-opacity"
          >
            {actionLabel}
          </button>
        )}
        <button
          onClick={onDismiss}
          className={`px-3.5 py-2 bg-[#132540] border rounded-lg text-sm cursor-pointer ${c.dismiss}`}
        >
          {onAction ? "Dismiss" : "OK, Got It"}
        </button>
      </div>
    </div>
  );
}
