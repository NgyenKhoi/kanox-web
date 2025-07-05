import React, { useState, useEffect, useContext } from "react";
import {
  Container,
  Row,
  Col,
  Nav,
  Button,
  Spinner,
  Alert,
} from "react-bootstrap";
import { FaArrowLeft } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import SidebarRight from "../../components/layout/SidebarRight/SidebarRight";
import FriendList from "../../components/friends/FriendList";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function FriendsPage() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [friends, setFriends] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [totalElements, setTotalElements] = useState({
    friends: 0,
    sent: 0,
    received: 0,
  });
  const [page, setPage] = useState({ friends: 0, sent: 0, received: 0 });
  const [totalPages, setTotalPages] = useState({
    friends: 1,
    sent: 1,
    received: 1,
  });
  const [activeTab, setActiveTab] = useState("friends");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [friendshipStatus, setFriendshipStatus] = useState({});

  // useWebSocket((notification) => {
  //     setNotifications((prev) => [notification, ...prev]);
  //     toast.info(notification.message || "Bạn có thông báo mới!");
  // });

  const handleToggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
    document.body.classList.toggle("dark-mode", !isDarkMode);
  };

  const handleShowCreatePost = () => {
    console.log("Mở modal tạo bài đăng");
  };

  const fetchData = async (type, pageNum) => {
    setLoading(true);
    setError(null);
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");
    // if (!token) {
    //     setError("Không tìm thấy token. Vui lòng đăng nhập lại.");
    //     setLoading(false);
    //     logout();
    //     navigate("/");
    //     return;
    // }
    if (!user?.id) {
      setError("Không tìm thấy thông tin người dùng.");
      setLoading(false);
      logout();
      navigate("/");
      return;
    }

    try {
      let url;
      if (type === "friends") {
        url = `${process.env.REACT_APP_API_URL}/friends/users/${user.id}/friends?page=${pageNum}&size=10`;
      } else if (type === "sent") {
        url = `${process.env.REACT_APP_API_URL}/friends/users/${user.id}/sent-pending?page=${pageNum}&size=10`;
      } else if (type === "received") {
        url = `${process.env.REACT_APP_API_URL}/friends/users/${user.id}/received-pending?page=${pageNum}&size=10`;
      }

      console.log(`Fetching ${type} data for user ${user.id} from: ${url}`);

      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message ||
            `Lỗi ${response.status}: Không thể lấy dữ liệu ${type}.`
        );
      }

      const data = await response.json();
      console.log(`${type} data:`, data);

      if (type === "friends") {
        setFriends(data.data?.content || []);
        setTotalElements((prev) => ({
          ...prev,
          friends: data.data?.totalElements || 0,
        }));
        setTotalPages((prev) => ({
          ...prev,
          friends: data.data?.totalPages || 1,
        }));
        // Fetch friendship status for friends
        const friendIds = (data.data?.content || []).map((f) => f.id);
        const statuses = await fetchFriendshipStatus(friendIds);
        setFriendshipStatus(statuses);
      } else if (type === "sent") {
        setSentRequests(data.data?.content || []);
        setTotalElements((prev) => ({
          ...prev,
          sent: data.data?.totalElements || 0,
        }));
        setTotalPages((prev) => ({
          ...prev,
          sent: data.data?.totalPages || 1,
        }));
      } else if (type === "received") {
        setReceivedRequests(data.data?.content || []);
        setTotalElements((prev) => ({
          ...prev,
          received: data.data?.totalElements || 0,
        }));
        setTotalPages((prev) => ({
          ...prev,
          received: data.data?.totalPages || 1,
        }));
      }
    } catch (error) {
      console.error(`Error fetching ${type} data:`, error);
      setError(error.message || `Không thể tải dữ liệu ${type}.`);
      toast.error(error.message || `Không thể tải dữ liệu ${type}.`);
    } finally {
      setLoading(false);
    }
  };

  const fetchFriendshipStatus = async (userIds) => {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token || !user?.id) return {};
    const statuses = {};
    for (const userId of userIds) {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/friends/users/${user.id}/friendship-status/${userId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        statuses[userId] = data.status;
      }
    }
    return statuses;
  };

  useEffect(() => {
    console.log("Current user:", user);
    // if (!user) {
    //     navigate("/");
    //     return;
    // }
    if (activeTab === "friends") {
      fetchData("friends", page.friends);
    } else if (activeTab === "sent") {
      fetchData("sent", page.sent);
    } else if (activeTab === "received") {
      fetchData("received", page.received);
    }
  }, [activeTab, page, navigate, user]);

  const handlePrevious = () => {
    setPage((prev) => ({
      ...prev,
      [activeTab]: Math.max(prev[activeTab] - 1, 0),
    }));
  };

  const handleNext = () => {
    setPage((prev) => ({
      ...prev,
      [activeTab]: prev[activeTab] + 1,
    }));
  };

  const refreshData = async () => {
    try {
      await fetchData(activeTab, page[activeTab]);
    } catch (error) {
      setError(error.message || "Không thể làm mới dữ liệu.");
      toast.error(error.message || "Không thể làm mới dữ liệu.");
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <Spinner animation="border" role="status" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-4">
        <p className="text-danger">{error}</p>
        <Button variant="primary" onClick={() => navigate("/home")}>
          Quay lại trang chủ
        </Button>
      </div>
    );
  }

  return (
    <Container
      fluid
      className="min-vh-100 p-0 bg-[var(--background-color)] text-[var(--text-color)]"
    >
      <div
        className="sticky-top bg-[var(--background-color)] py-2 border-bottom"
        style={{ zIndex: 1020 }}
      >
        <Container fluid>
          <Row>
            <Col
              xs={12}
              lg={12}
              className="mx-auto d-flex align-items-center ps-md-5"
            >
              <Link to="/home" className="btn btn-light me-3">
                <FaArrowLeft size={20} />
              </Link>
              <div>
                <h5 className="mb-0 fw-bold text-[var(--text-color)]">
                  Bạn bè
                </h5>
                <span className="text-[var(--text-color)] small">
                  {totalElements.friends} bạn bè
                </span>
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      <Container fluid className="flex-grow-1">
        <Row className="h-100">
          <Col xs={12} lg={8} className="px-md-0">
            <div className="p-3">
              {notifications.length > 0 && (
                <Alert
                  variant="info"
                  onClose={() => setNotifications([])}
                  dismissible
                >
                  {notifications[0].message}
                </Alert>
              )}
              <Nav variant="tabs" className="mt-4 profile-tabs nav-justified">
                <Nav.Item>
                  <Nav.Link
                    onClick={() => setActiveTab("friends")}
                    className={`text-[var(--text-color)] fw-semibold ${
                      activeTab === "friends" ? "active" : ""
                    }`}
                  >
                    Bạn bè ({totalElements.friends})
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link
                    onClick={() => setActiveTab("sent")}
                    className={`text-[var(--text-color)] fw-semibold ${
                      activeTab === "sent" ? "active" : ""
                    }`}
                  >
                    Đã gửi ({totalElements.sent})
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link
                    onClick={() => setActiveTab("received")}
                    className={`text-[var(--text-color)] fw-semibold ${
                      activeTab === "received" ? "active" : ""
                    }`}
                  >
                    Lời mời ({totalElements.received})
                  </Nav.Link>
                </Nav.Item>
              </Nav>
              <div className="mt-0 border-top">
                {activeTab === "friends" && (
                  <FriendList
                    users={friends}
                    friendshipStatus={friendshipStatus}
                  />
                )}
                {activeTab === "sent" && <FriendList users={sentRequests} />}
                {activeTab === "received" && (
                  <FriendList
                    users={receivedRequests}
                    showActions={true}
                    onAction={refreshData}
                  />
                )}
              </div>
              <div className="d-flex justify-content-between mt-3">
                <Button
                  onClick={handlePrevious}
                  disabled={page[activeTab] === 0 || loading}
                  variant="outline-primary"
                >
                  Previous
                </Button>
                <span className="align-self-center">
                  Page {page[activeTab] + 1} of {totalPages[activeTab]}
                </span>
                <Button
                  onClick={handleNext}
                  disabled={
                    page[activeTab] >= totalPages[activeTab] - 1 || loading
                  }
                  variant="outline-primary"
                >
                  Next
                </Button>
              </div>
            </div>
          </Col>
          <Col xs={0} lg={4} className="d-none d-lg-block p-0">
            <SidebarRight />
          </Col>
        </Row>
      </Container>
    </Container>
  );
}

export default FriendsPage;
