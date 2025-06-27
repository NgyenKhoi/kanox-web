import React, { useState, useEffect, useRef, useContext } from "react";
import { Form, Button, InputGroup } from "react-bootstrap";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthContext } from "../../context/AuthContext";
import { WebSocketContext } from "../../context/WebSocketContext";
import { FaPaperclip, FaPaperPlane } from "react-icons/fa";

const Chat = ({ chatId }) => {
    const { user, token } = useContext(AuthContext);
    const { publish, subscribe, unsubscribe } = useContext(WebSocketContext) || {};
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");
    const [typingUsers, setTypingUsers] = useState([]);
    const [recipientName, setRecipientName] = useState("");
    const chatContainerRef = useRef(null);
    const isConnectedRef = useRef(false);
    const lastMessageIdRef = useRef(null);
    const typingTimeoutRef = useRef(null);

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

    const fetchMessages = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/chat/${chatId}/messages`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            if (response.ok) {
                setMessages(
                    data.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
                );
                lastMessageIdRef.current = data.length > 0 ? data[data.length - 1].id : null;
                fetchUnreadMessageCount();
            } else {
                throw new Error(data.message || "Lỗi khi tải tin nhắn.");
            }
        } catch (err) {
            toast.error(err.message || "Lỗi khi tải tin nhắn.");
        }
    };

    useEffect(() => {
        if (!token || !user || !chatId) {
            toast.error("Vui lòng đăng nhập để sử dụng chat.");
            return;
        }

        if (!subscribe || !unsubscribe || !publish) {
            console.error("WebSocketContext is not available");
            toast.error("Lỗi kết nối WebSocket. Vui lòng thử lại sau.");
            fetchMessages();
            return;
        }

        const subscriptions = [];
        const handleMessage = (data) => {
            console.log("Received WebSocket message:", data);
            if (data.id && data.content) { // Tin nhắn
                setMessages((prev) => {
                    if (!prev.some((m) => m.id === data.id)) {
                        lastMessageIdRef.current = data.id;
                        return [...prev, data].sort(
                            (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
                        );
                    }
                    return prev;
                });
                fetchUnreadMessageCount();
            } else if (data.isTyping !== undefined && data.userId !== user?.id) { // Typing
                setTypingUsers((prev) => {
                    if (data.isTyping && !prev.includes(data.username)) {
                        return [...prev, data.username];
                    } else if (!data.isTyping) {
                        return prev.filter((u) => u !== data.username);
                    }
                    return prev;
                });
                if (data.isTyping) {
                    clearTimeout(typingTimeoutRef.current);
                    typingTimeoutRef.current = setTimeout(() => {
                        setTypingUsers((prev) => prev.filter((u) => u !== data.username));
                    }, 3000);
                }
            } else if (data.unreadCount !== undefined) { // Unread count
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

        const sendResend = () => {
            if (publish && isConnectedRef.current) {
                publish("/app/resend", { chatId: Number(chatId) });
                console.log(`Sent /app/resend for chatId: ${chatId}`);
            } else {
                console.warn(`Retrying /app/resend for chatId: ${chatId}`);
                setTimeout(sendResend, 100);
            }
        };

        const checkConnection = setInterval(() => {
            if (publish && !isConnectedRef.current) {
                isConnectedRef.current = true;
                sendResend();
            }
        }, 100);

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

        fetchMessages();

        const pollInterval = setInterval(() => {
            if (!isConnectedRef.current) {
                fetchMessages();
            }
        }, 5000);

        return () => {
            subscriptions.forEach((_, index) => unsubscribe(`chat-${chatId}-${index}`));
            clearInterval(checkConnection);
            clearInterval(pollInterval);
            clearTimeout(typingTimeoutRef.current);
            isConnectedRef.current = false;
        };
    }, [chatId, user, token, publish, subscribe, unsubscribe]);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages, typingUsers]);

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
            username: user.username,
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
                username: user.username,
                isTyping: true,
            });
            console.log("Sent typing status");
        } else {
            publish("/app/typing", {
                chatId: Number(chatId),
                userId: user.id,
                username: user.username,
                isTyping: false,
            });
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
                {typingUsers.length > 0 && (
                    <div className="text-muted">{typingUsers.join(", ")} đang nhập...</div>
                )}
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