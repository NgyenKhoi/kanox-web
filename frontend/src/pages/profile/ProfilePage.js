import React, { useState, useEffect } from "react";
import { Container, Row, Col, Image, Button, Nav, Spinner } from "react-bootstrap";
import { FaArrowLeft, FaCalendarAlt, FaCheckCircle, FaMapMarkerAlt, FaLink, FaEllipsisH } from "react-icons/fa";
import { Link, useParams, useNavigate } from "react-router-dom";
import TweetCard from "../../components/posts/TweetCard/TweetCard";
import EditProfileModal from "../../components/profile/EditProfileModal";
import SidebarLeft from "../../components/layout/SidebarLeft/SidebarLeft";
import SidebarRight from "../../components/layout/SidebarRight/SidebarRight";

function ProfilePage() {
  const [showAlert, setShowAlert] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const { username } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("posts");
  const [loading, setLoading] = useState(true);

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
  const userJson = localStorage.getItem("user");
  const currentUser = userJson ? JSON.parse(userJson) : null;
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchUserProfile = async () => {
      setLoading(true);
      if (!currentUser || !token) {
        setUserProfile(defaultUserProfile);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/user/profile/${currentUser.username}`, {
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          setUserProfile(defaultUserProfile);
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
        setUserProfile(defaultUserProfile);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const sampleTweets = [
    { id: 1, user: { name: userProfile?.displayName || "Người dùng Test", username: userProfile?.username || "testuser", avatar: userProfile?.avatar || "https://via.placeholder.com/50" }, content: "Xin chào từ tài khoản ảo! #TestAccount", imageUrl: null, timestamp: new Date("2025-05-28T00:00:00Z"), comments: 0, retweets: 0, likes: 0 },
    { id: 2, user: { name: userProfile?.displayName || "Người dùng Test", username: userProfile?.username || "testuser", avatar: userProfile?.avatar || "https://via.placeholder.com/50" }, content: "Đang thử nghiệm giao diện Profile Page. Trông khá ổn!", imageUrl: "https://via.placeholder.com/600x400/000000/ffffff?text=Mock+Image", timestamp: new Date("2025-05-29T10:00:00Z"), comments: 2, retweets: 1, likes: 5 },
    { id: 3, user: { name: userProfile?.displayName || "Người dùng Test", username: userProfile?.username || "testuser", avatar: userProfile?.avatar || "https://via.placeholder.com/50" }, content: "React là một thư viện tuyệt vời để xây dựng UI.", imageUrl: null, timestamp: new Date("2025-05-30T14:30:00Z"), comments: 1, retweets: 0, likes: 3 },
  ];

  const sampleReplies = [
    { id: 101, user: { name: "Phản hồi Người dùng", username: "replyuser", avatar: "https://via.placeholder.com/50" }, content: "Đây là một phản hồi đến bài đăng của @testuser. #ReactJS", imageUrl: null, timestamp: new Date("2025-05-31T08:00:00Z"), comments: 0, retweets: 0, likes: 1, inReplyTo: userProfile?.username || "testuser" },
    { id: 102, user: { name: userProfile?.displayName || "Người dùng Test", username: userProfile?.username || "testuser", avatar: userProfile?.avatar || "https://via.placeholder.com/50" }, content: "Đúng vậy! Rất thích làm việc với React. #WebDev", imageUrl: null, timestamp: new Date("2025-06-01T11:20:00Z"), comments: 0, retweets: 0, likes: 2, inReplyTo: "replyuser" },
  ];

  const sampleMedia = [
    { id: 201, user: { name: userProfile?.displayName || "Người dùng Test", username: userProfile?.username || "testuser", avatar: userProfile?.avatar || "https://via.placeholder.com/50" }, content: "Cảnh hoàng hôn tuyệt đẹp hôm nay! #Photography", imageUrl: "https://source.unsplash.com/600x400/?sunset", timestamp: new Date("2025-05-27T18:00:00Z"), comments: 3, retweets: 2, likes: 10 },
    { id: 202, user: { name: userProfile?.displayName || "Người dùng Test", username: userProfile?.username || "testuser", avatar: userProfile?.avatar || "https://via.placeholder.com/50" }, content: "Thử nghiệm với một số hiệu ứng ảnh mới. #Art", imageUrl: "https://source.unsplash.com/600x400/?abstract", timestamp: new Date("2025-05-25T11:00:00Z"), comments: 1, retweets: 0, likes: 7 },
  ];

  const sampleLikes = [
    { id: 301, user: { name: "Người dùng Khác 1", username: "otheruser1", avatar: "https://via.placeholder.com/50" }, content: "Bài đăng rất hay! Rất đồng ý. #GoodVibes", imageUrl: null, timestamp: new Date("2025-05-29T09:00:00Z"), comments: 0, retweets: 0, likes: 0 },
    { id: 302, user: { name: "Người dùng Khác 2", username: "otheruser2", avatar: "https://via.placeholder.com/50" }, content: "Hình ảnh này đẹp quá! Tuyệt vời. #Nature", imageUrl: "https://source.unsplash.com/600x400/?mountain", timestamp: new Date("2025-05-28T16:00:00Z"), comments: 1, retweets: 0, likes: 0 },
  ];

  const sampleHighlights = [
    { id: 401, user: { name: userProfile?.displayName || "Người dùng Test", username: userProfile?.username || "testuser", avatar: userProfile?.avatar || "https://via.placeholder.com/50" }, content: "Đạt được 500 người theo dõi! Cảm ơn tất cả mọi người! 🎉", imageUrl: null, timestamp: new Date("2025-05-20T10:00:00Z"), comments: 15, retweets: 5, likes: 100, isHighlight: true },
    { id: 402, user: { name: userProfile?.displayName || "Người dùng Test", username: userProfile?.username || "testuser", avatar: userProfile?.avatar || "https://via.placeholder.com/50" }, content: "Hoàn thành dự án React đầu tiên! Cảm thấy rất tuyệt vời. 💪", imageUrl: "https://source.unsplash.com/600x400/?coding,success", timestamp: new Date("2025-04-15T14:00:00Z"), comments: 8, retweets: 3, likes: 50, isHighlight: true },
  ];

  const sampleArticles = [
    { id: 501, user: { name: userProfile?.displayName || "Người dùng Test", username: userProfile?.username || "testuser", avatar: userProfile?.avatar || "https://via.placeholder.com/50" }, title: "Cách xây dựng ứng dụng React cơ bản", content: "Trong bài viết này, tôi sẽ hướng dẫn các bạn từng bước xây dựng một ứng dụng React đơn giản từ đầu...", imageUrl: "https://source.unsplash.com/600x400/?reactjs,programming", timestamp: new Date("2025-05-10T09:00:00Z"), readTime: "5 phút đọc" },
    { id: 502, user: { name: userProfile?.displayName || "Người dùng Test", username: userProfile?.username || "testuser", avatar: userProfile?.avatar || "https://via.placeholder.com/50" }, title: "10 mẹo để tối ưu hóa hiệu suất website", content: "Tối ưu hóa hiệu suất website là rất quan trọng để cải thiện trải nghiệm người dùng...", imageUrl: "https://source.unsplash.com/600x400/?website,performance", timestamp: new Date("2025-04-25T00:00:00Z"), readTime: "8 phút đọc" },
  ];

  const handleEditClick = () => setShowEditModal(true);
  const handleCloseEditModal = () => setShowEditModal(false);

  const handleSaveProfile = async (updatedData) => {
    if (!token) {
      console.error("Token not found! Cannot update profile.");
      return;
    }
    const fullDataToSend = { ...userProfile, ...updatedData };
    await fetch(`${process.env.REACT_APP_API_URL}/user/profile/${currentUser.username}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(fullDataToSend),
    });
    setUserProfile(fullDataToSend);
  };

  const handlePremiumClick = () => navigate("/premium");

  const renderPostsContent = () => (
      <div className="mt-0 border-top">
        {sampleTweets.map((tweet) => (
            <TweetCard key={tweet.id} tweet={tweet} />
        ))}
        {sampleTweets.length === 0 && <p className="text-muted text-center mt-4 p-4">Không có bài đăng nào.</p>}
      </div>
  );

  const renderRepliesContent = () => (
      <div className="mt-0 border-top">
        {sampleReplies.map((tweet) => (
            <TweetCard key={tweet.id} tweet={tweet} />
        ))}
        {sampleReplies.length === 0 && <p className="text-muted text-center p-4 mt-2">Không có phản hồi nào.</p>}
      </div>
  );

  const renderMediaContent = () => (
      <div className="mt-0 border-top">
        {sampleMedia.map((media) => (
            <TweetCard key={media.id} tweet={media} />
        ))}
        {sampleMedia.length === 0 && <p className="text-muted text-center p-4 mt-2">Không có phương tiện nào.</p>}
      </div>
  );

  const renderLikesContent = () => (
      <div className="mt-0 border-top">
        {sampleLikes.map((tweet) => (
            <TweetCard key={tweet.id} tweet={tweet} />
        ))}
        {sampleLikes.length === 0 && <p className="text-muted text-center p-4 mt-4">Không có lượt thích nào.</p>}
      </div>
  );

  const renderHighlightsContent = () => (
      <div className="mt-0 border-top">
        {sampleHighlights.map((highlight) => (
            <TweetCard key={highlight.id} tweet={highlight} />
        ))}
        {sampleHighlights.length === 0 && <p className="text-muted text-center p-4">Không có sự kiện nổi bật nào.</p>}
      </div>
  );

  const renderArticlesContent = () => (
      <div className="mt-0 border-top">
        {sampleArticles.map((article) => (
            <div key={article.id} className="border-bottom p-3 d-flex align-items-start justify-content-between">
              <div className="d-flex align-items-center mb-3">
                <Image src={article.user.avatar} roundedCircle width={30} height={40} className="me-2" />
                <div className="d-flex flex-column">
                  <span className="fw-bold">{article.user.name}</span>
                  <span className="d-none d-sm-inline">
                <span className="text-light small">@{article.user.username}</span>
              </span>
                </div>
              </div>
              <h5 className="fw-bold mb-1">{article.title}</h5>
              {article.imageUrl && (
                  <Image src={article.imageUrl} fluid className="rounded mb-3" style={{ maxHeight: "500px", objectFit: "cover" }} />
              )}
              <p className="text-light text-muted small">{article.content.substring(0, 150)}...</p>
              <div className="d-flex justify-content-between text-muted small">
                <span>{new Date(article.timestamp).toLocaleDateString("en-US")}</span>
                <span>{article.readTime}</span>
              </div>
            </div>
        ))}
        {sampleArticles.length === 0 && <p className="text-muted text-center p-4">Không có bài viết nào.</p>}
      </div>
  );

  const renderActiveTabContent = () => {
    switch (activeTab) {
      case "posts": return renderPostsContent();
      case "replies": return renderRepliesContent();
      case "media": return renderMediaContent();
      case "likes": return renderLikesContent();
      case "highlights": return renderHighlightsContent();
      case "articles": return renderArticlesContent();
      default: return renderPostsContent();
    }
  };

  if (loading) {
    return (
        <div className="d-flex justify-content-center align-items-center min-vh-100">
          <Spinner animation="border" role="status" />
        </div>
    );
  }

  return (
      <Container fluid className="min-vh-100 p-0">
        <div className="sticky-top">
          <Container fluid className="bg-white border-bottom py-2" style={{ zIndex: 1020 }}>
            <Row>
              <Col xs={12} sm={12} md={12} lg={12} xl={12} className="mx-auto d-flex align-items-center ps-md-5">
                <div className="d-flex align-items-center">
                  <Link to="/" className="btn btn-light me-3">
                    <FaArrowLeft size={20} />
                  </Link>
                  <div className="d-flex flex-column">
                    <h5 className="mb-0 fw-bold">{userProfile?.name}</h5>
                    <span className="text-light small">{userProfile?.postCount || 0} posts</span>
                  </div>
                </div>
              </Col>
            </Row>
          </Container>
        </div>

        <Container fluid className="flex-grow-1">
          <Row className="h-100">
            {/* SidebarLeft */}
            <Col xs={0} sm={0} md={0} lg={3} className="d-none d-lg-block p-0">
              <SidebarLeft />
            </Col>

            {/* Nội dung chính */}
            <Col xs={12} sm={12} md={12} lg={6} xl={6} className="px-md-0 border-start border-end border-dark">
              <Image src={userProfile?.banner || "https://via.placeholder.com/1200x400?text=Banner"} fluid className="w-100 border-bottom" style={{ height: "200px", objectFit: "cover" }} />
              <div className="position-relative p-3">
                <div className="d-flex justify-content-between align-items-end mb-3">
                  <Image
                      src={userProfile?.avatar || "https://via.placeholder.com/150?text=Avatar"}
                      roundedCircle
                      className="border border-white border-4"
                      style={{ width: "130px", height: "130px", objectFit: "cover", marginTop: "-75px", zIndex: "2" }}
                  />
                  <Button variant="primary" className="rounded-pill fw-bold px-3 py-2" onClick={handleEditClick}>
                    Chỉnh sửa
                  </Button>
                </div>
                <h4 className="mb-0 fw-bold">{userProfile?.displayName || "Người dùng Test"}</h4>
                <p className="text-light small mb-2">@{userProfile?.username || "testuser"}</p>
                {userProfile?.bio && <p className="mb-2">{userProfile.bio}</p>}
                {userProfile?.location && (
                    <p className="text-light small d-flex align-items-center mb-2">
                      <FaMapMarkerAlt size={16} className="me-2" /> {userProfile.location}
                    </p>
                )}
                {userProfile?.website && (
                    <p className="text-light small d-flex align-items-center mb-2">
                      <FaLink size={16} className="me-2" />
                      <a
                          href={userProfile.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-decoration-none text-muted"
                      >
                        {userProfile.website}
                      </a>
                    </p>
                )}
                <p className="text-light small d-flex align-items-center mb-2">
                  <FaCalendarAlt size={16} className="me-2" /> Ngày sinh:{" "}
                  {userProfile?.dateOfBirth
                      ? new Date(userProfile.dateOfBirth).toLocaleDateString("vi-VN")
                      : "Chưa cập nhật"}
                </p>
                {userProfile?.gender !== undefined && (
                    <p className="text-light small d-flex align-items-center mb-2">
                      <FaEllipsisH size={16} className="me-2" />
                      Giới tính: {userProfile.gender === 0 ? "Nam" : userProfile.gender === "1" ? "Nữ" : "Khác"}
                    </p>
                )}
                <div className="d-flex mb-3">
                  <Link to="#" className="me-3 text-dark text-decoration-none">
                    <span className="fw-bold">{userProfile?.followeeCount || 0}</span>{" "}
                    <span className="text-light small">Đang theo dõi</span>
                  </Link>
                  <Link to="#" className="text-dark text-decoration-none">
                    <span className="fw-bold">{userProfile?.followerCount || 0}</span>{" "}
                    <span className="text-light small">Người theo dõi</span>
                  </Link>
                </div>
                {showAlert && !userProfile?.isPremium && (
                    <div className="alert alert-light d-flex align-items-start border border-light rounded-3 p-3" role="alert">
                      <div>
                        <h6 className="fw-bold mb-1">
                          Bạn chưa đăng ký premium tài khoản <FaCheckCircle className="text-dark" />
                        </h6>
                        <p className="text-light small mb-2">
                          Hãy đăng ký premium tài khoản để sử dụng tính năng ưu tiên trả lời, phân tích, duyệt
                          xem không có quảng cáo, v.v. Nâng cấp hồ sơ ngay.
                        </p>
                        <Button variant="dark" className="rounded-pill px-4 py-2 fw-bold" onClick={handlePremiumClick}>
                          Premium
                        </Button>
                      </div>
                      <Button variant="link" className="ms-auto text-dark p-0" onClick={() => setShowAlert(false)}>
                        ×
                      </Button>
                    </div>
                )}
                <Nav variant="tabs" className="mt-4 profile-tabs nav-justified">
                  <Nav.Item>
                    <Nav.Link
                        onClick={() => setActiveTab("posts")}
                        className={`text-dark fw-bold ${activeTab === "posts" ? "active" : ""}`}
                    >
                      Bài đăng
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link
                        onClick={() => setActiveTab("replies")}
                        className={`text-dark fw-bold ${activeTab === "replies" ? "active" : ""}`}
                    >
                      Các phản hồi
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link
                        onClick={() => setActiveTab("media")}
                        className={`text-dark fw-bold ${activeTab === "media" ? "active" : ""}`}
                    >
                      Phương tiện
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link
                        onClick={() => setActiveTab("likes")}
                        className={`text-dark fw-bold ${activeTab === "likes" ? "active" : ""}`}
                    >
                      Lượt thích
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link
                        onClick={() => setActiveTab("highlights")}
                        className={`text-dark fw-bold ${activeTab === "highlights" ? "active" : ""}`}
                    >
                      Sự kiện nổi bật
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link
                        onClick={() => setActiveTab("articles")}
                        className={`text-dark fw-bold ${activeTab === "articles" ? "active" : ""}`}
                    >
                      Bài viết
                    </Nav.Link>
                  </Nav.Item>
                </Nav>
                {renderActiveTabContent()}
              </div>
            </Col>

            {/* SidebarRight */}
            <Col xs={0} sm={0} md={0} lg={3} className="d-none d-lg-block border-start p-0">
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