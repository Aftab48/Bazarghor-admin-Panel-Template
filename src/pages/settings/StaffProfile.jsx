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

const StaffProfile = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pwdSaving, setPwdSaving] = useState(false);
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [pwdForm] = Form.useForm();
  const [staff, setStaff] = useState(null);
  const role =
    (typeof window !== "undefined" && localStorage.getItem("userRole")) ||
    "ADMIN";
  const [isSubAdmin, setIsSubAdmin] = useState(role === "SUB_ADMIN");

  useEffect(() => {
    (async () => {
      try {
        let resp;
        // Prefer sub-admin endpoint first to avoid hitting admin by mistake
        try {
          resp = await apiClient.get(ENDPOINTS.STAFF_SUB_ADMIN_PROFILE);
          setIsSubAdmin(true);
        } catch (e1) {
          resp = await apiClient.get(ENDPOINTS.STAFF_ADMIN_PROFILE);
          setIsSubAdmin(false);
        }
        const raw = resp?.data;
        const data = raw?.data || raw || resp;
        setStaff(data);
        form.setFieldsValue({
          firstName: data?.firstName || "",
          lastName: data?.lastName || "",
          email: data?.email || "",
          mobNo: data?.mobNo || "",
        });
      } catch (e) {
        message.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    })();
  }, [form]);

  const onSaveProfile = async (values) => {
    setSaving(true);
    try {
      const payload = {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        mobNo: values.mobNo,
      };
      const endpoint = isSubAdmin
        ? ENDPOINTS.STAFF_SUB_UPDATE_SELF
        : ENDPOINTS.STAFF_UPDATE_SELF;
      await apiClient.put(endpoint, payload);
      message.success("Profile updated");
      setStaff((prev) => ({ ...prev, ...payload }));
    } catch (e) {
      message.error(e?.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const onChangePassword = async (values) => {
    const id = staff?.id || staff?._id;
    if (!id) return message.error("Missing user id");
    if (values.newPassword !== values.confirmPassword) {
      message.error("Passwords do not match");
      return;
    }
    setPwdSaving(true);
    try {
      const body = {
        oldPassword: values.currentPassword,
        newPassword: values.newPassword,
      };
      const endpoint = isSubAdmin
        ? ENDPOINTS.STAFF_SUB_ADMIN_CHANGE_PASSWORD(id)
        : ENDPOINTS.STAFF_ADMIN_CHANGE_PASSWORD(id);
      await apiClient.post(endpoint, body);
      message.success("Password changed");
      pwdForm.resetFields();
    } catch (e) {
      message.error(e?.response?.data?.message || "Password change failed");
    } finally {
      setPwdSaving(false);
    }
  };

  const avatarSrc = staff?.profilePicture?.uri || "";

  const updateProfilePicture = async (profilePicture) => {
    if (!profilePicture) {
      message.error("Removal not supported by backend yet");
      return;
    }
    setAvatarSaving(true);
    try {
      const formData = new FormData();
      formData.append("profilePicture", profilePicture);
      const endpoint = isSubAdmin
        ? ENDPOINTS.STAFF_SUB_UPDATE_SELF
        : ENDPOINTS.STAFF_UPDATE_SELF;
      await apiClient.put(endpoint, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      message.success("Profile picture updated");
      setStaff((prev) => ({ ...prev, profilePicture: { uri: "" } }));
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
    <Space
      direction="vertical"
      style={{
        width: "100%",
        background: "#f0f0f0",
        padding: "0 28px 28px 28px",
        color: "#3c2f3d",
      }}
      size="large"
    >
      <Card loading={loading}>
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
              style={{ boxShadow: "0 2px 6px rgba(0,0,0,0.15)" }}
            />
          </div>
          <div>
            <Title level={4} style={{ margin: 0 }}>
              {staff?.firstName || ""} {staff?.lastName || ""}
            </Title>
            <Text type="secondary">{staff?.email}</Text>
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
      <Card title="Change Password">
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
    </Space>
  );
};

export default StaffProfile;
