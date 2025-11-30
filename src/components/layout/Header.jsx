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
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { useLocation, Link, useNavigate } from "react-router-dom";
import apiClient from "../../services/api";
import { ENDPOINTS } from "../../constants/endpoints";
import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { ROLES } from "../../constants/permissions";

const { Header: AntHeader } = Layout;

const Header = () => {
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
        const normalizedRole = typeof currentRole === "string" 
          ? currentRole 
          : currentRole?.code || currentRole?.roleCode || String(currentRole);
        let endpoint = ENDPOINTS.SUPER_ADMIN_PROFILE;
        if (normalizedRole === ROLES.ADMIN) endpoint = ENDPOINTS.STAFF_ADMIN_PROFILE;
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
      const normalizedRole = typeof currentRole === "string" 
        ? currentRole 
        : currentRole?.code || currentRole?.roleCode || String(currentRole);
      if (normalizedRole === ROLES.SUPER_ADMIN) navigate("/settings/profile");
      else navigate("/settings/staff-profile");
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
      className="bg-white shadow-sm px-6 flex items-center justify-between"
      style={{ padding: "0 24px", background: "#f0f0f0" }}
    >
      <Breadcrumb items={getBreadcrumbItems()} />

      <Space size="large">
        {/* <Badge count={5} offset={[-5, 5]}>
          <BellOutlined className="text-xl cursor-pointer text-gray-600 hover:text-blue-600" />
        </Badge> */}

        <Dropdown
          menu={{ items: userMenuItems, onClick: onUserMenuClick }}
          placement="bottomRight"
          arrow
        >
          <div className="flex items-center gap-2 cursor-pointer">
            <Avatar src={profile.avatar} icon={<UserOutlined />} />
            <div className="hidden sm:flex sm:flex-col">
              <span className="text-gray-700 font-medium">{profile.name}</span>
              {roles.length > 0 && (
                <div className="flex gap-1">
                  {roles.map((role, index) => {
                    // Handle both string and object roles
                    const roleCode = typeof role === "string" ? role : role?.code || role?.roleCode || String(role);
                    return (
                      <Tag key={roleCode || index} color="blue" style={{ fontSize: "10px", margin: 0 }}>
                        {roleCode}
                      </Tag>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </Dropdown>
      </Space>
    </AntHeader>
  );
};

export default Header;
