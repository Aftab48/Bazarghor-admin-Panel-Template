import {
  Layout,
  Breadcrumb,
  Avatar,
  Dropdown,
  Badge,
  Space,
  message,
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

const { Header: AntHeader } = Layout;

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    name: "Admin User",
    email: "",
    avatar: "",
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const role = localStorage.getItem("userRole") || "SUPER_ADMIN";
        let endpoint = ENDPOINTS.SUPER_ADMIN_PROFILE;
        if (role === "ADMIN") endpoint = ENDPOINTS.STAFF_ADMIN_PROFILE;
        else if (role === "SUB_ADMIN")
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
      } catch (e) {
        // ignore fetch errors
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

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
      try {
        const role = localStorage.getItem("userRole") || "SUPER_ADMIN";
        const endpoint =
          role === "SUPER_ADMIN"
            ? ENDPOINTS.SUPER_ADMIN_LOGOUT
            : ENDPOINTS.STAFF_LOGOUT;
        await apiClient.post(endpoint);
      } catch {
        // ignore network/logout API failures on client-side logout
      } finally {
        localStorage.removeItem("authToken");
        localStorage.removeItem("refreshToken");
        const role = localStorage.getItem("userRole") || "SUPER_ADMIN";
        localStorage.removeItem("userRole");
        localStorage.removeItem("userId");
        message.success("Logged out");
        navigate(role === "SUPER_ADMIN" ? "/login" : "/login-staff", {
          replace: true,
        });
      }
    } else if (key === "profile") {
      const role = localStorage.getItem("userRole") || "SUPER_ADMIN";
      if (role === "SUPER_ADMIN") navigate("/settings/profile");
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
            <span className="text-gray-700 font-medium hidden sm:inline">
              {profile.name}
            </span>
          </div>
        </Dropdown>
      </Space>
    </AntHeader>
  );
};

export default Header;
