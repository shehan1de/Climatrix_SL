import axios from "axios";
import jsPDF from "jspdf";
import { useEffect, useMemo, useState } from "react";
import { FaChartBar, FaDownload, FaSyncAlt, FaTimes } from "react-icons/fa";
import logo from "../../assets/logo.png";
import Footer from "../../components/Footer";

const PredictionHistory = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?.userId;

  const [predictions, setPredictions] = useState([]);
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

  // Fetch user predictions
  const fetchPredictions = async () => {
    if (!userId) return;
    setLoading(true);

    try {
      const res = await axios.get(
        `http://localhost:5001/api/predictions/user/${userId}`
      );
      setPredictions(res.data || []);
    } catch (err) {
      console.error(err);
      setAlert({ type: "error", message: "Failed to fetch prediction history" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPredictions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // helper: pretty labels
  const prettyParam = (param) => {
    if (param === "rain_sum") return "Rainfall";
    if (param === "windspeed_10m_max") return "Wind Speed";
    if (param === "windgusts_10m_max") return "Wind Gusts";
    return param; // already friendly on backend
  };

  const formatDateTime = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString();
  };

  const riskClass = (riskText) =>
    `risk-${String(riskText || "")
      .toLowerCase()
      .replace(/\s+/g, "-")}`;

  // ✅ Units
  const getUnitByParameter = (param) => {
    const p = String(param || "").toLowerCase();

    // backend may store "Rainfall" OR "rain_sum"
    if (p.includes("rain") || p === "rain_sum") return "mm";

    // wind speed / gust
    if (p.includes("gust") || p === "windgusts_10m_max") return "km/h";
    if (p.includes("wind") || p === "windspeed_10m_max") return "km/h";

    return "";
  };

  const formatPredictedValue = (value, param) => {
    if (value === null || value === undefined || value === "") return "—";
    const unit = getUnitByParameter(param);
    return unit ? `${value} ${unit}` : String(value);
  };

  // Filter + sort list
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    const list = predictions.filter((p) => {
      const matchesSearch =
        !q ||
        `${p.city} ${p.parameter} ${p.disaster_risk}`
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
  }, [predictions, search, timeframeFilter, riskFilter, sortOrder]);

  // ===== PDF helpers =====
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

  // ===== Branded PDF download (no colons) =====
  const downloadPredictionPDF = async (p) => {
    try {
      const doc = new jsPDF("p", "mm", "a4");

      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 14;

      // Theme colors
      const darkBg = [8, 10, 12];
      const accentBlue = [0, 174, 239]; // #00aeef
      const accentGreen = [164, 198, 57]; // #a4c639
      const softWhite = [235, 235, 235];

      // Background
      doc.setFillColor(...darkBg);
      doc.rect(0, 0, pageW, pageH, "F");

      // Top bar (approx gradient)
      doc.setFillColor(...accentBlue);
      doc.rect(0, 0, pageW * 0.55, 18, "F");
      doc.setFillColor(...accentGreen);
      doc.rect(pageW * 0.55, 0, pageW * 0.45, 18, "F");

      // Logo center (optional)
      let logoDataUrl = null;
      try {
        logoDataUrl = await toDataUrl(logo);
      } catch {
        logoDataUrl = null;
      }

      if (logoDataUrl) {
        const logoW = 18;
        const logoH = 18;
        doc.addImage(
          logoDataUrl,
          "PNG",
          pageW / 2 - logoW / 2,
          24,
          logoW,
          logoH
        );
      }

      // Title
      doc.setTextColor(...softWhite);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("CLIMATRIX SL", pageW / 2, 50, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(185, 185, 185);
      doc.text("Prediction Report", pageW / 2, 56, { align: "center" });

      // Glass card box
      const cardX = margin;
      const cardY = 64;
      const cardW = pageW - margin * 2;
      const cardH = 86;

      doc.setFillColor(255, 255, 255, 0.06);
      doc.rect(cardX, cardY, cardW, cardH, "F");
      doc.setDrawColor(255, 255, 255);
      doc.setLineWidth(0.2);
      doc.rect(cardX, cardY, cardW, cardH, "S");

      // Label/value layout (NO colons)
      const labelX = cardX + 10;
      const valueX = cardX + 55;
      let y = cardY + 16;

      const rows = [
        ["City", safeText(p.city)],
        ["Parameter", safeText(prettyParam(p.parameter))],
        ["Timeframe", safeText(p.timeframe)],
        ["Mode", safeText(p.min_or_max)],
        // ✅ Value + unit
        ["Value", safeText(formatPredictedValue(p.predicted_value, p.parameter))],
        ["Risk", safeText(p.disaster_risk)],
        ["Date", safeText(formatDateTime(p.createdAt))]
      ];

      doc.setFontSize(11);

      rows.forEach(([label, value]) => {
        doc.setTextColor(200, 200, 200);
        doc.setFont("helvetica", "bold");
        doc.text(label, labelX, y);

        doc.setTextColor(240, 240, 240);
        doc.setFont("helvetica", "normal");
        doc.text(value, valueX, y);

        y += 8;
      });

      // Summary
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

      // Plot (optional)
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

        doc.addImage(
          imgData,
          "PNG",
          margin + 4,
          msgY + 4,
          pageW - margin * 2 - 8,
          plotH - 8
        );
      }

      // Footer
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(160, 160, 160);
      doc.text(
        "Generated by ClimatrixSL • Data-driven climate insights",
        pageW / 2,
        pageH - 10,
        { align: "center" }
      );

      const safeCity = String(p.city || "prediction").replace(/\s+/g, "_");
      doc.save(`ClimatrixSL_${safeCity}_${Date.now()}.pdf`);
    } catch (e) {
      console.error(e);
      setAlert({
        type: "error",
        message: "PDF download failed. Make sure jspdf is installed."
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
            <span className="brand-gradient">Prediction History</span>
          </h1>
        </div>

        {/* Controls */}
        <div className="history-controls glass-panel">
          <div className="history-controls-row">
            <input
              className="form-control glass-input history-search"
              placeholder="Search by city, parameter, or risk..."
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

            {/* Sort */}
            <select
              className="form-control glass-input glass-select history-select"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              title="Sort"
            >
              <option value="latest">Latest</option>
              <option value="oldest">Oldest</option>
            </select>

            {/* Refresh icon */}
            <button
              className="btn btn-outline-light history-refresh icon-btn"
              type="button"
              onClick={fetchPredictions}
              title="Refresh"
            >
              <FaSyncAlt />
            </button>
          </div>

          <div className="history-count text-white-50">
            Showing <strong className="text-white">{filtered.length}</strong>{" "}
            results
          </div>
        </div>

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div className="glass-panel history-empty text-center text-white">
            <h5 className="fw-bold mb-2">No predictions found</h5>
            <p className="text-white-50 mb-0">
              Try changing filters or generate a new prediction.
            </p>
          </div>
        )}

        {/* Cards */}
        <div className="history-grid">
          {filtered.map((p) => (
            <div key={p._id} className="history-card">
              <div className="history-card-top">
                <div>
                  <h5 className="history-card-title">
                    {p.city} • {prettyParam(p.parameter)}
                  </h5>

                  <div className="history-card-meta">
                    <span className="chip">{p.timeframe}</span>
                    <span className="chip">{p.min_or_max}</span>

                    {/* ✅ Value + unit */}
                    <span className="chip chip-strong">
                      Value {formatPredictedValue(p.predicted_value, p.parameter)}
                    </span>

                    <span className="chip chip-date">
                      {formatDateTime(p.createdAt)}
                    </span>
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

              {/* Icon actions */}
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
          ))}
        </div>
      </div>

      {/* Plot modal (glass) */}
      {showPlot && selectedPrediction && (
        <div className="history-modal-overlay" onClick={closePlotModal}>
          <div
            className="history-modal-glass"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="history-modal-header">
              <div>
                <div className="history-modal-title">
                  {selectedPrediction.city} •{" "}
                  {prettyParam(selectedPrediction.parameter)}
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