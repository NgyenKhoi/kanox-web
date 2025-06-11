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
  const [searchResults, setSearchResults] = useState({
    users: [],
    groups: [],
    pages: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  const syncAllData = async () => {
    try {
      setIsSyncing(true);
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/search/sync`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) throw new Error("Lỗi khi đồng bộ dữ liệu");
      toast.success("Đã đồng bộ toàn bộ data sang Elasticsearch");
    } catch (error) {
      toast.error("Đồng bộ thất bại: " + error.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const searchAll = async (keyword) => {
    if (!keyword.trim()) {
      setSearchResults({ users: [], groups: [], pages: []});
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/search/all?keyword=${encodeURIComponent(keyword)}`,
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
        throw new Error(`Lỗi API tìm kiếm (${response.status}): ${errorText}`);
      }
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      toast.error("Không thể tìm kiếm: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const debouncedSearch = debounce(searchAll, 300);

  useEffect(() => {
    syncAllData();
  }, []);

  useEffect(() => {
    if (!isSyncing && searchKeyword.trim()) {
      debouncedSearch(searchKeyword);
    }
  }, [searchKeyword, isSyncing]);

  const renderSearchResultSection = (label, items, type) => {
    if (items.length === 0) return null;

    return (
      <>
        <ListGroup.Item className="bg-light fw-bold">{label}</ListGroup.Item>
        {items.map((item) => (
          <ListGroup.Item
            key={`${type}-${item.id}`}
            action
            className="d-flex align-items-start"
            onClick={() => console.log("Đã chọn:", item)}
          >
            <Image
              src={item.avatar || "https://via.placeholder.com/40"}
              roundedCircle
              width={30}
              height={30}
              className="me-2 mt-1"
            />
            <div>
              <strong>{item.displayName || item.name || item.username || item.title}</strong>
              {item.username && <p className="text-muted small mb-0">@{item.username}</p>}
              {item.content && <p className="text-muted small mb-0">{item.content.slice(0, 100)}...</p>}
            </div>
          </ListGroup.Item>
        ))}
      </>
    );
  };

  const trendingTopics = [
    { id: 1, category: "Chủ đề nổi trội ở Việt Nam", title: "cuội", posts: 587 },
    { id: 2, category: "Chủ đề nổi trội ở Việt Nam", title: "#khảo_oam", posts: 390 },
    { id: 3, category: "Chủ đề nổi trội ở Việt Nam", title: "Trung Quốc", posts: 197 },
    { id: 4, category: "Chủ đề nổi trội ở Việt Nam", title: "Incredible", posts: 197 },
    { id: 5, category: "Chủ đề nổi trội ở Việt Nam", title: "#QuangHungMasterDxForestival", posts: 2119 },
    { id: 6, category: "Chủ đề nổi trội ở Việt Nam", title: "#linglingkwong", posts: 84 },
    { id: 7, category: "Chủ đề nổi trội ở Việt Nam", title: "Movies", posts: 150 },
  ];

  const suggestedFollows = [
    { id: 1, name: "Người dùng 1", username: "@user1", avatar: "https://via.placeholder.com/40" },
    { id: 2, name: "Người dùng 2", username: "@user2", avatar: "https://via.placeholder.com/40" },
  ];

  const renderTabContent = () => (
    <div className="mt-0">
      {trendingTopics.length === 0 ? (
        <p className="text-muted text-center p-4">Không có chủ đề nào đang phổ biến.</p>
      ) : (
        trendingTopics.map((topic) => (
          <div key={topic.id} className="d-flex align-items-center justify-content-between p-3 border-bottom hover-bg-light">
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
        <div className="sticky-top bg-white border-bottom py-2" style={{ zIndex: 1020 }}>
          <Container fluid>
            <Row>
              <Col xs={12} lg={6} className="mx-auto px-md-0 position-relative">
                <InputGroup className="me-3">
                  <InputGroup.Text className="bg-white border border-dark rounded-pill ps-3">
                    <FaSearch className="text-muted" />
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Tìm kiếm người dùng, nhóm, trang hoặc bài viết"
                    className="bg-white border border-dark rounded-pill py-2"
                    style={{ height: "auto" }}
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                  />
                </InputGroup>
                {searchKeyword && (
                  <ListGroup
                    className="position-absolute w-100 mt-1 shadow-sm"
                    style={{ zIndex: 1000, maxHeight: "400px", overflowY: "auto" }}
                  >
                    {isLoading ? (
                      <ListGroup.Item className="text-center">
                        <Spinner animation="border" size="sm" /> Đang tải...
                      </ListGroup.Item>
                    ) : (
                      <>
                        {renderSearchResultSection("Người dùng", searchResults.users, "user")}
                        {renderSearchResultSection("Nhóm", searchResults.groups, "group")}
                        {renderSearchResultSection("Trang", searchResults.pages, "page")}
                        {renderSearchResultSection("Bài viết", searchResults.posts, "post")}
                        {Object.values(searchResults).every(arr => arr.length === 0) && (
                          <ListGroup.Item>Không tìm thấy kết quả.</ListGroup.Item>
                        )}
                      </>
                    )}
                  </ListGroup>
                )}
              </Col>
            </Row>
            <Row>
              <Col xs={12} lg={6} className="mx-auto px-md-0">
                <Nav variant="underline" className="mt-2 profile-tabs nav-justified explore-tabs">
                  {["for-you", "trending", "news", "sports", "entertainment"].map((tab) => (
                    <Nav.Item key={tab}>
                      <Nav.Link
                        onClick={() => setActiveTab(tab)}
                        className={`text-dark fw-bold ${activeTab === tab ? "active" : ""}`}
                      >
                        {{
                          "for-you": "Cho Bạn",
                          "trending": "Đang phổ biến",
                          "news": "Tin tức",
                          "sports": "Thể thao",
                          "entertainment": "Giải trí",
                        }[tab]}
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
            <Col xs={0} sm={0} md={0} lg={3} className="d-none d-lg-block border-start p-0">
              <SidebarRight trendingTopics={trendingTopics} suggestedFollows={suggestedFollows} />
            </Col>
          </Row>
        </Container>
      </div>
    </div>
  );
}

export default ExplorePage;
