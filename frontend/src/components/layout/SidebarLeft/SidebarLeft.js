import React, { useState, useContext, useEffect } from "react";
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
    FaListAlt,
    FaUserSlash,
} from "react-icons/fa";
import { BsStars } from "react-icons/bs";
import { Link, useNavigate, useLocation } from "react-router-dom";
import KLogoSvg from "../../svgs/KSvg";
import { AuthContext } from "../../../context/AuthContext";
import { useWebSocket } from "../../../hooks/useWebSocket";
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

    const handleCloseOffcanvas = () => setShowOffcanvas(false);
    const handleShowOffcanvas = () => setShowOffcanvas(true);

    useEffect(() => {
        if (!user) return;

        const fetchCounts = async () => {
            try {
                const token = sessionStorage.getItem("token") || localStorage.getItem("token");
                if (!token) return;

                // Lấy số thông báo chưa đọc
                const notifResponse = await fetch(
                    `${process.env.REACT_APP_API_URL}/notifications?page=0&size=100`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (notifResponse.ok) {
                    const notifData = await notifResponse.json();
                    const unreadNotifs = Array.isArray(notifData.data?.content)
                        ? notifData.data.content.filter((notif) => notif.status === "unread").length
                        : 0;
                    setUnreadNotificationCount(unreadNotifs);
                }

                // Lấy số tin nhắn chưa đọc
                const messageResponse = await fetch(
                    `${process.env.REACT_APP_API_URL}/chat/messages/unread-count`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (messageResponse.ok) {
                    const messageData = await messageResponse.json();
                    setUnreadMessageCount(messageData.unreadCount || 0);
                }
            } catch (error) {
                console.error("Error fetching counts:", error);
            }
        };

        fetchCounts();
    }, [user]);

    useWebSocket(
        (message) => {
            // Xử lý thông báo tin nhắn mới
            setUnreadMessageCount((prev) => prev + 1);
            toast.info("Bạn có tin nhắn mới!");
        },
        setUnreadMessageCount,
        "/topic/messages/" // Đăng ký topic cho tin nhắn
    );

    useEffect(() => {
        if (location.pathname === "/notifications") {
            setUnreadNotificationCount(0);
        }
        if (location.pathname === "/messages") {
            setUnreadMessageCount(0); // Reset số tin nhắn chưa đọc khi vào trang Messages
        }
    }, [location.pathname]);

    const mainTabs = [
        { icon: <FaHome size={24} />, label: "Trang chủ", path: "/home" },
        { icon: <FaSearch size={24} />, label: "Khám phá", path: "/explore" },
        {
            icon: (
                <div className="position-relative">
                    <FaBell size={24} />
                    {unreadNotificationCount > 0 && (
                        <Badge
                            bg="danger"
                            className="position-absolute top-0 start-100 translate-middle rounded-circle"
                        >
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
                        <Badge
                            bg="danger"
                            className="position-absolute top-0 start-100 translate-middle rounded-circle"
                        >
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
        {
            icon: <FaUserAlt size={24} />,
            label: "Hồ sơ",
            path: `/profile/${user?.username || "default"}`,
            protected: true,
        },
    ];

    const additionalTabs = [
        { icon: <FaUserFriends size={24} />, label: "Bạn bè", path: "/friends" },
        {
            icon: <FaUserSlash size={24} />,
            label: "Người bị chặn",
            path: "/blocks",
            protected: true,
        },
        {
            icon: <FaRegPlusSquare size={24} />,
            label: "Tạo Story",
            path: "/create-story",
            protected: true,
        },
        { icon: <FaLock size={24} />, label: "Cài đặt Bảo mật", path: "/settings" },
        {
            icon: <FaTrash size={24} />,
            label: "Xóa Tài khoản",
            path: "/delete-account",
            protected: true,
        },
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
                {mainTabs.map((tab) => (
                    <Nav.Item key={tab.label} className="mb-1">
                        <Nav.Link
                            onClick={() => handleNavLinkClick(tab)}
                            className={`d-flex align-items-center text-dark py-2 px-3 rounded-pill sidebar-nav-link ${
                                isLinkActive(tab.path) ? "active-sidebar-link" : ""
                            }`}
                        >
                            <span className="me-3">{tab.icon}</span>
                            <span className="fs-5 d-none d-lg-inline">{tab.label}</span>
                        </Nav.Link>
                    </Nav.Item>
                ))}
                <Dropdown className="mt-2 sidebar-more-dropdown">
                    <Dropdown.Toggle
                        as={Nav.Link}
                        className="d-flex align-items-center text-dark py-2 px-3 rounded-pill sidebar-nav-link"
                    >
            <span className="me-3">
              <FaEllipsisH size={24} />
            </span>
                        <span className="fs-5 d-none d-lg-inline">Thêm</span>
                    </Dropdown.Toggle>
                    <Dropdown.Menu className="sidebar-dropdown-menu">
                        {additionalTabs.map((tab) => (
                            <Dropdown.Item
                                key={tab.label}
                                onClick={() => handleNavLinkClick(tab)}
                                className="d-flex align-items-center py-2 px-3 sidebar-dropdown-item"
                            >
                                <span className="me-3">{tab.icon}</span>
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
                            src={user?.avatar || "https://placehold.co/40x40"}
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
                            onClick={() =>
                                navigate(`/profile/${user?.username || "default"}`)
                            }
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
            <ToastContainer />
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
        </>
    );
}

export default SidebarLeft;
