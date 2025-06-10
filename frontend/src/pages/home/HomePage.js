/* eslint-disable no-undef */
import React, { useState, useEffect, useContext } from "react";
import { Container, Row, Col, Spinner } from "react-bootstrap";
import Header from "../../components/layout/Header/Header"; // Make sure this is used or removed if not needed
import SidebarLeft from "../../components/layout/SidebarLeft/SidebarLeft";
import SidebarRight from "../../components/layout/SidebarRight/SidebarRight";
import TweetInput from "../../components/posts/TweetInput/TweetInput"; // This will be the direct input on the page
import TweetCard from "../../components/posts/TweetCard/TweetCard";
import { AuthContext } from "../../context/AuthContext";

function HomePage() {
  const { user } = useContext(AuthContext);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
  }, [user]);

  // Function to handle post success from both TweetInput (on page) and CreatePostModal
  const handlePostSuccess = (newPost) => {
    setPosts((prev) => [newPost, ...prev]);
    // Optionally close the modal here if not handled by CreatePostModal itself
    // setShowCreatePostModal(false);
  };

  return (
    <div
      className="d-flex flex-column min-vh-100"
      style={{ backgroundColor: "#fff" }}
    >
      {/* <Header /> */}{" "}
      {/* Header is commented out, consider if you need it */}
      <Container fluid className="flex-grow-1">
        <Row className="h-100">
          <Col xs={0} md={0} lg={3} className="p-0">
            {/* Pass setShowCreatePostModal to SidebarLeft */}
            <SidebarLeft onShowCreatePost={onShowCreatePost} />
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
      {/* The CreatePostModal component */}
    </div>
  );
}

export default HomePage;
