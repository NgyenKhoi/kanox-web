import React, { useState, useEffect, useRef, useContext } from 'react';
import { Form, Button, Container, Row, Col } from "react-bootstrap";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import SockJS from "sockjs-client";
import { Client } from '@stomp/stompjs'; // Đúng import
import Peer from "simple-peer";
import { AuthContext } from '../context/AuthContext';

const Chat = ({ chatId }) => {
    const { user, token } = useContext(AuthContext);
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");
    const [stompClient, setStompClient] = useState(null);
    const [peer, setPeer] = useState(null);
    const [stream, setStream] = useState(null);
    const videoRef = useRef();
    const remoteVideoRef = useRef();

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
            });
            client.subscribe(`/topic/call/${chatId}`, (signal) => {
                const data = JSON.parse(signal.body);
                if (data.type === "offer" && data.userId !== user.id) {
                    handleOffer(data);
                } else if (data.type === "answer" && peer) {
                    peer.signal(data.sdp);
                } else if (data?.type === "ice-candidate" && peer) {
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
                videoRef.current.srcObject = stream;
            })
            .catch((err) => {
                toast.error("Lỗi khi truy cập camera/mic.");
            });

        return () => {
            if (stompClient) {
                stompClient.deactivate();
            }
            if (stream) stream.getTracks().forEach((track) => track.stop());
        };
    }, [chatId, user, token]);

    const sendMessage = () => {
        if (message && stompClient && user) {
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
            remoteVideoRef.current.srcObject = remoteStream;
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
            remoteVideoRef.current.srcObject = remoteStream;
        });
        newPeer.signal(data.sdp);
        setPeer(newPeer);
    };

    return (
        <>
            <ToastContainer />
            <Container
                className="p-4"
                style={{ height: "100vh", backgroundColor: "#fff" }}
            >
                <h3 className="fw-bold mb-4">Phòng Chat</h3>
                <div
                    className="flex-1 overflow-y-auto mb-4"
                    style={{
                        height: "calc(100vh - 250px)",
                        border: "1px solid #ddd",
                        padding: "10px",
                        backgroundColor: "#f9f9f9",
                        borderRadius: "10px",
                    }}
                >
                    {messages.map((msg, index) => (
                        <div
                            key={index}
                            className={`mb-2 ${
                                msg.senderId === user?.id ? "text-end" : "text-start"
                            }`}
                        >
              <span
                  className="p-2 rounded-3 d-inline-block"
                  style={{
                      backgroundColor: msg.senderId === user?.id ? "#007bff" : "#e9ecef",
                      color: msg.senderId === user?.id ? "#fff" : "#000",
                      maxWidth: "70%",
                  }}
              >
                {msg.content}
              </span>
                        </div>
                    ))}
                </div>
                <Form
                    onSubmit={(e) => {
                        e.preventDefault();
                        sendMessage();
                    }}
                >
                    <Form.Group className="mb-3 d-flex">
                        <Form.Control
                            type="text"
                            placeholder="Nhập tin nhắn..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="py-3 px-3 rounded-3 me-2"
                            style={{ fontSize: "1.1rem" }}
                        />
                        <Button
                            type="submit"
                            variant="dark"
                            className="py-3 rounded-pill fw-bold"
                            style={{
                                backgroundColor: "#000",
                                borderColor: "#000",
                                fontSize: "1.2rem",
                            }}
                        >
                            Gửi
                        </Button>
                    </Form.Group>
                </Form>
                <div className="mt-4">
                    <Button
                        onClick={startCall}
                        variant="success"
                        className="py-3 rounded-pill fw-bold"
                        style={{ fontSize: "1.2rem" }}
                    >
                        Bắt đầu gọi video
                    </Button>
                    <Row className="mt-4">
                        <Col>
                            <video
                                ref={videoRef}
                                autoPlay
                                muted
                                style={{ width: "100%", borderRadius: "10px" }}
                            />
                        </Col>
                        <Col>
                            <video
                                ref={remoteVideoRef}
                                autoPlay
                                style={{ width: "100%", borderRadius: "10px" }}
                            />
                        </Col>
                    </Row>
                </div>
            </Container>
        </>
    );
};

export default Chat;