/* eslint-disable react/jsx-no-comment-textnodes */
/* eslint-disable no-undef */
import React, { useState, useEffect, useContext } from "react";
import { Container, Row, Col, Spinner } from "react-bootstrap";
import SidebarLeft from "../../components/layout/SidebarLeft/SidebarLeft";
import SidebarRight from "../../components/layout/SidebarRight/SidebarRight";
import TweetInput from "../../components/posts/TweetInput/TweetInput";
import TweetCard from "../../components/posts/TweetCard/TweetCard";
import { AuthContext } from "../../context/AuthContext";
// import { toast } from "react-toastify"; // You might want to import this if you use toast locally

// YOU MUST REMOVE THE PROPS FROM HERE if App.js is NOT passing them.
function HomePage() {
  // Removed onShowCreatePost, isDarkMode, onToggleDarkMode from props here.
  const { user } = useContext(AuthContext);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Define local state/functions for SidebarLeft to consume if App.js doesn't pass them.
  // These will not interact with the global modal or dark mode state in App.js.
  const [localIsDarkMode, setLocalIsDarkMode] = useState(false); // Default local dark mode state
  const localOnToggleDarkMode = () => {
    setLocalIsDarkMode((prev) => !prev);
    console.log("Dark mode toggled locally within HomePage's sidebar.");
  };
  const localOnShowCreatePost = () => {
    // This function is a placeholder. It will not open the global modal in App.js.
    console.log(
      "Create Post button clicked from HomePage's Sidebar. (Modal control is outside HomePage)"
    );
    // If you want a local modal on HomePage, you'd define its state here.
  };

  const fetchPosts = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token"); // Use localStorage.getItem
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/posts/newsfeed`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch posts!");
      }
      const data = await response.json();
      setPosts(data);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts, user]); // Added fetchPosts to dependency array for ESLint

  // Define a local handlePostSuccess for the TweetInput on this page.
  // This will *not* be the same handlePostSuccess as defined in App.js for its modal.
  const handlePostSuccess = (newPost) => {
    setPosts((prev) => [newPost, ...prev]);
    // If you want a success toast here:
    // toast.success("Bài đăng của bạn đã được thêm!");
  };

  return (
    <div
      className="d-flex flex-column min-vh-100"
      style={{ backgroundColor: "#fff" }}
    >
      {/* <Header /> */}
      <Container fluid className="flex-grow-1">
        <Row className="h-100">
          <Col xs={0} md={0} lg={3} className="p-0">
            {/* Pass local functions/states to SidebarLeft since App.js isn't passing them */}
            <SidebarLeft
              onShowCreatePost={localOnShowCreatePost}
              isDarkMode={localIsDarkMode}
              onToggleDarkMode={localOnToggleDarkMode}
            />
          </Col>
          <Col xs={12} lg={6} className="border-start border-end p-0">
            <div
              className="sticky-top bg-white border-bottom fw-bold fs-5 px-3 py-2 d-flex justify-content-between align-items-center"
              style={{ zIndex: 1020 }}
            >
              <span>Trang chủ</span>
            </div>
            {/* Direct TweetInput on the homepage for quick posting */}
            <TweetInput postOnSuccess={handlePostSuccess} />
            {loading ? (
              <div className="d-flex justify-content-center py-4">
                <Spinner
                  animation="border"
                  role="status"
                  style={{ color: "#000" }}
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
                />
              ))
            ) : (
              <p className="text-center p-4">No posts found.</p>
            )}
          </Col>
          <Col xs={0} lg={3} className="d-none d-lg-block border-start p-0">
            <SidebarRight />
          </Col>
        </Row>
      </Container>
      {/* The CreatePostModal component is rendered in App.js, not here. */}
    </div>
  );
}

export default HomePage;
