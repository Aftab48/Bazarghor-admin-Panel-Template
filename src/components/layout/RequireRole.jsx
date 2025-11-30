import { Navigate, useLocation } from "react-router-dom";
import { Result, Button } from "antd";

function RequireRole({ children, allowedRoles }) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
  const userRole =
    typeof window !== "undefined" ? localStorage.getItem("userRole") : null;
  const location = useLocation();

  if (!token) {
    // If not logged in, send to admin login by default
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!userRole || !allowedRoles.includes(userRole)) {
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
