import { useState, useEffect } from "react";
import {
  Table,
  Button,
  Input,
  Space,
  Select,
  DatePicker,
  message,
  Tag,
} from "antd";
import {
  SearchOutlined,
  ExportOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  SwapOutlined,
} from "@ant-design/icons";
import { transactionsAPI } from "../../services/api";
import StatusTag from "../../components/common/StatusTag";

const { RangePicker } = DatePicker;

const formatter = new Intl.NumberFormat("en-IN");
const formatNumber = (value) => formatter.format(value ?? 0);

const Transactions = () => {
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [searchText, setSearchText] = useState("");
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
      message.error("Failed to fetch transactions");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "Transaction ID",
      dataIndex: "transactionId",
      key: "transactionId",
      render: (text) => (
        <code className="text-xs bg-gray-100 px-2 py-1 rounded">{text}</code>
      ),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (type) => {
        const colors = {
          "Order Payment": "blue",
          "Vendor Payout": "green",
          Refund: "orange",
          Commission: "purple",
        };
        return <Tag color={colors[type]}>{type}</Tag>;
      },
      filters: [
        { text: "Order Payment", value: "Order Payment" },
        { text: "Vendor Payout", value: "Vendor Payout" },
        { text: "Refund", value: "Refund" },
        { text: "Commission", value: "Commission" },
      ],
      onFilter: (value, record) => record.type === value,
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (amount, record) => {
        const isCredit = ["Order Payment", "Commission"].includes(record.type);
        return (
          <span
            className={
              isCredit
                ? "text-green-600 font-medium"
                : "text-red-600 font-medium"
            }
          >
            {isCredit ? "+" : "-"}₹{amount}
          </span>
        );
      },
      sorter: (a, b) => a.amount - b.amount,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => <StatusTag status={status} />,
      filters: [
        { text: "Pending", value: "pending" },
        { text: "Completed", value: "completed" },
        { text: "Failed", value: "failed" },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: "Method",
      dataIndex: "method",
      key: "method",
    },
    {
      title: "Reference",
      dataIndex: "reference",
      key: "reference",
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
    },
    {
      title: "Date",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date) => new Date(date).toLocaleString(),
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    },
  ];

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.transactionId
        .toLowerCase()
        .includes(searchText.toLowerCase()) ||
      transaction.reference.toLowerCase().includes(searchText.toLowerCase()) ||
      transaction.description.toLowerCase().includes(searchText.toLowerCase());

    const matchesType = !selectedType || transaction.type === selectedType;

    return matchesSearch && matchesType;
  });

  const totalAmount = filteredTransactions.reduce(
    (sum, t) => sum + t.amount,
    0
  );
  const totalCompleted = filteredTransactions
    .filter((t) => t.status === "completed")
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div
        style={{
          background: "#ffffff",
          padding: "clamp(16px, 2vw, 24px)",
          borderRadius: "8px",
          boxShadow: "0 0 14px rgba(0,0,0,0.09)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            rowGap: 12,
            flexWrap: "wrap",
          }}
        >
          <h1
            style={{
              fontSize: "24px",
              fontWeight: "bold",
              color: "#3c2f3d",
              margin: 0,
            }}
          >
            Payments & Transactions
          </h1>

          <Space
            className="flex flex-wrap gap-3"
            size="middle"
            style={{ justifyContent: "flex-end", flex: 1, minWidth: 220 }}
          >
            <Button
              icon={<ExportOutlined />}
              style={{
                background: "#9dda52",
                borderColor: "#9dda52",
                color: "#3c2f3d",
              }}
            >
              Export Report
            </Button>
          </Space>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 12,
            marginTop: 16,
          }}
        >
          {[
            {
              key: "count",
              label: "Total Transactions",
              value: formatNumber(filteredTransactions.length),
              icon: <SwapOutlined />,
              iconBg: "#eef2ff",
              iconColor: "#4f46e5",
            },
            {
              key: "amount",
              label: "Total Amount",
              value: `₹${formatNumber(totalAmount)}`,
              icon: <DollarOutlined />,
              iconBg: "#ecfdf5",
              iconColor: "#10b981",
            },
            {
              key: "completed",
              label: "Completed Amount",
              value: `₹${formatNumber(totalCompleted)}`,
              icon: <CheckCircleOutlined />,
              iconBg: "#fefce8",
              iconColor: "#ca8a04",
            },
          ].map((stat) => (
            <div
              key={stat.key}
              style={{
                background: "#f8fafc",
                borderRadius: 10,
                padding: "14px 16px",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: stat.iconBg,
                  color: stat.iconColor,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 22,
                }}
              >
                {stat.icon}
              </div>
              <div>
                <div style={{ fontSize: 13, color: "#6b7280" }}>
                  {stat.label}
                </div>
                <div
                  style={{ fontSize: 20, fontWeight: 700, color: "#111827" }}
                >
                  {stat.value}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          background: "#ffffff",
          padding: "clamp(16px, 2vw, 24px)",
          borderRadius: "8px",
          boxShadow: "0 0 14px rgba(0,0,0,0.09)",
        }}
      >
        <Space
          className="flex flex-wrap gap-3"
          size="middle"
          style={{ marginBottom: 16 }}
          wrap
        >
          <Input
            allowClear
            placeholder="Search transactions..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: "100%", maxWidth: 360, minWidth: 220, flex: 1 }}
            size="large"
          />
          <Select
            placeholder="Filter by type"
            style={{ width: "100%", maxWidth: 240, minWidth: 200 }}
            allowClear
            value={selectedType}
            onChange={setSelectedType}
            options={[
              { label: "Order Payment", value: "Order Payment" },
              { label: "Vendor Payout", value: "Vendor Payout" },
              { label: "Refund", value: "Refund" },
              { label: "Commission", value: "Commission" },
            ]}
          />
          <RangePicker
            style={{ width: "100%", maxWidth: 320, minWidth: 220 }}
          />
        </Space>

        <Table
          columns={columns}
          dataSource={filteredTransactions}
          rowKey={(record) =>
            record?.id || record?._id || record?.transactionId
          }
          loading={loading}
          scroll={{ x: 980 }}
          size="middle"
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} transactions`,
          }}
        />
      </div>
    </div>
  );
};

export default Transactions;
