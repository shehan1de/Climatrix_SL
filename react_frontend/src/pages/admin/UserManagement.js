// pages/admin/UserManagement.js
import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { FaPlus, FaRegEdit, FaRegTrashAlt, FaSyncAlt, FaTimes } from "react-icons/fa";

const API_BASE = "http://localhost:5001";
const API_PREFIX = "/api";
const API = axios.create({ baseURL: API_BASE });

// ✅ Same logic as Profile.js (so images always work)
const toRelativeImagePath = (pic) => {
  if (!pic) return "";

  let s = String(pic).trim();
  s = s.replace("/undefined/", "/").replace("undefined//", "");

  // If API returns full URL, extract pathname
  if (/^https?:\/\//i.test(s)) {
    try {
      s = new URL(s).pathname; // "/image/xxx.png"
    } catch {
      const idx = s.indexOf("/image/");
      if (idx !== -1) s = s.slice(idx);
    }
  }

  if (!s.startsWith("/")) s = `/${s}`;
  return s;
};

const toImgSrcLikeNavbar = (relativePath) => {
  if (!relativePath) return "https://via.placeholder.com/160?text=User";
  return `/${String(relativePath).replace(/^\/+/, "")}`;
};

const toDateTime = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
};

const UserManagement = () => {
  const stored = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  }, []);

  const adminId = stored?.userId;

  // data
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  // ✅ Alert system exactly like Login page
  const [alert, setAlert] = useState({ type: "", message: "" });

  // filters
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");

  // add/edit modal
  const [showModal, setShowModal] = useState(false);
  const [mode, setMode] = useState("add"); // add | edit
  const [selected, setSelected] = useState(null);

  // delete confirm modal (logout style)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // form
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "Client",
    password: "", // only for add
  });

  // ✅ auto hide alert like login page
  useEffect(() => {
    if (alert.message) {
      const timer = setTimeout(() => setAlert({ type: "", message: "" }), 3000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  const setErr = (message) => setAlert({ type: "error", message });
  const setOk = (message) => setAlert({ type: "success", message });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await API.get(`${API_PREFIX}/users`);
      const arr = Array.isArray(res.data) ? res.data : [];

      // ✅ normalize profilePicture like Profile.js (store as "/image/..")
      const normalized = arr.map((u) => {
        const rel = toRelativeImagePath(u?.profilePicture);
        return { ...u, _relPic: rel, _imgSrc: toImgSrcLikeNavbar(rel) };
      });

      setUsers(normalized);
    } catch (e) {
      setErr("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return users
      .filter((u) => {
        if (roleFilter === "All") return true;
        return String(u.role || "").toLowerCase() === roleFilter.toLowerCase();
      })
      .filter((u) => {
        if (!q) return true;
        const hay = `${u.userId} ${u.name} ${u.email} ${u.role}`.toLowerCase();
        return hay.includes(q);
      });
  }, [users, query, roleFilter]);

  // =========================
  // Modal helpers
  // =========================
  const openAdd = () => {
    setMode("add");
    setSelected(null);
    setForm({ name: "", email: "", role: "Client", password: "" });
    setShowModal(true);
  };

  const openEdit = (u) => {
    setMode("edit");
    setSelected(u);
    setForm({
      name: u?.name || "",
      email: u?.email || "",
      role: u?.role || "Client",
      password: "",
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelected(null);
    setMode("add");
    setForm({ name: "", email: "", role: "Client", password: "" });
  };

  // =========================
  // CRUD actions
  // =========================
  const submitAdd = async () => {
    const name = form.name.trim();
    const email = form.email.trim();
    const password = form.password;

    if (!name || !email || !password) return setErr("Name, Email, and Password are required");
    if (!email.includes("@")) return setErr("Invalid email address");
    if (password.length < 6) return setErr("Password must be at least 6 characters");

    try {
      await API.post(`${API_PREFIX}/user`, {
        name,
        email,
        password,
        role: form.role,
      });

      setOk("User added successfully");
      closeModal();
      fetchUsers();
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to add user");
    }
  };

  const submitEdit = async () => {
    if (!selected?.userId) return;

    const name = form.name.trim();
    const email = form.email.trim();

    if (!name || !email) return setErr("Name and Email are required");
    if (!email.includes("@")) return setErr("Invalid email address");

    try {
      // ✅ condition: admin can't edit password/profile picture
      await API.put(`${API_PREFIX}/user/${selected.userId}`, {
        name,
        email,
        role: form.role,
      });

      setOk("User updated successfully");
      closeModal();
      fetchUsers();
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to update user");
    }
  };

  // delete confirm
  const askDelete = (u) => {
    setDeleteTarget(u);
    setShowDeleteConfirm(true);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeleteTarget(null);
  };

  const doDelete = async () => {
    if (!deleteTarget?.userId) return;

    try {
      await API.delete(`${API_PREFIX}/user/${deleteTarget.userId}`);
      setOk("User deleted successfully");
      cancelDelete();
      fetchUsers();
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to delete user");
    }
  };

  return (
    <div className="history-page">
      {/* ✅ Alert UI like Login page */}
      {alert.message && (
        <div
          className={`login-alert ${
            alert.type === "error" ? "login-alert-error" : "login-alert-success"
          }`}
        >
          {alert.message}
        </div>
      )}

      {/* ✅ Loading overlay like Login/Profile */}
      {loading && (
        <div className="loading-overlay">
          {/* use existing spinner css; no logo needed */}
          <div className="spinner-border text-light" role="status" />
        </div>
      )}

      <div className="history-container">
        {/* HERO */}
        <div className="history-hero">
          <h1 className="history-title">
            <span className="brand-gradient">User</span> Management
          </h1>
          
        </div>

        {/* CONTROLS */}
        <div className="glass-panel history-controls">
          <div className="history-controls-row">
            <input
              className="form-control glass-input history-search"
              placeholder="Search by name, email, role, or userId..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />

            <select
              className="form-select glass-select history-select"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="All">All Roles</option>
              <option value="Admin">Admin</option>
              <option value="Client">Client</option>
            </select>

            <button className="btn btn-green-custom history-refresh" onClick={openAdd}>
              <FaPlus className="me-2" />
              Add User
            </button>

            <button
              className="btn btn-outline-light history-refresh icon-btn"
              onClick={fetchUsers}
              disabled={loading}
              title="Refresh"
            >
              <FaSyncAlt />
            </button>
          </div>

          <div className="history-count text-white-50">
            Showing <b>{filtered.length}</b> of <b>{users.length}</b> users
          </div>
        </div>

        {/* TABLE */}
        <div className="glass-panel">
          <div className="ins-table-wrap">
            <table className="table table-dark table-hover mb-0 ins-table">
              <thead>
                <tr>
                  <th style={{ width: 70 }}>Picture</th>
                  <th>User ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Alerts</th>
                  <th>Created</th>
                  <th style={{ width: 130 }}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {!loading && filtered.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center text-white-50 py-4">
                      No users found
                    </td>
                  </tr>
                ) : (
                  filtered.map((u) => (
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
                            e.currentTarget.src = "https://via.placeholder.com/42?text=User";
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

                      <td>{u.emailAlertsEnabled ? "Enabled" : "Disabled"}</td>
                      <td>{toDateTime(u.createdAt)}</td>

                      <td>
                        <div style={{ display: "flex", gap: 10 }}>
                          <button
                            className="icon-action-btn"
                            title="Edit"
                            onClick={() => openEdit(u)}
                          >
                            <FaRegEdit />
                          </button>

                          <button
                            className="icon-action-btn"
                            title="Delete"
                            onClick={() => askDelete(u)}
                            disabled={u.userId === adminId}
                          >
                            <FaRegTrashAlt />
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
            Admin cannot edit <b>password</b> or <b>profile picture</b> from this page.
          </div>
        </div>
      </div>

      {/* =======================
          ADD / EDIT MODAL (Logout popup style)
      ======================= */}
      {showModal && (
        <div className="modal d-block logout-overlay">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content logout-glass-card text-white">
              <div className="modal-header border-0">
                <h5 className="modal-title fw-bold">
                  {mode === "add" ? "Add New User" : `Update User - ${selected?.name}`}
                </h5>

                <button
                  className="btn btn-link text-white"
                  onClick={closeModal}
                  style={{ textDecoration: "none" }}
                  aria-label="Close"
                  type="button"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="modal-body">
                {/* ✅ Profile image preview (read-only) in edit */}
                {mode === "edit" && (
                  <div className="d-flex align-items-center gap-3 mb-3">
                    <img
                      src={toImgSrcLikeNavbar(toRelativeImagePath(selected?.profilePicture))}
                      alt="Profile"
                      style={{
                        width: 62,
                        height: 62,
                        borderRadius: 999,
                        objectFit: "cover",
                        border: "1px solid rgba(255,255,255,0.18)",
                        background: "rgba(0,0,0,0.25)",
                      }}
                      onError={(e) => {
                        e.currentTarget.src = "https://via.placeholder.com/62?text=User";
                      }}
                    />
                    <div className="text-white-50" style={{ fontSize: 13 }}>
                      Profile picture is read-only in admin panel
                    </div>
                  </div>
                )}

                <div className="mb-3">
                  <input
                    type="text"
                    className="form-control glass-input"
                    placeholder="Name"
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    required
                  />
                </div>

                <div className="mb-3">
                  <input
                    type="email"
                    className="form-control glass-input"
                    placeholder="Email"
                    value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    required
                  />
                </div>

                <div className="mb-3">
                  <select
                    className="form-select glass-select"
                    value={form.role}
                    onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                  >
                    <option value="Client">Client</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>

                {/* ✅ Password only in ADD */}
                {mode === "add" && (
                  <div className="mb-2">
                    <input
                      type="password"
                      className="form-control glass-input"
                      placeholder="Password (min 6 chars)"
                      value={form.password}
                      onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                      required
                    />
                  </div>
                )}

                {mode === "add" && (
                  <div className="text-white-50" style={{ fontSize: 12 }}>
                    Default profile picture will be saved automatically.
                  </div>
                )}
              </div>

              <div className="modal-footer border-0">
                <button className="btn btn-outline-light" onClick={closeModal} type="button">
                  Cancel
                </button>

                <button
                  className="btn btn-green-custom"
                  onClick={mode === "add" ? submitAdd : submitEdit}
                  type="button"
                >
                  {mode === "add" ? "Add User" : "Update User"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =======================
          DELETE CONFIRM MODAL (Exact logout style)
      ======================= */}
      {showDeleteConfirm && deleteTarget && (
        <div className="modal d-block logout-overlay">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content logout-glass-card text-white">
              <div className="modal-header border-0">
                <h5 className="modal-title fw-bold">Confirm Delete</h5>
              </div>

              <div className="modal-body">
                <p className="mb-2">Are you sure you want to delete this user?</p>

                <div className="d-flex align-items-center gap-3 mt-3">
                  <img
                    src={deleteTarget._imgSrc}
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
                      e.currentTarget.src = "https://via.placeholder.com/52?text=User";
                    }}
                  />
                  <div className="text-white-50" style={{ fontSize: 13 }}>
                    <div>
                      <b>User</b> {deleteTarget.userId} — {deleteTarget.name}
                    </div>
                    <div>
                      <b>Email</b> {deleteTarget.email}
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer border-0">
                <button className="btn btn-outline-light" onClick={cancelDelete} type="button">
                  No
                </button>

                <button className="btn btn-danger" onClick={doDelete} type="button">
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;