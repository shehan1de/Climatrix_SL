import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png"; // spinner logo
import API from "../services/api";

const ForgetPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [alert, setAlert] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);

  // Auto-hide alert after 3 seconds
  useEffect(() => {
    if (alert.message) {
      const timer = setTimeout(() => setAlert({ type: "", message: "" }), 3000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  const submit = async () => {
    // Basic validation
    if (!email.includes("@")) {
      setAlert({ type: "error", message: "Please enter a valid email address" });
      return;
    }

    setLoading(true);
    try {
      await API.post("/auth/request-reset", { email });
      setAlert({ type: "success", message: "Verification code sent!" });
      setTimeout(() => navigate("/verify-code", { state: { email } }), 1000);
    } catch (err) {
      setAlert({
        type: "error",
        message: err.response?.data?.message || "Failed to send code",
      });
    } finally {
      setLoading(false);
    }
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

      {/* Loading spinner */}
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

            {/* Logo + Brand Name */}
            <div className="text-center mb-4">
              <img src={logo} alt="Logo" height={56} className="mb-2" />
              <h3 className="brand-gradient mb-0">CLIMATRIX <span style={{ color: "#00FF41" }}>SL</span></h3>
            </div>

            <h5 className="text-center text-light mb-4">Reset Password</h5>

            <form autoComplete="off">
              <div className="mb-4">
                <input
                  type="email"
                  className="form-control glass-input"
                  placeholder="Email Address"
                  required
                  autoComplete="off"
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <button
                className="btn btn-green-custom w-100 py-2"
                type="button"
                onClick={submit}
              >
                Send Code
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ForgetPassword;
