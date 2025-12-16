import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Form,
  Input,
  Button,
  Typography,
  Card,
  message,
  Alert,
  Radio,
} from "antd";
import apiClient from "../../services/api";
import logo from "../../assets/images/Logo.png";
import { ENDPOINTS } from "../../constants/endpoints";
import { useAuth } from "../../hooks/useAuth";
import { ROLES } from "../../constants/permissions";

const { Title } = Typography;

function Login() {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  // Login type: "super_admin" uses /admin/login, "staff" uses /staff/login (for both ADMIN and SUB_ADMIN)
  const [loginType, setLoginType] = useState("super_admin");
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  // Get auth context
  const { login, isAuthenticated, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      setErrorMsg("");

      let response;
      let userRoles = [];
      let userPermissions = [];
      let userId = null;

      // Call appropriate login endpoint based on login type
      // Note: For staff login, backend automatically determines if user is ADMIN or SUB_ADMIN
      if (loginType === "super_admin") {
        // Super Admin login - uses /admin/login endpoint
        response = await apiClient.post(ENDPOINTS.SUPER_ADMIN_LOGIN, {
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
            response?.headers?.authorization ||
            response?.headers?.Authorization;
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
        userRoles = responseData?.roles || [ROLES.SUPER_ADMIN];
        userPermissions = responseData?.permissions || [];

        // Fetch super admin profile to get userId
        try {
          const profResp = await apiClient.get(ENDPOINTS.SUPER_ADMIN_PROFILE);
          const raw = profResp?.data;
          const data = raw?.data || raw || profResp;
          userId = data?.id || data?._id;
        } catch {}

        // Use AuthContext login method
        login({
          token,
          refreshToken,
          roles: Array.isArray(userRoles)
            ? userRoles
            : [userRoles].filter(Boolean),
          permissions: Array.isArray(userPermissions) ? userPermissions : [],
          user: userId ? { id: userId } : null,
        });

        message.success("Logged in successfully");
        setTimeout(() => {
          navigate(from, { replace: true });
        }, 100);
      } else {
        // Staff login - uses /staff/login endpoint
        // Backend automatically determines if user is ADMIN or SUB_ADMIN from database
        response = await apiClient.post(ENDPOINTS.STAFF_LOGIN, {
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
            response?.headers?.authorization ||
            response?.headers?.Authorization;
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
        userRoles = responseData?.roles || [];

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
              // Backend should return role, but if not, default to ADMIN
              userRoles = [ROLES.ADMIN];
            }
          }
        }

        userPermissions = responseData?.permissions || [];

        // Fetch staff profile to get userId
        try {
          const profileEndpoint = userRoles.includes(ROLES.SUB_ADMIN)
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
          roles: Array.isArray(userRoles)
            ? userRoles
            : [userRoles].filter(Boolean),
          permissions: Array.isArray(userPermissions) ? userPermissions : [],
          user: userId ? { id: userId } : null,
        });

        message.success("Logged in successfully");
        setTimeout(() => {
          navigate(from, { replace: true });
        }, 100);
      }
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401 || status === 400) {
        setErrorMsg("Incorrect Credentials");
      } else {
        setErrorMsg(err?.response?.data?.message || "Login failed");
      }
    } finally {
      setLoading(false);
    }
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
          Admin Login
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
          requiredMark={false}
          validateTrigger={["onSubmit"]}
        >
          <Form.Item label="Login As" required style={{ marginBottom: 16 }}>
            <Radio.Group
              value={loginType}
              onChange={(e) => setLoginType(e.target.value)}
              style={{ width: "100%" }}
            >
              <Radio.Button
                value="super_admin"
                style={{ flex: 1, textAlign: "center" }}
              >
                Super Admin
              </Radio.Button>
              <Radio.Button
                value="staff"
                style={{ flex: 1, textAlign: "center" }}
              >
                Staff (Admin/Sub Admin)
              </Radio.Button>
            </Radio.Group>
            <div style={{ fontSize: "12px", color: "#666", marginTop: 4 }}>
              {loginType === "staff" &&
                "Backend will determine your role (Admin or Sub Admin) from your account"}
            </div>
          </Form.Item>

          <Form.Item
            name="email"
            normalize={(v) => (v || "").trim()}
            rules={[
              { required: true, message: "Please enter email" },
              { type: "email", message: "Please enter a valid email" },
            ]}
          >
            <Input placeholder="admin@example.com" autoComplete="email" />
          </Form.Item>
          <Form.Item
            name="password"
            normalize={(v) => (v || "").trim()}
            rules={[{ required: true, message: "Please enter password" }]}
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

export default Login;
