import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Form, Input, Button, Typography, Alert, message } from "antd";
import { adminAPI, staffAuthAPI } from "../../services/api";

const { Title, Paragraph } = Typography;

const ForgotPassword = () => {
  const [stage, setStage] = useState("email"); // 'email' | 'reset'
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [infoMsg, setInfoMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  const sendReset = async ({ email }) => {
    setLoading(true);
    setErrorMsg("");
    try {
      setEmail(email);
      try {
        await adminAPI.forgotPassword(email);
        setInfoMsg("Reset password OTP has been sent to your email.");
        setStage("reset");
      } catch (adminErr) {
        const adminStatus = adminErr?.response?.status;
        if (adminStatus === 404 || adminStatus === 400 || adminStatus === 401) {
          // Fallback to Staff
          await staffAuthAPI.forgotPassword(email);
          setInfoMsg("Reset password OTP has been sent to your email.");
          setStage("reset");
        } else {
          throw adminErr;
        }
      }
    } catch (e) {
      const status = e?.response?.status;
      if (status === 404 || status === 400) {
        setErrorMsg(e?.response?.data?.message || "Email not found or invalid");
      } else {
        setErrorMsg(e?.response?.data?.message || "Failed to send reset OTP");
      }
    } finally {
      setLoading(false);
    }
  };

  const submitReset = async ({ otp, newPassword }) => {
    setLoading(true);
    setErrorMsg("");
    try {
      // Try Super Admin reset first, then Staff
      try {
        await adminAPI.resetPassword({ email, otp, newPassword });
      } catch (adminErr) {
        const adminStatus = adminErr?.response?.status;
        if (adminStatus === 404 || adminStatus === 400 || adminStatus === 401) {
          await staffAuthAPI.resetPassword({ email, otp, newPassword });
        } else {
          throw adminErr;
        }
      }
      message.success("Your password changed successfully");
      navigate("/login", { replace: true });
    } catch (e) {
      const status = e?.response?.status;
      if (status === 400 || status === 401) {
        setErrorMsg(e?.response?.data?.message || "Invalid OTP or password");
      } else {
        setErrorMsg(e?.response?.data?.message || "Password reset failed");
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
        background: "#f0f0f0",
        padding: 24,
        color: "#3c2f3d",
      }}
    >
      <Card
        style={{
          width: 420,
          boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
          color: "#3c2f3d",
        }}
      >
        <Title level={3} style={{ textAlign: "center", marginBottom: 8 }}>
          Forgot Password
        </Title>
        <Paragraph style={{ textAlign: "center", marginBottom: 16 }}>
          Enter your email to receive an OTP, then reset your password.
        </Paragraph>
        {infoMsg ? (
          <Alert
            type="info"
            showIcon
            message={infoMsg}
            style={{ marginBottom: 12, color: "#3c2f3d" }}
          />
        ) : null}
        {errorMsg ? (
          <Alert
            type="error"
            showIcon
            message={errorMsg}
            style={{ marginBottom: 12, color: "#3c2f3d" }}
          />
        ) : null}

        {stage === "email" && (
          <Form layout="vertical" onFinish={sendReset} requiredMark={false}>
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: "Please enter email" },
                { type: "email", message: "Invalid email address" },
              ]}
            >
              <Input placeholder="admin@example.com" autoComplete="email" />
            </Form.Item>
            <Button
              style={{
                background: "#9dda52",
                color: "#3c2f3d",
                border: "0.2px solid #3c2f3d",
              }}
              htmlType="submit"
              block
              loading={loading}
            >
              Send OTP
            </Button>
          </Form>
        )}

        {stage === "reset" && (
          <Form layout="vertical" onFinish={submitReset} requiredMark={false}>
            <Form.Item label="Email">
              <Input value={email} disabled />
            </Form.Item>
            <Form.Item
              name="otp"
              label="OTP"
              rules={[{ required: true, message: "Please enter OTP" }]}
            >
              <Input placeholder="Enter OTP" />
            </Form.Item>
            <Form.Item
              name="newPassword"
              label="New Password"
              rules={[
                { required: true, message: "Please enter new password" },
                { min: 6, message: "Minimum 6 characters" },
              ]}
            >
              <Input.Password
                placeholder="New password"
                autoComplete="new-password"
              />
            </Form.Item>
            <Button
              style={{
                background: "#9dda52",
                color: "#3c2f3d",
                border: "0.2px solid #3c2f3d",
              }}
              htmlType="submit"
              block
              loading={loading}
            >
              Reset Password
            </Button>
            <Button
              style={{ marginTop: 8 }}
              block
              onClick={() => setStage("email")}
            >
              Back
            </Button>
          </Form>
        )}
      </Card>
    </div>
  );
};

export default ForgotPassword;
