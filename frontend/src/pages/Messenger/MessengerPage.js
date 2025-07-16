import React, { useState, useEffect, useContext, useCallback, useRef, useMemo } from "react";
import {
  Container,
  Row,
  Col,
  InputGroup,
  Form,
  Button,
  ListGroup,
  Spinner,
  Nav,
} from "react-bootstrap";
import { FaSearch, FaPenSquare, FaTrash } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Chat from "../../components/messages/Chat";
import { AuthContext } from "../../context/AuthContext";
import { WebSocketContext } from "../../context/WebSocketContext";
import UserSelectionModal from "../../components/messages/UserSelectionModal";
import useUserSearch from "../../hooks/useUserSearch";
import useMedia from "../../hooks/useMedia";
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
  const subscriptionsRef = useRef({});
  const resendSentRef = useRef(new Set());
  const [spamMessages, setSpamMessages] = useState({});
  const [activeTab, setActiveTab] = useState("inbox");
  const [chatTargetUserMap, setChatTargetUserMap] = useState({});

  const {
    searchKeyword,
    setSearchKeyword,
    searchResults,
    isSearching,
    debouncedSearch,
  } = useUserSearch(token, navigate);

  // Extract targetUserIds from chats
  const targetUserIds = useMemo(() => {
    return Object.values(chatTargetUserMap).filter((id) => id && id !== user.id);
  }, [chatTargetUserMap, user.id]);

  // Use useMedia to fetch avatars for all chat participants
  const { mediaData, loading: mediaLoading, error: mediaError } = useMedia(
      targetUserIds,
      "PROFILE",
      "image"
  );

  useEffect(() => {
    const fetchAllTargetUserIds = async () => {
      const newMap = {};
      for (const chat of chats) {
        try {
          const res = await fetch(`${process.env.REACT_APP_API_URL}/chat/${chat.id}/members`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const members = await res.json();
            const other = members.find((m) => m.userId !== user.id);
            if (other) newMap[chat.id] = other.userId;
          }
        } catch (err) {
          console.error("Error fetching members for chat", chat.id, err);
        }
      }
      setChatTargetUserMap(newMap);
    };

    if (chats.length > 0) {
      fetchAllTargetUserIds();
    }
  }, [chats, token, user.id]);

  const groupedMediaData = useMemo(() => {
    const grouped = {};
    if (mediaData && typeof mediaData === "object") {
      Object.entries(mediaData).forEach(([key, items]) => {
        const numericKey = Number(key);
        grouped[numericKey] = items;
      });
    }
    return grouped;
  }, [mediaData]);

  const getAvatarUrl = (targetUserId) => {
    if (!targetUserId || targetUserId === user.id) {
      return "/assets/default-avatar.png";
    }
    const key = Number(targetUserId);
    return groupedMediaData?.[key]?.[0]?.url || "/assets/default-avatar.png";
  };

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
        setSpamMessages((prev) => {
          const newSpamMessages = { ...prev };
          delete newSpamMessages[message.chatId];
          return newSpamMessages;
        });
        navigate("/messages");
      }
      toast.success("Chat đã được xóa.");
    } else if (message.id) {
      setChats((prev) => {
        const existingChat = prev.find((chat) => chat.id === message.id);
        if (existingChat && JSON.stringify(existingChat) === JSON.stringify(message)) {
          return prev;
        }
        const updatedChat = {
          ...message,
          name: message.name || "Unknown User",
        };
        if (existingChat) {
          return prev.map((chat) =>
              chat.id === message.id ? { ...chat, ...updatedChat } : chat
          );
        }
        return [...prev, updatedChat];
      });
      setUnreadChats((prev) => {
        const newUnread = new Set(prev);
        if (message.unreadMessagesCount > 0 && selectedChatId !== message.id) {
          newUnread.add(message.id);
        } else {
          newUnread.delete(message.id);
        }
        return newUnread;
      });
    }
  }, [selectedChatId, navigate]);

  const subscribeToChatMessages = useCallback((chatId) => {
    if (!subscribe || !chatId) return;

    if (subscriptionsRef.current[chatId]) {
      console.warn("Đã subscribe rồi:", chatId);
      return;
    }

    const topic = `/topic/chat/${chatId}`;
    const subId = `chat-${chatId}`;

    const callback = (newMessage) => {
      try {
        setMessages((prev) => {
          const currentMessages = prev[chatId] || [];
          const exists = currentMessages.some((msg) => msg.id === newMessage.id);
          if (exists) {
            console.warn("🚫 Duplicate message (callback ignored):", newMessage);
            return prev;
          }
          return {
            ...prev,
            [chatId]: [...currentMessages, newMessage],
          };
        });

        setChats((prevChats) => {
          const existingChat = prevChats.find((chat) => chat.id === chatId);
          if (!existingChat) return prevChats;
          const updatedChat = {
            ...existingChat,
            lastMessage: newMessage.content,
            lastSenderId: newMessage.senderId,
          };
          if (JSON.stringify(existingChat) === JSON.stringify(updatedChat)) {
            return prevChats;
          }
          return prevChats.map((chat) =>
              chat.id === chatId ? updatedChat : chat
          );
        });
      } catch (err) {
        console.error("Lỗi khi xử lý message:", err);
      }
    };

    const spamCallback = (newMessage) => {
      try {
        setSpamMessages((prev) => {
          const currentSpamMessages = prev[chatId] || [];
          const exists = currentSpamMessages.some((msg) => msg.id === newMessage.id);
          if (exists) {
            console.warn("🚫 Duplicate spam message ignored:", newMessage);
            return prev;
          }
          return {
            ...prev,
            [chatId]: [...currentSpamMessages, newMessage],
          };
        });
      } catch (err) {
        console.error("Lỗi khi xử lý spam message:", err);
      }
    };

    subscriptionsRef.current[chatId] = [
      subscribe(topic, callback, subId),
      subscribe(`/topic/spam-messages/${chatId}`, spamCallback, `spam-messages-${chatId}`)
    ];
    console.log("✅ Subscribed to", topic, "and /topic/spam-messages/", chatId);
  }, [subscribe, selectedChatId, user.id]);

  const unsubscribeFromChatMessages = useCallback((chatId) => {
    if (unsubscribe && subscriptionsRef.current[chatId] && chatId) {
      subscriptionsRef.current[chatId].forEach((_, index) => unsubscribe(`chat-${chatId}-${index}`));
      delete subscriptionsRef.current[chatId];
    }
  }, [unsubscribe]);

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

    const subscriptions = [];
    subscriptions.push(subscribe(`/topic/chats/${user.id}`, handleMessageUpdate, `chats-${user.id}`));
    subscriptions.push(subscribe(`/topic/unread-count/${user.id}`, (data) => {
      const count = data.unreadCount ?? 0;
      console.log(`Received unread chat count for user ${user.id}:`, count);
      window.dispatchEvent(
          new CustomEvent("updateUnreadCount", {
            detail: { unreadCount: count },
          })
      );
    }, `unread-count-${user.id}`));

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
        window.dispatchEvent(
            new CustomEvent("updateUnreadCount", {
              detail: { unreadCount: unread.size },
            })
        );
      } catch (err) {
        toast.error(err.message || "Lỗi khi tải danh sách chat.");
      } finally {
        setLoading(false);
      }
    };

    fetchChats();

    return () => {
      subscriptions.forEach((_, index) => unsubscribe(`subscription-${user.id}-${index}`));
      Object.keys(subscriptionsRef.current).forEach((chatId) => {
        unsubscribeFromChatMessages(Number(chatId));
      });
      subscriptionsRef.current = {};
    };
  }, [token, user, subscribe, unsubscribe, publish, handleMessageUpdate, unsubscribeFromChatMessages]);

  useEffect(() => {
    const activeChatIds = new Set(chats.map((chat) => chat.id));
    chats.forEach((chat) => {
      if (!subscriptionsRef.current[chat.id]) {
        subscribeToChatMessages(chat.id);
      }
    });
    Object.keys(subscriptionsRef.current).forEach((chatId) => {
      if (!activeChatIds.has(Number(chatId))) {
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
    if (chatId && !resendSentRef.current.has(Number(chatId))) {
      setSelectedChatId(Number(chatId));
      subscribeToChatMessages(Number(chatId));
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
          setUnreadChats((prev) => {
            const newUnread = new Set(prev);
            newUnread.delete(Number(chatId));
            return newUnread;
          });

          const spamResponse = await fetch(`${process.env.REACT_APP_API_URL}/chat/${chatId}/spam-messages`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (spamResponse.ok) {
            const spamData = await spamResponse.json();
            setSpamMessages((prev) => ({ ...prev, [chatId]: spamData }));
          }
        } catch (err) {
          toast.error(err.message || "Lỗi khi tải tin nhắn.");
        }
      };
      fetchMessages();
      if (publish) {
        publish("/app/resend", { chatId: Number(chatId) });
        resendSentRef.current.add(Number(chatId));
      }
    }
    return () => {
      if (chatId) {
        resendSentRef.current.delete(Number(chatId));
      }
    };
  }, [searchParams, publish, subscribeToChatMessages]);

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
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/chat/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ targetUserId: userId }),
      });

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
        setSpamMessages((prev) => {
          const newSpamMessages = { ...prev };
          delete newSpamMessages[chatId];
          return newSpamMessages;
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
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/chat/${chatId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error("Lỗi khi tải tin nhắn.");
      }
      const data = await response.json();
      setMessages((prev) => ({ ...prev, [chatId]: data }));

      const spamResponse = await fetch(`${process.env.REACT_APP_API_URL}/chat/${chatId}/spam-messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (spamResponse.ok) {
        const spamData = await spamResponse.json();
        setSpamMessages((prev) => ({ ...prev, [chatId]: spamData }));
      }

      setUnreadChats((prev) => {
        const newUnread = new Set(prev);
        newUnread.delete(chatId);
        return newUnread;
      });

      if (publish) {
        publish("/app/resend", { chatId });
      }
    } catch (err) {
      toast.error(err.message || "Lỗi khi tải tin nhắn.");
    }
  };

  const filteredChats = chats.filter((chat) =>
      (chat.name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading || mediaLoading) {
    return (
        <div className="d-flex justify-content-center align-items-center h-100">
          <Spinner animation="border" />
        </div>
    );
  }

  if (mediaError) {
    toast.error(mediaError);
  }

  return (
      <div className="flex h-screen bg-[var(--background-color)] text-[var(--text-color)]">
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
            <Nav variant="tabs" activeKey={activeTab} onSelect={(key) => setActiveTab(key)} className="mt-3">
              <Nav.Item>
                <Nav.Link eventKey="inbox">Hộp thư đến</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="spam">Tin nhắn spam</Nav.Link>
              </Nav.Item>
            </Nav>
          </div>
          <div className="flex flex-grow h-full overflow-hidden min-h-0">
            <div className="w-1/3 border-r border-[var(--border-color)] bg-[var(--card-bg)] overflow-y-auto">
              {filteredChats.map((chat) => {
                const isUnread = unreadChats.has(chat.id) && selectedChatId !== chat.id;
                const isFromOthers = chat.lastSenderId && chat.lastSenderId !== user.id;
                const avatarUrl = getAvatarUrl(chatTargetUserMap[chat.id]);

                return (
                    <div
                        key={chat.id}
                        onClick={() => handleSelectChat(chat.id)}
                        className={`flex items-center justify-between p-4 border-b border-[var(--border-color)] hover:bg-[var(--hover-bg-color)] cursor-pointer ${
                            selectedChatId === chat.id ? "bg-gray-200 dark:bg-gray-700" : ""
                        }`}
                    >
                      <img
                          src={avatarUrl}
                          alt="Avatar"
                          className="w-10 h-10 rounded-full object-cover mr-3"
                      />
                      <div className="flex-1">
                        <p className={`text-sm ${isUnread ? "font-bold" : ""}`}>
                          {chat.name || "Unknown User"}
                        </p>
                        <p className={`text-xs truncate ${isUnread ? "font-semibold" : "text-gray-500"}`}>
                          {isFromOthers ? <span className="text-blue-500">Họ:</span> : null} {chat.lastMessage}
                        </p>
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
                );
              })}
            </div>
            <div className="w-2/3 bg-[var(--background-color)] h-full">
              {selectedChatId ? (
                  <Chat
                      chatId={selectedChatId}
                      messages={activeTab === "spam" ? (spamMessages[selectedChatId] || []) : (messages[selectedChatId] || [])}
                      onMessageUpdate={(newMessage) => {
                        setMessages((prev) => {
                          const existing = prev[selectedChatId] || [];
                          const isDuplicate = existing.some((msg) => msg.id === newMessage.id);
                          if (isDuplicate) {
                            console.warn("⚠️ Duplicate message ignored in MessengerPage:", newMessage);
                            return prev;
                          }
                          return {
                            ...prev,
                            [selectedChatId]: [...existing, newMessage],
                          };
                        });
                      }}
                      onSendMessage={(message) => {
                        if (publish) {
                          publish("/app/sendMessage", {
                            chatId: selectedChatId,
                            userId: user.id,
                            content: message,
                          });
                        }
                      }}
                      onEndCall={() => navigate(`/messages?chatId=${selectedChatId}`)}
                  />
              ) : (
                  <div className="flex justify-center items-center h-full text-gray-400">
                    <p>Chọn một cuộc trò chuyện</p>
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