import { useState, useEffect, useMemo } from "react";
import {
  Button,
  Space,
  Input,
  Checkbox,
  message,
  Typography,
  Row,
  Col,
  List,
  Card,
  Empty,
  Avatar,
} from "antd";
import { TeamOutlined, SearchOutlined } from "@ant-design/icons";
import { settingsAPI, rolesAPI } from "../../services/api";
import { PERMISSIONS } from "../../constants/permissions";

const { Title, Text } = Typography;

const RolesPermissions = () => {
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState([]);

  const [searchText, setSearchText] = useState("");
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [selectedPermissions, setSelectedPermissions] = useState({});
  const [activeRoleId, setActiveRoleId] = useState(null);

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
      // set an active role if none selected
      if ((data || []).length > 0) {
        const firstKey = data[0].id || data[0]._id || data[0].name;
        setActiveRoleId((prev) => prev || firstKey);
      }
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

  const getRoleColor = (role) => {
    const key = String(role || "").toUpperCase();
    if (key === "SUPER ADMIN" || key === "SUPER_ADMIN") return "#4096ff";
    if (key === "ADMIN") return "#9dda52";
    if (key === "SUB ADMIN" || key === "SUB_ADMIN") return "#ffbc2c";
    return "#d9d9d9";
  };

  const handleUpdatePermissions = async (role) => {
    const roleKey = role.id || role._id || role.name;
    const code = role.code || role.name || roleKey;
    const newPermissions = Array.isArray(selectedPermissions[roleKey])
      ? selectedPermissions[roleKey]
      : [];

    const prevRoles = [...roles];
    const newRoles = roles.map((r) => {
      const key = r.id || r._id || r.name;
      if (key !== roleKey) return r;
      return { ...r, permissions: [...newPermissions] };
    });

    setRoles(newRoles);
    try {
      await rolesAPI.updatePermissions(code, { permissions: newPermissions });
      message.success(`Updated permissions for ${role.name || roleKey}`);
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
        <Row gutter={24}>
          <Col xs={24} md={8} lg={6}>
            <div style={{ marginBottom: 12 }}>
              <Title level={5} style={{ margin: 0 }}>
                Roles
              </Title>
            </div>

            <div style={{ maxHeight: 520, overflowY: "auto", paddingRight: 6 }}>
              {filteredRoles.length === 0 ? (
                <Empty description="No roles" />
              ) : (
                <List
                  itemLayout="horizontal"
                  dataSource={filteredRoles}
                  renderItem={(role) => {
                    const key = role.id || role._id || role.name;
                    const active = key === activeRoleId;
                    return (
                      <List.Item
                        onClick={() => setActiveRoleId(key)}
                        style={{
                          cursor: "pointer",
                          background: active ? "#f6f8ff" : "transparent",
                          borderRadius: 8,
                          padding: "10px 12px",
                          marginBottom: 8,
                        }}
                      >
                        <List.Item.Meta
                          avatar={
                            <Avatar
                              style={{
                                background: getRoleColor(role.name),
                                color: "#fff",
                              }}
                              icon={<TeamOutlined />}
                            />
                          }
                          title={
                            <span style={{ fontWeight: 600 }}>{role.name}</span>
                          }
                          description={
                            <span style={{ fontSize: 12 }}>
                              {(role.permissions || []).length} permissions
                            </span>
                          }
                        />
                      </List.Item>
                    );
                  }}
                />
              )}
            </div>
          </Col>

          <Col xs={24} md={16} lg={18}>
            <div>
              {(() => {
                const activeRole = roles.find(
                  (r) => (r.id || r._id || r.name) === activeRoleId
                );
                if (!activeRole)
                  return (
                    <Empty description="Select a role to edit permissions" />
                  );

                const roleKey =
                  activeRole.id || activeRole._id || activeRole.name;
                const current = Array.isArray(activeRole.permissions)
                  ? activeRole.permissions
                  : [];
                const selected = selectedPermissions[roleKey] || current;
                const currentSet = new Set(current || []);
                const hasChange =
                  (selected || []).length !== (current || []).length ||
                  (selected || []).some((p) => !currentSet.has(p));

                return (
                  <Card
                    bordered={false}
                    style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <Title level={5} style={{ margin: 0 }}>
                          {activeRole.name}
                        </Title>
                        <Text type="secondary">
                          {(activeRole.permissions || []).length} assigned
                        </Text>
                      </div>
                      <div>
                        <Button
                          type="primary"
                          onClick={() => handleUpdatePermissions(activeRole)}
                          disabled={!hasChange}
                          style={{
                            cursor: "pointer",
                            background: hasChange ? "#9dda52" : "transparent",
                            borderRadius: 8,
                            padding: "10px 12px",
                            marginBottom: 8,
                            width: 100,
                          }}
                        >
                          Save
                        </Button>
                      </div>
                    </div>

                    <div style={{ marginTop: 16 }}>
                      <Checkbox.Group
                        value={selected}
                        onChange={(vals) =>
                          setSelectedPermissions((prev) => ({
                            ...prev,
                            [roleKey]: vals,
                          }))
                        }
                      >
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns:
                              "repeat(4, minmax(100px, 1fr))",
                            gap: 12,
                          }}
                        >
                          {allPermissions.map((perm) => {
                            const isChecked = (selected || []).includes(
                              perm.key
                            );
                            return (
                              <div key={perm.key}>
                                <Checkbox
                                  value={perm.key}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    padding: "8px 12px",
                                    borderRadius: 16,
                                    border: "0.5px solid #3c2f3d",
                                    background: isChecked ? "#9dda52" : "#fff",
                                  }}
                                >
                                  <span style={{ fontSize: 14 }}>
                                    {perm.label}
                                  </span>
                                </Checkbox>
                              </div>
                            );
                          })}
                        </div>
                      </Checkbox.Group>
                    </div>

                    {hasChange && (
                      <div style={{ marginTop: 12 }}>
                        <Text type="warning">
                          You have unsaved changes. Click Save to save.
                        </Text>
                      </div>
                    )}
                  </Card>
                );
              })()}
            </div>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default RolesPermissions;
