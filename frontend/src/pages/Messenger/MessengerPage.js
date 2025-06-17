import React, { useState, useEffect, useContext } from "react";
import {
  Container,
  Row,
  Col,
  InputGroup,
  Form,
  Button,
  ListGroup,
  Spinner,
} from "react-bootstrap";
import { FaSearch, FaEnvelope, FaPenSquare, FaCog } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import SidebarLeft from "../../components/layout/SidebarLeft/SidebarLeft";
import Chat from "../../components/messages/Chat";
import { AuthContext } from "../../context/AuthContext";
import UserSelectionModal from "../../components/messages/UserSelectionModal";
import { useWebSocket } from "../../hooks/useWebSocket";
import useUserSearch from "../../hooks/useUserSearch";
import useUserMedia from "../../hooks/useUserMedia";

function MessengerPage() {
  const { token, user } = useContext(AuthContext);
  const [chats, setChats] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // New state for controlling the UserSelectionModal visibility
  const [showUserSelectionModal, setShowUserSelectionModal] = useState(false);

  const {
    searchKeyword,
    setSearchKeyword,
    searchResults,
    isSearching,
    debouncedSearch,
  } = useUserSearch(token, navigate);
  const handleOpenUserSelectionModal = () => {
    setShowUserSelectionModal(true);
  };

  useEffect(() => {
    debouncedSearch(searchKeyword);
  }, [searchKeyword, debouncedSearch]);

  // Local states/functions for SidebarLeft
  const [localIsDarkMode, setLocalIsDarkMode] = useState(false);
  const localOnToggleDarkMode = () => {
    setLocalIsDarkMode((prev) => !prev);
    console.log("Dark mode toggled locally within MessengerPage's sidebar.");
  };
  const localOnShowCreatePost = () => {
    console.log("Create Post button clicked from MessengerPage Sidebar.");
  };
  const handleOpenUserSelectionModal = () => setShowUserSelectionModal(true);
  const handleCloseUserSelectionModal = () => setShowUserSelectionModal(false);

  useEffect(() => {
    if (!token || !user) {
      toast.error("Vui lòng đăng nhập để xem tin nhắn.");
      setLoading(false);
      return;
    }

    const fetchChats = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/chats`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        });

        const contentType = response.headers.get("content-type");
        let data;
        if (contentType && contentType.includes("application/json")) {
          data = await response.json();
        } else {
          throw new Error("Phản hồi không phải JSON");
    fetch(`${process.env.REACT_APP_API_URL}/chats`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Lỗi khi tải danh sách chat.");
        }
        const data = await response.json();
        setChats(data);
      })
      .catch((err) => {
        toast.error("Lỗi khi tải danh sách chat: " + err.message);
      })
      .finally(() => setLoading(false));
        if (response.ok) {
          setChats(data);
        } else {
          throw new Error(data.message || "Lỗi khi tải danh sách chat.");
        }
      } catch (err) {
        toast.error(err.message || "Lỗi khi tải danh sách chat.");
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
  }, [token, user]);

  const filteredChats = chats.filter((chat) => {
    // Assuming chat.name is the display name for the chat, and chat.lastMessage exists
    const chatName = chat.name ? chat.name.toLowerCase() : "";
    const lastMessage = chat.lastMessage ? chat.lastMessage.toLowerCase() : "";
    const search = searchQuery.toLowerCase();
    return chatName.includes(search) || lastMessage.includes(search);
  });

  return (
      <>
        <ToastContainer />
        <div className="d-flex min-vh-100 bg-light">
          <div className="d-none d-lg-block">
            <SidebarLeft
                onShowCreatePost={localOnShowCreatePost}
                isDarkMode={localIsDarkMode}
                onToggleDarkMode={localOnToggleDarkMode}
            />
          </div>

          <div className="d-flex flex-column flex-grow-1 border-start border-end bg-white">
            <div
                className="sticky-top bg-white border-bottom py-2"
                style={{ zIndex: 1020 }}
            >
              <Container fluid>
                <Row className="align-items-center">
                  <Col xs={6} className="text-start">
                    <h5 className="fw-bold mb-0">Tin nhắn</h5>
                  </Col>
                  <Col xs={6} className="text-end">
                    <Button variant="link" className="text-dark p-0">
                      <FaCog />
                    </Button>
                  </Col>
                </Row>
                <InputGroup className="mt-3">
                  <InputGroup.Text className="bg-light border-0 rounded-pill ps-3">
                    <FaSearch className="text-muted" />
                  </InputGroup.Text>
                  <Form.Control
                      type="text"
                      placeholder="Tìm kiếm"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-light border-0 rounded-pill py-2"
                      style={{ height: "auto" }}
                  />
                </InputGroup>
              </Container>
            </div>

            <div className="d-flex flex-grow-1">
              <div
                  className="border-end overflow-auto"
                  style={{ flexBasis: "350px", flexShrink: 0 }}
              >
                {loading ? (
                    <div className="d-flex justify-content-center py-4">
                      <Spinner animation="border" role="status" />
                    </div>
                ) : (
                    <ListGroup variant="flush">
                      {filteredChats.map((chat) => (
                          <ListGroup.Item
                              key={chat.id}
                              action
                              active={selectedChatId === chat.id}
                              onClick={() => {
                                setSelectedChatId(chat.id);
                                setUnreadChats((prev) => {
                                  const newSet = new Set(prev);
                                  newSet.delete(chat.id); // Xóa chat khỏi danh sách chưa đọc khi click
                                  return newSet;
                                });
                              }}
                              className={`d-flex align-items-center p-3 border-bottom hover-bg-light ${
                                  unreadChats.has(chat.id) ? "fw-bold" : ""
                              }`}
                          >
                            <div className="flex-grow-1">
                              <p className="fw-bold mb-0">{chat.name}</p>
                              <p className="text-muted small mb-0">
                                {chat.lastMessage}
                              </p>
                            </div>
                          </ListGroup.Item>
                      ))}
                      {filteredChats.length === 0 && (
                          <p className="text-muted text-center p-4">
                            Không có cuộc trò chuyện nào.
                          </p>
                      )}
                    </ListGroup>
                )}
                <div className="p-3 border-top text-center">
                  <Button
                      variant="link"
                      className="text-primary fw-bold"
                      onClick={handleOpenUserSelectionModal}
                  >
                    <FaPenSquare className="me-2" /> Tin nhắn mới
                  </Button>
                </div>
              </div>

              <div className="flex-grow-1 d-flex flex-column">
                {selectedChatId ? (
                    <Chat chatId={selectedChatId} />
                ) : (
                    <div className="d-flex flex-column justify-content-center align-items-center p-3 flex-grow-1">
                      <FaEnvelope
                          className="text-muted mb-3"
                          style={{ fontSize: "5rem" }}
                      />
                      <h4 className="fw-bold mb-2">Tin nhắn của bạn</h4>
                      <p className="text-muted text-center mb-4">
                        Chọn một người để hiển thị cuộc trò chuyện của họ hoặc bắt
                        đầu một cuộc trò chuyện mới.
                      </p>
                      <Button
                          variant="primary"
                          className="rounded-pill px-4 py-2"
                          onClick={handleOpenUserSelectionModal}
                      >
                        Tin nhắn mới
                      </Button>
                    </div>
                )}
              </div>
            </div>
          </div>

          <div className="d-none d-lg-block" style={{ width: "350px" }} />
        </div>

        <UserSelectionModal
            show={showUserSelectionModal}
            handleClose={handleCloseUserSelectionModal}
        />
      </>
  );
}

export default MessengerPage;
