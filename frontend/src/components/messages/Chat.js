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

  const stompRef = useRef(null);
  const peerRef = useRef(null);
  const streamRef = useRef(null);
  const subscriptionsRef = useRef([]);
  const socketRef = useRef(null);

  const videoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (!token || !user || !chatId) {
      toast.error("Vui lòng đăng nhập để sử dụng chat.");
      return;
    }

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
          const ids = new Set(prev.map((m) => m.id));
          if (!ids.has(message.id)) {
            return [...prev, message].sort(
                (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
            );
          }
          return prev;
        });
        setIsTyping(false);
      });
      console.log("Subscription created for /topic/chat/" + chatId);

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

      subscriptionsRef.current = [chatSub, typingSub, callSub];
      stompRef.current = client;

      // Gửi ping định kỳ để giữ kết nối
      setInterval(() => {
        if (stompRef.current && stompRef.current.connected) {
          stompRef.current.send("/app/ping", {}, "ping");
        }
      }, 30000);
    };

    client.onWebSocketClose = () => {
      console.log("WebSocket disconnected, retrying...");
    };

    client.activate();

    // Load tin nhắn cũ
    fetch(`${process.env.REACT_APP_API_URL}/chat/${chatId}/messages`, {
      headers: { Authorization: `Bearer ${token}` },
    })
        .then(async (response) => {
          const data = await response.json();
          if (response.ok) setMessages(data);
          else throw new Error(data.message || "Lỗi khi tải tin nhắn.");
        })
        .catch((err) => toast.error(err.message || "Lỗi khi tải tin nhắn."));

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
        <div className="p-3 border-bottom bg-white shadow-sm">
          <h5 className="mb-0">Chat Room #{chatId}</h5>
        </div>

        <div className="flex-grow-1 overflow-auto p-3" ref={chatContainerRef}>
          {messages.map((msg, idx) => (
              <div
                  key={idx}
                  className={`mb-2 d-flex ${
                      msg.senderId === user?.id ? "justify-content-end" : "justify-content-start"
                  }`}
              >
                <div
                    className={`p-2 rounded shadow-sm ${
                        msg.senderId === user?.id ? "bg-primary text-white" : "bg-white"
                    }`}
                >
                  <small className="d-block fw-bold">{msg.sender?.username}</small>
                  {msg.content}
                  <div className="text-end">
                    <small className="text-muted" style={{ fontSize: "0.75rem" }}>
                      {new Date(msg.createdAt).toLocaleTimeString()}
                    </small>
                  </div>
                </div>
              </div>
          ))}
          {isTyping && <div className="text-muted">Đang nhập...</div>}
        </div>

        <div className="p-3 border-top bg-white">
          <InputGroup>
            <Button variant="outline-secondary">
              <FaPaperclip />
            </Button>
            <Form.Control
                placeholder="Nhập tin nhắn..."
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  sendTyping();
                }}
            />
            <Button onClick={sendMessage} variant="primary">
              <FaPaperPlane />
            </Button>
          </InputGroup>
        </div>

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
          <Button variant="success" className="w-100 mt-3" onClick={startCall}>
            Bắt đầu gọi video
          </Button>
        </div>

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