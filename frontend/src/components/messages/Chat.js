import React, { useState, useEffect, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom"; // Thêm useNavigate
import { Form, Button, InputGroup, OverlayTrigger, Tooltip } from "react-bootstrap";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthContext } from "../../context/AuthContext";
import { WebSocketContext } from "../../context/WebSocketContext";
import { FaPaperclip, FaPaperPlane, FaPhone, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";

const Chat = ({ chatId, messages, onMessageUpdate, onSendMessage }) => {
    const { user, token } = useContext(AuthContext);
    const { publish, subscribe, unsubscribe } = useContext(WebSocketContext) || {};
    const navigate = useNavigate(); // Khởi tạo useNavigate

    console.log("🚩 Chat rendering with messages:", messages);
    // const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");
    const [typingUsers, setTypingUsers] = useState([]);
    const [recipientName, setRecipientName] = useState("");
    const [isSpam, setIsSpam] = useState(false);
    const chatContainerRef = useRef(null);
    const isConnectedRef = useRef(false);
    const lastMessageIdRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const messagesRef = useRef(messages);

    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

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
            return;
        }

        const subscriptions = [];
        const handleMessage = (data) => {
            console.log("Received WebSocket message:", data);
            if (data.id && data.content) {
                if (onMessageUpdate && typeof data.id !== "undefined") {
                    const isDuplicate = messagesRef.current.some((msg) => msg.id === data.id);
                    if (!isDuplicate) {
                        onMessageUpdate(data);
                    } else {
                        console.warn("Duplicate message ignored:", data);
                    }
                }
                fetchUnreadMessageCount();
            } else if (data.isTyping !== undefined && data.userId !== user?.id) {
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
            } else if (data.unreadCount !== undefined) {
                window.dispatchEvent(
                    new CustomEvent("updateUnreadCount", {
                        detail: { unreadCount: data.unreadCount || 0 },
                    })
                );
            }
        };

        const handleSpamStatus = (data) => {
            console.log("Received spam status update:", data);
            if (data.chatId === Number(chatId)) {
                setIsSpam(data.isSpam);
                toast.info(data.isSpam ? "Người dùng đã được đánh dấu là spam" : "Người dùng đã được bỏ đánh dấu spam");
            }
        };

        subscriptions.push(subscribe(`/topic/chat/${chatId}`, handleMessage, `chat-${chatId}`));
        subscriptions.push(subscribe(`/topic/typing/${chatId}`, handleMessage, `typing-${chatId}`));
        subscriptions.push(subscribe(`/topic/unread-count/${user.id}`, handleMessage, `unread-count-${user.id}`));
        subscriptions.push(subscribe(`/topic/spam-status/${chatId}`, handleSpamStatus, `spam-status-${chatId}`));

        // Lấy trạng thái is_spam ban đầu
        fetch(`${process.env.REACT_APP_API_URL}/chat/${chatId}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(async (response) => {
                const data = await response.json();
                if (response.ok) {
                    setRecipientName(data.name || "Unknown User");
                    // Giả định API trả về danh sách thành viên với isSpam
                    const membersResponse = await fetch(`${process.env.REACT_APP_API_URL}/chat/${chatId}/members`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    if (membersResponse.ok) {
                        const members = await membersResponse.json();
                        const recipient = members.find((member) => member.userId !== user.id);
                        setIsSpam(recipient?.isSpam || false);
                    }
                } else {
                    throw new Error(data.message || "Lỗi khi lấy thông tin chat.");
                }
            })
            .catch((err) => toast.error(err.message || "Lỗi khi lấy thông tin chat."));

        return () => {
            subscriptions.forEach((_, index) => unsubscribe(`chat-${chatId}-${index}`));
            clearTimeout(typingTimeoutRef.current);
            isConnectedRef.current = false;
        };
    }, [chatId, user, token, publish, subscribe, unsubscribe, onMessageUpdate]);

    const handleMarkSpam = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/chat/mark-spam`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ chatId: Number(chatId), targetUserId: messages[0]?.senderId !== user.id ? messages[0]?.senderId : null }),
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Lỗi khi đánh dấu spam: ${errorText}`);
            }
            setIsSpam(true);
            toast.success("Đã đánh dấu người dùng là spam");
        } catch (err) {
            toast.error(err.message || "Lỗi khi đánh dấu spam");
        }
    };

    const handleUnmarkSpam = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/chat/unmark-spam`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ chatId: Number(chatId), targetUserId: messages[0]?.senderId !== user.id ? messages[0]?.senderId : null }),
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Lỗi khi bỏ đánh dấu spam: ${errorText}`);
            }
            setIsSpam(false);
            toast.success("Đã bỏ đánh dấu spam cho người dùng");
        } catch (err) {
            toast.error(err.message || "Lỗi khi bỏ đánh dấu spam");
        }
    };


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
                    Gọi video
                </Tooltip>}>
                    <Button variant="outline-primary" size="sm" onClick={handleStartCall} className="ms-2">
                        <FaPhone />
                    </Button>
                </OverlayTrigger>
                <OverlayTrigger placement="left" overlay={<Tooltip className="!bg-[var(--tooltip-bg-color)] !text-[var(--text-color)] dark:!bg-gray-800 dark:!text-white">
                    {isSpam ? "Bỏ đánh dấu spam" : "Đánh dấu spam"}
                </Tooltip>}>
                    <Button
                        variant={isSpam ? "outline-success" : "outline-warning"}
                        size="sm"
                        onClick={isSpam ? handleUnmarkSpam : handleMarkSpam}
                        className="ms-2"
                    >
                        {isSpam ? <FaCheckCircle /> : <FaExclamationTriangle />}
                    </Button>
                </OverlayTrigger>
            </div>
            <div className="flex-grow overflow-y-auto p-3 max-h-[calc(100vh-200px)]" ref={chatContainerRef}>
                {messages.map((msg) => {
                    const isMissedCall = msg.typeId === 4;
                    return (
                        <div key={msg.id} className={`mb-2 flex ${msg.senderId === user?.id ? "justify-end" : "justify-start"}`}>
                            <div className={`p-3 rounded-3xl shadow-md max-w-[70%] ${isMissedCall
                                ? "bg-yellow-100 text-yellow-800 italic"
                                : msg.senderId === user?.id
                                    ? "bg-[var(--primary-color)] text-white"
                                    : "bg-[var(--message-other-bg)] text-[var(--text-color)]"
                            }`}>
                                {isMissedCall ? (
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="mr-2">{msg.content}</span>
                                        <button
                                            onClick={() => navigate(`/call/${chatId}`)}
                                            className="text-sm text-blue-600 hover:underline"
                                        >
                                            Gọi lại
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        {msg.content}
                                        <div className="text-end mt-1">
                                            <small className={`${msg.senderId === user?.id ? "text-[var(--light-text-color)]" : "text-[var(--text-color-muted)]"} text-xs`}>
                                                {new Date(msg.createdAt).toLocaleTimeString()}
                                            </small>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}
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
