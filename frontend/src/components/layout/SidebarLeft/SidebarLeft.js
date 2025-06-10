import React, { useState, useContext, useEffect } from "react"; // Thêm useState
import { Nav, Button, Dropdown, Offcanvas } from "react-bootstrap";
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
  FaBars,
  FaPlusCircle,
  FaMoon,
  FaSun,
  FaUserPlus, // Icon cho "Tìm kiếm bạn bè" nếu muốn
} from "react-icons/fa";
import { BsStars } from "react-icons/bs";
import { Link, useNavigate, useLocation } from "react-router-dom";
import KLogoSvg from "../../svgs/KSvg";
import { AuthContext } from "../../../context/AuthContext";
import CreatePostModal from "../../components/post/CreatePostModal"; // Import CreatePostModal
import "./SidebarLeft.css";

function SidebarLeft({ onToggleDarkMode, isDarkMode, onNewPost }) {
  // Thêm onNewPost
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [showOffcanvas, setShowOffcanvas] = useState(false);
  const [showCreatePostModal, setShowCreatePostModal] = useState(false); // State cho modal đăng bài

  const handleCloseOffcanvas = () => setShowOffcanvas(false);
  const handleShowOffcanvas = () => setShowOffcanvas(true);

  const handleShowCreatePostModal = () => {
    // Hàm mở modal
    setShowCreatePostModal(true);
    handleCloseOffcanvas(); // Đóng offcanvas nếu đang mở
  };
  const handleCloseCreatePostModal = () => setShowCreatePostModal(false); // Hàm đóng modal

  // Define sidebar tabs
  const mainTabs = [
    { icon: <FaHome size={24} />, label: "Trang chủ", path: "/home" },
    {
      icon: <FaSearch size={24} />,
      label: "Tìm kiếm người dùng",
      path: "/search-users",
    },
    { icon: <FaSearch size={24} />, label: "Khám phá", path: "/explore" },
    { icon: <FaBell size={24} />, label: "Thông báo", path: "/notifications" },
    { icon: <FaEnvelope size={24} />, label: "Tin nhắn", path: "/messages" },
    { icon: <FaUserAlt size={24} />, label: "Cộng đồng", path: "/communities" },
    { icon: <BsStars size={24} />, label: "Premium", path: "/premium" },
    {
      icon: <FaUserAlt size={24} />,
      label: "Hồ sơ",
      path: `/profile/${user?.id || "default"}`,
      protected: true,
    },
  ];

  const additionalTabs = [
    {
      icon: <FaRegPlusSquare size={24} />,
      label: "Tạo Story",
      path: "/create-story",
      protected: true,
    },
    {}, // Dùng để tạo Divider
    { icon: <FaLock size={24} />, label: "Cài đặt Bảo mật", path: "/settings" },
    {
      icon: <FaTrash size={24} />,
      label: "Xóa Tài khoản",
      path: "/delete-account",
      protected: true,
    },
    {
      icon: <FaSignOutAlt size={24} />,
      label: "Đăng xuất",
      path: "/logout",
      protected: true,
      action: "logout",
    },
  ];

  const handleNavLinkClick = (tab) => {
    handleCloseOffcanvas();

    if (tab.action === "logout") {
      logout();
      navigate("/login");
      return;
    }

    if (tab.protected && !user) {
      navigate("/login");
    } else {
      navigate(tab.path);
    }
  };

  const isLinkActive = (path) => {
    if (
      path.startsWith("/profile/") &&
      location.pathname.startsWith("/profile/")
    ) {
      return true;
    }
    if (
      path === "/home" &&
      (location.pathname === "/" || location.pathname === "/home")
    ) {
      return true;
    }
    return location.pathname === path;
  };

  const renderSidebarContent = () => (
    <>
      <Nav className="flex-column mb-auto">
        {mainTabs.map((tab, index) =>
          tab.label ? (
            <Nav.Item key={tab.label || index} className="mb-1">
              <Nav.Link
                onClick={() => handleNavLinkClick(tab)}
                className={`d-flex align-items-center text-dark py-2 px-3 rounded-pill sidebar-nav-link ${
                  isLinkActive(tab.path) ? "active-sidebar-link" : ""
                }`}
              >
                <span className="me-3">{tab.icon}</span>
                <span className="fs-5 d-none d-lg-inline">
                  {tab.label}
                </span>{" "}
              </Nav.Link>
            </Nav.Item>
          ) : null
        )}

        <Dropdown className="mt-2 sidebar-more-dropdown">
          <Dropdown.Toggle
            as={Nav.Link}
            className="d-flex align-items-center text-dark py-2 px-3 rounded-pill sidebar-nav-link"
          >
            <span className="me-3">
              <FaEllipsisH size={24} />
            </span>
            <span className="fs-5 d-none d-lg-inline">Thêm</span>{" "}
          </Dropdown.Toggle>

          <Dropdown.Menu className="sidebar-dropdown-menu">
            {additionalTabs.map((tab, index) =>
              tab.label ? (
                <Dropdown.Item
                  key={tab.label || index}
                  onClick={() => handleNavLinkClick(tab)}
                  className="d-flex align-items-center py-2 px-3 sidebar-dropdown-item"
                >
                  <span className="me-3">{tab.icon}</span>
                  {tab.label}
                </Dropdown.Item>
              ) : (
                <Dropdown.Divider key={`divider-${index}`} />
              )
            )}
          </Dropdown.Menu>
        </Dropdown>
      </Nav>

      {/* NÚT ĐĂNG - Gọi modal thay vì navigate trực tiếp */}
      <Button
        variant="primary"
        className="rounded-pill mt-3 py-3 fw-bold sidebar-post-button d-none d-lg-block"
        onClick={handleShowCreatePostModal} // Đã đổi
      >
        Đăng
      </Button>
      {/* Floating action button for small screens */}
      <Button
        variant="primary"
        className="sidebar-fab d-lg-none rounded-circle p-3 shadow"
        onClick={handleShowCreatePostModal} // Đã đổi
      >
        <FaPlusCircle size={24} />
      </Button>

      <div className="mt-auto pt-3">
        <Dropdown drop="up" className="w-100">
          <Dropdown.Toggle
            as="div"
            className="d-flex align-items-center p-2 rounded-pill hover-bg-light cursor-pointer w-100"
            style={{ backgroundColor: isDarkMode ? "#222" : "#f8f9fa" }}
          >
            <img
              src={user?.avatar || "https://via.placeholder.com/40"}
              alt="User Avatar"
              className="rounded-circle me-2"
              style={{ width: "40px", height: "40px", objectFit: "cover" }}
            />
            <div className="d-none d-lg-block flex-grow-1">
              <div className="fw-bold text-dark">
                {user?.name || "Người dùng"}
              </div>
              <div className="text-muted small">
                @{user?.username || "username"}
              </div>
            </div>
            <FaEllipsisH className="ms-auto me-2 text-dark d-none d-lg-block" />
          </Dropdown.Toggle>
          <Dropdown.Menu className="sidebar-user-dropdown-menu">
            <Dropdown.Item
              onClick={() => navigate(`/profile/${user?.id || "default"}`)}
            >
              Xem hồ sơ
            </Dropdown.Item>
            <Dropdown.Item
              onClick={() => handleNavLinkClick({ action: "logout" })}
            >
              <FaSignOutAlt className="me-2" /> Đăng xuất
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </div>
    </>
  );

  return (
    <>
      <Button
        variant="light"
        className="d-md-none position-fixed top-0 start-0 m-3 z-3"
        onClick={handleShowOffcanvas}
      >
        <FaBars size={24} />
      </Button>

      <div
        className="d-none d-md-flex flex-column flex-shrink-0 pt-2 pb-3 ps-3 pe-0 border-end sidebar-left-container"
        style={{
          width: "280px",
          height: "100vh",
          position: "sticky",
          top: 0,
          overflowY: "auto",
        }}
      >
        <div className="d-flex justify-content-between align-items-center mb-3 px-3">
          <Link to="/home" className="d-block me-auto">
            <KLogoSvg width="50px" height="50px" />
          </Link>
          <Button
            variant="link"
            onClick={onToggleDarkMode}
            className="text-dark p-0 toggle-dark-mode-button"
          >
            {isDarkMode ? <FaSun size={20} /> : <FaMoon size={20} />}
          </Button>
        </div>
        {renderSidebarContent()}
      </div>

      <Offcanvas
        show={showOffcanvas}
        onHide={handleCloseOffcanvas}
        placement="start"
        className="sidebar-offcanvas"
      >
        <Offcanvas.Header closeButton>
          <Offcanvas.Title className="d-flex align-items-center">
            <Link to="/home" className="d-block me-auto">
              <KLogoSvg width="50px" height="50px" />
            </Link>
            <Button
              variant="link"
              onClick={onToggleDarkMode}
              className="text-dark p-0 toggle-dark-mode-button"
            >
              {isDarkMode ? <FaSun size={20} /> : <FaMoon size={20} />}
            </Button>
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="d-flex flex-column">
          {renderSidebarContent()}
        </Offcanvas.Body>
      </Offcanvas>

      {/* RENDER MODAL ĐĂNG BÀI Ở ĐÂY */}
      {/* onNewPost sẽ được truyền từ App.js xuống */}
      <CreatePostModal
        show={showCreatePostModal}
        handleClose={handleCloseCreatePostModal}
        handlePostSubmit={onNewPost}
      />
    </>
  );
}

export default SidebarLeft;
