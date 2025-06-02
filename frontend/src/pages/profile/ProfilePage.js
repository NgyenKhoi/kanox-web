import React, { useState, useEffect } from "react";
import { Container, Row, Col, Image, Button, Nav } from "react-bootstrap";
import {
  FaArrowLeft,
  FaCalendarAlt,
  FaCheckCircle,
  FaMapMarkerAlt,
  FaLink,
} from "react-icons/fa";
import { Link, useParams, useNavigate } from "react-router-dom";
import TweetCard from "../../components/posts/TweetCard/TweetCard";
import EditProfileModal from "../../components/profile/EditProfileModal";
import SidebarLeft from "../../components/layout/SidebarLeft/SidebarLeft";
// Import SidebarRight nếu bạn muốn nó hiển thị trên trang ProfilePage
import SidebarRight from "../../components/layout/SidebarRight/SidebarRight";

function ProfilePage() {
  const [showAlert, setShowAlert] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const { username } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("posts"); // State để quản lý tab đang hoạt động

  // Dữ liệu profile mặc định/giả
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
      const token = localStorage.getItem("token");
      const currentUsername = localStorage.getItem("username");

      if (!currentUsername || !token) {
        setUserProfile(defaultUserProfile);
        console.warn(
          "Không tìm thấy username hoặc token trong localStorage. Đang sử dụng dữ liệu profile mặc định."
        );
        return;
      }

      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/user/profile/${username}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          console.error(
            `Lỗi khi tải hồ sơ (${response.status}): ${response.statusText}. Sử dụng dữ liệu profile mặc định.`
          );
          setUserProfile(defaultUserProfile);
          return;
        }

        const data = await response.json();
        setUserProfile({
          ...data,
          banner:
            data.banner || "https://source.unsplash.com/1200x400/?nature,water",
          avatar:
            data.avatar || "https://source.unsplash.com/150x150/?portrait",
          postCount: data.postCount || 0,
          website: data.website || "",
          isPremium: data.isPremium || false,
        });
      } catch (error) {
        console.error("Lỗi khi tải hồ sơ:", error.message);
        setUserProfile(defaultUserProfile);
      }
    };

    fetchUserProfile();
  }, [username]);

  const sampleTweets = [
    {
      id: 1,
      user: {
        name: userProfile?.displayName || "Người dùng Test",
        username: userProfile?.username || "testuser",
        avatar: userProfile?.avatar || "https://via.placeholder.com/50",
      },
      content: "Xin chào từ tài khoản ảo! #TestAccount",
      imageUrl: null,
      timestamp: new Date("2025-05-28T00:00:00Z"),
      comments: 0,
      retweets: 0,
      likes: 0,
    },
    {
      id: 2,
      user: {
        name: userProfile?.displayName || "Người dùng Test",
        username: userProfile?.username || "testuser",
        avatar: userProfile?.avatar || "https://via.placeholder.com/50",
      },
      content: "Đang thử nghiệm giao diện Profile Page. Trông khá ổn!",
      imageUrl:
        "https://via.placeholder.com/600x400/FF5733/ffffff?text=Mock+Image",
      timestamp: new Date("2025-05-29T10:00:00Z"),
      comments: 2,
      retweets: 1,
      likes: 5,
    },
    {
      id: 3,
      user: {
        name: userProfile?.displayName || "Người dùng Test",
        username: userProfile?.username || "testuser",
        avatar: userProfile?.avatar || "https://via.placeholder.com/50",
      },
      content: "React là một thư viện tuyệt vời để xây dựng UI.",
      imageUrl: null,
      timestamp: new Date("2025-05-30T14:30:00Z"),
      comments: 1,
      retweets: 0,
      likes: 3,
    },
  ];

  // Dữ liệu giả cho tab "Các phản hồi"
  const sampleReplies = [
    {
      id: 101,
      user: {
        name: "Phản hồi Người dùng",
        username: "replyuser",
        avatar: "https://via.placeholder.com/50",
      },
      content: "Đây là một phản hồi đến bài đăng của @testuser. #ReactJS",
      imageUrl: null,
      timestamp: new Date("2025-05-31T08:00:00Z"),
      comments: 0,
      retweets: 0,
      likes: 1,
      inReplyTo: userProfile?.username || "testuser",
    },
    {
      id: 102,
      user: {
        name: userProfile?.displayName || "Người dùng Test",
        username: userProfile?.username || "testuser",
        avatar: userProfile?.avatar || "https://via.placeholder.com/50",
      },
      content: "Đúng vậy! Rất thích làm việc với React. #WebDev",
      imageUrl: null,
      timestamp: new Date("2025-06-01T11:20:00Z"),
      comments: 0,
      retweets: 0,
      likes: 2,
      inReplyTo: "replyuser",
    },
  ];

  // Dữ liệu giả cho tab "Phương tiện"
  const sampleMedia = [
    {
      id: 201,
      user: {
        name: userProfile?.displayName || "Người dùng Test",
        username: userProfile?.username || "testuser",
        avatar: userProfile?.avatar || "https://via.placeholder.com/50",
      },
      content: "Cảnh hoàng hôn tuyệt đẹp hôm nay! #Photography",
      imageUrl: "https://source.unsplash.com/600x400/?sunset",
      timestamp: new Date("2025-05-27T18:00:00Z"),
      comments: 3,
      retweets: 2,
      likes: 10,
    },
    {
      id: 202,
      user: {
        name: userProfile?.displayName || "Người dùng Test",
        username: userProfile?.username || "testuser",
        avatar: userProfile?.avatar || "https://via.placeholder.com/50",
      },
      content: "Thử nghiệm với một số hiệu ứng ảnh mới. #Art",
      imageUrl: "https://source.unsplash.com/600x400/?abstract",
      timestamp: new Date("2025-05-25T11:00:00Z"),
      comments: 1,
      retweets: 0,
      likes: 7,
    },
  ];

  // Dữ liệu giả cho tab "Lượt thích"
  const sampleLikes = [
    {
      id: 301,
      user: {
        name: "Người dùng Khác 1",
        username: "otheruser1",
        avatar: "https://via.placeholder.com/50",
      },
      content: "Bài đăng rất hay! Rất đồng ý. #GoodVibes",
      imageUrl: null,
      timestamp: new Date("2025-05-29T09:00:00Z"),
      comments: 0,
      retweets: 0,
      likes: 0,
    },
    {
      id: 302,
      user: {
        name: "Người dùng Khác 2",
        username: "otheruser2",
        avatar: "https://via.placeholder.com/50",
      },
      content: "Hình ảnh này đẹp quá! Tuyệt vời. #Nature",
      imageUrl: "https://source.unsplash.com/600x400/?mountain",
      timestamp: new Date("2025-05-28T16:00:00Z"),
      comments: 1,
      retweets: 0,
      likes: 0,
    },
  ];

  // Dữ liệu giả cho tab "Sự kiện nổi bật"
  const sampleHighlights = [
    {
      id: 401,
      user: {
        name: userProfile?.displayName || "Người dùng Test",
        username: userProfile?.username || "testuser",
        avatar: userProfile?.avatar || "https://via.placeholder.com/50",
      },
      content: "Đạt được 500 người theo dõi! Cảm ơn tất cả mọi người! 🎉",
      imageUrl: null,
      timestamp: new Date("2025-05-20T10:00:00Z"),
      comments: 15,
      retweets: 5,
      likes: 100,
      isHighlight: true, // Đánh dấu đây là một sự kiện nổi bật
    },
    {
      id: 402,
      user: {
        name: userProfile?.displayName || "Người dùng Test",
        username: userProfile?.username || "testuser",
        avatar: userProfile?.avatar || "https://via.placeholder.com/50",
      },
      content: "Hoàn thành dự án React đầu tiên! Cảm thấy rất tuyệt vời. 💪",
      imageUrl: "https://source.unsplash.com/600x400/?coding,success",
      timestamp: new Date("2025-04-15T14:00:00Z"),
      comments: 8,
      retweets: 3,
      likes: 50,
      isHighlight: true,
    },
  ];

  // Dữ liệu giả cho tab "Bài viết" (Đây có thể là các bài đăng dài hơn, blog post)
  const sampleArticles = [
    {
      id: 501,
      user: {
        name: userProfile?.displayName || "Người dùng Test",
        username: userProfile?.username || "testuser",
        avatar: userProfile?.avatar || "https://via.placeholder.com/50",
      },
      title: "Cách xây dựng ứng dụng React cơ bản",
      content:
        "Trong bài viết này, tôi sẽ hướng dẫn các bạn từng bước xây dựng một ứng dụng React đơn giản từ đầu...",
      imageUrl: "https://source.unsplash.com/600x400/?reactjs,programming",
      timestamp: new Date("2025-05-10T09:00:00Z"),
      readTime: "5 phút đọc",
    },
    {
      id: 502,
      user: {
        name: userProfile?.displayName || "Người dùng Test",
        username: userProfile?.username || "testuser",
        avatar: userProfile?.avatar || "https://via.placeholder.com/50",
      },
      title: "10 mẹo để tối ưu hóa hiệu suất website",
      content:
        "Tối ưu hóa hiệu suất website là rất quan trọng để cải thiện trải nghiệm người dùng...",
      imageUrl: "https://source.unsplash.com/600x400/?website,performance",
      timestamp: new Date("2025-04-20T11:00:00Z"),
      readTime: "8 phút đọc",
    },
  ];

  const handleEditClick = () => setShowEditModal(true);
  const handleCloseEditModal = () => setShowEditModal(false);

  const handleSaveProfile = (updatedData) => {
    setUserProfile((prevProfile) => ({
      ...prevProfile,
      ...updatedData,
    }));
    console.log("Profile updated:", updatedData);
  };

  const handlePremiumClick = () => {
    navigate("/premium");
  };

  // Hàm render nội dung cho tab "Bài đăng"
  const renderPostsContent = () => (
    <div className="mt-0 border-top">
      {sampleTweets.map((tweet) => (
        <TweetCard key={tweet.id} tweet={tweet} />
      ))}
      {sampleTweets.length === 0 && (
        <p className="text-muted text-center p-4">Không có bài đăng nào.</p>
      )}
    </div>
  );

  // Hàm render nội dung cho tab "Các phản hồi"
  const renderRepliesContent = () => (
    <div className="mt-0 border-top">
      {sampleReplies.map((tweet) => (
        <TweetCard key={tweet.id} tweet={tweet} />
      ))}
      {sampleReplies.length === 0 && (
        <p className="text-muted text-center p-4">Không có phản hồi nào.</p>
      )}
    </div>
  );

  // Hàm render nội dung cho tab "Phương tiện"
  const renderMediaContent = () => (
    <div className="mt-0 border-top">
      {sampleMedia.map((tweet) => (
        <TweetCard key={tweet.id} tweet={tweet} />
      ))}
      {sampleMedia.length === 0 && (
        <p className="text-muted text-center p-4">Không có phương tiện nào.</p>
      )}
    </div>
  );

  // Hàm render nội dung cho tab "Lượt thích"
  const renderLikesContent = () => (
    <div className="mt-0 border-top">
      {sampleLikes.map((tweet) => (
        <TweetCard key={tweet.id} tweet={tweet} />
      ))}
      {sampleLikes.length === 0 && (
        <p className="text-muted text-center p-4">Không có lượt thích nào.</p>
      )}
    </div>
  );

  // Hàm render nội dung cho tab "Sự kiện nổi bật"
  const renderHighlightsContent = () => (
    <div className="mt-0 border-top">
      {sampleHighlights.map((tweet) => (
        <TweetCard key={tweet.id} tweet={tweet} />
      ))}
      {sampleHighlights.length === 0 && (
        <p className="text-muted text-center p-4">
          Không có sự kiện nổi bật nào.
        </p>
      )}
    </div>
  );

  // Hàm render nội dung cho tab "Bài viết"
  const renderArticlesContent = () => (
    <div className="mt-0 border-top">
      {sampleArticles.map((article) => (
        <div key={article.id} className="border-bottom p-3 hover-bg-light">
          <div className="d-flex align-items-center mb-2">
            <Image
              src={article.user.avatar}
              roundedCircle
              width="40"
              height="40"
              className="me-2"
            />
            <div>
              <span className="fw-bold">{article.user.name}</span>{" "}
              <span className="text-muted small">@{article.user.username}</span>
            </div>
          </div>
          <h5 className="fw-bold mb-1">{article.title}</h5>
          {article.imageUrl && (
            <Image
              src={article.imageUrl}
              fluid
              className="rounded mb-2"
              style={{ maxHeight: "200px", objectFit: "cover" }}
            />
          )}
          <p className="text-muted small">
            {article.content.substring(0, 150)}...
          </p>
          <div className="d-flex justify-content-between text-muted small">
            <span>
              {new Date(article.timestamp).toLocaleDateString("vi-VN")}
            </span>
            <span>{article.readTime}</span>
          </div>
        </div>
      ))}
      {sampleArticles.length === 0 && (
        <p className="text-muted text-center p-4">Không có bài viết nào.</p>
      )}
    </div>
  );

  const renderActiveTabContent = () => {
    switch (activeTab) {
      case "posts":
        return renderPostsContent();
      case "replies":
        return renderRepliesContent();
      case "media":
        return renderMediaContent();
      case "likes":
        return renderLikesContent();
      case "highlights": // Thêm case cho tab mới
        return renderHighlightsContent();
      case "articles": // Thêm case cho tab mới
        return renderArticlesContent();
      default:
        return renderPostsContent();
    }
  };

  if (!userProfile) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div>Đang tải hồ sơ...</div>
      </div>
    );
  }

  return (
    <div className="d-flex min-vh-100 bg-light">
      {/* Sidebar trái - hiển thị trên màn hình lớn */}
      <div className="d-none d-lg-block">
        <SidebarLeft />
      </div>

      {/* Main Content Area */}
      <div className="d-flex flex-column flex-grow-1">
        {/* Header cho trang Profile */}
        <div
          className="sticky-top bg-white border-bottom py-2"
          style={{ zIndex: 1020 }}
        >
          <Container fluid>
            <Row>
              <Col
                xs={12}
                md={8}
                lg={12}
                xl={12}
                className="mx-auto d-flex align-items-center ps-md-0"
              >
                <Link to="/" className="btn btn-link text-dark me-3">
                  <FaArrowLeft size={20} />
                </Link>
                <div>
                  <h5 className="mb-0 fw-bold">{userProfile.name}</h5>
                  <p className="text-muted small mb-0">
                    {userProfile.postCount} bài đăng
                  </p>
                </div>
              </Col>
            </Row>
          </Container>
        </div>

        {/* Main Profile Content */}
        <Container fluid className="flex-grow-1">
          <Row className="h-100">
            {/* Cột chính giữa chứa Profile và Tabs Content */}
            <Col
              xs={12}
              sm={12}
              md={12}
              lg={8}
              xl={7}
              className="px-md-0 border-start border-end"
            >
              {/* Banner Image */}
              <Image
                src={userProfile.banner}
                fluid
                className="w-100"
                style={{ height: "200px", objectFit: "cover" }}
              />

              <div className="position-relative p-3">
                {/* Avatar and Edit Profile Button */}
                <div className="d-flex justify-content-between align-items-end mb-3">
                  <Image
                    src={userProfile.avatar}
                    roundedCircle
                    className="border border-white border-4"
                    style={{
                      width: "130px",
                      height: "130px",
                      objectFit: "cover",
                      marginTop: "-75px",
                      zIndex: 2,
                    }}
                  />
                  <Button
                    variant="outline-dark"
                    className="rounded-pill fw-bold px-3 py-2"
                    onClick={handleEditClick}
                  >
                    Chỉnh sửa hồ sơ
                  </Button>
                </div>

                {/* User Info */}
                <h4 className="mb-0 fw-bold">{userProfile.displayName}</h4>
                <p className="text-muted mb-2">@{userProfile.username}</p>

                {userProfile.bio && <p className="mb-2">{userProfile.bio}</p>}

                {userProfile.location && (
                  <p className="text-muted d-flex align-items-center mb-2">
                    <FaMapMarkerAlt size={16} className="me-2" />{" "}
                    {userProfile.location}
                  </p>
                )}

                {userProfile.website && (
                  <p className="text-muted d-flex align-items-center mb-2">
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

                <p className="text-muted d-flex align-items-center mb-2">
                  <FaCalendarAlt size={16} className="me-2" />
                  Ngày sinh{" "}
                  {userProfile.dateOfBirth
                    ? new Date(userProfile.dateOfBirth).toLocaleDateString(
                        "vi-VN"
                      )
                    : "Chưa cập nhật"}
                </p>

                <div className="d-flex mb-3">
                  <Link to="#" className="me-3 text-dark text-decoration-none">
                    <span className="fw-bold">{userProfile.followeeCount}</span>{" "}
                    <span className="text-muted">Đang theo dõi</span>
                  </Link>
                  <Link to="#" className="text-dark text-decoration-none">
                    <span className="fw-bold">{userProfile.followerCount}</span>{" "}
                    <span className="text-muted">Người theo dõi</span>
                  </Link>
                </div>

                {showAlert && !userProfile.isPremium && (
                  <div
                    className="alert alert-success d-flex align-items-start"
                    role="alert"
                  >
                    <div>
                      <h6 className="alert-heading mb-1">
                        Bạn chưa đăng kí premium tài khoản{" "}
                        <FaCheckCircle className="text-primary" />
                      </h6>
                      <p className="mb-2">
                        Hãy đăng kí premium tài khoản để sử dụng tính năng ưu
                        tiên trả lời, phân tích, duyệt xem không có quảng cáo,
                        v.v. Nâng cấp hồ sơ ngay.
                      </p>
                      <Button
                        variant="dark"
                        className="rounded-pill px-4 fw-bold"
                        onClick={handlePremiumClick}
                      >
                        premium
                      </Button>
                    </div>
                    <Button
                      variant="link"
                      className="ms-auto text-dark p-0"
                      onClick={() => setShowAlert(false)}
                    >
                      &times;
                    </Button>
                  </div>
                )}

                {/* Navigation Tabs - Added nav-justified for even distribution */}
                <Nav
                  variant="underline"
                  className="mt-4 profile-tabs nav-justified"
                >
                  <Nav.Item>
                    <Nav.Link
                      onClick={() => setActiveTab("posts")}
                      className={`text-dark fw-bold ${
                        activeTab === "posts" ? "active" : ""
                      }`}
                    >
                      Bài đăng
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link
                      onClick={() => setActiveTab("replies")}
                      className={`text-dark fw-bold ${
                        activeTab === "replies" ? "active" : ""
                      }`}
                    >
                      Các phản hồi
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link
                      onClick={() => setActiveTab("media")}
                      className={`text-dark fw-bold ${
                        activeTab === "media" ? "active" : ""
                      }`}
                    >
                      Phương tiện
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link
                      onClick={() => setActiveTab("likes")}
                      className={`text-dark fw-bold ${
                        activeTab === "likes" ? "active" : ""
                      }`}
                    >
                      Lượt thích
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link
                      onClick={() => setActiveTab("highlights")}
                      className={`text-dark fw-bold ${
                        activeTab === "highlights" ? "active" : ""
                      }`}
                    >
                      Sự kiện nổi bật
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link
                      onClick={() => setActiveTab("articles")}
                      className={`text-dark fw-bold ${
                        activeTab === "articles" ? "active" : ""
                      }`}
                    >
                      Bài viết
                    </Nav.Link>
                  </Nav.Item>
                </Nav>
              </div>

              {/* Render content based on active tab */}
              {renderActiveTabContent()}
            </Col>

            {/* Cột phải - hiển thị trên màn hình lớn */}
            <Col
              xs={0}
              sm={0}
              md={0}
              lg={3}
              xl={3}
              className="d-none d-lg-block border-start border-end"
            >
              {/* Bạn có thể thêm SidebarRight ở đây nếu muốn */}
              <SidebarRight />
              {/* <div className="p-3 sticky-top" style={{ top: "60px" }}>
                <h5 className="fw-bold mb-3">Gợi ý theo dõi</h5>
                <div className="mb-3 d-flex align-items-center">
                  <Image
                    src="https://via.placeholder.com/40"
                    roundedCircle
                    className="me-2"
                  />
                  <span className="flex-grow-1">Người dùng 1</span>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="ms-auto rounded-pill"
                  >
                    Theo dõi
                  </Button>
                </div>
                <div className="mb-3 d-flex align-items-center">
                  <Image
                    src="https://via.placeholder.com/40"
                    roundedCircle
                    className="me-2"
                  />
                  <span className="flex-grow-1">Người dùng 2</span>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="ms-auto rounded-pill"
                  >
                    Theo dõi
                  </Button>
                </div>

                <h5 className="fw-bold mt-4 mb-3">Những điều đang diễn ra</h5>
                <p className="mb-1">#TrendingTopic1</p>
                <p className="mb-1">#TrendingTopic2</p>
              </div> */}
            </Col>
          </Row>
        </Container>
      </div>

      <EditProfileModal
        show={showEditModal}
        handleClose={handleCloseEditModal}
        userProfile={userProfile}
        onSave={handleSaveProfile}
        username={username}
      />
    </div>
  );
}

export default ProfilePage;
