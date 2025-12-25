import { Card, Row, Col, Typography, Space } from "antd";
import {
  TeamOutlined,
  SafetyCertificateOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { usePermissions } from "../../hooks/usePermissions";
import { PERMISSIONS } from "../../constants/permissions";

const { Title, Text } = Typography;

const SettingsManagement = () => {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();

  const sections = [
    {
      key: "staff",
      title: "Staff",
      description: "Manage admins and sub-admins",
      icon: <TeamOutlined style={{ fontSize: 48, color: "#ffbc2c " }} />,
      path: "/settings/staff",
      permission: [PERMISSIONS.VIEW_ADMINS, PERMISSIONS.CREATE_SUB_ADMIN],
      color: "#ffbc2c",
    },
    {
      key: "roles",
      title: "Roles & Permissions",
      description: "Configure roles and access controls",
      icon: (
        <SafetyCertificateOutlined style={{ fontSize: 48, color: "#52c41a" }} />
      ),
      path: "/settings/roles",
      permission: [PERMISSIONS.MANAGE_ROLE_PERMISSIONS],
      color: "#52c41a",
    },
  ];

  const accessibleSections = sections.filter((section) => {
    if (Array.isArray(section.permission)) {
      return section.permission.some((perm) => hasPermission(perm));
    }
    return hasPermission(section.permission);
  });

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
        <h1 style={{ fontSize: 28, color: "#3c2f3d" }}>Settings</h1>

        <p
          style={{
            fontSize: 16,
            display: "block",
            color: "#6b7280",
            marginBottom: 24,
          }}
        >
          Quickly navigate to manage staff and roles
        </p>

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
                    <Title
                      level={4}
                      style={{ margin: 0, color: section.color }}
                    >
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
                You don't have permission to access settings sections.
              </Text>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SettingsManagement;
