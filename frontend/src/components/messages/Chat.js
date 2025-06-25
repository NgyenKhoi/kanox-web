import React, { useState, useEffect, useRef, useContext } from "react";
import { Form, Button, Row, Col, Modal, InputGroup } from "react-bootstrap";
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
  const [callSessionId, setCallSessionId] = useState(null);

  const stompRef = useRef(null);
  const peerRef = useRef(null);
  const streamRef = useRef(null);
  const subscriptionsRef = useRef([]);
  const socketRef = useRef(null);
  const videoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const chatContainerRef = useRef(null);

  const iceServers = [
    { urls: "stun:34.143.174.239:3478" },
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },

    {
      urls: "turn:34.143.174.239:3478",
      username: "turnuser",
      credential: "eqfleqrd1",
    },
    {
      urls: "turns:kanox-turn.duckdns.org:5349",
      username: "turnuser",
      credential: "eqfleqrd1",
    },
  ];

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

  const cleanupPeerConnection = () => {
    if (peerRef.current) {
      const state = peerRef.current._pc?.iceConnectionState;
      console.log("Cleaning up PeerConnection, current ICE state:", state);
      if (state !== "connected" && state !== "completed") {
        console.log("Destroying existing PeerConnection...");
        peerRef.current.destroy();
        peerRef.current = null;
      } else {
        console.log(
          "Skipping cleanup: PeerConnection is connected or completed"
        );
      }
    }
    if (streamRef.current) {
      console.log("Stopping existing media stream...");
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
  };

  const initializeMediaStream = async () => {
    try {
      const permissionStatus = await navigator.permissions.query({
        name: "camera",
      });
      if (permissionStatus.state !== "granted") {
        toast.info("Vui lòng cấp quyền truy cập camera để bắt đầu cuộc gọi.");
        return null;
      }

      cleanupPeerConnection();

      const streamPromise = navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error("Timeout waiting for camera stream")),
          10000
        );
      });

      const stream = await Promise.race([streamPromise, timeoutPromise]);
      if (!stream.getVideoTracks().length || !stream.getAudioTracks().length) {
        throw new Error("No video or audio track found in stream.");
      }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        console.log(
          "Local video stream started with stream id:",
          stream.id,
          "Tracks:",
          stream.getTracks().map((t) => t.kind)
        );
      }
      return stream;
    } catch (err) {
      console.error("Error accessing media devices:", err.name, err.message);
      toast.error("Không thể truy cập camera/microphone: " + err.message);
      return null;
    }
  };

  useEffect(() => {
    if (!token || !user || !chatId) {
      toast.error("Vui lòng đăng nhập để sử dụng chat.");
      return;
    }

    cleanupPeerConnection();

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
      .catch((err) =>
        toast.error(err.message || "Lỗi khi lấy thông tin chat.")
      );

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

    const handleAnswer = async (data) => {
      const pc = peerRef.current?._pc;
      if (!pc || pc.signalingState === "closed") {
        console.warn("PeerConnection is closed or null");
        cleanupPeerConnection();
        toast.error("Kết nối bị đóng. Vui lòng thử lại cuộc gọi.");
        return;
      }

      try {
        if (typeof data.sdp !== "string" || data.type !== "answer") {
          console.error("Invalid SDP data:", data);
          return;
        }

        const desc = new RTCSessionDescription({
          type: data.type,
          sdp: data.sdp,
        });

        console.log("Setting remote description, state:", pc.signalingState);

        await pc.setRemoteDescription(desc);
        console.log("✅ Remote description set successfully.");
      } catch (err) {
        console.error("❌ Error setting remote description:", err);
        toast.error("Lỗi khi xử lý phản hồi cuộc gọi: " + err.message);
        cleanupPeerConnection();
      }
    };

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
        fetchUnreadMessageCount();
      });

      const typingSub = client.subscribe(
        `/topic/typing/${chatId}`,
        (typingMsg) => {
          const data = JSON.parse(typingMsg.body);
          if (data.userId !== user?.id) setIsTyping(data.isTyping);
        }
      );

      const callSub = client.subscribe(`/topic/call/${chatId}`, (signal) => {
        const data = JSON.parse(signal.body);
        console.log("Received signal:", data);
        if (data.type === "offer" && data.userId !== user?.id) {
          localStorage.setItem(
            "lastOffer",
            JSON.stringify({
              type: data.type,
              userId: data.userId,
              sdp: data.sdp,
            })
          );
          setShowCallModal(true);
        } else if (data.type === "answer" && peerRef.current) {
          console.log(
            "Received answer signal:",
            data.sdp,
            "Signaling state:",
            peerRef.current._pc?.signalingState
          );
          peerRef.current.signal(data);
        } else if (data.type === "ice-candidate" && peerRef.current) {
          console.log("Received ICE candidate:", data.candidate);
          if (data.candidate) {
            peerRef.current.signal({
              candidate: {
                candidate: data.candidate.candidate,
                sdpMid: data.candidate.sdpMid,
                sdpMLineIndex: data.candidate.sdpMLineIndex,
              },
            });
          }
        } else if (data.type === "end") {
          console.log("Call ended by remote user");
          leaveCall();
        }
      });

      const unreadCountSub = client.subscribe(
        `/topic/unread-count/${user.id}`,
        (msg) => {
          const data = JSON.parse(msg.body);
          window.dispatchEvent(
            new CustomEvent("updateUnreadCount", {
              detail: { unreadCount: data || 0 },
            })
          );
        }
      );

      subscriptionsRef.current = [chatSub, typingSub, callSub, unreadCountSub];
      stompRef.current = client;

      client.publish({
        destination: "/app/resend",
        body: JSON.stringify({ chatId: Number(chatId) }),
      });

      const pingInterval = setInterval(() => {
        if (stompRef.current && stompRef.current.connected) {
          console.log("Sending ping");
          stompRef.current.publish({
            destination: "/app/ping",
            body: null,
          });
        }
      }, 30000);

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
        clearInterval(pingInterval);
      };
    };

    client.onWebSocketClose = () => {
      console.log("WebSocket disconnected, retrying...");
    };

    client.onStompError = (frame) => {
      console.error("STOMP error:", frame);
      toast.error("Lỗi kết nối WebSocket. Vui lòng thử lại.");
    };

    client.activate();

    return () => {
      console.log("Cleaning up WebSocket and PeerConnection...");
      subscriptionsRef.current.forEach((s) => s.unsubscribe());
      stompRef.current?.deactivate();
      if (socketRef.current) socketRef.current.close();
      cleanupPeerConnection();
    };
  }, [chatId, user, token]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = () => {
    if (!message.trim() || !stompRef.current?.connected) return;
    const msg = {
      chatId: Number(chatId),
      senderId: user.id,
      content: message,
      typeId: 1,
    };
    stompRef.current.publish({
      destination: "/app/sendMessage",
      body: JSON.stringify(msg),
    });
    setMessage("");
    stompRef.current.publish({
      destination: "/app/typing",
      body: JSON.stringify({
        chatId: Number(chatId),
        userId: user.id,
        isTyping: false,
      }),
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
    if (stompRef.current?.connected && message.length > 0) {
      stompRef.current.publish({
        destination: "/app/typing",
        body: JSON.stringify({
          chatId: Number(chatId),
          userId: user.id,
          isTyping: true,
        }),
      });
      console.log("Sent typing status");
    }
  };

  const startCall = async () => {
    if (!stompRef.current?.connected) {
      toast.error(
        "Không thể bắt đầu cuộc gọi. Vui lòng kiểm tra kết nối WebSocket."
      );
      return;
    }

    const newStream = await initializeMediaStream();
    if (!newStream) {
      toast.error(
        "Không thể khởi tạo stream media. Vui lòng kiểm tra camera/microphone."
      );
      return;
    }

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/chat/call/start/${chatId}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok) {
        throw new Error("Không thể khởi tạo cuộc gọi.");
      }
      const callSession = await response.json();
      console.log("Call session started:", callSession);
      setCallSessionId(callSession.id);

      setShowCallPanel(true);

      const newPeer = new Peer({
        initiator: true,
        trickle: true,
        stream: newStream,
        config: {
          iceServers,
          iceTransportPolicy: "all",
          bundlePolicy: "balanced",
          rtcpMuxPolicy: "require",
          iceCandidatePoolSize: 0,
        },
        debug: true,
      });

      let retryCount = 0;
      const maxRetries = 3;

      newPeer._pc.oniceconnectionstatechange = () => {
        const state = newPeer._pc.iceConnectionState;
        console.log("ICE connection state:", state);
        if (state === "failed" && retryCount < maxRetries) {
          retryCount++;
          console.error(
            `ICE connection failed. Retry ${retryCount}/${maxRetries}...`
          );
          newPeer._pc.restartIce();
        } else if (state === "failed" && retryCount >= maxRetries) {
          toast.error(
            "Không thể kết nối cuộc gọi sau nhiều lần thử. Vui lòng kiểm tra mạng."
          );
          leaveCall();
        } else if (state === "connected" || state === "completed") {
          retryCount = 0;
        }
      };

      newPeer._pc.onicecandidate = (event) => {
        console.log("ICE candidate generated:", event.candidate);
      };
      newPeer._pc.onicegatheringstatechange = () => {
        console.log("ICE gathering state:", newPeer._pc.iceGatheringState);
      };

      let hasReceivedAnswer = false;

      newPeer.on("signal", (signalData) => {
        if (hasReceivedAnswer && signalData.type === "answer") {
          console.log("Skipping duplicate answer signal");
          return;
        }

        console.log("Sending signal data:", {
          type: signalData.type,
          sdp: signalData.sdp?.slice(0, 100),
          candidate: signalData.candidate,
          signalingState: newPeer._pc.signalingState,
          iceConnectionState: newPeer._pc.iceConnectionState,
        });
        if (stompRef.current?.connected) {
          if (signalData.type === "offer") {
            stompRef.current.publish({
              destination: "/app/call/offer",
              body: JSON.stringify({
                chatId: Number(chatId),
                type: "offer",
                sdp: signalData,
                userId: Number(user.id),
                candidate: null,
              }),
            });
          } else if (signalData.candidate) {
            stompRef.current.publish({
              destination: "/app/call/ice-candidate",
              body: JSON.stringify({
                chatId: Number(chatId),
                type: "ice-candidate",
                candidate: {
                  candidate: signalData.candidate.candidate,
                  sdpMid: signalData.candidate.sdpMid,
                  sdpMLineIndex: signalData.candidate.sdpMLineIndex,
                },
                userId: Number(user.id),
                sdp: null,
              }),
            });
          }
        } else {
          console.error("WebSocket not connected");
          toast.error(
            "Không thể gửi tín hiệu cuộc gọi do mất kết nối WebSocket."
          );
        }
      });

      const streamTimeout = setTimeout(() => {
        if (!remoteVideoRef.current?.srcObject) {
          console.error("No remote stream received after 60 seconds");
          toast.error("Không nhận được video từ đối phương. Vui lòng thử lại.");
          leaveCall();
        }
      }, 60000);

      newPeer.on("stream", (remoteStream) => {
        clearTimeout(streamTimeout);
        console.log("Received remote stream:", {
          id: remoteStream.id,
          tracks: remoteStream
            .getTracks()
            .map((t) => ({ kind: t.kind, enabled: t.enabled })),
        });
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = null;
          remoteVideoRef.current.srcObject = remoteStream;
          remoteVideoRef.current.play().catch((err) => {
            console.error("Error playing remote video:", err);
            toast.error("Lỗi phát video từ đối phương: " + err.message);
          });
        }
      });

      newPeer.on("connect", () => {
        console.log("Peer connection established");
        hasReceivedAnswer = true;
      });

      newPeer.on("error", (err) => {
        console.error("Peer error:", err);
        if (err.message.includes("InvalidStateError")) {
          console.log("Ignoring InvalidStateError due to state mismatch");
        } else {
          toast.error("Lỗi trong quá trình gọi video: " + err.message);
        }
      });

      peerRef.current = newPeer;
    } catch (err) {
      console.error("Error starting call:", err);
      toast.error(err.message || "Lỗi khi bắt đầu cuộc gọi.");
    }
  };

  const handleOffer = async () => {
    if (!stompRef.current?.connected) {
      toast.error(
        "Không thể nhận cuộc gọi. Vui lòng kiểm tra kết nối WebSocket."
      );
      setShowCallModal(false);
      return;
    }

    const newStream = await initializeMediaStream();
    if (!newStream) {
      toast.error(
        "Không thể khởi tạo stream media. Vui lòng kiểm tra camera/microphone."
      );
      setShowCallModal(false);
      return;
    }

    const offerData = JSON.parse(localStorage.getItem("lastOffer") || "{}");
    if (!offerData.sdp) {
      toast.error("Dữ liệu cuộc gọi không hợp lệ.");
      setShowCallModal(false);
      return;
    }

    const newPeer = new Peer({
      initiator: false,
      trickle: true,
      stream: newStream,
      config: {
        iceServers,
        iceTransportPolicy: "all",
        bundlePolicy: "balanced",
        rtcpMuxPolicy: "require",
        iceCandidatePoolSize: 0,
      },
      debug: true,
    });

    let retryCount = 0;
    const maxRetries = 3;
    let hasSentAnswer = false;

    newPeer._pc.oniceconnectionstatechange = () => {
      const state = newPeer._pc.iceConnectionState;
      console.log("ICE connection state:", state);
      if (state === "failed" && retryCount < maxRetries) {
        retryCount++;
        console.error(
          `ICE connection failed. Retry ${retryCount}/${maxRetries}...`
        );
        newPeer._pc.restartIce();
      } else if (state === "failed" && retryCount >= maxRetries) {
        toast.error(
          "Không thể kết nối cuộc gọi sau nhiều lần thử. Vui lòng kiểm tra mạng."
        );
        leaveCall();
      } else if (state === "connected" || state === "completed") {
        retryCount = 0;
      }
    };

    newPeer._pc.onicecandidate = (event) => {
      console.log("ICE candidate generated:", event.candidate);
    };
    newPeer._pc.onicegatheringstatechange = () => {
      console.log("ICE gathering state:", newPeer._pc.iceGatheringState);
    };

    newPeer.on("signal", (signalData) => {
      if (hasSentAnswer && signalData.type === "answer") {
        console.log("Skipping duplicate answer signal");
        return;
      }

      console.log("Sending signal data:", signalData);
      if (stompRef.current?.connected) {
        if (signalData.type === "answer") {
          stompRef.current.publish({
            destination: "/app/call/answer",
            body: JSON.stringify({
              chatId: Number(chatId),
              type: "answer",
              sdp: JSON.stringify(signalData),
              userId: Number(user.id),
              candidate: null,
            }),
          });
          hasSentAnswer = true;
        } else if (signalData.candidate) {
          stompRef.current.publish({
            destination: "/app/call/ice-candidate",
            body: JSON.stringify({
              chatId: Number(chatId),
              type: "ice-candidate",
              candidate: {
                candidate: signalData.candidate.candidate,
                sdpMid: signalData.candidate.sdpMid,
                sdpMLineIndex: signalData.candidate.sdpMLineIndex,
              },
              userId: Number(user.id),
              sdp: null,
            }),
          });
        }
      } else {
        console.error("WebSocket not connected");
        toast.error(
          "Không thể gửi tín hiệu cuộc gọi do mất kết nối WebSocket."
        );
      }
    });

    newPeer.on("stream", (remoteStream) => {
      console.log("Received remote stream in handleOffer:", remoteStream.id);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
        remoteVideoRef.current.srcObject = remoteStream;
        remoteVideoRef.current.play().catch((err) => {
          console.error("Error playing remote video:", err);
          toast.error("Lỗi phát video từ đối phương: " + err.message);
        });
      }
      setShowCallModal(false);
    });

    newPeer.on("connect", () => {
      console.log("Peer connection established");
      setShowCallModal(false);
    });

    newPeer.on("error", (err) => {
      console.error("Peer error:", err);
      if (err.message.includes("InvalidStateError")) {
        console.log("Ignoring InvalidStateError due to state mismatch");
        setShowCallModal(false);
      } else {
        toast.error("Lỗi trong quá trình gọi video: " + err.message);
        setShowCallModal(false);
      }
    });

    peerRef.current = newPeer;
    console.log(
      "Processing offer with signaling state:",
      newPeer._pc.signalingState
    );
    try {
      await newPeer.signal(offerData.sdp);
    } catch (err) {
      console.error("Error processing offer:", err);
      toast.error("Lỗi khi xử lý offer: " + err.message);
    }
    setShowCallPanel(true);
  };

  const leaveCall = () => {
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    if (stompRef.current?.connected && callSessionId) {
      const payload = {
        chatId: Number(chatId),
        callSessionId: Number(callSessionId),
        userId: Number(user.id),
      };
      console.log("Sending call end signal:", payload);
      stompRef.current.publish({
        destination: "/app/call/end",
        body: JSON.stringify(payload),
      });
    }
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setShowCallPanel(false);
    setCallSessionId(null);
  };

  return (
    <div className="d-flex flex-column h-100 bg-light">
      <div className="p-3 border-bottom bg-white shadow-sm d-flex align-items-center">
        <h5 className="mb-0 flex-grow-1">{recipientName}</h5>
        <Button
          variant="outline-primary"
          size="sm"
          onClick={() => {
            setShowCallPanel(true);
            startCall();
          }}
        >
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

      {showCallPanel && (
        <div className="p-3 border-top bg-light">
          <Row>
            <Col xs={6}>
              <h6>Video của bạn</h6>
              <video
                ref={videoRef}
                autoPlay
                muted
                onLoadedMetadata={() =>
                  console.log("Local video metadata loaded")
                }
                onError={(e) => console.error("Local video error:", e)}
                style={{
                  width: "100%",
                  borderRadius: 8,
                  backgroundColor: "#000",
                }}
              />
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
              <h6>Video của người nhận</h6>
              <video
                ref={remoteVideoRef}
                autoPlay
                onLoadedMetadata={() =>
                  console.log("Remote video metadata loaded")
                }
                onError={(e) => console.error("Remote video error:", e)}
                style={{
                  width: "100%",
                  borderRadius: 8,
                  backgroundColor: "#000",
                }}
              />
              <Button
                variant="danger"
                className="w-100 mt-2"
                onClick={leaveCall}
              >
                Thoát cuộc gọi
              </Button>
            </Col>
          </Row>
        </div>
      )}

      <Modal
        show={showCallModal}
        centered
        onHide={() => setShowCallModal(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>Cuộc gọi đến</Modal.Title>
        </Modal.Header>
        <Modal.Body>Bạn có muốn nhận cuộc gọi video?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCallModal(false)}>
            Từ chối
          </Button>
          <Button variant="primary" onClick={handleOffer}>
            Chấp nhận
          </Button>
        </Modal.Footer>
      </Modal>

      <ToastContainer />
    </div>
  );
};

export default Chat;
