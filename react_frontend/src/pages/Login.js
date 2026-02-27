import { useEffect, useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import Footer from "../components/Footer";
import API from "../services/api";

const Login = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [alert, setAlert] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (alert.message) {
      const timer = setTimeout(() => setAlert({ type: "", message: "" }), 3000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert({ type: "", message: "" });
    setLoading(true);

    try {
      const res = await API.post("/auth/login", form);

      const { token, user } = res.data;

      localStorage.setItem("token", token);

      localStorage.setItem("user", JSON.stringify({
        id: user.id,
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture
      }));

      setAlert({ type: "success", message: "Login successful!" });

      if (user.role === "Admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/client/dashboard");
      }

    } catch (err) {
      const msg =
        err.response?.data?.message || "Email or password is incorrect";
      setAlert({ type: "error", message: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-background login-background d-flex flex-column">
      {alert.message && (
        <div className={`login-alert ${
          alert.type === "error"
            ? "login-alert-error"
            : "login-alert-success"
        }`}>
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
            <button className="btn btn-link back-button" onClick={() => navigate(-1)}>
              &#8592;
            </button>

            <h3 className="text-center brand-gradient mb-4">
              Welcome Back
            </h3>

            <form onSubmit={handleSubmit}>
              <input
                type="email"
                className="form-control glass-input mb-3"
                placeholder="Email address"
                required
                onChange={(e) =>
                  setForm({ ...form, email: e.target.value })
                }
              />

              <div className="position-relative mb-4">
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

              <button className="btn btn-green-custom w-100 py-2" type="submit">
                Login
              </button>
            </form>

            <div className="text-center mt-3">
              Do not have an account?{" "}
              <Link className="link-green" to="/register">Sign Up</Link>
            </div>

            <div className="text-center mt-2">
              <Link className="link-green" to="/forgot-password">
                Forgot password?
              </Link>
            </div>
          </div>
        </div>
      )}

      {!loading && <Footer />}
    </div>
  );
};

export default Login;
