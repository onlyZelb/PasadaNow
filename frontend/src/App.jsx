import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CommuterDashboard from "./pages/CommuterDashboard";
import DriverDashboard from "./pages/DriverDashboard";

// ── Auth helpers ──────────────────────────────────────────────────────────────
const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
};

// Protect routes — redirect to /login if not authenticated
function ProtectedRoute({ children }) {
  const user = getUser();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

// Route to the correct dashboard based on role stored in localStorage
function DashboardRouter() {
  const user = getUser();
  if (!user) return <Navigate to="/login" replace />;

  if (user.role === "driver") return <DriverDashboard />;
  if (user.role === "commuter") return <CommuterDashboard />;

  // Fallback — unknown role
  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardRouter />
            </ProtectedRoute>
          }
        />
        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
