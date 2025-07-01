import React, { useState, useEffect, useContext } from "react";
import { Container, Row, Col, Spinner } from "react-bootstrap";
import SidebarRight from "../../components/layout/SidebarRight/SidebarRight";
import TweetInput from "../../components/posts/TweetInput/TweetInput";
import TweetCard from "../../components/posts/TweetCard/TweetCard";
import { AuthContext } from "../../context/AuthContext";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function HomePage({ onShowCreatePost, onToggleDarkMode }) {
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
      <div className="d-flex flex-column min-vh-100 bg-[var(--background-color)]">
        <Container fluid className="flex-grow-1">
          <Row className="h-100">
            <Col xs={12} className="p-0">
              <div
                  className="sticky-top border-bottom fw-bold fs-5 px-3 py-2 d-flex justify-content-between align-items-center"
                  style={{ zIndex: 1020 }}
              >
                <span className="text-[var(--text-color)]">Trang chủ</span>
              </div>
              <TweetInput postOnSuccess={handlePostSuccess} />
              {loading ? (
                  <div className="d-flex justify-content-center py-4">
                    <Spinner animation="border" role="status" style={{ color: "var(--text-color)" }} />
                  </div>
              ) : error ? (
                  <p className="text-danger text-center">{error}</p>
              ) : posts.length > 0 ? (
                  posts.map((tweet) => (
                      <TweetCard key={tweet.id} tweet={tweet} onPostUpdate={fetchPosts} />
                  ))
              ) : (
                  <p className="text-center p-4 text-[var(--text-color)]">No posts found.</p>
              )}
            </Col>
            <Col xs={0} lg={3} className="d-none d-lg-block border-start p-0">
              <SidebarRight />
            </Col>
          </Row>
        </Container>
      </div>
  );
}

export default HomePage;