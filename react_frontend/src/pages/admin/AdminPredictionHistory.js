import axios from "axios";
import jsPDF from "jspdf";
import { useEffect, useMemo, useState } from "react";
import { FaChartBar, FaDownload, FaSyncAlt, FaTimes } from "react-icons/fa";
import logo from "../../assets/logo.png";
import Footer from "../../components/Footer";

const API_BASE = "http://localhost:5001";
const API_PREFIX = "/api";
const API = axios.create({ baseURL: API_BASE });

const PredictionHistory = () => {
  // predictions
  const [predictions, setPredictions] = useState([]);

  // ✅ users (for mapping userId -> name/email)
  const [users, setUsers] = useState([]);
  const [userMap, setUserMap] = useState({}); // { [userId]: userObj }

  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ type: "", message: "" });

  // UI filters
  const [search, setSearch] = useState("");
  const [timeframeFilter, setTimeframeFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");

  // sort filter
  const [sortOrder, setSortOrder] = useState("latest"); // latest | oldest

  // plot modal
  const [showPlot, setShowPlot] = useState(false);
  const [selectedPrediction, setSelectedPrediction] = useState(null);

  // Alert timeout
  useEffect(() => {
    if (alert.message) {
      const timer = setTimeout(() => setAlert({ type: "", message: "" }), 3000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  // =========================
  // Fetch users + predictions
  // =========================
  const fetchUsers = async () => {
    // same endpoint used in UserManagement
    const res = await API.get(`${API_PREFIX}/users`);
    const arr = Array.isArray(res.data) ? res.data : [];
    setUsers(arr);

    // build map userId -> user
    const map = {};
    arr.forEach((u) => {
      const id = Number(u.userId);
      if (id) map[id] = u;
    });
    setUserMap(map);
  };

  const fetchPredictions = async () => {
    // admin fetch all
    const res = await API.get(`${API_PREFIX}/predictions`);
    const arr = Array.isArray(res.data)
      ? res.data
      : Array.isArray(res.data?.predictions)
      ? res.data.predictions
      : [];
    setPredictions(arr);
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchUsers(), fetchPredictions()]);
    } catch (err) {
      console.error(err);
      setAlert({ type: "error", message: "Failed to load prediction history" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // =========================
  // Helpers
  // =========================
  const prettyParam = (param) => {
    if (param === "rain_sum") return "Rainfall";
    if (param === "windspeed_10m_max") return "Wind Speed";
    if (param === "windgusts_10m_max") return "Wind Gusts";
    return param;
  };

  const formatDateTime = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString();
  };

  const riskClass = (riskText) =>
    `risk-${String(riskText || "").toLowerCase().replace(/\s+/g, "-")}`;

  const getUnitByParameter = (param) => {
    const p = String(param || "").toLowerCase();
    if (p.includes("rain") || p === "rain_sum") return "mm";
    if (p.includes("gust") || p === "windgusts_10m_max") return "km/h";
    if (p.includes("wind") || p === "windspeed_10m_max") return "km/h";
    return "";
  };

  const formatPredictedValue = (value, param) => {
    if (value === null || value === undefined || value === "") return "—";
    const unit = getUnitByParameter(param);
    return unit ? `${value} ${unit}` : String(value);
  };

  // ✅ user info from prediction.userId using the map
  const getUserInfo = (p) => {
    const id =
      Number(p?.userId) ||
      Number(p?.clientId) ||
      Number(p?.ownerId) ||
      0;

    const u = userMap[id];

    return {
      userId: id || "—",
      name: u?.name || "Unknown User",
      email: u?.email || "—",
    };
  };

  // =========================
  // Filter + sort list
  // =========================
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    const list = predictions.filter((p) => {
      const user = getUserInfo(p);

      const matchesSearch =
        !q ||
        `${p.city} ${p.parameter} ${p.disaster_risk} ${user.userId} ${user.name} ${user.email}`
          .toLowerCase()
          .includes(q);

      const matchesTimeframe =
        timeframeFilter === "all" || p.timeframe === timeframeFilter;

      const matchesRisk =
        riskFilter === "all" || p.disaster_risk === riskFilter;

      return matchesSearch && matchesTimeframe && matchesRisk;
    });

    list.sort((a, b) => {
      const da = new Date(a.createdAt || 0).getTime();
      const db = new Date(b.createdAt || 0).getTime();
      return sortOrder === "latest" ? db - da : da - db;
    });

    return list;
  }, [predictions, search, timeframeFilter, riskFilter, sortOrder, userMap]);

  // =========================
  // PDF helpers
  // =========================
  const safeText = (v) =>
    v === null || v === undefined || v === "" ? "—" : String(v);

  const toDataUrl = (imgSrc) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = reject;
      img.src = imgSrc;
    });

  const downloadPredictionPDF = async (p) => {
    try {
      const user = getUserInfo(p);

      const doc = new jsPDF("p", "mm", "a4");
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 14;

      const darkBg = [8, 10, 12];
      const accentBlue = [0, 174, 239];
      const accentGreen = [164, 198, 57];
      const softWhite = [235, 235, 235];

      doc.setFillColor(...darkBg);
      doc.rect(0, 0, pageW, pageH, "F");

      doc.setFillColor(...accentBlue);
      doc.rect(0, 0, pageW * 0.55, 18, "F");
      doc.setFillColor(...accentGreen);
      doc.rect(pageW * 0.55, 0, pageW * 0.45, 18, "F");

      let logoDataUrl = null;
      try {
        logoDataUrl = await toDataUrl(logo);
      } catch {
        logoDataUrl = null;
      }
      if (logoDataUrl) doc.addImage(logoDataUrl, "PNG", pageW / 2 - 9, 24, 18, 18);

      doc.setTextColor(...softWhite);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("CLIMATRIX SL", pageW / 2, 50, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(185, 185, 185);
      doc.text("Admin Prediction Report", pageW / 2, 56, { align: "center" });

      const cardX = margin;
      const cardY = 64;
      const cardW = pageW - margin * 2;
      const cardH = 96;

      doc.setFillColor(255, 255, 255, 0.06);
      doc.rect(cardX, cardY, cardW, cardH, "F");
      doc.setDrawColor(255, 255, 255);
      doc.setLineWidth(0.2);
      doc.rect(cardX, cardY, cardW, cardH, "S");

      const labelX = cardX + 10;
      const valueX = cardX + 55;
      let y = cardY + 16;

      const rows = [
        ["Client", safeText(user.name)],
        ["Client Email", safeText(user.email)],
        ["Client ID", safeText(user.userId)],
        ["City", safeText(p.city)],
        ["Parameter", safeText(prettyParam(p.parameter))],
        ["Timeframe", safeText(p.timeframe)],
        ["Mode", safeText(p.min_or_max)],
        ["Value", safeText(formatPredictedValue(p.predicted_value, p.parameter))],
        ["Risk", safeText(p.disaster_risk)],
        ["Date", safeText(formatDateTime(p.createdAt))],
      ];

      doc.setFontSize(11);
      rows.forEach(([label, value]) => {
        doc.setTextColor(200, 200, 200);
        doc.setFont("helvetica", "bold");
        doc.text(label, labelX, y);

        doc.setTextColor(240, 240, 240);
        doc.setFont("helvetica", "normal");
        doc.text(valueX > pageW ? value : value, valueX, y);

        y += 8;
      });

      let msgY = cardY + cardH + 14;

      doc.setTextColor(240, 240, 240);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Forecast Summary", margin, msgY);

      msgY += 8;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(190, 190, 190);

      const message = safeText(p.forecast_message);
      const msgLines = doc.splitTextToSize(message, pageW - margin * 2);
      doc.text(msgLines, margin, msgY);

      msgY += msgLines.length * 5 + 10;

      if (p.forecast_plot) {
        const imgData = `data:image/png;base64,${p.forecast_plot}`;
        const plotH = 80;

        if (msgY + plotH > pageH - 22) {
          doc.addPage();
          doc.setFillColor(...darkBg);
          doc.rect(0, 0, pageW, pageH, "F");
          msgY = 20;
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(240, 240, 240);
        doc.text("Forecast Plot", margin, msgY);

        msgY += 6;

        doc.setFillColor(255, 255, 255, 0.06);
        doc.rect(margin, msgY, pageW - margin * 2, plotH, "F");
        doc.setDrawColor(255, 255, 255);
        doc.setLineWidth(0.2);
        doc.rect(margin, msgY, pageW - margin * 2, plotH, "S");

        doc.addImage(imgData, "PNG", margin + 4, msgY + 4, pageW - margin * 2 - 8, plotH - 8);
      }

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(160, 160, 160);
      doc.text("Generated by ClimatrixSL • Admin Panel", pageW / 2, pageH - 10, {
        align: "center",
      });

      const safeCity = String(p.city || "prediction").replace(/\s+/g, "_");
      doc.save(`ClimatrixSL_Admin_${safeCity}_${Date.now()}.pdf`);
    } catch (e) {
      console.error(e);
      setAlert({
        type: "error",
        message: "PDF download failed. Make sure jspdf is installed.",
      });
    }
  };

  // Plot modal open/close
  const openPlotModal = (p) => {
    setSelectedPrediction(p);
    setShowPlot(true);
  };

  const closePlotModal = () => {
    setShowPlot(false);
    setSelectedPrediction(null);
  };

  return (
    <div className="history-page d-flex flex-column">
      {/* Alerts */}
      {alert.message && (
        <div
          className={`login-alert ${
            alert.type === "error" ? "login-alert-error" : "login-alert-success"
          }`}
        >
          {alert.message}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="loading-overlay">
          <img src={logo} alt="Loading..." className="spinner-logo-large" />
        </div>
      )}

      {/* Content */}
      <div className="history-container flex-grow-1">
        {/* Header */}
        <div className="history-hero">
          <h1 className="history-title">
            <span className="brand-gradient">Prediction</span> History
          </h1>
        </div>

        {/* Controls */}
        <div className="history-controls glass-panel">
          <div className="history-controls-row">
            <input
              className="form-control glass-input history-search"
              placeholder="Search by client, city, parameter, or risk..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              className="form-control glass-input glass-select history-select"
              value={timeframeFilter}
              onChange={(e) => setTimeframeFilter(e.target.value)}
            >
              <option value="all">All Timeframes</option>
              <option value="day">Day</option>
              <option value="week">Week</option>
              <option value="month">Month</option>
            </select>

            <select
              className="form-control glass-input glass-select history-select"
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
            >
              <option value="all">All Risks</option>
              <option value="Low Risk">Low</option>
              <option value="Moderate Risk">Moderate</option>
              <option value="High Risk">High</option>
            </select>

            <select
              className="form-control glass-input glass-select history-select"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              title="Sort"
            >
              <option value="latest">Latest</option>
              <option value="oldest">Oldest</option>
            </select>

            <button
              className="btn btn-outline-light history-refresh icon-btn"
              type="button"
              onClick={fetchAll}
              title="Refresh"
            >
              <FaSyncAlt />
            </button>
          </div>

          <div className="history-count text-white-50">
            Showing <strong className="text-white">{filtered.length}</strong> results
          </div>
        </div>

        {!loading && filtered.length === 0 && (
          <div className="glass-panel history-empty text-center text-white">
            <h5 className="fw-bold mb-2">No predictions found</h5>
            <p className="text-white-50 mb-0">Try changing filters or refresh.</p>
          </div>
        )}

        {/* Cards */}
        <div className="history-grid">
          {filtered.map((p) => {
            const user = getUserInfo(p);

            return (
              <div key={p._id} className="history-card">
                <div className="history-card-top">
                  <div>
                    <h5 className="history-card-title">
                      {p.city} • {prettyParam(p.parameter)}
                    </h5>

                    <div className="text-white-50" style={{ fontSize: 13, marginTop: 4 }}>
                      <b className="text-white-50">Client</b>{" "}
                      <span className="text-white">{user.name}</span>{" "}
                      <span className="text-white-50">({user.email})</span>{" "}
                      <span className="text-white-50">ID {user.userId}</span>
                    </div>

                    <div className="history-card-meta">
                      <span className="chip">{p.timeframe}</span>
                      <span className="chip">{p.min_or_max}</span>
                      <span className="chip chip-strong">
                        Value {formatPredictedValue(p.predicted_value, p.parameter)}
                      </span>
                      <span className="chip chip-date">{formatDateTime(p.createdAt)}</span>
                    </div>
                  </div>

                  <span className={`risk-pill ${riskClass(p.disaster_risk)}`}>
                    {p.disaster_risk}
                  </span>
                </div>

                {p.forecast_message && (
                  <p className="history-message">
                    <strong>Message</strong>{" "}
                    <span className="text-white-50">{p.forecast_message}</span>
                  </p>
                )}

                <div className="history-actions">
                  <button
                    className="icon-action-btn"
                    title="Download PDF"
                    type="button"
                    onClick={() => downloadPredictionPDF(p)}
                  >
                    <FaDownload />
                  </button>

                  <button
                    className="icon-action-btn"
                    title="View Plot"
                    type="button"
                    disabled={!p.forecast_plot}
                    onClick={() => openPlotModal(p)}
                  >
                    <FaChartBar />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Plot modal */}
      {showPlot && selectedPrediction && (
        <div className="history-modal-overlay" onClick={closePlotModal}>
          <div className="history-modal-glass" onClick={(e) => e.stopPropagation()}>
            <div className="history-modal-header">
              <div>
                <div className="history-modal-title">
                  {selectedPrediction.city} • {prettyParam(selectedPrediction.parameter)}
                </div>
                <div className="history-modal-sub text-white-50">
                  {formatDateTime(selectedPrediction.createdAt)}
                </div>
              </div>

              <button
                className="history-modal-close"
                type="button"
                onClick={closePlotModal}
                title="Close"
              >
                <FaTimes />
              </button>
            </div>

            <div className="history-modal-body">
              {selectedPrediction.forecast_plot ? (
                <img
                  src={`data:image/png;base64,${selectedPrediction.forecast_plot}`}
                  alt="Forecast Plot"
                  className="history-modal-plot"
                />
              ) : (
                <div className="text-white-50 text-center">
                  No plot available for this prediction.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default PredictionHistory;