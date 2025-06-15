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
import { useNavigate } from "react-router-dom";
import useUserMedia from "../../hooks/useUserMedia";

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
          `https://kanox.duckdns.org/api/search/users?keyword=${encodeURIComponent(keyword)}`,
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

  // Component con để render một mục người dùng với avatar từ useUserMedia
  const UserSearchItem = ({ item }) => {
    const { mediaUrl } = useUserMedia(item.id, "PROFILE", "image");

    return React.createElement(
        ListGroup.Item,
        {
          key: `user-${item.id}`,
          action: true,
          className: "d-flex align-items-start",
          onClick: () => navigate(`/profile/${item.username}`),
        },
        React.createElement(Image, {
          src: mediaUrl || "https://via.placeholder.com/30?text=Avatar",
          roundedCircle: true,
          width: 30,
          height: 30,
          className: "me-2 mt-1",
          alt: "User avatar",
        }),
        React.createElement(
            "div",
            null,
            React.createElement("strong", null, item.displayName || item.username),
            item.username &&
            React.createElement(
                "p",
                { className: "text-muted small mb-0" },
                `@${item.username}`
            ),
            item.bio &&
            React.createElement(
                "p",
                { className: "text-muted small mb-0" },
                `${item.bio.slice(0, 100)}...`
            )
        )
    );
  };

  const renderSearchResultSection = (items) => {
    if (!items || items.length === 0) return null;

    return [
      React.createElement(
          ListGroup.Item,
          { key: "header", className: "bg-light fw-bold" },
          "Người dùng"
      ),
      items.map((item) => React.createElement(UserSearchItem, { key: `user-${item.id}`, item })),
    ];
  };

  const trendingTopics = [
    { id: 1, category: "Chủ đề nổi trội ở Việt Nam", title: "cuội", posts: 587 },
    { id: 2, category: "Chủ đề nổi trội ở Việt Nam", title: "#khảo_oam", posts: 390 },
    { id: 3, category: "Chủ đề nổi trội ở Việt Nam", title: "Trung Quốc", posts: 197 },
    { id: 4, category: "Chủ đề nổi trội ở Việt Nam", title: "Incredible", posts: 197 },
    {
      id: 5,
      category: "Chủ đề nổi trội ở Việt Nam",
      title: "#QuangHungMasterDxForestival",
      posts: 2119,
    },
    { id: 6, category: "Chủ đề nổi trội ở Việt Nam", title: "#linglingkwong", posts: 84 },
    { id: 7, category: "Chủ đề nổi trội ở Việt Nam", title: "Movies", posts: 150 },
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

  const renderTabContent = () =>
      React.createElement(
          "div",
          { className: "mt-0" },
          trendingTopics.length === 0
              ? React.createElement(
                  "p",
                  { className: "text-muted text-center p-4" },
                  "Không có chủ đề nào đang phổ biến."
              )
              : trendingTopics.map((topic) =>
                  React.createElement(
                      "div",
                      {
                        key: topic.id,
                        className: "d-flex align-items-center justify-content-between p-3 border-bottom hover-bg-light",
                      },
                      React.createElement(
                          "div",
                          null,
                          React.createElement(
                              "p",
                              { className: "text-muted small mb-0" },
                              topic.category
                          ),
                          React.createElement("h6", { className: "fw-bold mb-0" }, topic.title),
                          React.createElement(
                              "p",
                              { className: "text-muted small mb-0" },
                              `${topic.posts} N bài đăng`
                          )
                      ),
                      React.createElement(
                          Button,
                          { variant: "link", className: "text-dark p-0" },
                          React.createElement(FaEllipsisH, null)
                      )
                  )
              )
      );

  return React.createElement(
      "div",
      { className: "d-flex min-vh-100", style: { backgroundColor: "#fff" } },
      React.createElement("div", { className: "d-none d-lg-block" }, React.createElement(SidebarLeft, null)),
      React.createElement(
          "div",
          { className: "d-flex flex-column flex-grow-1" },
          React.createElement(
              "div",
              { className: "sticky-top bg-white border-bottom py-2", style: { zIndex: 1020 } },
              React.createElement(
                  Container,
                  { fluid: true },
                  React.createElement(
                      Row,
                      null,
                      React.createElement(
                          Col,
                          { xs: 12, lg: 6, className: "mx-auto px-md-0 position-relative" },
                          React.createElement(
                              InputGroup,
                              { className: "me-2" },
                              React.createElement(
                                  InputGroup.Text,
                                  { className: "bg-light border border-light rounded-pill ps-3" },
                                  React.createElement(FaSearch, { className: "text-muted" })
                              ),
                              React.createElement(Form.Control, {
                                type: "text",
                                placeholder: "Tìm kiếm người dùng",
                                className: "bg-light border border-light rounded-pill py-2",
                                style: { height: "auto" },
                                value: searchKeyword,
                                onChange: (e) => setSearchKeyword(e.target.value),
                              })
                          ),
                          searchKeyword &&
                          React.createElement(
                              ListGroup,
                              {
                                className: "position-absolute w-100 mt-1 shadow-sm",
                                style: { zIndex: 1000, maxHeight: "400px", overflowY: "auto" },
                              },
                              isSearching
                                  ? React.createElement(
                                      ListGroup.Item,
                                      { className: "text-center" },
                                      React.createElement(Spinner, { animation: "border", size: "sm" }),
                                      " Đang tải..."
                                  )
                                  : [
                                    renderSearchResultSection(searchResults),
                                    searchResults.length === 0 &&
                                    React.createElement(ListGroup.Item, null, "Không tìm thấy kết quả."),
                                  ]
                          )
                      )
                  ),
                  React.createElement(
                      Row,
                      null,
                      React.createElement(
                          Col,
                          { xs: 12, lg: 6, className: "mx-auto px-md-0" },
                          React.createElement(
                              Nav,
                              { variant: "underline", className: "mt-2 profile-tabs nav-justified" },
                              ["for-you", "trending", "news", "sports", "entertainment"].map((tab) =>
                                  React.createElement(
                                      Nav.Item,
                                      { key: tab },
                                      React.createElement(
                                          Nav.Link,
                                          {
                                            onClick: () => setActiveTab(tab),
                                            className: `text-dark fw-bold ${activeTab === tab ? "active" : ""}`,
                                          },
                                          {
                                            "for-you": "Cho Bạn",
                                            trending: "Đang thịnh hành",
                                            news: "Tin tức",
                                            sports: "Thể thao",
                                            entertainment: "Giải trí",
                                          }[tab]
                                      )
                                  )
                              )
                          )
                      )
                  )
              )
          ),
          React.createElement(
              Container,
              { fluid: true, className: "flex-grow-1" },
              React.createElement(
                  Row,
                  { className: "h-100" },
                  React.createElement(
                      Col,
                      { xs: 12, lg: 6, className: "px-md-0 border-start border-end" },
                      renderTabContent()
                  ),
                  React.createElement(
                      Col,
                      {
                        xs: 0,
                        sm: 0,
                        md: 0,
                        lg: 3,
                        className: "d-none d-lg-block border-start p-0",
                      },
                      React.createElement(SidebarRight, {
                        trendingTopics,
                        suggestedFollows,
                      })
                  )
              )
          )
      )
  );
}

export default ExplorePage;