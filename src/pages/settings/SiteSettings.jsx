import { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Upload, message, InputNumber } from 'antd';
import { UploadOutlined, SaveOutlined } from '@ant-design/icons';
import { settingsAPI } from '../../services/api';

const SiteSettings = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data = await settingsAPI.getSiteSettings();
      form.setFieldsValue(data);
    } catch (error) {
      message.error('Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    setSaving(true);
    try {
      await settingsAPI.updateSiteSettings(values);
      message.success('Settings saved successfully');
    } catch (error) {
      message.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Site Settings</h1>
      </div>

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="siteName"
            label="Site Name"
            rules={[{ required: true, message: 'Please enter site name' }]}
          >
            <Input placeholder="Bazarghor" />
          </Form.Item>

          <Form.Item
            name="logo"
            label="Logo URL"
          >
            <Input placeholder="/logo.png" />
          </Form.Item>

          <Form.Item
            name="taxRate"
            label="Tax Rate (%)"
            rules={[{ required: true, message: 'Please enter tax rate' }]}
          >
            <InputNumber
              min={0}
              max={100}
              style={{ width: '100%' }}
              placeholder="10"
            />
          </Form.Item>

          <Form.Item
            name="currency"
            label="Currency"
            rules={[{ required: true, message: 'Please enter currency' }]}
          >
            <Input placeholder="INR" />
          </Form.Item>

          <Form.Item
            name="appVersion"
            label="App Version"
          >
            <Input placeholder="1.0.0" />
          </Form.Item>

          <Form.Item
            name="supportEmail"
            label="Support Email"
          >
            <Input type="email" placeholder="support@bazarghor.com" />
          </Form.Item>

          <Form.Item
            name="supportPhone"
            label="Support Phone"
          >
            <Input placeholder="+1-555-123-4567" />
          </Form.Item>

          <Form.Item
            name="address"
            label="Company Address"
          >
            <Input.TextArea rows={3} placeholder="123 Main Street, City, Country" />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={saving}
              size="large"
            >
              Save Settings
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default SiteSettings;

