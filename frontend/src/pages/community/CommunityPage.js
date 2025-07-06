import React, { useState, useEffect, useContext } from "react";
import { Container, Row, Col, Card, Spinner } from "react-bootstrap";
import {
  FaRegComment,
  FaRetweet,
  FaHeart,
  FaShareAlt,
  FaSearch,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { AuthContext } from "../../context/AuthContext";
import SidebarRight from "../../components/layout/SidebarRight/SidebarRight";
import CommunitySidebarLeft from "../../components/community/CommunitySidebarLeft";

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
  const handleGroupCreated = (newGroup) => {
    setYourGroups((prev) => [...prev, newGroup]);
  };

  // Fetch posts or groups based on viewMode
  useEffect(() => {
    if (!token || !user?.username) {
      setError("Vui lòng đăng nhập để xem nội dung.");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
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
              avatar: group.avatar || "https://via.placeholder.com/40",
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

  return (
    <Container
      fluid
      className="d-flex flex-grow-1 bg-[var(--background-color)] text-[var(--text-color)] transition-colors duration-200"
    >
      <Row className="w-100 justify-content-center">
        {/* Sidebar Left */}
        <Col xs={0} lg={3} className="p-0 d-none d-lg-block">
          <CommunitySidebarLeft
            selectedView={viewMode}
            onSelectView={setViewMode}
            joinedGroups={yourGroups}
            onGroupCreated={handleGroupCreated}
            onToggleDarkMode={handleToggleDarkMode}
            isDarkMode={isDarkMode}
          />
        </Col>

        {/* Center Content */}
        <Col xs={12} lg={8} className="py-3 border-start border-end">
          <div className="d-flex align-items-center mb-3 px-3">
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
                <Card key={post.id} className="mb-3">
                  <Card.Body>
                    <div className="d-flex align-items-start mb-2">
                      <img
                        src={post.groupAvatarUrl}
                        alt="Group Avatar"
                        className="rounded-circle me-2"
                        width={30}
                        height={30}
                      />
                      <div>
                        <span
                          onClick={() => handleCommunityClick(post.groupId)}
                          className="fw-bold me-2"
                          style={{ cursor: "pointer" }}
                        >
                          {post.groupName}
                        </span>
                        <div className="text-muted small">
                          {post.owner.username} @{post.owner.username} ·{" "}
                          {new Date(post.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <Card.Text>{post.content}</Card.Text>
                    {post.mediaUrls && post.mediaUrls.length > 0 && (
                      <img
                        src={post.mediaUrls[0]}
                        className="img-fluid rounded"
                        alt="Post"
                      />
                    )}
                    <div className="d-flex justify-content-around mt-2 text-muted">
                      <div>
                        <FaRegComment /> {post.commentCount}
                      </div>
                      <div>
                        <FaRetweet /> {post.shareCount}
                      </div>
                      <div>
                        <FaHeart /> {post.likeCount}
                      </div>
                      <div>
                        <FaShareAlt /> {post.shareCount}
                      </div>
                    </div>
                  </Card.Body>
                </Card>
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
                      <button className="btn btn-primary btn-sm">
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
