import React, { useState, useEffect, useContext } from "react";
import { FaCog } from "react-icons/fa";
import SidebarRight from "../../components/layout/SidebarRight/SidebarRight";
import { AuthContext } from "../../context/AuthContext";
import { WebSocketContext } from "../../context/WebSocketContext";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import NotificationItem from "./NotificationItem";

function NotificationPage({ onToggleDarkMode, isDarkMode, onShowCreatePost }) {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const { subscribe, unsubscribe } = useContext(WebSocketContext);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const token =
                sessionStorage.getItem("token") || localStorage.getItem("token");
            if (!token) {
                toast.error("Không tìm thấy token. Vui lòng đăng nhập lại.");
                return;
            }

            const response = await fetch(
                `${process.env.REACT_APP_API_URL}/notifications?page=0&size=100`,
                {
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || "Không thể lấy thông báo.");
            }

            const data = await response.json();
            const formattedNotifications = Array.isArray(data.data?.content)
                ? data.data.content.map((notif) => ({
                    id: notif.id,
                    type: notif.type,
                    userId: notif.userId || null,
                    displayName:
                        notif.targetType === "GROUP"
                            ? notif.groupName || "Nhóm"
                            : notif.displayName || "Người dùng",
                    username: notif.username || "unknown",
                    message: notif.message,
                    tags: notif.tags || [],
                    timestamp: notif.createdAt,
                    isRead: notif.status === "read",
                    image: notif.image || null,
                    targetId: notif.targetId || notif.userId,
                    targetType: notif.targetType || "PROFILE",
                }))
                : [];
            formattedNotifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            setNotifications(formattedNotifications);
            setUnreadCount(formattedNotifications.filter(n => !n.isRead).length);
        } catch (error) {
            console.error("Lỗi khi lấy thông báo:", error);
            toast.error(error.message || "Không thể lấy thông báo!");
        } finally {
            setLoading(false);
        }
    };

    const markAllAsRead = async () => {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        if (!token) return;

        try {
            await fetch(`${process.env.REACT_APP_API_URL}/notifications/mark-all-read`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            // Cập nhật UI
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
            setUnreadCount(0);
            window.dispatchEvent(
                new CustomEvent("updateUnreadNotificationCount", {
                    detail: { unreadCount: 0 },
                })
            );
        } catch (err) {
            console.error("Lỗi khi markAllAsRead:", err);
        }
    };

    useEffect(() => {
        if (!user) return;
        fetchNotifications().then(() => {
            // Gửi sự kiện để reset badge về 0 khi mở trang
            window.dispatchEvent(
                new CustomEvent("updateUnreadNotificationCount", {
                    detail: { unreadCount: 0 },
                })
            );
        });
    }, [user]);

    useEffect(() => {
        if (!user) return;
        fetchNotifications();
    }, [user]);

    useEffect(() => {
        if (!user || !subscribe || !unsubscribe) return;

        const subscription = subscribe(
            `/topic/notifications/${user.id}`,
            (notification) => {
                console.log("Received notification:", notification);
                const newNotification = {
                    id: notification.id,
                    type: notification.type,
                    userId: user.id,
                    displayName:
                        notification.targetType === "GROUP"
                            ? notification.displayName || "Nhóm"
                            : notification.adminDisplayName || notification.displayName || "Người dùng",
                    username: notification.username || notification.adminDisplayName || "unknown",
                    message: notification.message,
                    tags: notification.tags || [],
                    timestamp: notification.createdAt * 1000,
                    isRead: notification.status === "read",
                    image: notification.image || null,
                    targetId: notification.targetId || user.id,
                    targetType: notification.targetType || "PROFILE",
                };

                toast.info(notification.message, {
                    onClick: () => {
                        if (notification.type === "REPORT_STATUS_UPDATED" || notification.type === "REPORT_ABUSE_WARNING") {
                            navigate(`/profile/${notification.adminDisplayName || notification.username}`);
                        } else if (notification.targetType === "GROUP") {
                            navigate(`/community/${notification.targetId}`);
                        }
                    },
                });

                setNotifications((prev) => {
                    const filteredNotifications = prev.filter((n) => n.id !== newNotification.id);
                    const newList = [newNotification, ...filteredNotifications];
                    newList.sort((a, b) => b.timestamp - a.timestamp);
                    setUnreadCount(newList.filter((n) => !n.isRead).length);
                    return newList;
                });
            },
            `notifications-${user.id}`
        );

        return () => {
            if (subscription) unsubscribe(`notifications-${user.id}`);
        };
    }, [user, subscribe, unsubscribe, navigate]);

    const handleMarkRead = async (id, username = null) => {
        const token =
            sessionStorage.getItem("token") || localStorage.getItem("token");
        if (!token) {
            toast.error("Không tìm thấy token!");
            return;
        }

        try {
            const response = await fetch(
                `${process.env.REACT_APP_API_URL}/notifications/${id}/mark-read`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || "Không thể đánh dấu đã đọc!");
            }

            setNotifications((prev) =>
                prev.map((notif) =>
                    notif.id === id ? { ...notif, isRead: true } : notif
                )
            );

            if (username && username !== "unknown") {
                navigate(`/profile/${username}`);
            }
        } catch (error) {
            console.error("Lỗi khi đánh dấu đã đọc:", error);
            toast.error(error.message || "Không thể đánh dấu đã đọc!");
        }
    };

    const handleMarkUnread = async (id) => {
        const token =
            sessionStorage.getItem("token") || localStorage.getItem("token");
        if (!token) {
            toast.error("Không tìm thấy token!");
            return;
        }

        try {
            const response = await fetch(
                `${process.env.REACT_APP_API_URL}/notifications/${id}/mark-unread`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || "Không thể đánh dấu chưa đọc!");
            }

            setNotifications((prev) =>
                prev.map((notif) =>
                    notif.id === id ? { ...notif, isRead: false } : notif
                )
            );

            toast.success("Đã đánh dấu chưa đọc!");

            window.dispatchEvent(
                new CustomEvent("updateUnreadNotificationCount", {
                    detail: { unreadCount: unreadCount + 1 }, // cập nhật mới
                })
            );

        } catch (error) {
            console.error("Lỗi khi đánh dấu chưa đọc:", error);
            toast.error(error.message || "Không thể đánh dấu chưa đọc!");
        }
    };

    const renderNotificationContent = () => {
        if (loading) {
            return (
                <div className="flex justify-center items-center py-10">
                    <div className="w-6 h-6 border-4 border-gray-300 border-t-gray-900 rounded-full animate-spin"></div>
                </div>
            );
        }

        return notifications.length === 0 ? (
            <p className="text-gray-500 text-center p-4">Không có thông báo nào.</p>
        ) : (
            notifications.map((notification) => (
                <NotificationItem
                    key={notification.id}
                    notification={notification}
                    handleMarkRead={handleMarkRead}
                    handleMarkUnread={handleMarkUnread}
                />
            ))
        );
    };

    return (
        <>
            <ToastContainer />
            <div className="flex min-h-screen bg-[var(--background-color)]">
                <div className="flex flex-col flex-grow border-x border-gray-300 bg-[var(--content-bg)]">
                    <div className="sticky top-0 bg-[var(--content-bg)] border-b border-gray-300 py-2 z-50">
                        <div className="px-4 flex justify-between items-center">
                            <h5 className="font-bold m-0 text-[var(--text-color)]">Thông báo</h5>
                            <button
                                className="text-[var(--text-color)] hover:text-[var(--primary-color)] p-1"
                                title="Cài đặt"
                            >
                                <FaCog />
                            </button>
                        </div>
                    </div>

                    <div className="flex-grow overflow-auto">
                        {renderNotificationContent()}
                    </div>
                </div>

                <div className="hidden lg:block border-l border-gray-300 w-[350px]">
                    <SidebarRight />
                </div>
            </div>
        </>
    );
}

export default NotificationPage;