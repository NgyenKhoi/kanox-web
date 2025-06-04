import React, { useState, useEffect, useContext } from "react";
import { Container, Row, Col, Image, Button, Nav, Spinner } from "react-bootstrap";
import { FaArrowLeft, FaCalendarAlt, FaCheckCircle, FaMapMarkerAlt, FaLink, FaEllipsisH } from "react-icons/fa";
import { Link, useParams, useNavigate } from "react-router-dom";
import TweetCard from "../../components/posts/TweetCard/TweetCard";
import EditProfileModal from "../../components/profile/EditProfileModal";
import SidebarLeft from "../../components/layout/SidebarLeft/SidebarLeft";
import SidebarRight from "../../components/layout/SidebarRight/SidebarRight";
import { AuthContext } from "../../context/AuthContext"; // Đảm bảo đường dẫn đúng

function ProfilePage() {
  const { user, setUser } = useContext(AuthContext);
  const { username } = useParams();
  const navigate = useNavigate();

  const [userProfile, setUserProfile] = useState(null);
  const [activeTab, setActiveTab] = useState("posts");
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPremiumAlert, setShowPremiumAlert] = useState(true);

  // Dữ liệu mặc định nếu không có user
  const defaultUserProfile = {
    name: "User Testing",
    username: "testuser",
    displayName: "Người dùng Test",
    bio: "Đây là một tài khoản ảo để kiểm tra giao diện người dùng. Rất vui được kết nối!",
    location: "Viet Nam",
    website: "https://example.com",
    dateOfBirth: "2000-01-01T00:00:00Z",
    followeeCount: 123,
    followerCount: 456,
    postCount: 789,
    banner: "https://source.unsplash.com/1200x400/?abstract,tech",
    avatar: "https://source.unsplash.com/150x150/?person,face",
    isPremium: false,
    gender: 0,
  };

  // Dữ liệu mẫu cho các tab
  const sampleData = {
    posts: [
      { id: 1, user: { name: userProfile?.displayName || "Người dùng Test", username: userProfile?.username || "testuser", avatar: userProfile?.avatar }, content: "Xin chào từ tài khoản ảo! #TestAccount", imageUrl: null, timestamp: new Date("2025-05-28T00:00:00Z"), comments: 0, retweets: 0, likes: 0 },
      { id: 2, user: { name: userProfile?.displayName || "Người dùng Test", username: userProfile?.username || "testuser", avatar: userProfile?.avatar }, content: "Đang thử nghiệm giao diện Profile Page. Trông khá ổn!", imageUrl: "https://via.placeholder.com/600x400/000000/ffffff?text=Mock+Image", timestamp: new Date("2025-05-29T10:00:00Z"), comments: 2, retweets: 1, likes: 5 },
      { id: 3, user: { name: userProfile?.displayName || "Người dùng Test", username: userProfile?.username || "testuser", avatar: userProfile?.avatar }, content: "React là một thư viện tuyệt vời để xây dựng UI.", imageUrl: null, timestamp: new Date("2025-05-30T14:30:00Z"), comments: 1, retweets: 0, likes: 3 },
    ],
    replies: [
      { id: 101, user: { name: "Phản hồi Người dùng", username: "replyuser", avatar: "https://via.placeholder.com/50" }, content: "Đây là một phản hồi đến bài đăng của @testuser. #ReactJS", imageUrl: null, timestamp: new Date("2025-05-31T08:00:00Z"), comments: 0, retweets: 0, likes: 1, inReplyTo: userProfile?.username || "testuser" },
      { id: 102, user: { name: userProfile?.displayName || "Người dùng Test", username: userProfile?.username || "testuser", avatar: userProfile?.avatar }, content: "Đúng vậy! Rất thích làm việc với React. #WebDev", imageUrl: null, timestamp: new Date("2025-06-01T11:20:00Z"), comments: 0, retweets: 0, likes: 2, inReplyTo: "replyuser" },
    ],
    media: [
      { id: 201, user: { name: userProfile?.displayName || "Người dùng Test", username: userProfile?.username || "testuser", avatar: userProfile?.avatar }, content: "Cảnh hoàng hôn tuyệt đẹp hôm nay! #Photography", imageUrl: "https://source.unsplash.com/600x400/?sunset", timestamp: new Date("2025-05-27T18:00:00Z"), comments: 3, retweets: 2, likes: 10 },
      { id: 202, user: { name: userProfile?.displayName || "Người dùng Test", username: userProfile?.username || "testuser", avatar: userProfile?.avatar }, content: "Thử nghiệm với một số hiệu ứng ảnh mới. #Art", imageUrl: "https://source.unsplash.com/600x400/?abstract", timestamp: new Date("2025-05-25T11:00:00Z"), comments: 1, retweets: 0, likes: 7 },
    ],
    likes: [
      { id: 301, user: { name: "Người dùng Khác 1", username: "otheruser1", avatar: "https://via.placeholder.com/50" }, content: "Bài đăng rất hay! Rất đồng ý. #GoodVibes", imageUrl: null, timestamp: new Date("2025-05-29T09:00:00Z"), comments: 0, retweets: 0, likes: 0 },
      { id: 302, user: { name: "Người dùng Khác 2", username: "otheruser2", avatar: "https://via.placeholder.com/50" }, content: "Hình ảnh này đẹp quá! Tuyệt vời. #Nature", imageUrl: "https://source.unsplash.com/600x400/?mountain", timestamp: new Date("2025-05-28T16:00:00Z"), comments: 1, retweets: 0, likes: 0 },
    ],
    highlights: [
      { id: 401, user: { name: userProfile?.displayName || "Người dùng Test", username: userProfile?.username || "testuser", avatar: userProfile?.avatar }, content: "Đạt được 500 người theo dõi! Cảm ơn tất cả mọi người! 🎉", imageUrl: null, timestamp: new Date("2025-05-20T10:00:00Z"), comments: 15, retweets: 5, likes: 100, isHighlight: true },
      { id: 402, user: { name: userProfile?.displayName || "Người dùng Test", username: userProfile?.username || "testuser", avatar: userProfile?.avatar }, content: "Hoàn thành dự án React đầu tiên! Cảm thấy rất tuyệt vời. 💪", imageUrl: "https://source.unsplash.com/600x400/?coding,success", timestamp: new Date("2025-04-15T14:00:00Z"), comments: 8, retweets: 3, likes: 50, isHighlight: true },
    ],
    articles: [
      { id: 501, user: { name: userProfile?.displayName || "Người dùng Test", username: userProfile?.username || "testuser", avatar: userProfile?.avatar }, title: "Cách xây dựng ứng dụng React cơ bản", content: "Trong bài viết này, tôi sẽ hướng dẫn các bạn từng bước xây dựng một ứng dụng React đơn giản từ đầu...", imageUrl: "https://source.unsplash.com/600x400/?reactjs,programming", timestamp: new Date("2025-05-10T09:00:00Z"), readTime: "5 phút đọc" },
      { id: 502, user: { name: userProfile?.displayName || "Người dùng Test", username: userProfile?.username || "testuser", avatar: userProfile?.avatar }, title: "10 mẹo để tối ưu hóa hiệu suất website", content: "Tối ưu hóa hiệu suất website là rất quan trọng để cải thiện trải nghiệm người dùng...", imageUrl: "https://source.unsplash.com/600x400/?website,performance", timestamp: new Date("2025-04-25T00:00:00Z"), readTime: "8 phút đọc" },
    ],
  };

  // Fetch hồ sơ người dùng
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);

      if (!user) {
        setUserProfile(defaultUserProfile);
        setLoading(false);
        return;
      }

      if (username && user.username !== username) {
        navigate(`/profile/${user.username}`);
        return;
      }

      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${process.env.REACT_APP_API_URL}/user/profile/${user.username}`, {
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          setUserProfile(defaultUserProfile);
          setLoading(false);
          return;
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
        console.error("Error fetching profile:", error);
        setUserProfile(defaultUserProfile);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, username, navigate]);

  // Xử lý chỉnh sửa hồ sơ
  const handleEditProfile = async (updatedData) => {
    if (!user) {
      console.error("No user! Cannot update profile.");
      return;
    }

    const token = localStorage.getItem("token");
    const updatedProfile = { ...userProfile, ...updatedData };

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/user/profile/${user.username}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(updatedProfile),
      });

      if (response.ok) {
        setUserProfile(updatedProfile);
        setUser(updatedProfile); // Đồng bộ với AuthContext
      }
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  // Xử lý tab content
  const renderTabContent = () => {
    const data = sampleData[activeTab] || [];
    if (activeTab === "articles") {
      return data.length > 0 ? (
          data.map((article) => (
              <div key={article.id} className="border-bottom p-3">
                <div className="d-flex align-items-center mb-2">
                  <Image src={article.user.avatar} roundedCircle width={30} height={30} className="me-2" />
                  <div>
                    <span className="fw-bold text-dark">{article.user.name}</span>
                    <span className="text-secondary small d-none d-sm-inline"> @{article.user.username}</span>
                  </div>
                </div>
                <h5 className="fw-bold mb-1 text-dark">{article.title}</h5>
                {article.imageUrl && <Image src={article.imageUrl} fluid className="rounded mb-3" style={{ maxHeight: "500px", objectFit: "cover" }} />}
                <p className="text-dark small">{article.content.substring(0, 150)}...</p>
                <div className="d-flex justify-content-between text-secondary small">
                  <span>{new Date(article.timestamp).toLocaleDateString("en-US")}</span>
                  <span>{article.readTime}</span>
                </div>
              </div>
          ))
      ) : (
          <p className="text-dark text-center p-4">Không có bài viết nào.</p>
      );
    }

    return data.length > 0 ? (
        data.map((item) => <TweetCard key={item.id} tweet={item} />)
    ) : (
        <p className="text-dark text-center p-4">
          {activeTab === "posts" && "Không có bài đăng nào."}
          {activeTab === "replies" && "Không có phản hồi nào."}
          {activeTab === "media" && "Không có phương tiện nào."}
          {activeTab === "likes" && "Không có lượt thích nào."}
          {activeTab === "highlights" && "Không có sự kiện nổi bật nào."}
        </p>
    );
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
      <Container fluid className="min-vh-100 p-0">
        {/* Header cố định */}
        <div className="sticky-top bg-white border-bottom py-2" style={{ zIndex: 1020 }}>
          <Container fluid>
            <Row>
              <Col xs={12} lg={12} className="mx-auto d-flex align-items-center ps-md-5">
                <Link to="/" className="btn btn-light me-3">
                  <FaArrowLeft size={20} />
                </Link>
                <div>
                  <h5 className="mb-0 fw-bold text-dark">{userProfile.name}</h5>
                  <span className="text-dark small">{userProfile.postCount || 0} bài đăng</span>
                </div>
              </Col>
            </Row>
          </Container>
        </div>

        {/* Nội dung chính */}
        <Container fluid className="flex-grow-1">
          <Row className="h-100">
            {/* SidebarLeft */}
            <Col xs={0} lg={3} className="d-none d-lg-block p-0">
              <SidebarLeft />
            </Col>

            {/* Profile Content */}
            <Col xs={12} lg={6} className="px-md-0 border-start border-end border-dark">
              <Image
                  src={userProfile.banner || "https://via.placeholder.com/1200x400?text=Banner"}
                  fluid
                  className="w-100 border-bottom"
                  style={{ height: "200px", objectFit: "cover" }}
              />
              <div className="position-relative p-3">
                <div className="d-flex justify-content-between align-items-end mb-3">
                  <Image
                      src={userProfile.avatar || "https://via.placeholder.com/150?text=Avatar"}
                      roundedCircle
                      className="border border-white border-4"
                      style={{ width: "130px", height: "130px", objectFit: "cover", marginTop: "-75px", zIndex: 2 }}
                  />
                  <Button
                      variant="primary"
                      className="rounded-pill fw-bold px-3 py-2"
                      onClick={() => setShowEditModal(true)}
                  >
                    Chỉnh sửa
                  </Button>
                </div>

                <h4 className="mb-0 fw-bold text-dark">{userProfile.displayName}</h4>
                <p className="text-dark small mb-2">@{userProfile.username}</p>
                {userProfile.bio && <p className="mb-2 text-dark">{userProfile.bio}</p>}
                {userProfile.location && (
                    <p className="text-secondary small d-flex align-items-center mb-2">
                      <FaMapMarkerAlt size={16} className="me-2" /> {userProfile.location}
                    </p>
                )}
                {userProfile.website && (
                    <p className="text-secondary small d-flex align-items-center mb-2">
                      <FaLink size={16} className="me-2" />
                      <a href={userProfile.website} target="_blank" rel="noopener noreferrer" className="text-primary">
                        {userProfile.website}
                      </a>
                    </p>
                )}
                <p className="text-secondary small d-flex align-items-center mb-2">
                  <FaCalendarAlt size={16} className="me-2" /> Ngày sinh:{" "}
                  {userProfile.dateOfBirth ? new Date(userProfile.dateOfBirth).toLocaleDateString("vi-VN") : "Chưa cập nhật"}
                </p>
                {userProfile.gender !== undefined && (
                    <p className="text-secondary small d-flex align-items-center mb-2">
                      <FaEllipsisH size={16} className="me-2" />
                      Giới tính: {userProfile.gender === 0 ? "Nam" : userProfile.gender === 1 ? "Nữ" : "Khác"}
                    </p>
                )}
                <div className="d-flex mb-3">
                  <Link to="#" className="me-3 text-dark text-decoration-none">
                    <span className="fw-bold">{userProfile.followeeCount || 0}</span>{" "}
                    <span className="text-secondary small">Đang theo dõi</span>
                  </Link>
                  <Link to="#" className="text-dark text-decoration-none">
                    <span className="fw-bold">{userProfile.followerCount || 0}</span>{" "}
                    <span className="text-secondary small">Người theo dõi</span>
                  </Link>
                </div>

                {/* Premium Alert */}
                {showPremiumAlert && !userProfile.isPremium && (
                    <div className="alert alert-light d-flex align-items-start border border-light rounded-3 p-3">
                      <div>
                        <h6 className="fw-bold text-dark mb-1">
                          Bạn chưa đăng ký tài khoản Premium <FaCheckCircle className="text-dark" />
                        </h6>
                        <p className="text-secondary small mb-2">
                          Hãy đăng ký tài khoản Premium để sử dụng các tính năng ưu tiên trả lời, phân tích, duyệt xem không quảng cáo, v.v.
                        </p>
                        <Button
                            variant="dark"
                            className="rounded-pill px-4 py-2 fw-bold"
                            onClick={() => navigate("/premium")}
                        >
                          Premium
                        </Button>
                      </div>
                      <Button variant="link" className="ms-auto text-dark p-0" onClick={() => setShowPremiumAlert(false)}>
                        ×
                      </Button>
                    </div>
                )}

                {/* Tabs */}
                <Nav variant="tabs" className="mt-4 profile-tabs nav-justified">
                  {["posts", "replies", "media", "likes", "highlights", "articles"].map((tab) => (
                      <Nav.Item key={tab}>
                        <Nav.Link
                            onClick={() => setActiveTab(tab)}
                            className={`text-dark fw-bold ${activeTab === tab ? "active" : ""}`}
                        >
                          {tab === "posts" && "Bài đăng"}
                          {tab === "replies" && "Các phản hồi"}
                          {tab === "media" && "Phương tiện"}
                          {tab === "likes" && "Lượt thích"}
                          {tab === "highlights" && "Sự kiện nổi bật"}
                          {tab === "articles" && "Bài viết"}
                        </Nav.Link>
                      </Nav.Item>
                  ))}
                </Nav>

                {/* Tab Content */}
                <div className="mt-0 border-top">{renderTabContent()}</div>
              </div>
            </Col>

            {/* SidebarRight */}
            <Col xs={0} lg={3} className="d-none d-lg-block border-start p-0">
              <SidebarRight />
            </Col>
          </Row>
        </Container>

        {/* Edit Profile Modal */}
        <EditProfileModal
            show={showEditModal}
            handleClose={() => setShowEditModal(false)}
            userProfile={userProfile}
            onSave={handleEditProfile}
            username={username}
        />
      </Container>
  );
}

export default ProfilePage;