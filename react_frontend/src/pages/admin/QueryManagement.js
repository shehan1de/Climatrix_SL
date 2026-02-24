import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { FaEnvelope, FaEye, FaReply, FaSyncAlt, FaTimes } from "react-icons/fa";

// ✅ If your services/api.js already exists, you can use that instead.
// But keeping this component self-contained like your current code.
const API_BASE = "http://localhost:5001";

// ✅ Backend is mounted as app.use("/api", adminQueryRoutes)
// So admin endpoints are /api/admin/queries...
const API = axios.create({
  baseURL: API_BASE,
});

const toDateTime = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
};

const QueryManagement = () => {
  // auth (admin)
  const stored = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  }, []);
  const adminId = stored?.userId;

  // data
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(false);

  // alert UI
  const [alert, setAlert] = useState({ type: "", message: "" });

  // filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All"); // All | Pending | Resolved
  const [sortOrder, setSortOrder] = useState("latest"); // latest | oldest

  // reply modal
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyTarget, setReplyTarget] = useState(null);
  const [replyForm, setReplyForm] = useState({
    subject: "",
    replyMessage: "",
  });
  const [sending, setSending] = useState(false);

  // view answer modal
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewTarget, setViewTarget] = useState(null);

  // auto hide alert
  useEffect(() => {
    if (alert.message) {
      const timer = setTimeout(() => setAlert({ type: "", message: "" }), 3000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  const setErr = (message) => setAlert({ type: "error", message });
  const setOk = (message) => setAlert({ type: "success", message });

  // =========================
  // Fetch queries
  // =========================
  const fetchQueries = async () => {
    setLoading(true);
    try {
      // ✅ Correct route
      const res = await API.get("/api/admin/queries");

      const arr = Array.isArray(res.data?.queries) ? res.data.queries : [];
      setQueries(arr);
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load queries");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminId]);

  // =========================
  // Filtered list
  // =========================
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    const list = queries
      .filter((x) => {
        if (statusFilter === "All") return true;
        return String(x.status || "") === statusFilter;
      })
      .filter((x) => {
        if (!q) return true;
        const hay =
          `${x.queryId} ${x.name} ${x.email} ${x.message} ${x.status} ${
            x.replyMessage || ""
          }`.toLowerCase();
        return hay.includes(q);
      });

    list.sort((a, b) => {
      const da = new Date(a.createdAt || 0).getTime();
      const db = new Date(b.createdAt || 0).getTime();
      return sortOrder === "latest" ? db - da : da - db;
    });

    return list;
  }, [queries, search, statusFilter, sortOrder]);

  const counts = useMemo(() => {
    const pending = queries.filter((q) => q.status === "Pending").length;
    const resolved = queries.filter((q) => q.status === "Resolved").length;
    return { pending, resolved, total: queries.length };
  }, [queries]);

  // =========================
  // Reply modal handlers
  // =========================
  const openReply = (q) => {
    setReplyTarget(q);
    setReplyForm({
      subject: `Re: ${q?.queryId || "Climatrix SL Support"}`,
      replyMessage: "",
    });
    setShowReplyModal(true);
  };

  const closeReply = () => {
    setShowReplyModal(false);
    setReplyTarget(null);
    setReplyForm({ subject: "", replyMessage: "" });
  };

  const submitReply = async () => {
    if (!replyTarget?._id) return;

    const msg = String(replyForm.replyMessage || "").trim();
    if (!msg) return setErr("Reply message is required");

    setSending(true);
    try {
      // ✅ Correct route
      await API.post(`/api/admin/queries/${replyTarget._id}/reply`, {
        subject: replyForm.subject,
        replyMessage: msg,
        repliedBy: adminId, // optional
      });

      setOk("Reply sent and query marked as resolved");
      closeReply();
      fetchQueries();
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to send reply");
    } finally {
      setSending(false);
    }
  };

  // =========================
  // View answer modal handlers
  // =========================
  const openView = (q) => {
    setViewTarget(q);
    setShowViewModal(true);
  };

  const closeView = () => {
    setShowViewModal(false);
    setViewTarget(null);
  };

  const statusChipClass = (s) => (s === "Resolved" ? "chip chip-strong" : "chip");

  return (
    <div className="history-page">
      {/* Alert */}
      {alert.message && (
        <div
          className={`login-alert ${
            alert.type === "error" ? "login-alert-error" : "login-alert-success"
          }`}
        >
          {alert.message}
        </div>
      )}

      {/* Loading overlay */}
      {loading && (
        <div className="loading-overlay">
          <div className="spinner-border text-light" role="status" />
        </div>
      )}

      <div className="history-container">
        {/* HERO */}
        <div className="history-hero">
          <h1 className="history-title">
            <span className="brand-gradient">Query</span> Management
          </h1>
          

          <div className="text-white-50" style={{ marginTop: 8 }}>
            Total <b className="text-white">{counts.total}</b> • Pending{" "}
            <b className="text-white">{counts.pending}</b> • Resolved{" "}
            <b className="text-white">{counts.resolved}</b>
          </div>
        </div>

        {/* CONTROLS */}
        <div className="glass-panel history-controls">
          <div
            className="history-controls-row"
            style={{ gridTemplateColumns: "1.2fr 0.7fr 0.6fr 0.35fr" }}
          >
            <input
              className="form-control glass-input history-search"
              placeholder="Search by id, name, email, status, message..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              className="form-select glass-select history-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              title="Status filter"
            >
              <option value="All">All</option>
              <option value="Pending">Pending</option>
              <option value="Resolved">Resolved</option>
            </select>

            <select
              className="form-select glass-select history-select"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              title="Sort"
            >
              <option value="latest">Latest</option>
              <option value="oldest">Oldest</option>
            </select>

            <button
              className="btn btn-outline-light history-refresh icon-btn"
              onClick={fetchQueries}
              disabled={loading}
              title="Refresh"
              type="button"
            >
              <FaSyncAlt />
            </button>
          </div>

          <div className="history-count text-white-50">
            Showing <b>{filtered.length}</b> of <b>{queries.length}</b> queries
          </div>
        </div>

        {/* TABLE */}
        <div className="glass-panel mt-3">
          <div className="ins-card-title">All Queries</div>

          <div className="ins-table-wrap">
            <table className="table table-dark table-hover mb-0 ins-table">
              <thead>
                <tr>
                  <th style={{ width: 110 }}>Query ID</th>
                  <th style={{ width: 160 }}>Name</th>
                  <th style={{ width: 210 }}>Email</th>
                  <th>Message</th>
                  <th style={{ width: 110 }}>Status</th>
                  <th style={{ width: 160 }}>Submitted</th>
                  <th style={{ width: 160 }}>Answered</th>
                  <th style={{ width: 150 }}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {!loading && filtered.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center text-white-50 py-4">
                      No queries found (for current filters)
                    </td>
                  </tr>
                ) : (
                  filtered.map((q) => (
                    <tr key={q._id}>
                      <td>{q.queryId}</td>
                      <td>{q.name}</td>
                      <td>{q.email}</td>
                      <td style={{ maxWidth: 520 }}>
                        <div
                          style={{
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            maxWidth: 520,
                          }}
                          title={q.message}
                        >
                          {q.message}
                        </div>
                      </td>
                      <td>
                        <span className={statusChipClass(q.status)}>
                          {q.status}
                        </span>
                      </td>
                      <td>{toDateTime(q.createdAt)}</td>
                      <td>
                        {q.status === "Resolved" ? toDateTime(q.repliedAt) : "—"}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 10 }}>
                          {/* Reply */}
                          <button
                            className="icon-action-btn"
                            title="Reply"
                            type="button"
                            onClick={() => openReply(q)}
                          >
                            <FaReply />
                          </button>

                          {/* View Answer */}
                          <button
                            className="icon-action-btn"
                            title="View Answer"
                            type="button"
                            disabled={q.status !== "Resolved"}
                            onClick={() => openView(q)}
                          >
                            <FaEye />
                          </button>

                          {/* Email Icon */}
                          <button
                            className="icon-action-btn"
                            title="Email"
                            type="button"
                            onClick={() => openReply(q)}
                          >
                            <FaEnvelope />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="ins-table-note text-white-50">
            Pending queries can be replied to via email. Once replied, they are
            marked as <b>Resolved</b> and the answer is saved.
          </div>
        </div>
      </div>

      {/* REPLY MODAL */}
      {showReplyModal && replyTarget && (
        <div className="modal d-block logout-overlay">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content logout-glass-card text-white">
              <div className="modal-header border-0">
                <h5 className="modal-title fw-bold">
                  Reply to {replyTarget.queryId}
                </h5>

                <button
                  className="btn btn-link text-white"
                  onClick={closeReply}
                  style={{ textDecoration: "none" }}
                  aria-label="Close"
                  type="button"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="modal-body">
                <div className="text-white-50" style={{ fontSize: 13 }}>
                  <div>
                    <b>User</b> {replyTarget.name} ({replyTarget.email})
                  </div>
                  <div className="mt-1">
                    <b>Submitted</b> {toDateTime(replyTarget.createdAt)}
                  </div>
                </div>

                <div className="mt-3">
                  <div className="ins-label">User Message</div>
                  <div
                    style={{
                      whiteSpace: "pre-wrap",
                      background: "rgba(0,0,0,0.22)",
                      border: "1px solid rgba(255,255,255,0.10)",
                      borderRadius: 14,
                      padding: 12,
                    }}
                  >
                    {replyTarget.message}
                  </div>
                </div>

                <div className="mt-3">
                  <label className="ins-label">Subject (optional)</label>
                  <input
                    className="form-control glass-input"
                    value={replyForm.subject}
                    onChange={(e) =>
                      setReplyForm((p) => ({ ...p, subject: e.target.value }))
                    }
                    placeholder="Subject"
                  />
                </div>

                <div className="mt-3">
                  <label className="ins-label">Reply Message</label>
                  <textarea
                    className="form-control glass-input"
                    rows={6}
                    value={replyForm.replyMessage}
                    onChange={(e) =>
                      setReplyForm((p) => ({
                        ...p,
                        replyMessage: e.target.value,
                      }))
                    }
                    placeholder="Type your reply..."
                  />
                </div>

                <div className="text-white-50 mt-2" style={{ fontSize: 12 }}>
                  Sending will email the user and mark this query as{" "}
                  <b>Resolved</b>.
                </div>
              </div>

              <div className="modal-footer border-0">
                <button
                  className="btn btn-outline-light"
                  onClick={closeReply}
                  type="button"
                  disabled={sending}
                >
                  Cancel
                </button>

                <button
                  className="btn btn-green-custom"
                  onClick={submitReply}
                  type="button"
                  disabled={sending}
                >
                  {sending ? "Sending..." : "Send Reply"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW ANSWER MODAL */}
      {showViewModal && viewTarget && (
        <div className="modal d-block logout-overlay">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content logout-glass-card text-white">
              <div className="modal-header border-0">
                <h5 className="modal-title fw-bold">
                  Answer • {viewTarget.queryId}
                </h5>

                <button
                  className="btn btn-link text-white"
                  onClick={closeView}
                  style={{ textDecoration: "none" }}
                  aria-label="Close"
                  type="button"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="modal-body">
                <div className="text-white-50" style={{ fontSize: 13 }}>
                  <div>
                    <b>User</b> {viewTarget.name} ({viewTarget.email})
                  </div>
                  <div className="mt-1">
                    <b>Submitted</b> {toDateTime(viewTarget.createdAt)}
                  </div>
                  <div className="mt-1">
                    <b>Answered</b> {toDateTime(viewTarget.repliedAt)}
                  </div>
                  {viewTarget.repliedBy !== null &&
                    viewTarget.repliedBy !== undefined && (
                      <div className="mt-1">
                        <b>Replied By (Admin ID)</b> {viewTarget.repliedBy}
                      </div>
                    )}
                </div>

                <div className="mt-3">
                  <div className="ins-label">User Message</div>
                  <div
                    style={{
                      whiteSpace: "pre-wrap",
                      background: "rgba(0,0,0,0.22)",
                      border: "1px solid rgba(255,255,255,0.10)",
                      borderRadius: 14,
                      padding: 12,
                    }}
                  >
                    {viewTarget.message}
                  </div>
                </div>

                <div className="mt-3">
                  <div className="ins-label">Admin Reply</div>
                  <div
                    style={{
                      whiteSpace: "pre-wrap",
                      background: "rgba(0,0,0,0.22)",
                      border: "1px solid rgba(255,255,255,0.10)",
                      borderRadius: 14,
                      padding: 12,
                    }}
                  >
                    {viewTarget.replyMessage || "—"}
                  </div>
                </div>
              </div>

              <div className="modal-footer border-0">
                <button
                  className="btn btn-outline-light"
                  onClick={closeView}
                  type="button"
                >
                  Close
                </button>

                <button
                  className="btn btn-green-custom"
                  onClick={() => {
                    closeView();
                    openReply(viewTarget);
                  }}
                  type="button"
                >
                  Reply Again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QueryManagement;