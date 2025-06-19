import React, { useState, useEffect, useRef, useContext } from "react";
import {
  Form,
  Button,
  Container,
  Row,
  Col,
  Dropdown,
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
  FaBell,
  FaTrash,
  FaEllipsisH,
  FaPaperPlane,
} from "react-icons/fa";

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
  const [showCallModal, setShowCallModal] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);
  const videoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
    console.log("Token:", token, "User:", user);
    if (!token || !user) {
      toast.error("Vui lòng đăng nhập để sử dụng chat.");
      return;
    }

    const socket = new SockJS(`${process.env.REACT_APP_WS_URL}/ws`);
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
        console.log("Received call signal:", data);
        if (data.type === "offer" && data.userId !== user?.id) {
          setShowCallModal(true);
          handleOffer(data);
        } else if (data.type === "answer" && peer) {
          peer.signal(data.sdp);
        } else if (data.type === "ice-candidate" && peer) {
          peer.addIceCandidate(new RTCIceCandidate(data.candidate));
        } else if (data.type === "end") {
          leaveCall();
        }
      });
      setStompClient(client);
    };

    client.onWebSocketError = (error) => console.error("WebSocket error:", error);
    client.onStompError = (frame) => console.error("STOMP error:", frame.body);
    client.onDisconnect = () => console.log("WebSocket disconnected, retrying...");

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
        .catch((err) => toast.error(err.message || "Lỗi khi tải tin nhắn."));

    const getMediaStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setStream(stream);
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) {
        toast.error("Vui lòng cấp quyền camera/microphone: " + err.message);
        console.error("Media error:", err);
      }
    };
    getMediaStream();

    return () => {
      if (stompClient) stompClient.deactivate();
      if (stream) stream.getTracks().forEach((track) => track.stop());
      if (peer) peer.destroy();
    };
  }, [chatId, user, token, peer]);

  const sendMessage = () => {
    if (!message.trim() || !stompClient?.connected || !user) {
      toast.error("Không thể gửi tin nhắn. Vui lòng kiểm tra kết nối.");
      return;
    }
    const msg = { chatId, senderId: user.id, content: message, typeId: 1 };
    console.log("Sending message:", msg);
    stompClient.publish({
      destination: "/app/sendMessage",
      body: JSON.stringify(msg),
    });
    const tempMsg = { ...msg, id: Date.now(), createdAt: new Date().toISOString() };
    setMessages((prev) => [...prev, tempMsg]);
    setMessage("");
    stompClient.publish({
      destination: "/app/typing",
      body: JSON.stringify({ chatId, userId: user.id, isTyping: false }),
    });
  };

  const sendTyping = () => {
    if (stompClient?.connected && user && message.length > 0) {
      stompClient.publish({
        destination: "/app/typing",
        body: JSON.stringify({ chatId, userId: user.id, isTyping: true }),
      });
    }
  };

  const startCall = () => {
    if (!stream || !stompClient?.connected) {
      toast.error("Không thể bắt đầu cuộc gọi: Không có luồng video hoặc WebSocket chưa kết nối.");
      return;
    }
    fetch(`${process.env.REACT_APP_API_URL}/chat/call/start/${chatId}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    })
        .then((response) => {
          if (!response.ok) throw new Error("Server error: " + response.statusText);
          return response.json();
        })
        .then((data) => {
          const newPeer = new Peer({
            initiator: true,
            trickle: false,
            stream,
            config: { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] },
          });
          newPeer.on("signal", (signalData) => {
            stompClient.publish({
              destination: "/app/call/offer",
              body: JSON.stringify({
                chatId,
                type: "offer",
                sdp: signalData,
                userId: user.id,
              }),
            }, (error) => {
              if (error) console.error("Error sending offer:", error);
            });
          });
          newPeer.on("stream", (remoteStream) => {
            if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
          });
          newPeer.on("error", (err) => console.error("Peer error:", err));
          setPeer(newPeer);
        })
        .catch((err) => toast.error("Lỗi khi bắt đầu cuộc gọi: " + err.message));
  };

  const confirmDeleteMessage = () => {
    if (stompClient?.connected && messageToDelete) {
      fetch(`${process.env.REACT_APP_API_URL}/chat/message/delete`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ chatId, messageId: messageToDelete }),
      })
          .then(() => {
            setMessages(messages.filter((msg) => msg.id !== messageToDelete));
            setShowDeleteModal(false);
            setMessageToDelete(null);
            toast.success("Tin nhắn đã được xóa.");
          })
          .catch((err) => toast.error("Lỗi khi xóa tin nhắn: " + err.message));
    }
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
      config: { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] },
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
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
    });
    newPeer.on("error", (err) => console.error("Peer error:", err));
    newPeer.signal(data.sdp);
    setPeer(newPeer);
    setShowCallModal(false);
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
      stompClient.publish({
        destination: "/app/call/end",
        body: JSON.stringify({ chatId, userId: user.id, type: "end" }),
      });
      toast.success("Đã thoát cuộc gọi.");
    }
  };

  const sendFile = () => toast.info("Tính năng gửi file đang phát triển!");
  const handleDeleteMessage = (msgId) => {
    setMessageToDelete(msgId);
    setShowDeleteModal(true);
  };
  const toggleNotifications = () => {
    const currentState = localStorage.getItem("chatNotifications") === "on";
    localStorage.setItem("chatNotifications", currentState ? "off" : "on");
    toast.info(`Tính năng thông báo đã được ${currentState ? "tắt" : "bật"}`);
  };

  return (
      <div className="d-flex flex-column h-100 bg-light">
        <div className="bg-white border-bottom p-3 d-flex align-items-center">
          <img
              src={user?.avatar || "https://via.placeholder.com/40"}
              alt="Avatar"
              className="rounded-circle me-2"
              style={{ width: "40px", height: "40px" }}
          />
          <h5 className="mb-0 fw-bold">Chat {chatId}</h5>
        </div>
        <div className="flex-grow-1 overflow-y-auto p-3 bg-white" ref={chatContainerRef}>
          {messages.map((msg, index) => (
              <div
                  key={index}
                  className={`d-flex mb-2 ${
                      msg.senderId === user?.id ? "justify-content-end" : "justify-content-start"
                  }`}
              >
                {msg.senderId !== user?.id && (
                    <img
                        src={msg.sender?.avatar || "https://via.placeholder.com/40"}
                        alt="Avatar"
                        className="rounded-circle me-2"
                        style={{ width: "40px", height: "40px" }}
                    />
                )}
                <div>
                  {msg.senderId !== user?.id && (
                      <small className="text-muted d-block">{msg.sender?.username}</small>
                  )}
                  <div
                      className={`p-2 rounded-lg ${
                          msg.senderId === user?.id ? "bg-primary text-white" : "bg-light"
                      }`}
                      style={{ maxWidth: "70%", borderRadius: "10px" }}
                  >
                    {msg.content === "Message deleted" ? (
                        <i className="text-muted">Tin nhắn đã bị xóa</i>
                    ) : (
                        msg.content
                    )}
                  </div>
                  <small className="text-muted">
                    {new Date(msg.createdAt).toLocaleTimeString()}
                  </small>
                </div>
              </div>
          ))}
          {isTyping && <small className="text-muted">Đang nhập...</small>}
        </div>
        <div className="bg-white p-3 border-top">
          <InputGroup>
            <Button variant="outline-secondary" className="rounded-circle p-2">
              <FaPaperclip />
            </Button>
            <Form.Control
                type="text"
                placeholder="Nhập tin nhắn..."
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  sendTyping();
                }}
                className="border-0"
            />
            <Button variant="primary" onClick={sendMessage} className="rounded-circle p-2">
              <FaPaperPlane />
            </Button>
          </InputGroup>
        </div>
        <div className="p-3 bg-light">
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
                  <FaMicrophoneSlash />
                </Button>
                <Button
                    variant={isVideoOff ? "danger" : "outline-danger"}
                    className="rounded-circle p-2"
                    onClick={toggleVideo}
                >
                  <FaVideoSlash />
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
                <Button variant="danger" className="py-2 rounded-pill" onClick={leaveCall}>
                  Thoát cuộc gọi
                </Button>
              </div>
            </Col>
          </Row>
          <Button variant="success" onClick={startCall} className="w-100 mt-2 rounded-pill">
            Bắt đầu gọi video
          </Button>
        </div>

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
        <Modal show={showCallModal} onHide={() => setShowCallModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Cuộc gọi đến</Modal.Title>
          </Modal.Header>
          <Modal.Body>Bạn có muốn nhận cuộc gọi video?</Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCallModal(false)}>
              Từ chối
            </Button>
            <Button variant="primary" onClick={() => handleOffer({ sdp: null, userId: null })}>
              Chấp nhận
            </Button>
          </Modal.Footer>
        </Modal>
        <ToastContainer />
      </div>
  );
};

export default Chat;