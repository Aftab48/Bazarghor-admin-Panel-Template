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
  Typography,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  TeamOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { settingsAPI, rolesAPI } from "../../services/api";
import { PERMISSIONS } from "../../constants/permissions";

const { Title, Text } = Typography;

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
  const [selectedPermissions, setSelectedPermissions] = useState({});
  const [form] = Form.useForm();

  const allPermissions = [
    { key: PERMISSIONS.VIEW_ADMINS, label: "View Admins" },
    { key: PERMISSIONS.CREATE_ADMIN, label: "Create Admin" },
    { key: PERMISSIONS.UPDATE_ADMIN, label: "Update Admin" },
    { key: PERMISSIONS.DELETE_ADMIN, label: "Delete Admin" },
    {
      key: PERMISSIONS.MANAGE_ROLE_PERMISSIONS,
      label: "Manage Role Permissions",
    },

    { key: PERMISSIONS.CREATE_SUB_ADMIN, label: "Create Sub-admin" },
    { key: PERMISSIONS.UPDATE_SUB_ADMIN, label: "Update Sub-admin" },
    { key: PERMISSIONS.DELETE_SUB_ADMIN, label: "Delete Sub-admin" },
    { key: PERMISSIONS.VIEW_SUB_ADMINS, label: "View Sub-admins" },

    { key: PERMISSIONS.VIEW_VENDORS, label: "View Vendors" },
    { key: PERMISSIONS.CREATE_VENDOR, label: "Create Vendor" },
    { key: PERMISSIONS.UPDATE_VENDOR, label: "Update Vendor" },
    { key: PERMISSIONS.DELETE_VENDOR, label: "Delete Vendor" },

    {
      key: PERMISSIONS.VIEW_DELIVERY_PARTNERS,
      label: "View Delivery Partners",
    },
    {
      key: PERMISSIONS.CREATE_DELIVERY_PARTNER,
      label: "Create Delivery Partner",
    },
    {
      key: PERMISSIONS.UPDATE_DELIVERY_PARTNER,
      label: "Update Delivery Partner",
    },
    {
      key: PERMISSIONS.DELETE_DELIVERY_PARTNER,
      label: "Delete Delivery Partner",
    },

    { key: PERMISSIONS.VIEW_CUSTOMERS, label: "View Customers" },
    { key: PERMISSIONS.CREATE_CUSTOMER, label: "Create Customer" },
    { key: PERMISSIONS.UPDATE_CUSTOMER, label: "Update Customer" },
    { key: PERMISSIONS.DELETE_CUSTOMER, label: "Delete Customer" },

    { key: PERMISSIONS.VIEW_PRODUCTS, label: "View Products" },
    { key: PERMISSIONS.CREATE_PRODUCT, label: "Create Product" },
    { key: PERMISSIONS.UPDATE_PRODUCT, label: "Update Product" },
    { key: PERMISSIONS.DELETE_PRODUCT, label: "Delete Product" },

    { key: PERMISSIONS.VIEW_ORDERS, label: "View Orders" },
    { key: PERMISSIONS.MANAGE_ORDERS, label: "Manage Orders" },

    { key: PERMISSIONS.VIEW_STORES, label: "View Stores" },
    { key: PERMISSIONS.MANAGE_SUBSCRIPTIONS, label: "Manage Subscriptions" },

    { key: PERMISSIONS.VERIFY_USER_STATUS, label: "Verify User Status" },
  ];

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const data = await settingsAPI.getRoles();
      setRoles(data || []);
      // initialize selected permissions per role for the checkbox UI
      const initial = {};
      (data || []).forEach((r) => {
        const key = r.id || r._id || r.name;
        initial[key] = Array.isArray(r.permissions) ? [...r.permissions] : [];
      });
      setSelectedPermissions(initial);
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

  const handleAddPermissions = async (role, perms) => {
    if (!perms || perms.length === 0) return;
    const roleKey = role.id || role._id || role.name;
    const code = role.code || role.name || roleKey;

    const prevRoles = [...roles];
    const newRoles = roles.map((r) => {
      const key = r.id || r._id || r.name;
      if (key !== roleKey) return r;
      const current = Array.isArray(r.permissions) ? [...r.permissions] : [];
      const updated = [...current];
      perms.forEach((p) => {
        if (!updated.includes(p)) updated.push(p);
      });
      return { ...r, permissions: updated };
    });

    setRoles(newRoles);
    try {
      await rolesAPI.updatePermissions(code, {
        permissions: newRoles.find((r) => (r.id || r._id || r.name) === roleKey)
          .permissions,
      });
      message.success(
        `Added ${perms.length} permission(s) to ${role.name || roleKey}`
      );
    } catch (err) {
      setRoles(prevRoles);
      message.error("Failed to update permissions. Please try again.");
    }
  };

  const handleRemovePermissions = async (role, perms) => {
    if (!perms || perms.length === 0) return;
    const roleKey = role.id || role._id || role.name;
    const code = role.code || role.name || roleKey;

    const prevRoles = [...roles];
    const newRoles = roles.map((r) => {
      const key = r.id || r._id || r.name;
      if (key !== roleKey) return r;
      const current = Array.isArray(r.permissions) ? [...r.permissions] : [];
      const updated = current.filter((p) => !perms.includes(p));
      return { ...r, permissions: updated };
    });

    setRoles(newRoles);
    try {
      await rolesAPI.updatePermissions(code, {
        permissions: newRoles.find((r) => (r.id || r._id || r.name) === roleKey)
          .permissions,
      });
      message.success(
        `Removed ${perms.length} permission(s) from ${role.name || roleKey}`
      );
    } catch (err) {
      setRoles(prevRoles);
      message.error("Failed to update permissions. Please try again.");
    }
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
        <Space align="center">
          <TeamOutlined style={{ color: getRoleColor(text) }} />
          <span style={{ fontWeight: 600 }}>{text}</span>
        </Space>
      ),
    },
    {
      title: "Permissions",
      dataIndex: "permissions",
      key: "permissions",
      render: (permissions, record) => {
        const roleKey = record.id || record._id || record.name;
        const current = Array.isArray(record.permissions)
          ? record.permissions
          : [];

        // controlled selected values for this role
        const selected = selectedPermissions[roleKey] || current;

        // compute which checked items are additions or removals
        const toAdd = (selected || []).filter((p) => !current.includes(p));
        const toRemove = (selected || []).filter((p) => current.includes(p));

        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Checkbox.Group
              value={selected}
              onChange={(vals) =>
                setSelectedPermissions((prev) => ({ ...prev, [roleKey]: vals }))
              }
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: 6,
                }}
              >
                {allPermissions.map((perm) => (
                  <Checkbox key={perm.key} value={perm.key}>
                    {perm.label}
                  </Checkbox>
                ))}
              </div>
            </Checkbox.Group>

            <div style={{ display: "flex", gap: 8 }}>
              <Button
                size="small"
                type="primary"
                disabled={toAdd.length === 0}
                onClick={() => handleAddPermissions(record, toAdd)}
              >
                Add
              </Button>
              <Button
                size="small"
                danger
                disabled={toRemove.length === 0}
                onClick={() => handleRemovePermissions(record, toRemove)}
              >
                Delete
              </Button>
            </div>
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
          {String(record.name).toLowerCase() !== "super admin" && (
            <Button size="small" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div
        style={{
          background: "#ffffff",
          padding: "clamp(16px, 2vw, 24px)",
          borderRadius: 8,
          boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div>
            <h1 level={3} style={{ margin: 0, fontSize: 28, color: "#3c2f3d" }}>
              Roles & Permissions
            </h1>
            <p type="secondary" style={{ display: "block", marginTop: 6 }}>
              Create and manage roles and their permissions
            </p>
          </div>

          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
              minWidth: 220,
            }}
          >
            <Input
              placeholder="Search roles..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 320 }}
              size="large"
              allowClear
            />
            {/* Add Role disabled for now */}
          </div>
        </div>
      </div>

      <div
        style={{
          background: "#ffffff",
          padding: "clamp(16px, 2vw, 24px)",
          borderRadius: 8,
          boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
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
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: 10,
                }}
              >
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
