import React, { useState, useEffect, useContext } from "react";
import {
  Container,
  Row,
  Col,
  Image,
  Button,
  Nav,
  Spinner,
  Dropdown,
} from "react-bootstrap";
import {
  FaArrowLeft,
  FaCalendarAlt,
  FaCheckCircle,
  FaMapMarkerAlt,
  FaLink,
  FaEllipsisH,
  FaUserSlash,
  FaUserPlus,
  FaUserCheck,
  FaUserTimes,
} from "react-icons/fa";
import { Link, useParams, useNavigate } from "react-router-dom";
import TweetCard from "../../components/posts/TweetCard/TweetCard";
import EditProfileModal from "../../components/profile/EditProfileModal";
import SidebarLeft from "../../components/layout/SidebarLeft/SidebarLeft";
import SidebarRight from "../../components/layout/SidebarRight/SidebarRight";
import { AuthContext } from "../../context/AuthContext";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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
  const [isFollowing, setIsFollowing] = useState(false);
  const [friendshipStatus, setFriendshipStatus] = useState(null);
  const [isBlocked, setIsBlocked] = useState(false);

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

  const sampleData = {
    posts: [],
    shares: [
      {
        id: 201,
        user: {
          name: userProfile?.displayName || "Người dùng Test",
          username: userProfile?.username || "testuser",
        },
        content: "Chia sẻ bài đăng này vì quá hay! #Motivation",
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
        },
        content: "Một bài đăng thú vị về nghệ thuật! #Art",
        timestamp: new Date("2025-05-25T11:00:00Z"),
        comments: 1,
        retweets: 0,
        likes: 7,
      },
    ],
    savedArticles: [
      {
        id: 301,
        user: { name: "Người dùng Khác 1", username: "otheruser1" },
        content: "Bài đăng rất hay! Rất đồng ý.",
        timestamp: new Date("2025-05-29T00:00:00Z"),
        comments: 0,
        retweets: 0,
        likes: 0,
      },
      {
        id: 302,
        user: { name: "Người dùng Khác 2", username: "otheruser2" },
        content: "Hình ảnh này đẹp quá! Tuyệt vời. #Nature",
        timestamp: new Date("2025-05-28T16:00:00Z"),
        comments: 1,
        retweets: 0,
        likes: 0,
      },
    ],
  };

  // SỬA: Thêm hàm refreshStatuses để làm mới trạng thái theo dõi, kết bạn, chặn
  const refreshStatuses = async () => {
    const token = sessionStorage.getItem("token") || localStorage.getItem("token");
    if (!token || !userProfile?.id) {
      toast.error("Không tìm thấy token hoặc ID người dùng. Vui lòng đăng nhập lại.");
      navigate("/");
      return;
    }

    try {
      // Lấy trạng thái theo dõi
      const followStatusResponse = await fetch(
          `${process.env.REACT_APP_API_URL}/follows/status/${userProfile.id}`,
          {
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
      );
      const followStatus = await followStatusResponse.json();
      if (followStatusResponse.ok) {
        setIsFollowing(followStatus.isFollowing);
      }

      // Lấy trạng thái kết bạn
      const friendshipStatusResponse = await fetch(
          `${process.env.REACT_APP_API_URL}/friends/status/${userProfile.id}`,
          {
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
      );
      const friendshipData = await friendshipStatusResponse.json();
      if (friendshipStatusResponse.ok) {
        setFriendshipStatus(friendshipData.status);
      }

      // Lấy trạng thái chặn
      const blockStatusResponse = await fetch(
          `${process.env.REACT_APP_API_URL}/blocks/status/${userProfile.id}`,
          {
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
      );
      const blockStatus = await blockStatusResponse.json();
      if (blockStatusResponse.ok) {
        setIsBlocked(blockStatus.isBlocked);
      }
    } catch (error) {
      console.error("Lỗi khi làm mới trạng thái:", error);
      toast.error("Lỗi khi làm mới trạng thái.");
    }
  };

  // SỬA: Cập nhật useEffect và fetchProfile để gọi refreshStatuses
  useEffect(() => {
    fetchProfile();
  }, [user, username, navigate]);

  const fetchProfile = async () => {
    setLoading(true);
    if (!username || username === "undefined") {
      toast.error("Tên người dùng không hợp lệ.");
      setUserProfile(defaultUserProfile);
      setPosts([]);
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

      setUserProfile({
        ...profileData,
        id: profileData.id,
        banner: profileData.banner || "https://source.unsplash.com/1200x400/?nature,water",
        avatar: profileData.avatar || "https://source.unsplash.com/150x150/?portrait",
        postCount: profileData.postCount || 0,
        website: profileData.website || "",
        isPremium: profileData.isPremium || false,
      });

      if (user.username !== username) {
        await refreshStatuses(); // SỬA: Gọi refreshStatuses để lấy trạng thái theo dõi, kết bạn, chặn
      }

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
      if (!postsResponse.ok) {
        throw new Error(postsData.message || "Không thể lấy bài đăng!");
      }

      setPosts(postsData);
    } catch (error) {
      console.error("Lỗi khi lấy hồ sơ:", error);
      toast.error(error.message || "Lỗi khi lấy hồ sơ.");
      setUserProfile(defaultUserProfile);
    } finally {
      setLoading(false);
    }
  };

  // SỬA: Cập nhật handleFollowToggle để gọi refreshStatuses sau khi thực hiện
  const handleFollowToggle = async () => {
    if (!user || !userProfile?.id) {
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
          `${process.env.REACT_APP_API_URL}/follows/${userProfile.id}`,
          {
            method: isFollowing ? "DELETE" : "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
      );

      const data = await response.json();
      if (response.ok) {
        setIsFollowing(!isFollowing);
        setUserProfile((prev) => ({
          ...prev,
          followerCount: prev.followerCount + (isFollowing ? -1 : 1),
        }));
        toast.success(isFollowing ? "Đã hủy theo dõi!" : "Đã theo dõi!");
        await refreshStatuses(); // SỬA: Làm mới trạng thái sau khi thực hiện
      } else {
        throw new Error(data.message || (isFollowing ? "Lỗi khi ngừng theo dõi." : "Lỗi khi theo dõi người dùng."));
      }
    } catch (error) {
      console.error("Lỗi khi xử lý theo dõi:", error);
      toast.error(error.message || "Lỗi khi xử lý theo dõi.");
    }
  };

  // SỬA: Cập nhật handleFriendRequest để gọi refreshStatuses sau khi thực hiện
  const handleFriendRequest = async (action) => {
    if (!user || !userProfile?.id) {
      navigate("/");
      return;
    }

    const token = sessionStorage.getItem("token") || localStorage.getItem("token");
    if (!token) {
      toast.error("Không tìm thấy token. Vui lòng đăng nhập lại.");
      navigate("/");
      return;
    }

    let url;
    let method = "POST";
    let body = null;

    if (action === "send") {
      url = `${process.env.REACT_APP_API_URL}/friends/request/${userProfile.id}`;
      body = { targetUsername: username };
    } else if (action === "cancel" || action === "unfriend") {
      method = "DELETE";
      url = `${process.env.REACT_APP_API_URL}/friends/${userProfile.id}`;
    } else if (action === "accept") {
      method = "POST";
      url = `${process.env.REACT_APP_API_URL}/friends/accept/${userProfile.id}`;
    } else if (action === "decline") {
      method = "POST";
      url = `${process.env.REACT_APP_API_URL}/friends/reject/${userProfile.id}`;
    }

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: body ? JSON.stringify(body) : null,
      });

      const contentType = response.headers.get("content-type");
      let data;
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = { message: text };
      }

      if (response.ok) {
        if (action === "send") {
          setFriendshipStatus("pending");
          toast.success("Đã gửi yêu cầu kết bạn!");
        } else if (action === "cancel") {
          setFriendshipStatus(null);
          toast.success("Đã hủy yêu cầu kết bạn!");
        } else if (action === "accept") {
          setFriendshipStatus("friends");
          toast.success("Đã chấp nhận kết bạn!");
        } else if (action === "decline") {
          setFriendshipStatus(null);
          toast.success("Đã từ chối yêu cầu kết bạn!");
        } else if (action === "unfriend") {
          setFriendshipStatus(null);
          toast.success("Đã hủy kết bạn!");
        }
        await refreshStatuses(); // SỬA: Làm mới trạng thái sau khi thực hiện
      } else {
        throw new Error(data.message || "Lỗi khi xử lý yêu cầu kết bạn.");
      }
    } catch (error) {
      console.error("Lỗi khi xử lý kết bạn:", error);
      toast.error(error.message || "Lỗi khi xử lý kết bạn.");
    }
  };

  // SỬA: Cập nhật handleBlockToggle để gọi refreshStatuses sau khi thực hiện
  const handleBlockToggle = async () => {
    if (!user || !userProfile?.id) {
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

      const contentType = response.headers.get("content-type");
      let data;
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = { message: text };
      }

      if (response.ok) {
        setIsBlocked(!isBlocked);
        toast.success(isBlocked ? "Đã bỏ chặn người dùng!" : "Đã chặn người dùng!");
        if (!isBlocked) {
          setFriendshipStatus(null);
          setIsFollowing(false);
          setUserProfile((prev) => ({
            ...prev,
            followerCount: isFollowing ? prev.followerCount - 1 : prev.followerCount,
          }));
        }
        await refreshStatuses(); // SỬA: Làm mới trạng thái sau khi thực hiện
      } else {
        throw new Error(data.message || (isBlocked ? "Lỗi khi bỏ chặn." : "Lỗi khi chặn người dùng."));
      }
    } catch (error) {
      console.error("Lỗi khi xử lý chặn:", error);
      toast.error(error.message || "Lỗi khi xử lý chặn.");
    }
  };

  const handleEditProfile = async (updatedData) => {
    if (!user) {
      toast.error("Vui lòng đăng nhập để chỉnh sửa hồ sơ.");
      navigate("/");
      return;
    }

    const token = sessionStorage.getItem("token") || localStorage.getItem("token");
    if (!token) {
      toast.error("Không tìm thấy token. Vui lòng đăng nhập lại.");
      navigate("/");
      return;
    }

    const updatedProfile = { ...userProfile, ...updatedData };

    try {
      const response = await fetch(
          `${process.env.REACT_APP_API_URL}/user/profile/${username}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(updatedProfile),
          }
      );

      const contentType = response.headers.get("content-type");
      let data;
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = { message: text };
      }

      if (response.ok) {
        setUserProfile(updatedProfile);
        setUser(updatedProfile);
        toast.success("Cập nhật hồ sơ thành công!");
      } else {
        throw new Error(data.message || "Lỗi khi cập nhật hồ sơ.");
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật hồ sơ:", error);
      toast.error(error.message || "Lỗi khi cập nhật hồ sơ.");
    }
  };

  const fetchProfileAndPosts = async () => {
    const token = sessionStorage.getItem("token") || localStorage.getItem("token");
    if (!token) {
      toast.error("Không tìm thấy token. Vui lòng đăng nhập lại.");
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

      const profileContentType = profileResponse.headers.get("content-type");
      let profileData;
      if (profileContentType && profileContentType.includes("application/json")) {
        profileData = await profileResponse.json();
      } else {
        const text = await profileResponse.text();
        profileData = { message: text };
      }

      if (!profileResponse.ok) {
        throw new Error(profileData.message || "Không thể lấy thông tin hồ sơ!");
      }

      setUserProfile({
        ...profileData,
        postCount: profileData.postCount || 0,
        website: profileData.website || "",
        isPremium: profileData.isPremium || false,
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

      const postsContentType = postsResponse.headers.get("content-type");
      let postsData;
      if (postsContentType && postsContentType.includes("application/json")) {
        postsData = await postsResponse.json();
      } else {
        const text = await postsResponse.text();
        postsData = { message: text };
      }

      if (!postsResponse.ok) {
        throw new Error(postsData.message || "Không thể lấy bài đăng!");
      }

      setPosts(postsData);
    } catch (error) {
      console.error("Lỗi khi làm mới dữ liệu:", error);
      toast.error(error.message || "Lỗi khi làm mới dữ liệu.");
    }
  };

  const renderTabContent = () => {
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

  const renderFriendButton = () => {
    if (friendshipStatus === "friends") {
      return (
          <Button
              variant="outline-success"
              className="rounded-pill ms-2 px-3 py-1"
              onClick={() => handleFriendRequest("unfriend")}
          >
            <FaUserCheck className="me-1" /> Bạn bè
          </Button>
      );
    } else if (friendshipStatus === "pending") {
      return (
          <Button
              variant="outline-warning"
              className="rounded-pill ms-2 px-3 py-1"
              onClick={() => handleFriendRequest("cancel")}
          >
            <FaUserTimes className="me-1" /> Hủy yêu cầu
          </Button>
      );
    } else if (friendshipStatus === "requested") {
      return (
          <Dropdown className="d-inline-block ms-2">
            <Dropdown.Toggle
                variant="outline-primary"
                className="rounded-pill px-3 py-1"
            >
              <FaUserPlus className="me-1" /> Phản hồi
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item onClick={() => handleFriendRequest("accept")}>
                Chấp nhận
              </Dropdown.Item>
              <Dropdown.Item onClick={() => handleFriendRequest("decline")}>
                Từ chối
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
      );
    } else {
      return (
          <Button
              variant="outline-primary"
              className="rounded-pill ms-2 px-3 py-1"
              onClick={() => handleFriendRequest("send")}
          >
            <FaUserPlus className="me-1" /> Kết bạn
          </Button>
      );
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
                    <h5 className="mb-0 fw-bold text-dark">{userProfile.name}</h5>
                    <span className="text-dark small">
                    {userProfile.postCount || 0} bài đăng
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
                <Image
                    src={
                        userProfile.banner ||
                        "https://via.placeholder.com/1200x400?text=Banner"
                    }
                    fluid
                    className="w-100 border-bottom"
                    style={{ height: "200px", objectFit: "cover" }}
                />
                <div className="position-relative p-3">
                  <div className="d-flex justify-content-between align-items-end mb-3">
                    <Image
                        src={
                            userProfile.avatar ||
                            "https://via.placeholder.com/150?text=Avatar"
                        }
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
                    <div className="d-flex align-items-center">
                      {isOwnProfile ? (
                          <Button
                              variant="primary"
                              className="rounded-pill fw-bold px-3 py-2"
                              onClick={() => setShowEditModal(true)}
                          >
                            Chỉnh sửa
                          </Button>
                      ) : (
                          <>
                            <Button
                                variant={isFollowing ? "outline-primary" : "primary"}
                                className="rounded-pill fw-bold px-3 py-2"
                                onClick={handleFollowToggle}
                                disabled={isBlocked}
                            >
                              {isFollowing ? "Đang theo dõi" : "Theo dõi"}
                            </Button>
                            {!isBlocked && renderFriendButton()}
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
                          ×
                        </Button>
                      </div>
                  )}

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