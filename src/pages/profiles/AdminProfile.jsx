import { useEffect, useState } from "react";
import {
  Card,
  Form,
  Input,
  Button,
  Typography,
  Space,
  message,
  Avatar,
  Upload,
  Modal,
} from "antd";
import {
  UploadOutlined,
  DeleteOutlined,
  UserOutlined,
} from "@ant-design/icons";
import apiClient from "../../services/api";
import { ENDPOINTS } from "../../constants/endpoints";

const { Title, Text } = Typography;

// Admin-only profile page: strictly use super admin endpoints

const AdminProfile = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pwdSaving, setPwdSaving] = useState(false);
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [pwdForm] = Form.useForm();
  const [admin, setAdmin] = useState(null);
  const [role] = useState("SUPER_ADMIN");
  const [userId, setUserId] = useState(localStorage.getItem("userId") || null);

  useEffect(() => {
    (async () => {
      try {
        const resp = await apiClient.get(ENDPOINTS.SUPER_ADMIN_PROFILE);
        const raw = resp?.data;
        const data = raw?.data || raw || resp;

        const idFromData = data?.id || data?._id;
        if (idFromData && !userId) {
          setUserId(idFromData);
          localStorage.setItem("userId", idFromData);
        }

        setAdmin(data);
        form.setFieldsValue({
          firstName: data?.firstName || "",
          lastName: data?.lastName || "",
          email: data?.email || "",
          mobNo: data?.mobNo || "",
          profilePictureUri: data?.profilePicture?.uri || "",
        });
      } catch (e) {
        message.error(e?.response?.data?.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    })();
  }, [form, role, userId]);

  const onSaveProfile = async (values) => {
    // Admin only
    const endpoint = ENDPOINTS.SUPER_ADMIN_UPDATE;

    setSaving(true);
    try {
      const payload = {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        mobNo: values.mobNo,
      };
      if (values.profilePictureUri) {
        payload.profilePicture = { uri: values.profilePictureUri.trim() };
      }

      await apiClient.put(endpoint, payload);
      message.success("Profile updated");
      setAdmin((prev) => ({
        ...prev,
        ...payload,
      }));
    } catch (e) {
      message.error(e?.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const onChangePassword = async (values) => {
    const id = userId || admin?.id || admin?._id;
    if (!id) return message.error("Missing user id");

    if (values.newPassword !== values.confirmPassword) {
      message.error("Passwords do not match");
      return;
    }

    const endpoint = ENDPOINTS.SUPER_ADMIN_CHANGE_PASSWORD(id);

    setPwdSaving(true);
    try {
      const body = {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      };

      await apiClient.post(endpoint, body);
      message.success("Password changed");
      pwdForm.resetFields();
    } catch (e) {
      message.error(e?.response?.data?.message || "Password change failed");
    } finally {
      setPwdSaving(false);
    }
  };

  const avatarSrc = admin?.profilePicture?.uri || "";

  const updateProfilePicture = async (profilePicture) => {
    if (!profilePicture) {
      message.error("Removal not supported by backend yet");
      return;
    }
    setAvatarSaving(true);
    try {
      const formData = new FormData();
      formData.append("profilePicture", profilePicture);
      await apiClient.put(ENDPOINTS.SUPER_ADMIN_UPDATE, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      message.success("Profile picture updated");
      setAdmin((prev) => ({ ...prev, profilePicture: { uri: "" } }));
      setAvatarModalVisible(false);
    } catch (e) {
      message.error(e?.response?.data?.message || "Failed to update picture");
    } finally {
      setAvatarSaving(false);
    }
  };

  const onRemoveAvatar = async () => {
    message.error("Backend removal not implemented (needs server support)");
  };

  const beforeUpload = async (file) => {
    await updateProfilePicture(file);
    return false; // prevent default upload
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Card
        loading={loading}
        style={{ boxShadow: "0 0 14px rgba(0,0,0,0.09)", borderRadius: 8 }}
        bodyStyle={{ padding: "clamp(16px, 2vw, 24px)" }}
      >
        <Space align="center" size={16} style={{ marginBottom: 16 }}>
          <div
            style={{
              position: "relative",
              width: 72,
              height: 72,
              cursor: "pointer",
            }}
            onClick={() => setAvatarModalVisible(true)}
          >
            <Avatar
              size={72}
              src={avatarSrc}
              icon={<UserOutlined />}
              style={{ boxShadow: "0 0 14px rgba(0,0,0,0.09)" }}
            />
          </div>
          <div>
            <Title level={4} style={{ margin: 0 }}>
              {admin?.firstName || ""} {admin?.lastName || ""}
            </Title>
            <Text type="secondary">{admin?.email}</Text>
          </div>
        </Space>
        <Form form={form} layout="vertical" onFinish={onSaveProfile}>
          <Form.Item
            name="firstName"
            label="First Name"
            rules={[{ required: true, message: "Please enter first name" }]}
          >
            <Input placeholder="Enter first name" />
          </Form.Item>
          <Form.Item
            name="lastName"
            label="Last Name"
            rules={[{ required: true, message: "Please enter last name" }]}
          >
            <Input placeholder="Enter last name" />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, type: "email", message: "Enter valid email" },
            ]}
          >
            <Input placeholder="Enter email" />
          </Form.Item>
          <Form.Item name="mobNo" label="Mobile Number">
            <Input placeholder="Enter mobile number" />
          </Form.Item>

          <Button
            style={{
              background: "#9dda52",
              color: "#3c2f3d",
              fontWeight: "bold",
            }}
            htmlType="submit"
            loading={saving}
          >
            Save Changes
          </Button>
        </Form>
      </Card>

      <Card
        title="Change Password"
        style={{ boxShadow: "0 0 14px rgba(0,0,0,0.09)", borderRadius: 8 }}
        bodyStyle={{ padding: "clamp(16px, 2vw, 24px)" }}
      >
        <Form form={pwdForm} layout="vertical" onFinish={onChangePassword}>
          <Form.Item
            name="currentPassword"
            label="Current Password"
            rules={[
              { required: true, message: "Please enter current password" },
            ]}
          >
            <Input.Password placeholder="Current password" />
          </Form.Item>
          <Form.Item
            name="newPassword"
            label="New Password"
            rules={[
              { required: true, message: "Please enter new password" },
              { min: 6, message: "Minimum 6 characters" },
            ]}
          >
            <Input.Password placeholder="New password" />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="Confirm Password"
            dependencies={["newPassword"]}
            rules={[{ required: true, message: "Please confirm password" }]}
          >
            <Input.Password placeholder="Confirm new password" />
          </Form.Item>
          <Button
            style={{
              background: "#9dda52",
              color: "#3c2f3d",
              fontWeight: "bold",
            }}
            htmlType="submit"
            loading={pwdSaving}
          >
            Update Password
          </Button>
        </Form>
      </Card>
      <Modal
        open={avatarModalVisible}
        onCancel={() => setAvatarModalVisible(false)}
        footer={null}
        centered
        title="Manage Profile Picture"
      >
        <Space
          direction="vertical"
          style={{ width: "100%" }}
          size="middle"
          align="center"
        >
          <Avatar size={120} src={avatarSrc} icon={<UserOutlined />} />
          <Upload
            showUploadList={false}
            beforeUpload={beforeUpload}
            accept="image/*"
          >
            <Button
              icon={<UploadOutlined />}
              loading={avatarSaving}
              style={{ background: "#9dda52", color: "#3c2f3d" }}
            >
              Upload New
            </Button>
          </Upload>
          <Button
            icon={<DeleteOutlined />}
            danger
            onClick={onRemoveAvatar}
            loading={avatarSaving}
          >
            Remove Picture
          </Button>
        </Space>
      </Modal>
    </div>
  );
};

export default AdminProfile;
