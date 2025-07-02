import React, { useState } from "react";
import { Card, ListGroup, Button, Form, Nav, Image } from "react-bootstrap";
import { FaSearch, FaEllipsisH } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";

function SidebarRight() {
  const [showFullFooter, setShowFullFooter] = useState(false);
  const navigate = useNavigate();

  const trends = [
    {
      id: 1,
      name: "Doanh nghiệp & Tài chính - nổi bật",
      title: "Investing",
      tweets: "143 N bài đăng",
    },
    {
      id: 2,
      name: "Chủ đề nổi trội ở Việt Nam",
      title: "Quời",
      tweets: "436 N bài đăng",
    },
    {
      id: 3,
      name: "Chủ đề nổi trội ở Việt Nam",
      title: "#riyadh",
      tweets: "989 N bài đăng",
    },
    { id: 4, name: "Count", title: "Count", tweets: "82.2 N bài đăng" },
  ];

  const suggestedUsers = [
    {
      id: 1,
      name: "Ayii",
      username: "Ayiiyiii",
      avatar: "https://via.placeholder.com/40?text=Ayii",
    },
    {
      id: 2,
      name: "無一",
      username: "cero_09051",
      avatar: "https://via.placeholder.com/40?text=無一",
    },
    {
      id: 3,
      name: "Dilibay ✨💛",
      username: "Dilibay_heaven",
      avatar: "https://via.placeholder.com/40?text=Dilibay",
    },
  ];

  const fullFooterLinks = [
    { to: "/about", text: "Giới thiệu" },
    { to: "/help-center", text: "Trung tâm Trợ giúp" },
    { to: "/terms", text: "Điều khoản Dịch vụ" },
    { to: "/privacy", text: "Chính sách Riêng tư" },
    { to: "/cookies", text: "Chính sách cookie" },
    { to: "/accessibility", text: "Khả năng truy cập" },
    { to: "/ads-info", text: "Thông tin quảng cáo" },
    { to: "/blog", text: "Blog" },
    { to: "/ads", text: "Quảng cáo" },
    { to: "/business", text: "KaNox dành cho doanh nghiệp" },
    { to: "/developers", text: "Nhà phát triển" },
    { to: "/directory", text: "Danh mục" },
    { to: "/settings", text: "Cài đặt" },
  ];

  const defaultFooterLinks = fullFooterLinks.slice(0, 5);

  const handleSubscribePremiumClick = () => {
    navigate("/premium");
  };

  return (
      <div
          className="p-3 pt-2 d-none d-lg-block position-sticky top-0"
          style={{
            height: "100vh",
            overflowY: "auto",
            backgroundColor: "#fff",
            scrollbarWidth: "none", /* Ẩn thanh cuộn trên Firefox */
          }}
      >
        {/* Ẩn thanh cuộn trên Webkit (Chrome, Safari) */}
        <style>
          {`
          div::-webkit-scrollbar {
            display: none; /* Ẩn thanh cuộn */
          }
        `}
        </style>

        <Form className="mb-4 sticky-top bg-white" style={{ top: "0", zIndex: 1020 }}>
          <div className="position-relative w-100">
            <FaSearch
                className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"
                size={18}
            />
            <Form.Control
                type="search"
                placeholder="Tìm kiếm"
                className="rounded-pill ps-5 bg-white border border-dark shadow-sm"
                aria-label="Search"
                style={{ height: "48px", fontSize: "1rem", color: "#000" }}
            />
          </div>
        </Form>

        <Card className="mb-4 rounded-3 shadow-sm border border-dark">
          <Card.Body className="p-4">
            <h5 className="fw-bold mb-3" style={{ color: "#000" }}>
              Đăng ký gói Premium
            </h5>
            <p className="mb-3" style={{ color: "#000", fontSize: "0.95rem" }}>
              Đăng ký để mở khóa các tính năng mới và nhận chia sẻ doanh thu nếu bạn là người sáng tạo nội dung.
            </p>
            <Button
                variant="dark"
                className="rounded-pill px-4 py-2 fw-bold"
                onClick={handleSubscribePremiumClick}
            >
              Đăng ký
            </Button>
          </Card.Body>
        </Card>

        <Card className="mb-4 rounded-3 shadow-sm border border-dark">
          <Card.Header
              className="fw-bold bg-white border-0 p-4 pb-2"
              style={{ color: "#000" }}
          >
            Những điều đang diễn ra
          </Card.Header>
          <ListGroup variant="flush">
            {trends.map((trend) => (
                <ListGroup.Item
                    key={trend.id}
                    action
                    className="d-flex flex-column align-items-start py-3 px-4 border-0"
                    style={{ backgroundColor: "transparent" }}
                >
                  <div className="d-flex justify-content-between w-100">
                    <div>
                      <small style={{ color: "#666", fontSize: "0.85rem" }}>{trend.name}</small>
                      <h6 className="mb-1 fw-bold" style={{ color: "#000" }}>{trend.title}</h6>
                      <small style={{ color: "#666", fontSize: "0.85rem" }}>{trend.tweets}</small>
                    </div>
                    <Button variant="link" className="text-dark p-0">
                      <FaEllipsisH size={16} />
                    </Button>
                  </div>
                </ListGroup.Item>
            ))}
            <ListGroup.Item
                action
                className="py-2 px-4 fw-bold border-0"
                style={{ color: "#000" }}
            >
              Hiển thị thêm
            </ListGroup.Item>
          </ListGroup>
        </Card>

        <Card className="mb-4 rounded-3 shadow-sm border border-dark">
          <Card.Header
              className="fw-bold bg-white border-0 p-4 pb-2"
              style={{ color: "#000" }}
          >
            Gợi ý theo dõi
          </Card.Header>
          <ListGroup variant="flush">
            {suggestedUsers.map((user) => (
                <ListGroup.Item
                    key={user.id}
                    className="d-flex align-items-center py-3 px-4 border-0"
                    style={{ backgroundColor: "transparent" }}
                >
                  <Image
                      src={user.avatar}
                      alt={user.name}
                      width="40"
                      height="40"
                      roundedCircle
                      className="me-3 border border-dark"
                  />
                  <div className="d-flex flex-column flex-grow-1">
                <span className="fw-bold" style={{ fontSize: "0.95rem", color: "#000" }}>
                  {user.name}
                </span>
                    <span style={{ fontSize: "0.85rem", color: "#666" }}>@{user.username}</span>
                  </div>
                  <Button
                      variant="outline-dark"
                      size="sm"
                      className="col-auto rounded-pill px-3 py-1 fw-bold"
                  >
                    Theo dõi
                  </Button>
                </ListGroup.Item>
            ))}
            <ListGroup.Item
                action
                className="py-2 px-4 fw-bold border-0"
                style={{ color: "#000" }}
            >
              Hiển thị thêm
            </ListGroup.Item>
          </ListGroup>
        </Card>

        <div className="px-3">
          <Nav className="flex-wrap">
            {defaultFooterLinks.map((link, index) => (
                <Nav.Link
                    key={index}
                    as={Link}
                    to={link.to}
                    className="text-muted small me-3 my-1 p-0"
                    style={{ fontSize: "0.85rem", color: "#666" }}
                >
                  {link.text}
                </Nav.Link>
            ))}
            {showFullFooter &&
                fullFooterLinks.slice(defaultFooterLinks.length).map((link, index) => (
                    <Nav.Link
                        key={`full-${index}`}
                        as={Link}
                        to={link.to}
                        className="text-muted small me-3 my-1 p-0"
                        style={{ fontSize: "0.85rem", color: "#666" }}
                    >
                      {link.text}
                    </Nav.Link>
                ))}
            <Nav.Link
                onClick={() => setShowFullFooter(!showFullFooter)}
                className="text-muted small mep-0 my-1"
                style={{ fontSize: "0.85rem", color: "#666" }}
            >
              {showFullFooter ? "Ẩn bớt" : "Thêm..."}
            </Nav.Link>
            <span className="text-muted small my-1 p-0" style={{ color: "#666", fontSize: "0.85rem" }}>
            © 2025 KaNox Corp.
          </span>
          </Nav>
        </div>
      </div>
  );
}

export default SidebarRight;