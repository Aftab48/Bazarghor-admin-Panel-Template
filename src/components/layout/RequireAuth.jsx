import { Navigate, useLocation } from "react-router-dom";

function RequireAuth({ children }) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

export default RequireAuth;
