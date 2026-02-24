// App.js
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";

// Public Pages
import About from "./pages/About";
import ForgetPassword from "./pages/ForgetPassword";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ResetPassword from "./pages/ResetPassword";
import VerifyCode from "./pages/VerifyCode";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminPredictionHistory from "./pages/admin/AdminPredictionHistory"; // ✅ NEW
import AdminProfile from "./pages/admin/AdminProfile";
import AlertManagement from "./pages/admin/AlertManagement";
import QueryManagement from "./pages/admin/QueryManagement"; // ✅ NEW
import UserManagement from "./pages/admin/UserManagement";

// Client Pages
import ClientDashboard from "./pages/client/ClientDashboard";
import ClientInsights from "./pages/client/Insights";
import PredictionHistory from "./pages/client/PredictionHistory";
import ClientPredictions from "./pages/client/Predictions";
import ClientProfile from "./pages/client/Profile";

// Sidebars
import AdminSidebar from "./pages/admin/AdminSidebar";
import ClientSidebar from "./pages/client/ClientSidebar";
import VerticalBar from "./pages/client/VerticalBar";

// Route Guard
import ProtectedRoute from "./routes/ProtectedRoute";

import "bootstrap/dist/css/bootstrap.min.css";
import "./styles/theme.css";

/* ✅ Client Layout (Sidebar only) */
const ClientLayout = ({ children }) => (
  <div className="d-flex vh-100">
    <ClientSidebar />
    <div className="flex-grow-1 overflow-auto p-3 client-layout-with-sidebar">
      {children}
    </div>
  </div>
);

/* ✅ Client Layout (Sidebar + VerticalBar) */
const ClientLayoutWithVerticalBar = ({ children }) => (
  <div className="d-flex vh-100">
    <ClientSidebar />
    <VerticalBar />
    <div className="flex-grow-1 overflow-auto p-3 client-layout-with-sidebar">
      {children}
    </div>
  </div>
);

/* ✅ Admin Dashboard Layout: ONLY ClientSidebar */
const AdminDashboardLayout = ({ children }) => (
  <div className="d-flex vh-100">
    <ClientSidebar />
    <div className="flex-grow-1 overflow-auto p-3 client-layout-with-sidebar">
      {children}
    </div>
  </div>
);

/* ✅ Admin Pages Layout (NOT dashboard): BOTH navs */
const AdminLayoutWithBothNav = ({ children }) => (
  <div className="d-flex vh-100">
    <ClientSidebar />
    <AdminSidebar />
    <div className="flex-grow-1 overflow-auto p-3 client-layout-with-sidebar">
      {children}
    </div>
  </div>
);

function AppLayout() {
  const location = useLocation();

  const hideFooterOnHome = location.pathname === "/";
  const isClientRoute = location.pathname.startsWith("/client");
  const isAdminRoute = location.pathname.startsWith("/admin");

  return (
    <>
      {!isClientRoute && !isAdminRoute && <Navbar />}

      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgetPassword />} />
        <Route path="/verify-code" element={<VerifyCode />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/about" element={<About />} />

        {/* Admin */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <AdminDashboardLayout>
                <AdminDashboard />
              </AdminDashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <AdminLayoutWithBothNav>
                <UserManagement />
              </AdminLayoutWithBothNav>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/profile"
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <AdminLayoutWithBothNav>
                <AdminProfile />
              </AdminLayoutWithBothNav>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/alerts"
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <AdminLayoutWithBothNav>
                <AlertManagement />
              </AdminLayoutWithBothNav>
            </ProtectedRoute>
          }
        />

        {/* ✅ Admin Prediction History */}
        <Route
          path="/admin/prediction-history"
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <AdminLayoutWithBothNav>
                <AdminPredictionHistory />
              </AdminLayoutWithBothNav>
            </ProtectedRoute>
          }
        />

        {/* ✅ Admin Query / Question Management */}
        <Route
          path="/admin/questions"
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <AdminLayoutWithBothNav>
                <QueryManagement />
              </AdminLayoutWithBothNav>
            </ProtectedRoute>
          }
        />

        {/* Client */}
        <Route
          path="/client/dashboard"
          element={
            <ProtectedRoute allowedRoles={["Client"]}>
              <ClientLayout>
                <ClientDashboard />
              </ClientLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/client/predictions"
          element={
            <ProtectedRoute allowedRoles={["Client"]}>
              <ClientLayoutWithVerticalBar>
                <ClientPredictions />
              </ClientLayoutWithVerticalBar>
            </ProtectedRoute>
          }
        />

        <Route
          path="/client/prediction-history"
          element={
            <ProtectedRoute allowedRoles={["Client"]}>
              <ClientLayoutWithVerticalBar>
                <PredictionHistory />
              </ClientLayoutWithVerticalBar>
            </ProtectedRoute>
          }
        />

        <Route
          path="/client/insights"
          element={
            <ProtectedRoute allowedRoles={["Client"]}>
              <ClientLayoutWithVerticalBar>
                <ClientInsights />
              </ClientLayoutWithVerticalBar>
            </ProtectedRoute>
          }
        />

        <Route
          path="/client/profile"
          element={
            <ProtectedRoute allowedRoles={["Client"]}>
              <ClientLayoutWithVerticalBar>
                <ClientProfile />
              </ClientLayoutWithVerticalBar>
            </ProtectedRoute>
          }
        />
      </Routes>

      {!hideFooterOnHome && !isClientRoute && !isAdminRoute && <Footer />}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}

export default App;