import { useState, useEffect } from 'react';
import { Card, Row, Col, DatePicker, Button, Select, Spin } from 'antd';
import { ExportOutlined, BarChartOutlined } from '@ant-design/icons';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { analyticsAPI } from '../../services/api';

const { RangePicker } = DatePicker;

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF6B9D'];

const Reports = () => {
  const [loading, setLoading] = useState(false);
  const [salesByVendor, setSalesByVendor] = useState([]);
  const [salesByCategory, setSalesByCategory] = useState([]);
  const [deliveryPerformance, setDeliveryPerformance] = useState([]);
  const [customerRetention, setCustomerRetention] = useState({});

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const [salesReports, deliveryReports, retentionData] = await Promise.all([
        analyticsAPI.getSalesReports(),
        analyticsAPI.getDeliveryReports(),
        analyticsAPI.getCustomerRetention(),
      ]);
      
      setSalesByVendor(salesReports.byVendor);
      setSalesByCategory(salesReports.byCategory);
      setDeliveryPerformance(deliveryReports);
      setCustomerRetention(retentionData);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

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
        <h1 className="text-2xl font-bold text-gray-800">Analytics & Reports</h1>
        <div className="flex gap-3">
          <RangePicker />
          <Button icon={<ExportOutlined />}>
            Export Report
          </Button>
        </div>
      </div>

      {/* Customer Retention Stats */}
      <Row gutter={16} className="mb-6">
        <Col span={8}>
          <Card>
            <div className="text-sm text-gray-600">New Customers</div>
            <div className="text-3xl font-bold text-blue-600">{customerRetention.newCustomers}</div>
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <div className="text-sm text-gray-600">Returning Customers</div>
            <div className="text-3xl font-bold text-green-600">{customerRetention.returningCustomers}</div>
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <div className="text-sm text-gray-600">Churn Rate</div>
            <div className="text-3xl font-bold text-red-600">{customerRetention.churnRate}%</div>
          </Card>
        </Col>
      </Row>

      {/* Sales by Vendor */}
      <Row gutter={16} className="mb-6">
        <Col span={12}>
          <Card title="Sales by Vendor" extra={<BarChartOutlined />}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesByVendor}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                <Legend />
                <Bar dataKey="sales" fill="#1890ff" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* Sales by Category */}
        <Col span={12}>
          <Card title="Sales by Category">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={salesByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="sales"
                >
                  {salesByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Delivery Performance */}
      <Row gutter={16}>
        <Col span={24}>
          <Card title="Delivery Agent Performance">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={deliveryPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="delivered" fill="#52c41a" name="Orders Delivered" />
                <Bar yAxisId="right" dataKey="rating" fill="#faad14" name="Rating" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Reports;

