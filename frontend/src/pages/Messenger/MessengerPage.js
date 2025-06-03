import React from "react";
import {
  Container,
  Row,
  Col,
  InputGroup,
  Form,
  Button,
  Image,
} from "react-bootstrap";
import { FaSearch, FaEnvelope, FaPenSquare, FaCog } from "react-icons/fa"; // Importing icons
import SidebarLeft from "../../components/layout/SidebarLeft/SidebarLeft"; // Adjust the path as needed

function MessengerPage() {
  // Dummy data for message list (left pane)
  const messages = [
    {
      id: 1,
      name: "Bessie Cooper",
      username: "@bessiecooper", // Assuming a username
      lastMessage: "Hi, Robert. I'm facing some chall...",
      avatar: "https://via.placeholder.com/40", // Placeholder avatar
    },
    {
      id: 2,
      name: "Thomas Baker",
      username: "@thomasbaker",
      lastMessage: "I have a job interview coming up ...",
      avatar: "https://via.placeholder.com/40",
    },
    {
      id: 3,
      name: "Daniel Brown",
      username: "@danielbrown",
      lastMessage: "Not much, just planning to relax ...",
      avatar: "https://via.placeholder.com/40",
    },
    {
      id: 4,
      name: "Ronald Richards",
      username: "@ronaldrichards",
      lastMessage: "I'm stuck on this bug in the code ...",
      avatar: "https://via.placeholder.com/40",
    },
  ];

  return (
    <div className="d-flex min-vh-100 bg-light">
      {/* Sidebar trái */}
      <div className="d-none d-lg-block">
        <SidebarLeft />
      </div>

      {/* Main Content Area - Messages */}
      <div className="d-flex flex-column flex-grow-1 border-start border-end bg-white">
        {/* Header/Search Bar for Messages Page */}
        <div
          className="sticky-top bg-white border-bottom py-2"
          style={{ zIndex: 1020 }}
        >
          <Container fluid>
            <Row className="align-items-center">
              <Col xs={6} className="text-start">
                <h5 className="fw-bold mb-0">Tin nhắn</h5>
              </Col>
              <Col xs={6} className="text-end">
                <Button variant="link" className="text-dark p-0">
                  <FaCog /> {/* Settings icon, as seen in Notification page */}
                </Button>
              </Col>
            </Row>
            <InputGroup className="mt-3">
              <InputGroup.Text className="bg-light border-0 rounded-pill ps-3">
                <FaSearch className="text-muted" />
              </InputGroup.Text>
              <Form.Control
                type="text"
                placeholder="Tìm kiếm"
                className="bg-light border-0 rounded-pill py-2"
                style={{ height: "auto" }}
              />
            </InputGroup>
          </Container>
        </div>

        {/* Message List and Chat Area */}
        <div className="d-flex flex-grow-1">
          {/* Left Pane: Message List */}
          <div
            className="border-end overflow-auto"
            style={{ flexBasis: "350px", flexShrink: 0 }}
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className="d-flex align-items-center p-3 border-bottom hover-bg-light"
              >
                <Image
                  src={msg.avatar}
                  roundedCircle
                  className="me-2"
                  style={{ width: "40px", height: "40px" }}
                />
                <div className="flex-grow-1">
                  <p className="fw-bold mb-0">{msg.name}</p>
                  <p className="text-muted small mb-0">{msg.lastMessage}</p>
                </div>
              </div>
            ))}
            <div className="p-3 border-top text-center">
              <Button variant="link" className="text-primary fw-bold">
                <FaPenSquare className="me-2" />
                Tin nhắn mới
              </Button>
            </div>
          </div>

          {/* Right Pane: Chat/Empty State */}
          <div className="flex-grow-1 d-flex flex-column justify-content-center align-items-center p-3">
            <FaEnvelope
              className="text-muted mb-3"
              style={{ fontSize: "5rem" }}
            />
            <h4 className="fw-bold mb-2">Tin nhắn của bạn</h4>
            <p className="text-muted text-center mb-4">
              Chọn một người để hiển thị cuộc trò chuyện của họ hoặc bắt đầu một
              cuộc trò chuyện mới.
            </p>
            <Button variant="primary" className="rounded-pill px-4 py-2">
              Tin nhắn mới
            </Button>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Empty or other elements (Optional) */}
      {/* The image doesn't show a right sidebar for messages, so this will be empty or removed */}
      <div className="d-none d-lg-block" style={{ width: "350px" }}>
        {/* You can add content here if needed, or remove this div if the layout is strictly two-column for messages */}
      </div>
    </div>
  );
}

export default MessengerPage;
