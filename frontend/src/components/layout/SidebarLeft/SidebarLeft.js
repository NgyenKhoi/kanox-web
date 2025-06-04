import React, { useState, useContext } from "react";
import { Nav, Button, Offcanvas } from "react-bootstrap";
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
} from "react-icons/fa";
import { BsRocketTakeoff, BsStars } from "react-icons/bs";
import { Link, useNavigate } from "react-router-dom";
import KLogoSvg from "../../svgs/KSvg";
import { AuthContext } from "../../../context/AuthContext";

function SidebarLeft() {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [showOffcanvas, setShowOffcanvas] = useState(false);

    const handleClose = () => setShowOffcanvas(false);
    const handleShow = () => setShowOffcanvas(true);

    const handleProtectedClick = (path) => {
        if (!user) {
            navigate("/");
        } else {
            navigate(path);
        }
    };

    return (
        <>
            {/* Nút toggle sidebar trên mobile */}
            <Button
                variant="link"
                className="d-md-none position-fixed top-0 start-0 m-3 text-dark"
                onClick={handleShow}
                style={{ zIndex: 1050 }}
            >
                <FaBars size={24} />
            </Button>

            {/* Sidebar cho desktop */}
            <div
                className="d-none d-md-flex flex-column flex-shrink-0 pt-2 pb-3 ps-3 pe-0 sticky-top border-end"
                style={{
                    width: "280px",
                    height: "100vh",
                    overflowY: "auto",
                    backgroundColor: "#fff",
                    scrollbarWidth: "none",
                }}
            >
                <style>
                    {`
            div::-webkit-scrollbar {
              display: none;
            }
          `}
                </style>

                <div className="d-flex flex-column align-items-start">
                    <Link to="/Home" className="d-none d-md-block mb-3 ms-2 mt-2">
                        <KLogoSvg width="40px" height="40px" />
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
                            variant="dark"
                            className="rounded-pill mt-3 py-3 fw-bold w-75 d-none d-md-block ms-3"
                            onClick={() => handleProtectedClick("/create-post")}
                        >
                            Đăng
                        </Button>

                        {!user && (
                            <Button
                                variant="outline-dark"
                                className="mt-4 w-75 fw-bold ms-3"
                                onClick={() => navigate("/")}
                            >
                                Đăng nhập
                            </Button>
                        )}
                    </Nav>
                </div>
            </div>

            {/* Off-canvas sidebar cho mobile */}
            <Offcanvas show={showOffcanvas} onHide={handleClose} className="d-md-none">
                <Offcanvas.Header closeButton>
                    <Offcanvas.Title>
                        <Link to="/Home" onClick={handleClose}>
                            <KLogoSvg width="40px" height="40px" />
                        </Link>
                    </Offcanvas.Title>
                </Offcanvas.Header>
                <Offcanvas.Body>
                    <Nav className="flex-column">
                        <Nav.Item className="mb-1">
                            <Nav.Link
                                as={Link}
                                to="/Home"
                                onClick={() => {
                                    handleProtectedClick("/HomePage");
                                    handleClose();
                                }}
                                className="d-flex align-items-center text-dark py-2 px-3 rounded-pill fw-bold"
                            >
                                <FaHome size={24} className="me-3" />
                                <span className="fs-5">Trang chủ</span>
                            </Nav.Link>
                        </Nav.Item>
                        <Nav.Item className="mb-1">
                            <Nav.Link
                                onClick={() => {
                                    handleProtectedClick("/explore");
                                    handleClose();
                                }}
                                className="d-flex align-items-center text-dark py-2 px-3 rounded-pill"
                            >
                                <FaSearch size={24} className="me-3" />
                                <span className="fs-5">Khám phá</span>
                            </Nav.Link>
                        </Nav.Item>
                        <Nav.Item className="mb-1">
                            <Nav.Link
                                onClick={() => {
                                    handleProtectedClick("/notifications");
                                    handleClose();
                                }}
                                className="d-flex align-items-center text-dark py-2 px-3 rounded-pill"
                            >
                                <FaBell size={24} className="me-3" />
                                <span className="fs-5">Thông báo</span>
                            </Nav.Link>
                        </Nav.Item>
                        <Nav.Item className="mb-1">
                            <Nav.Link
                                onClick={() => {
                                    handleProtectedClick("/messages");
                                    handleClose();
                                }}
                                className="d-flex align-items-center text-dark py-2 px-3 rounded-pill"
                            >
                                <FaEnvelope size={24} className="me-3" />
                                <span className="fs-5">Tin nhắn</span>
                            </Nav.Link>
                        </Nav.Item>
                        <Nav.Item className="mb-1">
                            <Nav.Link
                                onClick={() => {
                                    handleProtectedClick("/grok");
                                    handleClose();
                                }}
                                className="d-flex align-items-center text-dark py-2 px-3 rounded-pill"
                            >
                                <BsRocketTakeoff size={24} className="me-3" />
                                <span className="fs-5">Grok</span>
                            </Nav.Link>
                        </Nav.Item>
                        <Nav.Item className="mb-1">
                            <Nav.Link
                                onClick={() => {
                                    handleProtectedClick("/communities");
                                    handleClose();
                                }}
                                className="d-flex align-items-center text-dark py-2 px-3 rounded-pill"
                            >
                                <FaUserAlt size={24} className="me-3" />
                                <span className="fs-5">Cộng đồng</span>
                            </Nav.Link>
                        </Nav.Item>
                        <Nav.Item className="mb-1">
                            <Nav.Link
                                onClick={() => {
                                    handleProtectedClick("/premium");
                                    handleClose();
                                }}
                                className="d-flex align-items-center text-dark py-2 px-3 rounded-pill"
                            >
                                <BsStars size={24} className="me-3" />
                                <span className="fs-5">Premium</span>
                            </Nav.Link>
                        </Nav.Item>
                        <Nav.Item className="mb-1">
                            <Nav.Link
                                onClick={() => {
                                    handleProtectedClick(`/profile/${user?.username || ""}`);
                                    handleClose();
                                }}
                                className="d-flex align-items-center text-dark py-2 px-3 rounded-pill"
                            >
                                <FaUserAlt size={24} className="me-3" />
                                <span className="fs-5">Hồ sơ</span>
                            </Nav.Link>
                        </Nav.Item>
                        <Nav.Item className="mb-1">
                            <Nav.Link
                                onClick={() => {
                                    handleProtectedClick("/create-story");
                                    handleClose();
                                }}
                                className="d-flex align-items-center text-dark py-2 px-3 rounded-pill"
                            >
                                <FaRegPlusSquare size={24} className="me-3" />
                                <span className="fs-5">Tạo Story</span>
                            </Nav.Link>
                        </Nav.Item>
                        <Nav.Item className="mb-1">
                            <Nav.Link
                                onClick={() => {
                                    handleProtectedClick("/settings");
                                    handleClose();
                                }}
                                className="d-flex align-items-center text-dark py-2 px-3 rounded-pill"
                            >
                                <FaLock size={24} className="me-3" />
                                <span className="fs-5">Cài đặt Bảo mật</span>
                            </Nav.Link>
                        </Nav.Item>
                        <Nav.Item className="mb-1">
                            <Nav.Link
                                onClick={() => {
                                    handleProtectedClick("/delete-account");
                                    handleClose();
                                }}
                                className="d-flex align-items-center text-dark py-2 px-3 rounded-pill"
                            >
                                <FaTrash size={24} className="me-3" />
                                <span className="fs-5">Xóa Tài khoản</span>
                            </Nav.Link>
                        </Nav.Item>
                        <Nav.Item className="mb-1">
                            <Nav.Link
                                onClick={() => {
                                    handleProtectedClick("/more");
                                    handleClose();
                                }}
                                className="d-flex align-items-center text-dark py-2 px-3 rounded-pill"
                            >
                                <FaEllipsisH size={24} className="me-3" />
                                <span className="fs-5">Thêm</span>
                            </Nav.Link>
                        </Nav.Item>
                        {user && (
                            <Nav.Item className="mb-1">
                                <Nav.Link
                                    onClick={() => {
                                        handleProtectedClick("/logout");
                                        handleClose();
                                    }}
                                    className="d-flex align-items-center text-dark py-2 px-3 rounded-pill"
                                >
                                    <FaSignOutAlt size={24} className="me-3" />
                                    <span className="fs-5">Đăng xuất</span>
                                </Nav.Link>
                            </Nav.Item>
                        )}
                        {!user && (
                            <Button
                                variant="outline-dark"
                                className="mt-4 w-100 fw-bold"
                                onClick={() => {
                                    navigate("/");
                                    handleClose();
                                }}
                            >
                                Đăng nhập
                            </Button>
                        )}
                    </Nav>
                </Offcanvas.Body>
            </Offcanvas>

            {/* Nút Create Story/Post trên mobile */}
            <Button
                variant="dark"
                className="d-md-none position-fixed bottom-0 end-0 m-4 rounded-circle shadow-lg"
                style={{
                    width: "70px",
                    height: "70px",
                    zIndex: 1050,
                    transition: "transform 0.3s ease",
                }}
                title="Tạo bài đăng"
                onClick={() => handleProtectedClick("/create-post")}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1.0)")}
            >
                <FaPlusCircle size={35} />
            </Button>
        </>
    );
}

export default SidebarLeft;