import { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, Switch, DatePicker, message, Tag, Progress } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, PercentageOutlined } from '@ant-design/icons';
import { promotionsAPI } from '../../services/api';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

const DiscountCodes = () => {
  const [loading, setLoading] = useState(false);
  const [discountCodes, setDiscountCodes] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCode, setEditingCode] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchDiscountCodes();
  }, []);

  const fetchDiscountCodes = async () => {
    setLoading(true);
    try {
      const data = await promotionsAPI.getDiscountCodes();
      setDiscountCodes(data);
    } catch (error) {
      message.error('Failed to fetch discount codes');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingCode(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (code) => {
    setEditingCode(code);
    form.setFieldsValue({
      ...code,
      dateRange: [dayjs(code.startDate), dayjs(code.endDate)],
    });
    setModalVisible(true);
  };

  const handleDelete = async (codeId) => {
    Modal.confirm({
      title: 'Delete Discount Code',
      content: 'Are you sure you want to delete this discount code?',
      okText: 'Yes, Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await promotionsAPI.deleteDiscountCode(codeId);
          message.success('Discount code deleted successfully');
          fetchDiscountCodes();
        } catch (error) {
          message.error('Failed to delete discount code');
        }
      },
    });
  };

  const handleSubmit = async (values) => {
    try {
      const data = {
        ...values,
        startDate: values.dateRange[0].format('YYYY-MM-DD'),
        endDate: values.dateRange[1].format('YYYY-MM-DD'),
      };
      delete data.dateRange;

      if (editingCode) {
        await promotionsAPI.updateDiscountCode(editingCode.id, data);
        message.success('Discount code updated successfully');
      } else {
        await promotionsAPI.createDiscountCode(data);
        message.success('Discount code created successfully');
      }
      setModalVisible(false);
      fetchDiscountCodes();
    } catch (error) {
      message.error('Failed to save discount code');
    }
  };

  const columns = [
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      render: (code) => (
        <code className="bg-blue-50 text-blue-600 px-3 py-1 rounded font-bold">
          {code}
        </code>
      ),
    },
    {
      title: 'Discount',
      key: 'discount',
      render: (_, record) => (
        <div>
          <div className="font-medium">
            {record.type === 'percentage' ? `${record.discount}%` : `$${record.discount}`}
          </div>
          <div className="text-xs text-gray-500">
            {record.type === 'percentage' ? 'Percentage' : 'Fixed Amount'}
          </div>
        </div>
      ),
    },
    {
      title: 'Min Order',
      dataIndex: 'minOrder',
      key: 'minOrder',
      render: (amount) => `₹${amount}`,
    },
    {
      title: 'Max Discount',
      dataIndex: 'maxDiscount',
      key: 'maxDiscount',
      render: (amount) => amount ? `₹${amount}` : 'Unlimited',
    },
    {
      title: 'Usage',
      key: 'usage',
      render: (_, record) => {
        if (!record.usageLimit) {
          return (
            <div>
              <div className="font-medium">{record.usageCount} times</div>
              <div className="text-xs text-gray-500">Unlimited</div>
            </div>
          );
        }
        const percentage = (record.usageCount / record.usageLimit) * 100;
        return (
          <div>
            <div className="text-xs mb-1">{record.usageCount} / {record.usageLimit}</div>
            <Progress percent={percentage} size="small" showInfo={false} />
          </div>
        );
      },
    },
    {
      title: 'Valid Period',
      key: 'period',
      render: (_, record) => (
        <div className="text-xs">
          <div>{record.startDate}</div>
          <div className="text-gray-500">to {record.endDate}</div>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
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
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Discount Codes</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          Add Discount Code
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={discountCodes}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingCode ? 'Edit Discount Code' : 'Add Discount Code'}
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
            name="code"
            label="Code"
            rules={[{ required: true, message: 'Please enter code' }]}
          >
            <Input placeholder="SUMMER2024" style={{ textTransform: 'uppercase' }} />
          </Form.Item>
          <Form.Item
            name="type"
            label="Discount Type"
            rules={[{ required: true, message: 'Please select type' }]}
            initialValue="percentage"
          >
            <Select>
              <Select.Option value="percentage">Percentage</Select.Option>
              <Select.Option value="fixed">Fixed Amount</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="discount"
            label="Discount Value"
            rules={[{ required: true, message: 'Please enter discount value' }]}
          >
            <Input type="number" min={0} placeholder="20" addonBefore="₹" />
          </Form.Item>
          <Form.Item
            name="minOrder"
            label="Minimum Order Amount"
            rules={[{ required: true, message: 'Please enter minimum order' }]}
          >
            <Input type="number" min={0} placeholder="500" addonBefore="₹" />
          </Form.Item>
          <Form.Item
            name="maxDiscount"
            label="Maximum Discount (optional)"
          >
            <Input type="number" min={0} placeholder="1000" addonBefore="₹" />
          </Form.Item>
          <Form.Item
            name="usageLimit"
            label="Usage Limit (optional)"
          >
            <Input type="number" min={0} placeholder="1000" />
          </Form.Item>
          <Form.Item
            name="dateRange"
            label="Valid Period"
            rules={[{ required: true, message: 'Please select date range' }]}
          >
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="isActive"
            label="Active"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DiscountCodes;

