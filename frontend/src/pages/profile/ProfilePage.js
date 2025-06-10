import React, { useState, useEffect, useContext } from "react";
import { Container, Row, Col, Card, Nav, Button } from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaEllipsisH, FaCog, FaLink } from "react-icons/fa"; // Example icons
import SidebarLeft from "../../components/layout/SidebarLeft/SidebarLeft";
import SidebarRight from "../../components/layout/SidebarRight/SidebarRight";
import FollowListModal from "../../components/user/FollowListModal"; // Import the new modal
import { AuthContext } from "../../context/AuthContext"; // To check if it's the current user's profile

function UserProfile() {
  const { userId } = useParams(); // Get user ID from URL
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
    shares: [
      { id: 201, user: { name: userProfile?.displayName || "Người dùng Test", username: userProfile?.username || "testuser", avatar: userProfile?.avatar }, content: "Chia sẻ bài đăng này vì quá hay! #Motivation", imageUrl: "https://source.unsplash.com/600x400/?sunset", timestamp: new Date("2025-05-27T18:00:00Z"), comments: 3, retweets: 2, likes: 10 },
      { id: 202, user: { name: userProfile?.displayName || "Người dùng Test", username: userProfile?.username || "testuser", avatar: userProfile?.avatar }, content: "Một bài đăng thú vị về nghệ thuật! #Art", imageUrl: "https://source.unsplash.com/600x400/?abstract", timestamp: new Date("2025-05-25T11:00:00Z"), comments: 1, retweets: 0, likes: 7 },
    ],
    savedArticles: [
      { id: 301, user: { name: "Người dùng Khác 1", username: "otheruser1", avatar: "https://via.placeholder.com/50" }, content: "Bài đăng rất hay! Rất đồng ý. #GoodVibes", imageUrl: null, timestamp: new Date("2025-05-29T09:00:00Z"), comments: 0, retweets: 0, likes: 0 },
      { id: 302, user: { name: "Người dùng Khác 2", username: "otheruser2", avatar: "https://via.placeholder.com/50" }, content: "Hình ảnh này đẹp quá! Tuyệt vời. #Nature", imageUrl: "https://source.unsplash.com/600x400/?mountain", timestamp: new Date("2025-05-28T16:00:00Z"), comments: 1, retweets: 0, likes: 0 },
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
    return data.length > 0 ? (
        data.map((item) => <TweetCard key={item.id} tweet={item} />)
    ) : (
        <p className="text-dark text-center p-4">
          {activeTab === "posts" && "Không có bài đăng nào."}
          {activeTab === "shares" && "Không có bài chia sẻ nào."}
          {activeTab === "savedArticles" && "Không có bài viết đã lưu nào."}
        </p>
    );
  };

  if (loading) {
    return <div className="text-center p-5">Đang tải hồ sơ người dùng...</div>;
  }

  if (error) {
    return <div className="text-center p-5 text-danger">Lỗi: {error}</div>;
  }

  if (!profileUser) {
    return (
      <div className="text-center p-5 text-muted">Không tìm thấy hồ sơ.</div>
    );
  }

  const isCurrentUserProfile = currentUser && currentUser.id === profileUser.id;

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

          {/* Profile Banner */}
          <div className="profile-banner mb-3">
            <img
              src={profileUser.banner}
              alt="User Banner"
              className="img-fluid w-100"
            />
            <img
              src={profileUser.avatar}
              alt="User Avatar"
              className="profile-avatar rounded-circle border border-3 border-white"
            />
          </div>

          {/* Profile Info */}
          <div className="px-3 pb-3">
            <h3 className="mb-0">{profileUser.username}</h3>
            <p className="text-muted">@{profileUser.handle}</p>
            <p className="mb-2">{profileUser.bio}</p>
            <div className="d-flex small text-muted mb-3">
              {profileUser.location && (
                <span className="me-3">
                  <i className="bi bi-geo-alt-fill me-1"></i>
                  {profileUser.location}
                </span>
              )}
              {profileUser.website && (
                <span className="me-3">
                  <FaLink className="me-1" />
                  <a
                    href={`http://${profileUser.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted text-decoration-none"
                  >
                    {profileUser.website}
                  </a>
                </span>
              )}
              <span>
                <i className="bi bi-calendar-event me-1"></i>
                Tham gia {profileUser.joined}
              </span>
            </div>
            <div className="d-flex mb-3">
              <span className="me-3">
                <a
                  href="#!"
                  onClick={handleShowFollowingModal}
                  className="text-decoration-none text-dark fw-bold"
                >
                  {profileUser.followingCount}
                  <span className="text-muted ms-1">Đang theo dõi</span>
                </a>
              </span>
              <span>
                <a
                  href="#!"
                  onClick={handleShowFollowersModal}
                  className="text-decoration-none text-dark fw-bold"
                >
                  {profileUser.followersCount}
                  <span className="text-muted ms-1">Người theo dõi</span>
                </a>
              </span>
            </div>
          </div>

          {/* Navigation Tabs (Bài viết, Đã thích, Media) */}
          <Nav variant="underline" className="profile-detail-nav mb-4">
            <Nav.Item>
              <Nav.Link
                eventKey="posts"
                active={activeTab === "posts"}
                onClick={() => setActiveTab("posts")}
              >
                Bài viết
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link
                eventKey="liked"
                active={activeTab === "liked"}
                onClick={() => setActiveTab("liked")}
              >
                Đã thích
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link
                eventKey="media"
                active={activeTab === "media"}
                onClick={() => setActiveTab("media")}
              >
                Media
              </Nav.Link>
            </Nav.Item>
          </Nav>

          {/* Content based on active tab */}
          <div className="tab-content px-3">
            {activeTab === "posts" && (
              <div>
                {profileUser.posts.length > 0 ? (
                  profileUser.posts.map((post) => (
                    <Card key={post.id} className="mb-3 post-card">
                      <Card.Body>
                        <Card.Text>{post.content}</Card.Text>
                        <div className="text-muted small">
                          {post.time} · {post.likes} lượt thích
                        </div>
                      </Card.Body>
                    </Card>
                  ))
                ) : (
                  <p className="text-muted text-center">
                    Không có bài viết nào.
                  </p>
                )}
              </div>
            )}
            {activeTab === "liked" && (
              <div>
                {profileUser.likedPosts.length > 0 ? (
                  profileUser.likedPosts.map((post) => (
                    <Card key={post.id} className="mb-3 post-card">
                      <Card.Body>
                        <div className="text-muted small mb-1">
                          Thích bài viết của {post.user.username} (@
                          {post.user.handle})
                        </div>
                        <Card.Text>{post.content}</Card.Text>
                      </Card.Body>
                    </Card>
                  ))
                ) : (
                  <p className="text-muted text-center">
                    Chưa thích bài viết nào.
                  </p>
                )}
              </div>
            )}
            {activeTab === "media" && (
              <div>
                {profileUser.media.length > 0 ? (
                  <Row xs={1} md={2} lg={3} className="g-3">
                    {profileUser.media.map((item) => (
                      <Col key={item.id}>
                        <img
                          src={item.url}
                          alt="Media"
                          className="img-fluid rounded shadow-sm"
                        />
                      </Col>
                    ))}
                  </Row>
                ) : (
                  <p className="text-muted text-center">Không có media nào.</p>
                )}
              </div>
            )}
          </div>
        </Col>

        {/* Right Sidebar */}
        <Col lg={3} className="d-none d-lg-block profile-sidebar-right">
          <SidebarRight />
        </Col>
      </Row>

      {/* Follow List Modals */}
      {profileUser && (
        <>
          <FollowListModal
            show={showFollowersModal}
            handleClose={handleCloseFollowersModal}
            title="Người theo dõi"
            users={profileUser.followers || []}
          />
          <FollowListModal
            show={showFollowingModal}
            handleClose={handleCloseFollowingModal}
            title="Đang theo dõi"
            users={profileUser.following || []}
          />
        </>
      )}
    </Container>
  );
}

export default UserProfile;
