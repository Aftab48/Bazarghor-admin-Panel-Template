import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Form, Input, Button, Typography, Card, message, Alert } from "antd";
import apiClient from "../../services/api";
import logo from "../../assets/images/Logo.png";
import { ENDPOINTS } from "../../constants/endpoints";

const { Title } = Typography;

function StaffLogin() {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  useEffect(() => {
    const existing = localStorage.getItem("authToken");
    const role = localStorage.getItem("userRole");
    if (existing && role && role !== "SUPER_ADMIN") {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      setErrorMsg("");
      localStorage.removeItem("authToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("userRole");
      localStorage.removeItem("userId");

      const response = await apiClient.post(ENDPOINTS.STAFF_LOGIN, {
        email: values.email,
        password: values.password,
      });

      // Determine exact staff role (ADMIN vs SUB_ADMIN)
      let userRole = "ADMIN";
      const rawRole = (
        response?.data?.data?.role ||
        response?.data?.role ||
        response?.role ||
        response?.data?.user?.role ||
        ""
      )
        .toString()
        .toLowerCase();
      if (rawRole.includes("sub")) userRole = "SUB_ADMIN";
      else if (rawRole.includes("admin")) userRole = "ADMIN";
      else {
        try {
          const subProbe = await apiClient.get(
            ENDPOINTS.STAFF_SUB_ADMIN_PROFILE
          );
          if (subProbe?.status === 200) userRole = "SUB_ADMIN";
        } catch (_) {
          userRole = "ADMIN";
        }
      }

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

      localStorage.setItem("authToken", token);
      if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("userRole", userRole);

      // Fetch staff profile to store userId
      try {
        const profileEndpoint =
          userRole === "SUB_ADMIN"
            ? ENDPOINTS.STAFF_SUB_ADMIN_PROFILE
            : ENDPOINTS.STAFF_ADMIN_PROFILE;
        const profResp = await apiClient.get(profileEndpoint);
        const raw = profResp?.data;
        const data = raw?.data || raw || profResp;
        const id = data?.id || data?._id;
        if (id) localStorage.setItem("userId", id);
      } catch (e) {}

      message.success("Logged in successfully");
      navigate(from, { replace: true });
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
