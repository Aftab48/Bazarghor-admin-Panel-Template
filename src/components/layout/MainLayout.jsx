import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const { Content } = Layout;

const MainLayout = () => {
  return (
    <Layout className="min-h-screen">
      <Sidebar />
      <Layout style={{ marginLeft: 250 }}>
        <Header />
        <Content className="m-6 p-6 bg-gray-50 min-h-[calc(100vh-88px)]">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;

