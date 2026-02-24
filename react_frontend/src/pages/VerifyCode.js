import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png"; // logo for spinner
import API from "../services/api";

const VerifyCode = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const [code, setCode] = useState("");
  const [alert, setAlert] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(600); // 10 minutes countdown

  // Redirect if accessed without state (unauthorized access)
  useEffect(() => {
    if (!state?.email) {
      navigate("/forgot-password");
    }
  }, [state, navigate]);

  // Auto-hide alert after 3 seconds
  useEffect(() => {
    if (alert.message) {
      const t = setTimeout(() => setAlert({ type: "", message: "" }), 3000);
      return () => clearTimeout(t);
    }
  }, [alert]);

  // Countdown timer for OTP expiration
  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleVerify = async () => {
    if (!code) {
      setAlert({ type: "error", message: "Please enter the verification code!" });
      return;
    }

    setLoading(true);
    setAlert({ type: "", message: "" });

    try {
      await API.post("/auth/verify-code", {
        email: state.email,
        code,
      });
      setAlert({ type: "success", message: "Code verified successfully!" });

      // Navigate after a short delay to show success
      setTimeout(() => {
        navigate("/reset-password", { state: { email: state.email, code } });
      }, 1000);
    } catch (err) {
      setAlert({
        type: "error",
        message: err.response?.data?.message || "Invalid verification code!",
      });
    } finally {
      setLoading(false);
    }
  };

  // Format timer in mm:ss
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="app-background login-background">
      {/* Alert message */}
      {alert.message && (
        <div
          className={`login-alert ${
            alert.type === "error" ? "login-alert-error" : "login-alert-success"
          }`}
        >
          {alert.message}
        </div>
      )}

      {loading ? (
        <div className="auth-page justify-content-center">
          <img src={logo} alt="Loading..." className="spinner-logo" />
        </div>
      ) : (
        <div className="auth-page">
          <div className="auth-glass-card">
            {/* Back button */}
            <button
              className="btn btn-link back-button"
              onClick={() => navigate(-1)}
            >
              &#8592;
            </button>

            <h3 className="text-center brand-gradient mb-4">Verify Code</h3>

            <input
              className="form-control glass-input mb-3"
              placeholder="Enter OTP code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />

            <button
              className="btn btn-green-custom w-100 py-2"
              onClick={handleVerify}
            >
              Verify
            </button>

            <div className="text-center mt-3">
              OTP expires in <span className="text-light">{formatTime(timer)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerifyCode;
