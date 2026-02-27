import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { FaBell, FaChartLine, FaChartPie, FaHistory } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { getAuthUser } from "../../utils/auth";

const API_BASE = "http://localhost:5001";
const API_PREFIX = "/api";
const API = axios.create({ baseURL: API_BASE });

const ClientDashboard = () => {
  const navigate = useNavigate();
  const user = getAuthUser();

  const stored = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  }, []);

  const userId = stored?.userId;

  const [alertsEnabled, setAlertsEnabled] = useState(false);
  const [savingAlerts, setSavingAlerts] = useState(false);
  const [alertMsg, setAlertMsg] = useState("");

  useEffect(() => {
    const loadPref = async () => {
      if (!userId) return;

      try {
        const res = await API.get(`${API_PREFIX}/user/${userId}/alerts`);
        setAlertsEnabled(!!res.data?.emailAlertsEnabled);
      } catch {
      }
    };

    loadPref();
  }, [userId]);

  const toggleAlerts = async () => {
    if (!userId) return;

    const next = !alertsEnabled;

    setAlertsEnabled(next);
    setSavingAlerts(true);
    setAlertMsg("");

    try {
      await API.put(`${API_PREFIX}/user/${userId}/alerts`, {
        emailAlertsEnabled: next,
      });

      setAlertMsg(next ? "Email alerts enabled " : "Email alerts disabled ");
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
          Manage predictions, review your history, and explore insights from your climate results
        </p>
      </div>

      <div className="dashboard-cards-grid">
        <div className="dashboard-feature-card text-white">
          <div className="dashboard-card-top">
            <div className="dashboard-card-icon">
              <FaChartLine />
            </div>
            <span className="dashboard-card-badge">Action</span>
          </div>

          <h5 className="fw-bold mt-3">Make a Prediction</h5>
          <p className="dashboard-card-text">
            Generate a new climate prediction using the latest model inputs and parameters
          </p>

          <button
            className="btn btn-green-custom w-100 py-2 mt-2"
            onClick={() => navigate("/client/predictions")}
          >
            Start Prediction
          </button>
        </div>

        <div className="dashboard-feature-card text-white">
          <div className="dashboard-card-top">
            <div className="dashboard-card-icon">
              <FaHistory />
            </div>
            <span className="dashboard-card-badge">Records</span>
          </div>

          <h5 className="fw-bold mt-3">Prediction History</h5>
          <p className="dashboard-card-text">
            View previous predictions, compare trends, and track results over time
          </p>

          <button
            className="btn btn-outline-light w-100 py-2 mt-2"
            onClick={() => navigate("/client/prediction-history")}
          >
            View History
          </button>
        </div>

        <div className="dashboard-feature-card text-white">
          <div className="dashboard-card-top">
            <div className="dashboard-card-icon">
              <FaChartPie />
            </div>
            <span className="dashboard-card-badge">Insights</span>
          </div>

          <h5 className="fw-bold mt-3">Insights & Trends</h5>
          <p className="dashboard-card-text">
            Explore charts and summaries from your prediction data
          </p>

          <button
            className="btn btn-outline-light w-100 py-2 mt-2"
            onClick={() => navigate("/client/insights")}
          >
            View Insights & Trends
          </button>
        </div>

        <div className="dashboard-feature-card text-white">
          <div className="dashboard-card-top">
            <div className="dashboard-card-icon">
              <FaBell />
            </div>
            <span className="dashboard-card-badge">Safety</span>
          </div>

          <h5 className="fw-bold mt-3">Emergency Email Alerts</h5>
          <p className="dashboard-card-text">
            Enable this to receive emergency alerts by email when admins send warnings.
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
      </div>
    </div>
  );
};

export default ClientDashboard;