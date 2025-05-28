// src/pages/proflie/ProfilePage.js
import React, { useState } from "react";
import { Container, Row, Col, Image, Button, Nav } from "react-bootstrap";
import {
  FaArrowLeft,
  FaCalendarAlt,
  FaCheckCircle,
  FaEllipsisH,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import TweetCard from "../../components/posts/TweetCard/TweetCard"; // Import TweetCard để hiển thị bài đăng

function ProfilePage() {
  const [showAlert, setShowAlert] = useState(true); // State để kiểm soát việc hiển thị alert

  // Dữ liệu mẫu cho người dùng (có thể lấy từ API sau này)
  const userProfile = {
    name: "NAME",
    username: "example",
    postCount: 3,
    joinedDate: "tháng 5 năm 2025",
    following: 80,
    followers: 4,
    avatar: "https://via.placeholder.com/150", // Avatar lớn
    banner:
      "https://via.placeholder.com/600x200/007bff/ffffff?text=Your+Banner+Here", // Ảnh bìa
    verified: false, // Trạng thái xác minh tài khoản
  };

  const sampleTweets = [
    {
      id: 1,
      user: {
        name: "NAME",
        username: "example",
        avatar: "https://via.placeholder.com/50",
      },
      content: "First time on app! #KN",
      imageUrl: null,
      timestamp: new Date("2025-03-31T00:00:00Z"),
      comments: 0,
      retweets: 0,
      likes: 0,
    },
    // Thêm các bài đăng khác nếu cần để trang có nội dung cuộn
    {
      id: 2,
      user: {
        name: "NAME",
        username: "example",
        avatar: "https://via.placeholder.com/50",
      },
      content: "Thử đăng một bài mới trên trang profile của tôi.",
      imageUrl:
        "https://via.placeholder.com/600x400/FF5733/ffffff?text=Profile+Image",
      timestamp: new Date("2025-04-10T10:00:00Z"),
      comments: 2,
      retweets: 1,
      likes: 5,
    },
    {
      id: 3,
      user: {
        name: "NAME",
        username: "example",
        avatar: "https://via.placeholder.com/50",
      },
      content: "Yêu thích việc học React! #WebDev #ReactJS",
      imageUrl: null,
      timestamp: new Date("2025-04-15T14:30:00Z"),
      comments: 1,
      retweets: 0,
      likes: 3,
    },
  ];

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      {/* Header cho trang Profile */}
      <div
        className="sticky-top bg-white border-bottom py-2"
        style={{ zIndex: 1020 }}
      >
        <Container fluid>
          <Row>
            <Col
              xs={12}
              md={8}
              lg={6}
              xl={7}
              className="mx-auto d-flex align-items-center ps-md-0"
            >
              <Link to="/" className="btn btn-link text-dark me-3">
                <FaArrowLeft size={20} />
              </Link>
              <div>
                <h5 className="mb-0 fw-bold">{userProfile.name}</h5>
                <p className="text-muted small mb-0">
                  {userProfile.postCount} bài đăng
                </p>
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Main Profile Content */}
      <Container fluid className="flex-grow-1">
        <Row>
          {/* Left Sidebar (Empty or hidden for profile page) */}
          <Col
            xs={0}
            sm={0}
            md={0}
            lg={3}
            xl={2}
            className="d-none d-lg-block"
          ></Col>

          {/* Center Profile Column */}
          <Col
            xs={12}
            sm={12}
            md={12}
            lg={6}
            xl={7}
            className="px-md-0 border-start border-end"
          >
            {/* Banner Image */}
            <Image
              src={userProfile.banner}
              fluid
              className="w-100"
              style={{ height: "200px", objectFit: "cover" }}
            />

            <div className="position-relative p-3">
              {/* Avatar and Edit Profile Button */}
              <div className="d-flex justify-content-between align-items-end mb-3">
                <Image
                  src={userProfile.avatar}
                  roundedCircle
                  className="border border-white border-4"
                  style={{
                    width: "130px",
                    height: "130px",
                    objectFit: "cover",
                    marginTop: "-75px",
                    zIndex: 2,
                  }}
                />
                <Button
                  variant="outline-dark"
                  className="rounded-pill fw-bold px-3 py-2"
                >
                  Chỉnh sửa hồ sơ
                </Button>
              </div>

              {/* User Info */}
              <h4 className="mb-0 fw-bold">{userProfile.name}</h4>
              <p className="text-muted mb-2">@{userProfile.username}</p>

              <p className="text-muted d-flex align-items-center mb-2">
                <FaCalendarAlt size={16} className="me-2" />
                Tham gia {userProfile.joinedDate}
              </p>

              <div className="d-flex mb-3">
                <Link to="#" className="me-3 text-dark text-decoration-none">
                  <span className="fw-bold">{userProfile.following}</span>{" "}
                  <span className="text-muted">Đang theo dõi</span>
                </Link>
                <Link to="#" className="text-dark text-decoration-none">
                  <span className="fw-bold">{userProfile.followers}</span>{" "}
                  <span className="text-muted">Người theo dõi</span>
                </Link>
              </div>

              {/* Account Premium Alert */}
              {showAlert &&
                !userProfile.isPremium && ( // Chỉ hiển thị khi showAlert là true và userProfile.isPremium là false
                  <div
                    className="alert alert-success d-flex align-items-start"
                    role="alert"
                  >
                    <div>
                      <h6 className="alert-heading mb-1">
                        Bạn chưa đăng kí premium tài khoản{" "}
                        <FaCheckCircle className="text-primary" />
                      </h6>
                      <p className="mb-2">
                        Hãy đăng kí premium tài khoản để sử dụng tính năng ưu
                        tiên trả lời, phân tích, duyệt xem không có quảng cáo,
                        v.v. Nâng cấp hồ sơ ngay.
                      </p>
                      <Button
                        variant="dark"
                        className="rounded-pill px-4 fw-bold"
                      >
                        premium
                      </Button>
                    </div>
                    <Button
                      variant="link"
                      className="ms-auto text-dark p-0"
                      onClick={() => setShowAlert(false)} // Khi click sẽ ẩn alert
                    >
                      &times; {/* Dấu X để đóng alert */}
                    </Button>
                  </div>
                )}
              {/* Profile Navigation Tabs */}
              <Nav variant="underline" className="mt-4 profile-tabs">
                <Nav.Item>
                  <Nav.Link
                    as={Link}
                    to="/profile"
                    className="text-dark active fw-bold"
                  >
                    Bài đăng
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link
                    as={Link}
                    to="/profile/replies"
                    className="text-dark fw-bold"
                  >
                    Các phản hồi
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link
                    as={Link}
                    to="/profile/media"
                    className="text-dark fw-bold"
                  >
                    Phương tiện
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link
                    as={Link}
                    to="/profile/likes"
                    className="text-dark fw-bold"
                  >
                    Lượt thích
                  </Nav.Link>
                </Nav.Item>
              </Nav>
            </div>

            {/* User's Tweets */}
            <div className="mt-0 border-top">
              {sampleTweets.map((tweet) => (
                <TweetCard key={tweet.id} tweet={tweet} />
              ))}
            </div>
          </Col>

          {/* Right Sidebar (Empty or hidden for profile page) */}
          <Col
            xs={0}
            sm={0}
            md={0}
            lg={3}
            xl={3}
            className="d-none d-lg-block"
          ></Col>
        </Row>
      </Container>
    </div>
  );
}

export default ProfilePage;
