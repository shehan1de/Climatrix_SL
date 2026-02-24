import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { FaPaperPlane, FaSyncAlt, FaTimes } from "react-icons/fa";

const API_BASE = "http://localhost:5001";
const API_PREFIX = "/api";
const API = axios.create({ baseURL: API_BASE });

const toRelativeImagePath = (pic) => {
  if (!pic) return "";

  let s = String(pic).trim();
  s = s.replace("/undefined/", "/").replace("undefined//", "");

  if (/^https?:\/\//i.test(s)) {
    try {
      s = new URL(s).pathname;
    } catch {
      const idx = s.indexOf("/image/");
      if (idx !== -1) s = s.slice(idx);
    }
  }

  if (!s.startsWith("/")) s = `/${s}`;
  return s; // "/image/xxx.png"
};

// ✅ FIXED: always load from backend host
const toImgSrcLikeNavbar = (relativePath) => {
  if (!relativePath) return "https://via.placeholder.com/52?text=User";
  const clean = String(relativePath).replace(/^\/+/, ""); // "image/xxx.png"
  return `${API_BASE}/${clean}`; // "http://localhost:5001/image/xxx.png"
};

const AlertManagement = () => {
  const stored = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  }, []);

  const adminId = stored?.userId;

  const [alert, setAlert] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [enabledUsers, setEnabledUsers] = useState([]);

  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("Client");

  const [form, setForm] = useState({
    alertType: "Emergency Alert",
    subject: "",
    message: "",
    mode: "enabled",
    userId: "",
  });

  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (alert.message) {
      const timer = setTimeout(() => setAlert({ type: "", message: "" }), 3000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  const setErr = (message) => setAlert({ type: "error", message });
  const setOk = (message) => setAlert({ type: "success", message });

  const fetchEnabledUsers = async () => {
    setLoading(true);
    try {
      const res = await API.get(`${API_PREFIX}/users/alerts?enabled=true`);

      const arr = Array.isArray(res.data?.users) ? res.data.users : [];

      const normalized = arr.map((u) => {
        const rel = toRelativeImagePath(u?.profilePicture);
        return { ...u, _relPic: rel, _imgSrc: toImgSrcLikeNavbar(rel) };
      });

      setEnabledUsers(normalized);
    } catch (e) {
      setErr("Failed to load enabled users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnabledUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminId]);

  const filteredEnabled = useMemo(() => {
    const q = query.trim().toLowerCase();

    return enabledUsers
      .filter((u) => {
        if (roleFilter === "All") return true;
        return String(u.role || "").toLowerCase() === roleFilter.toLowerCase();
      })
      .filter((u) => {
        if (!q) return true;
        const hay = `${u.userId} ${u.name} ${u.email} ${u.role}`.toLowerCase();
        return hay.includes(q);
      });
  }, [enabledUsers, query, roleFilter]);

  const selectedUser = useMemo(() => {
    if (form.mode !== "one") return null;
    const id = Number(form.userId);
    if (!id) return null;
    return enabledUsers.find((u) => Number(u.userId) === id) || null;
  }, [form.mode, form.userId, enabledUsers]);

  const validateBeforeConfirm = () => {
    if (!form.message || !String(form.message).trim()) {
      setErr("Message is required");
      return false;
    }

    if (form.mode === "one") {
      if (!form.userId) {
        setErr("Select a user to send the alert");
        return false;
      }
      if (!selectedUser) {
        setErr("Selected user is not found (or not enabled)");
        return false;
      }
    }

    return true;
  };

  const openConfirm = () => {
    if (!validateBeforeConfirm()) return;
    setShowConfirm(true);
  };

  const cancelConfirm = () => setShowConfirm(false);

  const sendAlert = async () => {
    if (!validateBeforeConfirm()) return;

    setLoading(true);
    try {
      const payload = {
        alertType: form.alertType,
        subject: form.subject,
        message: form.message,
        sendToRole: roleFilter === "All" ? "All" : roleFilter,
      };

      if (form.mode === "one") {
        payload.targetUserId = Number(form.userId);
      }

      const res = await API.post(`${API_PREFIX}/admin/alerts/send`, payload);

      const sent = res.data?.sent ?? 0;
      const failed = res.data?.failed ?? 0;

      setOk(
        form.mode === "one"
          ? `Alert sent. Sent: ${sent}, Failed: ${failed}`
          : `Alert broadcast finished. Sent: ${sent}, Failed: ${failed}`
      );

      setShowConfirm(false);
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to send alert");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="history-page">
      {alert.message && (
        <div
          className={`login-alert ${
            alert.type === "error" ? "login-alert-error" : "login-alert-success"
          }`}
        >
          {alert.message}
        </div>
      )}

      {loading && (
        <div className="loading-overlay">
          <div className="spinner-border text-light" role="status" />
        </div>
      )}

      <div className="history-container">
        <div className="history-hero">
          <h1 className="history-title">
            <span className="brand-gradient">Alert</span> Management
          </h1>
        </div>

        <div className="glass-panel history-controls">
          <div
            className="history-controls-row"
            style={{ gridTemplateColumns: "1.2fr 0.7fr 0.7fr 0.35fr" }}
          >
            <input
              className="form-control glass-input history-search"
              placeholder="Search enabled users (name, email, role, userId)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />

            <select
              className="form-select glass-select history-select"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              title="Filter recipients by role"
            >
              <option value="Client">Clients only</option>
              <option value="Admin">Admins only</option>
              <option value="All">All roles</option>
            </select>

            <button
              className="btn btn-green-custom history-refresh"
              onClick={openConfirm}
              type="button"
            >
              <FaPaperPlane className="me-2" />
              Send Alert
            </button>

            <button
              className="btn btn-outline-light history-refresh icon-btn"
              onClick={fetchEnabledUsers}
              disabled={loading}
              title="Refresh enabled users"
              type="button"
            >
              <FaSyncAlt />
            </button>
          </div>

          <div className="history-count text-white-50">
            Enabled users <b>{enabledUsers.length}</b> | Showing{" "}
            <b>{filteredEnabled.length}</b>
          </div>
        </div>

        {/* Compose Alert */}
        <div className="glass-panel mt-3">
          <div className="ins-card-title">Compose Alert</div>

          <div className="row g-3">
            <div className="col-12 col-lg-4">
              <label className="ins-label">Alert Type</label>
              <select
                className="form-select glass-select"
                value={form.alertType}
                onChange={(e) =>
                  setForm((p) => ({ ...p, alertType: e.target.value }))
                }
              >
                <option value="Emergency Alert">Emergency Alert</option>
                <option value="Tsunami">Tsunami</option>
                <option value="Flooding">Flooding</option>
                <option value="Landslide">Landslide</option>
                <option value="Storm Warning">Storm Warning</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="col-12 col-lg-4">
              <label className="ins-label">Send Mode</label>
              <select
                className="form-select glass-select"
                value={form.mode}
                onChange={(e) =>
                  setForm((p) => ({ ...p, mode: e.target.value, userId: "" }))
                }
              >
                <option value="enabled">Send to enabled users (bulk)</option>
                <option value="one">Send to one user (by userId)</option>
              </select>
            </div>

            <div className="col-12 col-lg-4">
              <label className="ins-label">
                Target User (only for one-by-one)
              </label>
              <select
                className="form-select glass-select"
                value={form.userId}
                onChange={(e) =>
                  setForm((p) => ({ ...p, userId: e.target.value }))
                }
                disabled={form.mode !== "one"}
              >
                <option value="">Select enabled user...</option>
                {enabledUsers.map((u) => (
                  <option key={u.userId} value={u.userId}>
                    {u.userId} — {u.name} ({u.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12">
              <label className="ins-label">Subject (optional)</label>
              <input
                className="form-control glass-input"
                placeholder="Leave empty to auto-generate subject"
                value={form.subject}
                onChange={(e) =>
                  setForm((p) => ({ ...p, subject: e.target.value }))
                }
              />
            </div>

            <div className="col-12">
              <label className="ins-label">Message</label>
              <textarea
                className="form-control glass-input"
                rows={6}
                placeholder="Type the alert message here..."
                value={form.message}
                onChange={(e) =>
                  setForm((p) => ({ ...p, message: e.target.value }))
                }
              />
              <div className="text-white-50 mt-2" style={{ fontSize: 12 }}>
                Tip: If you choose <b>Clients only</b>, only enabled client users
                will receive it.
              </div>
            </div>
          </div>
        </div>

        {/* Enabled Users Table */}
        <div className="glass-panel mt-3">
          <div className="ins-card-title">Enabled Users (Recipients)</div>

          <div className="ins-table-wrap">
            <table className="table table-dark table-hover mb-0 ins-table">
              <thead>
                <tr>
                  <th style={{ width: 70 }}>Picture</th>
                  <th>User ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                </tr>
              </thead>

              <tbody>
                {!loading && filteredEnabled.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center text-white-50 py-4">
                      No enabled users found (for current filters)
                    </td>
                  </tr>
                ) : (
                  filteredEnabled.map((u) => (
                    <tr key={u.userId}>
                      <td>
                        <img
                          src={u._imgSrc}
                          alt="Profile"
                          style={{
                            width: 42,
                            height: 42,
                            borderRadius: 999,
                            objectFit: "cover",
                            border: "1px solid rgba(255,255,255,0.18)",
                            background: "rgba(0,0,0,0.25)",
                          }}
                          onError={(e) => {
                            e.currentTarget.src =
                              "https://via.placeholder.com/42?text=User";
                          }}
                        />
                      </td>
                      <td>{u.userId}</td>
                      <td>{u.name}</td>
                      <td>{u.email}</td>
                      <td>
                        <span className="chip">
                          {u.role === "Admin" ? "Admin" : "Client"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="ins-table-note text-white-50">
            This list includes only users who enabled email alerts (
            <b>emailAlertsEnabled = true</b>).
          </div>
        </div>
      </div>

      {/* CONFIRM MODAL */}
      {showConfirm && (
        <div className="modal d-block logout-overlay">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content logout-glass-card text-white">
              <div className="modal-header border-0">
                <h5 className="modal-title fw-bold">Confirm Send Alert</h5>

                <button
                  className="btn btn-link text-white"
                  onClick={cancelConfirm}
                  style={{ textDecoration: "none" }}
                  aria-label="Close"
                  type="button"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="modal-body">
                <p className="mb-2">Are you sure you want to send this alert?</p>

                <div className="mt-3 text-white-50" style={{ fontSize: 13 }}>
                  <div>
                    <b>Type</b> {form.alertType}
                  </div>

                  <div className="mt-1">
                    <b>Role Filter </b>{" "}
                    {roleFilter === "All" ? "All roles" : roleFilter}
                  </div>

                  <div className="mt-1">
                    <b>Mode </b>{" "}
                    {form.mode === "one"
                      ? `One user (userId - ${form.userId || "—"})`
                      : "All enabled users"}
                  </div>

                  {form.mode === "one" && selectedUser && (
                    <div className="d-flex align-items-center gap-3 mt-3">
                      <img
                        src={selectedUser._imgSrc}
                        alt="Profile"
                        style={{
                          width: 52,
                          height: 52,
                          borderRadius: 999,
                          objectFit: "cover",
                          border: "1px solid rgba(255,255,255,0.18)",
                          background: "rgba(0,0,0,0.25)",
                        }}
                        onError={(e) => {
                          e.currentTarget.src =
                            "https://via.placeholder.com/52?text=User";
                        }}
                      />
                      <div>
                        <div>
                          <b>{selectedUser.name}</b> (#{selectedUser.userId})
                        </div>
                        <div>{selectedUser.email}</div>
                      </div>
                    </div>
                  )}

                  <div className="mt-3">
                    <b>Subject </b>{" "}
                    {form.subject?.trim()
                      ? form.subject.trim()
                      : `Climatrix SL Alert - ${form.alertType}`}
                  </div>

                  <div className="mt-2">
                    <b>Message Preview </b>
                    <div
                      className="mt-2"
                      style={{
                        whiteSpace: "pre-wrap",
                        background: "rgba(0,0,0,0.22)",
                        border: "1px solid rgba(255,255,255,0.10)",
                        borderRadius: 14,
                        padding: 12,
                      }}
                    >
                      {form.message}
                    </div>
                  </div>

                  {form.mode !== "one" && (
                    <div className="mt-3">
                      <b>Estimated recipients now</b> {filteredEnabled.length}
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer border-0">
                <button
                  className="btn btn-outline-light"
                  onClick={cancelConfirm}
                  type="button"
                >
                  No
                </button>

                <button className="btn btn-danger" onClick={sendAlert} type="button">
                  Yes, Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertManagement;