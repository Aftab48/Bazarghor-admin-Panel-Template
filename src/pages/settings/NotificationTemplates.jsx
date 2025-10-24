import { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, message, Tag } from 'antd';
import { EditOutlined, MailOutlined, MessageOutlined, BellOutlined } from '@ant-design/icons';
import { settingsAPI } from '../../services/api';

const { TextArea } = Input;

const NotificationTemplates = () => {
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const data = await settingsAPI.getNotificationTemplates();
      setTemplates(data);
    } catch (error) {
      message.error('Failed to fetch templates');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    form.setFieldsValue(template);
    setModalVisible(true);
  };

  const handleSubmit = async (values) => {
    message.success('Template updated successfully');
    setModalVisible(false);
    fetchTemplates();
  };

  const getTypeIcon = (type) => {
    const icons = {
      email: <MailOutlined />,
      sms: <MessageOutlined />,
      push: <BellOutlined />,
    };
    return icons[type] || <BellOutlined />;
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <span className="font-medium">{text}</span>,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => (
        <Space>
          {getTypeIcon(type)}
          <Tag color={type === 'email' ? 'blue' : type === 'sms' ? 'green' : 'purple'}>
            {type.toUpperCase()}
          </Tag>
        </Space>
      ),
      filters: [
        { text: 'Email', value: 'email' },
        { text: 'SMS', value: 'sms' },
        { text: 'Push', value: 'push' },
      ],
      onFilter: (value, record) => record.type === value,
    },
    {
      title: 'Template',
      dataIndex: 'template',
      key: 'template',
      render: (template) => (
        <div className="text-sm text-gray-600 max-w-md truncate">
          {template}
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button
          size="small"
          icon={<EditOutlined />}
          onClick={() => handleEdit(record)}
        >
          Edit
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Notification Templates</h1>
      </div>

      <div className="mb-4 p-4 bg-blue-50 rounded">
        <div className="font-medium text-blue-800 mb-2">Available Variables:</div>
        <div className="text-sm text-blue-700">
          <code className="bg-blue-100 px-2 py-1 rounded mx-1">{'{{orderNumber}}'}</code>
          <code className="bg-blue-100 px-2 py-1 rounded mx-1">{'{{customerName}}'}</code>
          <code className="bg-blue-100 px-2 py-1 rounded mx-1">{'{{amount}}'}</code>
          <code className="bg-blue-100 px-2 py-1 rounded mx-1">{'{{date}}'}</code>
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={templates}
        rowKey="id"
        loading={loading}
        pagination={false}
      />

      <Modal
        title="Edit Notification Template"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        okText="Save"
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="name"
            label="Template Name"
          >
            <Input disabled />
          </Form.Item>
          <Form.Item
            name="type"
            label="Type"
          >
            <Select disabled>
              <Select.Option value="email">Email</Select.Option>
              <Select.Option value="sms">SMS</Select.Option>
              <Select.Option value="push">Push Notification</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="template"
            label="Template Content"
            rules={[{ required: true, message: 'Please enter template content' }]}
          >
            <TextArea
              rows={6}
              placeholder="Your order {{orderNumber}} has been confirmed."
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default NotificationTemplates;

