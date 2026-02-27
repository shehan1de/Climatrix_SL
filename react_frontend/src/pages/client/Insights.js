import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import logo from "../../assets/logo.png";
import Footer from "../../components/Footer";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import {
  FaExclamationTriangle,
  FaFileCsv,
  FaFilter,
  FaSyncAlt
} from "react-icons/fa";

const safeText = (v) => (v === null || v === undefined || v === "" ? "—" : String(v));

const prettyParam = (param) => {
  if (param === "rain_sum") return "Rainfall";
  if (param === "windspeed_10m_max") return "Wind Speed";
  if (param === "windgusts_10m_max") return "Wind Gusts";
  return param;
};

const paramUnit = (param) => {
  if (param === "rain_sum" || String(param).toLowerCase().includes("rain")) return "mm";
  if (param === "windspeed_10m_max" || String(param).toLowerCase().includes("wind speed")) return "km/h";
  if (param === "windgusts_10m_max" || String(param).toLowerCase().includes("gust")) return "km/h";
  return "";
};

const formatDateTime = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
};

const toDayKey = (iso) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Unknown";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const toWeekKey = (iso) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Unknown";
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  const weekStart = new Date(d);
  weekStart.setDate(d.getDate() + diff);
  return toDayKey(weekStart.toISOString());
};

const normalizeRisk = (r) => {
  const t = String(r || "").toLowerCase();
  if (t.includes("high")) return "High Risk";
  if (t.includes("moderate")) return "Moderate Risk";
  return "Low Risk";
};

const Sparkline = ({ data = [], width = 110, height = 28 }) => {
  if (!Array.isArray(data) || data.length < 2) return <span className="text-white-50">—</span>;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;

  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * (width - 2) + 1;
    const y = height - 1 - ((v - min) / span) * (height - 2);
    return [x, y];
  });

  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(" ");
  return (
    <svg width={width} height={height} className="ins-spark">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.8" opacity="0.9" />
    </svg>
  );
};

