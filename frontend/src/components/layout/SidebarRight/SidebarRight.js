import React, { useState } from "react";
import {
  Card,
  ListGroup,
  Button,
  Form,
  FormControl,
  Nav,
  Image,
} from "react-bootstrap";
import { FaSearch } from "react-icons/fa";
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
      avatar: "https://via.placeholder.com/40",
    },
    {
      id: 2,
      name: "無一",
      username: "cero_09051",
      avatar: "https://via.placeholder.com/40",
    },
    {
      id: 3,
      name: "Dilibay ✨💛",
      username: "Dilibay_heaven",
      avatar: "https://via.placeholder.com/40",
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
      <div className="p-3 pt-2 d-none d-md-block">
        <Form className="d-flex mb-3 mt-2 sticky-top">
          <div className="position-relative w-100">
            <FaSearch
                className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"
                size={18}
            />
            <FormControl
                type="search"
                placeholder="Tìm kiếm"
                className="rounded-pill ps-5 bg-light border-0"
                aria-label="Search"
                style={{ minHeight: "40px" }}
            />
          </div>
        </Form>

        <Card className="mb-3 rounded-4 bg-light border-0">
          <Card.Body>
            <h5 className="fw-bold text-primary">Đăng ký gói Premium</h5>
            <p className="mb-2 text-dark">
              Đăng ký để mở khóa các tính năng mới và nếu đủ điều kiện, bạn sẽ
              được nhận một khoản chia sẻ doanh thu cho người sáng tạo nội dung.
            </p>
            <Button
                variant="dark"
                className="rounded-pill px-4 fw-bold"
                onClick={handleSubscribePremiumClick}
            >
              Đăng ký
            </Button>
          </Card.Body>
        </Card>

        <Card className="mb-3 rounded-4 shadow-sm border-0">
          <Card.Header className="fw-bold bg-white border-bottom-0 p-3">
            Những điều đang diễn ra
          </Card.Header>
          <ListGroup variant="flush">
            {trends.map((trend) => (
                <ListGroup.Item
                    key={trend.id}
                    action
                    className="d-flex flex-column align-items-start py-2 px-3 border-0"
                >
                  <small className="text-muted">{trend.name}</small>
                  <h6 className="mb-0 fw-bold">{trend.title}</h6>
                  <small className="text-muted">{trend.tweets}</small>
                </ListGroup.Item>
            ))}
            <ListGroup.Item
                action
                className="text-primary py-2 px-3 fw-bold border-0"
            >
              Hiển thị thêm
            </ListGroup.Item>
          </ListGroup>
        </Card>

        <Card className="mb-3 rounded-4 shadow-sm border-0">
          <Card.Header className="fw-bold bg-white border-bottom-0 p-3">
            Gợi ý theo dõi
          </Card.Header>
          <ListGroup variant="flush">
            {suggestedUsers.map((user) => (
                <ListGroup.Item
                    key={user.id}
                    className="d-flex align-items-center py-2 px-3 border-0"
                >
                  <Image
                      src={user.avatar}
                      alt={user.name}
                      width="48"
                      height="48"
                      roundedCircle
                      className="me-3"
                  />
                  <div className="d-flex flex-column flex-grow-1">
                    <span className="fw-bold">{user.name}</span>
                    <span className="text-muted small">@{user.username}</span>
                  </div>
                  <Button
                      variant="dark"
                      size="sm"
                      className="rounded-pill px-3 fw-bold"
                  >
                    Theo dõi
                  </Button>
                </ListGroup.Item>
            ))}
            <ListGroup.Item
                action
                className="text-primary py-2 px-3 fw-bold border-0"
            >
              Hiển thị thêm
            </ListGroup.Item>
          </ListGroup>
        </Card>

        <div className="p-3">
          <Nav className="flex-wrap">
            {defaultFooterLinks.map((link, index) => (
                <Nav.Link
                    key={index}
                    as={Link}
                    to={link.to}
                    className="text-muted small me-2 my-1 p-0"
                >
                  {link.text}
                </Nav.Link>
            ))}

            {showFullFooter &&
                fullFooterLinks
                    .slice(defaultFooterLinks.length)
                    .map((link, index) => (
                        <Nav.Link
                            key={`full-${index}`}
                            as={Link}
                            to={link.to}
                            className="text-muted small me-2 my-1 p-0"
                        >
                          {link.text}
                        </Nav.Link>
                    ))}

            <Nav.Link
                onClick={() => setShowFullFooter(!showFullFooter)}
                className="text-muted small me-2 my-1 p-0"
            >
              {showFullFooter ? "Ẩn bớt" : "Thêm..."}
            </Nav.Link>

            <span className="text-muted small mx-2 my-1 p-0">
            © 2025 KaNox Corp.
          </span>
          </Nav>
        </div>
      </div>
  );
}

export default SidebarRight;