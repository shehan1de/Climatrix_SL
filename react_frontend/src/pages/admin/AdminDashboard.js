import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import {
  FaBell,
  FaHistory,
  FaQuestionCircle,
  FaUsers,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { getAuthUser } from "../../utils/auth";

const API_BASE = "http://localhost:5001";
const API_PREFIX = "/api";
const API = axios.create({ baseURL: API_BASE });

const AdminDashboard = () => {
  const navigate = useNavigate();
  const user = getAuthUser();

  const stored = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  }, []);

  const adminId = stored?.userId;

  const [alertsEnabled, setAlertsEnabled] = useState(false);
  const [savingAlerts, setSavingAlerts] = useState(false);
  const [alertMsg, setAlertMsg] = useState("");

  useEffect(() => {
    const loadPref = async () => {
      if (!adminId) return;

      try {
        const res = await API.get(`${API_PREFIX}/user/${adminId}/alerts`);
        setAlertsEnabled(!!res.data?.emailAlertsEnabled);
      } catch {
      }
    };

    loadPref();
  }, [adminId]);

  const toggleAlerts = async () => {
    if (!adminId) return;

    const next = !alertsEnabled;

    setAlertsEnabled(next);
    setSavingAlerts(true);
    setAlertMsg("");

    try {
      await API.put(`${API_PREFIX}/user/${adminId}/alerts`, {
        emailAlertsEnabled: next,
      });

      setAlertMsg(next ? "Email alerts enabled" : "Email alerts disabled");
    } catch (e) {
      setAlertsEnabled(!next);
      setAlertMsg("Failed to update alert preference");
    } finally {
      setSavingAlerts(false);
      setTimeout(() => setAlertMsg(""), 2500);
    }
  };

  return (
    <div className="client-dashboard-page dashboard-bg">
      <div className="dashboard-hero text-center">
        <h1 className="dashboard-title">
          <span className="brand-gradient">Welcome,</span> {user?.name}.
        </h1>

        <p className="dashboard-subtitle">
          Manage users, control emergency alerts, monitor predictions, and handle user questions
        </p>
      </div>

      <div className="dashboard-cards-grid">
        <div className="dashboard-feature-card text-white">
          <div className="dashboard-card-top">
            <div className="dashboard-card-icon">
              <FaUsers />
            </div>
            <span className="dashboard-card-badge">Admin</span>
          </div>

          <h5 className="fw-bold mt-3">User Management</h5>
          <p className="dashboard-card-text">
            View all users, manage roles, and control access across the system
          </p>

          <button
            className="btn btn-green-custom w-100 py-2 mt-2"
            onClick={() => navigate("/admin/users")}
          >
            Manage Users
          </button>
        </div>

        <div className="dashboard-feature-card text-white">
          <div className="dashboard-card-top">
            <div className="dashboard-card-icon">
              <FaBell />
            </div>
            <span className="dashboard-card-badge">Safety</span>
          </div>

          <h5 className="fw-bold mt-3">Alert System Management</h5>
          <p className="dashboard-card-text">
            View alert subscribers and send emergency email alerts to enabled users
          </p>

          <button
            className="btn btn-outline-light w-100 py-2 mt-2"
            onClick={() => navigate("/admin/alerts")}
          >
            Open Alert System
          </button>
        </div>

        <div className="dashboard-feature-card text-white">
          <div className="dashboard-card-top">
            <div className="dashboard-card-icon">
              <FaHistory />
            </div>
            <span className="dashboard-card-badge">Analytics</span>
          </div>

          <h5 className="fw-bold mt-3">Prediction History</h5>
          <p className="dashboard-card-text">
            Review prediction records, compare results, and analyze overall trends
          </p>

          <button
            className="btn btn-outline-light w-100 py-2 mt-2"
            onClick={() => navigate("/admin/prediction-history")}
          >
            View History
          </button>
        </div>

        <div className="dashboard-feature-card text-white">
          <div className="dashboard-card-top">
            <div className="dashboard-card-icon">
              <FaBell />
            </div>
            <span className="dashboard-card-badge">Preference</span>
          </div>

          <h5 className="fw-bold mt-3">Emergency Email Alerts</h5>
          <p className="dashboard-card-text">
            Enable this if you want to receive emergency alerts by email as an admin user.
          </p>

          <button
            className={`btn w-100 py-2 mt-2 ${
              alertsEnabled ? "btn-green-custom" : "btn-outline-light"
            }`}
            onClick={toggleAlerts}
            disabled={savingAlerts}
          >
            {savingAlerts
              ? "Saving..."
              : alertsEnabled
              ? "Enabled (Click to Disable)"
              : "Disabled (Click to Enable)"}
          </button>

          {alertMsg && (
            <div className="text-white-50 mt-2" style={{ fontSize: "0.9rem" }}>
              {alertMsg}
            </div>
          )}
        </div>

        <div className="dashboard-feature-card text-white">
          <div className="dashboard-card-top">
            <div className="dashboard-card-icon">
              <FaQuestionCircle />
            </div>
            <span className="dashboard-card-badge">Support</span>
          </div>

          <h5 className="fw-bold mt-3">Question Management</h5>
          <p className="dashboard-card-text">
            Review user questions, respond, and manage support requests efficiently
          </p>

          <button
            className="btn btn-outline-light w-100 py-2 mt-2"
            onClick={() => navigate("/admin/questions")}
          >
            Manage Questions
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;