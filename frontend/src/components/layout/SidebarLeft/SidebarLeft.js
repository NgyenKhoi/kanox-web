import React, { useState, useEffect, useContext } from "react";
import { Nav, Button, Dropdown, Offcanvas, Badge } from "react-bootstrap";
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
  FaUserFriends,
  FaUserSlash,
} from "react-icons/fa";
import { BsStars } from "react-icons/bs";
import { Link, useNavigate, useLocation } from "react-router-dom";
import KLogoSvg from "../../svgs/KSvg";
import { AuthContext } from "../../../context/AuthContext";
import useSingleMedia from "../../../hooks/useSingleMedia";
import "./SidebarLeft.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function SidebarLeft({ onToggleDarkMode, isDarkMode, onShowCreatePost }) {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [showOffcanvas, setShowOffcanvas] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

  const fetchUnreadMessageCount = async () => {
    try {
      const token = sessionStorage.getItem("token") || localStorage.getItem("token");
      const response = await fetch(`${process.env.REACT_APP_API_URL}/chat/messages/unread-count`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const messageData = await response.json();
        setUnreadMessageCount(messageData.unreadCount || 0);
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }

    fetchUnreadMessageCount();

    const handleUpdateUnreadCount = (event) => {
      setUnreadMessageCount(event.detail.unreadCount || 0);
    };
    window.addEventListener("updateUnreadCount", handleUpdateUnreadCount);

    if (location.pathname === "/notifications") {
      setUnreadNotificationCount(0);
    }

    return () => {
      window.removeEventListener("updateUnreadCount", handleUpdateUnreadCount);
    };
  }, [user, navigate, location.pathname]);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const token = sessionStorage.getItem("token") || localStorage.getItem("token");
        if (!token) return;

        const notifResponse = await fetch(`${process.env.REACT_APP_API_URL}/notifications?page=0&size=100`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (notifResponse.ok) {
          const notifData = await notifResponse.json();
          const unreadNotifs = Array.isArray(notifData.data?.content)
              ? notifData.data.content.filter((notif) => notif.status === "unread").length
              : 0;
          setUnreadNotificationCount(unreadNotifs);
        }
      } catch (error) {
        console.error("Error fetching counts:", error);
      }
    };

    fetchCounts();
  }, [user]);

  const { mediaUrl: avatarUrl } = useSingleMedia(user?.id, "PROFILE", "image");

  const handleCloseOffcanvas = () => setShowOffcanvas(false);
  const handleShowOffcanvas = () => setShowOffcanvas(true);

  const mainTabs = [
    { icon: <FaHome size={24} />, label: "Trang chủ", path: "/home" },
    { icon: <FaSearch size={24} />, label: "Khám phá", path: "/explore" },
    {
      icon: (
          <div className="position-relative">
            <FaBell size={24} />
            {unreadNotificationCount > 0 && (
                <Badge bg="danger" className="position-absolute top-0 start-100 translate-middle rounded-circle">
                  {unreadNotificationCount}
                </Badge>
            )}
          </div>
      ),
      label: "Thông báo",
      path: "/notifications",
    },
    {
      icon: (
          <div className="position-relative">
            <FaEnvelope size={24} />
            {unreadMessageCount > 0 && (
                <Badge bg="danger" className="position-absolute top-0 start-100 translate-middle rounded-circle">
                  {unreadMessageCount}
                </Badge>
            )}
          </div>
      ),
      label: "Tin nhắn",
      path: "/messages",
    },
    { icon: <FaUserAlt size={24} />, label: "Cộng đồng", path: "/communities" },
    { icon: <BsStars size={24} />, label: "Premium", path: "/premium" },
    { icon: <FaUserAlt size={24} />, label: "Hồ sơ", path: `/profile/${user?.username || "default"}`, protected: true },
  ];

  const additionalTabs = [
    { icon: <FaUserFriends size={24} />, label: "Bạn bè", path: "/friends" },
    { icon: <FaUserSlash size={24} />, label: "Người bị chặn", path: "/blocks", protected: true },
    { icon: <FaRegPlusSquare size={24} />, label: "Tạo Story", path: "/create-story", protected: true },
    { icon: <FaLock size={24} />, label: "Cài đặt Bảo mật", path: "/settings" },
    { icon: <FaTrash size={24} />, label: "Xóa Tài khoản", path: "/delete-account", protected: true },
  ];

  const handleNavLinkClick = (tab) => {
    handleCloseOffcanvas();
    if (tab.action === "logout") {
      logout();
      navigate("/");
      return;
    }
    if (tab.protected && !user) {
      navigate("/");
    } else {
      navigate(tab.path);
    }
  };

  const isLinkActive = (path) => {
    if (path.startsWith("/profile/") && location.pathname.startsWith("/profile/")) return true;
    if (path === "/home" && (location.pathname === "/" || location.pathname === "/home")) return true;
    return location.pathname === path;
  };

  const renderSidebarContent = () => (
      <>
        {!user ? (
            <div className="text-center p-3">
              <p className="mb-2">Bạn chưa đăng nhập.</p>
              <Button variant="primary" className="rounded-pill px-4" onClick={() => navigate("/")}>
                Đăng nhập
              </Button>
            </div>
        ) : (
            <>
              <Nav className="flex-column mb-auto">
                {mainTabs.map((tab) => (
                    <Nav.Item key={tab.label} className="mb-1">
                      <Nav.Link
                          onClick={() => handleNavLinkClick(tab)}
                          className={`d-flex align-items-center py-2 px-3 rounded-pill sidebar-nav-link ${isLinkActive(tab.path) ? "active-sidebar-link" : ""}`}
                      >
                        <span className="me-3">{React.cloneElement(tab.icon, { size: 24, className: "text-[var(--text-color)] dark:text-white" })}</span>
                        <span className="fs-5 d-none d-lg-inline">{tab.label}</span>
                      </Nav.Link>
                    </Nav.Item>
                ))}
                <Dropdown className="mt-2 sidebar-more-dropdown">
                  <Dropdown.Toggle
                      as={Nav.Link}
                      className="d-flex align-items-center py-2 px-3 rounded-pill sidebar-nav-link"
                  >
                    <span className="me-3"><FaEllipsisH size={24} className="text-[var(--text-color)] dark:text-white" /></span>
                    <span className="fs-5 d-none d-lg-inline">Thêm</span>
                  </Dropdown.Toggle>
                  <Dropdown.Menu className="sidebar-dropdown-menu">
                    {additionalTabs.map((tab) => (
                        <Dropdown.Item
                            key={tab.label}
                            onClick={() => handleNavLinkClick(tab)}
                            className="d-flex align-items-center py-2 px-3 sidebar-dropdown-item"
                        >
                          <span className="me-3">{React.cloneElement(tab.icon, { size: 24, className: "text-[var(--text-color)] dark:text-white" })}</span>
                          {tab.label}
                        </Dropdown.Item>
                    ))}
                  </Dropdown.Menu>
                </Dropdown>
              </Nav>
              <Button
                  variant="primary"
                  className="rounded-pill mt-3 py-3 fw-bold sidebar-post-button d-none d-lg-block"
                  onClick={() => {
                    handleCloseOffcanvas();
                    onShowCreatePost();
                  }}
              >
                Đăng
              </Button>
              <Button
                  variant="primary"
                  className="sidebar-fab d-lg-none rounded-circle p-3 shadow"
                  onClick={() => {
                    handleCloseOffcanvas();
                    onShowCreatePost();
                  }}
              >
                <FaPlusCircle size={24} className="text-white" />
              </Button>
              <div className="mt-auto pt-3">
                <Dropdown drop="up" className="w-100">
                  <Dropdown.Toggle
                      as="div"
                      className="d-flex align-items-center p-2 rounded-pill hover-bg-light cursor-pointer"
                  >
                    <img
                        src={avatarUrl || "https://placehold.co/40x40"}
                        alt="User Avatar"
                        className="rounded-circle me-2"
                        style={{ width: "40px", height: "40px", objectFit: "cover" }}
                    />
                    <div className="d-none d-lg-block flex-grow-1">
                      <div className="fw-bold text-[var(--text-color)]">{user?.displayName || "Người dùng"}</div>
                      <div className="text-[var(--text-color-muted)] small">@{user?.username || "username"}</div>
                    </div>
                    <FaEllipsisH className="ms-auto me-2 text-[var(--text-color)] dark:text-white" />
                  </Dropdown.Toggle>
                  <Dropdown.Menu className="sidebar-user-dropdown-menu">
                    <Dropdown.Item onClick={() => navigate(`/profile/${user?.username || "default"}`)}>
                      Xem hồ sơ
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => handleNavLinkClick({ action: "logout" })}>
                      <FaSignOutAlt className="me-2 text-[var(--text-color)] dark:text-white" /> Đăng xuất
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </div>
            </>
        )}
      </>
  );

  return (
      <>
        <ToastContainer />
        <Button
            variant="light"
            className="d-md-none position-fixed top-0 start-0 m-3 z-3 text-[var(--text-color)] dark:text-white"
            onClick={handleShowOffcanvas}
        >
          <FaBars size={24} />
        </Button>
        <div
            className="d-none d-md-flex flex-column flex-shrink-0 pt-2 pb-3 ps-3 pe-0 border-end sidebar-left-container"
            style={{ width: "280px", height: "100vh", top: 0, overflowY: "auto" }}
        >
          <div className="d-flex justify-content-between align-items-center mb-3 px-3">
            <Link to="/home" className="d-block me-auto">
              <KLogoSvg width="50px" height="50px" />
            </Link>
            <Button
                variant="link"
                onClick={onToggleDarkMode}
                className="text-[var(--text-color)] p-0"
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
                  className="text-[var(--text-color)] p-0"
              >
                {isDarkMode ? <FaSun size={20} /> : <FaMoon size={20} />}
              </Button>
            </Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body className="d-flex flex-column">
            {renderSidebarContent()}
          </Offcanvas.Body>
        </Offcanvas>
      </>
  );
}

export default SidebarLeft;