import React, { useState, useEffect, useContext } from "react";
import { Container, Row, Col, ListGroup, Button, Spinner } from "react-bootstrap";
import { FaArrowLeft, FaUserSlash } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import SidebarLeft from "../../components/layout/SidebarLeft/SidebarLeft";
import SidebarRight from "../../components/layout/SidebarRight/SidebarRight";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function BlockedUsersPage() {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [blockedUsers, setBlockedUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        if (!user) {
            navigate("/signup");
            return;
        }
        fetchBlockedUsers();
    }, [user, navigate]);

    const fetchBlockedUsers = async () => {
        setLoading(true);
        const token = sessionStorage.getItem("token");
        if (!token) {
            toast.error("Không tìm thấy token! Vui lòng đăng nhập lại!");
            setLoading(false);
            navigate("/signup");
            return;
        }

        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/blocks`, {
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            const contentType = response.headers.get("content-type");
            let data;
            if (contentType && contentType.includes("application/json")) {
                data = await response.json();
            } else {
                const text = await response.text();
                data = { message: text };
            }

            if (!response.ok) {
                throw new Error(data.message || "Không thể lấy danh sách người bị chặn!");
            }

            setBlockedUsers(data.data || []);
        } catch (error) {
            console.error("Lỗi khi lấy danh sách:", error);
            toast.error(error.message || "Không thể tải danh sách!");
        } finally {
            setLoading(false);
        }
    };

    const handleUnblock = async (blockedUserId) => {
        const token = sessionStorage.getItem("token");
        if (!token) {
            toast.error("Không tìm thấy token! Vui lòng đăng nhập lại!");
            navigate("/signup");
            return;
        }

        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/blocks/${blockedUserId}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            const contentType = response.headers.get("content-type");
            let data;
            if (contentType && contentType.includes("application/json")) {
                data = await response.json();
            } else {
                const text = await response.text();
                data = { message: text };
            }

            if (!response.ok) {
                throw new Error(data.message || "Không thể bỏ chặn!");
            }

            toast.success("Bỏ chặn thành công!");
            fetchBlockedUsers();
        } catch (error) {
            console.error("Lỗi khi bỏ chặn:", error);
            toast.error(error.message || "Lỗi khi bỏ chặn!");
        }
    };

    const handleToggleDarkMode = () => {
        setIsDarkMode((prev) => !prev);
        document.body.classList.toggle("dark-mode", !isDarkMode);
    };

    const handleShowCreatePost = () => {
        console.log("Mở modal tạo bài đăng");
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center min-vh-100">
                <Spinner animation="border" role="status" />
            </div>
        );
    }

    return (
        <>
            <ToastContainer />
            <Container fluid className="min-vh-100 p-0">
                <div className="sticky-top bg-white py-2 border-bottom" style={{ zIndex: 1020 }}>
                    <Container fluid>
                        <Row>
                            <Col xs={12} lg={12} className="mx-auto d-flex align-items-center ps-md-5">
                                <Link to="/home" className="btn btn-light">
                                    <FaArrowLeft size={20} />
                                </Link>
                                <div>
                                    <h5 className="mb-0 fw-bold text-dark">Người bị chặn</h5>
                                    <span className="text-dark small">Quản lý danh sách chặn</span>
                                </div>
                            </Col>
                        </Row>
                    </Container>
                </div>

                <Container fluid className="flex-grow-1">
                    <Row className="h-100">
                        <Col xs={0} lg={3} className="d-none d-lg-block p-0">
                            <SidebarLeft
                                onToggleDarkMode={handleToggleDarkMode}
                                isDarkMode={isDarkMode}
                                onShowCreatePost={handleShowCreatePost}
                            />
                        </Col>
                        <Col xs={12} lg={6} className="px-md-0">
                            <div className="p-3">
                                <h4 className="text-dark mb-3">Danh sách người bị chặn</h4>
                                <ListGroup variant="flush">
                                    {blockedUsers.length === 0 ? (
                                        <p className="text-muted text-center p-4">Chưa chặn ai cả.</p>
                                    ) : (
                                        blockedUsers.map((blockedUser) => (
                                            <ListGroup.Item
                                                key={blockedUser.id}
                                                className="d-flex align-items-center py-3"
                                            >
                                                <FaUserSlash className="me-3 text-muted" size={24} />
                                                <div className="flex-grow-1">
                                                    <div className="fw-bold text-dark">
                                                        {blockedUser.displayName || blockedUser.username}
                                                    </div>
                                                    <div className="text-muted">@{blockedUser.username}</div>
                                                </div>
                                                <Button
                                                    variant="outline-primary"
                                                    className="rounded-pill px-3"
                                                    onClick={() => handleUnblock(blockedUser.id)}
                                                >
                                                    Bỏ chặn
                                                </Button>
                                            </ListGroup.Item>
                                        ))
                                    )}
                                </ListGroup>
                            </div>
                        </Col>
                        <Col xs={0} lg={3} className="d-none d-lg-block p-0">
                            <SidebarRight />
                        </Col>
                    </Row>
                </Container>
            </Container>
        </>
    );
}

export default BlockedUsersPage;