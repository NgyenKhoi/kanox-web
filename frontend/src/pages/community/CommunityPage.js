// CommunityPage.js (Updated)
/* eslint-disable react/jsx-no-comment-textnodes */
/* eslint-disable no-undef */
import React, { useState, useEffect } from "react";
import { Container, Row, Col, Nav, Card, Button } from "react-bootstrap";
import {
  FaRegComment,
  FaRetweet,
  FaHeart,
  FaShareAlt,
  FaSearch,
} from "react-icons/fa"; // Icons for engagement
import { Link, useNavigate } from "react-router-dom";
import SidebarRight from "../../components/layout/SidebarRight/SidebarRight"; // Assuming you have a right sidebar

// YOU MUST DESTRUCTURE THE PROPS HERE
function CommunityPage({ onShowCreatePost, isDarkMode, onToggleDarkMode }) {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("all"); // State for active category tab
  const [posts, setPosts] = useState([]); // State to hold community posts
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const categories = [
    { key: "all", label: "Tất cả" },
    { key: "sports", label: "Thể thao" },
    { key: "tech", label: "Công nghệ" },
    { key: "art", label: "Nghệ thuật" },
    { key: "gaming", label: "Chơi game" },
    { key: "politics", label: "Chính trị" },
  ];

  // Dummy data for posts (replace with actual API fetch)
  const dummyPosts = [
    {
      id: "post1",
      communityId: "cookie-run-kingdom",
      communityName: "Cookie Run Kingdom",
      communityAvatar: "https://via.placeholder.com/30/FFC0CB?text=CR", // Example avatar
      isVerified: true,
      userAvatar: "https://via.placeholder.com/40/007bff?text=Y",
      username: "yapsama",
      userHandle: "@osadogling",
      time: "4 thg 6",
      content:
        "Are we ever gonna talk about the fact Shadow Milk was constantly sabotaging the others back then",
      imageUrl: "https://via.placeholder.com/500x300?text=Post+Image+1", // Placeholder for image
      comments: 34,
      retweets: 67,
      likes: 156,
      shares: 12,
    },
    {
      id: "post2",
      communityId: "web-dev-community",
      communityName: "Web Dev Community",
      communityAvatar: "https://via.placeholder.com/30/ADD8E6?text=WD",
      isVerified: false,
      userAvatar: "https://via.placeholder.com/40/FFA07A?text=D",
      username: "dev_master",
      userHandle: "@code_guru",
      time: "2 ngày trước",
      content:
        "Just deployed my new React app using Next.js! Turbopack stable, React 18 support, Improved caching, Better performance. Ai đã thử chưa? #NextJS #WebDev",
      imageUrl: "https://via.placeholder.com/500x300?text=Next.js+Post", // Placeholder for image
      comments: 89,
      retweets: 234,
      likes: 567,
      shares: 45,
    },
    // Add more dummy posts here
  ];

  useEffect(() => {
    // Simulate fetching posts based on activeCategory
    setLoading(true);
    setError(null);
    const fetchPosts = async () => {
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate API call delay
      try {
        // In a real app, you'd fetch from an API:
        // const response = await fetch(`/api/posts?category=${activeCategory}`);
        // const data = await response.json();
        const filteredPosts =
          activeCategory === "all"
            ? dummyPosts
            : dummyPosts.filter((post) => {
                // Simple filtering based on category, adjust for real categories/tags
                if (activeCategory === "gaming")
                  return post.communityId.includes("cookie-run");
                if (activeCategory === "tech")
                  return post.communityId.includes("web-dev");
                return true; // For other categories, implement real logic
              });
        setPosts(filteredPosts);
      } catch (err) {
        setError("Không thể tải bài đăng.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [activeCategory]);

  const handleCommunityNameClick = (communityId) => {
    navigate(`/community/${communityId}`); // Navigate to the specific community's detail page
  };

  return (
    <Container
      fluid
      className="community-page-container d-flex flex-grow-1 bg-[var(--background-color)] text-[var(--text-color)] transition-colors duration-200"
    >
      <Row className="w-100 justify-content-center">
        {/* Main Content Area */}
        <Col
          xs={12}
          lg={8}
          className="community-main-content border-start border-end py-3"
        >
          <div className="d-flex align-items-center mb-3 px-3">
            <h2 className="mb-0 me-auto bg-[var(--background-color)] text-[var(--text-color)] transition-colors duration-200">
              Cộng đồng
            </h2>
            <div className="search-icon me-3">
              <FaSearch size={20} />
            </div>
            <div className="settings-icon">
              <i className="bi bi-gear"></i>{" "}
              {/* Assuming Bootstrap Icons or similar */}
            </div>
          </div>

          {/* Category Tabs */}
          <Nav
            variant="underline"
            className="community-category-nav mb-4 bg-[var(--background-color)] text-[var(--text-color)] transition-colors duration-200"
          >
            {categories.map((category) => (
              <Nav.Item key={category.key}>
                <Nav.Link
                  eventKey={category.key}
                  active={activeCategory === category.key}
                  onClick={() => setActiveCategory(category.key)}
                >
                  {category.label}
                </Nav.Link>
              </Nav.Item>
            ))}
          </Nav>

          {/* Posts List */}
          {loading ? (
            <div className="text-center p-5">Đang tải bài đăng...</div>
          ) : error ? (
            <div className="text-center p-5 text-danger">{error}</div>
          ) : posts.length === 0 ? (
            <div className="text-center p-5 text-muted">
              Không có bài đăng nào trong danh mục này.
            </div>
          ) : (
            <div className="posts-list">
              {posts.map((post) => (
                <Card
                  key={post.id}
                  className="mb-3 post-card bg-[var(--background-color)] text-[var(--text-color)]"
                >
                  <Card.Body>
                    <div className="d-flex align-items-start mb-2">
                      <img
                        src={post.communityAvatar}
                        alt="Community Avatar"
                        className="rounded-circle me-2"
                        style={{
                          width: "30px",
                          height: "30px",
                          objectFit: "cover",
                        }}
                      />
                      <div className="flex-grow-1">
                        <div className="d-flex align-items-center">
                          <span
                            className="fw-bold community-name-link me-1"
                            onClick={() =>
                              handleCommunityNameClick(post.communityId)
                            }
                            style={{ cursor: "pointer" }}
                          >
                            {post.communityName}
                          </span>
                          {post.isVerified && (
                            <i className="bi bi-patch-check-fill text-primary ms-1"></i>
                          )}{" "}
                          {/* Verified badge */}
                        </div>
                        <div className="d-flex align-items-center text-muted small">
                          <img
                            src={post.userAvatar}
                            alt="User Avatar"
                            className="rounded-circle me-1"
                            style={{
                              width: "20px",
                              height: "20px",
                              objectFit: "cover",
                            }}
                          />
                          <span className="me-1">{post.username}</span>
                          <span>
                            {post.userHandle} · {post.time}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Card.Text>{post.content}</Card.Text>
                    {post.imageUrl && (
                      <div className="post-image-container mb-3">
                        <img
                          src={post.imageUrl}
                          alt="Post"
                          className="img-fluid rounded"
                        />
                      </div>
                    )}
                    <div className="d-flex justify-content-around post-actions mt-3">
                      <div className="d-flex align-items-center">
                        <FaRegComment className="me-1" /> {post.comments}
                      </div>
                      <div className="d-flex align-items-center">
                        <FaRetweet className="me-1" /> {post.retweets}
                      </div>
                      <div className="d-flex align-items-center">
                        <FaHeart className="me-1" /> {post.likes}
                      </div>
                      <div className="d-flex align-items-center">
                        <FaShareAlt className="me-1" /> {post.shares}
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              ))}
            </div>
          )}
        </Col>

        {/* Right Sidebar */}
        <Col
          xs={0}
          lg={4}
          className="d-none d-lg-block community-sidebar-right"
        >
          <SidebarRight />
        </Col>
      </Row>
    </Container>
  );
}

export default CommunityPage;
