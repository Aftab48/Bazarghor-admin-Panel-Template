import {
  Layout,
  Breadcrumb,
  Avatar,
  Dropdown,
  Badge,
  Space,
  message,
  Tag,
} from "antd";
import {
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";
import { useLocation, Link, useNavigate } from "react-router-dom";
import apiClient from "../../services/api";
import { ENDPOINTS } from "../../constants/endpoints";
import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { ROLES } from "../../constants/permissions";

const { Header: AntHeader } = Layout;

const Header = ({ onToggleSidebar, collapsed, isMobile }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, roles } = useAuth();
  const [profile, setProfile] = useState({
    name: "Admin User",
    email: "",
    avatar: "",
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const currentRole = roles[0] || "SUPER_ADMIN";
        // Normalize role to string for comparison
        const normalizedRole =
          typeof currentRole === "string"
            ? currentRole
            : currentRole?.code || currentRole?.roleCode || String(currentRole);
        let endpoint = ENDPOINTS.SUPER_ADMIN_PROFILE;
        if (normalizedRole === ROLES.ADMIN)
          endpoint = ENDPOINTS.STAFF_ADMIN_PROFILE;
        else if (normalizedRole === ROLES.SUB_ADMIN)
          endpoint = ENDPOINTS.STAFF_SUB_ADMIN_PROFILE;
        const resp = await apiClient.get(endpoint);
        if (!mounted) return;
        const raw = resp?.data;
        const dto = raw?.data || raw || resp;
        const avatar = dto?.profilePicture?.uri || "";
        const name =
          dto?.firstName && dto?.lastName
            ? `${dto.firstName} ${dto.lastName}`
            : dto?.name || "Admin User";
        setProfile({ name, email: dto?.email || "", avatar });
      } catch {
        // ignore fetch errors
      }
    })();
    return () => {
      mounted = false;
    };
  }, [roles]);

  // Generate breadcrumb items from current path
  const getBreadcrumbItems = () => {
    const paths = location.pathname.split("/").filter(Boolean);
    const items = [{ title: <Link to="/">Home</Link> }];

    let currentPath = "";
    paths.forEach((path) => {
      currentPath += `/${path}`;
      const title = path
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
      items.push({ title: <Link to={currentPath}>{title}</Link> });
    });

    return items;
  };

  const onUserMenuClick = async ({ key }) => {
    if (key === "logout") {
      await logout();
      message.success("Logged out");
      // Always redirect to unified login page
      navigate("/login", {
        replace: true,
      });
    } else if (key === "profile") {
      const currentRole = roles[0] || ROLES.SUPER_ADMIN;
      // Normalize role to string for comparison
      const normalizedRole =
        typeof currentRole === "string"
          ? currentRole
          : currentRole?.code || currentRole?.roleCode || String(currentRole);
      if (normalizedRole === ROLES.SUPER_ADMIN) navigate("/profile");
      else navigate("/staff-profile");
    }
  };

  const userMenuItems = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "Profile",
    },
    // {
    //   key: "settings",
    //   icon: <SettingOutlined />,
    //   label: "Settings",
    // },
    {
      type: "divider",
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Logout",
      danger: true,
    },
  ];

  return (
    <AntHeader
      className="bg-white shadow-sm"
      style={{
        padding: isMobile ? "0 12px" : "0 16px",
        display: "flex",
        alignItems: "center",
        minHeight: 64,
        position: "sticky",
        top: 0,
        zIndex: 900,
        background: "#ffffff",
      }}
    >
      <div className="flex items-center justify-between w-full flex-wrap gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            aria-label="Toggle navigation"
            onClick={() => onToggleSidebar?.()}
            style={{
              border: "1px solid #e5e7eb",
              background: "transparent",
              cursor: "pointer",
              padding: "8px",
              borderRadius: "8px",
              lineHeight: 0,
            }}
          >
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </button>

          <Breadcrumb
            items={getBreadcrumbItems()}
            style={{ flexWrap: "wrap", gap: 4 }}
          />
        </div>

        <Space size="large" wrap align="center">
          {/* <Badge count={5} offset={[-5, 5]}>
          <BellOutlined className="text-xl cursor-pointer text-gray-600 hover:text-blue-600" />
        </Badge> */}

          <Dropdown
            menu={{ items: userMenuItems, onClick: onUserMenuClick }}
            placement="bottomRight"
            arrow
          >
            <div
              className="flex items-center gap-3 cursor-pointer"
              style={{
                padding: "8px 12px",
                borderRadius: "8px",
                transition: "background-color 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.04)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <Avatar
                src={profile.avatar}
                icon={<UserOutlined />}
                size={40}
                style={{ border: "2px solid #9dda52" }}
              />
              <div
                className="hidden sm:flex sm:flex-col"
                style={{ gap: "4px" }}
              >
                <span
                  className="text-gray-800 font-semibold"
                  style={{ fontSize: "14px", lineHeight: "1.2" }}
                >
                  {profile.name}
                </span>
                {roles.length > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    {roles.map((role, index) => {
                      // Handle both string and object roles
                      const roleCode =
                        typeof role === "string"
                          ? role
                          : role?.code || role?.roleCode || String(role);

                      // Map role codes to display names
                      const roleDisplayName = roleCode
                        .split("_")
                        .map(
                          (word) => word.charAt(0) + word.slice(1).toLowerCase()
                        )
                        .join(" ");

                      return (
                        <Tag
                          key={roleCode || index}
                          color="#9dda52"
                          style={{
                            fontSize: "12px",
                            margin: 0,
                            padding: "2px 8px",
                            borderRadius: "4px",
                            border: "0.2px solid #3c2f3d",
                            lineHeight: "1.4",
                            color: "#3c2f3d",
                          }}
                        >
                          {roleDisplayName}
                        </Tag>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </Dropdown>
        </Space>
      </div>
    </AntHeader>
  );
};

export default Header;
