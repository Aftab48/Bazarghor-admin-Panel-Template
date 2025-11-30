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
      console.log("📦 Vendors data received:", data);
      if (Array.isArray(data)) {
        setVendors(data);
        setPagination({ ...pagination, total: data.length });
      } else {
        console.warn("⚠️ Vendors data is not an array:", data);
        setVendors([]);
        setPagination({ ...pagination, total: 0 });
      }
    } catch (error) {
      console.error("❌ Error fetching vendors:", error);
      message.error(`Failed to fetch vendors: ${error.message || 'Unknown error'}`);
      setVendors([]);
      setPagination({ ...pagination, total: 0 });
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
      render: (text, record) => {
        if (!record) return '-';
        const businessName = text || record.storeName || 'N/A';
        const ownerName = record.ownerName || `${record.firstName || ''} ${record.lastName || ''}`.trim() || 'N/A';
        return (
          <Space>
            <Avatar src={record.logo || record.profilePicture?.uri || record.profilePicture} />
            <div>
              <div className="font-medium">{businessName}</div>
              <div className="text-xs text-gray-500">{ownerName}</div>
            </div>
          </Space>
        );
      },
    },
    {
      title: 'Contact',
      dataIndex: 'email',
      key: 'email',
      render: (text, record) => {
        if (!record) return '-';
        const email = text || record.email || 'N/A';
        const phone = record.phone || record.mobNo || 'N/A';
        return (
          <div>
            <div>{email}</div>
            <div className="text-xs text-gray-500">{phone}</div>
          </div>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        if (status === undefined || status === null) return <StatusTag status="unknown" />;
        return <StatusTag status={status} />;
      },
      filters: [
        { text: 'Pending', value: 1 },
        { text: 'Approved', value: 2 },
        { text: 'Active', value: 'active' },
        { text: 'Inactive', value: 'inactive' },
        { text: 'Suspended', value: 'suspended' },
      ],
      onFilter: (value, record) => {
        if (typeof value === 'number') {
          return record.status === value;
        }
        return String(record.status).toLowerCase() === String(value).toLowerCase();
      },
    },
    {
      title: 'Total Sales',
      dataIndex: 'totalSales',
      key: 'totalSales',
      render: (amount) => `₹${(amount || 0).toLocaleString()}`,
      sorter: (a, b) => (a.totalSales || 0) - (b.totalSales || 0),
    },
    {
      title: 'Products',
      dataIndex: 'productsCount',
      key: 'productsCount',
      render: (count) => count || 0,
      sorter: (a, b) => (a.productsCount || 0) - (b.productsCount || 0),
    },
    {
      title: 'Rating',
      dataIndex: 'rating',
      key: 'rating',
      render: (rating) => (
        <Space>
          <StarOutlined className="text-yellow-500" />
          {rating || 0}
        </Space>
      ),
      sorter: (a, b) => (a.rating || 0) - (b.rating || 0),
    },
    {
      title: 'Joined',
      dataIndex: 'joinedDate',
      key: 'joinedDate',
      render: (date) => date ? new Date(date).toLocaleDateString() : 'N/A',
      sorter: (a, b) => {
        const dateA = a.joinedDate ? new Date(a.joinedDate) : new Date(0);
        const dateB = b.joinedDate ? new Date(b.joinedDate) : new Date(0);
        return dateA - dateB;
      },
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
    (vendor) => {
      if (!vendor) return false;
      const businessName = (vendor.businessName || vendor.storeName || '').toLowerCase();
      const ownerName = (vendor.ownerName || `${vendor.firstName || ''} ${vendor.lastName || ''}`.trim() || '').toLowerCase();
      const email = (vendor.email || '').toLowerCase();
      const search = searchText.toLowerCase();
      return businessName.includes(search) || ownerName.includes(search) || email.includes(search);
    }
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
        dataSource={filteredVendors || []}
        rowKey={(record) => record?.id || record?._id || Math.random()}
        loading={loading}
        pagination={{
          ...pagination,
          total: filteredVendors?.length || 0,
          showTotal: (total) => `Total ${total} vendors`,
        }}
        onChange={(newPagination) => setPagination(newPagination)}
        locale={{ emptyText: 'No vendors found' }}
      />
    </div>
  );
};

export default VendorList;

