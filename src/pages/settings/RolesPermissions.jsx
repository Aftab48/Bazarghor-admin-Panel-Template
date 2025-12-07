import { useState, useEffect, useMemo } from "react";
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Checkbox,
  message,
  Tag,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  TeamOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { settingsAPI } from "../../services/api";

const RolesPermissions = () => {
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [form] = Form.useForm();

  const allPermissions = [
    { key: "users", label: "User Management" },
    { key: "vendors", label: "Vendor Management" },
    { key: "agents", label: "Delivery Agent Management" },
    { key: "products", label: "Product Management" },
    { key: "orders", label: "Order Management" },
    { key: "transactions", label: "Payments & Transactions" },
    { key: "promotions", label: "Promotions & Banners" },
    { key: "analytics", label: "Analytics & Reports" },
    { key: "settings", label: "System Settings" },
    { key: "tickets", label: "Support Tickets" },
    { key: "audit", label: "Audit Logs" },
  ];

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const data = await settingsAPI.getRoles();
      setRoles(data || []);
      setPagination((prev) => ({
        ...prev,
        total: Array.isArray(data) ? data.length : 0,
      }));
    } catch (error) {
      message.error("Failed to fetch roles");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingRole(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (role) => {
    setEditingRole(role);
    form.setFieldsValue(role);
    setModalVisible(true);
  };

  const handleSubmit = async (values) => {
    message.success(`Role ${editingRole ? "updated" : "created"} successfully`);
    setModalVisible(false);
    fetchRoles();
  };

  const getRoleColor = (role) => {
    const key = String(role || "").toUpperCase();
    if (key === "SUPER ADMIN" || key === "SUPER_ADMIN") return "#4096ff";
    if (key === "ADMIN") return "#9dda52";
    if (key === "SUB ADMIN" || key === "SUB_ADMIN") return "#ffbc2c";
    return "#d9d9d9";
  };

  const filteredRoles = useMemo(() => {
    const term = searchText.trim().toLowerCase();
    if (!term) return roles;
    return roles.filter((r) => (r?.name || "").toLowerCase().includes(term));
  }, [roles, searchText]);

  const columns = [
    {
      title: "Role Name",
      dataIndex: "name",
      key: "name",
      render: (text) => (
        <Space>
          <TeamOutlined />
          <span className="font-medium">{text}</span>
        </Space>
      ),
    },
    {
      title: "Permissions",
      dataIndex: "permissions",
      key: "permissions",
      render: (permissions) => {
        if (!permissions || !Array.isArray(permissions)) {
          return <Tag>No permissions</Tag>;
        }
        return (
          <div className="flex flex-wrap gap-1">
            {permissions.includes("all") ? (
              <Tag color="blue">All Permissions</Tag>
            ) : (
              permissions.map((perm) => <Tag key={perm}>{perm}</Tag>)
            )}
          </div>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          {record.name !== "Super Admin" && (
            <Button size="small" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div
      style={{
        padding: "clamp(16px, 2vw, 24px)",
        background: "#f0f0f0",
        minHeight: "100vh",
      }}
    >
      <div
        style={{
          background: "#ffffff",
          padding: "clamp(16px, 2vw, 24px)",
          borderRadius: "8px",
          marginBottom: "20px",
        }}
      >
        <div
          className="flex justify-between items-center mb-6"
          style={{
            flexWrap: "wrap",
            gap: 12,
            rowGap: 12,
            alignItems: "flex-start",
          }}
        >
          <h1
            style={{
              fontSize: "24px",
              fontWeight: "bold",
              color: "#3c2f3d",
              margin: 0,
            }}
          >
            Roles & Permissions
          </h1>
          <div
            className="flex items-center gap-3"
            style={{
              flexWrap: "nowrap",
              gap: 12,
              justifyContent: "flex-end",
              flexShrink: 1,
            }}
          >
            <Input
              placeholder="Search roles..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: "100%", maxWidth: 320 }}
              size="large"
              allowClear
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
              style={{ background: "#9dda52", color: "#3c2f3d" }}
            >
              Add Role
            </Button>
          </div>
        </div>
      </div>

      <div
        style={{
          background: "#ffffff",
          padding: "clamp(16px, 2vw, 24px)",
          borderRadius: "8px",
        }}
      >
        <Table
          columns={columns}
          dataSource={filteredRoles}
          rowKey={(r) => r.id || r._id || r.name}
          loading={loading}
          pagination={{
            ...pagination,
            total: filteredRoles?.length || 0,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} roles`,
            onChange: (current, pageSize) =>
              setPagination((prev) => ({ ...prev, current, pageSize })),
          }}
        />
      </div>

      <Modal
        title={editingRole ? "Edit Role" : "Add Role"}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        okText="Save"
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="name"
            label="Role Name"
            rules={[{ required: true, message: "Please enter role name" }]}
          >
            <Input placeholder="e.g., Support Manager" />
          </Form.Item>
          <Form.Item
            name="permissions"
            label="Permissions"
            rules={[
              {
                required: true,
                message: "Please select at least one permission",
              },
            ]}
          >
            <Checkbox.Group>
              <div className="grid grid-cols-2 gap-2">
                {allPermissions.map((perm) => (
                  <Checkbox key={perm.key} value={perm.key}>
                    {perm.label}
                  </Checkbox>
                ))}
              </div>
            </Checkbox.Group>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default RolesPermissions;
