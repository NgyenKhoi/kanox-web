import React, { useState, useEffect, useContext } from "react";
import { Container, Row, Col, Spinner, Card } from "react-bootstrap";
import { FaSearch } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { AuthContext } from "../../context/AuthContext";
import SidebarRight from "../../components/layout/SidebarRight/SidebarRight";
import CommunitySidebarLeft from "../../components/community/CommunitySidebarLeft";
import TweetCard from  "../../components/posts/TweetCard/TweetCard";

function CommunityPage() {
  const navigate = useNavigate();
  const {
    user,
    token,
    loading: authLoading,
    isSyncing,
  } = useContext(AuthContext);
  const [viewMode, setViewMode] = useState("feed"); // "feed" | "yourGroups"
  const [posts, setPosts] = useState([]);
  const [yourGroups, setYourGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(
      localStorage.getItem("theme") === "dark"
  );

  // Toggle dark mode
  const handleToggleDarkMode = () => {
    const newTheme = isDarkMode ? "light" : "dark";
    setIsDarkMode(!isDarkMode);
    localStorage.setItem("theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  // Callback to update group list when a new group is created
  const handleGroupCreated = async (newGroup) => {
    try {
      const res = await fetch(
          `${process.env.REACT_APP_API_URL}/groups/your-groups?username=${user.username}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
      );
      if (!res.ok) throw new Error("Không thể làm mới danh sách nhóm.");
      const data = await res.json();
      setYourGroups(
          data.map((group) => ({
            id: group.id,
            name: group.name,
            avatar: group.avatarUrl || "https://via.placeholder.com/40",
            description: group.description,
            isJoined: true,
          }))
      );
    } catch (err) {
      toast.error("Lỗi khi làm mới danh sách nhóm: " + err.message);
    }
  };

  // Fetch posts or groups based on viewMode
  const fetchData = async () => {
    if (!token || !user?.username) {
      setError("Vui lòng đăng nhập để xem nội dung.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (viewMode === "feed") {
        const res = await fetch(
            `${process.env.REACT_APP_API_URL}/posts/community-feed`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
        );
        if (!res.ok) throw new Error("Không thể lấy bài đăng.");
        const response = await res.json();
        setPosts(response.data || []);
      } else if (viewMode === "yourGroups") {
        const res = await fetch(
            `${process.env.REACT_APP_API_URL}/groups/your-groups?username=${user.username}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
        );
        if (!res.ok) throw new Error("Không thể lấy danh sách nhóm.");
        const data = await res.json();
        setYourGroups(
            data.map((group) => ({
              id: group.id,
              name: group.name,
              avatar: group.avatarUrl || "https://via.placeholder.com/40",
              description: group.description,
              isJoined: true,
            }))
        );
      }
    } catch (err) {
      setError("Lỗi khi tải dữ liệu: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [viewMode, token, user]);

  const handleCommunityClick = (id) => {
    navigate(`/community/${id}`);
  };

  // Show loading spinner if auth or syncing is in progress
  if (authLoading || isSyncing) {
    return (
        <div className="d-flex justify-content-center align-items-center min-vh-100">
          <Spinner animation="border" role="status" />
          <span className="ms-2">Đang tải dữ liệu...</span>
        </div>
    );
  }

  const handleJoinGroup = async (groupId) => {
    try {
      const response = await fetch(
          `${process.env.REACT_APP_API_URL}/groups/${groupId}/request-join`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ username: user.username }),
          }
      );
      if (!response.ok) throw new Error("Không thể gửi yêu cầu tham gia nhóm.");
      toast.success("Đã gửi yêu cầu tham gia nhóm!");
      fetchData(); // Làm mới danh sách nhóm
    } catch (err) {
      toast.error("Lỗi: " + err.message);
    }
  };

  return (
      <Container
          fluid
          className="d-flex flex-grow-1 bg-[var(--background-color)] text-[var(--text-color)] transition-colors duration-200"
      >
        <Row className="w-100 justify-content-center">
          {/* Sidebar Left */}
          <Col xs={0} lg={3} className="p-0 d-none d-lg-block">
            <div
                style={{
                  position: "sticky",
                  top: 0,
                  height: "100vh",
                  overflowY: "auto",
                }}
            >
              <CommunitySidebarLeft
                  selectedView={viewMode}
                  onSelectView={setViewMode}
                  joinedGroups={yourGroups}
                  onGroupCreated={handleGroupCreated}
                  onToggleDarkMode={handleToggleDarkMode}
                  isDarkMode={isDarkMode}
              />
            </div>
          </Col>

          {/* Center Content */}
          <Col xs={12} lg={8} className="p-0 border-start border-end">
            <div className="sticky top-0 z-[1020] bg-[var(--background-color)] text-[var(--text-color)] font-bold text-lg px-3 py-2 border-b shadow-sm d-flex justify-content-between align-items-center">
              <h2 className="me-auto">Cộng đồng</h2>
              <FaSearch size={20} />
            </div>

            {loading ? (
                <div className="text-center p-4">Đang tải...</div>
            ) : error ? (
                <div className="text-danger text-center p-4">{error}</div>
            ) : viewMode === "feed" ? (
                posts.length === 0 ? (
                    <div className="text-center text-muted p-4">
                      Không có bài đăng
                    </div>
                ) : (
                    posts.map((post) => (
                        <TweetCard
                            key={post.id}
                            tweet={post}
                            onPostUpdate={fetchData} // Gọi lại fetchData để làm mới danh sách bài đăng
                            savedPosts={posts.filter((p) => p.isSaved)} // Truyền danh sách bài đã lưu
                        />
                    ))
                )
            ) : (
                yourGroups.map((group) => (
                    <Card key={group.id} className="mb-3">
                      <Card.Body className="d-flex">
                        <img
                            src={group.avatar}
                            alt="Avatar"
                            className="rounded me-3"
                            style={{
                              width: "50px",
                              height: "50px",
                              objectFit: "cover",
                            }}
                        />
                        <div className="flex-grow-1">
                          <h5
                              className="mb-1"
                              style={{ cursor: "pointer" }}
                              onClick={() => handleCommunityClick(group.id)}
                          >
                            {group.name}
                          </h5>
                          <p className="mb-2 text-muted small">{group.description}</p>
                          {!group.isJoined && (
                              <button
                                  className="btn btn-primary btn-sm"
                                  onClick={() => handleJoinGroup(group.id)}
                              >
                                Tham gia
                              </button>
                          )}
                        </div>
                      </Card.Body>
                    </Card>
                ))
            )}
          </Col>

          {/* Sidebar Right */}
          <Col xs={0} lg={4} className="d-none d-lg-block border-start p-0">
            <SidebarRight />
          </Col>
        </Row>
      </Container>
  );
}

export default CommunityPage;