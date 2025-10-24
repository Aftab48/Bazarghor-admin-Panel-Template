import { useState, useEffect } from 'react';
import { Table, Button, Input, Space, Tag, Image, Switch, message, Dropdown, Select } from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  StarOutlined,
  StarFilled,
} from '@ant-design/icons';
import { productsAPI, categoriesAPI } from '../../services/api';

const Products = () => {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [productsData, categoriesData] = await Promise.all([
        productsAPI.getAll(),
        categoriesAPI.getAll(),
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
      setPagination({ ...pagination, total: productsData.length });
    } catch {
      message.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFeatured = async (productId, currentStatus) => {
    try {
      await productsAPI.toggleFeatured(productId);
      // Update local state immediately
      setProducts(products.map(p => 
        p.id === productId ? { ...p, isFeatured: !currentStatus } : p
      ));
      message.success(`Product ${currentStatus ? 'removed from' : 'added to'} featured`);
    } catch {
      message.error('Failed to update product');
    }
  };

  const handleDelete = async (productId) => {
    try {
      await productsAPI.delete(productId);
      // Remove from local state immediately
      setProducts(products.filter(p => p.id !== productId));
      message.success('Product deleted successfully');
    } catch {
      message.error('Failed to delete product');
    }
  };

  const getActionMenu = (record) => ({
    items: [
      {
        key: 'edit',
        icon: <EditOutlined />,
        label: 'Edit',
      },
      {
        key: 'delete',
        icon: <DeleteOutlined />,
        label: 'Delete',
        danger: true,
        onClick: () => handleDelete(record.id),
      },
    ],
  });

  const columns = [
    {
      title: 'Image',
      dataIndex: 'image',
      key: 'image',
      render: (image) => (
        <Image
          src={image}
          alt="Product"
          width={50}
          height={50}
          className="rounded"
        />
      ),
    },
    {
      title: 'Product',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div>
          <div className="font-medium">{text}</div>
          <div className="text-xs text-gray-500">{record.sku}</div>
        </div>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'categoryId',
      key: 'categoryId',
      render: (categoryId) => {
        const category = categories.find(c => c.id === categoryId);
        return category ? <Tag>{category.name}</Tag> : '-';
      },
    },
    {
      title: 'Vendor',
      dataIndex: 'vendorName',
      key: 'vendorName',
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (price) => `₹${price}`,
      sorter: (a, b) => a.price - b.price,
    },
    {
      title: 'Stock',
      dataIndex: 'stock',
      key: 'stock',
      render: (stock) => (
        <Tag color={stock > 10 ? 'green' : stock > 0 ? 'orange' : 'red'}>
          {stock}
        </Tag>
      ),
      sorter: (a, b) => a.stock - b.stock,
    },
    {
      title: 'Rating',
      dataIndex: 'rating',
      key: 'rating',
      render: (rating, record) => (
        <div>
          <Space>
            <StarFilled className="text-yellow-500" />
            {rating}
          </Space>
          <div className="text-xs text-gray-500">({record.reviewsCount} reviews)</div>
        </div>
      ),
    },
    {
      title: 'Featured',
      dataIndex: 'isFeatured',
      key: 'isFeatured',
      render: (isFeatured, record) => (
        <Switch
          checked={isFeatured}
          onChange={() => handleToggleFeatured(record.id, isFeatured)}
          checkedChildren={<StarFilled />}
          unCheckedChildren={<StarOutlined />}
        />
      ),
      filters: [
        { text: 'Featured', value: true },
        { text: 'Not Featured', value: false },
      ],
      onFilter: (value, record) => record.isFeatured === value,
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
        <Dropdown menu={getActionMenu(record)} trigger={['click']}>
          <Button icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  const filteredProducts = products.filter((product) => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchText.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchText.toLowerCase()) ||
      product.vendorName.toLowerCase().includes(searchText.toLowerCase());
    
    const matchesCategory = !selectedCategory || product.categoryId === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Products</h1>
        <Button type="primary" icon={<PlusOutlined />}>
          Add Product
        </Button>
      </div>

      <Space className="mb-4" size="middle">
        <Input
          placeholder="Search products..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300 }}
        />
        <Select
          placeholder="Filter by category"
          style={{ width: 200 }}
          allowClear
          value={selectedCategory}
          onChange={setSelectedCategory}
          options={categories.map(cat => ({ label: cat.name, value: cat.id }))}
        />
      </Space>

      <Table
        columns={columns}
        dataSource={filteredProducts}
        rowKey="id"
        loading={loading}
        pagination={pagination}
        onChange={(newPagination) => setPagination(newPagination)}
      />
    </div>
  );
};

export default Products;

