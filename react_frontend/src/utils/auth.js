export const getAuthUser = () => {
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");

  if (!token || !user) return null;

  try {
    return JSON.parse(user);
  } catch {
    return null;
  }
};

export const isAuthenticated = () => {
  return !!localStorage.getItem("token");
};
export const logout = (navigate) => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");

  if (navigate) {
    navigate("/login");
  } else {
    window.location.href = "/login";
  }
};