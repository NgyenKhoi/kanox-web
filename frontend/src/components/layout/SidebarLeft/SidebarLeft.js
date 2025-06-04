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
  FaSignOutAlt,
  FaLock,
  FaTrash,
  FaRegPlusSquare,
} from "react-icons/fa";
import { BsRocketTakeoff, BsStars } from "react-icons/bs";
import { Link, useNavigate } from "react-router-dom";
import KLogoSvg from "../../svgs/KSvg";

function SidebarLeft() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleProtectedClick = (path) => {
    if (!user) {
      navigate("/");
    } else {
      navigate(path);
    }
  };

  return (
      <div
          className="d-flex flex-column flex-shrink-0 pt-2 pb-3 ps-3 pe-0 sticky-top bg-light border-end d-none d-md-block"
          style={{ width: "280px", height: "100vh" }}
      >
        <div className="d-flex flex-column align-items-start">
          <Link to="/Home" className="d-none d-md-block mb-3 ms-2 mt-2">
            <KLogoSvg width="100px" height="100px" fill="black" />
          </Link>

          <Nav className="flex-column mb-auto">
            <Nav.Item className="mb-1">
              <Nav.Link
                  as={Link}
                  to="/Home"
                  onClick={() => handleProtectedClick("/HomePage")}
                  className="d-flex align-items-center text-dark py-2 px-3 rounded-pill fw-bold"
              >
                <FaHome size={24} className="me-3" />
                <span className="fs-5 d-none d-md-block">Trang chủ</span>
              </Nav.Link>
            </Nav.Item>
            <Nav.Item className="mb-1">
              <Nav.Link
                  onClick={() => handleProtectedClick("/explore")}
                  className="d-flex align-items-center text-dark py-2 px-3 rounded-pill"
              >
                <FaSearch size={24} className="me-3" />
                <span className="fs-5 d-none d-md-block">Khám phá</span>
              </Nav.Link>
            </Nav.Item>
            <Nav.Item className="mb-1">
              <Nav.Link
                  onClick={() => handleProtectedClick("/notifications")}
                  className="d-flex align-items-center text-dark py-2 px-3 rounded-pill"
              >
                <FaBell size={24} className="me-3" />
                <span className="fs-5 d-none d-md-block">Thông báo</span>
              </Nav.Link>
            </Nav.Item>
            <Nav.Item className="mb-1">
              <Nav.Link
                  onClick={() => handleProtectedClick("/messages")}
                  className="d-flex align-items-center text-dark py-2 px-3 rounded-pill"
              >
                <FaEnvelope size={24} className="me-3" />
                <span className="fs-5 d-none d-md-block">Tin nhắn</span>
              </Nav.Link>
            </Nav.Item>
            <Nav.Item className="mb-1">
              <Nav.Link
                  onClick={() => handleProtectedClick("/grok")}
                  className="d-flex align-items-center text-dark py-2 px-3 rounded-pill"
              >
                <BsRocketTakeoff size={24} className="me-3" />
              </Nav.Link>
            </Nav.Item>
            <Nav.Item className="mb-1">
              <Nav.Link
                  onClick={() => handleProtectedClick("/communities")}
                  className="d-flex align-items-center text-dark py-2 px-3 rounded-pill"
              >
                <FaUserAlt size={24} className="me-3" />
                <span className="fs-5 d-none d-md-block">Cộng đồng</span>
              </Nav.Link>
            </Nav.Item>
            <Nav.Item className="mb-1">
              <Nav.Link
                  onClick={() => handleProtectedClick("/premium")}
                  className="d-flex align-items-center text-dark py-2 px-3 rounded-pill"
              >
                <BsStars size={24} className="me-3" />
                <span className="fs-5 d-none d-md-block">Premium</span>
              </Nav.Link>
            </Nav.Item>
            <Nav.Item className="mb-1">
              <Nav.Link
                  onClick={() =>
                      handleProtectedClick(`/profile/${user?.username || ""}`)
                  }
                  className="d-flex align-items-center text-dark py-2 px-3 rounded-pill"
              >
                <FaUserAlt size={24} className="me-3" />
                <span className="fs-5 d-none d-md-block">Hồ sơ</span>
              </Nav.Link>
            </Nav.Item>
            <Nav.Item className="mb-1">
              <Nav.Link
                  onClick={() => handleProtectedClick("/create-story")}
                  className="d-flex align-items-center text-dark py-2 px-3 rounded-pill"
              >
                <FaRegPlusSquare size={24} className="me-3" />
                <span className="fs-5 d-none d-md-block">Tạo Story</span>
              </Nav.Link>
            </Nav.Item>
            <Nav.Item className="mb-1">
              <Nav.Link
                  onClick={() => handleProtectedClick("/settings")}
                  className="d-flex align-items-center text-dark py-2 px-3 rounded-pill"
              >
                <FaLock size={24} className="me-3" />
                <span className="fs-5 d-none d-md-block">Cài đặt Bảo mật</span>
              </Nav.Link>
            </Nav.Item>
            <Nav.Item className="mb-1">
              <Nav.Link
                  onClick={() => handleProtectedClick("/delete-account")}
                  className="d-flex align-items-center text-dark py-2 px-3 rounded-pill"
              >
                <FaTrash size={24} className="me-3" />
                <span className="fs-5 d-none d-md-block">Xóa Tài khoản</span>
              </Nav.Link>
            </Nav.Item>
            <Nav.Item className="mb-1">
              <Nav.Link
                  onClick={() => handleProtectedClick("/more")}
                  className="d-flex align-items-center text-dark py-2 px-3 rounded-pill"
              >
                <FaEllipsisH size={24} className="me-3" />
                <span className="fs-5 d-none d-md-block">Thêm</span>
              </Nav.Link>
            </Nav.Item>
            {user && (
                <Nav.Item className="mb-1">
                  <Nav.Link
                      onClick={() => handleProtectedClick("/logout")}
                      className="d-flex align-items-center text-dark py-2 px-3 rounded-pill"
                  >
                    <FaSignOutAlt size={24} className="me-3" />
                    <span className="fs-5 d-none d-md-block">Đăng xuất</span>
                  </Nav.Link>
                </Nav.Item>
            )}

            <Button
                variant="primary"
                className="rounded-pill mt-3 py-3 fw-bold w-100 d-none d-md-block"
                onClick={() => handleProtectedClick("/create-post")}
            >
              Đăng
            </Button>
            <Button
                variant="primary"
                className="rounded-circle mt-3 p-3 fw-bold d-md-none mx-auto"
                onClick={() => handleProtectedClick("/create-post")}
                style={{ width: "56px", height: "56px" }}
            >
              <KLogoSvg width="24px" height="24px" fill="white" />
            </Button>

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