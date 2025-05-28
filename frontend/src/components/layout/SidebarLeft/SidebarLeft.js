// src/components/layout/SidebarLeft/SidebarLeft.jsx
import React from "react";
import { Nav, Button, Image } from "react-bootstrap";
import {
  FaTwitter,
  FaHome,
  FaSearch,
  FaBell,
  FaEnvelope,
  FaUserAlt,
  FaEllipsisH,
} from "react-icons/fa";
import { BsRocketTakeoff, BsStars } from "react-icons/bs";
import { Link } from "react-router-dom";

function SidebarLeft() {
  const username = localStorage.getItem("username");
  return (
    <div
      className="d-flex flex-column flex-shrink-0 pt-2 pb-3 ps-3 pe-0 sticky-top"
      style={{ width: "280px", top: 0, overflowY: "auto", height: "100vh" }}
    >
      <div className="d-flex flex-column align-items-start">
        <Link to="/" className="d-none d-lg-block mb-3 ms-2 mt-2">
          <FaTwitter size={30} className="text-dark" />
        </Link>

        <Nav className="flex-column mb-auto">
          <Nav.Item className="mb-1">
            <Nav.Link
              as={Link}
              to="/"
              className="d-flex align-items-center text-dark py-2 px-3 rounded-pill hover-bg-light fw-bold"
            >
              <FaHome size={24} className="me-3" />
              <span className="fs-5 d-none d-lg-block">Trang chủ</span>
            </Nav.Link>
          </Nav.Item>
          <Nav.Item className="mb-1">
            <Nav.Link
              as={Link}
              to="/explore"
              className="d-flex align-items-center text-dark py-2 px-3 rounded-pill hover-bg-light"
            >
              <FaSearch size={24} className="me-3" />
              <span className="fs-5 d-none d-lg-block">Khám phá</span>
            </Nav.Link>
          </Nav.Item>
          <Nav.Item className="mb-1">
            <Nav.Link
              as={Link}
              to="/notifications"
              className="d-flex align-items-center text-dark py-2 px-3 rounded-pill hover-bg-light"
            >
              <FaBell size={24} className="me-3" />
              <span className="fs-5 d-none d-lg-block">Thông báo</span>
            </Nav.Link>
          </Nav.Item>
          <Nav.Item className="mb-1">
            <Nav.Link
              as={Link}
              to="/messages"
              className="d-flex align-items-center text-dark py-2 px-3 rounded-pill hover-bg-light"
            >
              <FaEnvelope size={24} className="me-3" />
              <span className="fs-5 d-none d-lg-block">Tin nhắn</span>
            </Nav.Link>
          </Nav.Item>
          <Nav.Item className="mb-1">
            <Nav.Link
              as={Link}
              to="/grok"
              className="d-flex align-items-center text-dark py-2 px-3 rounded-pill hover-bg-light"
            >
              <BsRocketTakeoff size={24} className="me-3" />
            </Nav.Link>
          </Nav.Item>
          <Nav.Item className="mb-1">
            <Nav.Link
              as={Link}
              to="/communities"
              className="d-flex align-items-center text-dark py-2 px-3 rounded-pill hover-bg-light"
            >
              <FaUserAlt size={24} className="me-3" />
              <span className="fs-5 d-none d-lg-block">Cộng đồng</span>
            </Nav.Link>
          </Nav.Item>
          <Nav.Item className="mb-1">
            <Nav.Link
              as={Link}
              to="/premium"
              className="d-flex align-items-center text-dark py-2 px-3 rounded-pill hover-bg-light"
            >
              <BsStars size={24} className="me-3" />
              <span className="fs-5 d-none d-lg-block">Premium</span>
            </Nav.Link>
          </Nav.Item>
          <Nav.Item className="mb-1">
            <Nav.Link
              as={Link}
              to={`/profile/${username}`}
              className="d-flex align-items-center text-dark py-2 px-3 rounded-pill hover-bg-light"
            >
              <FaUserAlt size={24} className="me-3" />
              <span className="fs-5 d-none d-lg-block">Hồ sơ</span>
            </Nav.Link>
          </Nav.Item>
          <Nav.Item className="mb-1">
            <Nav.Link
              as={Link}
              to="/more"
              className="d-flex align-items-center text-dark py-2 px-3 rounded-pill hover-bg-light"
            >
              <FaEllipsisH size={24} className="me-3" />
              <span className="fs-5 d-none d-lg-block">Thêm</span>
            </Nav.Link>
          </Nav.Item>

          <Button
            variant="primary"
            className="rounded-pill mt-3 py-3 fw-bold w-100 d-none d-lg-block"
          >
            Đăng
          </Button>
          <Button
            variant="primary"
            className="rounded-circle mt-3 p-3 fw-bold d-lg-none mx-auto"
            style={{ width: "56px", height: "56px" }}
          >
            <FaTwitter size={24} />
          </Button>
        </Nav>
      </div>
    </div>
  );
}

export default SidebarLeft;