const InsightsTrends = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?.userId;

  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ type: "", message: "" });

  const [datePreset, setDatePreset] = useState("30");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [paramFilter, setParamFilter] = useState("all");
  const [timeframeFilter, setTimeframeFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");

  useEffect(() => {
    if (!alert.message) return;
    const t = setTimeout(() => setAlert({ type: "", message: "" }), 3000);
    return () => clearTimeout(t);
  }, [alert]);

  const fetchPredictions = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:5001/api/predictions/user/${userId}`);
      setPredictions(res.data || []);
    } catch (e) {
      console.error(e);
      setAlert({ type: "error", message: "Failed to fetch predictions" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPredictions();
  }, [userId]);

  const cityOptions = useMemo(() => {
    const set = new Set(predictions.map((p) => p.city).filter(Boolean));
    return ["all", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [predictions]);

  const paramOptions = useMemo(() => {
    const set = new Set(predictions.map((p) => p.parameter).filter(Boolean));
    return ["all", ...Array.from(set)];
  }, [predictions]);

  const dateRange = useMemo(() => {
    const now = new Date();
    if (datePreset === "custom") {
      const from = fromDate ? new Date(fromDate + "T00:00:00") : null;
      const to = toDate ? new Date(toDate + "T23:59:59") : null;
      return { from, to };
    }
    if (datePreset === "all") return { from: null, to: null };

    const days = Number(datePreset);
    const from = new Date(now);
    from.setDate(now.getDate() - days);
    return { from, to: now };
  }, [datePreset, fromDate, toDate]);

  const filtered = useMemo(() => {
    const { from, to } = dateRange;

    return predictions.filter((p) => {
      const created = p.createdAt ? new Date(p.createdAt) : null;
      const createdMs = created && !Number.isNaN(created.getTime()) ? created.getTime() : null;

      const inDate =
        (!from || (createdMs !== null && createdMs >= from.getTime())) &&
        (!to || (createdMs !== null && createdMs <= to.getTime()));

      const inCity = cityFilter === "all" || p.city === cityFilter;
      const inParam = paramFilter === "all" || p.parameter === paramFilter;
      const inTimeframe = timeframeFilter === "all" || p.timeframe === timeframeFilter;
      const inRisk = riskFilter === "all" || normalizeRisk(p.disaster_risk) === riskFilter;

      return inDate && inCity && inParam && inTimeframe && inRisk;
    });
  }, [predictions, dateRange, cityFilter, paramFilter, timeframeFilter, riskFilter]);

  const kpis = useMemo(() => {
    const total = filtered.length;

    const latest = [...filtered].sort((a, b) => {
      const da = new Date(a.createdAt || 0).getTime();
      const db = new Date(b.createdAt || 0).getTime();
      return db - da;
    })[0];

    const highCount = filtered.filter((p) => normalizeRisk(p.disaster_risk) === "High Risk").length;

    const cityCounts = {};
    const paramCounts = {};
    filtered.forEach((p) => {
      if (p.city) cityCounts[p.city] = (cityCounts[p.city] || 0) + 1;
      if (p.parameter) paramCounts[p.parameter] = (paramCounts[p.parameter] || 0) + 1;
    });

    const mostCity = Object.entries(cityCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";
    const mostParam = Object.entries(paramCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

    return {
      total,
      latest,
      highCount,
      mostCity,
      mostParam
    };
  }, [filtered]);

  const valueOverTime = useMemo(() => {
    const bucket = {};
    filtered.forEach((p) => {
      if (!p.createdAt) return;
      const key = toDayKey(p.createdAt);
      const val = Number(p.predicted_value);
      if (Number.isNaN(val)) return;

      if (!bucket[key]) bucket[key] = { key, sum: 0, n: 0 };
      bucket[key].sum += val;
      bucket[key].n += 1;
    });

    return Object.values(bucket)
      .map((b) => ({
        date: b.key,
        avgValue: Number((b.sum / b.n).toFixed(2))
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filtered]);

  const riskWeekly = useMemo(() => {
    const bucket = {};
    filtered.forEach((p) => {
      if (!p.createdAt) return;
      const key = toWeekKey(p.createdAt);
      const r = normalizeRisk(p.disaster_risk);
      if (!bucket[key]) bucket[key] = { week: key, low: 0, moderate: 0, high: 0 };
      if (r === "High Risk") bucket[key].high += 1;
      else if (r === "Moderate Risk") bucket[key].moderate += 1;
      else bucket[key].low += 1;
    });

    return Object.values(bucket).sort((a, b) => a.week.localeCompare(b.week));
  }, [filtered]);

  const countByTimeframe = useMemo(() => {
    const counts = { day: 0, week: 0, month: 0, unknown: 0 };
    filtered.forEach((p) => {
      const tf = String(p.timeframe || "").toLowerCase();
      if (tf === "day") counts.day += 1;
      else if (tf === "week") counts.week += 1;
      else if (tf === "month") counts.month += 1;
      else counts.unknown += 1;
    });

    return [
      { name: "Day", value: counts.day },
      { name: "Week", value: counts.week },
      { name: "Month", value: counts.month }
    ];
  }, [filtered]);

  const insightsText = useMemo(() => {
    if (filtered.length === 0) return [];

    const highByCity = {};
    filtered.forEach((p) => {
      if (!p.city) return;
      if (normalizeRisk(p.disaster_risk) !== "High Risk") return;
      highByCity[p.city] = (highByCity[p.city] || 0) + 1;
    });
    const mostRiskyCity = Object.entries(highByCity).sort((a, b) => b[1] - a[1])[0]?.[0];

    const sumByCity = {};
    filtered.forEach((p) => {
      if (!p.city) return;
      const v = Number(p.predicted_value);
      if (Number.isNaN(v)) return;
      if (!sumByCity[p.city]) sumByCity[p.city] = { sum: 0, n: 0 };
      sumByCity[p.city].sum += v;
      sumByCity[p.city].n += 1;
    });
    const bestCity = Object.entries(sumByCity)
      .map(([city, s]) => ({ city, avg: s.sum / s.n }))
      .sort((a, b) => b.avg - a.avg)[0];

    const riskByParam = {};
    filtered.forEach((p) => {
      if (!p.parameter) return;
      const r = normalizeRisk(p.disaster_risk);
      if (!riskByParam[p.parameter]) riskByParam[p.parameter] = { modHigh: 0, total: 0 };
      riskByParam[p.parameter].total += 1;
      if (r !== "Low Risk") riskByParam[p.parameter].modHigh += 1;
    });
    const riskiestParam = Object.entries(riskByParam)
      .map(([param, s]) => ({ param, rate: s.total ? s.modHigh / s.total : 0 }))
      .sort((a, b) => b.rate - a.rate)[0];

    const lines = [];
    if (mostRiskyCity) lines.push(`${mostRiskyCity} recorded the most High Risk predictions in the selected range.`);
    if (bestCity) lines.push(`${bestCity.city} shows the highest average predicted value (${bestCity.avg.toFixed(2)}).`);
    if (riskiestParam) lines.push(`${prettyParam(riskiestParam.param)} has the highest Moderate/High risk rate.`);
    return lines;
  }, [filtered]);

  const downloadCSV = () => {
    try {
      const rows = [
        ["City", "Parameter", "Timeframe", "Mode", "Value", "Unit", "Risk", "Predicted At"],
        ...filtered.map((p) => [
          safeText(p.city),
          safeText(prettyParam(p.parameter)),
          safeText(p.timeframe),
          safeText(p.min_or_max),
          safeText(p.predicted_value),
          safeText(paramUnit(p.parameter)),
          safeText(normalizeRisk(p.disaster_risk)),
          safeText(formatDateTime(p.createdAt))
        ])
      ];

      const csv = rows
        .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
        .join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ClimatrixSL_Insights_${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      setAlert({ type: "error", message: "CSV download failed" });
    }
  };

  const highRiskAlerts = useMemo(() => {
    return [...filtered]
      .filter((p) => normalizeRisk(p.disaster_risk) === "High Risk")
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 6);
  }, [filtered]);

  return (
    <div className="ins-page d-flex flex-column">
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

      <div className="ins-container flex-grow-1">
        <div className="ins-hero glass-panel">
          <div className="ins-hero-left">
            <h1 className="ins-title">
              <span className="brand-gradient">Insights & Trends</span>
            </h1>
            <div className="ins-sub text-white-50">
              Explore patterns from your prediction history using filters, charts, and risk analytics
            </div>
          </div>

          <div className="ins-hero-actions">
            <button className="btn btn-outline-light ins-icon-btn" onClick={fetchPredictions} title="Refresh">
              <FaSyncAlt />
            </button>
            <button className="btn btn-outline-light ins-icon-btn" onClick={downloadCSV} title="Download CSV">
              <FaFileCsv />
            </button>
          </div>
        </div>

        <div className="ins-filters glass-panel">
          <div className="ins-filters-title">
            <FaFilter className="me-2" />
            Filters
          </div>

          <div className="ins-filters-grid">
            <div>
              <label className="ins-label">Date Range</label>
              <select
                className="form-control glass-input glass-select"
                value={datePreset}
                onChange={(e) => setDatePreset(e.target.value)}
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="all">All time</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            {datePreset === "custom" && (
              <>
                <div>
                  <label className="ins-label">From</label>
                  <input
                    type="date"
                    className="form-control glass-input"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="ins-label">To</label>
                  <input
                    type="date"
                    className="form-control glass-input"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                  />
                </div>
              </>
            )}

            <div>
              <label className="ins-label">City</label>
              <select
                className="form-control glass-input glass-select"
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
              >
                {cityOptions.map((c) => (
                  <option key={c} value={c}>
                    {c === "all" ? "All Cities" : c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="ins-label">Parameter</label>
              <select
                className="form-control glass-input glass-select"
                value={paramFilter}
                onChange={(e) => setParamFilter(e.target.value)}
              >
                {paramOptions.map((p) => (
                  <option key={p} value={p}>
                    {p === "all" ? "All Parameters" : prettyParam(p)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="ins-label">Timeframe</label>
              <select
                className="form-control glass-input glass-select"
                value={timeframeFilter}
                onChange={(e) => setTimeframeFilter(e.target.value)}
              >
                <option value="all">All</option>
                <option value="day">Day</option>
                <option value="week">Week</option>
                <option value="month">Month</option>
              </select>
            </div>

            <div>
              <label className="ins-label">Risk</label>
              <select
                className="form-control glass-input glass-select"
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
              >
                <option value="all">All</option>
                <option value="Low Risk">Low</option>
                <option value="Moderate Risk">Moderate</option>
                <option value="High Risk">High</option>
              </select>
            </div>
          </div>

          <div className="ins-count text-white-50">
            Results <strong className="text-white">{filtered.length}</strong>
          </div>
        </div>
        <div className="ins-kpi-grid">
          <div className="ins-kpi glass-panel">
            <div className="ins-kpi-label">Total predictions</div>
            <div className="ins-kpi-value">{kpis.total}</div>
          </div>

          <div className="ins-kpi glass-panel">
            <div className="ins-kpi-label">High risk count</div>
            <div className="ins-kpi-value">{kpis.highCount}</div>
          </div>

          <div className="ins-kpi glass-panel">
            <div className="ins-kpi-label">Most predicted city</div>
            <div className="ins-kpi-value">{safeText(kpis.mostCity)}</div>
          </div>

          <div className="ins-kpi glass-panel">
            <div className="ins-kpi-label">Most predicted parameter</div>
            <div className="ins-kpi-value">{safeText(prettyParam(kpis.mostParam))}</div>
          </div>
        </div>

        <div className="ins-main-grid">
          <div className="ins-charts">
            <div className="glass-panel ins-chart-card">
              <div className="ins-card-title">Predicted value over time (daily average)</div>
              {valueOverTime.length === 0 ? (
                <div className="text-white-50 ins-empty">No chart data for selected filters.</div>
              ) : (
                <div className="ins-chart-wrap">
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={valueOverTime}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis dataKey="date" tick={{ fill: "#cfcfcf", fontSize: 11 }} />
                      <YAxis tick={{ fill: "#cfcfcf", fontSize: 11 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="avgValue" strokeWidth={2.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="glass-panel ins-chart-card">
              <div className="ins-card-title">Risk distribution (weekly)</div>
              {riskWeekly.length === 0 ? (
                <div className="text-white-50 ins-empty">No chart data for selected filters.</div>
              ) : (
                <div className="ins-chart-wrap">
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={riskWeekly}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis dataKey="week" tick={{ fill: "#cfcfcf", fontSize: 11 }} />
                      <YAxis tick={{ fill: "#cfcfcf", fontSize: 11 }} />
                      <Tooltip />
                      <Legend />
                      
                      <Bar dataKey="low" stackId="a" fill="#3ddc84" />
                      <Bar dataKey="moderate" stackId="a" fill="#ffd166" />
                      <Bar dataKey="high" stackId="a" fill="#ff4d4d" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="glass-panel ins-chart-card">
              <div className="ins-card-title">Predictions by timeframe</div>
              <div className="ins-chart-wrap">
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={countByTimeframe}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="name" tick={{ fill: "#cfcfcf", fontSize: 11 }} />
                    <YAxis tick={{ fill: "#cfcfcf", fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#00aeef" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          <div className="ins-side">
            <div className="glass-panel ins-side-card">
              <div className="ins-card-title">Smart insights</div>
              {insightsText.length === 0 ? (
                <div className="text-white-50 ins-empty">Generate more predictions to see insights.</div>
              ) : (
                <ul className="ins-bullets">
                  {insightsText.map((t, idx) => (
                    <li key={idx}>{t}</li>
                  ))}
                </ul>
              )}
            </div>

            <div className="glass-panel ins-side-card">
              <div className="ins-card-title">
                <FaExclamationTriangle className="me-2" />
                High risk alerts
              </div>

              {highRiskAlerts.length === 0 ? (
                <div className="text-white-50 ins-empty">No high risk alerts in the selected range.</div>
              ) : (
                <div className="ins-alerts">
                  {highRiskAlerts.map((p) => (
                    <div className="ins-alert-item" key={p._id}>
                      <div className="ins-alert-top">
                        <div className="ins-alert-title">
                          {p.city} • {prettyParam(p.parameter)}
                        </div>
                        <span className="ins-risk-pill ins-risk-high">High</span>
                      </div>
                      <div className="ins-alert-sub text-white-50">
                        {formatDateTime(p.createdAt)}
                      </div>
                      <div className="ins-alert-row">
                        <span className="ins-chip">{p.timeframe}</span>
                        <span className="ins-chip">{p.min_or_max}</span>
                        <span className="ins-chip ins-chip-strong">
                          {safeText(p.predicted_value)} {paramUnit(p.parameter)}
                        </span>
                      </div>
                      <div className="ins-alert-spark">
                        <Sparkline data={p.forecast_series || []} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="glass-panel ins-side-card">
              <div className="ins-card-title">Latest prediction</div>
              {!kpis.latest ? (
                <div className="text-white-50 ins-empty">No predictions yet.</div>
              ) : (
                <div className="ins-latest">
                  <div className="ins-latest-title">
                    {kpis.latest.city} • {prettyParam(kpis.latest.parameter)}
                  </div>
                  <div className="ins-latest-sub text-white-50">
                    {formatDateTime(kpis.latest.createdAt)}
                  </div>
                  <div className="ins-latest-row">
                    <span className="ins-chip">{kpis.latest.timeframe}</span>
                    <span className="ins-chip">{kpis.latest.min_or_max}</span>
                    <span className="ins-chip ins-chip-strong">
                      {safeText(kpis.latest.predicted_value)} {paramUnit(kpis.latest.parameter)}
                    </span>
                    <span className={`ins-risk-pill ${normalizeRisk(kpis.latest.disaster_risk) === "High Risk"
                      ? "ins-risk-high"
                      : normalizeRisk(kpis.latest.disaster_risk) === "Moderate Risk"
                        ? "ins-risk-moderate"
                        : "ins-risk-low"
                      }`}
                    >
                      {normalizeRisk(kpis.latest.disaster_risk).replace(" Risk", "")}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="glass-panel ins-table-card">
          <div className="ins-card-title">Key predictions (filtered)</div>

          {filtered.length === 0 ? (
            <div className="text-white-50 ins-empty">No data for selected filters.</div>
          ) : (
            <div className="ins-table-wrap">
              <table className="table table-dark table-borderless ins-table">
                <thead>
                  <tr>
                    <th>City</th>
                    <th>Parameter</th>
                    <th>Timeframe</th>
                    <th>Mode</th>
                    <th>Value</th>
                    <th>Risk</th>
                    <th>Predicted at</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 15).map((p) => (
                    <tr key={p._id}>
                      <td>{safeText(p.city)}</td>
                      <td>{prettyParam(p.parameter)}</td>
                      <td>{safeText(p.timeframe)}</td>
                      <td>{safeText(p.min_or_max)}</td>
                      <td>
                        {safeText(p.predicted_value)}{" "}
                        <span className="text-white-50">{paramUnit(p.parameter)}</span>
                      </td>
                      <td>
                        <span
                          className={`ins-risk-pill ${
                            normalizeRisk(p.disaster_risk) === "High Risk"
                              ? "ins-risk-high"
                              : normalizeRisk(p.disaster_risk) === "Moderate Risk"
                              ? "ins-risk-moderate"
                              : "ins-risk-low"
                          }`}
                        >
                          {normalizeRisk(p.disaster_risk).replace(" Risk", "")}
                        </span>
                      </td>
                      <td className="text-white-50">{formatDateTime(p.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filtered.length > 15 && (
                <div className="text-white-50 ins-table-note">
                  Showing 15 of {filtered.length}. Use filters to narrow results.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default InsightsTrends;