// src/components/layout/Footer/Footer.jsx
import React from "react";
import { Nav } from "react-bootstrap";
import { Link } from "react-router-dom";

function Footer({ isWhiteBackground = false }) {
  const footerClass = isWhiteBackground
    ? "py-3 px-0 border-top mt-auto bg-[var(--background-color)] text-dark rounded-top"
    : "py-3 px-0 border-top mt-auto bg-[var(--background-color)] text-white rounded-top";

  return (
    <div className="py-3 px-0 border-top mt-auto footer-custom-size">
      <Nav className="flex-wrap justify-content-center">
        <Nav.Link
          as={Link}
          to="/about"
          className="mx-2 my-1 p-0 text-muted footer-link-text"
        >
          Giới thiệu
        </Nav.Link>
        {/* <Nav.Link as={Link} to="/download-app" className="mx-2 my-1 p-0 text-muted footer-link-text">Tải ứng dụng X</Nav.Link> */}
        {/* <Nav.Link as={Link} to="/grok" className="mx-2 my-1 p-0 text-muted footer-link-text">Grok</Nav.Link> */}
        <Nav.Link
          as={Link}
          to="/help-center"
          className="mx-2 my-1 p-0 text-muted footer-link-text"
        >
          Trung tâm Trợ giúp
        </Nav.Link>
        <Nav.Link
          as={Link}
          to="/terms"
          className="mx-2 my-1 p-0 text-muted footer-link-text"
        >
          Điều khoản Dịch vụ
        </Nav.Link>
        <Nav.Link
          as={Link}
          to="/privacy"
          className="mx-2 my-1 p-0 text-muted footer-link-text"
        >
          Chính sách Riêng tư
        </Nav.Link>
        <Nav.Link
          as={Link}
          to="/cookies"
          className="mx-2 my-1 p-0 text-muted footer-link-text"
        >
          Chính sách cookie
        </Nav.Link>
        <Nav.Link
          as={Link}
          to="/accessibility"
          className="mx-2 my-1 p-0 text-muted footer-link-text"
        >
          Khả năng truy cập
        </Nav.Link>
        <Nav.Link
          as={Link}
          to="/ads-info"
          className="mx-2 my-1 p-0 text-muted footer-link-text"
        >
          Thông tin quảng cáo
        </Nav.Link>
        <Nav.Link
          as={Link}
          to="/blog"
          className="mx-2 my-1 p-0 text-muted footer-link-text"
        >
          Blog
        </Nav.Link>
        {/* <Nav.Link as={Link} to="/careers" className="mx-2 my-1 p-0 text-muted footer-link-text">Nghề nghiệp</Nav.Link> */}
        {/* <Nav.Link as={Link} to="/brand-resources" className="mx-2 my-1 p-0 text-muted footer-link-text">Tài nguyên thương hiệu</Nav.Link> */}
        <Nav.Link
          as={Link}
          to="/ads"
          className="mx-2 my-1 p-0 text-muted footer-link-text"
        >
          Quảng cáo
        </Nav.Link>
        {/* <Nav.Link as={Link} to="/marketing" className="mx-2 my-1 p-0 text-muted footer-link-text">Tiếp thị</Nav.Link> */}
        <Nav.Link
          as={Link}
          to="/business"
          className="mx-2 my-1 p-0 text-muted footer-link-text"
        >
          KaNox dành cho doanh nghiệp
        </Nav.Link>
      </Nav>
      <Nav className="flex-wrap justify-content-center mt-2">
        <Nav.Link
          as={Link}
          to="/developers"
          className="mx-2 my-1 p-0 text-muted footer-link-text"
        >
          Nhà phát triển
        </Nav.Link>
        <Nav.Link
          as={Link}
          to="/directory"
          className="mx-2 my-1 p-0 text-muted footer-link-text"
        >
          Danh mục
        </Nav.Link>
        <Nav.Link
          as={Link}
          to="/settings"
          className="mx-2 my-1 p-0 text-muted footer-link-text"
        >
          Cài đặt
        </Nav.Link>
        <span className="mx-2 my-1 p-0 text-muted footer-link-text">
          &copy; 2025 KaNox.
        </span>
      </Nav>
    </div>
  );
}

export default Footer;
