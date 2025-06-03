import React, { useContext } from "react";
import { AuthContext } from "../../../context/AuthContext";
import { Nav, Button } from "react-bootstrap";
import {
  FaHome,
  FaSearch,
  FaBell,
  FaEnvelope,
  FaUserAlt,
  FaEllipsisH,
} from "react-icons/fa";
import { BsRocketTakeoff, BsStars } from "react-icons/bs";
import { Link, useNavigate } from "react-router-dom";
import { BsStars } from "react-icons/bs";
import { Link } from "react-router-dom";
import KLogoSvg from "../../svgs/KSvg";

function SidebarLeft() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  // Điều hướng nếu chưa đăng nhập
  const handleProtectedClick = (path) => {
    if (!user) {
      navigate("/");
    } else {
      navigate(path);
    }
  };

  return (
    <div
      className="d-flex flex-column flex-shrink-0 pt-2 pb-3 ps-3 pe-0 sticky-top"
      style={{ width: "280px", top: 0, overflowY: "auto", height: "100vh" }}
    >
      <div className="d-flex flex-column align-items-start">
        <Link to="/Home" className="d-none d-lg-block mb-3 ms-2 mt-2">
          {/* Logo lớn: Truyền width và height trực tiếp */}
          <KLogoSvg width="100px" height="100px" fill="black" />
        </Link>

        <Nav className="flex-column mb-auto">
          {/* Các Nav item bọc bằng handleProtectedClick */}
          <Nav.Item className="mb-1">
            <Nav.Link
              as={Link}
              to="/Home"
              onClick={() => handleProtectedClick("/HomePage")}
              className="d-flex align-items-center text-dark py-2 px-3 rounded-pill hover-bg-light fw-bold"
            >
              <FaHome size={24} className="me-3" />
              <span className="fs-5 d-none d-lg-block">Trang chủ</span>
            </Nav.Link>
          </Nav.Item>
          <Nav.Item className="mb-1">
            <Nav.Link
              onClick={() => handleProtectedClick("/explore")}
              className="d-flex align-items-center text-dark py-2 px-3 rounded-pill hover-bg-light"
            >
              <FaSearch size={24} className="me-3" />
              <span className="fs-5 d-none d-lg-block">Khám phá</span>
            </Nav.Link>
          </Nav.Item>
          <Nav.Item className="mb-1">
            <Nav.Link
              onClick={() => handleProtectedClick("/notifications")}
              className="d-flex align-items-center text-dark py-2 px-3 rounded-pill hover-bg-light"
            >
              <FaBell size={24} className="me-3" />
              <span className="fs-5 d-none d-lg-block">Thông báo</span>
            </Nav.Link>
          </Nav.Item>
          <Nav.Item className="mb-1">
            <Nav.Link
              onClick={() => handleProtectedClick("/messages")}
              className="d-flex align-items-center text-dark py-2 px-3 rounded-pill hover-bg-light"
            >
              <FaEnvelope size={24} className="me-3" />
              <span className="fs-5 d-none d-lg-block">Tin nhắn</span>
            </Nav.Link>
          </Nav.Item>
          <Nav.Item className="mb-1">
            <Nav.Link
              onClick={() => handleProtectedClick("/grok")}
              className="d-flex align-items-center text-dark py-2 px-3 rounded-pill hover-bg-light"
            >
              <BsRocketTakeoff size={24} className="me-3" />
            </Nav.Link>
          </Nav.Item>

          <Nav.Item className="mb-1">
            <Nav.Link
              onClick={() => handleProtectedClick("/communities")}
              className="d-flex align-items-center text-dark py-2 px-3 rounded-pill hover-bg-light"
            >
              <FaUserAlt size={24} className="me-3" />
              <span className="fs-5 d-none d-lg-block">Cộng đồng</span>
            </Nav.Link>
          </Nav.Item>
          <Nav.Item className="mb-1">
            <Nav.Link
              onClick={() => handleProtectedClick("/premium")}
              className="d-flex align-items-center text-dark py-2 px-3 rounded-pill hover-bg-light"
            >
              <BsStars size={24} className="me-3" />
              <span className="fs-5 d-none d-lg-block">Premium</span>
            </Nav.Link>
          </Nav.Item>
          <Nav.Item className="mb-1">
            <Nav.Link
              onClick={() =>
                handleProtectedClick(`/profile/${user?.username || ""}`)
              }
              className="d-flex align-items-center text-dark py-2 px-3 rounded-pill hover-bg-light"
            >
              <FaUserAlt size={24} className="me-3" />
              <span className="fs-5 d-none d-lg-block">Hồ sơ</span>
            </Nav.Link>
          </Nav.Item>
          <Nav.Item className="mb-1">
            <Nav.Link
              onClick={() => handleProtectedClick("/more")}
              className="d-flex align-items-center text-dark py-2 px-3 rounded-pill hover-bg-light"
            >
              <FaEllipsisH size={24} className="me-3" />
              <span className="fs-5 d-none d-lg-block">Thêm</span>
            </Nav.Link>
          </Nav.Item>

          {/* Nút đăng bài */}
          <Button
            variant="primary"
            className="rounded-pill mt-3 py-3 fw-bold w-100 d-none d-lg-block"
            onClick={() => handleProtectedClick("/create-post")}
          >
            Đăng
          </Button>
          <Button
            variant="primary"
            className="rounded-circle mt-3 p-3 fw-bold d-lg-none mx-auto"
            onClick={() => handleProtectedClick("/create-post")}
            style={{
              width: "56px",
              height: "56px",
              backgroundColor: "#1A8CD8",
              borderColor: "#1A8CD8",
            }}
          >
            {/* Logo nhỏ trên nút: Truyền width và height trực tiếp */}
            <KLogoSvg width="24px" height="24px" fill="white" />
          </Button>

          {/* Nút đăng nhập nếu chưa đăng nhập */}
          {!user && (
            <Button
              variant="outline-primary"
              className="mt-4 w-100 fw-bold"
              onClick={() => navigate("/")}
            >
              Đăng nhập
            </Button>
          )}
        </Nav>
      </div>
    </div>
  );
}

export default SidebarLeft;