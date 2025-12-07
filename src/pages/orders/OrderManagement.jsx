import { useState, useEffect } from "react";
import {
  Table,
  Button,
  Tabs,
  Space,
  Select,
  Modal,
  Input,
  message,
  Tag,
} from "antd";
import {
  ExportOutlined,
  EyeOutlined,
  UserSwitchOutlined,
} from "@ant-design/icons";
import { ordersAPI, deliveryPartnersAPI } from "../../services/api";
import StatusTag from "../../components/common/StatusTag";
import { ORDER_STATUS } from "../../constants/statuses";

const { TextArea } = Input;

const OrderManagement = () => {
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [agents, setAgents] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersData, agentsData] = await Promise.all([
        ordersAPI.getAll(),
        deliveryPartnersAPI.getAll(),
      ]);
      setOrders(ordersData);
      setAgents(agentsData.filter((a) => a.status === "active"));
    } catch {
      message.error("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignAgent = (order) => {
    setSelectedOrder(order);
    setAssignModalVisible(true);
  };

  const handleAssignSubmit = async (agentId) => {
    try {
      await ordersAPI.assignAgent(selectedOrder.id, agentId);

      // Find the agent name
      const agent = agents.find((a) => a.id === agentId);

      // Update local state immediately
      setOrders(
        orders.map((o) =>
          o.id === selectedOrder.id
            ? { ...o, agentId, agentName: agent?.name || "Unknown Agent" }
            : o
        )
      );

      message.success("Agent assigned successfully");
      setAssignModalVisible(false);
    } catch {
      message.error("Failed to assign agent");
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await ordersAPI.updateStatus(orderId, newStatus);

      // Update local state immediately
      setOrders(
        orders.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );

      message.success("Order status updated");
    } catch {
      message.error("Failed to update status");
    }
  };

  const handleRefund = (order) => {
    Modal.confirm({
      title: "Process Refund",
      content: (
        <div>
          <p>
            Are you sure you want to process a refund for order{" "}
            {order.orderNumber}?
          </p>
          <p className="mt-2 font-medium">Amount: ₹{order.total}</p>
        </div>
      ),
      okText: "Process Refund",
      okType: "danger",
      onOk: async () => {
        try {
          await ordersAPI.processRefund(order.id, { amount: order.total });

          // Update local state immediately
          setOrders(
            orders.map((o) =>
              o.id === order.id
                ? {
                    ...o,
                    status: ORDER_STATUS.REFUNDED,
                    paymentStatus: "refunded",
                  }
                : o
            )
          );

          message.success("Refund processed successfully");
        } catch {
          message.error("Failed to process refund");
        }
      },
    });
  };

  const columns = [
    {
      title: "Order #",
      dataIndex: "orderNumber",
      key: "orderNumber",
      render: (text) => (
        <span className="font-medium text-blue-600">{text}</span>
      ),
    },
    {
      title: "Customer",
      dataIndex: "customerName",
      key: "customerName",
    },
    {
      title: "Vendor",
      dataIndex: "vendorName",
      key: "vendorName",
    },
    {
      title: "Agent",
      dataIndex: "agentName",
      key: "agentName",
      render: (agent, record) =>
        agent ? (
          <span>{agent}</span>
        ) : (
          <Button
            size="small"
            type="link"
            icon={<UserSwitchOutlined />}
            onClick={() => handleAssignAgent(record)}
          >
            Assign
          </Button>
        ),
    },
    {
      title: "Items",
      dataIndex: "items",
      key: "items",
    },
    {
      title: "Total",
      dataIndex: "total",
      key: "total",
      render: (total) => `₹${total}`,
      sorter: (a, b) => a.total - b.total,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status, record) => (
        <Select
          value={status}
          onChange={(newStatus) => handleUpdateStatus(record.id, newStatus)}
          size="small"
          style={{ width: 130 }}
        >
          {Object.entries(ORDER_STATUS).map(([key, value]) => (
            <Select.Option key={value} value={value}>
              {key.replace(/_/g, " ")}
            </Select.Option>
          ))}
        </Select>
      ),
    },
    {
      title: "Payment",
      dataIndex: "paymentStatus",
      key: "paymentStatus",
      render: (status) => <StatusTag status={status} />,
    },
    {
      title: "Date",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date) => new Date(date).toLocaleDateString(),
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />}>
            View
          </Button>
          {record.paymentStatus === "completed" &&
            record.status !== "refunded" && (
              <Button size="small" danger onClick={() => handleRefund(record)}>
                Refund
              </Button>
            )}
        </Space>
      ),
    },
  ];

  const filterOrdersByStatus = (status) => {
    if (status === "all") return orders;
    return orders.filter((order) => order.status === status);
  };

  const tabItems = [
    {
      key: "all",
      label: `All (${orders.length})`,
      children: (
        <Table
          columns={columns}
          dataSource={orders}
          rowKey="id"
          loading={loading}
        />
      ),
    },
    {
      key: ORDER_STATUS.PENDING,
      label: `Pending (${filterOrdersByStatus(ORDER_STATUS.PENDING).length})`,
      children: (
        <Table
          columns={columns}
          dataSource={filterOrdersByStatus(ORDER_STATUS.PENDING)}
          rowKey="id"
          loading={loading}
        />
      ),
    },
    {
      key: "ongoing",
      label: `Ongoing (${
        orders.filter((o) =>
          [
            ORDER_STATUS.CONFIRMED,
            ORDER_STATUS.PREPARING,
            ORDER_STATUS.IN_TRANSIT,
          ].includes(o.status)
        ).length
      })`,
      children: (
        <Table
          columns={columns}
          dataSource={orders.filter((o) =>
            [
              ORDER_STATUS.CONFIRMED,
              ORDER_STATUS.PREPARING,
              ORDER_STATUS.IN_TRANSIT,
            ].includes(o.status)
          )}
          rowKey="id"
          loading={loading}
        />
      ),
    },
    {
      key: ORDER_STATUS.DELIVERED,
      label: `Completed (${
        filterOrdersByStatus(ORDER_STATUS.DELIVERED).length
      })`,
      children: (
        <Table
          columns={columns}
          dataSource={filterOrdersByStatus(ORDER_STATUS.DELIVERED)}
          rowKey="id"
          loading={loading}
        />
      ),
    },
    {
      key: ORDER_STATUS.CANCELLED,
      label: `Cancelled (${
        filterOrdersByStatus(ORDER_STATUS.CANCELLED).length
      })`,
      children: (
        <Table
          columns={columns}
          dataSource={filterOrdersByStatus(ORDER_STATUS.CANCELLED)}
          rowKey="id"
          loading={loading}
        />
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Order Management</h1>
        <Button icon={<ExportOutlined />}>Export Orders</Button>
      </div>

      <Tabs items={tabItems} />

      <Modal
        title="Assign Delivery Agent"
        open={assignModalVisible}
        onCancel={() => setAssignModalVisible(false)}
        footer={null}
      >
        <div className="space-y-3">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="p-3 border rounded hover:bg-gray-50 cursor-pointer"
              onClick={() => handleAssignSubmit(agent.id)}
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">{agent.name}</div>
                  <div className="text-sm text-gray-500">
                    {agent.vehicleType} - {agent.phone}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm">⭐ {agent.rating}</div>
                  <div className="text-xs text-gray-500">
                    {agent.ordersDelivered} deliveries
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
};

export default OrderManagement;
