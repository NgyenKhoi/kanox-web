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
    const callback = (message) => {
      const newMessage = JSON.parse(message.body); // ✅ parse JSON
      console.log(`📩 Tin nhắn mới từ /topic/chat/${chatId}:`, newMessage);
      setMessages((prev) => ({
        ...prev,
        [chatId]: [...(prev[chatId] || []), newMessage],
      }));
      if (selectedChatId !== chatId) {
        setUnreadChats((prev) => new Set(prev).add(chatId));
      }
    };

    const subscription = subscribe(topic, callback, subId);
    subscriptionsRef.current[chatId] = subscription;
    console.log(`Subscribed to ${topic} with subId ${subId}`);
  }, [subscribe, selectedChatId]);

  // Hủy subscribe khi không cần thiết
  const unsubscribeFromChatMessages = useCallback((chatId) => {
    if (unsubscribe && subscriptionsRef.current[chatId] && chatId) {
      unsubscribe(`chat-${chatId}`);
      delete subscriptionsRef.current[chatId];
      console.log(`Unsubscribed from /topic/chat/${chatId}`);
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
        throw new Error(`Lỗi khi tải tin nhắn: ${errorText}`);
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
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        </div>
    );
  }

  return (
      <div className="flex h-screen bg-gray-100">
        <div className="flex flex-col flex-grow">
          <div className="bg-white border-b p-4">
            <h5 className="font-bold mb-0">Tin nhắn</h5>
            <div className="flex mt-3 gap-2">
              <div className="flex items-center bg-gray-100 rounded-full px-3 flex-grow">
                <FaSearch className="text-gray-400" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      if (showUserSelectionModal) {
                        setSearchKeyword(e.target.value);
                      }
                    }}
                    placeholder="Tìm kiếm người dùng hoặc tin nhắn"
                    className="bg-gray-100 border-0 outline-none px-2 py-2 flex-grow rounded-full"
                />
              </div>
              <button
                  className="bg-blue-500 text-white px-4 py-2 rounded-full hover:bg-blue-600"
                  onClick={handleOpenUserSelectionModal}
              >
                <FaPenSquare className="inline-block mr-1" /> Tin nhắn mới
              </button>
            </div>
          </div>

          <div className="flex flex-grow">
            <div className="w-[350px] border-r bg-white overflow-y-auto">
              {filteredChats.map((chat) => (
                  <div
                      key={chat.id}
                      className={`flex items-center px-4 py-3 cursor-pointer hover:bg-gray-100 ${
                          selectedChatId === chat.id ? "bg-gray-200" : ""
                      } ${chat.unreadMessagesCount > 0 ? "font-bold" : ""}`}
                      onClick={() => handleSelectChat(chat.id)}
                  >
                    <img
                        src="/assets/default-avatar.png"
                        alt="Avatar"
                        className="rounded-full w-10 h-10 mr-3"
                    />
                    <div className="flex-grow">
                      <p className="mb-0">{chat.name || "Unknown User"}</p>
                      <p className="text-gray-500 text-sm truncate">{chat.lastMessage}</p>
                    </div>
                    <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteChat(chat.id);
                        }}
                        className="text-red-500 hover:text-red-700"
                    >
                      <FaTrash />
                    </button>
                  </div>
              ))}
            </div>

            <div className="flex-grow">
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
                  <div className="flex justify-center items-center h-full">
                    <p className="text-gray-500">Chọn một cuộc trò chuyện</p>
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