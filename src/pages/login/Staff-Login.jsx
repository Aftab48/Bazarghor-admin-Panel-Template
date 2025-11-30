import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Form, Input, Button, Typography, Card, message, Alert } from "antd";
import apiClient from "../../services/api";
import logo from "../../assets/images/Logo.png";
import { ENDPOINTS } from "../../constants/endpoints";
import { useAuth } from "../../hooks/useAuth";
import { ROLES } from "../../constants/permissions";

const { Title } = Typography;

function StaffLogin() {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  // Get auth context - will throw error if not in AuthProvider, but that's expected
  const { login, isAuthenticated, roles = [], loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && isAuthenticated && roles.length > 0 && !roles.includes(ROLES.SUPER_ADMIN)) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, roles, authLoading, navigate]);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      setErrorMsg("");

      const response = await apiClient.post(ENDPOINTS.STAFF_LOGIN, {
        email: values.email,
        password: values.password,
      });

      // Extract token
      let token =
        response?.data?.data?.token ||
        response?.data?.token ||
        response?.token ||
        response?.data?.authToken ||
        response?.data?.Authorization ||
        response?.data?.authorization;
      const refreshToken =
        response?.data?.data?.refreshToken || response?.data?.refreshToken;
      if (!token) {
        const authHeader =
          response?.headers?.authorization || response?.headers?.Authorization;
        if (authHeader) {
          const val = String(authHeader).trim();
          token = val.toLowerCase().startsWith("bearer ")
            ? val.split(" ")[1]
            : val;
        }
      }
      if (!token) {
        message.error("Login failed: token missing");
        setErrorMsg(
          "Login succeeded but token not provided. Please ensure backend returns token or Authorization header."
        );
        return;
      }

      // Extract roles and permissions from response
      const responseData = response?.data?.data || response?.data || response;
      let userRoles = responseData?.roles || [];
      
      // Determine exact staff role (ADMIN vs SUB_ADMIN) if not in response
      if (!userRoles || userRoles.length === 0) {
        const rawRole = (
          responseData?.role ||
          response?.role ||
          responseData?.user?.role ||
          ""
        )
          .toString()
          .toLowerCase();
        if (rawRole.includes("sub")) {
          userRoles = [ROLES.SUB_ADMIN];
        } else if (rawRole.includes("admin")) {
          userRoles = [ROLES.ADMIN];
        } else {
          // Try to determine by checking profile endpoint
          try {
            const subProbe = await apiClient.get(
              ENDPOINTS.STAFF_SUB_ADMIN_PROFILE
            );
            if (subProbe?.status === 200) {
              userRoles = [ROLES.SUB_ADMIN];
            } else {
              userRoles = [ROLES.ADMIN];
            }
          } catch (_) {
            userRoles = [ROLES.ADMIN];
          }
        }
      }
      
      const userPermissions = responseData?.permissions || [];

      // Fetch staff profile to get userId
      let userId = null;
      try {
        const profileEndpoint =
          userRoles.includes(ROLES.SUB_ADMIN)
            ? ENDPOINTS.STAFF_SUB_ADMIN_PROFILE
            : ENDPOINTS.STAFF_ADMIN_PROFILE;
        const profResp = await apiClient.get(profileEndpoint);
        const raw = profResp?.data;
        const data = raw?.data || raw || profResp;
        userId = data?.id || data?._id;
      } catch (e) {}

      // Use AuthContext login method
      login({
        token,
        refreshToken,
        roles: Array.isArray(userRoles) ? userRoles : [userRoles].filter(Boolean),
        permissions: Array.isArray(userPermissions) ? userPermissions : [],
        user: userId ? { id: userId } : null,
      });

      message.success("Logged in successfully");
      
      // Wait for state to update before navigating
      // Use setTimeout to ensure React state has updated
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 100);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401 || status === 400) {
        setErrorMsg("Incorrect Credintial");
      } else {
        setErrorMsg(err?.response?.data?.message || "Login failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const onFinishFailed = (info) => {
    console.log("Staff login validation failed:", info);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f5f7fa",
        padding: 24,
      }}
    >
      <Card style={{ width: 400, boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: 12,
          }}
        >
          <img
            src={logo}
            alt="Bazarghor Logo"
            style={{ height: 56, objectFit: "contain" }}
          />
        </div>
        <Title
          level={3}
          style={{ textAlign: "center", marginBottom: 8, fontWeight: "bold" }}
        >
          Staff Login
        </Title>
        {errorMsg ? (
          <Alert
            type="error"
            showIcon
            message={errorMsg}
            style={{ marginBottom: 16 }}
          />
        ) : null}
        <Form
          layout="vertical"
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
          requiredMark={false}
          validateTrigger={["onSubmit"]}
        >
          <Form.Item
            name="email"
            label="Email"
            rules={[
              {
                required: true,
                validator: (_, value) => {
                  const v = (value || "").trim();
                  if (!v)
                    return Promise.reject(new Error("Please enter email"));
                  return Promise.resolve();
                },
              },
            ]}
          >
            <Input placeholder="staff@example.com" autoComplete="email" />
          </Form.Item>
          <Form.Item
            name="password"
            label="Password"
            rules={[
              {
                required: true,
                validator: (_, value) => {
                  const v = (value || "").trim();
                  if (!v)
                    return Promise.reject(new Error("Please enter password"));
                  return Promise.resolve();
                },
              },
            ]}
          >
            <Input.Password
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </Form.Item>
          <Button
            htmlType="submit"
            block
            loading={loading}
            style={{
              marginTop: 8,
              color: "#3c2f3d",
              backgroundColor: "#9dda52",
            }}
          >
            Login
          </Button>
          <div style={{ marginTop: 12, textAlign: "center" }}>
            <a href="/forgot-password" style={{ color: "#3c2f3d" }}>
              Forgot password?
            </a>
          </div>
        </Form>
      </Card>
    </div>
  );
}

export default StaffLogin;
