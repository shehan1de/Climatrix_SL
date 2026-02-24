// pages/admin/AdminProfile.js
import axios from "axios";
import { useEffect, useMemo, useRef, useState } from "react";
import {
    FaCamera,
    FaEye,
    FaEyeSlash,
    FaLock,
    FaSave,
    FaTimes,
    FaUser,
} from "react-icons/fa";
import logo from "../../assets/logo.png";
import Footer from "../../components/Footer";

const API_BASE = "http://localhost:5001";
const API_PREFIX = "/api";
const API = axios.create({ baseURL: API_BASE });

const formatDateTime = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
};

// ✅ Always store localStorage profilePicture as "/image/xxx.png"
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

// ✅ Same rendering logic as navbar (relative -> "/image/..")
const toImgSrcLikeNavbar = (relativePath) => {
  if (!relativePath) return "https://via.placeholder.com/160?text=User";
  return `/${String(relativePath).replace(/^\/+/, "")}`;
};

const AdminProfile = () => {
  const stored = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  }, []);

  const userId = stored?.userId;

  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ type: "", message: "" });

  const [profile, setProfile] = useState(null);

  const [name, setName] = useState("");
  const [imageFile, setImageFile] = useState(null);

  const [previewSrc, setPreviewSrc] = useState(() => {
    try {
      const u = JSON.parse(localStorage.getItem("user")) || null;
      return toImgSrcLikeNavbar(u?.profilePicture);
    } catch {
      return "https://via.placeholder.com/160?text=User";
    }
  });

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const fileRef = useRef(null);

  // Auto-hide alert (same style as login)
  useEffect(() => {
    if (!alert.message) return;
    const t = setTimeout(() => setAlert({ type: "", message: "" }), 3000);
    return () => clearTimeout(t);
  }, [alert]);

  const updateLocalStorageUser = (updates) => {
    try {
      const existing = JSON.parse(localStorage.getItem("user")) || {};
      const merged = { ...existing, ...updates };
      localStorage.setItem("user", JSON.stringify(merged));
      window.dispatchEvent(new Event("userUpdated")); // ✅ navbar refresh hook
    } catch {}
  };

  const fetchProfile = async () => {
    if (!userId) {
      setAlert({ type: "error", message: "User not logged in" });
      return;
    }

    setLoading(true);
    try {
      const res = await API.get(`${API_PREFIX}/user/${userId}`);
      const u = res.data;

      const relPic = toRelativeImagePath(u?.profilePicture);

      setProfile({
        ...u,
        profilePicture: relPic,
      });

      setName(u?.name || "");
      setPreviewSrc(toImgSrcLikeNavbar(relPic));

      updateLocalStorageUser({
        userId: u?.userId,
        name: u?.name,
        email: u?.email,
        role: u?.role,
        ...(relPic ? { profilePicture: relPic } : {}),
      });
    } catch (e) {
      setAlert({
        type: "error",
        message: e?.response?.data?.message || "Failed to load profile",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const onPickImage = (file) => {
    if (!file) return;

    const okTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!okTypes.includes(file.type)) {
      setAlert({ type: "error", message: "Upload JPG/PNG/WEBP only" });
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setAlert({ type: "error", message: "Image must be under 3MB" });
      return;
    }

    setImageFile(file);
    const url = URL.createObjectURL(file);
    setPreviewSrc(url);
  };

  const resetChanges = () => {
    if (!profile) return;

    setName(profile.name || "");
    setImageFile(null);
    setPreviewSrc(toImgSrcLikeNavbar(profile.profilePicture));

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");

    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);

    setAlert({ type: "", message: "" });
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!userId) {
      setAlert({ type: "error", message: "User not logged in" });
      return;
    }

    if (!name.trim()) {
      setAlert({ type: "error", message: "Name is required" });
      return;
    }

    const wantsPasswordChange =
      currentPassword || newPassword || confirmPassword;

    if (wantsPasswordChange) {
      if (!currentPassword || !newPassword || !confirmPassword) {
        setAlert({ type: "error", message: "Fill all password fields" });
        return;
      }
      if (newPassword.length < 6) {
        setAlert({
          type: "error",
          message: "New password must be 6+ characters",
        });
        return;
      }
      if (newPassword !== confirmPassword) {
        setAlert({ type: "error", message: "Confirm password does not match" });
        return;
      }
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", name.trim());

      if (wantsPasswordChange) {
        formData.append("currentPassword", currentPassword);
        formData.append("newPassword", newPassword);
        formData.append("confirmPassword", confirmPassword);
      }

      if (imageFile) formData.append("image", imageFile);

      const res = await API.put(
        `${API_PREFIX}/user/${userId}/profile`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      const updated = res.data?.user;
      const relPic = toRelativeImagePath(updated?.profilePicture);

      setAlert({ type: "success", message: "Profile updated successfully" });

      setProfile((prev) => ({
        ...(prev || {}),
        name: updated?.name ?? name.trim(),
        email: updated?.email ?? prev?.email,
        role: updated?.role ?? prev?.role,
        profilePicture: relPic || prev?.profilePicture,
      }));

      if (relPic) setPreviewSrc(toImgSrcLikeNavbar(relPic));

      updateLocalStorageUser({
        name: updated?.name ?? name.trim(),
        ...(relPic ? { profilePicture: relPic } : {}),
      });

      setImageFile(null);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setShowCurrent(false);
      setShowNew(false);
      setShowConfirm(false);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Profile update failed";
      setAlert({ type: "error", message: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-page d-flex flex-column">
      {alert.message && (
        <div
          className={`login-alert ${
            alert.type === "error"
              ? "login-alert-error"
              : "login-alert-success"
          }`}
        >
          {alert.message}
        </div>
      )}

      {loading && (
        <div className="loading-overlay">
          <img src={logo} alt="Loading..." className="spinner-logo-large" />
        </div>
      )}

      <div className="profile-container flex-grow-1">
        <div className="profile-hero">
          <h1 className="profile-title">
            <span className="brand-gradient">My Profile</span>
          </h1>
        </div>

        <div className="profile-grid">
          {/* LEFT CARD */}
          <div className="profile-glass-card">
            <div className="profile-avatar-wrap">
              <div className="profile-avatar-ring">
                <img
                  src={previewSrc}
                  alt="Profile"
                  className="profile-avatar"
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://via.placeholder.com/160?text=User";
                  }}
                />
              </div>

              <button
                type="button"
                className="profile-avatar-btn"
                onClick={() => fileRef.current?.click()}
                title="Change profile picture"
              >
                <FaCamera />
              </button>

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => onPickImage(e.target.files?.[0])}
              />
            </div>

            <div className="profile-summary">
              <div className="profile-name">{profile?.name || "—"}</div>
              <div className="profile-role-chip">{profile?.role || "Admin"}</div>

              <div className="profile-kv">
                <div className="profile-k">Email</div>
                <div className="profile-v">{profile?.email || "—"}</div>
              </div>

              <div className="profile-kv">
                <div className="profile-k">Joined</div>
                <div className="profile-v">
                  {formatDateTime(profile?.createdAt)}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT CARD */}
          <div className="profile-glass-card">
            <form onSubmit={handleSave}>
              <div className="profile-section-title">
                <FaUser className="me-2" /> Profile Details
              </div>

              <label className="profile-label">Name</label>
              <input
                className="form-control glass-input mb-3"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
              />

              <div className="profile-section-title mt-4">
                <FaLock className="me-2" /> Change Password
              </div>

              <div className="profile-password-grid">
                {/* Current */}
                <div>
                  <label className="profile-label">Current Password</label>
                  <div className="position-relative">
                    <input
                      type={showCurrent ? "text" : "password"}
                      className="form-control glass-input pe-5"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      className="password-eye-btn"
                      onClick={() => setShowCurrent((v) => !v)}
                      aria-label={
                        showCurrent
                          ? "Hide current password"
                          : "Show current password"
                      }
                    >
                      {showCurrent ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                {/* New */}
                <div>
                  <label className="profile-label">New Password</label>
                  <div className="position-relative">
                    <input
                      type={showNew ? "text" : "password"}
                      className="form-control glass-input pe-5"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      className="password-eye-btn"
                      onClick={() => setShowNew((v) => !v)}
                      aria-label={
                        showNew ? "Hide new password" : "Show new password"
                      }
                    >
                      {showNew ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                {/* Confirm */}
                <div>
                  <label className="profile-label">Confirm Password</label>
                  <div className="position-relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      className="form-control glass-input pe-5"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      className="password-eye-btn"
                      onClick={() => setShowConfirm((v) => !v)}
                      aria-label={
                        showConfirm
                          ? "Hide confirm password"
                          : "Show confirm password"
                      }
                    >
                      {showConfirm ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="profile-actions">
                <button
                  type="button"
                  className="btn btn-outline-light profile-btn"
                  onClick={resetChanges}
                >
                  <FaTimes className="me-2" />
                  Reset
                </button>

                <button
                  type="submit"
                  className="btn btn-green-custom profile-btn"
                >
                  <FaSave className="me-2" />
                  Save Changes
                </button>
              </div>

              <div className="profile-hint text-white-50">
                Tip: Keep password fields empty if you don’t want to change it
              </div>
            </form>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default AdminProfile;