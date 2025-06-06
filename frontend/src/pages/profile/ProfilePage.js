import React, { useState, useEffect, useContext } from "react";
import { Container, Row, Col, Image, Button, Nav, Spinner } from "react-bootstrap";
import {
  FaArrowLeft,
  FaCalendarAlt,
  FaCheckCircle,
  FaMapMarkerAlt,
  FaLink,
  FaEllipsisH,
} from "react-icons/fa";
import { Link, useParams, useNavigate } from "react-router-dom";
import TweetCard from "../../components/posts/TweetCard/TweetCard";
import EditProfileModal from "../../components/profile/EditProfileModal";
import SidebarLeft from "../../components/layout/SidebarLeft/SidebarLeft";
import SidebarRight from "../../components/layout/SidebarRight/SidebarRight";
import { AuthContext } from "../../context/AuthContext";

function ProfilePage() {
  const [showEditModal, setShowEditModal] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("posts");
  const [showPremiumAlert, setShowPremiumAlert] = useState(true);

  const defaultUserProfile = {
    name: "User Testing",
    username: "testuser",
    displayName: "Người dùng Test",
    bio: "Đây là một tài khoản ảo được tạo để kiểm tra giao diện người dùng. Rất vui được kết nối!",
    location: "Viet Nam",
    website: "https://example.com",
    dateOfBirth: "2000-01-01T00:00:00Z",
    followeeCount: 123,
    followerCount: 456,
    postCount: 789,
    banner: "https://source.unsplash.com/1200x400/?abstract,tech",
    avatar: "https://source.unsplash.com/150x150/?person,face",
    isPremium: false,
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      setLoading(true);
      if (!user) {
        setUserProfile(defaultUserProfile);
        console.warn("Không tìm thấy user trong AuthContext. Đang sử dụng dữ liệu profile mặc định.");
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("Không tìm thấy token trong localStorage.");
        }

        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/user/profile/${user.username}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Lỗi khi tải hồ sơ (${response.status}): ${response.statusText}`);
        }

        const data = await response.json();
        setUserProfile({
          ...data,
          banner: data.banner || "https://source.unsplash.com/1200x400/?nature,water",
          avatar: data.avatar || "https://source.unsplash.com/150x150/?portrait",
          postCount: data.postCount || 0,
          website: data.website || "",
          isPremium: data.isPremium || false,
        });
      } catch (error) {
        console.error("Lỗi khi tải hồ sơ:", error.message);
        setUserProfile(defaultUserProfile);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [user, username]);

  const handleSaveProfile = async (updatedData) => {
    if (!user) {
      console.error("Không tìm thấy user! Không thể cập nhật profile.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      console.error("Không tìm thấy token, không thể cập nhật profile.");
      return;
    }

    try {
      const updatedProfile = { ...userProfile, ...updatedData };
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/user/profile/${user.username}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updatedProfile),
        }
      );

      if (!response.ok) {
        throw new Error(`Lỗi khi cập nhật hồ sơ (${response.status}): ${response.statusText}`);
      }

      const data = await response.json();
      setUserProfile(data);
      setShowEditModal(false);
    } catch (error) {
      console.error("Lỗi khi cập nhật hồ sơ:", error.message);
    }
  };

  const handleCloseEditModal = () => setShowEditModal(false);

  const renderTabContent = () => {
    switch (activeTab) {
      case "posts":
        return (
          <div>
            {/* Replace with actual post data */}
            <TweetCard />
            <TweetCard />
          </div>
        );
      case "shares":
        return <div>Chưa có nội dung chia sẻ.</div>;
      case "savedArticles":
        return <div>Chưa có bài viết đã lưu.</div>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <Spinner animation="border" role="status" />
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="text-center p-4">
        <p className="text-dark">Không thể tải thông tin hồ sơ. Vui lòng thử lại sau.</p>
      </div>
    );
  }

  return (
    <Container fluid className="p-0">
      <div className="sticky-top bg-white border-bottom py-2" style={{ zIndex: 1020 }}>
        <Container>
          <Row>
            <Col className="d-flex align-items-center">
              <Link to="/" className="btn btn-light me-3">
                <FaArrowLeft size={20} />
              </Link>
              <div>
                <h5 className="mb-0 fw-bold text-dark">{userProfile.name}</h5>
                <span className="text-muted small">{userProfile.postCount || 0} bài đăng</span>
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      <Container fluid>
        <Row>
          <Col lg={3} className="d-none d-lg-block p-0">
            <SidebarLeft />
          </Col>

          <Col xs={12} lg={6} className="px-0">
            <Image
              src={userProfile.banner}
              fluid
              className="w-100 border-bottom"
              style={{ height: "200px", objectFit: "cover" }}
            />
            <div className="p-3">
              <div className="d-flex justify-content-between align-items-end mb-3">
                <Image
                  src={userProfile.avatar}
                  roundedCircle
                  style={{ width: "120px", height: "120px", objectFit: "cover" }}
                  className="border border-white position-absolute"
                  alt="User avatar"
                />
                <Button
                  variant="outline-dark"
                  className="rounded-pill mt-5"
                  onClick={() => setShowEditModal(true)}
                >
                  Chỉnh sửa hồ sơ
                </Button>
              </div>
              <h4 className="fw-bold text-dark mt-5">{userProfile.displayName}</h4>
              <p className="text-muted small mb-2">@{userProfile.username}</p>
              {userProfile.bio && <p className="mb-2 text-dark">{userProfile.bio}</p>}
              {userProfile.location && (
                <p className="text-muted small d-flex align-items-center mb-2">
                  <FaMapMarkerAlt size={16} className="me-2" /> {userProfile.location}
                </p>
              )}
              {userProfile.website && (
                <p className="text-muted small d-flex align-items-center mb-2">
                  <FaLink size={16} className="me-2" />
                  <a
                    href={userProfile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary"
                  >
                    {userProfile.website}
                  </a>
                </p>
              )}
              <p className="text-muted small d-flex align-items-center mb-2">
                <FaCalendarAlt size={16} className="me-2" />
                Ngày sinh:{" "}
                {userProfile.dateOfBirth
                  ? new Date(userProfile.dateOfBirth).toLocaleDateString("vi-VN")
                  : "Chưa cập nhật"}
              </p>
              {userProfile.gender !== undefined && (
                <p className="text-muted small d-flex align-items-center mb-2">
                  <FaEllipsisH size={16} className="me-2" />
                  Giới tính: {userProfile.gender === 0 ? "Nam" : userProfile.gender === 1 ? "Nữ" : "Khác"}
                </p>
              )}
              <div className="d-flex mb-3">
                <Link to="#" className="me-3 text-dark text-decoration-none">
                  <span className="fw-bold">{userProfile.followeeCount || 0}</span>{" "}
                  <span className="text-muted small">Đang theo dõi</span>
                </Link>
                <Link to="#" className="text-dark text-decoration-none">
                  <span class="fw-bold">{userProfile.followerCount || 0}</span>{" "}
                  <span className="text-muted small">Người theo dõi</span>
                </Link>
              </div>

              {showPremiumAlert && !userProfile.isPremium && (
                <div className="alert alert-light border rounded-3 p-3 mt-3">
                  <div className="d-flex align-items-start">
                    <div>
                      <h6 className="fw-bold text-dark mb-1">
                        Bạn chưa đăng ký tài khoản Premium{" "}
                        <FaCheckCircle className="text-dark" />
                      </h6>
                      <p className="text-muted small mb-2">
                        Hãy đăng ký tài khoản Premium để sử dụng các tính năng ưu tiên trả lời,
                        phân tích, duyệt xem không quảng cáo, v.v.
                      </p>
                      <Button
                        variant="dark"
                        className="rounded-pill px-4 py-2 fw-bold"
                        onClick={() => navigate("/premium")}
                      >
                        Premium
                      </Button>
                    </div>
                    <Button
                      variant="link"
                      className="ms-auto text-dark p-0"
                      onClick={() => setShowPremiumAlert(false)}
                    >
                      ×
                    </Button>
                  </div>
                </div>
              )}

              <Nav variant="tabs" className="mt-4 nav-justified">
                {["posts", "shares", "savedArticles"].map((tab) => (
                  <Nav.Item key={tab}>
                    <Nav.Link
                      onClick={() => setActiveTab(tab)}
                      className={`fw-bold ${activeTab === tab ? "active" : ""}`}
                    >
                      {tab === "posts" && "Bài đăng"}
                      {tab === "shares" && "Chia sẻ"}
                      {tab === "savedArticles" && "Bài viết đã lưu"}
                    </Nav.Link>
                  </Nav.Item>
                ))}
              </Nav>

              <div className="mt-3">{renderTabContent()}</div>
            </div>
          </Col>

          <Col lg={3} className="d-none d-lg-block p-0">
            <SidebarRight />
          </Col>
        </Row>
      </Container>

      <EditProfileModal
        show={showEditModal}
        handleClose={handleCloseEditModal}
        userProfile={userProfile}
        onSave={handleSaveProfile}
        username={username}
      />
    </Container>
  );
}

export default ProfilePage;