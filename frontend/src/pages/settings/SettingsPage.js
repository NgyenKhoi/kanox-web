import React, { useState, useEffect, useContext } from "react";
import { Container, Row, Col, Form, Button, Spinner, Modal } from "react-bootstrap";
import { FaArrowLeft, FaLock, FaList } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function SettingsPage() {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [settings, setSettings] = useState({
        postVisibility: "public",
        commentPermission: "public",
        profileViewer: "public",
        customListId: null,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [verifyCode, setVerifyCode] = useState("");
    const [verifying, setVerifying] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const [emailForm, setEmailForm] = useState({ email: "", sending: false });
    const [changingPassword, setChangingPassword] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showNewPasswordForm, setShowNewPasswordForm] = useState(false);
    const [showEmailModal, setShowEmailModal] = useState(false);

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordForm((prev) => ({ ...prev, [name]: value }));
    };

    const submitChangePassword = async () => {
        setChangingPassword(true);
        const token = sessionStorage.getItem("token") || localStorage.getItem("token");
        try {
            const res = await fetch(`${process.env.REACT_APP_API_URL}/auth/change-password`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(passwordForm),
            });

            const data = await res.text(); // backend trả string
            if (!res.ok) throw new Error(data);
            toast.success("Đổi mật khẩu thành công");
            setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        } catch (err) {
            toast.error(err.message || "Lỗi khi đổi mật khẩu");
        } finally {
            setChangingPassword(false);
        }
    };

    const submitSendVerifyEmail = async () => {
        setEmailForm((prev) => ({ ...prev, sending: true }));
        const token = sessionStorage.getItem("token") || localStorage.getItem("token");
        try {
            const res = await fetch(`${process.env.REACT_APP_API_URL}/auth/send-verification-email`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ email: emailForm.email }),
            });

            const data = await res.text(); // hoặc json tùy backend
            if (!res.ok) throw new Error(data);
            toast.success("Đã gửi email xác minh");
            setEmailSent(true);
        } catch (err) {
            toast.error(err.message || "Không thể gửi email xác minh");
        } finally {
            setEmailForm((prev) => ({ ...prev, sending: false }));
        }
    };

    const handleVerifyCode = async () => {
        setVerifying(true);
        try {
            const res = await fetch(`${process.env.REACT_APP_API_URL}/auth/verify-email`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: verifyCode }),
            });

            const data = await res.text();
            if (!res.ok) throw new Error(data);

            toast.success("Xác minh email thành công");
            setVerifyCode("");
            setEmailSent(false); // reset sau xác minh
        } catch (err) {
            toast.error(err.message || "Mã xác minh không hợp lệ");
        } finally {
            setVerifying(false);
        }
    };

    const fetchPrivacySettings = async () => {
        setLoading(true);
        const token = sessionStorage.getItem("token") || localStorage.getItem("token");
        // if (!token) {
        //     toast.error("Không tìm thấy token. Vui lòng đăng nhập lại.");
        //     navigate("/login");
        //     return;
        // }

        try {
            const [generalRes, profileRes] = await Promise.all([
                fetch(`${process.env.REACT_APP_API_URL}/privacy`, {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }),
                fetch(`${process.env.REACT_APP_API_URL}/user/profile/${user.username}`, {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }),
            ]);

            const generalData = await generalRes.json();
            const profileData = await profileRes.json();

            if (!generalRes.ok || !profileRes.ok) {
                throw new Error("Không thể lấy cài đặt quyền riêng tư.");
            }
            console.log("generalData", generalData);

            setSettings({
                postVisibility: generalData.data?.postVisibility ?? "public",
                commentPermission: generalData.data?.commentPermission ?? "public",
                profileViewer: profileData.data?.profilePrivacySetting ?? "public",
                customListId: profileData.data?.customListId ?? null,
            });
        } catch (error) {
            console.error("Lỗi khi lấy cài đặt:", error);
            toast.error(error.message || "Không thể tải cài đặt quyền riêng tư!");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user && user.username) {
            fetchPrivacySettings();
        }
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setSettings((prev) => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        const token = sessionStorage.getItem("token") || localStorage.getItem("token");
        // if (!token) {
        //     toast.error("Không tìm thấy token. Vui lòng đăng nhập lại.");
        //     navigate("/login");
        //     return;
        // }

        try {
            // Gửi cập nhật bài đăng/bình luận
            const generalPrivacyRes = await fetch(`${process.env.REACT_APP_API_URL}/privacy`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    postVisibility: settings.postVisibility,
                    commentPermission: settings.commentPermission,
                }),
            });

            const generalData = await generalPrivacyRes.json();
            if (!generalPrivacyRes.ok) {
                throw new Error(generalData.message || "Lỗi khi cập nhật quyền riêng tư bài đăng.");
            }

            // Gửi cập nhật hồ sơ cá nhân
            const profilePrivacyRes = await fetch(`${process.env.REACT_APP_API_URL}/user/profile/${user.username}/privacy`, {
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

            const profileData = await profilePrivacyRes.json();
            if (!profilePrivacyRes.ok) {
                throw new Error(profileData.message || "Lỗi khi cập nhật quyền riêng tư hồ sơ.");
            }

            toast.success("Cài đặt quyền riêng tư đã được lưu thành công!");
            await fetchPrivacySettings();
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
                        <Col xs={12} lg={8} className="px-md-0">
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
                                    <hr className="my-4" />
                                    <h4 className="text-dark mb-4">Bảo mật tài khoản</h4>
                                    <div className="d-flex flex-wrap gap-3">
                                        <Button
                                            variant="warning"
                                            className="rounded-pill px-4 py-2 fw-bold"
                                            onClick={() => setShowPasswordModal(true)}
                                        >
                                            Đổi mật khẩu
                                        </Button>

                                        <Button
                                            variant="success"
                                            className="rounded-pill px-4 py-2 fw-bold"
                                            onClick={() => setShowEmailModal(true)}
                                        >
                                            Thêm email để xác minh
                                        </Button>
                                    </div>
                                </Form>
                            </div>
                        </Col>
                        <Col xs={0} lg={3} className="d-none d-lg-block p-0" />
                    </Row>
                </Container>
            </Container>
            <Modal show={showPasswordModal} onHide={() => {
                setShowPasswordModal(false);
                setShowNewPasswordForm(false);
                setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
            }} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Đổi mật khẩu</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {!showNewPasswordForm ? (
                        <>
                            <Form.Group>
                                <Form.Label>Mật khẩu hiện tại</Form.Label>
                                <Form.Control
                                    type="password"
                                    name="currentPassword"
                                    value={passwordForm.currentPassword}
                                    onChange={handlePasswordChange}
                                />
                            </Form.Group>
                            <div className="mt-3 text-end">
                                <Button
                                    variant="primary"
                                    onClick={() => {
                                        if (!passwordForm.currentPassword) {
                                            toast.warn("Vui lòng nhập mật khẩu hiện tại");
                                            return;
                                        }
                                        setShowNewPasswordForm(true);
                                    }}
                                >
                                    Tiếp tục
                                </Button>
                            </div>
                        </>
                    ) : (
                        <>
                            <Form.Group>
                                <Form.Label>Mật khẩu mới</Form.Label>
                                <Form.Control
                                    type="password"
                                    name="newPassword"
                                    value={passwordForm.newPassword}
                                    onChange={handlePasswordChange}
                                />
                            </Form.Group>
                            <Form.Group className="mt-2">
                                <Form.Label>Xác nhận mật khẩu mới</Form.Label>
                                <Form.Control
                                    type="password"
                                    name="confirmPassword"
                                    value={passwordForm.confirmPassword}
                                    onChange={handlePasswordChange}
                                />
                            </Form.Group>
                            <div className="mt-3 text-end">
                                <Button
                                    variant="secondary"
                                    className="me-2"
                                    onClick={() => {
                                        setShowPasswordModal(false);
                                        setShowNewPasswordForm(false);
                                        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
                                    }}
                                >
                                    Hủy
                                </Button>
                                <Button variant="warning" onClick={submitChangePassword} disabled={changingPassword}>
                                    {changingPassword ? "Đang đổi mật khẩu..." : "Đổi mật khẩu"}
                                </Button>
                            </div>
                        </>
                    )}
                </Modal.Body>
            </Modal>

            <Modal show={showEmailModal} onHide={() => {
                setShowEmailModal(false);
                setVerifyCode("");
                setEmailSent(false);
            }} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Xác minh Email</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group>
                        <Form.Label>Email mới</Form.Label>
                        <Form.Control
                            type="email"
                            value={emailForm.email}
                            onChange={(e) => setEmailForm({ ...emailForm, email: e.target.value })}
                        />
                    </Form.Group>
                    <div className="mt-3 text-end">
                        <Button
                            variant="success"
                            onClick={submitSendVerifyEmail}
                            disabled={emailForm.sending}
                        >
                            {emailForm.sending ? "Đang gửi..." : "Gửi mã xác minh"}
                        </Button>
                    </div>

                    {emailSent && (
                        <>
                            <Form.Group className="mt-3">
                                <Form.Label>Mã xác minh</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={verifyCode}
                                    onChange={(e) => setVerifyCode(e.target.value)}
                                    placeholder="Nhập mã xác minh bạn nhận được trong email"
                                />
                            </Form.Group>
                            <div className="mt-3 text-end">
                                <Button
                                    variant="info"
                                    onClick={handleVerifyCode}
                                    disabled={verifying}
                                >
                                    {verifying ? "Đang xác minh..." : "Xác minh mã"}
                                </Button>
                            </div>
                        </>
                    )}
                </Modal.Body>
            </Modal>
        </>
    );
}

export default SettingsPage;
