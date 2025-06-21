import React, { useState, useEffect, useRef, useContext } from "react";
import {
  Form,
  Button,
  Container,
  Row,
  Col,
  Modal,
  InputGroup,
} from "react-bootstrap";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import Peer from "simple-peer";
import { AuthContext } from "../../context/AuthContext";
import {
  FaPaperclip,
  FaMicrophoneSlash,
  FaVideoSlash,
  FaPaperPlane,
  FaPhone,
} from "react-icons/fa";

const Chat = ({ chatId }) => {
  const { user, token } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [recipientName, setRecipientName] = useState("");
  const [showCallPanel, setShowCallPanel] = useState(false);

  const stompRef = useRef(null);
  const peerRef = useRef(null);
  const streamRef = useRef(null);
  const subscriptionsRef = useRef([]);
  const socketRef = useRef(null);
  const videoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const chatContainerRef = useRef(null);

  const fetchUnreadMessageCount = async () => {
    try {
      const token = sessionStorage.getItem("token") || localStorage.getItem("token");
      const response = await fetch(
          `${process.env.REACT_APP_API_URL}/chat/messages/unread-count`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
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

    // Lấy thông tin chat để lấy tên người nhận
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

    // Khởi tạo WebSocket
    const socket = new SockJS(`${process.env.REACT_APP_WS_URL}/ws`);
    socketRef.current = socket;
    const client = new Client({
      webSocketFactory: () => socket,
      connectHeaders: { Authorization: `Bearer ${token}` },
      debug: (str) => console.log("STOMP Debug:", str),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = () => {
      console.log("WebSocket connected for chatId:", chatId);
      const chatSub = client.subscribe(`/topic/chat/${chatId}`, (msg) => {
        console.log("Received message from WebSocket:", msg.body);
        const message = JSON.parse(msg.body);
        setMessages((prev) => {
          if (!prev.some((m) => m.id === message.id)) {
            return [...prev, message].sort(
                (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
            );
          }
          return prev;
        });
        setIsTyping(false);
        // Cập nhật unread count khi nhận tin nhắn mới
        fetchUnreadMessageCount();
      });

      const typingSub = client.subscribe(`/topic/typing/${chatId}`, (typingMsg) => {
        const data = JSON.parse(typingMsg.body);
        if (data.userId !== user?.id) setIsTyping(data.isTyping);
      });

      const callSub = client.subscribe(`/topic/call/${chatId}`, (signal) => {
        const data = JSON.parse(signal.body);
        if (data.type === "offer" && data.userId !== user?.id) {
          setShowCallModal(true);
          handleOffer(data);
        } else if (data.type === "answer" && peerRef.current) {
          peerRef.current.signal(data.sdp);
        } else if (data.type === "ice-candidate" && peerRef.current) {
          peerRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        } else if (data.type === "end") {
          leaveCall();
        }
      });

      const unreadCountSub = client.subscribe(`/topic/unread-count/${user.id}`, (msg) => {
        const data = JSON.parse(msg.body);
        window.dispatchEvent(
            new CustomEvent("updateUnreadCount", {
              detail: { unreadCount: data || 0 },
            })
        );
      });

      subscriptionsRef.current = [chatSub, typingSub, callSub, unreadCountSub];
      stompRef.current = client;

      client.publish({
        destination: "/app/resend",
        body: JSON.stringify({ chatId }),
      });

      // Gửi ping định kỳ để giữ kết nối
      const pingInterval = setInterval(() => {
        if (stompRef.current && stompRef.current.connected) {
          stompRef.current.send("/app/ping", {}, "ping");
        }
      }, 30000);

      // Load tin nhắn cũ từ API
      fetch(`${process.env.REACT_APP_API_URL}/chat/${chatId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      })
          .then(async (response) => {
            const data = await response.json();
            if (response.ok) {
              setMessages(data.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)));
              // Cập nhật unread count sau khi tải tin nhắn (đã đánh dấu là read)
              fetchUnreadMessageCount();
            } else {
              throw new Error(data.message || "Lỗi khi tải tin nhắn.");
            }
          })
          .catch((err) => toast.error(err.message || "Lỗi khi tải tin nhắn."));

      return () => {
        clearInterval(pingInterval);
      };
    };

    client.onWebSocketClose = () => {
      console.log("WebSocket disconnected, retrying...");
    };

    client.activate();

    // Khởi tạo media cho video call
    navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream) => {
          streamRef.current = stream;
          if (videoRef.current) videoRef.current.srcObject = stream;
        })
        .catch((err) => toast.error("Không thể truy cập camera/microphone."));

    // Cleanup
    return () => {
      console.log("Cleaning up WebSocket...");
      subscriptionsRef.current.forEach((s) => s.unsubscribe());
      stompRef.current?.deactivate();
      if (socketRef.current) socketRef.current.close();
      peerRef.current?.destroy();
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [chatId, user, token]);

  useEffect(() => {
    // Scroll xuống cuối khi messages thay đổi
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = () => {
    if (!message.trim() || !stompRef.current?.connected) return;
    const msg = { chatId, senderId: user.id, content: message, typeId: 1 };
    stompRef.current.publish({
      destination: "/app/sendMessage",
      body: JSON.stringify(msg),
    });
    setMessage("");
    stompRef.current.publish({
      destination: "/app/typing",
      body: JSON.stringify({ chatId, userId: user.id, isTyping: false }),
    });
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const sendTyping = () => {
    if (stompRef.current?.connected && message.length > 0) {
      stompRef.current.publish({
        destination: "/app/typing",
        body: JSON.stringify({ chatId, userId: user.id, isTyping: true }),
      });
    }
  };

  const startCall = () => {
    if (!streamRef.current || !stompRef.current?.connected) return;
    const newPeer = new Peer({
      initiator: true,
      trickle: false,
      stream: streamRef.current,
    });
    newPeer.on("signal", (signalData) => {
      stompRef.current.publish({
        destination: "/app/call/offer",
        body: JSON.stringify({ chatId, type: "offer", sdp: signalData, userId: user.id }),
      });
    });
    newPeer.on("stream", (remoteStream) => {
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
    });
    peerRef.current = newPeer;
  };

  const handleOffer = (data) => {
    if (!streamRef.current) return;
    const newPeer = new Peer({
      initiator: false,
      trickle: false,
      stream: streamRef.current,
    });
    newPeer.on("signal", (signalData) => {
      stompRef.current.publish({
        destination: "/app/call/answer",
        body: JSON.stringify({ chatId, type: "answer", sdp: signalData, userId: user.id }),
      });
    });
    newPeer.on("stream", (remoteStream) => {
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
    });
    newPeer.signal(data.sdp);
    peerRef.current = newPeer;
    setShowCallModal(false);
  };

  const leaveCall = () => {
    peerRef.current?.destroy();
    peerRef.current = null;
    stompRef.current?.publish({
      destination: "/app/call/end",
      body: JSON.stringify({ chatId, userId: user.id, type: "end" }),
    });
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
  };

  return (
      <div className="d-flex flex-column h-100 bg-light">
        <div className="p-3 border-bottom bg-white shadow-sm d-flex align-items-center">
          <h5 className="mb-0 flex-grow-1">{recipientName}</h5>
          <Button variant="outline-primary" size="sm" onClick={() => setShowCallPanel(!showCallPanel)}>
            <FaPhone />
          </Button>
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
                      msg.senderId === user?.id ? "justify-content-end" : "justify-content-start"
                  }`}
              >
                <div
                    className={`p-2 rounded-3 shadow-sm ${
                        msg.senderId === user?.id ? "bg-dark text-white" : "bg-white text-dark"
                    }`}
                    style={{ borderRadius: "20px" }}
                >
                  {msg.content}
                  <div className="text-end">
                    <small
                        className={msg.senderId === user?.id ? "text-light" : "text-muted"}
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

        {showCallPanel && (
            <div className="p-3 border-top bg-light">
              <Row>
                <Col xs={6}>
                  <video ref={videoRef} autoPlay muted style={{ width: "100%", borderRadius: 8 }} />
                  <div className="mt-2 d-flex justify-content-around">
                    <Button
                        size="sm"
                        variant={isMuted ? "danger" : "outline-danger"}
                        onClick={() => {
                          const audio = streamRef.current?.getAudioTracks()[0];
                          if (audio) {
                            audio.enabled = !isMuted;
                            setIsMuted(!isMuted);
                          }
                        }}
                    >
                      <FaMicrophoneSlash />
                    </Button>
                    <Button
                        size="sm"
                        variant={isVideoOff ? "danger" : "outline-danger"}
                        onClick={() => {
                          const video = streamRef.current?.getVideoTracks()[0];
                          if (video) {
                            video.enabled = !isVideoOff;
                            setIsVideoOff(!isVideoOff);
                          }
                        }}
                    >
                      <FaVideoSlash />
                    </Button>
                  </div>
                </Col>
                <Col xs={6}>
                  <video ref={remoteVideoRef} autoPlay style={{ width: "100%", borderRadius: 8 }} />
                  <Button variant="danger" className="w-100 mt-2" onClick={leaveCall}>
                    Thoát cuộc gọi
                  </Button>
                </Col>
              </Row>
            </div>
        )}

        <Modal show={showCallModal} centered onHide={() => setShowCallModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Cuộc gọi đến</Modal.Title>
          </Modal.Header>
          <Modal.Body>Bạn có muốn nhận cuộc gọi video?</Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCallModal(false)}>
              Từ chối
            </Button>
            <Button
                variant="primary"
                onClick={() => handleOffer({ sdp: null, userId: null })}
            >
              Chấp nhận
            </Button>
          </Modal.Footer>
        </Modal>

        <ToastContainer />
      </div>
  );
};

export default Chat;