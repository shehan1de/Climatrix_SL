import { FaHome, FaInfoCircle, FaSignInAlt, FaUserPlus } from "react-icons/fa";
import { Link, NavLink } from "react-router-dom";
import logo from "../assets/logo.png";

const Navbar = () => {
  return (
    <div className="navbar-wrapper position-absolute w-100">
      <div className="navbar-container d-flex align-items-center justify-content-between">
        
        <div className="glass-navbar brand-glass d-flex align-items-center">
          <Link
            className="navbar-brand d-flex align-items-center gap-3 mb-0"
            to="/"
          >
            <img
              src={logo}
              alt="Climatrix Logo"
              height="52"
            />
            <span className="brand-gradient fw-bold fs-4">
              CLIMATRIX <span style={{ color: "#00FF41" }}>SL</span>
            </span>
          </Link>
        </div>

        <nav className="glass-navbar nav-glass navbar navbar-expand-lg navbar-dark px-4">
          <button
            className="navbar-toggler ms-auto"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#mainNavbar"
            aria-controls="mainNavbar"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="mainNavbar">
            <ul className="navbar-nav ms-auto gap-lg-3">
              <li className="nav-item">
                <NavLink
                  to="/"
                  end
                  className={({ isActive }) =>
                    `nav-link custom-nav-link ${isActive ? "active-nav" : ""}`
                  }
                >
                  <FaHome size={14} /> Home
                </NavLink>
              </li>

              <li className="nav-item">
                <NavLink
                  to="/about"
                  className={({ isActive }) =>
                    `nav-link custom-nav-link ${isActive ? "active-nav" : ""}`
                  }
                >
                  <FaInfoCircle size={14} /> About
                </NavLink>
              </li>

              <li className="nav-item">
                <NavLink
                  to="/login"
                  className={({ isActive }) =>
                    `nav-link custom-nav-link ${isActive ? "active-nav" : ""}`
                  }
                >
                  <FaSignInAlt size={14} /> Login
                </NavLink>
              </li>

              <li className="nav-item">
                <NavLink
                  to="/register"
                  className={({ isActive }) =>
                    `nav-link custom-nav-link ${isActive ? "active-nav" : ""}`
                  }
                >
                  <FaUserPlus size={14} /> Register
                </NavLink>
              </li>
            </ul>
          </div>
        </nav>

      </div>
    </div>
  );
};

export default Navbar;
