import React, { useState, useEffect, useContext } from "react";
import { Container, Row, Col, Spinner } from "react-bootstrap";
import SidebarLeft from "../../components/layout/SidebarLeft/SidebarLeft";
import SidebarRight from "../../components/layout/SidebarRight/SidebarRight";
import TweetInput from "../../components/posts/TweetInput/TweetInput";
import TweetCard from "../../components/posts/TweetCard/TweetCard";
import { AuthContext } from "../../context/AuthContext";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function HomePage({ onShowCreatePost, isDarkMode, onToggleDarkMode }) {
  const { user } = useContext(AuthContext);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPosts = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.REACT_APP_API_URL}/posts/newsfeed`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch posts!");
      }
      const { message, data } = await response.json();
      console.log("Fetched posts:", data);
      if (Array.isArray(data)) {
        setPosts(data);
        toast.success(message || "Lấy newsfeed thành công");
      } else {
        setPosts([]);
        setError("Invalid data format from API");
        toast.error("Dữ liệu không đúng định dạng");
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [user]);

  const handlePostSuccess = (newPost) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  return (
      <div
          className="d-flex flex-column min-vh-100"
          style={{ backgroundColor: isDarkMode ? "#1a1a1a" : "#fff" }}
      >
        <Container fluid className="flex-grow-1">
          <Row className="h-100">
            <Col xs={0} md={0} lg={3} className="p-0">
              <SidebarLeft
                  onShowCreatePost={onShowCreatePost}
                  isDarkMode={isDarkMode}
                  onToggleDarkMode={onToggleDarkMode}
              />
            </Col>
            <Col xs={12} lg={6} className="border-start border-end p-0">
              <div
                  className="sticky-top bg-white border-bottom fw-bold fs-5 px-3 py-2 d-flex justify-content-between align-items-center"
                  style={{ zIndex: 1020, backgroundColor: isDarkMode ? "#1a1a1a" : "#fff", color: isDarkMode ? "#fff" : "#000" }}
              >
                <span>Trang chủ</span>
              </div>
              <TweetInput postOnSuccess={handlePostSuccess} />
              {loading ? (
                  <div className="d-flex justify-content-center py-4">
                    <Spinner
                        animation="border"
                        role="status"
                        style={{ color: isDarkMode ? "#fff" : "#000" }}
                    />
                  </div>
              ) : error ? (
                  <p className="text-danger text-center">{error}</p>
              ) : posts.length > 0 ? (
                  posts.map((tweet) => (
                      <TweetCard
                          key={tweet.id}
                          tweet={tweet}
                          onPostUpdate={fetchPosts}
                          isDarkMode={isDarkMode}
                      />
                  ))
              ) : (
                  <p className="text-center p-4" style={{ color: isDarkMode ? "#fff" : "#000" }}>No posts found.</p>
              )}
            </Col>
            <Col xs={0} lg={3} className="d-none d-lg-block border-start p-0">
              <SidebarRight isDarkMode={isDarkMode} />
            </Col>
          </Row>
        </Container>
      </div>
  );
}

export default HomePage;