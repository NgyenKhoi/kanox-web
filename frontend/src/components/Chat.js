import React, { useState, useEffect, useRef, useContext } from "react";
import { Form, Button, Container, Row, Col, Dropdown, Modal } from "react-bootstrap";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import Peer from "simple-peer";
import { AuthContext } from "../context/AuthContext";
import { FaPaperclip, FaMicrophoneSlash, FaVideoSlash, FaBell, FaTrash, FaEllipsisH } from "react-icons/fa";

const Chat = ({ chatId }) => {
    const { user, token } = useContext(AuthContext);
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");
    const [stompClient, setStompClient] = useState(null);
    const [peer, setPeer] = useState(null);
    const [stream, setStream] = useState(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [messageToDelete, setMessageToDelete] = useState(null);
    const videoRef = useRef(null); // Sử dụng useRef để định nghĩa videoRef
    const remoteVideoRef = useRef(null); // Sử dụng useRef để định nghĩa remoteVideoRef

    useEffect(() => {
        if (!token || !user) {
            toast.error("Vui lòng đăng nhập để sử dụng chat.");
            return;
        }

        const socket = new SockJS(`${process.env.REACT_APP_API_URL}/ws`);
        const client = new Client({
            webSocketFactory: () => socket,
            connectHeaders: { Authorization: `Bearer ${token}` },
            debug: (str) => console.log(str),
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
        });

        client.onConnect = () => {
            client.subscribe(`/topic/chat/${chatId}`, (msg) => {
                const message = JSON.parse(msg.body);
                setMessages((prev) => [...prev, message]);
                setIsTyping(false);
            });
            client.subscribe(`/topic/typing/${chatId}`, (typingMsg) => {
                const data = JSON.parse(typingMsg.body);
                if (data.userId !== user?.id) setIsTyping(data.isTyping);
            });
            client.subscribe(`/topic/call/${chatId}`, (signal) => {
                const data = JSON.parse(signal.body);
                if (data.type === "offer" && data.userId !== user?.id) {
                    handleOffer(data);
                } else if (data.type === "answer" && peer) {
                    peer.signal(data.sdp);
                } else if (data.type === "ice-candidate" && peer) {
                    peer.addIceCandidate(new RTCIceCandidate(data.candidate));
                }
            });
            setStompClient(client);
        };

        client.activate();

        fetch(`${process.env.REACT_APP_API_URL}/chat/${chatId}/messages`, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
                Accept: "application/json",
            },
        })
            .then(async (response) => {
                const contentType = response.headers.get("content-type");
                let data;
                if (contentType && contentType.includes("application/json")) {
                    data = await response.json();
                } else {
                    throw new Error("Phản hồi không phải JSON");
                }
                if (response.ok) {
                    setMessages(data);
                } else {
                    throw new Error(data.message || "Lỗi khi tải tin nhắn.");
                }
            })
            .catch((err) => {
                toast.error(err.message || "Lỗi khi tải tin nhắn.");
            });

        navigator.mediaDevices
            .getUserMedia({ video: true, audio: true })
            .then((stream) => {
                setStream(stream);
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            })
            .catch((err) => {
                toast.error("Lỗi khi truy cập camera/mic.");
            });

        return () => {
            if (stompClient) stompClient.deactivate();
            if (stream) stream.getTracks().forEach((track) => track.stop());
            if (peer) peer.destroy();
        };
    }, [chatId, user, token]);

    const sendMessage = () => {
        if (!message.trim() || !stompClient || !user) return;
        const msg = {
            chatId,
            senderId: user.id,
            content: message,
            typeId: 1,
        };
        stompClient.publish({
            destination: "/app/sendMessage",
            body: JSON.stringify(msg),
        });
        setMessage("");
        stompClient.publish({
            destination: "/app/typing",
            body: JSON.stringify({ chatId, userId: user.id, isTyping: false }),
        });
    };

    const sendTyping = () => {
        if (stompClient && user && message.length > 0) {
            stompClient.publish({
                destination: "/app/typing",
                body: JSON.stringify({ chatId, userId: user.id, isTyping: true }),
            });
        }
    };

    const startCall = () => {
        if (!stream) {
            toast.error("Không thể bắt đầu cuộc gọi: Không có luồng video.");
            return;
        }
        const newPeer = new Peer({
            initiator: true,
            trickle: false,
            stream,
            config: {
                iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
            },
        });
        newPeer.on("signal", (data) => {
            stompClient.publish({
                destination: "/app/call/offer",
                body: JSON.stringify({
                    chatId,
                    type: "offer",
                    sdp: data,
                    userId: user.id,
                }),
            });
        });
        newPeer.on("stream", (remoteStream) => {
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = remoteStream;
            }
        });
        setPeer(newPeer);
    };

    const handleOffer = (data) => {
        if (!stream) {
            toast.error("Không thể nhận cuộc gọi: Không có luồng video.");
            return;
        }
        const newPeer = new Peer({
            initiator: false,
            trickle: false,
            stream,
            config: {
                iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
            },
        });
        newPeer.on("signal", (signalData) => {
            stompClient.publish({
                destination: "/app/call/answer",
                body: JSON.stringify({
                    chatId,
                    type: "answer",
                    sdp: signalData,
                    userId: user.id,
                }),
            });
        });
        newPeer.on("stream", (remoteStream) => {
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = remoteStream;
            }
        });
        newPeer.signal(data.sdp);
        setPeer(newPeer);
    };

    const toggleMute = () => {
        if (stream) {
            stream.getAudioTracks()[0].enabled = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    const toggleVideo = () => {
        if (stream) {
            stream.getVideoTracks()[0].enabled = !isVideoOff;
            setIsVideoOff(!isVideoOff);
        }
    };

    const leaveCall = () => {
        if (peer) {
            peer.destroy();
            setPeer(null);
            if (stream) stream.getTracks().forEach((track) => track.stop());
            setStream(null);
            if (videoRef.current) videoRef.current.srcObject = null;
            if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
            toast.success("Đã thoát cuộc gọi.");
        }
    };

    const sendFile = () => {
        toast.info("Tính năng gửi file đang phát triển!");
    };

    const handleDeleteMessage = (msgId) => {
        setMessageToDelete(msgId);
        setShowDeleteModal(true);
    };

    const confirmDeleteMessage = () => {
        if (stompClient && messageToDelete) {
            stompClient.publish({
                destination: "/app/deleteMessage",
                body: JSON.stringify({ chatId, messageId: messageToDelete, userId: user.id }),
            });
            setMessages(messages.filter((msg) => msg.id !== messageToDelete));
            setShowDeleteModal(false);
            setMessageToDelete(null);
            toast.success("Tin nhắn đã được xóa.");
        }
    };

    const toggleNotifications = () => {
        const currentState = localStorage.getItem("chatNotifications") === "on";
        localStorage.setItem("chatNotifications", currentState ? "off" : "on");
        toast.info(`Tính năng thông báo đã được ${currentState ? "tắt" : "bật"}`);
    };

    return (
        <>
            <ToastContainer />
            <Container fluid className="p-3 p-md-4" style={{ height: "100vh", backgroundColor: "#f8f9fa" }}>
                <h3 className="fw-bold mb-3 mb-md-4">Phòng Chat</h3>
                <div
                    className="flex-1 overflow-y-auto mb-3 mb-md-4"
                    style={{
                        height: "calc(100vh - 300px)",
                        border: "1px solid #ddd",
                        padding: "10px",
                        backgroundColor: "#fff",
                        borderRadius: "10px",
                    }}
                >
                    {messages.map((msg, index) => (
                        <div key={index} className={`mb-2 ${msg.senderId === user?.id ? "text-end" : "text-start"}`}>
                            <div className="d-flex align-items-start flex-column flex-md-row">
                                {msg.senderId !== user?.id && (
                                    <span className="text-muted small me-0 me-md-2 mb-1 mb-md-0">{msg.sender?.username || "Người dùng"}</span>
                                )}
                                <div className="d-flex align-items-center">
                                    <span
                                        className="p-2 rounded-3 d-inline-block"
                                        style={{
                                            backgroundColor: msg.senderId === user?.id ? "#007bff" : "#e9ecef",
                                            color: msg.senderId === user?.id ? "#fff" : "#000",
                                            maxWidth: "100%",
                                            wordBreak: "break-word",
                                        }}
                                    >
                                        {msg.content}
                                    </span>
                                    {msg.senderId === user?.id && (
                                        <Dropdown className="d-inline ms-2">
                                            <Dropdown.Toggle variant="link" className="p-0 text-muted">
                                                <FaEllipsisH />
                                            </Dropdown.Toggle>
                                            <Dropdown.Menu>
                                                <Dropdown.Item onClick={() => handleDeleteMessage(msg.id)}>
                                                    <FaTrash className="me-2" /> Xóa
                                                </Dropdown.Item>
                                            </Dropdown.Menu>
                                        </Dropdown>
                                    )}
                                </div>
                            </div>
                            {isTyping && msg.senderId !== user?.id && index === messages.length - 1 && (
                                <small className="text-muted">Đang nhập...</small>
                            )}
                        </div>
                    ))}
                </div>
                <Form
                    onSubmit={(e) => {
                        e.preventDefault();
                        sendMessage();
                    }}
                >
                    <Form.Group className="mb-3 d-flex align-items-center flex-column flex-md-row">
                        <Form.Control
                            type="text"
                            placeholder="Nhập tin nhắn..."
                            value={message}
                            onChange={(e) => {
                                setMessage(e.target.value);
                                sendTyping();
                            }}
                            className="py-2 px-3 rounded-3 mb-2 mb-md-0 me-md-2 flex-grow-1"
                            style={{ fontSize: "1.1rem" }}
                        />
                        <div className="d-flex">
                            <Button
                                type="button"
                                variant="outline-secondary"
                                className="rounded-circle p-2 me-2"
                                onClick={sendFile}
                            >
                                <FaPaperclip size={18} />
                            </Button>
                            <Button
                                type="submit"
                                variant="dark"
                                className="py-2 rounded-pill fw-bold px-4"
                                style={{ fontSize: "1.2rem" }}
                            >
                                Gửi
                            </Button>
                        </div>
                    </Form.Group>
                </Form>
                <div className="mt-3 mt-md-4">
                    <div className="d-flex justify-content-between mb-3 flex-column flex-md-row">
                        <Button
                            onClick={startCall}
                            variant="success"
                            className="py-2 rounded-pill fw-bold mb-2 mb-md-0 me-md-2"
                            style={{ fontSize: "1.1rem" }}
                        >
                            Bắt đầu gọi video
                        </Button>
                        <Dropdown>
                            <Dropdown.Toggle variant="outline-secondary" className="rounded-pill py-2 px-3">
                                <FaBell /> Thông báo
                            </Dropdown.Toggle>
                            <Dropdown.Menu>
                                <Dropdown.Item onClick={toggleNotifications}>
                                    {localStorage.getItem("chatNotifications") === "on" ? "Tắt thông báo" : "Bật thông báo"}
                                </Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>
                    </div>
                    <Row>
                        <Col xs={12} md={6} className="mb-3">
                            <video
                                ref={videoRef}
                                autoPlay
                                muted
                                style={{ width: "100%", borderRadius: "10px", border: "1px solid #ddd" }}
                            />
                            <div className="d-flex justify-content-center mt-2">
                                <Button
                                    variant={isMuted ? "danger" : "outline-danger"}
                                    className="rounded-circle p-2 me-2"
                                    onClick={toggleMute}
                                >
                                    <FaMicrophoneSlash size={18} />
                                </Button>
                                <Button
                                    variant={isVideoOff ? "danger" : "outline-danger"}
                                    className="rounded-circle p-2"
                                    onClick={toggleVideo}
                                >
                                    <FaVideoSlash size={18} />
                                </Button>
                            </div>
                        </Col>
                        <Col xs={12} md={6}>
                            <video
                                ref={remoteVideoRef}
                                autoPlay
                                style={{ width: "100%", borderRadius: "10px", border: "1px solid #ddd" }}
                            />
                            <div className="d-flex justify-content-center mt-2">
                                <Button
                                    variant="danger"
                                    className="py-2 rounded-pill fw-bold"
                                    onClick={leaveCall}
                                >
                                    Thoát cuộc gọi
                                </Button>
                            </div>
                        </Col>
                    </Row>
                </div>
            </Container>

            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Xác nhận xóa tin nhắn</Modal.Title>
                </Modal.Header>
                <Modal.Body>Bạn có chắc chắn muốn xóa tin nhắn này?</Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
                        Hủy
                    </Button>
                    <Button variant="danger" onClick={confirmDeleteMessage}>
                        Xóa
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default Chat;