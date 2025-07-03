import React, { useState, useEffect, useContext, useCallback, useRef } from "react";
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
  const [messages, setMessages] = useState({});
  const subscriptionsRef = useRef({}); // Theo dõi các subscription

  const {
    searchKeyword,
    setSearchKeyword,
    searchResults,
    isSearching,
    debouncedSearch,
  } = useUserSearch(token, navigate);

  // Hàm xử lý tin nhắn mới từ WebSocket
  const handleMessageUpdate = useCallback((message) => {
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
        setMessages((prev) => {
          const newMessages = { ...prev };
          delete newMessages[message.chatId];
          return newMessages;
        });
        navigate("/messages");
      }
      toast.success("Chat đã được xóa.");
    } else if (message.id) {
      const updatedChat = {
        ...message,
        name: message.name || "Unknown User",
      };
      setChats((prev) => {
        const existingChat = prev.find((chat) => chat.id === message.id);
        if (existingChat) {
          return prev.map((chat) =>
              chat.id === message.id ? { ...chat, ...updatedChat } : chat
          );
        }
        return [...prev, updatedChat];
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
      // Cập nhật tin nhắn cho chat được chọn
      if (message.chatId) {
        setMessages((prev) => ({
          ...prev,
          [message.chatId]: [...(prev[message.chatId] || []), message],
        }));
      }
      window.dispatchEvent(
          new CustomEvent("updateUnreadCount", {
            detail: { unreadCount: message.unreadMessagesCount || 0 },
          })
      );
    }
  }, [selectedChatId, navigate]);

  // Subscribe đến tin nhắn theo thời gian thực cho từng chat
  const subscribeToChatMessages = useCallback((chatId) => {
    if (!subscribe || subscriptionsRef.current[chatId] || !chatId) return;

    const topic = `/topic/chat/${chatId}`;
    const subId = `chat-${chatId}`;
    const callback = (newMessage) => {
      try {
        console.log("✅ New message received:", newMessage);
        setMessages((prev) => ({
          ...prev,
          [chatId]: [...(prev[chatId] || []), newMessage],
        }));
      } catch (err) {
        console.error("❌ Lỗi khi parse message:", err, newMessage);
      }
    };


    const subscription = subscribe(topic, callback, subId);
    subscriptionsRef.current[chatId] = subscription;
    console.log("Subscribed to ${topic} with subId", `${subId}`);
  }, [subscribe, selectedChatId]);

  // Hủy subscribe khi không cần thiết
  const unsubscribeFromChatMessages = useCallback((chatId) => {
    if (unsubscribe && subscriptionsRef.current[chatId] && chatId) {
      unsubscribe(`chat-${chatId}`);
      delete subscriptionsRef.current[chatId];
    }
  }, [unsubscribe]);

  useEffect(() => {
    // if (!token || !user) {
    //   toast.error("Vui lòng đăng nhập để xem tin nhắn.");
    //   navigate("/");
    //   setLoading(false);
    //   return;
    // }

    if (!subscribe || !unsubscribe || !publish) {
      console.error("WebSocketContext is not available");
      toast.error("Lỗi kết nối WebSocket. Vui lòng thử lại sau.");
      setLoading(false);
      return;
    }

    const subscription = subscribe(`/topic/chats/${user.id}`, handleMessageUpdate, `chats-${user.id}`);

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
      Object.values(subscriptionsRef.current).forEach((sub) => unsubscribe(sub.id));
      subscriptionsRef.current = {};
    };
  }, [token, user, subscribe, unsubscribe, publish, handleMessageUpdate]);

  useEffect(() => {
    chats.forEach((chat) => subscribeToChatMessages(chat.id));

    Object.keys(subscriptionsRef.current).forEach((chatId) => {
      if (!chats.find((chat) => chat.id === Number(chatId))) {
        unsubscribeFromChatMessages(Number(chatId));
      }
    });
  }, [chats, subscribeToChatMessages, unsubscribeFromChatMessages]);

  useEffect(() => {
    if (searchKeyword.trim()) {
      debouncedSearch(searchKeyword);
    }
  }, [searchKeyword, debouncedSearch]);

  useEffect(() => {
    const chatId = searchParams.get("chatId");
    if (chatId) {
      setSelectedChatId(Number(chatId));
      subscribeToChatMessages(Number(chatId)); // Subscribe khi chọn chat
      const fetchMessages = async () => {
        try {
          const token = sessionStorage.getItem("token") || localStorage.getItem("token");
          const response = await fetch(`${process.env.REACT_APP_API_URL}/chat/${chatId}/messages`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!response.ok) {
            throw new Error("Lỗi khi tải tin nhắn.");
          }
          const data = await response.json();
          setMessages((prev) => ({ ...prev, [chatId]: data }));
        } catch (err) {
          toast.error(err.message || "Lỗi khi tải tin nhắn.");
        }
      };
      fetchMessages();
      if (publish) {
        publish("/app/resend", { chatId: Number(chatId) });
      }
    } else if (selectedChatId) {
      unsubscribeFromChatMessages(selectedChatId); // Hủy subscribe khi không chọn chat
    }
  }, [searchParams, publish, subscribeToChatMessages, unsubscribeFromChatMessages]);

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
    // if (!token) {
    //   toast.error("Vui lòng đăng nhập lại.");
    //   navigate("/");
    //   return;
    // }

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/chat/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ targetUserId: userId }),
      });

      // if (response.status === 401) {
      //   toast.error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
      //   localStorage.removeItem("token");
      //   sessionStorage.removeItem("token");
      //   navigate("/");
      //   return;
      // }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error("Lỗi khi tạo chat:", `${errorText}`);
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
        throw new Error("Lỗi khi xóa chat:", `${errorText}`);
      }

      if (publish) {
        publish("/app/chat/delete", { chatId, userId: user.id });
      }
      setChats((prev) => prev.filter((chat) => chat.id !== chatId));
      setUnreadChats((prev) => {
        const newUnread = new Set(prev);
        newUnread.delete(chatId);
        return newUnread;
      });
      if (selectedChatId === chatId) {
        setSelectedChatId(null);
        setMessages((prev) => {
          const newMessages = { ...prev };
          delete newMessages[chatId];
          return newMessages;
        });
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
    }
    try {
      const token = sessionStorage.getItem("token") || localStorage.getItem("token");
      const messagesResponse = await fetch(`${process.env.REACT_APP_API_URL}/chat/${chatId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!messagesResponse.ok) {
        const errorText = await messagesResponse.text();
        throw new Error("Lỗi khi tải tin nhắn:", `${errorText}`);
      }
      const data = await messagesResponse.json();
      setMessages((prev) => ({ ...prev, [chatId]: data }));
    } catch (error) {
      console.error("Error in handleSelectChat:", error);
      toast.error(error.message || "Lỗi khi tải tin nhắn.");
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
    <div className="flex h-screen bg-[var(--background-color)] text-[var(--text-color)]">
      {/*<style>*/}
      {/*  .list-group-item-action.active {*/}
      {/*    background-color: #e9ecef !important;*/}
      {/*  border-color: #e9ecef !important;*/}
      {/*  color: #212529 !important;*/}
      {/*}*/}
      {/*  .list-group-item-action:hover {*/}
      {/*    background-color: #f8f9fa !important;*/}
      {/*}*/}
      {/*</style>*/}
      <div className="flex flex-col flex-grow h-full">
        <div className="bg-[var(--card-bg)] border-b border-[var(--border-color)] p-4">
        <h5 className="fw-bold mb-0">Tin nhắn</h5>
          <div className="flex items-center gap-2 mt-3">
            <div className="relative w-full">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (showUserSelectionModal) setSearchKeyword(e.target.value);
                  }}
                  placeholder="Tìm kiếm người dùng hoặc tin nhắn"
                  className="w-full pl-10 pr-4 py-2 rounded-full border border-[var(--border-color)] bg-gray-100 dark:bg-gray-800 focus:outline-none text-sm"
              />
            </div>
            <button
                onClick={handleOpenUserSelectionModal}
                className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-1 hover:bg-blue-600"
            >
              <FaPenSquare /> Tin nhắn mới
            </button>
          </div>

        </div>
        <div className="flex flex-grow h-full overflow-hidden min-h-0">
            <div className="w-1/3 border-r border-[var(--border-color)] bg-[var(--card-bg)] overflow-y-auto">
              {filteredChats.map(chat => (
                  <div
                      key={chat.id}
                      onClick={() => handleSelectChat(chat.id)}
                      className={`flex items-center justify-between p-4 border-b border-[var(--border-color)] hover:bg-[var(--hover-bg-color)] cursor-pointer ${
                          selectedChatId === chat.id ? "bg-gray-200 dark:bg-gray-700" : ""
                      }`}
                  >
                    <img
                        src="/assets/default-avatar.png"
                        alt="Avatar"
                        className="w-10 h-10 rounded-full mr-3"
                    />
                    <div className="flex-1">
                      <p className="font-bold text-sm">{chat.name || "Unknown User"}</p>
                      <p className="text-gray-500 text-xs truncate">{chat.lastMessage}</p>
                    </div>
                    <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteChat(chat.id);
                        }}
                        className="text-red-500 hover:text-red-700"
                        title="Xóa chat"
                    >
                      <FaTrash />
                    </button>
                  </div>
              ))}
            </div>


          <div className="w-2/3 bg-[var(--background-color)] h-full">
          {selectedChatId ? (
                <Chat
                    chatId={selectedChatId}
                    messages={messages[selectedChatId] || []}
                    onSendMessage={(message) => {
                      if (publish) {
                        publish("/app/sendMessage", {
                          chatId: selectedChatId,
                          userId: user.id,
                          content: message,
                        });
                      }
                    }}
                    onMessageUpdate={(newMessage) => {
                      setMessages((prev) => ({
                        ...prev,
                        [selectedChatId]: [...(prev[selectedChatId] || []), newMessage],
                      }));
                    }}
                />
            ) : (
              <div className="flex justify-center items-center h-full text-gray-400">
                <p>Chọn một cuộc trò chuyện</p>
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