import { useState, useEffect } from 'react';
import { Table, Input, Select, DatePicker, Space, Button, Tag, message } from 'antd';
import { SearchOutlined, ExportOutlined, EyeOutlined } from '@ant-design/icons';
import { auditLogsAPI } from '../../services/api';

const { RangePicker } = DatePicker;

const AuditLogs = () => {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [selectedAction, setSelectedAction] = useState(null);
  const [selectedAdmin, setSelectedAdmin] = useState(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await auditLogsAPI.getLogs();
      setLogs(data);
    } catch (error) {
      message.error('Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp) => new Date(timestamp).toLocaleString(),
      sorter: (a, b) => new Date(a.timestamp) - new Date(b.timestamp),
      defaultSortOrder: 'descend',
    },
    {
      title: 'Admin',
      dataIndex: 'admin',
      key: 'admin',
      render: (admin) => <span className="font-medium">{admin}</span>,
      filters: [...new Set(logs.map(log => log.admin))].map(admin => ({
        text: admin,
        value: admin,
      })),
      onFilter: (value, record) => record.admin === value,
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      render: (action) => {
        const colors = {
          'User Login': 'blue',
          'User Created': 'green',
          'User Updated': 'orange',
          'User Deleted': 'red',
          'Order Created': 'cyan',
          'Order Updated': 'geekblue',
          'Vendor Approved': 'green',
          'Vendor Suspended': 'red',
          'Product Added': 'green',
          'Product Updated': 'orange',
          'Settings Changed': 'purple',
        };
        return <Tag color={colors[action] || 'default'}>{action}</Tag>;
      },
      filters: [...new Set(logs.map(log => log.action))].map(action => ({
        text: action,
        value: action,
      })),
      onFilter: (value, record) => record.action === value,
    },
    {
      title: 'Resource',
      key: 'resource',
      render: (_, record) => (
        <div>
          <div className="font-medium">{record.resource}</div>
          <div className="text-xs text-gray-500">ID: {record.resourceId}</div>
        </div>
      ),
    },
    {
      title: 'Details',
      dataIndex: 'details',
      key: 'details',
      render: (details) => (
        <span className="text-sm text-gray-600">{details}</span>
      ),
    },
    {
      title: 'IP Address',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      render: (ip) => <code className="text-xs bg-gray-100 px-2 py-1 rounded">{ip}</code>,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: () => (
        <Button size="small" icon={<EyeOutlined />}>
          Details
        </Button>
      ),
    },
  ];

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.admin.toLowerCase().includes(searchText.toLowerCase()) ||
      log.action.toLowerCase().includes(searchText.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchText.toLowerCase()) ||
      log.details.toLowerCase().includes(searchText.toLowerCase());

    const matchesAction = !selectedAction || log.action === selectedAction;
    const matchesAdmin = !selectedAdmin || log.admin === selectedAdmin;

    return matchesSearch && matchesAction && matchesAdmin;
  });

  const uniqueActions = [...new Set(logs.map(log => log.action))];
  const uniqueAdmins = [...new Set(logs.map(log => log.admin))];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Audit Logs</h1>
        <Button icon={<ExportOutlined />}>
          Export Logs
        </Button>
      </div>

      <Space className="mb-4" size="middle" wrap>
        <Input
          placeholder="Search logs..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300 }}
        />
        <Select
          placeholder="Filter by action"
          style={{ width: 200 }}
          allowClear
          value={selectedAction}
          onChange={setSelectedAction}
          options={uniqueActions.map(action => ({ label: action, value: action }))}
        />
        <Select
          placeholder="Filter by admin"
          style={{ width: 200 }}
          allowClear
          value={selectedAdmin}
          onChange={setSelectedAdmin}
          options={uniqueAdmins.map(admin => ({ label: admin, value: admin }))}
        />
        <RangePicker />
      </Space>

      <Table
        columns={columns}
        dataSource={filteredLogs}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 20 }}
      />
    </div>
  );
};

export default AuditLogs;

