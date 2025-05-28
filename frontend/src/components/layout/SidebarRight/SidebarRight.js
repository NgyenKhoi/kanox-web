// src/components/layout/SidebarRight/SidebarRight.jsx
import React from "react";
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
import { Link } from "react-router-dom";

function SidebarRight() {
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

  return (
    // Sử dụng sticky-top với top: 0 để nó dính vào đầu trang
    // Thay đổi overflow-y: auto và height: 100vh để nội dung cuộn bên trong
    // Điều chỉnh pt-2 (padding-top) để nó không bị dính sát vào header nếu có
    <div
      className="p-3 pt-2 sticky-top d-none d-lg-block"
      style={{ top: "0", width: "350px", height: "100vh", overflowY: "auto" }}
    >
      {/* Thanh tìm kiếm */}
      <Form className="d-flex mb-3 mt-2">
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

      {/* Đăng ký gói Premium */}
      <Card className="mb-3 rounded-4 bg-light-blue border-0">
        <Card.Body>
          <h5 className="fw-bold">Đăng ký gói Premium</h5>
          <p className="mb-2">
            Đăng ký để mở khóa các tính năng mới và nếu đủ điều kiện, bạn sẽ
            được nhận một khoản chia sẻ doanh thu cho người sáng tạo nội dung.
          </p>
          <Button variant="dark" className="rounded-pill px-4 fw-bold">
            Đăng ký
          </Button>
        </Card.Body>
      </Card>

      {/* Những điều đang diễn ra (Trends) */}
      <Card className="mb-3 rounded-4 shadow-sm border-0">
        <Card.Header className="fw-bold bg-white border-bottom-0 p-3">
          Những điều đang diễn ra
        </Card.Header>
        <ListGroup variant="flush">
          {trends.map((trend) => (
            <ListGroup.Item
              key={trend.id}
              action
              className="d-flex flex-column align-items-start py-2 px-3 border-0 hover-bg-light"
            >
              <small className="text-muted">{trend.name}</small>
              <h6 className="mb-0 fw-bold">{trend.title}</h6>
              <small className="text-muted">{trend.tweets}</small>
            </ListGroup.Item>
          ))}
          <ListGroup.Item
            action
            className="text-primary py-2 px-3 fw-bold border-0 hover-bg-light"
          >
            Hiển thị thêm
          </ListGroup.Item>
        </ListGroup>
      </Card>

      {/* Gợi ý theo dõi (Who to follow) */}
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
            className="text-primary py-2 px-3 fw-bold border-0 hover-bg-light"
          >
            Hiển thị thêm
          </ListGroup.Item>
        </ListGroup>
      </Card>

      {/* Footer chính thức của SidebarRight */}
      <div className="p-3">
        <Nav className="flex-wrap">
          <Nav.Link
            as={Link}
            to="/terms"
            className="text-muted small me-2 my-1 p-0"
          >
            Điều khoản Dịch vụ
          </Nav.Link>
          <Nav.Link
            as={Link}
            to="/privacy"
            className="text-muted small me-2 my-1 p-0"
          >
            Chính sách Riêng tư
          </Nav.Link>
          <Nav.Link
            as={Link}
            to="/cookies"
            className="text-muted small me-2 my-1 p-0"
          >
            Chính sách cookie
          </Nav.Link>
          <Nav.Link
            as={Link}
            to="/accessibility"
            className="text-muted small me-2 my-1 p-0"
          >
            Khả năng truy cập
          </Nav.Link>
          <Nav.Link
            as={Link}
            to="/ads-info"
            className="text-muted small me-2 my-1 p-0"
          >
            Thông tin quảng cáo
          </Nav.Link>
          <Nav.Link
            as={Link}
            to="/more-info"
            className="text-muted small me-2 my-1 p-0"
          >
            Thêm ...
          </Nav.Link>
          <span className="text-muted small mx-2 my-1 p-0">
            &copy; 2025 X Corp.
          </span>
        </Nav>
      </div>
    </div>
  );
}

export default SidebarRight;
