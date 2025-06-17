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
import { useNavigate } from "react-router-dom";
import SidebarLeft from "../../components/layout/SidebarLeft/SidebarLeft";
import Chat from "../../components/messages/Chat";
import { AuthContext } from "../../context/AuthContext";
import UserSelectionModal from "../../components/messages/UserSelectionModal";
import useUserSearch from "../../hooks/useUserSearch";
import useMedia from "../../hooks/useMedia";

function MessengerPage() {
  const { token, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUserSelectionModal, setShowUserSelectionModal] = useState(false);

  const {
    searchKeyword,
    setSearchKeyword,
    searchResults,
    isSearching,
    debouncedSearch,
  } = useUserSearch(token, navigate);

  useEffect(() => {
    debouncedSearch(searchKeyword);
  }, [searchKeyword, debouncedSearch]);

  const handleOpenUserSelectionModal = () => setShowUserSelectionModal(true);
  const handleCloseUserSelectionModal = () => setShowUserSelectionModal(false);

  useEffect(() => {
    if (!token || !user) {
      toast.error("Vui lòng đăng nhập để xem tin nhắn.");
      setLoading(false);
      return;
    }

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
  }, [token, user]);

  const filteredChats = chats.filter((chat) => {
    const chatName = chat.name ? chat.name.toLowerCase() : "";
    const lastMessage = chat.lastMessage ? chat.lastMessage.toLowerCase() : "";
    const search = searchKeyword.toLowerCase();
    return chatName.includes(search) || lastMessage.includes(search);
  });

  const UserSearchItem = ({ item }) => {
    const { mediaUrl } = useMedia(item.id, "PROFILE", "image");

    return (
      <ListGroup.Item
        key={`user-${item.id}`}
        action
        className="d-flex align-items-start"
        onClick={() => {
          setShowUserSelectionModal(false);
          navigate(`/profile/${item.username}`);
        }}
      >
        <img
          src={mediaUrl || "https://via.placeholder.com/30?text=Avatar"}
          alt="avatar"
          width={30}
          height={30}
          className="rounded-circle me-2 mt-1"
        />
        <div>
          <strong>{item.displayName || item.username}</strong>
          <p className="text-muted small mb-0">@{item.username}</p>
          {item.bio && (
            <p className="text-muted small mb-0">{item.bio.slice(0, 100)}...</p>
          )}
        </div>
      </ListGroup.Item>
    );
  };

  return (
    <>
      <ToastContainer />
      <div className="d-flex min-vh-100 bg-light">
        <div className="d-none d-lg-block">
          <SidebarLeft />
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
              <Row className="mt-3">
                <Col xs={12} className="position-relative">
                  <InputGroup>
                    <InputGroup.Text className="bg-light border-0 rounded-pill ps-3">
                      <FaSearch className="text-muted" />
                    </InputGroup.Text>
                    <Form.Control
                      type="text"
                      placeholder="Tìm kiếm"
                      value={searchKeyword}
                      onChange={(e) => setSearchKeyword(e.target.value)}
                      className="bg-light border-0 rounded-pill py-2"
                      style={{ height: "auto" }}
                    />
                  </InputGroup>
                  {searchKeyword.trim() && (
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
                          <Spinner animation="border" size="sm" /> Đang tìm
                          kiếm...
                        </ListGroup.Item>
                      ) : (
                        <>
                          {searchResults.length > 0 ? (
                            <>
                              <ListGroup.Item className="bg-light fw-bold">
                                Người dùng
                              </ListGroup.Item>
                              {searchResults.map((item) => (
                                <UserSearchItem key={item.id} item={item} />
                              ))}
                            </>
                          ) : (
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
            </Container>
          </div>
          <div className="d-flex flex-grow-1">
            <div
              className="border-end overflow-auto"
              style={{ flexBasis: "350px", flexShrink: 0 }}
            >
              {!searchKeyword && (
                <>
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
                          onClick={() => setSelectedChatId(chat.id)}
                          className="d-flex align-items-center p-3 border-bottom hover-bg-light"
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
                </>
              )}
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
                    Chọn một người để hiển thị cuộc trò chuyện hoặc bắt đầu một
                    cuộc trò chuyện mới.
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