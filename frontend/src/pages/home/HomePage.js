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
      user: { name: "Jane Doe", username: "janedoe", avatar: "https://via.placeholder.com/50?text=Jane" },
      content: "Just cloned Twitter's basic layout with React and Bootstrap! It's looking good. #ReactJS #Bootstrap5 #WebDev",
      imageUrl: null,
      timestamp: new Date("2025-05-25T05:00:00Z"),
      comments: 15,
      retweets: 5,
      likes: 30,
    },
    {
      id: 2,
      user: { name: "Amaoou_513", username: "Amaoou_513", avatar: "https://via.placeholder.com/50?text=Amaoou" },
      content: "",
      imageUrl: "https://via.placeholder.com/600x400/000000/ffffff?text=Image+1\n(Your+Image+Here)",
      timestamp: new Date("2025-05-25T04:30:00Z"),
      comments: 8,
      retweets: 2,
      likes: 45,
    },
    {
      id: 3,
      user: { name: "Another User", username: "another_user", avatar: "https://via.placeholder.com/50?text=User" },
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
      <div className="d-flex flex-column min-vh-100" style={{ backgroundColor: "#fff" }}>
        <Header />
        <Container fluid className="flex-grow-1">
          <Row className="h-100">
            <Col xs={0} md={0} lg={3} className="p-0">
              <SidebarLeft />
            </Col>
            <Col xs={12} lg={6} className="border-start border-end p-0">
              <div
                  className="sticky-top bg-white border-bottom fw-bold fs-5 px-3 py-2 d-flex justify-content-between align-items-center"
                  style={{ zIndex: 1020 }}
              >
                <span>Trang chủ</span>
              </div>
              <TweetInput loading={loading} setLoading={setLoading} />
              {loading ? (
                  <div className="d-flex justify-content-center py-4">
                    <Spinner animation="border" role="status" style={{ color: "#000" }} />
                  </div>
              ) : (
                  sampleTweets.map((tweet) => <TweetCard key={tweet.id} tweet={tweet} />)
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