import { useState, useEffect } from 'react';
import { Row, Col, Card, Select, Table, Spin } from 'antd';
import {
  ShoppingCartOutlined,
  DollarOutlined,
  ShopOutlined,
  UserOutlined,
  CarOutlined,
} from '@ant-design/icons';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import StatCard from '../components/common/StatCard';
import StatusTag from '../components/common/StatusTag';
import { dashboardAPI, ordersAPI } from '../services/api';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [analytics, setAnalytics] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [period, setPeriod] = useState('daily');

  useEffect(() => {
    fetchDashboardData();
  }, [period]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsData, analyticsData, ordersData] = await Promise.all([
        dashboardAPI.getStats(),
        dashboardAPI.getAnalytics(period),
        ordersAPI.getAll({ limit: 10 }),
      ]);
      
      setStats(statsData);
      setAnalytics(analyticsData);
      setRecentOrders(ordersData.slice(0, 10));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const orderColumns = [
    {
      title: 'Order #',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
    },
    {
      title: 'Customer',
      dataIndex: 'customerName',
      key: 'customerName',
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      render: (total) => `$${total}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <StatusTag status={status} />,
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleDateString(),
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <Select
          value={period}
          onChange={setPeriod}
          style={{ width: 150 }}
          options={[
            { value: 'daily', label: 'Daily' },
            { value: 'weekly', label: 'Weekly' },
            { value: 'monthly', label: 'Monthly' },
          ]}
        />
      </div>

      {/* Stats Cards */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={8} xl={4.8}>
          <StatCard
            title="Total Orders"
            value={stats.totalOrders}
            icon={<ShoppingCartOutlined />}
            color="blue"
            trend={12}
          />
        </Col>
        <Col xs={24} sm={12} lg={8} xl={4.8}>
          <StatCard
            title="Total Revenue"
            value={stats.totalRevenue}
            prefix="₹"
            icon={<DollarOutlined />}
            color="green"
            trend={8}
          />
        </Col>
        <Col xs={24} sm={12} lg={8} xl={4.8}>
          <StatCard
            title="Total Vendors"
            value={stats.totalVendors}
            icon={<ShopOutlined />}
            color="purple"
            trend={5}
          />
        </Col>
        <Col xs={24} sm={12} lg={8} xl={4.8}>
          <StatCard
            title="Total Customers"
            value={stats.totalCustomers}
            icon={<UserOutlined />}
            color="orange"
            trend={15}
          />
        </Col>
        <Col xs={24} sm={12} lg={8} xl={4.8}>
          <StatCard
            title="Total Deliveries"
            value={stats.totalDeliveries}
            icon={<CarOutlined />}
            color="red"
            trend={-3}
          />
        </Col>
      </Row>

      {/* Charts */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} lg={12}>
          <Card title="Revenue Trend" className="h-full">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#1890ff" strokeWidth={2} />
                <Line type="monotone" dataKey="orders" stroke="#52c41a" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Active Vendors & Agents" className="h-full">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="vendors" fill="#8884d8" />
                <Bar dataKey="agents" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Recent Orders */}
      <Card title="Recent Orders" className="mb-6">
        <Table
          columns={orderColumns}
          dataSource={recentOrders}
          rowKey="id"
          pagination={false}
        />
      </Card>
    </div>
  );
};

export default Dashboard;

