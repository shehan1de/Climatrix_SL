import axios from "axios";
import jsPDF from "jspdf";
import { useEffect, useState } from "react";
import { FaDownload } from "react-icons/fa";
import logo from "../../assets/logo.png";
import Footer from "../../components/Footer";

const CITY_OPTIONS = [
  "Athurugiriya","Badulla","Bentota","Colombo","Galle","Gampaha",
  "Hambantota","Hatton","Jaffna","Kalmunai","Kalutara","Kandy",
  "Kesbewa","Kolonnawa","Kurunegala","Mabole","Maharagama",
  "Mannar","Matale","Matara","Minuwangoda","Moratuwa",
  "Mount Lavinia","Negombo","Oruwala","Pothuhera",
  "Puttalam","Ratnapura","Sri Jayewardenepura Kotte",
  "Trincomalee","Weligama"
];

const API = axios.create({
  baseURL: "http://127.0.0.1:5000",
  headers: { "Content-Type": "application/json" }
});

const ClientPredictions = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?.userId;

  const [form, setForm] = useState({
    city: "",
    parameter: "rain_sum",
    timeframe: "week",
    min_or_max: "max"
  });

  const [alert, setAlert] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  // Alert timeout
  useEffect(() => {
    if (alert.message) {
      const timer = setTimeout(() => setAlert({ type: "", message: "" }), 3000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  // ---------- Helpers ----------
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

  const safeText = (v) => {
    if (v === null || v === undefined) return "—";
    return String(v);
  };

  // ✅ Unit helpers
  const getUnitByParameter = (param) => {
    const p = String(param || "").toLowerCase();

    if (p.includes("rain") || p === "rain_sum") return "mm";
    if (p.includes("gust") || p === "windgusts_10m_max") return "km/h";
    if (p.includes("wind") || p === "windspeed_10m_max") return "km/h";

    return "";
  };

  const formatPredictedValue = (value, param) => {
    const unit = getUnitByParameter(param);
    if (value === null || value === undefined) return "—";
    return unit ? `${value} ${unit}` : String(value);
  };

  const toDataUrl = (imgPath) =>
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
      img.src = imgPath;
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
      const accentBlue = [0, 174, 239];   // #00aeef
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
        doc.addImage(logoDataUrl, "PNG", pageW / 2 - logoW / 2, 24, logoW, logoH);
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

      // ✅ Predicted date/time from predictedAt
      const predictedTime = p.predictedAt || p.createdAt;

      const rows = [
        ["City", safeText(p.city)],
        ["Parameter", safeText(prettyParam(p.parameter))],
        ["Timeframe", safeText(p.timeframe)],
        ["Mode", safeText(p.min_or_max)],
        ["Value", safeText(formatPredictedValue(p.predicted_value, p.parameter))],
        ["Risk", safeText(p.disaster_risk)],
        ["Predicted Time", safeText(formatDateTime(predictedTime))]
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

        doc.addImage(imgData, "PNG", margin + 4, msgY + 4, pageW - margin * 2 - 8, plotH - 8);
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
      doc.save(`Climatrix_${safeCity}_${Date.now()}.pdf`);
    } catch (e) {
      console.error(e);
      setAlert({ type: "error", message: "PDF download failed. Check jspdf install." });
    }
  };

  // ---------- Predict ----------
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!userId) {
      setAlert({ type: "error", message: "User not logged in" });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const payload = { ...form, userId };
      const res = await API.post("/predict", payload);

      // ✅ attach predicted time here
      setAlert({ type: "success", message: "Prediction generated!" });
      setResult({
        ...res.data,
        predictedAt: new Date().toISOString()
      });

      setForm((prev) => ({ ...prev, city: "" }));
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.error || "Failed to generate prediction";
      setAlert({ type: "error", message: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pred-page d-flex flex-column">
      {alert.message && (
        <div className={`login-alert ${alert.type === "error" ? "login-alert-error" : "login-alert-success"}`}>
          {alert.message}
        </div>
      )}

      {loading && (
        <div className="loading-overlay">
          <img src={logo} alt="Loading..." className="spinner-logo-large" />
        </div>
      )}

      <div className="pred-container flex-grow-1">
        <div className="pred-hero text-center text-white">
          <h1 className="pred-title">
            <span className="brand-gradient">Generate Prediction</span>
          </h1>
        </div>

        <div className="pred-grid-single">
          {/* FORM */}
          <div className="pred-glass-card text-white">
            <h4 className="fw-bold mb-3">Prediction Form</h4>

            <form onSubmit={handleSubmit}>
              <label className="pred-label">City</label>
              <select
                className="form-control glass-input glass-select mb-3"
                required
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              >
                <option value="" disabled>Select a city</option>
                {CITY_OPTIONS.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>

              <label className="pred-label">Parameter</label>
              <select
                className="form-control glass-input glass-select mb-3"
                value={form.parameter}
                onChange={(e) => setForm({ ...form, parameter: e.target.value })}
              >
                <option value="rain_sum">Rainfall</option>
                <option value="windspeed_10m_max">Wind Speed</option>
                <option value="windgusts_10m_max">Wind Gusts</option>
              </select>

              <label className="pred-label">Timeframe</label>
              <select
                className="form-control glass-input glass-select mb-3"
                value={form.timeframe}
                onChange={(e) => setForm({ ...form, timeframe: e.target.value })}
              >
                <option value="day">Day</option>
                <option value="week">Week</option>
                <option value="month">Month</option>
              </select>

              <label className="pred-label">Mode</label>
              <select
                className="form-control glass-input glass-select mb-3"
                value={form.min_or_max}
                onChange={(e) => setForm({ ...form, min_or_max: e.target.value })}
              >
                <option value="max">Maximum</option>
                <option value="min">Minimum</option>
              </select>

              <button className="btn btn-green-custom w-100 py-2" type="submit">
                Generate Prediction
              </button>
            </form>
          </div>

          {/* RESULT */}
          <div className="pred-glass-card text-white">
            <h4 className="fw-bold mb-3">Prediction Result</h4>

            {!result ? (
              <p className="text-white-50 mb-0 text-center">
                No result yet. Generate a prediction to see output here.
              </p>
            ) : (
              <>
                <div className="pred-result-box">
                  <div className="pred-result-row">
                    <span className="pred-result-label">City</span>
                    <span className="pred-result-value">{result.city}</span>
                  </div>

                  <div className="pred-result-row">
                    <span className="pred-result-label">Parameter</span>
                    <span className="pred-result-value">{prettyParam(result.parameter)}</span>
                  </div>

                  <div className="pred-result-row">
                    <span className="pred-result-label">Timeframe</span>
                    <span className="pred-result-value">{result.timeframe}</span>
                  </div>

                  <div className="pred-result-row">
                    <span className="pred-result-label">Mode</span>
                    <span className="pred-result-value">{result.min_or_max}</span>
                  </div>

                  {/* ✅ Value + Unit */}
                  <div className="pred-result-row">
                    <span className="pred-result-label">Predicted Value</span>
                    <span className="pred-result-value fw-bold">
                      {formatPredictedValue(result.predicted_value, result.parameter)}
                    </span>
                  </div>

                  <div className="pred-result-row">
                    <span className="pred-result-label">Risk</span>
                    <span className="pred-risk-chip">{result.disaster_risk}</span>
                  </div>

                  {result.forecast_message && (
                    <div className="pred-message mt-3">
                      <strong>Message</strong>
                      <div className="text-white-50">{result.forecast_message}</div>
                    </div>
                  )}
                </div>

                {/* ✅ PDF button */}
                <button
                  type="button"
                  className="btn btn-outline-light w-100 mt-3"
                  onClick={() => downloadPredictionPDF(result)}
                >
                  <FaDownload className="me-2" />
                  Download PDF Report
                </button>

                {/* ✅ Plot under PDF button */}
                {result.forecast_plot && (
                  <div className="mt-3 text-center">
                    <img
                      src={`data:image/png;base64,${result.forecast_plot}`}
                      alt="Forecast Plot"
                      className="pred-plot-img"
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ClientPredictions;