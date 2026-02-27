import { useState } from "react";
import {
  FaBell,
  FaHistory,
  FaHome,
  FaQuestionCircle,
  FaSignOutAlt,
  FaUserCircle,
  FaUsers
} from "react-icons/fa";
import { NavLink, useNavigate } from "react-router-dom";

const AdminSidebar = () => {
  const navigate = useNavigate();
  const [showConfirm, setShowConfirm] = useState(false);

  const navItems = [
    { to: "/admin/dashboard", label: "Dashboard", icon: <FaHome /> },
    { to: "/admin/users", label: "User Management", icon: <FaUsers /> },
    { to: "/admin/alerts", label: "Alert Management", icon: <FaBell /> },
    { to: "/admin/prediction-history", label: "Prediction History", icon: <FaHistory /> },
    { to: "/admin/questions", label: "Question Management", icon: <FaQuestionCircle /> },
    { to: "/admin/profile", label: "Profile", icon: <FaUserCircle /> }
  ];

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <>
      <aside className="client-glass-sidebar">
        <div className="client-glass-sidebar-inner">

          <div className="client-glass-nav-items">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `client-glass-nav-link ${isActive ? "is-active" : ""}`
                }
                title={item.label}
              >
                <span className="client-glass-nav-icon">{item.icon}</span>
                <span className="client-glass-nav-text">{item.label}</span>
              </NavLink>
            ))}
          </div>

          <div className="client-glass-nav-bottom">
            <button
              type="button"
              className="client-glass-nav-link logout"
              onClick={() => setShowConfirm(true)}
              title="Logout"
            >
              <span className="client-glass-nav-icon">
                <FaSignOutAlt />
              </span>
              <span className="client-glass-nav-text">Logout</span>
            </button>
          </div>
        </div>
      </aside>
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

export default AdminSidebar;