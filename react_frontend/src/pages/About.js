import { useEffect, useState } from "react";
import bg1 from "../assets/5.jpg";
import logo from "../assets/logo.png";
import Footer from "../components/Footer";
import API from "../services/api";

const About = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
  });

  const [alert, setAlert] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);

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

    if (!form.name.trim()) {
      setAlert({ type: "error", message: "Name is required" });
      return;
    }

    if (!form.email.includes("@")) {
      setAlert({ type: "error", message: "Invalid email address" });
      return;
    }

    if (form.message.length < 10) {
      setAlert({
        type: "error",
        message: "Query must be at least 10 characters",
      });
      return;
    }

    setLoading(true);
    try {
      await API.post("/contact", form);
      setAlert({
        type: "success",
        message: "Your query has been submitted successfully!",
      });
      setForm({ name: "", email: "", message: "" });
    } catch (err) {
      setAlert({
        type: "error",
        message:
          err.response?.data?.message ||
          "Failed to submit query. Try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="about-root">

      {alert.message && (
        <div
          className={`login-alert fixed-alert ${
            alert.type === "error"
              ? "login-alert-error"
              : "login-alert-success"
          }`}
        >
          {alert.message}
        </div>
      )}

      <div
        className="about-fixed-bg"
        style={{ backgroundImage: `url(${bg1})` }}
      >
        <div className="bg-overlay"></div>
      </div>

      <div className="about-page">

        {loading && (
          <div className="loading-overlay">
            <img src={logo} alt="Loading..." className="spinner-logo-large" />
          </div>
        )}

        {!loading && (
          <div className="about-scroll-wrapper">

            <div className="about-header-glass">
              <h1 className="about-title">
                About <span className="brand-gradient">Climatrix</span>
              </h1>
              <p className="about-intro">
                Climatrix is an AI-powered climate intelligence platform focused
                on rainfall prediction and disaster preparedness to protect
                lives and infrastructure across Sri Lanka.
              </p>
            </div>

            <div className="about-info-grid">
              <div className="about-info-card">
                <h5 className="brand-gradient">Our Mission</h5>
                <p>
                  Provide accurate, timely climate insights that help communities
                  and authorities reduce disaster risks and respond effectively.
                </p>
              </div>

              <div className="about-info-card">
                <h5 className="brand-gradient">Technology</h5>
                <p>
                  Machine learning models trained on historical and real-time
                  climate datasets to deliver predictive intelligence.
                </p>
              </div>

              <div className="about-info-card">
                <h5 className="brand-gradient">Impact</h5>
                <p>
                  Supporting planners, researchers, and emergency teams with
                  actionable climate insights across Sri Lanka.
                </p>
              </div>
            </div>
            <div className="auth-glass-card about-query-card">
              <h4 className="text-center brand-gradient mb-4">
                Contact Us
              </h4>

              <form onSubmit={handleSubmit} autoComplete="off">
                <div className="mb-3">
                  <input
                    type="text"
                    className="form-control glass-input"
                    placeholder="Your Name"
                    value={form.name}
                    onChange={(e) =>
                      setForm({ ...form, name: e.target.value })
                    }
                  />
                </div>

                <div className="mb-3">
                  <input
                    type="email"
                    className="form-control glass-input"
                    placeholder="Your Email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                  />
                </div>

                <div className="mb-4">
                  <textarea
                    className="form-control glass-input"
                    placeholder="Your Query"
                    rows="4"
                    value={form.message}
                    onChange={(e) =>
                      setForm({ ...form, message: e.target.value })
                    }
                  />
                </div>

                <button
                  className="btn btn-green-custom w-100 py-2"
                  type="submit"
                >
                  Submit Query
                </button>
              </form>
            </div>

            <Footer />
          </div>
        )}
      </div>
    </div>
  );
};

export default About;
