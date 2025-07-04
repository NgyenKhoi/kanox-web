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
import SidebarRight from "../../components/layout/SidebarRight/SidebarRight";
import FriendshipButton from "../../components/friendship/FriendshipButton";
import FollowActionButton from "../../components/utils/FollowActionButton";
import { AuthContext } from "../../context/AuthContext";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import useMedia from "../../hooks/useMedia";

function ProfilePage() {
  const {user, setUser} = useContext(AuthContext);
  const {username} = useParams();
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
  const {mediaUrl, loading: mediaLoading} = useMedia(userProfile?.id);
  const [savedPosts, setSavedPosts] = useState([]);
  const isOwnProfile = user?.username === username;
  const hasAccess = userProfile?.bio !== null || isOwnProfile;
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

      const token = sessionStorage.getItem("token") || localStorage.getItem("token");

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

  useEffect(() => {
    const fetchSavedPosts = async () => {
      const token = sessionStorage.getItem("token") || localStorage.getItem("token");
      if (!token || user?.username !== username) return;

      try {
        const response = await fetch(
            `${process.env.REACT_APP_API_URL}/posts/saved-posts`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
              },
            }
        );

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "Lỗi khi lấy bài viết đã lưu.");
        }

        setSavedPosts(Array.isArray(data.data) ? data.data : []);
      } catch (error) {
        console.error("Lỗi khi lấy bài viết đã lưu:", error);
        toast.error(error.message || "Không thể tải bài viết đã lưu!");
        setSavedPosts([]);
      }
    };

    if (activeTab === "savedArticles") {
      fetchSavedPosts();
    }
  }, [activeTab, user, username]);
  
  const handleBlockToggle = async () => {
    const token = sessionStorage.getItem("token") || localStorage.getItem("token");
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
    if (!hasAccess) {
      return (
          <p className="text-dark text-center p-4">
            Bạn không có quyền xem nội dung này.
          </p>
      );
    }

    const renderPostsList = (list) =>
        list.length > 0 ? (
            list.map((item) => (
                <TweetCard
                    key={item.id}
                    tweet={item}
                    onPostUpdate={fetchProfileAndPosts}
                />
            ))
        ) : (
            <p className="text-dark text-center p-4">Không có bài đăng nào.</p>
        );

    switch (activeTab) {
      case "posts":
        return renderPostsList(posts);

      case "shares":
        return (
            <p className="text-dark text-center p-4">
              Không có bài chia sẻ nào.
            </p>
        );

      case "savedArticles":
        return savedPosts.length > 0 ? (
            savedPosts.map((item) => (
                <TweetCard
                    key={item.id}
                    tweet={item}
                    onPostUpdate={fetchProfileAndPosts}
                />
            ))
        ) : (
            <p className="text-dark text-center p-4">
              Không có bài viết đã lưu nào.
            </p>
        );

      case "sentRequests":
        return sentRequests.length > 0 ? (
            <ListGroup>
              {sentRequests.map((req) => (
                  <ListGroup.Item
                      key={`request-${req.id}`}
                      className="d-flex align-items-center justify-between"
                  >
                    <div className="d-flex align-items-center gap-3">
                      <Image
                          src={mediaUrl || "https://via.placeholder.com/150?text=Avatar"}
                          roundedCircle
                          className="border"
                          style={{ width: 50, height: 50, objectFit: "cover" }}
                      />
                      <div>
                        <strong>{req.displayName || req.username}</strong>
                        <p className="text-muted small mb-0">@{req.username}</p>
                      </div>
                    </div>
                    <FriendshipButton
                        targetId={req.id}
                        onAction={fetchProfileAndPosts}
                    />
                  </ListGroup.Item>
              ))}
            </ListGroup>
        ) : (
            <p className="text-dark text-center p-4">
              Không có yêu cầu kết bạn đã gửi.
            </p>
        );

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

  return (
      <div className="flex flex-col min-h-screen bg-[var(--background-color)] text-[var(--text-color)]">
        <ToastContainer />

        <div className="sticky top-0 bg-[var(--background-color)] border-b border-gray-300 py-2 z-50">
          <div className="container mx-auto px-4 flex items-center">
            <Link to="/home" className="btn btn-light mr-3">
              <FaArrowLeft />
            </Link>
            <div>
              <h5 className="font-bold mb-0">{userProfile.displayName}</h5>
              <span className="text-sm">
              {hasAccess ? `${userProfile.postCount || 0} bài đăng` : "Hồ sơ bị hạn chế"}
            </span>
            </div>
          </div>
        </div>

        <div className="flex flex-grow container mx-auto px-4 py-4">
          <div className="w-full lg:w-2/3 pr-0 lg:pr-8">
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <Image
                    src={userProfile.profileImageUrl || "https://via.placeholder.com/150?text=Avatar"}
                    roundedCircle
                    className="border-4 border-white"
                    style={{ width: 150, height: 150, objectFit: "cover" }}
                />
                {isOwnProfile ? (
                    <Button variant="primary" onClick={() => setShowEditModal(true)}>
                      Chỉnh sửa
                    </Button>
                ) : (
                    <div className="flex gap-2">
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
                          onClick={() => handleBlockToggle()}
                      >
                        <FaUserSlash className="mr-1" /> {isBlocked ? "Bỏ chặn" : "Chặn"}
                      </Button>
                    </div>
                )}
              </div>

              <h4 className="font-bold mb-1">{userProfile.displayName}</h4>
              <p className="text-sm mb-1">@{userProfile.username}</p>

              {hasAccess && (
                  <>
                    {userProfile.bio && <p className="mb-2">{userProfile.bio}</p>}
                    {userProfile.location && (
                        <p className="text-sm flex items-center">
                          <FaMapMarkerAlt className="mr-2" /> {userProfile.location}
                        </p>
                    )}
                    {userProfile.website && (
                        <p className="text-sm flex items-center">
                          <FaLink className="mr-2" />
                          <a href={userProfile.website} className="text-blue-500" target="_blank" rel="noopener noreferrer">
                            {userProfile.website}
                          </a>
                        </p>
                    )}
                    <p className="text-sm flex items-center">
                      <FaCalendarAlt className="mr-2" /> Ngày sinh: {new Date(userProfile.dateOfBirth).toLocaleDateString("vi-VN")}
                    </p>
                    <p className="text-sm flex items-center">
                      <FaEllipsisH className="mr-2" />
                      Giới tính: {userProfile.gender === 0 ? "Nam" : userProfile.gender === 1 ? "Nữ" : "Khác"}
                    </p>
                  </>
              )}
            </div>

            {hasAccess && (
                <Nav variant="tabs" className="mb-4">
                  {["posts", "shares", "savedArticles", ...(isOwnProfile ? ["sentRequests"] : [])].map((tab) => (
                      <Nav.Item key={tab}>
                        <Nav.Link active={activeTab === tab} onClick={() => setActiveTab(tab)}>
                          {tab === "posts" && "Bài đăng"}
                          {tab === "shares" && "Chia sẻ"}
                          {tab === "savedArticles" && "Đã lưu"}
                        </Nav.Link>
                      </Nav.Item>
                  ))}
                </Nav>
            )}

            <div>
              {activeTab === "posts" && posts.map((item) => (
                  <TweetCard key={item.id} tweet={item} onPostUpdate={fetchProfileAndPosts} />
              ))}

              {activeTab === "sentRequests" && sentRequests.map((req) => (
                  <ListGroup.Item key={req.id} className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <Image src={mediaUrl || "https://via.placeholder.com/150?text=Avatar"} className="rounded-full" style={{ width: 50, height: 50 }} />
                      <div>
                        <strong>{req.displayName || req.username}</strong>
                        <p className="text-sm text-gray-500">@{req.username}</p>
                      </div>
                    </div>
                    <FriendshipButton targetId={req.id} onAction={fetchProfileAndPosts} />
                  </ListGroup.Item>
              ))}
            </div>
          </div>

          <div className="hidden lg:block lg:w-1/3">
            <SidebarRight />
          </div>
        </div>

        {isOwnProfile && (
            <EditProfileModal
                show={showEditModal}
                handleClose={() => setShowEditModal(false)}
                userProfile={userProfile}
                onSave={handleEditProfile}
                username={username}
            />
        )}
      </div>
  );
}

export default ProfilePage;
