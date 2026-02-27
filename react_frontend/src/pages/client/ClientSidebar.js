import { useEffect, useMemo, useState } from "react";
import { FaSignOutAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";

const ClientNavbar = () => {
  const navigate = useNavigate();
  const [showConfirm, setShowConfirm] = useState(false);

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const refresh = () => {
      try {
        setUser(JSON.parse(localStorage.getItem("user")) || null);
      } catch {
        setUser(null);
      }
    };

    window.addEventListener("userUpdated", refresh);
    return () => window.removeEventListener("userUpdated", refresh);
  }, []);

  const profilePicPath = useMemo(() => {
    return user?.profilePicture
      ? `/${String(user.profilePicture).replace(/^\/+/, "")}`
      : "https://via.placeholder.com/50";
  }, [user?.profilePicture]);

  const handleProfileRedirect = () => {
    if (user?.role === "Admin") {
      navigate("/admin/profile");
    } else {
      navigate("/client/profile");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <>
      <div className="navbar-wrapper position-absolute w-100">
        <div className="navbar-container d-flex align-items-center justify-content-between">
          <div className="glass-navbar brand-glass d-flex align-items-center">
            <img src={logo} alt="Climatrix Logo" height="52" />
            <span className="brand-gradient fw-bold fs-4 ms-2">
              CLIMATRIX <span style={{ color: "#00FF41" }}>SL</span>
            </span>
          </div>
          <div
            className="glass-navbar nav-glass d-flex align-items-center gap-3 px-3 py-1 profile-clickable"
            onClick={handleProfileRedirect}
            style={{ cursor: "pointer" }}
          >
            <img
              src={profilePicPath}
              alt={user?.name || "Profile"}
              className="rounded-circle"
              style={{
                width: "50px",
                height: "50px",
                objectFit: "cover",
                border: "2px solid #00FF41",
              }}
              onError={(e) => {
                e.currentTarget.src = "https://via.placeholder.com/50";
              }}
            />

            <div className="d-flex flex-column">
              <span className="fw-bold text-white">{user?.name || "—"}</span>
              <span className="text-white-50" style={{ fontSize: "0.85rem" }}>
                {user?.email || "—"}
              </span>
            </div>

            <button
              className="btn btn-danger d-flex align-items-center gap-1"
              onClick={(e) => {
                e.stopPropagation();
                setShowConfirm(true);
              }}
            >
              <FaSignOutAlt /> Logout
            </button>
          </div>
        </div>
      </div>

      {showConfirm && (
        <div className="modal d-block logout-overlay">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content logout-glass-card text-white">
              <div className="modal-header border-0">
                <h5 className="modal-title fw-bold">Confirm Logout</h5>
              </div>

              <div className="modal-body">
                <p className="mb-0">Are you sure you want to logout?</p>
              </div>

              <div className="modal-footer border-0">
                <button
                  className="btn btn-outline-light"
                  onClick={() => setShowConfirm(false)}
                >
                  No
                </button>

                <button className="btn btn-danger" onClick={handleLogout}>
                  Yes, Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ClientNavbar;