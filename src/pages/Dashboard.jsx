import { useState, useEffect } from "react";
import { Row, Col, Card, Select, Table, Spin, Typography } from "antd";
import {
  ShoppingCartOutlined,
  DollarOutlined,
  ShopOutlined,
  UserOutlined,
  CarOutlined,
} from "@ant-design/icons";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import StatCard from "../components/common/StatCard";
import StatusTag from "../components/common/StatusTag";
import { dashboardAPI } from "../services/api";

const { Title, Text } = Typography;

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [analytics, setAnalytics] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [period, setPeriod] = useState("daily", "weekly", "monthly");

  useEffect(() => {
    fetchDashboardData();
  }, [period]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsData, seriesData, activeCounts, recentOrdersData] =
        await Promise.all([
          dashboardAPI.getStats(),
          dashboardAPI.getSeries(period),
          dashboardAPI.getActiveVendorsAndDeliveryPartners(),
          dashboardAPI.getRecentOrders(),
        ]);

      // Stats
      setStats(statsData || {});

      // Series -> transform { labels: [], orders: [], revenue: [] } into [{ date, orders, revenue, vendors, agents }]
      const labels = (seriesData && seriesData.labels) || [];
      const ordersSeries = (seriesData && seriesData.orders) || [];
      const revenueSeries = (seriesData && seriesData.revenue) || [];

      const vendorsCount = (activeCounts && activeCounts.vendorsCount) || 0;
      const agentsCount = (activeCounts && activeCounts.agentsCount) || 0;

      const mergedAnalytics = labels.map((label, idx) => ({
        date: label,
        orders: ordersSeries[idx] ?? 0,
        revenue: revenueSeries[idx] ?? 0,
        vendors: vendorsCount,
        agents: agentsCount,
      }));

      setAnalytics(mergedAnalytics);

      // Recent orders mapping: API returns [{ orderNumber, customer, total, status, date }]
      const mappedOrders = Array.isArray(recentOrdersData)
        ? recentOrdersData.map((o) => ({
            orderNumber: o.orderNumber,
            customerName: o.customer || o.customerName || "-",
            total: o.total,
            status: o.status,
            createdAt: o.date || o.createdAt,
          }))
        : [];

      setRecentOrders(mappedOrders.slice(0, 10));
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const orderColumns = [
    {
      title: "Order #",
      dataIndex: "orderNumber",
      key: "orderNumber",
    },
    {
      title: "Customer",
      dataIndex: "customerName",
      key: "customerName",
    },
    {
      title: "Total",
      dataIndex: "total",
      key: "total",
      render: (total) => `$${total}`,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => <StatusTag status={status} />,
    },
    {
      title: "Date",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date) => new Date(date).toLocaleDateString(),
    },
  ];

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: 260,
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: 8,
        boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
        padding: "clamp(16px, 2vw, 24px)",
      }}
    >
      <div>
        <h1 style={{ fontSize: 28, color: "#3c2f3d" }}>Dashboard</h1>
        <p style={{ fontSize: 16, display: "block", color: "#6b7280" }}>
          Overview of platform performance and recent activity
        </p>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: 10,
        }}
      >
        <Select
          value={period}
          onChange={setPeriod}
          style={{ width: 160 }}
          options={[
            { value: "daily", label: "Daily" },
            { value: "weekly", label: "Weekly" },
            { value: "monthly", label: "Monthly" },
          ]}
        />
      </div>

      {/* Stats Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 18 }}>
        <Col xs={24} sm={12} md={8} lg={6}>
          <StatCard
            title="Total Orders"
            value={stats.totalOrders}
            color="none"
            icon={<ShoppingCartOutlined style={{ color: "#ffbc2c" }} />}
          />
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <StatCard
            title="Total Revenue"
            value={stats.totalRevenue}
            prefix="₹"
            color="none"
            icon={<DollarOutlined style={{ color: "#9dda52 " }} />}
          />
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <StatCard
            title="Vendors"
            value={stats.totalVendors}
            icon={<ShopOutlined style={{ color: "#ffbc2c" }} />}
            color="none"
          />
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <StatCard
            title="Customers"
            value={stats.totalCustomers}
            color="none"
            icon={<UserOutlined style={{ color: "#9dda52 " }} />}
          />
        </Col>
      </Row>

      {/* Charts */}
      <Row gutter={[16, 16]} style={{ marginBottom: 18 }}>
        <Col xs={24} lg={12}>
          <Card title="Revenue & Orders" bodyStyle={{ minHeight: 320 }}>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={analytics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#ffbc2c"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="orders"
                  stroke="#9dda52 "
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Active Vendors & Agents" bodyStyle={{ minHeight: 320 }}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={analytics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="vendors" fill="#ffbc2c" />
                <Bar dataKey="agents" fill="#9dda52 " />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Recent Orders */}
      <Card title="Recent Orders">
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
