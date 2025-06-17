import React, { useState, useEffect, useContext } from "react";
import {
  Container,
  Row,
  Col,
  Image,
  Button,
  Nav,
  Spinner,
  ListGroup,
} from "react-bootstrap";
import {
  FaArrowLeft,
  FaCalendarAlt,
  FaCheckCircle,
  FaMapMarkerAlt,
  FaLink,
  FaEllipsisH,
  FaUserSlash,
} from "react-icons/fa";
import { Link, useParams, useNavigate } from "react-router-dom";
import TweetCard from "../../components/posts/TweetCard/TweetCard";
import EditProfileModal from "../../components/profile/EditProfileModal";
import SidebarLeft from "../../components/layout/SidebarLeft/SidebarLeft";
import SidebarRight from "../../components/layout/SidebarRight/SidebarRight";
import FriendshipButton from "../../components/friendship/FriendshipButton";
import FollowActionButton from "../../components/utils/FollowActionButton";
import { AuthContext } from "../../context/AuthContext";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import useUserMedia from "../../hooks/useUserMedia";

function ProfilePage() {
  const { user, setUser } = useContext(AuthContext);
  const { username } = useParams();
  const navigate = useNavigate();

  const [userProfile, setUserProfile] = useState(null);
  const [activeTab, setActiveTab] = useState("posts");
  const [posts, setPosts] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPremiumAlert, setShowPremiumAlert] = useState(true);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isUserBlocked, setIsUserBlocked] = useState(false);
  const { mediaUrl, loading: mediaLoading } = useUserMedia(userProfile?.id);
  const defaultUserProfile = {
    id: null,
    username: "testuser",
    displayName: "Người dùng Test",
    bio: "Đây là một tài khoản ảo để kiểm tra giao diện người dùng. Rất vui được kết nối!",
    location: "Việt Nam",
    website: "https://example.com",
    dateOfBirth: "2000-01-01T00:00:00Z",
    followeeCount: 123,
    followerCount: 456,
    postCount: 789,
    isPremium: false,
    gender: 0,
    profileImageUrl: "https://via.placeholder.com/150?text=Avatar",
  };

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      if (!username || username === "undefined") {
        toast.error("Tên người dùng không hợp lệ.");
        setUserProfile(defaultUserProfile);
        setPosts([]);
        setSentRequests([]);
        setLoading(false);
        if (user?.username) {
          navigate(`/profile/${user.username}`);
        } else {
          navigate("/");
        }
        return;
      }

      if (!user) {
        navigate("/");
        return;
      }

      const token = sessionStorage.getItem("token") || localStorage.getItem("token");
      if (!token) {
        toast.error("Không tìm thấy token. Vui lòng đăng nhập lại.");
        setLoading(false);
        navigate("/");
        return;
      }

      try {
        const profileResponse = await fetch(
            `${process.env.REACT_APP_API_URL}/user/profile/${username}`,
            {
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
              },
            }
        );

        const profileData = await profileResponse.json();
        if (!profileResponse.ok) {
          throw new Error(profileData.message || "Lỗi khi lấy thông tin hồ sơ.");
        }

        if (user.username !== username) {
          const blockResponse = await fetch(
              `${process.env.REACT_APP_API_URL}/blocks/${profileData.id}/status`,
              {
                headers: {
                  "Content-Type": "application/json",
                  Accept: "application/json",
                  Authorization: `Bearer ${token}`,
                },
              }
          );

          const blockData = await blockResponse.json();
          if (!blockResponse.ok) {
            throw new Error(blockData.message || "Lỗi khi kiểm tra trạng thái chặn.");
          }

          if (blockData.isBlocked) {
            setIsUserBlocked(true);
            setLoading(false);
            return;
          }
        }

        setUserProfile({
          ...profileData,
          id: profileData.id,
          postCount: profileData.postCount || 0,
          website: profileData.website || "",
          isPremium: profileData.isPremium || false,
          profileImageUrl: profileData.profileImageUrl || "https://via.placeholder.com/150?text=Avatar",
        });

        // Chỉ lấy bài đăng nếu có quyền truy cập (bio không null)
        if (profileData.bio !== null || user.username === username) {
          const postsResponse = await fetch(
              `${process.env.REACT_APP_API_URL}/posts/user/${username}`,
              {
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
              }
          );

          const postsData = await postsResponse.json();
          console.log("Posts API response:", postsData); // Debug
          if (!postsResponse.ok) {
            throw new Error(postsData.message || "Lỗi khi lấy bài đăng.");
          }

          setPosts(Array.isArray(postsData.data) ? postsData.data : []);
        } else {
          setPosts([]);
        }

        if (user.username === username) {
          const sentRequestsResponse = await fetch(
              `${process.env.REACT_APP_API_URL}/friends/users/sent-pending?page=0&size=10`,
              {
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
              }
          );

          const sentRequestsData = await sentRequestsResponse.json();
          if (sentRequestsResponse.ok) {
            setSentRequests(sentRequestsData.data.content || []);
          }
        }
      } catch (error) {
        console.error("Lỗi khi lấy hồ sơ:", error);
        toast.error(error.message || "Lỗi khi lấy hồ sơ.");
        setUserProfile(null);
        setPosts([]);
        setSentRequests([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, username, navigate]);

  const handleBlockToggle = async () => {
    if (!user) {
      navigate("/");
      return;
    }

    const token = sessionStorage.getItem("token") || localStorage.getItem("token");
    if (!token) {
      toast.error("Không tìm thấy token. Vui lòng đăng nhập lại.");
      navigate("/");
      return;
    }

    try {
      const response = await fetch(
          `${process.env.REACT_APP_API_URL}/blocks/${userProfile.id}`,
          {
            method: isBlocked ? "DELETE" : "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
      );

      const data = await response.json();
      if (response.ok) {
        setIsBlocked(!isBlocked);
        toast.success(isBlocked ? "Đã bỏ chặn người dùng!" : "Đã chặn người dùng!");
      } else {
        throw new Error(data.message || (isBlocked ? "Lỗi khi bỏ chặn." : "Lỗi khi chặn người dùng."));
      }
    } catch (error) {
      console.error("Lỗi khi xử lý chặn:", error);
      toast.error(error.message || "Lỗi khi xử lý chặn.");
    }
  };

  const handleEditProfile = (updatedProfile) => {
    if (!updatedProfile) {
      toast.error("Không thể cập nhật hồ sơ.");
      return;
    }

    setUserProfile(updatedProfile);
    setUser(updatedProfile);
    localStorage.setItem("user", JSON.stringify(updatedProfile));
    toast.success("Cập nhật hồ sơ thành công!");
  };

  const fetchProfileAndPosts = async () => {
    const token = sessionStorage.getItem("token") || localStorage.getItem("token");
    if (!token) {
      toast.error("Không tìm thấy token. Vui lòng đăng nhập lại!");
      navigate("/");
      return;
    }

    try {
      const profileResponse = await fetch(
          `${process.env.REACT_APP_API_URL}/user/profile/${username}`,
          {
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
      );

      const profileData = await profileResponse.json();
      if (!profileResponse.ok) {
        throw new Error(profileData.message || "Không thể lấy thông tin hồ sơ!");
      }

      setUserProfile({
        ...profileData,
        id: profileData.id,
        postCount: profileData.postCount || 0,
        website: profileData.website || "",
        isPremium: profileData.isPremium || false,
        profileImageUrl: profileData.profileImageUrl || "https://via.placeholder.com/150?text=Avatar",
      });

      const postsResponse = await fetch(
          `${process.env.REACT_APP_API_URL}/posts/user/${username}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
      );

      const postsData = await postsResponse.json();
      console.log("Posts refresh API response:", postsData); // Debug
      if (!postsResponse.ok) {
        throw new Error(postsData.message || "Không thể lấy bài đăng!");
      }

      setPosts(Array.isArray(postsData.data) ? postsData.data : []);

      if (user.username === username) {
        const sentRequestsResponse = await fetch(
            `${process.env.REACT_APP_API_URL}/friends/users/sent-pending?page=0&size=10`,
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            }
        );

        const sentRequestsData = await sentRequestsResponse.json();
        if (sentRequestsResponse.ok) {
          setSentRequests(sentRequestsData.data.content || []);
        }
      }
    } catch (error) {
      console.error("Lỗi khi làm mới dữ liệu:", error);
      toast.error(error.message || "Lỗi khi làm mới dữ liệu!");
    }
  };

  const renderTabContent = () => {
    // Thêm kiểm tra quyền truy cập
    const hasAccess = userProfile?.bio !== null || user?.username === username;
    if (!hasAccess) {
      return <p className="text-dark text-center p-4">Bạn không có quyền xem nội dung này.</p>;
    }

    if (activeTab === "posts") {
      return posts.length > 0 ? (
          posts.map((item) => (
              <TweetCard
                  key={item.id}
                  tweet={item}
                  onPostUpdate={fetchProfileAndPosts}
              />
          ))
      ) : (
          <p className="text-dark text-center p-4">Không có bài đăng nào.</p>
      );
    }

    if (activeTab === "sentRequests") {
      return sentRequests.length > 0 ? (
          <ListGroup>
            {sentRequests.map((req) => (
                <ListGroup.Item
                    key={`request-${req.id}`}
                    className="d-flex align-items-center justify-content-between"
                >
                  <div className="d-flex align-items-center">
                    <Image
                        src={mediaUrl || "https://via.placeholder.com/40?text=Avatar"}
                        roundedCircle
                        width={40}
                        height={40}
                        className="me-2"
                        alt="Avatar"
                    />
                    <div>
                      <strong>{req.displayName || req.username}</strong>
                      <p className="text-muted small mb-0">@{req.username}</p>
                    </div>
                  </div>
                  <FriendshipButton
                      targetId={req.id}
                      onAction={() => fetchProfileAndPosts()}
                  />
                </ListGroup.Item>
            ))}
          </ListGroup>
      ) : (
          <p className="text-dark text-center p-4">
            Không có yêu cầu kết bạn đã gửi.
          </p>
      );
    }

    if (activeTab === "shares") {
      return (
          <p className="text-dark text-center p-4">Không có bài chia sẻ nào.</p>
      );
    }

    if (activeTab === "savedArticles") {
      return (
          <p className="text-dark text-center p-4">
            Không có bài viết đã lưu nào.
          </p>
      );
    }

    return null; // Dự phòng cho các tab không xác định
  };

  if (loading) {
    return (
        <div className="d-flex justify-content-center align-items-center min-vh-100">
          <Spinner animation="border" role="status" />
        </div>
    );
  }

  if (isUserBlocked) {
    return (
        <div className="text-center p-4">
          <p className="text-dark">Xin lỗi, hiện tại không thể tìm thấy người dùng.</p>
          <Button variant="primary" onClick={() => navigate("/home")}>
            Quay lại trang chủ
          </Button>
        </div>
    );
  }

  if (!userProfile) {
    return (
        <div className="text-center p-4">
          <p className="text-dark">
            Không thể tải thông tin hồ sơ. Vui lòng thử lại sau.
          </p>
          <Button variant="primary" onClick={() => navigate("/home")}>
            Quay lại trang chủ
          </Button>
        </div>
    );
  }

  const isOwnProfile = user?.username === username;
  const hasAccess = userProfile?.bio !== null || isOwnProfile; // Thêm kiểm tra quyền

  return (
      <>
        <ToastContainer />
        <Container fluid className="min-vh-100 p-0">
          <div
              className="sticky-top bg-white border-bottom py-2"
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
                    <h5 className="mb-0 fw-bold text-dark">{userProfile.displayName}</h5>
                    <span className="text-dark small">
                    {hasAccess ? `${userProfile.postCount || 0} bài đăng` : "Hồ sơ bị hạn chế"}
                  </span>
                  </div>
                </Col>
              </Row>
            </Container>
          </div>

          <Container fluid className="flex-grow-1">
            <Row className="h-100">
              <Col xs={0} lg={3} className="d-none d-lg-block p-0">
                <SidebarLeft />
              </Col>

              <Col xs={12} lg={6} className="px-md-0">
                <div className="position-relative p-3">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Image
                        src={
                            userProfile.profileImageUrl ||
                            "https://via.placeholder.com/150?text=Avatar"
                        }
                        roundedCircle
                        className="border border-white border-4"
                        style={{
                          width: "150px",
                          height: "150px",
                          objectFit: "cover",
                          zIndex: 2,
                        }}
                        alt="Profile"
                    />
                    <div className="d-flex align-items-center">
                      {isOwnProfile ? (
                          <Button
                              variant="primary"
                              className="rounded-pill px-3 py-2"
                              onClick={() => setShowEditModal(true)}
                          >
                            Chỉnh sửa
                          </Button>
                      ) : (
                          <>
                            <FollowActionButton
                                targetId={userProfile.id}
                                disabled={isBlocked}
                                onFollowChange={(isFollowing) =>
                                    setUserProfile((prev) => ({
                                      ...prev,
                                      followerCount: prev.followerCount + (isFollowing ? 1 : -1),
                                    }))
                                }
                            />
                            {!isBlocked && <FriendshipButton targetId={userProfile.id} />}
                            <Button
                                variant={isBlocked ? "outline-secondary" : "outline-danger"}
                                className="rounded-pill ms-2 px-3 py-1"
                                onClick={handleBlockToggle}
                            >
                              <FaUserSlash className="me-1" />
                              {isBlocked ? "Bỏ chặn" : "Chặn"}
                            </Button>
                          </>
                      )}
                    </div>
                  </div>

                  <h4 className="mb-0 fw-bold text-dark">{userProfile.displayName}</h4>
                  <p className="text-dark small mb-2">@{userProfile.username}</p>
                  {hasAccess ? (
                      <>
                        {userProfile.bio && <p className="mb-2 text-dark">{userProfile.bio}</p>}
                        {userProfile.location && (
                            <p className="text-secondary small d-flex align-items-center mb-2">
                              <FaMapMarkerAlt size={16} className="me-2" /> {userProfile.location}
                            </p>
                        )}
                        {userProfile.website && (
                            <p className="text-secondary small d-flex align-items-center mb-2">
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
                        <p className="text-secondary small d-flex align-items-center mb-2">
                          <FaCalendarAlt size={16} className="me-2" /> Ngày sinh:{" "}
                          {userProfile.dateOfBirth
                              ? new Date(userProfile.dateOfBirth).toLocaleDateString("vi-VN")
                              : "Chưa cập nhật"}
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
                              <Button
                                  variant="link"
                                  className="ms-auto text-dark p-0"
                                  onClick={() => setShowPremiumAlert(false)}
                              >
                                ✕
                              </Button>
                            </div>
                        )}
                      </>
                  ) : (
                      <p className="text-dark mb-2">Bạn không có quyền xem thông tin chi tiết của hồ sơ này.</p>
                  )}

                  {hasAccess && (
                      <Nav variant="tabs" className="mt-4 profile-tabs nav-justified">
                        {["posts", "shares", "savedArticles", ...(isOwnProfile ? ["sentRequests"] : [])].map((tab) => (
                            <Nav.Item key={tab}>
                              <Nav.Link
                                  onClick={() => setActiveTab(tab)}
                                  className={`text-dark fw-bold ${activeTab === tab ? "active" : ""}`}
                              >
                                {tab === "posts" && "Bài đăng"}
                                {tab === "shares" && "Chia sẻ"}
                                {tab === "savedArticles" && "Bài viết đã lưu"}
                                {tab === "sentRequests" && "Yêu cầu đã gửi"}
                              </Nav.Link>
                            </Nav.Item>
                        ))}
                      </Nav>
                  )}

                  <div className="mt-0 border-top">{renderTabContent()}</div>
                </div>
              </Col>

              <Col xs={0} lg={3} className="d-none d-lg-block p-0">
                <SidebarRight />
              </Col>
            </Row>
          </Container>

          {isOwnProfile && (
              <EditProfileModal
                  show={showEditModal}
                  handleClose={() => setShowEditModal(false)}
                  userProfile={userProfile}
                  onSave={handleEditProfile}
                  username={username}
              />
          )}
        </Container>
      </>
  );
}

export default ProfilePage;