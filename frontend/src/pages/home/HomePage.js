// src/pages/HomePage/HomePage.jsx
import React, { useState } from "react";
import { Container, Row, Col, Spinner } from "react-bootstrap";
import Header from "../../components/layout/Header/Header";
import SidebarLeft from "../../components/layout/SidebarLeft/SidebarLeft";
import SidebarRight from "../../components/layout/SidebarRight/SidebarRight";
import TweetInput from "../../components/posts/TweetInput/TweetInput";
import TweetCard from "../../components/posts/TweetCard/TweetCard";

function HomePage() {
  const sampleTweets = [
    {
      id: 1,
      user: { name: "Jane Doe", username: "janedoe", avatar: "https://via.placeholder.com/50" },
      content: "Just cloned Twitter's basic layout with React and Bootstrap! It's looking good. #ReactJS #Bootstrap5 #WebDev",
      imageUrl: null,
      timestamp: new Date("2025-05-25T05:00:00Z"),
      comments: 15,
      retweets: 5,
      likes: 30,
    },
    {
      id: 2,
      user: { name: "Amaoou_513", username: "Amaoou_513", avatar: "https://via.placeholder.com/50" },
      content: "",
      imageUrl: "https://via.placeholder.com/600x400/007bff/ffffff?text=Image+1\n(Your+Image+Here)",
      timestamp: new Date("2025-05-25T04:30:00Z"),
      comments: 8,
      retweets: 2,
      likes: 45,
    },
    {
      id: 3,
      user: { name: "Another User", username: "another_user", avatar: "https://via.placeholder.com/50" },
      content: "Learning about component-based architecture is crucial for scalable applications. #WebDev",
      imageUrl: null,
      timestamp: new Date("2025-05-24T18:00:00Z"),
      comments: 3,
      retweets: 1,
      likes: 12,
    },
  ];

  const [loading, setLoading] = useState(false);

  return (
      <div className="d-flex flex-column min-vh-100 bg-light">
        <Header />
        <Container fluid className="mt-0 pt-0">
          <Row>
            <Col xs={0} sm={0} md={0} lg={3} xl={3} className="d-none d-lg-flex justify-content-end align-items-stretch" style={{ minHeight: "80vh" }}>
              <SidebarLeft />
            </Col>

            <Col xs={12} sm={12} md={12} lg={6} xl={6} className="px-md-0 border-start border-end mt-5 pt-1 mt-lg-0 pt-lg-0">
              <div className="sticky-top bg-white border-bottom fw-bold fs-5 px-3 py-2 d-flex justify-content-between align-items-center d-lg-block d-none" style={{ zIndex: 1020 }}>
                <span>Trang chủ</span>
              </div>
              <TweetInput loading={loading} setLoading={setLoading} />
              {loading ? (
                  <div className="d-flex justify-content-center py-4">
                    <Spinner animation="border" role="status" />
                  </div>
              ) : (
                  sampleTweets.map((tweet) => <TweetCard key={tweet.id} tweet={tweet} />)
              )}
            </Col>

            <Col xs={0} sm={0} md={0} lg={3} xl={3} className="d-none d-lg-block ps-md-4">
              <SidebarRight />
            </Col>
          </Row>
        </Container>
      </div>
  );
}

export default HomePage;
