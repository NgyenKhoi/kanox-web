import React, { useState, useEffect, useRef, useContext } from "react";
import { Form, Button, InputGroup } from "react-bootstrap";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthContext } from "../../context/AuthContext";
import { WebSocketContext } from "../../context/WebSocketContext";
import { FaPaperclip, FaPaperPlane } from "react-icons/fa";

const Chat = ({ chatId }) => {
    const { user, token, logout } = useContext(AuthContext);
    const { publish, subscribe, unsubscribe } = useContext(WebSocketContext);
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [recipientName, setRecipientName] = useState("");
    const chatContainerRef = useRef(null);

    const fetchUnreadMessageCount = async () => {
        try {
            const response = await fetch(
                `${process.env.REACT_APP_API_URL}/chat/messages/unread-count`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.ok) {
                const messageData = await response.json();
                window.dispatchEvent(
                    new CustomEvent("updateUnreadCount", {
                        detail: { unreadCount: messageData.unreadCount || 0 },
                    })
                );
            }
        } catch (error) {
            console.error("Error fetching unread count:", error);
        }
    };

    useEffect(() => {
        if (!token || !user || !chatId) {
            toast.error("Vui lòng đăng nhập để sử dụng chat.");
            logout();
            return;
        }

        // Subscribe to WebSocket topics
        const subscriptions = [];
        const handleMessage = (data) => {
            console.log("Received WebSocket message:", data);
            if (data.type === "MESSAGE") {
                setMessages((prev) => {
                    if (!prev.some((m) => m.id === data.id)) {
                        return [...prev, data].sort(
                            (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
                        );
                    }
                    return prev;
                });
                setIsTyping(false);
                fetchUnreadMessageCount();
            } else if (data.type === "TYPING") {
                if (data.userId !== user?.id) setIsTyping(data.isTyping);
            } else if (data.unreadCount !== undefined) {
                window.dispatchEvent(
                    new CustomEvent("updateUnreadCount", {
                        detail: { unreadCount: data.unreadCount || 0 },
                    })
                );
            }
        };

        subscriptions.push(subscribe(`/topic/chat/${chatId}`, handleMessage, `chat-${chatId}`));
        subscriptions.push(subscribe(`/topic/typing/${chatId}`, handleMessage, `typing-${chatId}`));
        subscriptions.push(subscribe(`/topic/messages/${user.id}`, handleMessage, `messages-${user.id}`));
        subscriptions.push(subscribe(`/topic/unread-count/${user.id}`, handleMessage, `unread-count-${user.id}`));

        // Send resend request
        publish("/app/resend", { chatId: Number(chatId) });

        // Fetch initial chat data
        fetch(`${process.env.REACT_APP_API_URL}/chat/${chatId}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(async (response) => {
                const data = await response.json();
                if (response.ok) {
                    setRecipientName(data.name || "Unknown User");
                } else {
                    throw new Error(data.message || "Lỗi khi lấy thông tin chat.");
                }
            })
            .catch((err) => toast.error(err.message || "Lỗi khi lấy thông tin chat."));

        fetch(`${process.env.REACT_APP_API_URL}/chat/${chatId}/messages`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(async (response) => {
                const data = await response.json();
                if (response.ok) {
                    setMessages(
                        data.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
                    );
                    fetchUnreadMessageCount();
                } else {
                    throw new Error(data.message || "Lỗi khi tải tin nhắn.");
                }
            })
            .catch((err) => toast.error(err.message || "Lỗi khi tải tin nhắn."));

        return () => {
            subscriptions.forEach((_, index) => unsubscribe(`chat-${chatId}-${index}`));
        };
    }, [chatId, user, token, logout, publish, subscribe, unsubscribe]);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const sendMessage = () => {
        if (!message.trim()) return;
        const msg = {
            chatId: Number(chatId),
            senderId: user.id,
            content: message,
            typeId: 1,
        };
        publish("/app/sendMessage", msg);
        setMessage("");
        publish("/app/typing", {
            chatId: Number(chatId),
            userId: user.id,
            isTyping: false,
        });
        console.log("Sent message:", msg);
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const sendTyping = () => {
        if (message.length > 0) {
            publish("/app/typing", {
                chatId: Number(chatId),
                userId: user.id,
                isTyping: true,
            });
            console.log("Sent typing status");
        }
    };

    return (
        <div className="d-flex flex-column h-100 bg-light">
            <div className="p-3 border-bottom bg-white shadow-sm d-flex align-items-center">
                <h5 className="mb-0 flex-grow-1">{recipientName}</h5>
            </div>

            <div
                className="flex-grow-1 overflow-auto p-3"
                ref={chatContainerRef}
                style={{ maxHeight: "calc(100vh - 200px)", overflowY: "scroll" }}
            >
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`mb-2 d-flex ${
                            msg.senderId === user?.id
                                ? "justify-content-end"
                                : "justify-content-start"
                        }`}
                    >
                        <div
                            className={`p-2 rounded-3 shadow-sm ${
                                msg.senderId === user?.id
                                    ? "bg-dark text-white"
                                    : "bg-white text-dark"
                            }`}
                            style={{ borderRadius: "20px" }}
                        >
                            {msg.content}
                            <div className="text-end">
                                <small
                                    className={
                                        msg.senderId === user?.id ? "text-light" : "text-muted"
                                    }
                                    style={{ fontSize: "0.75rem" }}
                                >
                                    {new Date(msg.createdAt).toLocaleTimeString()}
                                </small>
                            </div>
                        </div>
                    </div>
                ))}
                {isTyping && <div className="text-muted">Đang nhập...</div>}
            </div>

            <div className="p-3 border-top bg-white">
                <InputGroup
                    className="shadow-sm rounded-3 overflow-hidden"
                    style={{ backgroundColor: "#f8f9fa" }}
                >
                    <Button variant="outline-secondary" className="border-0">
                        <FaPaperclip />
                    </Button>
                    <Form.Control
                        placeholder="Nhập tin nhắn..."
                        value={message}
                        onChange={(e) => {
                            setMessage(e.target.value);
                            sendTyping();
                        }}
                        onKeyPress={handleKeyPress}
                        className="border-0"
                        style={{ backgroundColor: "#f8f9fa" }}
                    />
                    <Button onClick={sendMessage} variant="primary" className="border-0">
                        <FaPaperPlane />
                    </Button>
                </InputGroup>
            </div>

            <ToastContainer />
        </div>
    );
};

export default Chat;