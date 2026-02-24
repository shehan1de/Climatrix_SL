import { useEffect, useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import API from "../services/api";

const ResetPassword = () => {
  const navigate = useNavigate();
  const { state } = useLocation();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ type: "", message: "" });

  /* 🔒 Prevent direct access */
  useEffect(() => {
    if (!state?.email || !state?.code) {
      navigate("/forgot-password");
    }
  }, [state, navigate]);

  /* ⏱ Auto-hide alert */
  useEffect(() => {
    if (alert.message) {
      const timer = setTimeout(
        () => setAlert({ type: "", message: "" }),
        5000
      );
      return () => clearTimeout(timer);
    }
  }, [alert]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert({ type: "", message: "" });

    /* Validations */
    if (password.length < 6) {
      setAlert({
        type: "error",
        message: "Password must be at least 6 characters",
      });
      return;
    }

    if (password !== confirmPassword) {
      setAlert({ type: "error", message: "Passwords do not match" });
      return;
    }

    setLoading(true);
    try {
      await API.post("/auth/reset-password", {
        email: state.email,
        code: state.code,
        newPassword: password,
      });

      setAlert({
        type: "success",
        message: "Password reset successful! Redirecting to login...",
      });

      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setAlert({
        type: "error",
        message: err.response?.data?.message || "Password reset failed",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-background login-background">
      {/* Alert */}
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

      {/* Loading */}
      {loading && (
        <div className="loading-overlay">
          <img src={logo} alt="Loading..." className="spinner-logo-large" />
        </div>
      )}

      {!loading && (
        <div className="auth-page">
          <div className="auth-glass-card">
            {/* Back button */}
            <button
              className="btn btn-link back-button"
              onClick={() => navigate(-1)}
            >
              &#8592;
            </button>

            <h3 className="text-center brand-gradient mb-4">
              Reset Password
            </h3>

            <form onSubmit={handleSubmit} autoComplete="off">
              {/* New Password */}
              <div className="mb-3 position-relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="form-control glass-input"
                  placeholder="New Password"
                  required
                  autoComplete="new-password"
                  onChange={(e) => setPassword(e.target.value)}
                />
                <span
                  className="password-toggle-icon"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>

              {/* Confirm Password */}
              <div className="mb-4 position-relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  className="form-control glass-input"
                  placeholder="Confirm Password"
                  required
                  autoComplete="new-password"
                  onChange={(e) =>
                    setConfirmPassword(e.target.value)
                  }
                />
                <span
                  className="password-toggle-icon"
                  onClick={() => setShowConfirm(!showConfirm)}
                >
                  {showConfirm ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>

              <button
                className="btn btn-green-custom w-100 py-2"
                type="submit"
              >
                Reset Password
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResetPassword;
