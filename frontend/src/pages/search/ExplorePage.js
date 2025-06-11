import React, { useState, useEffect, useContext } from "react";
import {
  Container,
  Row,
  Col,
  Form,
  InputGroup,
  Nav,
  Button,
  Image,
  ListGroup,
} from "react-bootstrap";
import { FaSearch, FaEllipsisH } from "react-icons/fa";
import SidebarLeft from "../../components/layout/SidebarLeft/SidebarLeft";
import SidebarRight from "../../components/layout/SidebarRight/SidebarRight";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

function ExplorePage() {
  const { user, token, isSyncing, loading } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("for-you");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();

  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  const searchUsers = async (keyword) => {
    if (!keyword.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    if (!token) {
      toast.error("Không tìm thấy token. Vui lòng đăng nhập lại.");
      navigate("/");
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `${
          process.env.REACT_APP_API_URL
        }/search/users?keyword=${encodeURIComponent(keyword)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.status === 401) {
        toast.error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
        sessionStorage.removeItem("token");
        localStorage.removeItem("token");
        navigate("/");
        return;
      }
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Lỗi API tìm kiếm (${response.status}): ${errorText}`);
      }
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      toast.error("Không thể tìm kiếm: " + error.message);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const debouncedSearch = debounce(searchUsers, 300);

  useEffect(() => {
    if (!loading && !isSyncing && searchKeyword.trim()) {
      debouncedSearch(searchKeyword);
    }
  }, [searchKeyword, loading, isSyncing]);

  const renderSearchResultSection = (items) => {
    if (!items || items.length === 0) return null;

    return (
      <>
        <ListGroup.Item className="bg-light fw-bold">Người dùng</ListGroup.Item>
        {items.map((item) => (
          <ListGroup.Item
            key={`user-${item.id}`}
            action
            className="d-flex align-items-start"
            onClick={() => navigate(`/profile/${item.username}`)}
          >
            <Image
              src={item.avatar || "https://via.placeholder.com/40"}
              roundedCircle
              width={30}
              height={30}
              className="me-2 mt-1"
            />
            <div>
              <strong>{item.displayName || item.username}</strong>
              {item.username && (
                <p className="text-muted small mb-0">@{item.username}</p>
              )}
              {item.bio && (
                <p className="text-muted small mb-0">
                  {item.bio.slice(0, 100)}...
                </p>
              )}
            </div>
          </ListGroup.Item>
        ))}
      </>
    );
  };

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

  const renderTabContent = () => (
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
                <InputGroup className="me-2">
                  <InputGroup.Text className="bg-light border border-light rounded-pill ps-3">
                    <FaSearch className="text-muted" />
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Tìm kiếm người dùng"
                    className="bg-light border border-light rounded-pill py-2"
                    style={{ height: "auto" }}
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                  />
                </InputGroup>
                {searchKeyword && (
                  <ListGroup
                    className="position-absolute w-100 mt-1 shadow-sm"
                    style={{
                      zIndex: 1000,
                      maxHeight: "400px",
                      overflowY: "auto",
                    }}
                  >
                    {isSearching ? (
                      <ListGroup.Item className="text-center">
                        <Spinner animation="border" size="sm" /> Đang tải...
                      </ListGroup.Item>
                    ) : (
                      <>
                        {renderSearchResultSection(searchResults)}
                        {searchResults.length === 0 && (
                          <ListGroup.Item>
                            Không tìm thấy kết quả.
                          </ListGroup.Item>
                        )}
                      </>
                    )}
                  </ListGroup>
                )}
              </Col>
            </Row>
            <Row>
              <Col xs={12} lg={6} className="mx-auto px-md-0">
                <Nav
                  variant="underline"
                  className="mt-2 profile-tabs nav-justified"
                >
                  {[
                    "for-you",
                    "trending",
                    "news",
                    "sports",
                    "entertainment",
                  ].map((tab) => (
                    <Nav.Item key={tab}>
                      <Nav.Link
                        onClick={() => setActiveTab(tab)}
                        className={`text-dark fw-bold ${
                          activeTab === tab ? "active" : ""
                        }`}
                      >
                        {
                          {
                            "for-you": "Cho Bạn",
                            trending: "Đang thịnh hành",
                            news: "Tin tức",
                            sports: "Thể thao",
                            entertainment: "Giải trí",
                          }[tab]
                        }
                      </Nav.Link>
                    </Nav.Item>
                  ))}
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
