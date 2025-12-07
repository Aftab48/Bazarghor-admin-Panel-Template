import { useMemo, useState } from "react";
import { Layout } from "antd";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

const { Content } = Layout;

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const contentMarginLeft = useMemo(() => {
    if (isMobile) return 0;
    return collapsed ? 80 : 250;
  }, [collapsed, isMobile]);

  const handleBreakpoint = (broken) => {
    setIsMobile(broken);
    if (broken) setCollapsed(true);
  };

  const handleCollapse = (nextState) => setCollapsed(nextState);

  const toggleSidebar = () => setCollapsed((prev) => !prev);

  return (
    <Layout className="min-h-screen">
      <Sidebar
        collapsed={collapsed}
        onCollapse={handleCollapse}
        onBreakpoint={handleBreakpoint}
        isMobile={isMobile}
      />
      {isMobile && !collapsed && (
        <div
          onClick={() => setCollapsed(true)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            zIndex: 900,
          }}
        />
      )}
      <Layout
        style={{
          marginLeft: contentMarginLeft,
          transition: "margin-left 0.2s ease",
        }}
      >
        <Header
          onToggleSidebar={toggleSidebar}
          collapsed={collapsed}
          isMobile={isMobile}
        />
        <Content
          className="bg-gray-50 min-h-[calc(100vh-88px)]"
          style={{ padding: isMobile ? 16 : 24, margin: isMobile ? 12 : 24 }}
        >
          <div
            className="bg-white rounded-lg shadow-sm"
            style={{ padding: isMobile ? 16 : 24 }}
          >
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
