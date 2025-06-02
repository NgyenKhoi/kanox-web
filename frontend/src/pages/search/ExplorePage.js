import React, { useState } from "react";
import {
  Container,
  Row,
  Col,
  Form,
  InputGroup,
  Nav,
  Button,
  Image,
} from "react-bootstrap";
import { FaSearch, FaCog, FaEllipsisH } from "react-icons/fa";
import SidebarLeft from "../../components/layout/SidebarLeft/SidebarLeft";
import SidebarRight from "../../components/layout/SidebarRight/SidebarRight"; // Hoặc nội dung sidebar phải nếu có

function ExplorePage() {
  const [activeTab, setActiveTab] = useState("for-you"); // State để quản lý tab đang hoạt động

  // Dữ liệu giả cho các chủ đề đang nổi bật
  const trendingTopics = [
    {
      id: 1,
      category: "Chủ đề nổi trội ở Việt Nam",
      title: "cuội",
      posts: 587,
    },
    {
      id: 2,
      category: "Chủ đề nổi trội ở Việt Nam",
      title: "#khảo_oam",
      posts: 390,
    },
    {
      id: 3,
      category: "Chủ đề nổi trội ở Việt Nam",
      title: "Trung Quốc",
      posts: 197,
    },
    {
      id: 4,
      category: "Chủ đề nổi trội ở Việt Nam",
      title: "Incredible",
      posts: 197,
    },
    {
      id: 5,
      category: "Chủ đề nổi trội ở Việt Nam",
      title: "#QuangHungMasterDxForestival",
      posts: 2119,
    },
    {
      id: 6,
      category: "Chủ đề nổi trội ở Việt Nam",
      title: "#linglingkwong",
      posts: 84,
    },
    {
      id: 7,
      category: "Chủ đề nổi trội ở Việt Nam",
      title: "Movies",
      posts: 150,
    },
  ];

  // Hàm render nội dung cho các tab (hiện tại chỉ là danh sách trending)
  const renderTabContent = () => {
    // Trong thực tế, bạn sẽ lọc dữ liệu trendingTopics dựa trên activeTab
    // Ví dụ: if (activeTab === 'for-you') return trendingTopicsForYou;
    // Hiện tại, chúng ta sẽ hiển thị tất cả trending cho đơn giản
    return (
      <div className="mt-0">
        {trendingTopics.map((topic) => (
          <div
            key={topic.id}
            className="d-flex align-items-center justify-content-between p-3 border-bottom hover-bg-light"
          >
            <div>
              <p className="text-muted small mb-0">{topic.category}</p>
              <h6 className="fw-bold mb-0">{topic.title}</h6>
              <p className="text-muted small mb-0">{topic.posts} N bài đăng</p>
            </div>
            <Button variant="link" className="text-dark p-0">
              <FaEllipsisH />
            </Button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="d-flex min-vh-100 bg-light">
      {/* Sidebar trái */}
      <div className="d-none d-lg-block">
        <SidebarLeft />
      </div>

      {/* Main Content Area */}
      <div className="d-flex flex-column flex-grow-1">
        {/* Header/Search Bar */}
        <div
          className="sticky-top bg-white border-bottom py-2"
          style={{ zIndex: 1020 }}
        >
          <Container fluid>
            <Row>
              <Col
                xs={12}
                sm={12}
                md={12}
                lg={{ span: 6, offset: 3 }} // Centering for larger screens
                xl={{ span: 6, offset: 3 }} // Centering for extra-large screens
                className="px-md-0 border-start border-end mt-5 pt-1 mt-lg-0 pt-lg-0"
              >
                <InputGroup className="me-3">
                  <InputGroup.Text className="bg-light border-0 rounded-pill ps-3">
                    <FaSearch className="text-muted" />
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Tìm kiếm"
                    className="bg-light border-0 rounded-pill py-2"
                    style={{ height: "auto" }}
                  />
                </InputGroup>
              </Col>
            </Row>

            {/* Navigation Tabs for Explore */}
            <Row>
              {" "}
              {/* Add a new Row for centering the tabs */}
              <Col
                xs={12}
                sm={12}
                md={12}
                lg={{ span: 6, offset: 3 }} // Centering for larger screens
                xl={{ span: 6, offset: 3 }} // Centering for extra-large screens
                className="px-md-0 border-start border-end" // Ensure borders are applied correctly
              >
                <Nav
                  variant="underline"
                  className="mt-2 profile-tabs nav-justified explore-tabs"
                >
                  <Nav.Item>
                    <Nav.Link
                      onClick={() => setActiveTab("for-you")}
                      className={`text-dark fw-bold ${
                        activeTab === "for-you" ? "active" : ""
                      }`}
                    >
                      Cho Bạn
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link
                      onClick={() => setActiveTab("trending")}
                      className={`text-dark fw-bold ${
                        activeTab === "trending" ? "active" : ""
                      }`}
                    >
                      Đang phổ biến
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link
                      onClick={() => setActiveTab("news")}
                      className={`text-dark fw-bold ${
                        activeTab === "news" ? "active" : ""
                      }`}
                    >
                      Tin tức
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link
                      onClick={() => setActiveTab("sports")}
                      className={`text-dark fw-bold ${
                        activeTab === "sports" ? "active" : ""
                      }`}
                    >
                      Thể thao
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link
                      onClick={() => setActiveTab("entertainment")}
                      className={`text-dark fw-bold ${
                        activeTab === "entertainment" ? "active" : ""
                      }`}
                    >
                      Giải trí
                    </Nav.Link>
                  </Nav.Item>
                </Nav>
              </Col>
            </Row>
          </Container>
        </div>

        {/* Content based on active tab */}
        <Container fluid className="flex-grow-1">
          <Row className="h-100">
            <Col
              xs={12}
              sm={12}
              md={12}
              lg={8} // This column still spans 8 units to display content
              xl={7} // This column still spans 7 units to display content
              className="px-md-0 border-start border-end"
            >
              {renderTabContent()}
            </Col>
            {/* Sidebar phải cho trang khám phá (nếu có) */}
            <Col
              xs={0}
              sm={0}
              md={0}
              lg={4}
              xl={3}
              className="d-none d-lg-block border-start border-end"
            >
              {/* <SidebarRight />{" "} */}
              {/* Hoặc nội dung gợi ý theo dõi/trending khác */}
              <div className="p-3 sticky-top" style={{ top: "60px" }}>
                <h5 className="fw-bold mb-3">Gợi ý theo dõi</h5>
                <div className="mb-3 d-flex align-items-center">
                  <Image
                    src="https://via.placeholder.com/40"
                    roundedCircle
                    className="me-2"
                  />
                  <span className="flex-grow-1">Người dùng 1</span>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="ms-auto rounded-pill"
                  >
                    Theo dõi
                  </Button>
                </div>
                <div className="mb-3 d-flex align-items-center">
                  <Image
                    src="https://via.placeholder.com/40"
                    roundedCircle
                    className="me-2"
                  />
                  <span className="flex-grow-1">Người dùng 2</span>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="ms-auto rounded-pill"
                  >
                    Theo dõi
                  </Button>
                </div>

                <h5 className="fw-bold mt-4 mb-3">Những điều đang diễn ra</h5>
                <p className="mb-1">#TrendingTopic1</p>
                <p className="mb-1">#TrendingTopic2</p>
              </div>
            </Col>
          </Row>
        </Container>
      </div>
    </div>
  );
}

export default ExplorePage;
