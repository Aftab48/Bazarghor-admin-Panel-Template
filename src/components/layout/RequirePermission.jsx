import { Result, Button, Spin } from "antd";
import { useAuth } from "../../hooks/useAuth";
import { usePermissions } from "../../hooks/usePermissions";

function RequirePermission({ children, requiredPermissions = [], requireAll = false }) {
  const { isAuthenticated, loading } = useAuth();
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();

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
    return (
      <Result
        status="403"
        title="Authentication Required"
        subTitle="Please login to access this page."
        extra={
          <Button type="primary" href="/login">
            Go to Login
          </Button>
        }
      />
    );
  }

  // If no permissions required, allow access
  if (!requiredPermissions || requiredPermissions.length === 0) {
    return children;
  }

  // Check permissions
  const hasAccess = requireAll
    ? hasAllPermissions(requiredPermissions)
    : hasAnyPermission(requiredPermissions);

  if (!hasAccess) {
    return (
      <Result
        status="403"
        title="Access Denied"
        subTitle="You do not have the required permissions to view this page."
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

export default RequirePermission;

