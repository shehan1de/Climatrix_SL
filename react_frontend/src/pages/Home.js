import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import bg1 from "../assets/1.jpg";
import bg2 from "../assets/2.jpg";
import bg3 from "../assets/3.jpg";
import bg4 from "../assets/4.jpg";

const backgrounds = [bg1, bg2, bg3, bg4];

const Home = () => {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % backgrounds.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="app-background animated-bg"
      style={{ backgroundImage: `url(${backgrounds[index]})` }}
    >
      <div className="bg-overlay"></div>

      <div className="home-simple">

        {/* ===== MAIN CONTENT ===== */}
        <div className="home-content">
          <h1 className="home-title">
            Predict. <span className="brand-gradient">Prepare.</span> Protect.
          </h1>

          <p className="home-subtitle">
            Smarter insights to anticipate extreme weather and protect communities across Sri Lanka
          </p>

          
        </div>

        {/* ===== ACTION BUTTONS ===== */}
        <div className="home-actions">
          <button
            className="glass-action-btn primary"
            onClick={() => navigate("/client/dashboard")}
          >
            View Predictions
          </button>

          <button
            className="glass-action-btn"
            onClick={() => navigate("/login")}
          >
            Login
          </button>

          <button
            className="glass-action-btn"
            onClick={() => navigate("/register")}
          >
            Register
          </button>
        </div>

      </div>
    </div>
  );
};

export default Home;
