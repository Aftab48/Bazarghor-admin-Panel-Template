import { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, Checkbox, message, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, TeamOutlined } from '@ant-design/icons';
import { settingsAPI } from '../../services/api';

const RolesPermissions = () => {
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [form] = Form.useForm();

  const allPermissions = [
    { key: 'users', label: 'User Management' },
    { key: 'vendors', label: 'Vendor Management' },
    { key: 'agents', label: 'Delivery Agent Management' },
    { key: 'products', label: 'Product Management' },
    { key: 'orders', label: 'Order Management' },
    { key: 'transactions', label: 'Payments & Transactions' },
    { key: 'promotions', label: 'Promotions & Banners' },
    { key: 'analytics', label: 'Analytics & Reports' },
    { key: 'settings', label: 'System Settings' },
    { key: 'tickets', label: 'Support Tickets' },
    { key: 'audit', label: 'Audit Logs' },
  ];

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const data = await settingsAPI.getRoles();
      setRoles(data);
    } catch (error) {
      message.error('Failed to fetch roles');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingRole(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (role) => {
    setEditingRole(role);
    form.setFieldsValue(role);
    setModalVisible(true);
  };

  const handleSubmit = async (values) => {
    message.success(`Role ${editingRole ? 'updated' : 'created'} successfully`);
    setModalVisible(false);
    fetchRoles();
  };

  const columns = [
    {
      title: 'Role Name',
      dataIndex: 'name',
      key: 'name',
      render: (text) => (
        <Space>
          <TeamOutlined />
          <span className="font-medium">{text}</span>
        </Space>
      ),
    },
    {
      title: 'Permissions',
      dataIndex: 'permissions',
      key: 'permissions',
      render: (permissions) => {
        if (!permissions || !Array.isArray(permissions)) {
          return <Tag>No permissions</Tag>;
        }
        return (
          <div className="flex flex-wrap gap-1">
            {permissions.includes('all') ? (
              <Tag color="blue">All Permissions</Tag>
            ) : (
              permissions.map(perm => (
                <Tag key={perm}>{perm}</Tag>
              ))
            )}
          </div>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          {record.name !== 'Super Admin' && (
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
            >
              Delete
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Roles & Permissions</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          Add Role
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={roles}
        rowKey="id"
        loading={loading}
        pagination={false}
      />

      <Modal
        title={editingRole ? 'Edit Role' : 'Add Role'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        okText="Save"
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="name"
            label="Role Name"
            rules={[{ required: true, message: 'Please enter role name' }]}
          >
            <Input placeholder="e.g., Support Manager" />
          </Form.Item>
          <Form.Item
            name="permissions"
            label="Permissions"
            rules={[{ required: true, message: 'Please select at least one permission' }]}
          >
            <Checkbox.Group>
              <div className="grid grid-cols-2 gap-2">
                {allPermissions.map(perm => (
                  <Checkbox key={perm.key} value={perm.key}>
                    {perm.label}
                  </Checkbox>
                ))}
              </div>
            </Checkbox.Group>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default RolesPermissions;

