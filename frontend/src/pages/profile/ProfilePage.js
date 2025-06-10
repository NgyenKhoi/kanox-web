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
  const { user: currentUser } = useContext(AuthContext); // Get current logged-in user
  const [profileUser, setProfileUser] = useState(null); // The user whose profile is being viewed
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("posts"); // Default tab: Posts

  // State for modals
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);

  // --- Dummy Data (Replace with actual API fetch) ---
  const dummyUsers = {
    user1: {
      id: "user1",
      username: "John Doe",
      handle: "johndoe",
      avatar: "https://via.placeholder.com/150/FFC0CB?text=JD",
      banner: "https://via.placeholder.com/800x200?text=User+Banner",
      bio: "Lover of React, Bootstrap, and all things web development. Building cool stuff one line of code at a time.",
      location: "Da Nang, Vietnam",
      website: "johndoe.com",
      joined: "Ngày 1 tháng 3 năm 2020",
      followersCount: "1.234",
      followingCount: "456",
      // Detailed lists for followers/following
      followers: [
        {
          id: "f1",
          username: "Nguyễn Văn A",
          handle: "vana",
          avatar: "https://via.placeholder.com/40/007bff?text=VA",
        },
        {
          id: "f2",
          username: "Trần Thị B",
          handle: "thib",
          avatar: "https://via.placeholder.com/40/28a745?text=TB",
        },
        {
          id: "f3",
          username: "Lê Văn C",
          handle: "vanc",
          avatar: "https://via.placeholder.com/40/dc3545?text=LC",
        },
        {
          id: "f4",
          username: "Phạm Thị D",
          handle: "thid",
          avatar: "https://via.placeholder.com/40/ffc107?text=TD",
        },
        {
          id: "f5",
          username: "Hoàng Văn E",
          handle: "vane",
          avatar: "https://via.placeholder.com/40/17a2b8?text=HE",
        },
      ],
      following: [
        {
          id: "fg1",
          username: "Dev Community",
          handle: "devcommunity",
          avatar: "https://via.placeholder.com/40/6c757d?text=DC",
        },
        {
          id: "fg2",
          username: "React News",
          handle: "reactnews",
          avatar: "https://via.placeholder.com/40/fd7e14?text=RN",
        },
        {
          id: "fg3",
          username: "Frontend Master",
          handle: "frontendmaster",
          avatar: "https://via.placeholder.com/40/6610f2?text=FM",
        },
      ],
      posts: [
        {
          id: "p1",
          content: "Just launched my new project! Check it out!",
          time: "2 giờ",
          comments: 10,
          likes: 50,
        },
        {
          id: "p2",
          content: "Learning more about CSS Grid. It's amazing!",
          time: "1 ngày",
          comments: 5,
          likes: 25,
        },
      ],
      likedPosts: [
        {
          id: "lp1",
          content: "Great tutorial on React hooks!",
          time: "3 giờ",
          user: { username: "TutorialGuy", handle: "tutguy" },
        },
      ],
      media: [
        {
          id: "m1",
          type: "image",
          url: "https://via.placeholder.com/200?text=Image1",
        },
        {
          id: "m2",
          type: "image",
          url: "https://via.placeholder.com/200?text=Image2",
        },
      ],
    },
    currentuser: {
      // Example for the logged-in user's profile
      id: "currentuser",
      username: "Current User",
      handle: "currentuser",
      avatar: "https://via.placeholder.com/150/9966CC?text=CU",
      banner: "https://via.placeholder.com/800x200?text=My+Banner",
      bio: "This is my personal profile. Enjoying coding and exploring new technologies.",
      location: "Hanoi, Vietnam",
      website: "mywebsite.com",
      joined: "Ngày 10 tháng 1 năm 2022",
      followersCount: "500",
      followingCount: "150",
      followers: [
        {
          id: "f6",
          username: "User A",
          handle: "usera",
          avatar: "https://via.placeholder.com/40/AAAAAA?text=A",
        },
        {
          id: "f7",
          username: "User B",
          handle: "userb",
          avatar: "https://via.placeholder.com/40/BBBBBB?text=B",
        },
      ],
      following: [
        {
          id: "fg4",
          username: "Community X",
          handle: "commx",
          avatar: "https://via.placeholder.com/40/CCCCCC?text=X",
        },
      ],
      posts: [
        {
          id: "p3",
          content: "Hello World from my profile!",
          time: "1 giờ",
          comments: 2,
          likes: 10,
        },
      ],
      likedPosts: [],
      media: [],
    },
  };
  // --- End Dummy Data ---

  useEffect(() => {
    setLoading(true);
    setError(null);
    const fetchUserProfile = async () => {
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate API call delay
      try {
        // If userId is 'me' or matches current user's ID, fetch current user's data
        const profileData =
          userId === "me" && currentUser
            ? dummyUsers["currentuser"]
            : dummyUsers[userId];
        if (!profileData) {
          throw new Error("Không tìm thấy người dùng này.");
        }
        setProfileUser(profileData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [userId, currentUser]);

  const handleShowFollowersModal = () => setShowFollowersModal(true);
  const handleCloseFollowersModal = () => setShowFollowersModal(false);

  const handleShowFollowingModal = () => setShowFollowingModal(true);
  const handleCloseFollowingModal = () => setShowFollowingModal(false);

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
    <Container fluid className="user-profile-page-container d-flex flex-grow-1">
      <Row className="w-100 justify-content-center">
        <Col xs={0} md={0} lg={3} className="p-0">
          <SidebarLeft />
        </Col>
        <Col
          xs={12}
          lg={6}
          className="profile-main-content border-start border-end py-3"
        >
          {/* Header */}
          <div className="d-flex align-items-center mb-3 px-3">
            <Button
              variant="link"
              onClick={() => navigate(-1)}
              className="text-dark p-0 me-3"
            >
              <FaArrowLeft size={20} />
            </Button>
            <h2 className="mb-0 me-auto">{profileUser.username}</h2>
            {isCurrentUserProfile ? (
              <Button variant="outline-secondary" className="rounded-pill px-3">
                Chỉnh sửa hồ sơ
              </Button>
            ) : (
              <>
                <Button
                  variant="outline-primary"
                  className="rounded-circle d-flex align-items-center justify-content-center"
                  style={{ width: "38px", height: "38px" }}
                >
                  <FaEllipsisH />
                </Button>
                <Button variant="primary" className="rounded-pill px-4 ms-2">
                  Theo dõi
                </Button>
              </>
            )}
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
