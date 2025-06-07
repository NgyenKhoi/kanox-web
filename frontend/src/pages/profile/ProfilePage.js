import React, { useState, useEffect, useContext } from "react";
import { Container, Row, Col, Image, Button, Nav, Spinner } from "react-bootstrap";
import { FaArrowLeft, FaCalendarAlt, FaCheckCircle, FaMapMarkerAlt, FaLink, FaEllipsisH } from "react-icons/fa";
import { Link, useParams, useNavigate } from "react-router-dom";
import TweetCard from "../../components/posts/TweetCard/TweetCard";
import EditProfileModal from "../../components/profile/EditProfileModal";
import SidebarLeft from "../../components/layout/SidebarLeft/SidebarLeft";
import SidebarRight from "../../components/layout/SidebarRight/SidebarRight";
import { AuthContext } from "../../context/AuthContext";

function ProfilePage() {
  const { user, setUser } = useContext(AuthContext);
  const { username } = useParams();
  const navigate = useNavigate();

  const [userProfile, setUserProfile] = useState(null);
  const [activeTab, setActiveTab] = useState("posts");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPremiumAlert, setShowPremiumAlert] = useState(true);
  const [error, setError] = useState(null);

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
    isPremium: false,
    gender: 0,
  };

  // Dữ liệu mẫu cho các tab (loại bỏ imageUrl và avatar)
  const sampleData = {
    posts: [], // Dùng dữ liệu từ API thay vì mẫu
    shares: [
      { id: 201, user: { name: userProfile?.displayName || "Người dùng Test", username: userProfile?.username || "testuser" }, content: "Chia sẻ bài đăng này vì quá hay! #Motivation", timestamp: new Date("2025-05-27T18:00:00Z"), comments: 3, retweets: 2, likes: 10 },
      { id: 202, user: { name: userProfile?.displayName || "Người dùng Test", username: userProfile?.username || "testuser" }, content: "Một bài đăng thú vị về nghệ thuật! #Art", timestamp: new Date("2025-05-25T11:00:00Z"), comments: 1, retweets: 0, likes: 7 },
    ],
    savedArticles: [
      { id: 301, user: { name: "Người dùng Khác 1", username: "otheruser1" }, content: "Bài đăng rất hay! Rất đồng ý. #GoodVibes", timestamp: new Date("2025-05-29T09:00:00Z"), comments: 0, retweets: 0, likes: 0 },
      { id: 302, user: { name: "Người dùng Khác 2", username: "otheruser2" }, content: "Hình ảnh này đẹp quá! Tuyệt vời. #Nature", timestamp: new Date("2025-05-28T16:00:00Z"), comments: 1, retweets: 0, likes: 0 },
    ],
  };

  // Fetch hồ sơ người dùng
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);

      if (!user) {
        setUserProfile(defaultUserProfile);
        setPosts([]);
        setLoading(false);
        return;
      }

      if (username && user.username !== username) {
        navigate(`/profile/${user.username}`);
        return;
      }

      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${process.env.REACT_APP_API_URL}/user/profile/${username}`, {
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
        const postsResponse = await fetch(`${process.env.REACT_APP_API_URL}/posts/user/${username}`, {
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        });

        if (!postsResponse.ok) {
          throw new Error("Không thể lấy bài đăng!");
        }

        const postsData = await postsResponse.json();
        setPosts(postsData);
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
      const response = await fetch(`${process.env.REACT_APP_API_URL}/user/profile/${username}`, {
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
    if (activeTab === "posts") {
      return posts.length > 0 ? (
          posts.map((item) => (
              <TweetCard
                  key={item.id}
                  tweet={item}
                  onPostUpdate={() => fetchProfileAndPosts()} // Thêm callback để làm mới bài đăng
              />
          ))
      ) : (
          <p className="text-dark text-center p-4">Không có bài đăng nào.</p>
      );
    }

    const data = sampleData[activeTab] || [];
    return data.length > 0 ? (
        data.map((item) => <TweetCard key={item.id} tweet={item} />)
    ) : (
        <p className="text-dark text-center p-4">
          {activeTab === "shares" && "Không có bài chia sẻ nào."}
          {activeTab === "savedArticles" && "Không có bài viết đã lưu nào."}
        </p>
    );
  };

  // Thêm hàm fetchProfileAndPosts để dùng trong onPostUpdate
  const fetchProfileAndPosts = async () => {
    try {
      const token = localStorage.getItem("token");

      const profileResponse = await fetch(`${process.env.REACT_APP_API_URL}/api/users/profile/${username}`, {
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });

      if (!profileResponse.ok) {
        throw new Error("Không thể lấy thông tin hồ sơ!");
      }

      const profileData = await profileResponse.json();
      setUserProfile({
        ...profileData,
        postCount: profileData.postCount || 0,
        website: profileData.website || "",
        isPremium: profileData.isPremium || false,
      });

      const postsResponse = await fetch(`${process.env.REACT_APP_API_URL}/api/posts/user/${username}`, {
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });

      if (!postsResponse.ok) {
        throw new Error("Không thể lấy bài đăng!");
      }

      const postsData = await postsResponse.json();
      setPosts(postsData);
    } catch (error) {
      console.error("Error refreshing data:", error);
      setError(error.message);
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
      <Container fluid className="min-vh-100 p-0">
        {/* Header cố định */}
        <div className="sticky-top bg-white border-bottom py-2" style={{ zIndex: 1020 }}>
          <Container fluid>
            <Row>
              <Col xs={12} lg={12} className="mx-auto d-flex align-items-center ps-md-5">
                <Link to="/home" className="btn btn-light me-3">
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
            <Col xs={12} lg={6} className="px-md-0">
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
                  {["posts", "shares", "savedArticles"].map((tab) => (
                      <Nav.Item key={tab}>
                        <Nav.Link
                            onClick={() => setActiveTab(tab)}
                            className={`text-dark fw-bold ${activeTab === tab ? "active" : ""}`}
                        >
                          {tab === "posts" && "Bài đăng"}
                          {tab === "shares" && "Chia sẻ"}
                          {tab === "savedArticles" && "Bài viết đã lưu"}
                        </Nav.Link>
                      </Nav.Item>
                  ))}
                </Nav>

                {/* Tab Content */}
                <div className="mt-0 border-top">{renderTabContent()}</div>
              </div>
            </Col>

            {/* SidebarRight */}
            <Col xs={0} lg={3} className="d-none d-lg-block p-0">
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