import { Card, Row, Col, Typography, Space } from "antd";
import {
  AppstoreOutlined,
  ShoppingOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { usePermissions } from "../../hooks/usePermissions";
import { PERMISSIONS } from "../../constants/permissions";

const { Title, Text } = Typography;

const CatalogManagement = () => {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();

  const sections = [
    {
      key: "categories",
      title: "Categories",
      description: "Create and organize product categories",
      icon: <AppstoreOutlined style={{ fontSize: 48, color: "#1890ff" }} />,
      path: "/catalog/categories",
      permission: PERMISSIONS.VIEW_PRODUCTS,
      color: "#1890ff",
    },
    {
      key: "products",
      title: "Products",
      description: "Manage products, pricing, and inventory",
      icon: <ShoppingOutlined style={{ fontSize: 48, color: "#52c41a" }} />,
      path: "/catalog/products",
      permission: PERMISSIONS.VIEW_PRODUCTS,
      color: "#52c41a",
    },
  ];

  const accessibleSections = sections.filter((section) =>
    hasPermission(section.permission)
  );

  const handleCardClick = (path) => {
    navigate(path);
  };

  return (
    <div style={{ padding: "clamp(16px, 2vw, 24px)" }}>
      <Title level={2} style={{ marginBottom: 24, color: "#3c2f3d" }}>
        Catalog
      </Title>
      <Text
        type="secondary"
        style={{ fontSize: 16, marginBottom: 32, display: "block" }}
      >
        Manage categories and products from one place
      </Text>

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
        <Card>
          <div style={{ textAlign: "center", padding: "40px" }}>
            <Text type="secondary" style={{ fontSize: 16 }}>
              You don't have permission to access catalog sections.
            </Text>
          </div>
        </Card>
      )}
    </div>
  );
};

export default CatalogManagement;
