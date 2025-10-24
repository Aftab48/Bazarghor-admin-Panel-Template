import { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, Switch, DatePicker, message, Image, Upload } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined } from '@ant-design/icons';
import { promotionsAPI } from '../../services/api';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

const Banners = () => {
  const [loading, setLoading] = useState(false);
  const [banners, setBanners] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const data = await promotionsAPI.getBanners();
      setBanners(data);
    } catch (error) {
      message.error('Failed to fetch banners');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingBanner(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (banner) => {
    setEditingBanner(banner);
    form.setFieldsValue({
      ...banner,
      dateRange: [dayjs(banner.startDate), dayjs(banner.endDate)],
    });
    setModalVisible(true);
  };

  const handleDelete = async (bannerId) => {
    Modal.confirm({
      title: 'Delete Banner',
      content: 'Are you sure you want to delete this banner?',
      okText: 'Yes, Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await promotionsAPI.deleteBanner(bannerId);
          message.success('Banner deleted successfully');
          fetchBanners();
        } catch (error) {
          message.error('Failed to delete banner');
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

      if (editingBanner) {
        await promotionsAPI.updateBanner(editingBanner.id, data);
        message.success('Banner updated successfully');
      } else {
        await promotionsAPI.createBanner(data);
        message.success('Banner created successfully');
      }
      setModalVisible(false);
      fetchBanners();
    } catch (error) {
      message.error('Failed to save banner');
    }
  };

  const columns = [
    {
      title: 'Image',
      dataIndex: 'image',
      key: 'image',
      render: (image) => (
        <Image
          src={image}
          alt="Banner"
          width={120}
          height={40}
          className="rounded"
        />
      ),
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <div>
          <div className="font-medium">{text}</div>
          <div className="text-xs text-gray-500">{record.description}</div>
        </div>
      ),
    },
    {
      title: 'Link',
      dataIndex: 'link',
      key: 'link',
      render: (link) => (
        <a href={link} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-xs">
          {link}
        </a>
      ),
    },
    {
      title: 'Period',
      key: 'period',
      render: (_, record) => (
        <div className="text-xs">
          <div>{record.startDate}</div>
          <div className="text-gray-500">to {record.endDate}</div>
        </div>
      ),
    },
    {
      title: 'Order',
      dataIndex: 'order',
      key: 'order',
      sorter: (a, b) => a.order - b.order,
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive) => (
        <Switch checked={isActive} disabled />
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
        <h1 className="text-2xl font-bold text-gray-800">Banners</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          Add Banner
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={banners}
        rowKey="id"
        loading={loading}
        pagination={false}
      />

      <Modal
        title={editingBanner ? 'Edit Banner' : 'Add Banner'}
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
            name="title"
            label="Title"
            rules={[{ required: true, message: 'Please enter title' }]}
          >
            <Input placeholder="Enter banner title" />
          </Form.Item>
          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please enter description' }]}
          >
            <Input.TextArea rows={2} placeholder="Enter description" />
          </Form.Item>
          <Form.Item
            name="link"
            label="Link URL"
            rules={[{ required: true, message: 'Please enter link' }]}
          >
            <Input placeholder="/promotions/summer-sale" />
          </Form.Item>
          <Form.Item
            name="image"
            label="Image URL"
            rules={[{ required: true, message: 'Please enter image URL' }]}
          >
            <Input placeholder="https://..." />
          </Form.Item>
          <Form.Item
            name="dateRange"
            label="Active Period"
            rules={[{ required: true, message: 'Please select date range' }]}
          >
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="order"
            label="Display Order"
            initialValue={1}
          >
            <Input type="number" min={1} />
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

export default Banners;

