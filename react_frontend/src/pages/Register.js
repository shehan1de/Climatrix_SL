import { useEffect, useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import Footer from "../components/Footer";
import API from "../services/api";

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "Client",
  });
  const [alert, setAlert] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (alert.message) {
      const timer = setTimeout(() => setAlert({ type: "", message: "" }), 5000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert({ type: "", message: "" });

    if (!form.email.includes("@")) {
      setAlert({ type: "error", message: "Invalid email address" });
      return;
    }
    if (form.password.length < 6) {
      setAlert({
        type: "error",
        message: "Password must be at least 6 characters",
      });
      return;
    }
    if (form.password !== form.confirmPassword) {
      setAlert({ type: "error", message: "Passwords do not match" });
      return;
    }

    setLoading(true);
    try {
      await API.post("/auth/register", form);
      setAlert({ type: "success", message: "Registration successful!" });
      setTimeout(() => navigate("/login"), 1000);
    } catch (err) {
      setAlert({
        type: "error",
        message: err.response?.data?.message || "Registration failed",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-background login-background d-flex flex-column">
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
      {!loading && (
        <div className="auth-page flex-grow-1">
          <div className="auth-glass-card">
            <button
              className="btn btn-link back-button"
              onClick={() => navigate(-1)}
            >
              &#8592;
            </button>

            <h3 className="text-center brand-gradient mb-4">
              Register
            </h3>

            <form onSubmit={handleSubmit} autoComplete="off">
              <div className="mb-3">
                <input
                  type="text"
                  className="form-control glass-input"
                  placeholder="Name"
                  required
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                />
              </div>

              <div className="mb-3">
                <input
                  type="email"
                  className="form-control glass-input"
                  placeholder="Email"
                  required
                  onChange={(e) =>
                    setForm({ ...form, email: e.target.value })
                  }
                />
              </div>

              <div className="mb-3 position-relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="form-control glass-input"
                  placeholder="Password"
                  required
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                />
                <span
                  className="password-toggle-icon"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>

              <div className="mb-4 position-relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  className="form-control glass-input"
                  placeholder="Confirm Password"
                  required
                  onChange={(e) =>
                    setForm({
                      ...form,
                      confirmPassword: e.target.value,
                    })
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
                Register
              </button>
            </form>

            <div className="text-center mt-3 signup-text">
              Already have an account?{" "}
              <Link className="link-green" to="/login">
                Login
              </Link>
            </div>
          </div>
        </div>
      )}
      {!loading && <Footer />}
    </div>
  );
};

export default Register;
