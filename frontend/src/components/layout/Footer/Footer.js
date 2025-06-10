import React from "react";
import { Nav } from "react-bootstrap";
import { Link } from "react-router-dom";

function Footer({ isWhiteBackground = false }) {
  const footerClass = isWhiteBackground 
    ? "py-3 px-0 border-top mt-auto bg-white text-dark rounded-top"
    : "py-3 px-0 border-top mt-auto bg-gradient bg-primary text-white rounded-top";

  return (
      <div className={footerClass}>
        <Nav className="flex-wrap justify-content-center">
          <Nav.Link
              as={Link}
              to="/about"
              className="mx-2 my-1 p-0 text-dark fw-medium"
          >
            Giới thiệu
          </Nav.Link>
          <Nav.Link
              as={Link}
              to="/help-center"
              className="mx-2 my-1 p-0 text-dark fw-medium"
          >
            Trung tâm Trợ giúp
          </Nav.Link>
          <Nav.Link
              as={Link}
              to="/terms"
              className="mx-2 my-1 p-0 text-dark fw-medium"
          >
            Điều khoản Dịch vụ
          </Nav.Link>
          <Nav.Link
              as={Link}
              to="/privacy"
              className="mx-2 my-1 p-0 text-dark fw-medium"
          >
            Chính sách Riêng tư
          </Nav.Link>
          <Nav.Link
              as={Link}
              to="/cookies"
              className="mx-2 my-1 p-0 text-dark fw-medium"
          >
            Chính sách cookie
          </Nav.Link>
          <Nav.Link
              as={Link}
              to="/accessibility"
              className="mx-2 my-1 p-0 text-dark fw-medium"
          >
            Khả năng truy cập
          </Nav.Link>
          <Nav.Link
              as={Link}
              to="/ads-info"
              className="mx-2 my-1 p-0 text-dark fw-medium"
          >
            Thông tin quảng cáo
          </Nav.Link>
          <Nav.Link
              as={Link}
              to="/blog"
              className="mx-2 my-1 p-0 text-dark fw-medium"
          >
            Blog
          </Nav.Link>
          <Nav.Link
              as={Link}
              to="/ads"
              className="mx-2 my-1 p-0 text-dark fw-medium"
          >
            Quảng cáo
          </Nav.Link>
          <Nav.Link
              as={Link}
              to="/business"
              className="mx-2 my-1 p-0 text-dark fw-medium"
          >
            KaNox dành cho doanh nghiệp
          </Nav.Link>
        </Nav>
        <Nav className="flex-wrap justify-content-center mt-2">
          <Nav.Link
              as={Link}
              to="/developers"
              className="mx-2 my-1 p-0 text-dark fw-medium"
          >
            Nhà phát triển
          </Nav.Link>
          <Nav.Link
              as={Link}
              to="/directory"
              className="mx-2 my-1 p-0 text-dark fw-medium"
          >
            Danh mục
          </Nav.Link>
          <Nav.Link
              as={Link}
              to="/settings"
              className="mx-2 my-1 p-0 text-dark fw-medium"
          >
            Cài đặt
          </Nav.Link>
          <span className="mx-2 my-1 p-0 text-dark fw-medium">
          © 2025 KaNox.
        </span>
        </Nav>
      </div>
  );
}

export default Footer;