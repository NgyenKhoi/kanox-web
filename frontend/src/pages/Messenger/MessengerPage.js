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
import { FaSearch, FaPenSquare, FaTrash } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import SidebarLeft from "../../components/layout/SidebarLeft/SidebarLeft";
import Chat from "../../components/messages/Chat";
import { AuthContext } from "../../context/AuthContext";
import { WebSocketContext } from "../../context/WebSocketContext";
import UserSelectionModal from "../../components/messages/UserSelectionModal";
import useUserSearch from "../../hooks/useUserSearch";
import { useNavigate, useSearchParams } from "react-router-dom";

function MessengerPage() {
  const { token, user } = useContext(AuthContext);
  const { subscribe, unsubscribe, publish } = useContext(WebSocketContext) || {};
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
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
  } = useUserSearch(token, navigate);

  useEffect(() => {
    if (!token || !user) {
      toast.error("Vui lòng đăng nhập để xem tin nhắn.");
      navigate("/");
      setLoading(false);
      return;
    }

    if (!subscribe || !unsubscribe || !publish) {
      console.error("WebSocketContext is not available");
      toast.error("Lỗi kết nối WebSocket. Vui lòng thử lại sau.");
      setLoading(false);
      return;
    }

    const subscription = subscribe(`/topic/chats/${user.id}`, (message) => {
      console.log("MessengerPage WebSocket message:", message);
      if (!message) return;
      if (message.action === "delete") {
        setChats((prev) => prev.filter((chat) => chat.id !== message.chatId));
        setUnreadChats((prev) => {
          const newUnread = new Set(prev);
          newUnread.delete(message.chatId);
          return newUnread;
        });
        if (selectedChatId === message.chatId) {
          setSelectedChatId(null);
          navigate("/messages");
        }
        toast.success("Chat đã được xóa.");
      } else if (message.id) { // Kiểm tra message.id thay vì message.chatId để khớp với ChatDto
        setChats((prev) => {
          const existingChat = prev.find((chat) => chat.id === message.id);
          const updatedMessage = {
            ...message,
            name: message.name || "Unknown User",
          };
          if (existingChat) {
            return prev.map((chat) =>
                chat.id === message.id ? { ...chat, ...updatedMessage } : chat
            );
          }
          return [...prev, updatedMessage];
        });
        setUnreadChats((prev) => {
          const newUnread = new Set(prev);
          if (message.unreadMessagesCount > 0) {
            newUnread.add(message.id);
          } else {
            newUnread.delete(message.id);
          }
          return newUnread;
        });
        window.dispatchEvent(
            new CustomEvent("updateUnreadCount", {
              detail: { unreadCount: message.unreadMessagesCount || 0 },
            })
        );
      }
    }, `chats-${user.id}`);

    const fetchChats = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/chat/chats`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Lỗi khi tải danh sách chat.");
        }

        const data = await response.json();
        setChats(data.map(chat => ({ ...chat, name: chat.name || "Unknown User" })));
        const unread = new Set(
            data.filter((chat) => chat.unreadMessagesCount > 0).map((chat) => chat.id)
        );
        setUnreadChats(unread);
      } catch (err) {
        toast.error(err.message || "Lỗi khi tải danh sách chat.");
      } finally {
        setLoading(false);
      }
    };

    fetchChats();

    return () => {
      unsubscribe(`chats-${user.id}`);
    };
  }, [token, user, subscribe, unsubscribe, publish]);

  useEffect(() => {
    if (searchKeyword.trim()) {
      debouncedSearch(searchKeyword);
    }
  }, [searchKeyword, debouncedSearch]);


  useEffect(() => {
    const chatId = searchParams.get("chatId");
    if (chatId) {
      setSelectedChatId(Number(chatId));
      if (publish) {
        publish("/app/resend", { chatId: Number(chatId) });
        console.log(`Sent /app/resend for chatId: ${chatId}`);
      }
    }
  }, [searchParams, publish]);

  const handleOpenUserSelectionModal = () => {
    setSearchKeyword("");
    setSearchQuery("");
    setShowUserSelectionModal(true);
  };

  const handleCloseUserSelectionModal = () => {
    setShowUserSelectionModal(false);
    setSearchKeyword("");
    setSearchQuery("");
  };

  const handleSelectUser = async (userId) => {
    if (!token) {
      toast.error("Vui lòng đăng nhập lại.");
      navigate("/");
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/chat/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ targetUserId: userId }),
      });

      if (response.status === 401) {
        toast.error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");
        navigate("/");
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Lỗi khi tạo chat: ${errorText}`);
      }

      const data = await response.json();
      setChats((prev) => {
        if (!prev.some((chat) => chat.id === data.id)) {
          return [...prev, { ...data, name: data.name || "Unknown User" }];
        }
        return prev.map((chat) => (chat.id === data.id ? { ...data, name: data.name || "Unknown User" } : chat));
      });
      setSelectedChatId(data.id);
      navigate(`/messages?chatId=${data.id}`);
      handleCloseUserSelectionModal();
      if (publish) {
        publish("/app/resend", { chatId: data.id });
        console.log(`Sent /app/resend for chatId: ${data.id}`);
      }
    } catch (error) {
      toast.error("Không thể tạo chat: " + error.message);
      console.error("Create chat error:", error);
    }
  };

  const handleDeleteChat = async (chatId) => {
    if (!token) {
      toast.error("Vui lòng đăng nhập lại.");
      navigate("/");
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/chat/${chatId}/delete`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        toast.error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");
        navigate("/");
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Lỗi khi xóa chat: ${errorText}`);
      }

      setChats((prev) => prev.filter((chat) => chat.id !== chatId));
      setUnreadChats((prev) => {
        const newUnread = new Set(prev);
        newUnread.delete(chatId);
        return newUnread;
      });
      if (selectedChatId === chatId) {
        setSelectedChatId(null);
        navigate("/messages");
      }
      toast.success("Đã xóa chat.");
    } catch (error) {
      toast.error("Không thể xóa chat: " + error.message);
      console.error("Delete chat error:", error);
    }
  };

  const handleSelectChat = async (chatId) => {
    setSelectedChatId(chatId);
    navigate(`/messages?chatId=${chatId}`);
    if (publish) {
      publish("/app/resend", { chatId: Number(chatId) });
      console.log(`Sent /app/resend for chatId: ${chatId}`);
    }
    try {
      const token = sessionStorage.getItem("token") || localStorage.getItem("token");
      const messagesResponse = await fetch(`${process.env.REACT_APP_API_URL}/chat/${chatId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!messagesResponse.ok) {
        const errorText = await messagesResponse.text();
        throw new Error(`Lỗi khi tải tin nhắn: ${errorText}`);
      }

      const unreadResponse = await fetch(
          `${process.env.REACT_APP_API_URL}/chat/messages/unread-count`,
          { headers: { Authorization: `Bearer ${token}` } }
      );
      if (unreadResponse.ok) {
        const messageData = await unreadResponse.json();
        setUnreadChats((prev) => {
          const newUnread = new Set(prev);
          newUnread.delete(chatId);
          return newUnread;
        });
        window.dispatchEvent(
            new CustomEvent("updateUnreadCount", {
              detail: { unreadCount: messageData.unreadCount || 0 },
            })
        );
      } else {
        const errorText = await unreadResponse.text();
        throw new Error(`Lỗi khi tải số tin nhắn chưa đọc: ${errorText}`);
      }
    } catch (error) {
      console.error("Error in handleSelectChat:", error);
      toast.error(error.message || "Lỗi khi tải tin nhắn hoặc đếm tin nhắn chưa đọc.");
    }
  };

  const filteredChats = chats.filter((chat) =>
      (chat.name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
        <div className="d-flex justify-content-center align-items-center h-100">
          <Spinner animation="border" />
        </div>
    );
  }

  return (
      <div className="d-flex h-100 bg-light">
        <style>
          {`
          .list-group-item-action.active {
            background-color: #e9ecef !important;
            border-color: #e9ecef !important;
            color: #212529 !important;
          }
          .list-group-item-action:hover {
            background-color: #f8f9fa !important;
          }
        `}
        </style>
        <SidebarLeft
            onShowCreatePost={() => console.log("Create Post clicked")}
            isDarkMode={false}
            onToggleDarkMode={() => console.log("Toggle Dark Mode")}
        />
        <div className="flex-grow-1 d-flex flex-column">
          <div className="bg-white border-bottom p-3">
            <h5 className="fw-bold mb-0">Tin nhắn</h5>
            <InputGroup className="mt-3 rounded-pill shadow-sm">
              <InputGroup.Text className="bg-light border-0 rounded-pill ps-3">
                <FaSearch className="text-muted" />
              </InputGroup.Text>
              <Form.Control
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (showUserSelectionModal) {
                      setSearchKeyword(e.target.value);
                    }
                  }}
                  placeholder="Tìm kiếm người dùng hoặc tin nhắn"
                  className="bg-light border-0 rounded-pill py-2"
              />
              <Button
                  variant="primary"
                  className="rounded-pill ms-2"
                  onClick={handleOpenUserSelectionModal}
              >
                <FaPenSquare /> Tin nhắn mới
              </Button>
            </InputGroup>
          </div>
          <div className="d-flex flex-grow-1">
            <div className="border-end bg-white" style={{ width: "350px" }}>
              <ListGroup variant="flush">
                {filteredChats.map((chat) => (
                    <ListGroup.Item
                        key={chat.id}
                        action
                        active={selectedChatId === chat.id}
                        className={`d-flex align-items-center p-3 ${
                            chat.unreadMessagesCount > 0 ? "fw-bold" : ""
                        }`}
                    >
                      <img
                          src="/assets/default-avatar.png"
                          alt="Avatar"
                          className="rounded-circle me-2"
                          style={{ width: "40px", height: "40px" }}
                      />
                      <div
                          className="flex-grow-1"
                          onClick={() => handleSelectChat(chat.id)}
                      >
                        <p className="fw-bold mb-0">{chat.name || "Unknown User"}</p>
                        <p className="text-muted small mb-0">{chat.lastMessage}</p>
                      </div>
                      <Button
                          variant="link"
                          className="p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteChat(chat.id);
                          }}
                          title="Delete chat"
                      >
                        <FaTrash className="text-danger" />
                      </Button>
                    </ListGroup.Item>
                ))}
              </ListGroup>
            </div>
            <div className="flex-grow-1">
              {selectedChatId ? (
                  <Chat chatId={selectedChatId} />
              ) : (
                  <div className="d-flex justify-content-center align-items-center h-100">
                    <p className="text-muted">Chọn một cuộc trò chuyện</p>
                  </div>
              )}
            </div>
          </div>
          <UserSelectionModal
              show={showUserSelectionModal}
              handleClose={handleCloseUserSelectionModal}
              searchKeyword={searchQuery}
              setSearchKeyword={(value) => {
                setSearchKeyword(value);
                setSearchQuery(value);
              }}
              searchResults={searchResults}
              isSearching={isSearching}
              handleSelectUser={handleSelectUser}
          />
          <ToastContainer />
        </div>
      </div>
  );
}

export default MessengerPage;