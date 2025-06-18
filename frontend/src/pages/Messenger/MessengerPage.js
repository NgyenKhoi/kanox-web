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
import useUserSearch from "../../hooks/useUserSearch";
import { useNavigate } from "react-router-dom";

function MessengerPage() {
  const { token, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [unreadChats, setUnreadChats] = useState(new Set());
  const [showUserSelectionModal, setShowUserSelectionModal] = useState(false);

  const {
    searchKeyword,
    setSearchKeyword,
    searchResults,
    isSearching,
    debouncedSearch,
  } = useUserSearch(token, navigate); // Sử dụng useUserSearch

  // Hàm tạo chat mới
  const createChat = async (userId) => {
    if (!token) {
      toast.error("Vui lòng đăng nhập lại.");
      navigate("/");
      return null;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/chat/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ participantId: userId }),
      });

      if (response.status === 401) {
        toast.error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");
        navigate("/login");
        return null;
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Lỗi khi tạo chat: ${errorText}`);
      }

      const data = await response.json();
      return data.id; // Giả sử backend trả về { id: chatId }
    } catch (error) {
      toast.error("Không thể tạo chat: " + error.message);
      console.error("Create chat error:", error);
      return null;
    }
  };

  // Hàm xử lý chọn người dùng
  const handleSelectUser = async (userId) => {
    const chatId = await createChat(userId);
    if (chatId) {
      navigate(`/messages?chatId=${chatId}`);
      setSearchKeyword("");
      setShowUserSelectionModal(false);
    }
  };

  useEffect(() => {
    if (showUserSelectionModal) {
      debouncedSearch(searchKeyword);
    }
  }, [searchKeyword, debouncedSearch, showUserSelectionModal]);

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
        const response = await fetch(`${process.env.REACT_APP_API_URL}/chat/chats`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        });

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Phản hồi không phải JSON");
        }

        const data = await response.json();
        if (response.ok) {
          setChats(data);
          const unread = new Set(
              data.filter((chat) => chat.unreadMessagesCount > 0).map((chat) => chat.id)
          );
          setUnreadChats(unread);
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
    const chatName = chat.name ? chat.name.toLowerCase() : "";
    const lastMessage = chat.lastMessage ? chat.lastMessage.toLowerCase() : "";
    const search = searchQuery.toLowerCase();
    return chatName.includes(search) || lastMessage.includes(search);
  });

  return (
      <div className="d-flex h-100 bg-light">
        <SidebarLeft onShowCreatePost={localOnShowCreatePost} isDarkMode={localIsDarkMode} onToggleDarkMode={localOnToggleDarkMode} />
        <div className="flex-grow-1 d-flex flex-column">
          <div className="bg-white border-bottom p-3">
            <h5 className="fw-bold mb-0">Tin nhắn</h5>
            <InputGroup className="mt-3">
              <InputGroup.Text><FaSearch /></InputGroup.Text>
              <Form.Control value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Tìm kiếm" />
            </InputGroup>
          </div>
          <div className="d-flex flex-grow-1">
            <div className="border-end" style={{ width: "350px" }}>
              {loading ? (
                  <div className="d-flex justify-content-center py-4"><Spinner animation="border" /></div>
              ) : (
                  <ListGroup variant="flush">
                    {filteredChats.map((chat) => (
                        <ListGroup.Item
                            key={chat.id}
                            action
                            active={selectedChatId === chat.id}
                            onClick={() => setSelectedChatId(chat.id)}
                            className={`d-flex align-items-center p-3 hover-bg-light ${
                                unreadChats.has(chat.id) ? "fw-bold" : ""
                            }`}
                        >
                          <img
                              src="https://via.placeholder.com/40"
                              alt="Avatar"
                              className="rounded-circle me-2"
                              style={{ width: "40px", height: "40px" }}
                          />
                          <div>
                            <p className="fw-bold mb-0">{chat.name}</p>
                            <p className="text-muted small mb-0">{chat.lastMessage}</p>
                          </div>
                        </ListGroup.Item>
                    ))}
                  </ListGroup>
              )}
              <div className="p-3 border-top text-center">
                <Button
                    variant="link"
                    className="text-primary fw-bold"
                    onClick={handleOpenUserSelectionModal}
                >
                  <FaPenSquare /> Tin nhắn mới
                </Button>
              </div>
            </div>
            <div className="flex-grow-1">{selectedChatId ? <Chat chatId={selectedChatId} /> : <div className="d-flex justify-content-center align-items-center h-100"><p>Chọn cuộc trò chuyện</p></div>}</div>
          </div>
        </div>
        <UserSelectionModal
            show={showUserSelectionModal}
            handleClose={handleCloseUserSelectionModal}
            searchKeyword={searchKeyword}
            setSearchKeyword={setSearchKeyword}
            searchResults={searchResults}
            isSearching={isSearching}
            handleSelectUser={handleSelectUser}
        />
      </div>
  );
}

export default MessengerPage;