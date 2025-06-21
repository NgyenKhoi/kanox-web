import React, { useState, useEffect, useContext, useRef } from "react";
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
import { FaSearch, FaPenSquare } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
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
  const stompRef = useRef(null);

  const {
    searchKeyword,
    setSearchKeyword,
    searchResults,
    isSearching,
    debouncedSearch,
  } = useUserSearch(token, navigate);

  useEffect(() => {
    if (showUserSelectionModal) {
      setSearchKeyword(searchQuery);
      debouncedSearch(searchQuery);
    }
  }, [searchQuery, showUserSelectionModal, setSearchKeyword, debouncedSearch]);

  const handleOpenUserSelectionModal = () => {
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
      navigate("/login");
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/chat/create`, {
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
        navigate("/login");
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Lỗi khi tạo chat: ${errorText}`);
      }

      const data = await response.json();
      setChats((prev) => {
        if (!prev.some((chat) => chat.id === data.id)) {
          return [...prev, data];
        }
        return prev;
      });
      setSelectedChatId(data.id);
      navigate(`/messages?chatId=${data.id}`);
      handleCloseUserSelectionModal();
    } catch (error) {
      toast.error("Không thể tạo chat: " + error.message);
      console.error("Create chat error:", error);
    }
  };

  useEffect(() => {
    if (!token || !user) {
      toast.error("Vui lòng đăng nhập để xem tin nhắn.");
      setLoading(false);
      return;
    }

    const socket = new SockJS(`${process.env.REACT_APP_WS_URL}/ws`);
    const client = new Client({
      webSocketFactory: () => socket,
      connectHeaders: { Authorization: `Bearer ${token}` },
      debug: (str) => console.log("STOMP Debug:", str),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = () => {
      console.log("WebSocket connected for chats");
      client.subscribe("/topic/chats/" + user.id, (msg) => {
        const newChat = JSON.parse(msg.body);
        console.log("New chat received:", newChat);
        setChats((prev) => {
          if (!prev.some((chat) => chat.id === newChat.id)) {
            return [...prev, newChat];
          }
          return prev;
        });
      });
    };

    client.onWebSocketClose = () => {
      console.log("WebSocket disconnected, retrying...");
    };

    client.activate();
    stompRef.current = client;

    const fetchChats = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/chat/chats`, {
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
        setChats(data);
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
      stompRef.current?.deactivate();
    };
  }, [token, user]);

  const filteredChats = chats.filter((chat) => {
    const chatName = chat.name ? chat.name.toLowerCase() : "";
    const lastMessage = chat.lastMessage ? chat.lastMessage.toLowerCase() : "";
    const search = searchQuery.toLowerCase();
    return chatName.includes(search) || lastMessage.includes(search);
  });

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
              {loading ? (
                  <div className="d-flex justify-content-center py-4">
                    <Spinner animation="border" />
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
                              navigate(`/messages?chatId=${chat.id}`);
                            }}
                            className={`d-flex align-items-center p-3 ${
                                unreadChats.has(chat.id) ? "fw-bold" : ""
                            }`}
                        >
                          <img
                              src="https://via.placeholder.com/40"
                              alt="Avatar"
                              className="rounded-circle me-2"
                              style={{ width: "40px", height: "40px" }}
                          />
                          <div className="flex-grow-1">
                            <p className="fw-bold mb-0">{chat.name}</p>
                            <p className="text-muted small mb-0">{chat.lastMessage}</p>
                          </div>
                        </ListGroup.Item>
                    ))}
                  </ListGroup>
              )}
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
  );
}

export default MessengerPage;