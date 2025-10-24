import { Layout, Breadcrumb, Avatar, Dropdown, Badge, Space } from 'antd';
import { BellOutlined, UserOutlined, LogoutOutlined, SettingOutlined } from '@ant-design/icons';
import { useLocation, Link } from 'react-router-dom';

const { Header: AntHeader } = Layout;

const Header = () => {
  const location = useLocation();

  // Generate breadcrumb items from current path
  const getBreadcrumbItems = () => {
    const paths = location.pathname.split('/').filter(Boolean);
    const items = [{ title: <Link to="/">Home</Link> }];

    let currentPath = '';
    paths.forEach((path) => {
      currentPath += `/${path}`;
      const title = path
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      items.push({ title: <Link to={currentPath}>{title}</Link> });
    });

    return items;
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      danger: true,
    },
  ];

  return (
    <AntHeader className="bg-white shadow-sm px-6 flex items-center justify-between" style={{ padding: '0 24px' }}>
      <Breadcrumb items={getBreadcrumbItems()} />
      
      <Space size="large">
        <Badge count={5} offset={[-5, 5]}>
          <BellOutlined className="text-xl cursor-pointer text-gray-600 hover:text-blue-600" />
        </Badge>
        
        <Dropdown
          menu={{ items: userMenuItems }}
          placement="bottomRight"
          arrow
        >
          <div className="flex items-center gap-2 cursor-pointer">
            <Avatar icon={<UserOutlined />} />
            <span className="text-gray-700 font-medium hidden sm:inline">Admin User</span>
          </div>
        </Dropdown>
      </Space>
    </AntHeader>
  );
};

export default Header;

