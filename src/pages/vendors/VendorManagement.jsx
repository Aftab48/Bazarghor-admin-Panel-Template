import { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Modal, message, Tabs, Avatar, Statistic, Row, Col } from 'antd';
import {
  CheckOutlined,
  CloseOutlined,
  StopOutlined,
  CheckCircleOutlined,
  ShopOutlined,
  DollarOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import { vendorsAPI, usersAPI } from '../../services/api';
import StatusTag from '../../components/common/StatusTag';

const VendorManagement = () => {
  const [loading, setLoading] = useState(false);
  const [pendingVendors, setPendingVendors] = useState([]);
  const [activeVendors, setActiveVendors] = useState([]);

  useEffect(() => {
    fetchVendors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const [pending, allVendors] = await Promise.all([
        vendorsAPI.getPendingApprovals(),
        usersAPI.getVendors(),
      ]);
      setPendingVendors(pending);
      setActiveVendors(allVendors.filter(v => v.status === 'active'));
    } catch {
      message.error('Failed to fetch vendors');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (vendorId) => {
    try {
      await vendorsAPI.approveVendor(vendorId);
      
      // Find the approved vendor in pending list
      const approvedVendor = pendingVendors.find(v => v.id === vendorId);
      if (approvedVendor) {
        // Remove from pending
        setPendingVendors(pendingVendors.filter(v => v.id !== vendorId));
        // Add to active with updated status
        setActiveVendors([...activeVendors, { ...approvedVendor, status: 'active' }]);
      }
      
      message.success('Vendor approved successfully');
    } catch {
      message.error('Failed to approve vendor');
    }
  };

  const handleReject = async (vendorId) => {
    Modal.confirm({
      title: 'Reject Vendor?',
      content: 'Are you sure you want to reject this vendor registration?',
      okText: 'Yes, Reject',
      okType: 'danger',
      onOk: async () => {
        try {
          await vendorsAPI.rejectVendor(vendorId);
          // Remove from pending list
          setPendingVendors(pendingVendors.filter(v => v.id !== vendorId));
          message.success('Vendor rejected');
        } catch {
          message.error('Failed to reject vendor');
        }
      },
    });
  };

  const handleSuspend = async (vendorId) => {
    Modal.confirm({
      title: 'Suspend Vendor?',
      content: 'This will temporarily disable the vendor account.',
      okText: 'Yes, Suspend',
      okType: 'danger',
      onOk: async () => {
        try {
          await vendorsAPI.suspendVendor(vendorId);
          // Update vendor status in active list
          setActiveVendors(activeVendors.map(v => 
            v.id === vendorId ? { ...v, status: 'suspended' } : v
          ));
          message.success('Vendor suspended');
        } catch {
          message.error('Failed to suspend vendor');
        }
      },
    });
  };

  const pendingColumns = [
    {
      title: 'Business',
      dataIndex: 'businessName',
      key: 'businessName',
      render: (text, record) => (
        <Space>
          <Avatar src={record.logo} icon={<ShopOutlined />} />
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
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
    },
    {
      title: 'Applied Date',
      dataIndex: 'joinedDate',
      key: 'joinedDate',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            icon={<CheckOutlined />}
            onClick={() => handleApprove(record.id)}
          >
            Approve
          </Button>
          <Button
            danger
            icon={<CloseOutlined />}
            onClick={() => handleReject(record.id)}
          >
            Reject
          </Button>
        </Space>
      ),
    },
  ];

  const activeColumns = [
    {
      title: 'Business',
      dataIndex: 'businessName',
      key: 'businessName',
      render: (text, record) => (
        <Space>
          <Avatar src={record.logo} icon={<ShopOutlined />} />
          <div>
            <div className="font-medium">{text}</div>
            <div className="text-xs text-gray-500">{record.ownerName}</div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <StatusTag status={status} />,
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
      title: 'Commission Rate',
      dataIndex: 'commission',
      key: 'commission',
      render: (rate) => `${rate}%`,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button size="small">View Details</Button>
          {record.status !== 'suspended' && (
            <Button
              size="small"
              danger
              icon={<StopOutlined />}
              onClick={() => handleSuspend(record.id)}
            >
              Suspend
            </Button>
          )}
          {record.status === 'suspended' && (
            <Button
              size="small"
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => vendorsAPI.unsuspendVendor(record.id)}
            >
              Unsuspend
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const tabItems = [
    {
      key: 'pending',
      label: `Pending Approvals (${pendingVendors.length})`,
      children: (
        <Table
          columns={pendingColumns}
          dataSource={pendingVendors}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      ),
    },
    {
      key: 'active',
      label: 'Active Vendors',
      children: (
        <div>
          <Row gutter={16} className="mb-6">
            <Col span={8}>
              <Card>
                <Statistic
                  title="Total Active Vendors"
                  value={activeVendors.length}
                  prefix={<ShopOutlined />}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="Total Sales"
                  value={activeVendors.reduce((sum, v) => sum + (v.totalSales || 0), 0)}
                  prefix="₹"
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="Total Products"
                  value={activeVendors.reduce((sum, v) => sum + (v.productsCount || 0), 0)}
                  prefix={<AppstoreOutlined />}
                />
              </Card>
            </Col>
          </Row>
          <Table
            columns={activeColumns}
            dataSource={activeVendors}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
          />
        </div>
      ),
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Vendor Management</h1>
      <Tabs items={tabItems} />
    </div>
  );
};

export default VendorManagement;

