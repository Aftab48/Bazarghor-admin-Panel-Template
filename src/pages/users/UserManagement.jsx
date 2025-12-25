import { Card, Row, Col, Typography, Space } from "antd";
import {
  UserOutlined,
  ShopOutlined,
  CarOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { usePermissions } from "../../hooks/usePermissions";
import { PERMISSIONS } from "../../constants/permissions";

const { Title, Text } = Typography;

const UserManagement = () => {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();

  const sections = [
    {
      key: "customers",
      title: "Customers",
      description: "Manage and view all customer accounts",
      icon: <UserOutlined style={{ fontSize: 48, color: "#9dda52" }} />,
      path: "/users/customers",
      permission: PERMISSIONS.VIEW_CUSTOMERS,
      color: "#9dda52",
    },
    {
      key: "vendors",
      title: "Vendors",
      description: "Manage vendor accounts and profiles",
      icon: <ShopOutlined style={{ fontSize: 48, color: "#ffbc2c" }} />,
      path: "/users/vendors",
      permission: PERMISSIONS.VIEW_VENDORS,
      color: "#ffbc2c",
    },
    {
      key: "delivery-partners",
      title: "Delivery Partners",
      description: "Manage delivery partner accounts",
      icon: <CarOutlined style={{ fontSize: 48, color: "#fa8c16" }} />,
      path: "/users/delivery-partners",
      permission: PERMISSIONS.VIEW_DELIVERY_PARTNERS,
      color: "#fa8c16",
    },
  ];

  const accessibleSections = sections.filter((section) =>
    hasPermission(section.permission)
  );

  const handleCardClick = (path) => {
    navigate(path);
  };

  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: 8,
        boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
        padding: "clamp(16px, 2vw, 24px)",
      }}
    >
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, color: "#3c2f3d" }}>User Management</h1>
        <p style={{ fontSize: 16, display: "block", color: "#6b7280" }}>
          Select a section to manage different types of users
        </p>
      </div>

      <Row gutter={[20, 20]}>
        {accessibleSections.map((section) => (
          <Col xs={24} sm={12} md={8} key={section.key}>
            <Card
              hoverable
              onClick={() => handleCardClick(section.path)}
              style={{
                height: "100%",
                cursor: "pointer",
                transition: "all 0.3s",
                border: `2px solid ${section.color}20`,
              }}
              bodyStyle={{
                padding: "32px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
              }}
            >
              <Space
                direction="vertical"
                size="large"
                style={{ width: "100%" }}
                align="center"
              >
                <div>{section.icon}</div>
                <div style={{ width: "100%" }}>
                  <Title level={4} style={{ margin: 0, color: section.color }}>
                    {section.title}
                  </Title>
                  <Text
                    type="secondary"
                    style={{ fontSize: 14, marginTop: 8, display: "block" }}
                  >
                    {section.description}
                  </Text>
                </div>
                <div
                  style={{
                    color: section.color,
                    fontSize: 14,
                    fontWeight: 500,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  View Details <ArrowRightOutlined />
                </div>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      {accessibleSections.length === 0 && (
        <Card style={{ marginTop: 16 }}>
          <div style={{ textAlign: "center", padding: "40px" }}>
            <Text type="secondary" style={{ fontSize: 16 }}>
              You don't have permission to access any user management sections.
            </Text>
          </div>
        </Card>
      )}
    </div>
  );
};

export default UserManagement;
