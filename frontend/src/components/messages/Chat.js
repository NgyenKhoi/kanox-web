import React, { useState, useEffect, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom"; // Thêm useNavigate
import { Form, Button, InputGroup, OverlayTrigger, Tooltip } from "react-bootstrap";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthContext } from "../../context/AuthContext";
import { WebSocketContext } from "../../context/WebSocketContext";
import { FaPaperclip, FaPaperPlane, FaPhone } from "react-icons/fa";

const Chat = ({ chatId }) => {
    const { user, token } = useContext(AuthContext);
    const { publish, subscribe, unsubscribe } = useContext(WebSocketContext) || {};
    const navigate = useNavigate(); // Khởi tạo useNavigate
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
            console.log("Sent /app/resend for chatId:", `${chatId}`);
        } else {
            console.warn("Retrying /app/resend for chatId:", `${chatId}`);
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

// Hàm điều hướng đến trang Call
const handleStartCall = () => {
    navigate(`/call/${chatId}`);
};

return (
    <div className="flex flex-col h-full bg-[var(--background-color)]">
    <div className="p-3 border-b border-[var(--border-color)] bg-[var(--background-color)] shadow-sm flex items-center">
            <h5 className="mb-0 flex-grow text-[var(--text-color)]">{recipientName}</h5>
            <OverlayTrigger placement="left" overlay={<Tooltip className="!bg-[var(--tooltip-bg-color)] !text-[var(--text-color)] dark:!bg-gray-800 dark:!text-white">
                Gọi video</Tooltip>}>
                <Button variant="outline-primary" size="sm" onClick={handleStartCall} className="ms-2">
                    <FaPhone />
                </Button>
            </OverlayTrigger>
        </div>
        <div className="flex-grow overflow-y-auto p-3 max-h-[calc(100vh-200px)]" ref={chatContainerRef}>
        {messages.map((msg) => (
                <div key={msg.id} className={`mb-2 flex ${msg.senderId === user?.id ? "justify-end" : "justify-start"}`}>
                    <div className={`p-2 rounded-2xl shadow-sm ${msg.senderId === user?.id ? "bg-[var(--primary-bg-color)] text-[var(--light-text-color)]" : "bg-[var(--input-bg-color)] text-[var(--text-color)]"}`}>
                        {msg.content}
                        <div className="text-end">
                            <small className={`${msg.senderId === user?.id ? "text-[var(--light-text-color)]" : "text-[var(--text-color-muted)]"} text-xs`}>
                                {new Date(msg.createdAt).toLocaleTimeString()}
                            </small>
                        </div>
                    </div>
                </div>
            ))}
            {typingUsers.length > 0 && <div className="text-[var(--text-color-muted)]">{typingUsers.join(", ")} đang nhập...</div>}
        </div>
        <div className="p-3 border-t border-[var(--border-color)] bg-[var(--background-color)]">
            <div className="flex items-center bg-[var(--input-bg-color)] rounded-xl shadow-sm overflow-hidden">
                <button className="p-2 text-[var(--text-color)] hover:opacity-80"><FaPaperclip /></button>
                <input
                    type="text"
                    placeholder="Nhập tin nhắn..."
                    value={message}
                    onChange={(e) => { setMessage(e.target.value); sendTyping(); }}
                    onKeyPress={handleKeyPress}
                    className="flex-grow bg-transparent border-none px-2 py-2 text-[var(--text-color)] placeholder:text-[var(--text-color-muted)] outline-none"
                />
                <button onClick={sendMessage} className="p-2 text-[var(--text-color)] hover:opacity-80"><FaPaperPlane /></button>
            </div>

        </div>
        <ToastContainer />
    </div>
);
};

export default Chat;