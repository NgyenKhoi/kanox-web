import React, { useState, useEffect, useContext } from "react";
import { Container, Row, Col, ListGroup, Spinner } from "react-bootstrap";
import { FaArrowLeft } from "react-icons/fa";
import { Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import SidebarRight from "../../components/layout/SidebarRight/SidebarRight";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BlockedUserItem from "./BlockedUserItem";

function BlockedUsersPage() {
    const { user } = useContext(AuthContext);
    const [blockedUsers, setBlockedUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        fetchBlockedUsers();
    }, [user]);

    const fetchBlockedUsers = async () => {
        setLoading(true);
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        if (!token) {
            toast.error("Không tìm thấy token! Vui lòng đăng nhập lại!");
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/blocks`, {
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
                console.log("API Response:", data);
            } else {
                const text = await response.text();
                data = { message: text };
                console.log("API Text Response:", text);
            }

            if (!response.ok) {
                throw new Error(data.message || "Không thể lấy danh sách người bị chặn!");
            }

            setBlockedUsers(Array.isArray(data) ? data : data.data || []);
        } catch (error) {
            console.error("Lỗi khi lấy danh sách:", error);
            toast.error(error.message || "Không thể tải danh sách!");
        } finally {
            setLoading(false);
        }
    };

    const handleUnblock = async (blockedUserId) => {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        // if (!token) {
        //     toast.error("Không tìm thấy token! Vui lòng đăng nhập lại!");
        //     navigate("/login");
        //     return;
        // }

        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/blocks/${blockedUserId}`, {
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
                                <Link to="/profile" className="btn btn-light">
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
                        <Col xs={12} lg={8} className="px-md-0">
                            <div className="p-3">
                                <h4 className="text-dark mb-3">Danh sách người bị chặn</h4>
                                <ListGroup variant="flush">
                                    {blockedUsers.length === 0 ? (
                                        <p className="text-muted text-center p-4">Chưa chặn ai cả.</p>
                                    ) : (
                                        blockedUsers.map((blockedUser) => (
                                            <BlockedUserItem
                                                key={blockedUser.id}
                                                blockedUser={blockedUser}
                                                handleUnblock={handleUnblock}
                                            />
                                        ))
                                    )}
                                </ListGroup>
                            </div>
                        </Col>
                        <Col xs={0} lg={4} className="d-none d-lg-block p-0">
                            <SidebarRight />
                        </Col>
                    </Row>
                </Container>
            </Container>
        </>
    );
}

export default BlockedUsersPage;