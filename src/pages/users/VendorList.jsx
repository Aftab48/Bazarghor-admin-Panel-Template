import { useState, useEffect } from 'react';
import { Table, Button, Input, Space, Dropdown, Modal, message, Avatar } from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  MoreOutlined,
  CheckCircleOutlined,
  StopOutlined,
  LockOutlined,
  EditOutlined,
  DeleteOutlined,
  StarOutlined,
} from '@ant-design/icons';
import { usersAPI } from '../../services/api';
import StatusTag from '../../components/common/StatusTag';

const VendorList = () => {
  const [loading, setLoading] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const data = await usersAPI.getVendors();
      setVendors(data);
      setPagination({ ...pagination, total: data.length });
    } catch (error) {
      message.error(`Failed to fetch vendors: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action, userId) => {
    try {
      switch (action) {
        case 'activate':
          await usersAPI.activateUser(userId);
          setVendors(vendors.map(v => 
            v.id === userId ? { ...v, status: 'active' } : v
          ));
          message.success('Vendor activated successfully');
          break;
        case 'deactivate':
          await usersAPI.deactivateUser(userId);
          setVendors(vendors.map(v => 
            v.id === userId ? { ...v, status: 'inactive' } : v
          ));
          message.success('Vendor deactivated successfully');
          break;
        case 'suspend':
          await usersAPI.suspendUser(userId);
          setVendors(vendors.map(v => 
            v.id === userId ? { ...v, status: 'suspended' } : v
          ));
          message.success('Vendor suspended successfully');
          break;
        case 'reset-password':
          await usersAPI.resetPassword(userId);
          message.success('Password reset email sent');
          break;
        case 'delete':
          Modal.confirm({
            title: 'Are you sure you want to delete this vendor?',
            content: 'This action cannot be undone.',
            okText: 'Yes, Delete',
            okType: 'danger',
            onOk: async () => {
              await usersAPI.deleteUser(userId);
              setVendors(vendors.filter(v => v.id !== userId));
              message.success('Vendor deleted successfully');
            },
          });
          return;
      }
    } catch {
      message.error('Action failed');
    }
  };

  const getActionMenu = (record) => ({
    items: [
      {
        key: 'view',
        icon: <EditOutlined />,
        label: 'View Details',
      },
      {
        type: 'divider',
      },
      {
        key: 'activate',
        icon: <CheckCircleOutlined />,
        label: 'Activate',
        onClick: () => handleAction('activate', record.id),
        disabled: record.status === 'active',
      },
      {
        key: 'deactivate',
        icon: <StopOutlined />,
        label: 'Deactivate',
        onClick: () => handleAction('deactivate', record.id),
        disabled: record.status === 'inactive',
      },
      {
        key: 'suspend',
        icon: <LockOutlined />,
        label: 'Suspend',
        onClick: () => handleAction('suspend', record.id),
        disabled: record.status === 'suspended',
      },
      {
        type: 'divider',
      },
      {
        key: 'reset-password',
        label: 'Reset Password',
        onClick: () => handleAction('reset-password', record.id),
      },
      {
        key: 'delete',
        icon: <DeleteOutlined />,
        label: 'Delete',
        danger: true,
        onClick: () => handleAction('delete', record.id),
      },
    ],
  });

  const columns = [
    {
      title: 'Vendor',
      dataIndex: 'businessName',
      key: 'businessName',
      render: (text, record) => (
        <Space>
          <Avatar src={record.logo} />
          <div>
            <div className="font-medium">{text}</div>
            <div className="text-xs text-gray-500">{record.ownerName}</div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Contact',
      dataIndex: 'email',
      key: 'email',
      render: (text, record) => (
        <div>
          <div>{text}</div>
          <div className="text-xs text-gray-500">{record.phone}</div>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <StatusTag status={status} />,
      filters: [
        { text: 'Active', value: 'active' },
        { text: 'Inactive', value: 'inactive' },
        { text: 'Suspended', value: 'suspended' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Total Sales',
      dataIndex: 'totalSales',
      key: 'totalSales',
      render: (amount) => `₹${amount.toLocaleString()}`,
      sorter: (a, b) => a.totalSales - b.totalSales,
    },
    {
      title: 'Products',
      dataIndex: 'productsCount',
      key: 'productsCount',
      sorter: (a, b) => a.productsCount - b.productsCount,
    },
    {
      title: 'Rating',
      dataIndex: 'rating',
      key: 'rating',
      render: (rating) => (
        <Space>
          <StarOutlined className="text-yellow-500" />
          {rating}
        </Space>
      ),
      sorter: (a, b) => a.rating - b.rating,
    },
    {
      title: 'Joined',
      dataIndex: 'joinedDate',
      key: 'joinedDate',
      sorter: (a, b) => new Date(a.joinedDate) - new Date(b.joinedDate),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Dropdown menu={getActionMenu(record)} trigger={['click']}>
          <Button icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  const filteredVendors = vendors.filter(
    (vendor) =>
      vendor.businessName.toLowerCase().includes(searchText.toLowerCase()) ||
      vendor.ownerName.toLowerCase().includes(searchText.toLowerCase()) ||
      vendor.email.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Vendors</h1>
        <Button type="primary" icon={<PlusOutlined />}>
          Add Vendor
        </Button>
      </div>

      <div className="mb-4">
        <Input
          placeholder="Search vendors..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300 }}
        />
      </div>

      <Table
        columns={columns}
        dataSource={filteredVendors}
        rowKey="id"
        loading={loading}
        pagination={pagination}
        onChange={(newPagination) => setPagination(newPagination)}
      />
    </div>
  );
};

export default VendorList;

