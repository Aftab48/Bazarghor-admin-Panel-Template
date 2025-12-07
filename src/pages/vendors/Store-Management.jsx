import { useState, useEffect } from "react";
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  message,
  Tabs,
  Avatar,
  Statistic,
  Row,
  Col,
  Input,
  Switch,
} from "antd";
import {
  StopOutlined,
  CheckCircleOutlined as UnsuspendIcon,
  ShopOutlined,
  AppstoreOutlined,
  SearchOutlined,
  DollarOutlined,
  StarOutlined,
} from "@ant-design/icons";
import { vendorsAPI, productsAPI, storeAPI } from "../../services/api";
import StatusTag from "../../components/common/StatusTag";

const VENDOR_STATUS = {
  PENDING: 1,
  APPROVED: 2,
  REJECTED: 3,
};

const extractSubscriptionPlan = (entity) => {
  if (!entity) return "N/A";
  if (Array.isArray(entity.subscriptions) && entity.subscriptions.length > 0) {
    return entity.subscriptions[0]?.subscriptionPlan || "N/A";
  }
  return (
    entity.subscriptionPlan?.name ||
    entity.subscriptionPlan ||
    entity.planName ||
    "N/A"
  );
};

const normalizeStatusCode = (status) => {
  if (typeof status === "number") return status;
  const statusStr = String(status || "").toLowerCase();
  if (statusStr === "pending") return VENDOR_STATUS.PENDING;
  if (statusStr === "approved" || statusStr === "active")
    return VENDOR_STATUS.APPROVED;
  if (statusStr === "rejected" || statusStr === "inactive")
    return VENDOR_STATUS.REJECTED;
  return status;
};

