import { Navigate, useLocation } from "react-router-dom";
import { Result, Button, Spin } from "antd";
import { useAuth } from "../../hooks/useAuth";

function RequireRole({ children, allowedRoles = [] }) {
  const { isAuthenticated, hasRole, loading } = useAuth();
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
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Check if user has any of the allowed roles
  const hasRequiredRole = allowedRoles.length === 0 || allowedRoles.some(role => hasRole(role));

  if (!hasRequiredRole) {
    return (
      <Result
        status="403"
        title="Access Denied"
        subTitle="You do not have permission to view this page."
        extra={
          <Button type="primary" href="/">
            Go Home
          </Button>
        }
      />
    );
  }

  return children;
}

export default RequireRole;
