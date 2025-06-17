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
                    `${process.env.REACT_APP_API_URL}/messages/unread-count`,
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
        { icon: <FaSignOutAlt />, label: "Đăng xuất", action: logout },
        { icon: <FaLock />, label: "Đổi mật khẩu", path: "/change-password" },
        { icon: <FaTrash />, label: "Xóa tài khoản", path: "/delete-account" },
    ];

    const handleNavLinkClick = (path, action) => {
        if (action) {
            action();
            handleCloseOffcanvas();
            return;
        }
        navigate(path);
        handleCloseOffcanvas();
    };

    const renderSidebarContent = () => {
        return (
            <>
                <Nav className="flex-column mb-4">
                    {mainTabs.map((tab, index) => (
                        <Nav.Item key={index} className="mb-2">
                            <Nav.Link
                                as={Link}
                                to={tab.path}
                                onClick={() => handleNavLinkClick(tab.path)}
                                className={`d-flex align-items-center text-dark rounded-pill px-3 py-2 ${
                                    location.pathname === tab.path ? "active bg-light" : ""
                                }`}
                            >
                                {tab.icon}
                                <span className="ms-3">{tab.label}</span>
                            </Nav.Link>
                        </Nav.Item>
                    ))}
                </Nav>
                <Button
                    variant="primary"
                    className="rounded-pill py-2 mb-4 mx-3 d-flex align-items-center justify-content-center"
                    onClick={() => {
                        onShowCreatePost();
                        handleCloseOffcanvas();
                    }}
                >
                    <FaRegPlusSquare size={20} className="me-2" />
                    Tạo bài viết
                </Button>
                {user && (
                    <Dropdown className="mx-3">
                        <Dropdown.Toggle
                            variant="light"
                            className="d-flex align-items-center w-100 rounded-pill py-2 px-3"
                        >
                            <img
                                src={user.avatar || "/default-avatar.png"}
                                alt="Avatar"
                                className="rounded-circle me-2"
                                style={{ width: "32px", height: "32px" }}
                            />
                            <span className="text-dark">{user.username}</span>
                        </Dropdown.Toggle>
                        <Dropdown.Menu className="w-100">
                            {additionalTabs.map((tab, index) => (
                                <Dropdown.Item
                                    key={index}
                                    onClick={() => handleNavLinkClick(tab.path, tab.action)}
                                    className="d-flex align-items-center"
                                >
                                    {tab.icon}
                                    <span className="ms-2">{tab.label}</span>
                                </Dropdown.Item>
                            ))}
                        </Dropdown.Menu>
                    </Dropdown>
                )}
            </>
        );
    };

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