const VendorManagement = () => {
  const [loading, setLoading] = useState(false);
  const [pendingVendors, setPendingVendors] = useState([]);
  const [activeVendors, setActiveVendors] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  const [viewStoreModalVisible, setViewStoreModalVisible] = useState(false);
  const [selectedStore, setSelectedStore] = useState(null);
  const [storeLoading, setStoreLoading] = useState(false);

  useEffect(() => {
    fetchVendors();
  }, []);

  const getStoreImage = (record) => {
    const pic =
      record?.storePictures?.[0] ||
      (Array.isArray(record?.storePictures) && record.storePictures[0]);
    const picUri = pic?.uri || pic;
    return (
      picUri ||
      record?.logo ||
      record?.profilePicture?.uri ||
      record?.profilePicture
    );
  };

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const [allVendors, products] = await Promise.all([
        vendorsAPI.getAll(),
        productsAPI.getAll(),
      ]);

      const productCounts = Array.isArray(products)
        ? products.reduce((acc, product) => {
            const vendorKey =
              product.vendorId || product.storeId || product.vendor?._id;
            if (!vendorKey) return acc;
            acc[vendorKey] = (acc[vendorKey] || 0) + 1;
            return acc;
          }, {})
        : {};

      const normalizedVendors = Array.isArray(allVendors)
        ? allVendors.map((v) => {
            const vendorKey = v.vendorId || v.storeId || v.id || v._id;
            const storeProductsCount = Array.isArray(v.products)
              ? v.products.length
              : undefined;
            return {
              ...v,
              status: normalizeStatusCode(v.status),
              productsCount:
                storeProductsCount !== undefined
                  ? storeProductsCount
                  : productCounts[vendorKey] !== undefined
                  ? productCounts[vendorKey]
                  : v.productsCount || 0,
              storeOpen: v.isOpen ?? v.storeOpen ?? v.isActive ?? v.storeStatus,
              categoryName:
                v.category?.name || v.categoryName || v.category || "N/A",
              subscriptionPlan: extractSubscriptionPlan(v),
            };
          })
        : [];

      setPendingVendors(normalizedVendors);
      setActiveVendors(
        normalizedVendors.filter((v) => v.status === VENDOR_STATUS.APPROVED)
      );
    } catch (error) {
      message.error(
        error?.response?.data?.message || "Failed to fetch vendors"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async (record, isApproved) => {
    const vendorId =
      record.id || record._id || record.vendorId || record.storeId;
    if (!vendorId) {
      message.error("Vendor id missing");
      return;
    }

    const nextStatus = isApproved
      ? VENDOR_STATUS.APPROVED
      : VENDOR_STATUS.REJECTED;

    setStatusUpdatingId(vendorId);
    try {
      await vendorsAPI.verifyStatus(vendorId, {
        status: nextStatus,
        roleType: "VENDOR",
      });
      message.success(
        isApproved ? "Vendor approved successfully" : "Vendor rejected"
      );
      fetchVendors();
    } catch (error) {
      message.error(
        error?.response?.data?.message || "Failed to update vendor status"
      );
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handleSuspend = async (vendorId) => {
    Modal.confirm({
      title: "Suspend Vendor?",
      content: "This will temporarily disable the vendor account.",
      okText: "Yes, Suspend",
      okType: "danger",
      onOk: async () => {
        try {
          await vendorsAPI.suspendVendor(vendorId);
          message.success("Vendor suspended");
          fetchVendors();
        } catch (error) {
          message.error(
            error?.response?.data?.message || "Failed to suspend vendor"
          );
        }
      },
    });
  };

  const handleUnsuspend = async (vendorId) => {
    try {
      await vendorsAPI.unsuspendVendor(vendorId);
      message.success("Vendor Unsuspended Successfully");
      fetchVendors();
    } catch (error) {
      message.error(
        error?.response?.data?.message || "Failed to unsuspend vendor"
      );
    }
  };

  const handleViewStore = async (record) => {
    const storeId =
      record.storeId || record.id || record._id || record.vendorId;
    if (!storeId) {
      message.error("Store id missing");
      return;
    }
    setViewStoreModalVisible(true);
    setStoreLoading(true);
    try {
      const store = await storeAPI.getById(storeId);
      const normalizedStore = store
        ? {
            ...store,
            storeOpen: store.isStoreOpen,
            categoryName: store.category
              ? subscriptions
              : store.subscriptionPlan?.name ||
                store.subscriptionPlan ||
                store.planName ||
                "N/A",
            productsCount: Array.isArray(store.products)
              ? store.products.length
              : store.productsCount,
          }
        : record;
      setSelectedStore(normalizedStore || record);
    } catch (error) {
      message.error(
        error?.response?.data?.message || "Failed to load store details"
      );
      setSelectedStore(record);
    } finally {
      setStoreLoading(false);
    }
  };

  const pendingColumns = [
    {
      title: "Store Name",
      dataIndex: "storeName",
      key: "storeName",
      responsive: ["xs", "sm", "md"],
      render: (text, record) => {
        const businessName = text || record.storeName || "N/A";
        const ownerName =
          record.ownerName ||
          `${record.firstName || ""} ${record.lastName || ""}`.trim() ||
          "N/A";
        return (
          <Space>
            <Avatar src={getStoreImage(record)} icon={<ShopOutlined />} />
            <div>
              <div className="font-medium">{businessName}</div>
              <div className="text-xs text-gray-500">{ownerName}</div>
            </div>
          </Space>
        );
      },
    },
    {
      title: "View Store",
      key: "viewStore",
      width: 140,
      render: (_, record) => (
        <Button
          // type="primary"
          style={{
            backgroundColor: "#9dda52",
            color: "#3c2f3d",
            borderColor: "#9dda52",
          }}
          icon={<ShopOutlined />}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#9dda52";
            e.currentTarget.style.borderColor = "#9dda52";
            e.currentTarget.style.color = "#3c2f3d";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#9dda52";
            e.currentTarget.style.borderColor = "#9dda52";
            e.currentTarget.style.color = "#3c2f3d";
          }}
          onClick={() => handleViewStore(record)}
        >
          View Store
        </Button>
      ),
    },

    {
      title: "Store Address",
      dataIndex: "storeAddress",
      key: "storeAddress",
      responsive: ["lg"],
      render: (address) => (
        <div style={{ maxWidth: 200 }} className="truncate">
          {address || "N/A"}
        </div>
      ),
    },
    {
      title: "Contact",
      dataIndex: "email",
      key: "email",
      responsive: ["md"],
      render: (text, record) => (
        <div>
          <div>{text || "N/A"}</div>
          <div className="text-xs text-gray-500">
            {record.phone || record.mobNo || "N/A"}
          </div>
        </div>
      ),
    },
    {
      title: "Applied Date",
      dataIndex: "joinedDate",
      key: "joinedDate",
      responsive: ["lg"],
      render: (date) => (date ? new Date(date).toLocaleDateString() : "N/A"),
    },

    {
      title: "Approval Status",
      dataIndex: "status",
      key: "approvalStatus",
      render: (status) => (
        <StatusTag
          status={status}
          style={(() => {
            const statusCode = normalizeStatusCode(status);
            if (statusCode === VENDOR_STATUS.APPROVED)
              return { backgroundColor: "#9dda52", color: "#3c2f3d" };
            if (statusCode === VENDOR_STATUS.REJECTED)
              return { backgroundColor: "#ffbc2c", color: "#3c2f3d" };
            return undefined;
          })()}
        />
      ),
    },
    {
      title: "Approve / Reject",
      key: "approvalToggle",
      width: 160,
      render: (_, record) => {
        const statusCode = normalizeStatusCode(record.status);
        const vendorId =
          record.id || record._id || record.vendorId || record.storeId;
        return (
          <Switch
            checkedChildren="APPROVED"
            unCheckedChildren="REJECTED"
            checked={statusCode === VENDOR_STATUS.APPROVED}
            loading={statusUpdatingId === vendorId}
            style={{
              backgroundColor:
                statusCode === VENDOR_STATUS.APPROVED ? "#9dda52" : "#ffbc2c",
              borderColor:
                statusCode === VENDOR_STATUS.APPROVED ? "#9dda52" : "#ffbc2c",
            }}
            onChange={(checked) => handleStatusToggle(record, checked)}
          />
        );
      },
    },
  ];

  const activeColumns = [
    {
      title: "Store Name",
      dataIndex: "businessName",
      key: "businessName",
      responsive: ["xs", "sm", "md"],
      render: (text, record) => {
        const businessName = text || record.storeName || "N/A";
        const ownerName =
          record.ownerName ||
          `${record.firstName || ""} ${record.lastName || ""}`.trim() ||
          "N/A";
        return (
          <Space>
            <Avatar src={getStoreImage(record)} icon={<ShopOutlined />} />
            <div>
              <div className="font-medium">{businessName}</div>
              <div className="text-xs text-gray-500">{ownerName}</div>
            </div>
          </Space>
        );
      },
    },
    {
      title: "Store Code",
      dataIndex: "storeCode",
      key: "storeCode",
      responsive: ["md"],
      render: (code) => code || "N/A",
    },
    {
      title: "Store Open",
      dataIndex: "storeOpen",
      key: "storeOpen",
      responsive: ["md"],
      render: (val) => (val ? "Open" : "Closed"),
    },
    {
      title: "Category",
      dataIndex: "categoryName",
      key: "categoryName",
      responsive: ["lg"],
      render: (cat) => cat || "N/A",
    },
    {
      title: "Subscription Plan",
      dataIndex: "subscriptionPlan",
      key: "subscriptionPlan",
      responsive: ["lg"],
      render: (plan) => plan || "N/A",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      responsive: ["md"],
      render: (status) => <StatusTag status={status} />,
    },
    {
      title: "Rating",
      dataIndex: "rating",
      key: "rating",
      responsive: ["lg"],
      render: (rating) => (
        <Space>
          <StarOutlined style={{ color: "#faad14" }} />
          {rating || 0}
        </Space>
      ),
      sorter: (a, b) => parseFloat(a.rating || 0) - parseFloat(b.rating || 0),
    },
    {
      title: "Total Sales",
      dataIndex: "totalSales",
      key: "totalSales",
      responsive: ["lg"],
      render: (amount) => `₹${(amount || 0).toLocaleString()}`,
      sorter: (a, b) => (a.totalSales || 0) - (b.totalSales || 0),
    },
    {
      title: "Products",
      dataIndex: "productsCount",
      key: "productsCount",
      responsive: ["lg"],
      render: (count) => count || 0,
      sorter: (a, b) => (a.productsCount || 0) - (b.productsCount || 0),
    },
    {
      title: "Actions",
      key: "actions",
      width: 150,
      render: (_, record) => (
        <Space size="small" wrap>
          {record.status !== "suspended" && (
            <Button
              size="small"
              danger
              icon={<StopOutlined />}
              onClick={() => handleSuspend(record.id || record._id)}
            >
              Suspend
            </Button>
          )}
          {record.status === "suspended" && (
            <Button
              size="small"
              type="primary"
              icon={<UnsuspendIcon />}
              onClick={() => handleUnsuspend(record.id || record._id)}
              style={{
                background: "#9dda52",

                color: "#3c2f3d",
              }}
            >
              Unsuspend
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const filteredPendingVendors = pendingVendors.filter((vendor) => {
    if (!vendor) return false;
    const businessName = (
      vendor.businessName ||
      vendor.storeName ||
      ""
    ).toLowerCase();
    const ownerName = (
      vendor.ownerName ||
      `${vendor.firstName || ""} ${vendor.lastName || ""}`.trim() ||
      ""
    ).toLowerCase();
    const email = (vendor.email || "").toLowerCase();
    const search = searchText.toLowerCase();
    return (
      businessName.includes(search) ||
      ownerName.includes(search) ||
      email.includes(search)
    );
  });

  const filteredActiveVendors = activeVendors.filter((vendor) => {
    if (!vendor) return false;
    const businessName = (
      vendor.businessName ||
      vendor.storeName ||
      ""
    ).toLowerCase();
    const ownerName = (
      vendor.ownerName ||
      `${vendor.firstName || ""} ${vendor.lastName || ""}`.trim() ||
      ""
    ).toLowerCase();
    const email = (vendor.email || "").toLowerCase();
    const search = searchText.toLowerCase();
    return (
      businessName.includes(search) ||
      ownerName.includes(search) ||
      email.includes(search)
    );
  });

  const tabItems = [
    {
      key: "pending",
      label: (
        <span>
          All Vendors{" "}
          <span style={{ color: "#ff4d4f" }}>({pendingVendors.length})</span>
        </span>
      ),
      children: (
        <div>
          <Table
            columns={pendingColumns}
            dataSource={filteredPendingVendors}
            rowKey={(record) => record?.id || record?._id || Math.random()}
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} pending vendors`,
            }}
            scroll={{ x: "max-content" }}
          />
        </div>
      ),
    },
    {
      key: "active",
      label: "Active Vendors",
      children: (
        <div>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} md={8}>
              <Card>
                <Statistic
                  title="Total Active Vendors"
                  value={activeVendors.length}
                  prefix={<ShopOutlined />}
                  valueStyle={{ color: "#3c2f3d" }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card>
                <Statistic
                  title="Total Sales"
                  value={activeVendors.reduce(
                    (sum, v) => sum + (v.totalSales || 0),
                    0
                  )}
                  prefix={<DollarOutlined />}
                  valueStyle={{ color: "#52c41a" }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card>
                <Statistic
                  title="Total Products"
                  value={pendingVendors.reduce(
                    (sum, v) => sum + (v.productsCount || 0),
                    0
                  )}
                  prefix={<AppstoreOutlined />}
                  valueStyle={{ color: "#1890ff" }}
                />
              </Card>
            </Col>
          </Row>
          <Table
            columns={activeColumns}
            dataSource={filteredActiveVendors}
            rowKey={(record) => record?.id || record?._id || Math.random()}
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} active vendors`,
            }}
            scroll={{ x: "max-content" }}
          />
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div
        style={{
          background: "#ffffff",
          padding: "clamp(16px, 2vw, 24px)",
          borderRadius: "8px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
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
            Store Management
          </h1>
          <Input
            placeholder="Search vendors..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: "100%", maxWidth: 380, minWidth: 220, flex: 1 }}
            size="large"
            allowClear
          />
        </div>
      </div>

      <div
        style={{
          background: "#ffffff",
          padding: "clamp(16px, 2vw, 24px)",
          borderRadius: "8px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
        }}
      >
        <Tabs
          items={tabItems}
          activeKey={activeTab}
          onChange={setActiveTab}
          onTabClick={(key) => {
            setActiveTab(key);
            setSearchText("");
          }}
        />
        <Modal
          title="Store Details"
          open={viewStoreModalVisible}
          onCancel={() => {
            setViewStoreModalVisible(false);
            setSelectedStore(null);
          }}
          footer={[
            <Button
              key="close"
              onClick={() => {
                setViewStoreModalVisible(false);
                setSelectedStore(null);
              }}
              style={{
                color: "#ffffff",
                backgroundColor: "#3c2f3d",
                borderColor: "#3c2f3d",
              }}
            >
              Close
            </Button>,
          ]}
          width={800}
          centered
        >
          {storeLoading ? (
            <p>Loading store details...</p>
          ) : selectedStore ? (
            <div style={{ marginTop: 12 }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <Avatar
                  size={64}
                  src={getStoreImage(selectedStore)}
                  icon={<ShopOutlined />}
                />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 16 }}>
                    {selectedStore.storeName ||
                      selectedStore.businessName ||
                      "N/A"}
                  </div>
                  <div style={{ color: "#666" }}>
                    Owner:{" "}
                    {selectedStore.ownerName ||
                      `${selectedStore.firstName || ""} ${
                        selectedStore.lastName || ""
                      }`.trim() ||
                      "N/A"}
                  </div>
                </div>
              </div>

              <div
                style={{
                  marginTop: 16,
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: 12,
                }}
              >
                <div>
                  <strong>Store Code:</strong>{" "}
                  {selectedStore.storeCode || "N/A"}
                </div>
                <div>
                  <strong>Status:</strong>{" "}
                  <StatusTag status={selectedStore.status} />
                </div>
                <div>
                  <strong>Store Open:</strong>{" "}
                  {selectedStore.storeOpen ? "Open" : "Closed"}
                </div>
                <div>
                  <strong>Category:</strong>{" "}
                  {selectedStore.categoryName || "N/A"}
                </div>
                <div>
                  <strong>Subscription Plan:</strong>{" "}
                  {selectedStore.subscriptionPlan || "N/A"}
                </div>
                <div>
                  <strong>Contact:</strong>{" "}
                  {selectedStore.email ||
                    selectedStore.contactNumber ||
                    selectedStore.phone ||
                    selectedStore.mobNo ||
                    "N/A"}
                </div>
                <div>
                  <strong>Phone:</strong>{" "}
                  {selectedStore.contactNumber ||
                    selectedStore.phone ||
                    selectedStore.mobNo ||
                    "N/A"}
                </div>
                <div>
                  <strong>Products:</strong>{" "}
                  {Array.isArray(selectedStore.products)
                    ? selectedStore.products.length
                    : selectedStore.productsCount || 0}
                </div>
                <div>
                  <strong>Address:</strong>{" "}
                  {selectedStore.storeAddress || selectedStore.address || "N/A"}
                </div>
              </div>

              <div style={{ marginTop: 16 }}>
                <strong>Store Pictures:</strong>
                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    flexWrap: "wrap",
                    marginTop: 8,
                  }}
                >
                  {Array.isArray(selectedStore.storePictures) &&
                  selectedStore.storePictures.length > 0 ? (
                    selectedStore.storePictures.map((pic) => {
                      const uri = pic?.uri || pic;
                      return (
                        <a
                          key={uri}
                          href={uri}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <Avatar
                            shape="square"
                            size={72}
                            src={uri}
                            icon={<ShopOutlined />}
                          />
                        </a>
                      );
                    })
                  ) : (
                    <span>No images</span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p>No store selected</p>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default VendorManagement;
