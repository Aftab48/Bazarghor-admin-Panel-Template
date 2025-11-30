import { Navigate, useLocation } from "react-router-dom";
import { Spin } from "antd";
import { useAuth } from "../../hooks/useAuth";
import { ROLES } from "../../constants/permissions";

function RequireAuth({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Check localStorage as fallback (in case state hasn't updated yet after login)
    const storedToken = localStorage.getItem("authToken");
    
    if (storedToken) {
      // Token exists but state not updated yet, show loading
      return (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "100vh",
          }}
        >
          <Spin size="large" />
        </div>
      );
    }
    
    // Always redirect to unified login page
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

export default RequireAuth;
