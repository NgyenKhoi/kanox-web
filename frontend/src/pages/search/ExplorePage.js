import React, { useState, useEffect, useContext, useCallback } from "react";
import {
  Container,
  Row,
  Col,
  Form,
  InputGroup,
  Nav,
  Button,
  Image,
  Spinner,
  ListGroup,
} from "react-bootstrap";
import { FaSearch, FaEllipsisH } from "react-icons/fa";
import SidebarLeft from "../../components/layout/SidebarLeft/SidebarLeft";
import SidebarRight from "../../components/layout/SidebarRight/SidebarRight";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthContext } from "../../context/AuthContext";

function ExplorePage() {
  const { token } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("for-you");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [otherResults, setOtherResults] = useState([]); // Kết quả API thứ 2
  const [isLoading, setIsLoading] = useState(false);

  // Debounce function (useCallback + useRef alternative not strictly necessary here)
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  // API 1: Tìm kiếm người dùng
  const searchUsers = async (keyword) => {
    if (!keyword.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/search/users?keyword=${encodeURIComponent(
          keyword
        )}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        }
      );
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Lỗi API tìm kiếm người dùng (Mã: ${response.status}) - ${errorText}`
        );
      }
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error("Lỗi tìm kiếm người dùng:", error);
      toast.error("Không thể tìm kiếm người dùng: " + error.message);
    }
  };

  // API 2: Giả sử là tìm kiếm bài viết, tin tức hoặc nội dung khác
  const searchOther = async (keyword) => {
    if (!keyword.trim()) {
      setOtherResults([]);
      return;
    }

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/search/other?keyword=${encodeURIComponent(
          keyword
        )}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        }
      );
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Lỗi API tìm kiếm thứ hai (Mã: ${response.status}) - ${errorText}`
        );
      }
      const data = await response.json();
      setOtherResults(data);
    } catch (error) {
      console.error("Lỗi tìm kiếm API thứ hai:", error);
      toast.error("Không thể tìm kiếm dữ liệu khác: " + error.message);
    }
  };

  // Hàm gọi đồng thời 2 API
  const searchBothApis = async (keyword) => {
    if (!keyword.trim()) {
      setSearchResults([]);
      setOtherResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      await Promise.all([searchUsers(keyword), searchOther(keyword)]);
    } finally {
      setIsLoading(false);
    }
  };

  // Tạo debounce cho hàm searchBothApis
  const debouncedSearch = useCallback(debounce(searchBothApis, 300), [token]);

  // useEffect theo dõi searchKeyword
  useEffect(() => {
    debouncedSearch(searchKeyword);
  }, [searchKeyword, debouncedSearch]);

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

  const suggestedFollows = [
    {
      id: 1,
      name: "Người dùng 1",
      username: "@user1",
      avatar: "https://via.placeholder.com/40",
    },
    {
      id: 2,
      name: "Người dùng 2",
      username: "@user2",
      avatar: "https://via.placeholder.com/40",
    },
  ];

  const renderTabContent = () => {
    return (
      <div className="mt-0">
        {trendingTopics.length === 0 ? (
          <p className="text-muted text-center p-4">
            Không có chủ đề nào đang phổ biến.
          </p>
        ) : (
          trendingTopics.map((topic) => (
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
          ))
        )}
      </div>
    );
  };

  return (
    <div className="d-flex min-vh-100" style={{ backgroundColor: "#fff" }}>
      <div className="d-none d-lg-block">
        <SidebarLeft />
      </div>

      <div className="d-flex flex-column flex-grow-1">
        <div
          className="sticky-top bg-white border-bottom py-2"
          style={{ zIndex: 1020 }}
        >
          <Container fluid>
            <Row>
              <Col xs={12} lg={6} className="mx-auto px-md-0 position-relative">
                <InputGroup className="me-3">
                  <InputGroup.Text className="bg-white border border-dark rounded-pill ps-3">
                    <FaSearch className="text-muted" />
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Tìm kiếm người dùng"
                    className="bg-white border border-dark rounded-pill py-2"
                    style={{ height: "auto" }}
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                  />
                </InputGroup>

                {/* Dropdown kết quả tìm kiếm người dùng */}
                {searchKeyword && (
                  <ListGroup
                    className="position-absolute w-100 mt-1 shadow-sm"
                    style={{
                      zIndex: 1000,
                      maxHeight: "300px",
                      overflowY: "auto",
                    }}
                  >
                    {isLoading ? (
                      <ListGroup.Item className="text-center">
                        <Spinner animation="border" size="sm" /> Đang tải...
                      </ListGroup.Item>
                    ) : searchResults.length > 0 ? (
                      searchResults.map((user) => (
                        <ListGroup.Item
                          key={user.id}
                          action
                          className="d-flex align-items-center"
                          onClick={() => {
                            console.log("Đã chọn người dùng:", user);
                          }}
                        >
                          <Image
                            src={user.avatar || "https://via.placeholder.com/40"}
                            roundedCircle
                            width={30}
                            height={30}
                            className="me-2"
                          />
                          <div>
                            <strong>{user.displayName || user.username}</strong>
                            <p className="text-muted small mb-0">@{user.username}</p>
                          </div>
                        </ListGroup.Item>
                      ))
                    ) : (
                      <ListGroup.Item>Không tìm thấy người dùng.</ListGroup.Item>
                    )}
                  </ListGroup>
                )}

                {/* Dropdown kết quả tìm kiếm API thứ 2 */}
                {searchKeyword && !isLoading && (
                  <ListGroup
                    className="position-absolute w-100 mt-1 shadow-sm"
                    style={{
                      zIndex: 999,
                      maxHeight: "200px",
                      overflowY: "auto",
                      top: "350px", // hoặc điều chỉnh vị trí phù hợp để không chồng lên trên dropdown người dùng
                    }}
                  >
                    {otherResults.length > 0 ? (
                      otherResults.map((item, idx) => (
                        <ListGroup.Item
                          key={item.id || idx}
                          action
                          onClick={() => {
                            console.log("Chọn mục từ API thứ 2:", item);
                          }}
                        >
                          {/* Hiển thị tuỳ chỉnh theo cấu trúc dữ liệu trả về */}
                          <strong>{item.title || item.name || "Không có tên"}</strong>
                          <p className="text-muted small mb-0">{item.description || ""}</p>
                        </ListGroup.Item>
                      ))
                    ) : (
                      <ListGroup.Item>Không tìm thấy dữ liệu khác.</ListGroup.Item>
                    )}
                  </ListGroup>
                )}
              </Col>
            </Row>

            <Row>
              <Col xs={12} lg={6} className="mx-auto px-md-0">
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

        <Container fluid className="flex-grow-1">
          <Row className="h-100">
            <Col xs={12} lg={6} className="px-md-0 border-start border-end">
              {renderTabContent()}
            </Col>
            <Col
              xs={0}
              sm={0}
              md={0}
              lg={3}
              className="d-none d-lg-block border-start p-0"
            >
              <SidebarRight
                trendingTopics={trendingTopics}
                suggestedFollows={suggestedFollows}
              />
            </Col>
          </Row>
        </Container>
      </div>
    </div>
  );
}

export default ExplorePage;
