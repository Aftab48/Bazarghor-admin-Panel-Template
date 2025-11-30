import { useState, useMemo } from "react";
import { Layout, Menu } from "antd";
import { Link, useLocation } from "react-router-dom";
import logo from "../../assets/images/Logo.png";
import {
  DashboardOutlined,
  UserOutlined,
  ShopOutlined,
  CarOutlined,
  AppstoreOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  TagOutlined,
  BarChartOutlined,
  SettingOutlined,
  CustomerServiceOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { useAuth } from "../../hooks/useAuth";
import { usePermissions } from "../../hooks/usePermissions";
import { PERMISSIONS } from "../../constants/permissions";

const { Sider } = Layout;

const Sidebar = () => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const { isAuthenticated } = useAuth();
  const { hasPermission, hasAnyPermission, canAccessRoute } = usePermissions();

  // Filter menu items based on permissions
  const menuItems = useMemo(() => {
    if (!isAuthenticated) return [];

    const items = [
      // Dashboard - always visible if authenticated
      {
        key: "/",
        icon: <DashboardOutlined />,
        label: <Link to="/">Dashboard</Link>,
      },
    ];

    // User Management - show if user has any of the view permissions
    const hasUserManagementAccess =
      hasPermission(PERMISSIONS.VIEW_CUSTOMERS) ||
      hasPermission(PERMISSIONS.VIEW_VENDORS) ||
      hasPermission(PERMISSIONS.VIEW_DELIVERY_PARTNERS);

    if (hasUserManagementAccess) {
      const userChildren = [];
      if (hasPermission(PERMISSIONS.VIEW_CUSTOMERS)) {
        userChildren.push({
          key: "/users/customers",
          label: <Link to="/users/customers">Customers</Link>,
        });
      }
      if (hasPermission(PERMISSIONS.VIEW_VENDORS)) {
        userChildren.push({
          key: "/users/vendors",
          label: <Link to="/users/vendors">Vendors</Link>,
        });
      }
      if (hasPermission(PERMISSIONS.VIEW_DELIVERY_PARTNERS)) {
        userChildren.push({
          key: "/users/delivery-agents",
          label: <Link to="/users/delivery-agents">Delivery Agents</Link>,
        });
      }

      if (userChildren.length > 0) {
        items.push({
          key: "/users",
          icon: <UserOutlined />,
          label: "User Management",
          children: userChildren,
        });
      }
    }

    // Vendor Management
    if (hasPermission(PERMISSIONS.VIEW_VENDORS)) {
      items.push({
        key: "/vendor-management",
        icon: <ShopOutlined />,
        label: <Link to="/vendor-management">Vendor Management</Link>,
      });
    }

    // Delivery Management
    if (hasPermission(PERMISSIONS.VIEW_DELIVERY_PARTNERS)) {
      items.push({
        key: "/delivery-management",
        icon: <CarOutlined />,
        label: <Link to="/delivery-management">Delivery Management</Link>,
      });
    }

    // Catalog
    if (hasPermission(PERMISSIONS.VIEW_PRODUCTS)) {
      items.push({
        key: "/catalog",
        icon: <AppstoreOutlined />,
        label: "Catalog",
        children: [
          {
            key: "/catalog/categories",
            label: <Link to="/catalog/categories">Categories</Link>,
          },
          {
            key: "/catalog/products",
            label: <Link to="/catalog/products">Products</Link>,
          },
        ],
      });
    }

    // Orders
    if (hasPermission(PERMISSIONS.VIEW_ORDERS)) {
      items.push({
        key: "/orders",
        icon: <ShoppingCartOutlined />,
        label: <Link to="/orders">Order Management</Link>,
      });
    }

    // Transactions
    if (hasPermission(PERMISSIONS.VIEW_ORDERS)) {
      items.push({
        key: "/transactions",
        icon: <DollarOutlined />,
        label: <Link to="/transactions">Payments & Transactions</Link>,
      });
    }

    // Promotions
    if (hasPermission(PERMISSIONS.VIEW_ORDERS)) {
      items.push({
        key: "/promotions",
        icon: <TagOutlined />,
        label: "Promotions",
        children: [
          {
            key: "/promotions/banners",
            label: <Link to="/promotions/banners">Banners</Link>,
          },
          {
            key: "/promotions/discount-codes",
            label: <Link to="/promotions/discount-codes">Discount Codes</Link>,
          },
        ],
      });
    }

    // Analytics
    if (hasPermission(PERMISSIONS.VIEW_ORDERS)) {
      items.push({
        key: "/analytics",
        icon: <BarChartOutlined />,
        label: <Link to="/analytics">Analytics & Reports</Link>,
      });
    }

    // Settings
    const settingsChildren = [];
    if (
      hasPermission(PERMISSIONS.VIEW_ADMINS) ||
      hasPermission(PERMISSIONS.CREATE_SUB_ADMIN)
    ) {
      settingsChildren.push({
        key: "/settings/staff",
        label: <Link to="/settings/staff">Staff</Link>,
      });
    }
    if (hasPermission(PERMISSIONS.MANAGE_ROLE_PERMISSIONS)) {
      settingsChildren.push({
        key: "/settings/roles",
        label: <Link to="/settings/roles">Roles & Permissions</Link>,
      });
    }

    if (settingsChildren.length > 0) {
      items.push({
        key: "/settings",
        icon: <SettingOutlined />,
        label: "Settings",
        children: settingsChildren,
      });
    }

    // Support - visible by default for now
    items.push({
      key: "/support",
      icon: <CustomerServiceOutlined />,
      label: <Link to="/support">Support Tickets</Link>,
    });

    // Audit Logs - visible by default for now
    items.push({
      key: "/audit-logs",
      icon: <FileTextOutlined />,
      label: <Link to="/audit-logs">Audit Logs</Link>,
    });

    return items;
  }, [isAuthenticated, hasPermission]);

  // Find the selected key based on current path
  const getSelectedKey = () => {
    const path = location.pathname;
    // Check exact match first
    let selectedKey = path;

    // If no exact match, find parent menu item
    if (!menuItems.find((item) => item.key === path)) {
      for (const item of menuItems) {
        if (item.children) {
          const child = item.children.find((c) => c.key === path);
          if (child) {
            return path;
          }
        }
      }
    }

    return selectedKey;
  };

  // Get default opened keys for submenus
  const getOpenKeys = () => {
    const path = location.pathname;
    const openKeys = [];

    menuItems.forEach((item) => {
      if (item.children) {
        const hasActiveChild = item.children.some(
          (child) => child.key === path
        );
        if (hasActiveChild) {
          openKeys.push(item.key);
        }
      }
    });

    return openKeys;
  };

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={setCollapsed}
      className="min-h-screen"
      width={250}
      theme="light"
      style={{
        overflow: "auto",
        height: "100vh",
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
      }}
    >
      <div
        className="flex items-center justify-center text-xl font-bold"
        style={{
          background: "#9dda52",
          height: 64,
          padding: collapsed ? "0 8px" : "0 16px",
        }}
      >
        <img
          src={logo}
          alt="Bazarghor Logo"
          style={{
            height: collapsed ? 24 : 32,
            maxWidth: collapsed ? 32 : 160,
            width: "auto",
            objectFit: "contain",
          }}
        />
      </div>
      <Menu
        mode="inline"
        selectedKeys={[getSelectedKey()]}
        defaultOpenKeys={getOpenKeys()}
        items={menuItems}
        className="border-r-0"
      />
    </Sider>
  );
};

export default Sidebar;
