import React, { useState, useEffect, useContext } from "react";
import { Container, Row, Col, Form, Button, Spinner } from "react-bootstrap";
import { FaArrowLeft, FaLock, FaList } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import SidebarLeft from "../../components/layout/SidebarLeft/SidebarLeft";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function SettingsPage() {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [settings, setSettings] = useState({
        postVisibility: "public",
        commentPermission: "public",
        profileViewer: "public",
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);

    const fetchPrivacySettings = async () => {
        setLoading(true);
        const token = sessionStorage.getItem("token") || localStorage.getItem("token");
        if (!token) {
            toast.error("Không tìm thấy token. Vui lòng đăng nhập lại.");
            navigate("/login");
            return;
        }

        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/user/profile/${user.username}`, {
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json();
            console.log("Fetch privacy settings response:", data); // Debug
            if (!response.ok) {
                throw new Error(data.message || "Không thể lấy cài đặt quyền riêng tư.");
            }

            // Ánh xạ trực tiếp từ data
            setSettings({
                postVisibility: data.data.postVisibility || "public",
                commentPermission: data.data.commentPermission || "public",
                profileViewer: data.data.profilePrivacySetting || "public",
            });
        } catch (error) {
            console.error("Lỗi khi lấy cài đặt quyền riêng tư:", error);
            toast.error(error.message || "Không thể tải cài đặt!");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!user) {
            navigate("/");
            return;
        }

        fetchPrivacySettings();
    }, [user, navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setSettings((prev) => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        const token = sessionStorage.getItem("token") || localStorage.getItem("token");
        if (!token) {
            toast.error("Không tìm thấy token. Vui lòng đăng nhập lại.");
            navigate("/login");
            return;
        }

        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/user/profile/${user.username}/privacy`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    privacySetting: settings.profileViewer,
                    customListId: settings.profileViewer === "custom" ? settings.customListId : null,
                }),
            });

            const data = await response.json();
            if (!response.ok)    {
                throw new Error(data.message || "Không thể lưu cài đặt!");
            }

            toast.success(data.message || "Cài đặt quyền riêng tư đã được lưu thành công!");
            await fetchPrivacySettings(); // Đồng bộ state
        } catch (error) {
            console.error("Lỗi khi lưu cài đặt quyền riêng tư:", error);
            toast.error(error.message || "Không thể lưu cài đặt!");
        } finally {
            setSaving(false);
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
                                <Link to="/home" className="btn btn-light me-3">
                                    <FaArrowLeft size={20} />
                                </Link>
                                <div>
                                    <h5 className="mb-0 fw-bold text-dark">Cài đặt Quyền riêng tư</h5>
                                    <span className="text-dark small">Quản lý quyền truy cập nội dung</span>
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
                                <h4 className="text-dark mb-4">
                                    <FaLock className="me-2" /> Quyền riêng tư
                                </h4>
                                <Form>
                                    <Form.Group className="mb-3">
                                        <Form.Label className="fw-bold text-dark">Ai có thể xem bài đăng của bạn?</Form.Label>
                                        <Form.Select
                                            name="postVisibility"
                                            value={settings.postVisibility}
                                            onChange={handleChange}
                                        >
                                            <option value="public">Mọi người</option>
                                            <option value="friends">Bạn bè</option>
                                            <option value="only_me">Chỉ mình tôi</option>
                                            <option value="custom">Tùy chỉnh</option>
                                        </Form.Select>
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label className="fw-bold text-dark">Ai có thể bình luận bài đăng của bạn?</Form.Label>
                                        <Form.Select
                                            name="commentPermission"
                                            value={settings.commentPermission}
                                            onChange={handleChange}
                                        >
                                            <option value="public">Mọi người</option>
                                            <option value="friends">Bạn bè</option>
                                            <option value="only_me">Chỉ mình tôi</option>
                                            <option value="custom">Tùy chỉnh</option>
                                        </Form.Select>
                                    </Form.Group>
                                    <Form.Group className="mb-4">
                                        <Form.Label className="fw-bold text-dark">Ai có thể xem trang cá nhân của bạn?</Form.Label>
                                        <Form.Select
                                            name="profileViewer"
                                            value={settings.profileViewer}
                                            onChange={handleChange}
                                        >
                                            <option value="public">Mọi người</option>
                                            <option value="friends">Bạn bè</option>
                                            <option value="only_me">Chỉ mình tôi</option>
                                            <option value="custom">Tùy chỉnh</option>
                                        </Form.Select>
                                    </Form.Group>
                                    <div className="mb-4">
                                        <Link to="/privacy/lists" className="btn btn-outline-primary rounded-pill px-4">
                                            <FaList className="me-2" /> Quản lý danh sách tùy chỉnh
                                        </Link>
                                    </div>
                                    <Button
                                        variant="primary"
                                        className="rounded-pill px-4 py-2 fw-bold"
                                        onClick={handleSave}
                                        disabled={saving}
                                    >
                                        {saving ? (
                                            <>
                                                <Spinner animation="border" size="sm" className="me-2" />
                                                Đang lưu...
                                            </>
                                        ) : (
                                            "Lưu thay đổi"
                                        )}
                                    </Button>
                                </Form>
                            </div>
                        </Col>
                        <Col xs={0} lg={3} className="d-none d-lg-block p-0" />
                    </Row>
                </Container>
            </Container>
        </>
    );
}

export default SettingsPage;