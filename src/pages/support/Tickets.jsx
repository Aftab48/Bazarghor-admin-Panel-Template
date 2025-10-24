import { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Input, Select, message, Drawer, Badge, Timeline } from 'antd';
import { SearchOutlined, EyeOutlined, UserSwitchOutlined, SendOutlined } from '@ant-design/icons';
import { supportAPI } from '../../services/api';
import StatusTag from '../../components/common/StatusTag';
import { TICKET_STATUS, TICKET_PRIORITY } from '../../constants/statuses';

const { TextArea } = Input;

const Tickets = () => {
  const [loading, setLoading] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const data = await supportAPI.getTickets();
      setTickets(data);
    } catch (error) {
      message.error('Failed to fetch tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleViewTicket = async (ticket) => {
    try {
      const details = await supportAPI.getTicketDetails(ticket.id);
      setSelectedTicket(details);
      setDrawerVisible(true);
    } catch (error) {
      message.error('Failed to fetch ticket details');
    }
  };

  const handleReply = async () => {
    if (!replyText.trim()) {
      message.warning('Please enter a reply');
      return;
    }

    try {
      await supportAPI.replyToTicket(selectedTicket.id, replyText);
      message.success('Reply sent successfully');
      setReplyText('');
      fetchTickets();
    } catch (error) {
      message.error('Failed to send reply');
    }
  };

  const handleAssign = (ticketId) => {
    Modal.confirm({
      title: 'Assign Ticket',
      content: (
        <div>
          <p>Assign this ticket to:</p>
          <Select
            style={{ width: '100%', marginTop: 10 }}
            placeholder="Select admin"
            options={[
              { label: 'Admin 1', value: 1 },
              { label: 'Admin 2', value: 2 },
              { label: 'Admin 3', value: 3 },
            ]}
          />
        </div>
      ),
      onOk: async () => {
        try {
          await supportAPI.assignTicket(ticketId, 1);
          message.success('Ticket assigned successfully');
          fetchTickets();
        } catch (error) {
          message.error('Failed to assign ticket');
        }
      },
    });
  };

  const handleUpdateStatus = async (ticketId, newStatus) => {
    try {
      await supportAPI.updateTicketStatus(ticketId, newStatus);
      message.success('Ticket status updated');
      fetchTickets();
      if (selectedTicket && selectedTicket.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status: newStatus });
      }
    } catch (error) {
      message.error('Failed to update status');
    }
  };

  const columns = [
    {
      title: 'Ticket #',
      dataIndex: 'ticketNumber',
      key: 'ticketNumber',
      render: (text) => <span className="font-medium text-blue-600">{text}</span>,
    },
    {
      title: 'Subject',
      dataIndex: 'subject',
      key: 'subject',
      render: (text, record) => (
        <div>
          <div className="font-medium">{text}</div>
          <div className="text-xs text-gray-500">{record.userType} - {record.userName}</div>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <StatusTag status={status} />,
      filters: Object.entries(TICKET_STATUS).map(([key, value]) => ({
        text: key.replace(/_/g, ' '),
        value,
      })),
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority) => <StatusTag status={priority} />,
      filters: Object.entries(TICKET_PRIORITY).map(([key, value]) => ({
        text: key,
        value,
      })),
      onFilter: (value, record) => record.priority === value,
    },
    {
      title: 'Assigned To',
      dataIndex: 'assignedTo',
      key: 'assignedTo',
      render: (assignedTo, record) => (
        assignedTo ? (
          <span>{assignedTo}</span>
        ) : (
          <Button
            size="small"
            type="link"
            icon={<UserSwitchOutlined />}
            onClick={() => handleAssign(record.id)}
          >
            Assign
          </Button>
        )
      ),
    },
    {
      title: 'Messages',
      dataIndex: 'messages',
      key: 'messages',
      render: (messages) => <Badge count={messages} showZero />,
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleDateString(),
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleViewTicket(record)}
        >
          View
        </Button>
      ),
    },
  ];

  const filteredTickets = tickets.filter(
    (ticket) =>
      ticket.ticketNumber.toLowerCase().includes(searchText.toLowerCase()) ||
      ticket.subject.toLowerCase().includes(searchText.toLowerCase()) ||
      ticket.userName.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Support Tickets</h1>
      </div>

      <div className="mb-4">
        <Input
          placeholder="Search tickets..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300 }}
        />
      </div>

      <Table
        columns={columns}
        dataSource={filteredTickets}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Drawer
        title={`Ticket: ${selectedTicket?.ticketNumber || ''}`}
        placement="right"
        width={600}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
      >
        {selectedTicket && (
          <div>
            <div className="mb-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-lg font-bold">{selectedTicket.subject}</h3>
                  <p className="text-sm text-gray-500">
                    {selectedTicket.userType} - {selectedTicket.userName}
                  </p>
                  <p className="text-xs text-gray-500">{selectedTicket.userEmail}</p>
                </div>
                <div className="text-right">
                  <StatusTag status={selectedTicket.priority} />
                  <div className="mt-1">
                    <Select
                      value={selectedTicket.status}
                      onChange={(value) => handleUpdateStatus(selectedTicket.id, value)}
                      size="small"
                      style={{ width: 120 }}
                    >
                      {Object.entries(TICKET_STATUS).map(([key, value]) => (
                        <Select.Option key={value} value={value}>
                          {key.replace(/_/g, ' ')}
                        </Select.Option>
                      ))}
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <div className="bg-gray-50 p-4 rounded">
                <p className="text-sm">{selectedTicket.description}</p>
              </div>
            </div>

            <div className="mb-4">
              <h4 className="font-medium mb-2">Conversation</h4>
              <Timeline
                items={[
                  {
                    children: (
                      <div>
                        <div className="font-medium">{selectedTicket.userName}</div>
                        <div className="text-sm text-gray-600">{selectedTicket.description}</div>
                        <div className="text-xs text-gray-400 mt-1">{selectedTicket.createdAt}</div>
                      </div>
                    ),
                  },
                ]}
              />
            </div>

            <div>
              <h4 className="font-medium mb-2">Reply</h4>
              <TextArea
                rows={4}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your reply here..."
              />
              <Button
                type="primary"
                icon={<SendOutlined />}
                className="mt-2"
                onClick={handleReply}
              >
                Send Reply
              </Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default Tickets;

