import React, { useState, useEffect, useContext } from "react";
import { Container, Row, Col, Form, Button, ButtonGroup, Spinner } from "react-bootstrap";
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
        commentPermission: "everyone",
        friendRequestPermission: "everyone",
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        if (!user) {
            navigate("/signup");
            return;
        }

        const fetchPrivacySettings = async () => {
            setLoading(true);
            const token = sessionStorage.getItem("token") || localStorage.getItem("token");
            if (!token) {
                toast.error("Không tìm thấy token. Vui lòng đăng nhập lại.");
                setLoading(false);
                navigate("/login");
                return;
            }

            try {
                const response = await fetch(`${process.env.REACT_APP_API_URL}/privacy`, {
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
                    throw new Error(data.message || "Không thể lấy cài đặt quyền riêng tư.");
                }

                setSettings(data || {
                    postVisibility: "public",
                    commentPermission: "everyone",
                    friendRequestPermission: "everyone",
                });
            } catch (error) {
                console.error("Lỗi khi lấy cài đặt quyền riêng tư:", error);
                toast.error(error.message || "Không thể tải cài đặt!");
            } finally {
                setLoading(false);
            }
        };

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
            setSaving(false);
            navigate("/login");
            return;
        }

        try {
            const response = await fetch(
                `${process.env.REACT_APP_API_URL}/privacy`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(settings),
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
                throw new Error(data.message || "Không thể lưu cài đặt!");
            }

            toast.success("Cài đặt quyền riêng tư đã được lưu thành công!");
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
        return React.createElement(
            "div",
            { className: "d-flex justify-content-center align-items-center min-vh-100" },
            React.createElement(Spinner, { animation: "border", role: "status" })
        );
    }

    return React.createElement(
        React.Fragment,
        null,
        React.createElement(ToastContainer),
        React.createElement(
            Container,
            { fluid: true, className: "min-vh-100 p-0" },
            React.createElement(
                "div",
                { className: "sticky-top bg-white py-2 border-bottom", style: { zIndex: 1020 } },
                React.createElement(
                    Container,
                    { fluid: true },
                    React.createElement(
                        Row,
                        null,
                        React.createElement(
                            Col,
                            { xs: 12, lg: 12, className: "mx-auto d-flex align-items-center ps-md-5" },
                            React.createElement(
                                Link,
                                { to: "/home", className: "btn btn-light me-3" },
                                React.createElement(FaArrowLeft, { size: 20 })
                            ),
                            React.createElement(
                                "div",
                                null,
                                React.createElement("h5", { className: "mb-0 fw-bold text-dark" }, "Cài đặt Quyền riêng tư"),
                                React.createElement("span", { className: "text-dark small" }, "Quản lý quyền truy cập nội dung")
                            )
                        )
                    )
                )
            ),
            React.createElement(
                Container,
                { fluid: true, className: "flex-grow-1" },
                React.createElement(
                    Row,
                    { className: "h-100" },
                    React.createElement(
                        Col,
                        { xs: 0, lg: 3, className: "d-none d-lg-block p-0" },
                        React.createElement(SidebarLeft, {
                            onToggleDarkMode: handleToggleDarkMode,
                            isDarkMode: isDarkMode,
                            onShowCreatePost: handleShowCreatePost,
                        })
                    ),
                    React.createElement(
                        Col,
                        { xs: 12, lg: 6, className: "px-md-0" },
                        React.createElement(
                            "div",
                            { className: "p-3" },
                            React.createElement(
                                "h4",
                                { className: "text-dark mb-4" },
                                React.createElement(FaLock, { className: "me-2" }),
                                " Quyền riêng tư"
                            ),
                            React.createElement(
                                Form,
                                null,
                                React.createElement(
                                    Form.Group,
                                    { className: "mb-3" },
                                    React.createElement(Form.Label, { className: "fw-bold text-dark" }, "Ai có thể xem bài đăng của bạn?"),
                                    React.createElement(
                                        Form.Select,
                                        {
                                            name: "postVisibility",
                                            value: settings.postVisibility,
                                            onChange: handleChange,
                                        },
                                        React.createElement("option", { value: "public" }, "Mọi người"),
                                        React.createElement("option", { value: "friends" }, "Bạn bè"),
                                        React.createElement("option", { value: "private" }, "Chỉ mình tôi")
                                    )
                                ),
                                React.createElement(
                                    Form.Group,
                                    { className: "mb-3" },
                                    React.createElement(Form.Label, { className: "fw-bold text-dark" }, "Ai có thể bình luận bài đăng của bạn?"),
                                    React.createElement(
                                        Form.Select,
                                        {
                                            name: "commentPermission",
                                            value: settings.commentPermission,
                                            onChange: handleChange,
                                        },
                                        React.createElement("option", { value: "everyone" }, "Mọi người"),
                                        React.createElement("option", { value: "friends" }, "Bạn bè"),
                                        React.createElement("option", { value: "nobody" }, "Không ai")
                                    )
                                ),
                                React.createElement(
                                    Form.Group,
                                    { className: "mb-4" },
                                    React.createElement(Form.Label, { className: "fw-bold text-dark" }, "Ai có thể gửi yêu cầu kết bạn?"),
                                    React.createElement(
                                        Form.Select,
                                        {
                                            name: "friendRequestPermission",
                                            value: settings.friendRequestPermission,
                                            onChange: handleChange,
                                        },
                                        React.createElement("option", { value: "everyone" }, "Mọi người"),
                                        React.createElement("option", { value: "friends_of_friends" }, "Bạn của bạn bè"),
                                        React.createElement("option", { value: "nobody" }, "Không ai")
                                    )
                                ),
                                React.createElement(
                                    "div",
                                    { className: "mb-4" },
                                    React.createElement(
                                        Link,
                                        { to: "/privacy/lists", className: "btn btn-outline-primary rounded-pill px-4" },
                                        React.createElement(FaList, { className: "me-2" }),
                                        " Quản lý danh sách tùy chỉnh"
                                    )
                                ),
                                React.createElement(
                                    Button,
                                    {
                                        variant: "primary",
                                        className: "rounded-pill px-4 py-2 fw-bold",
                                        onClick: handleSave,
                                        disabled: saving,
                                    },
                                    saving
                                        ? [
                                            React.createElement(Spinner, { animation: "border", size: "sm", className: "me-2", key: "spinner" }),
                                            "Đang lưu...",
                                        ]
                                        : "Lưu thay đổi"
                                )
                            )
                        )
                    ),
                    React.createElement(Col, { xs: 0, lg: 3, className: "d-none d-lg-block p-0" })
                )
            )
        )
    );
}

export default SettingsPage;