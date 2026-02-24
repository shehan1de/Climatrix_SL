import { Navigate } from "react-router-dom";
import { getAuthUser, isAuthenticated } from "../utils/auth";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const user = getAuthUser();

  if (!isAuthenticated() || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
