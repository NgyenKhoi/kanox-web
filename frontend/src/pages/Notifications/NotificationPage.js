import React, { useState, useEffect, useContext } from "react";
import { Container, Row, Col, Button, Image, Spinner } from "react-bootstrap";
import { FaCog, FaEllipsisH, FaCheckCircle, FaCircle } from "react-icons/fa";
import SidebarLeft from "../../components/layout/SidebarLeft/SidebarLeft";
import SidebarRight from "../../components/layout/SidebarRight/SidebarRight";
import { AuthContext } from "../../context/AuthContext";
import { useWebSocket } from "../../hooks/useWebSocket";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import useUserMedia from "../../hooks/useUserMedia";
import NotificationItem from "../../components/notification/NotificationItem"; // hoặc đúng path

function NotificationPage({ onToggleDarkMode, isDarkMode, onShowCreatePost }) {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

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
          `${process.env.REACT_APP_API_URL}/notifications?page=0&size=10`,
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
        console.log("Danh sách thông báo:", data);
        const formattedNotifications = Array.isArray(data.data?.content)
          ? data.data.content.map((notif) => ({
              id: notif.id,
              type: notif.type,
              userId: notif.userId || null, // Lấy userId từ API
              user: notif.displayName || notif.user || "Người dùng",
              username: notif.username || "unknown",
              content: notif.message,
              tags: notif.tags || [],
              timestamp: notif.createdAt,
              isRead: notif.status === "read",
              image: notif.image || null,
            }))
          : [];

        setNotifications(formattedNotifications);
      } catch (error) {
        console.error("Lỗi khi lấy thông báo:", error);
        toast.error(error.message || "Không thể lấy thông báo!");
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [user]);

  useWebSocket(
    (notification) => {
      console.log("Thông báo mới:", notification);
      const formattedNotification = {
        id: notification.id,
        type: notification.type,
        userId: notification.userId || null, // Lấy userId từ WebSocket
        user: notification.displayName || notification.user || "Người dùng",
        username: notification.username || "unknown",
        content: notification.message,
        tags: notification.tags || [],
        timestamp: notification.createdAt || new Date().toISOString(),
        isRead: notification.status === "read",
        isNew: true,
        image: notification.image || null,
      };

      setNotifications((prev) => [formattedNotification, ...prev]);
      toast.info(notification.message);
    },
    (count) => setNotifications((prev) => prev.map((n) => ({ ...n })))
  );

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

      setNotifications((prev) => {
        const updated = prev.map((notif) =>
          notif.id === id ? { ...notif, isRead: true } : notif
        );
        const unreadCount = updated.filter((notif) => !notif.isRead).length;
        window.dispatchEvent(
          new CustomEvent("updateUnreadCount", { detail: unreadCount })
        );
        return updated;
      });

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

      setNotifications((prev) => {
        const updated = prev.map((notif) =>
          notif.id === id ? { ...notif, isRead: false } : notif
        );
        const unreadCount = updated.filter((notif) => !notif.isRead).length;
        window.dispatchEvent(
          new CustomEvent("updateUnreadCount", { detail: unreadCount })
        );
        return updated;
      });

      toast.success("Đã đánh dấu chưa đọc!");
    } catch (error) {
      console.error("Lỗi khi đánh dấu chưa đọc:", error);
      toast.error(error.message || "Không thể đánh dấu chưa đọc!");
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <Spinner animation="border" role="status" />
      </div>
    );
  }

  const renderNotificationContent = () => {
    return (
      <div>
        {notifications.length === 0 ? (
          <p className="text-muted text-center p-4">Không có thông báo nào.</p>
        ) : (
          notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              handleMarkRead={handleMarkRead}
              handleMarkUnread={handleMarkUnread}
            />
          ))
        )}
      </div>
    );
  };

  return (
    <>
      <ToastContainer />
      <div className="d-flex min-vh-100 bg-light">
        <div className="d-none d-lg-block">
          <SidebarLeft
            onToggleDarkMode={onToggleDarkMode}
            isDarkMode={isDarkMode}
            onShowCreatePost={onShowCreatePost}
          />
        </div>

        <div className="d-flex flex-column flex-grow-1 border-start border-end bg-white">
          <div
            className="sticky-top bg-white border-bottom py-2"
            style={{ zIndex: 1020 }}
          >
            <Container fluid>
              <Row className="align-items-center">
                <Col xs={6} className="text-start">
                  <h5 className="fw-bold mb-0">Thông báo</h5>
                </Col>
                <Col xs={6} className="text-end">
                  <Button variant="link" className="text-dark p-0">
                    <FaCog />
                  </Button>
                </Col>
              </Row>
            </Container>
          </div>

          <div className="flex-grow-1 overflow-auto">
            {renderNotificationContent()}
          </div>
        </div>

        <div
          className="d-none d-lg-block border-start"
          style={{ width: "350px" }}
        >
          <SidebarRight />
        </div>
      </div>
    </>
  );
}

export default NotificationPage;
