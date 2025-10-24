import { useState, useEffect } from 'react';
import { Table, Button, Input, Space, Select, DatePicker, message, Tabs, Tag } from 'antd';
import { SearchOutlined, ExportOutlined, DollarOutlined } from '@ant-design/icons';
import { transactionsAPI } from '../../services/api';
import StatusTag from '../../components/common/StatusTag';

const { RangePicker } = DatePicker;

const Transactions = () => {
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [selectedType, setSelectedType] = useState(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const data = await transactionsAPI.getAll();
      setTransactions(data);
    } catch (error) {
      message.error('Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Transaction ID',
      dataIndex: 'transactionId',
      key: 'transactionId',
      render: (text) => <code className="text-xs bg-gray-100 px-2 py-1 rounded">{text}</code>,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => {
        const colors = {
          'Order Payment': 'blue',
          'Vendor Payout': 'green',
          'Refund': 'orange',
          'Commission': 'purple',
        };
        return <Tag color={colors[type]}>{type}</Tag>;
      },
      filters: [
        { text: 'Order Payment', value: 'Order Payment' },
        { text: 'Vendor Payout', value: 'Vendor Payout' },
        { text: 'Refund', value: 'Refund' },
        { text: 'Commission', value: 'Commission' },
      ],
      onFilter: (value, record) => record.type === value,
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount, record) => {
        const isCredit = ['Order Payment', 'Commission'].includes(record.type);
        return (
          <span className={isCredit ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
            {isCredit ? '+' : '-'}₹{amount}
          </span>
        );
      },
      sorter: (a, b) => a.amount - b.amount,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <StatusTag status={status} />,
      filters: [
        { text: 'Pending', value: 'pending' },
        { text: 'Completed', value: 'completed' },
        { text: 'Failed', value: 'failed' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Method',
      dataIndex: 'method',
      key: 'method',
    },
    {
      title: 'Reference',
      dataIndex: 'reference',
      key: 'reference',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleString(),
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    },
  ];

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.transactionId.toLowerCase().includes(searchText.toLowerCase()) ||
      transaction.reference.toLowerCase().includes(searchText.toLowerCase()) ||
      transaction.description.toLowerCase().includes(searchText.toLowerCase());

    const matchesType = !selectedType || transaction.type === selectedType;

    return matchesSearch && matchesType;
  });

  const totalAmount = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalCompleted = filteredTransactions.filter(t => t.status === 'completed').reduce((sum, t) => sum + t.amount, 0);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Payments & Transactions</h1>
        <Button icon={<ExportOutlined />}>
          Export Report
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-sm text-gray-600">Total Transactions</div>
          <div className="text-2xl font-bold text-blue-600">{filteredTransactions.length}</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-sm text-gray-600">Total Amount</div>
          <div className="text-2xl font-bold text-green-600">₹{totalAmount.toLocaleString()}</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-sm text-gray-600">Completed Amount</div>
          <div className="text-2xl font-bold text-purple-600">₹{totalCompleted.toLocaleString()}</div>
        </div>
      </div>

      <Space className="mb-4" size="middle" wrap>
        <Input
          placeholder="Search transactions..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300 }}
        />
        <Select
          placeholder="Filter by type"
          style={{ width: 200 }}
          allowClear
          value={selectedType}
          onChange={setSelectedType}
          options={[
            { label: 'Order Payment', value: 'Order Payment' },
            { label: 'Vendor Payout', value: 'Vendor Payout' },
            { label: 'Refund', value: 'Refund' },
            { label: 'Commission', value: 'Commission' },
          ]}
        />
        <RangePicker />
      </Space>

      <Table
        columns={columns}
        dataSource={filteredTransactions}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 20 }}
      />
    </div>
  );
};

export default Transactions;

