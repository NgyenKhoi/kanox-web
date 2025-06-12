import React, { useState, useEffect, useContext } from "react";
import { Container, Row, Col, Nav, Button, Image, Spinner } from "react-bootstrap";
import { FaCog, FaEllipsisH, FaCheckCircle, FaCircle } from "react-icons/fa";
import SidebarLeft from "../../components/layout/SidebarLeft/SidebarLeft";
import SidebarRight from "../../components/layout/SidebarRight/SidebarRight";
import { AuthContext } from "../../context/AuthContext";
import { useWebSocket } from "../../hooks/useWebSocket";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function NotificationPage() {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("all");
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      setLoading(true);
      const token = sessionStorage.getItem("token") || localStorage.getItem("token");
      if (!token) {
        toast.error("Không tìm thấy token. Vui lòng đăng nhập lại.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/notifications`, {
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
          throw new Error(data.message || "Không thể lấy thông báo.");
        }

        setNotifications(Array.isArray(data.data) ? data.data : []);
      } catch (error) {
        console.error("Lỗi khi lấy thông báo:", error);
        toast.error(error.message || "Không thể lấy thông báo!");
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [user]);

  useWebSocket((notification) => {
    setNotifications((prev) => [
      { ...notification, isNew: true }, // Đồng bộ cấu trúc với API
      ...prev,
    ]);
    toast.info("Bạn có thông báo mới!");
  }, (count) => setNotifications((prev) => prev.map((n) => ({ ...n }))));

  const handleMarkRead = async (id) => {
    const token = sessionStorage.getItem("token") || localStorage.getItem("token");
    if (!token) {
      toast.error("Không tìm thấy token!");
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/notifications/${id}/mark-read`, {
        method: "PUT",
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
        throw new Error(data.message || "Không thể đánh dấu đã đọc!");
      }

      setNotifications((prev) =>
          prev.map((notif) =>
              notif.id === id ? { ...notif, isRead: true } : notif
          )
      );
      toast.success("Đã đánh dấu đã đọc!");
    } catch (error) {
      console.error("Lỗi khi đánh dấu đã đọc:", error);
      toast.error(error.message || "Không thể đánh dấu đã đọc!");
    }
  };

  const handleMarkUnread = async (id) => {
    const token = sessionStorage.getItem("token") || localStorage.getItem("token");
    if (!token) {
      toast.error("Không tìm thấy token!");
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/notifications/${id}/mark-unread`, {
        method: "PUT",
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
        throw new Error(data.message || "Không thể đánh dấu chưa đọc!");
      }

      setNotifications((prev) =>
          prev.map((notif) =>
              notif.id === id ? { ...notif, isRead: false } : notif
          )
      );
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
    let filteredNotifications = notifications;
    if (activeTab === "read") {
      filteredNotifications = notifications.filter((notif) => notif.isRead);
    } else if (activeTab === "unread") {
      filteredNotifications = notifications.filter((notif) => !notif.isRead);
    }

    return (
        <div>
          {filteredNotifications.length === 0 ? (
              <p className="text-muted text-center p-4">Không có thông báo nào.</p>
          ) : (
              filteredNotifications.map((notification) => (
                  <div
                      key={notification.id}
                      className={`p-3 border-bottom ${!notification.isRead ? "bg-light-primary" : ""}`}
                  >
                    {notification.type === "mention" && (
                        <div className="d-flex align-items-start">
                          <Image
                              src={notification.avatar || "https://via.placeholder.com/40"}
                              roundedCircle
                              className="me-2"
                              style={{ width: "40px", height: "40px" }}
                          />
                          <div className="flex-grow-1">
                            <div className="d-flex justify-content-between align-items-center">
                              <p className="fw-bold mb-0">{notification.user}</p>
                              <div>
                                {!notification.isRead ? (
                                    <Button
                                        variant="link"
                                        className="text-dark p-0 me-2"
                                        onClick={() => handleMarkRead(notification.id)}
                                    >
                                      <FaCheckCircle />
                                    </Button>
                                ) : (
                                    <Button
                                        variant="link"
                                        className="text-dark p-0 me-2"
                                        onClick={() => handleMarkUnread(notification.id)}
                                    >
                                      <FaCircle />
                                    </Button>
                                )}
                                <Button variant="link" className="text-dark p-0">
                                  <FaEllipsisH />
                                </Button>
                              </div>
                            </div>
                            <p className="mb-1">{notification.content}</p>
                            {notification.tags && (
                                <p className="text-primary small mb-1">
                                  {notification.tags.map((tag, index) => (
                                      <span key={index} className="me-1">{tag}</span>
                                  ))}
                                </p>
                            )}
                            {notification.image && notification.image.startsWith("http") && (
                                <Image
                                    src={notification.image}
                                    fluid
                                    className="mt-2"
                                    style={{ maxWidth: "100%", height: "auto" }}
                                />
                            )}
                            {notification.image && notification.image.startsWith("This image is generated by AI") && (
                                <p className="text-muted small mt-2">{notification.image}</p>
                            )}
                            <p className="text-muted small">{notification.timestamp}</p>
                          </div>
                        </div>
                    )}
                    {notification.type === "community" && (
                        <div className="d-flex align-items-start">
                          <i className="bi bi-people-fill text-muted me-2" style={{ fontSize: "24px" }}></i>
                          <div className="flex-grow-1">
                            <div className="d-flex justify-content-between align-items-center">
                              <p className="fw-bold mb-1">{notification.content.split(". ")[0]}</p>
                              <div>
                                {!notification.isRead ? (
                                    <Button
                                        variant="link"
                                        className="text-dark p-0 me-2"
                                        onClick={() => handleMarkRead(notification.id)}
                                    >
                                      <FaCheckCircle />
                                    </Button>
                                ) : (
                                    <Button
                                        variant="link"
                                        className="text-dark p-0 me-2"
                                        onClick={() => handleMarkUnread(notification.id)}
                                    >
                                      <FaCircle />
                                    </Button>
                                )}
                                <Button variant="link" className="text-dark p-0">
                                  <FaEllipsisH />
                                </Button>
                              </div>
                            </div>
                            <p className="mb-0">{notification.content.split(". ")[1]}</p>
                            {notification.image && <p className="text-muted small mt-2">{notification.image}</p>}
                            <p className="text-muted small">{notification.timestamp}</p>
                          </div>
                        </div>
                    )}
                  </div>
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
            <SidebarLeft />
          </div>

          <div className="d-flex flex-column flex-grow-1 border-start border-end bg-white">
            <div className="sticky-top bg-white border-bottom py-2" style={{ zIndex: 1020 }}>
              <Container fluid>
                <Row className="align-items-center">
                  <Col xs={6} className="text-start">
                    <h5 className="fw-bold mb-0">Thông báo</h5>
                  </Col>
                  <Col xs={6} className="text-end">
                    <Button variant="link" className="text-dark p-0"><FaCog /></Button>
                  </Col>
                </Row>
                <Nav variant="underline" className="mt-2 nav-justified notification-tabs">
                  <Nav.Item>
                    <Nav.Link
                        onClick={() => setActiveTab("all")}
                        className={`text-dark fw-bold ${activeTab === "all" ? "active" : ""}`}
                    >
                      Tất cả
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link
                        onClick={() => setActiveTab("read")}
                        className={`text-dark fw-bold ${activeTab === "read" ? "active" : ""}`}
                    >
                      Đã đọc
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link
                        onClick={() => setActiveTab("unread")}
                        className={`text-dark fw-bold ${activeTab === "unread" ? "active" : ""}`}
                    >
                      Chưa đọc
                    </Nav.Link>
                  </Nav.Item>
                </Nav>
              </Container>
            </div>

            <div className="flex-grow-1 overflow-auto">{renderNotificationContent()}</div>
          </div>

          <div className="d-none d-lg-block border-start" style={{ width: "350px" }}>
            <SidebarRight />
          </div>
        </div>
      </>
  );
}

export default NotificationPage;