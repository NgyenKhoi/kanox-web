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
  // SỬA: Sử dụng friendshipStatus trực tiếp từ backend (none, friends, pendingSent, pendingReceived)
  const [friendshipStatus, setFriendshipStatus] = useState("none");
  const [isBlocked, setIsBlocked] = useState(false);
  const [recentAction, setRecentAction] = useState(null);

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

  // ... (sampleData remains unchanged)

  useEffect(() => {
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

        // SỬA: Chỉ gọi API status nếu không có recentAction
        if (!recentAction) {
          const [followStatusResponse, friendshipStatusResponse, blockStatusResponse] = await Promise.all([
            fetch(`${process.env.REACT_APP_API_URL}/follows/status/${profileData.id}`, {
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
              },
            }),
            fetch(`${process.env.REACT_APP_API_URL}/friends/status/${profileData.id}`, {
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
              },
            }),
            fetch(`${process.env.REACT_APP_API_URL}/blocks/status/${profileData.id}`, {
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
              },
            }),
          ]);

          if (followStatusResponse.ok) {
            const followStatus = await followStatusResponse.json();
            setIsFollowing(followStatus.isFollowing);
          }

          if (friendshipStatusResponse.ok) {
            const friendshipData = await friendshipStatusResponse.json();
            // SỬA: Lưu trực tiếp status từ backend
            setFriendshipStatus(friendshipData.status || "none");
          }

          if (blockStatusResponse.ok) {
            const blockData = await blockStatusResponse.json();
            setIsBlocked(blockData.isBlocked);
          }
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

    fetchProfile();

    // SỬA: Cleanup recentAction sau 10 giây
    const timer = setTimeout(() => {
      setRecentAction(null);
    }, 10000);

    return () => clearTimeout(timer);
  }, [username, user, navigate, recentAction]);

  const handleFriendRequest = async (action) => {
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

    let url;
    let method = "POST";

    // SỬA: Cập nhật URL và method dựa trên action
    if (action === "send") {
      url = `${process.env.REACT_APP_API_URL}/friends/request/${userProfile.id}`;
    } else if (action === "cancel" || action === "unfriend") {
      method = "DELETE";
      url = `${process.env.REACT_APP_API_URL}/friends/${userProfile.id}`;
    } else if (action === "accept") {
      method = "PUT"; // SỬA: Sử dụng PUT theo FriendshipController
      url = `${process.env.REACT_APP_API_URL}/friends/accept/${userProfile.id}`;
    } else if (action === "decline") {
      method = "PUT"; // SỬA: Sử dụng PUT theo FriendshipController
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
        // SỬA: Cập nhật friendshipStatus dựa trên action
        if (action === "send") {
          setFriendshipStatus("pendingSent");
          setRecentAction({ type: "friend", value: "pendingSent" });
          toast.success("Đã gửi yêu cầu kết bạn!");
        } else if (action === "cancel") {
          setFriendshipStatus("none");
          setRecentAction({ type: "friend", value: "none" });
          toast.success("Đã hủy yêu cầu kết bạn!");
        } else if (action === "accept") {
          setFriendshipStatus("friends");
          setRecentAction({ type: "friend", value: "friends" });
          toast.success("Đã chấp nhận kết bạn!");
        } else if (action === "decline") {
          setFriendshipStatus("none");
          setRecentAction({ type: "friend", value: "none" });
          toast.success("Đã từ chối yêu cầu kết bạn!");
        } else if (action === "unfriend") {
          setFriendshipStatus("none");
          setRecentAction({ type: "friend", value: "none" });
          toast.success("Đã hủy kết bạn!");
        }
      } else {
        throw new Error(data.message || "Lỗi khi xử lý yêu cầu kết bạn.");
      }
    } catch (error) {
      console.error("Lỗi khi xử lý kết bạn:", error);
      toast.error(error.message || "Lỗi khi xử lý kết bạn.");
    }
  };

  // ... (handleFollowToggle, handleBlockToggle, handleEditProfile, fetchProfileAndPosts remain unchanged)

  const renderFriendButton = () => {
    // SỬA: Xử lý các trạng thái friendshipStatus từ backend
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
    } else if (friendshipStatus === "pendingSent") {
      return (
          <Button
              variant="outline-warning"
              className="rounded-pill ms-2 px-3 py-1"
              onClick={() => handleFriendRequest("cancel")}
          >
            <FaUserTimes className="me-1" /> Hủy yêu cầu
          </Button>
      );
    } else if (friendshipStatus === "pendingReceived") {
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

  // ... (rest of the component remains unchanged, including renderTabContent, loading state, and JSX return)

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
          {/* ... (rest of the JSX remains unchanged) */}
        </Container>
      </>
  );
}

export default ProfilePage;