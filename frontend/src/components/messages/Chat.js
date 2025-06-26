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
  const isCallInitiatorRef = useRef(false);
  const isCallHandledRef = useRef(false);
  const pendingCandidatesRef = useRef([]);

  const iceServers = [
    {
      urls: "turns:kanox-turn.duckdns.org:5349?transport=tcp", // TCP fallback
      username: "turnuser",
      credential: "eqfleqrd1",
    },
    {
      urls: "turn:34.143.174.239:3478?transport=udp",
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

  const attachStreamToVideo = (ref, stream, label = "video") => {
    if (ref.current) {
      ref.current.srcObject = stream;
      ref.current.onloadedmetadata = () => {
        ref.current.play().catch(err =>
            console.error(`${label} play error:`, err)
        );
      };
    }
  };

  const cleanupPeerConnection = () => {
    if (peerRef.current) {
      const state = peerRef.current._pc?.iceConnectionState;
      console.log("Cleaning up PeerConnection, current ICE state:", state);
      if (
          peerRef.current._pc &&
          !peerRef.current.destroyed &&
          peerRef.current._pc.signalingState !== "closed" &&
          state !== "connected" &&
          state !== "completed"
      ) {
        console.log("Destroying existing PeerConnection...");
        peerRef.current.destroy();
        peerRef.current = null;
      } else {
        console.log("Skipping cleanup: PeerConnection is connected, completed, or already closed");
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
    pendingCandidatesRef.current = []; // Xóa danh sách ICE candidate
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
      attachStreamToVideo(videoRef, stream, "Local video");
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
        .catch((err) => toast.error(err.message || "Lỗi khi lấy thông tin chat."));

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
      if (!peerRef.current || peerRef.current._pc.signalingState === "closed") {
        console.warn("PeerConnection is closed, skipping answer");
        return;
      }

      if (peerRef.current._pc.signalingState !== "have-local-offer") {
        console.warn("Not expecting answer, current state:", peerRef.current._pc.signalingState);
        return;
      }

      try {
        await peerRef.current._pc.setRemoteDescription(JSON.parse(data.sdp));
        console.log("Remote description (answer) set successfully.");
      } catch (err) {
        console.error("Failed to set remote description (answer):", err);
        leaveCall(); // tránh trạng thái xấu
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

      const callSub = client.subscribe(`/topic/call/${chatId}`, async (signal) => {
        const data = JSON.parse(signal.body);
        console.log("Received signal:", data);

        if (data.userId === user?.id) {
          console.log("Ignoring signal from self");
          return;
        }

        if (data.type === "offer" && !isCallHandledRef.current) {
          localStorage.removeItem("lastOffer");
          localStorage.setItem("lastOffer", JSON.stringify(data));
          isCallHandledRef.current = true;
          setShowCallModal(true);

        } else if (data.type === "answer" && isCallInitiatorRef.current) {
          if (!peerRef.current || peerRef.current._pc.signalingState === "closed") {
            console.warn("PeerConnection is closed, skipping answer");
            return;
          }

          try {
            await peerRef.current._pc.setRemoteDescription(JSON.parse(data.sdp));
            console.log("Remote description (answer) set successfully.");

            // ✅ Flush pending ICE candidates
            if (pendingCandidatesRef.current.length > 0) {
              pendingCandidatesRef.current.forEach(candidate => {
                try {
                  peerRef.current.signal({
                    candidate: {
                      candidate: candidate.candidate,
                      sdpMid: candidate.sdpMid,
                      sdpMLineIndex: candidate.sdpMLineIndex,
                    },
                  });
                  console.log("Flushed buffered ICE candidate in answer:", candidate);
                } catch (err) {
                  console.error("Error applying buffered ICE candidate in answer:", err);
                }
              });
              pendingCandidatesRef.current = [];
            }

          } catch (err) {
            console.error("Failed to set remote description (answer):", err);
            leaveCall();
          }

        } else if (data.type === "ice-candidate") {
          const candidate = data.candidate;
          const peer = peerRef.current;

          if (!peer || peer._pc.signalingState === "closed") {
            console.warn("Peer connection not ready or closed, storing candidate:", candidate);
            pendingCandidatesRef.current.push(candidate);
            return;
          }

          if (!peer._pc.remoteDescription || peer._pc.remoteDescription.type === "") {
            console.warn("Remote description not set yet, buffering ICE candidate");
            pendingCandidatesRef.current.push(candidate);
            return;
          }

          try {
            peer.signal({
              candidate: {
                candidate: candidate.candidate,
                sdpMid: candidate.sdpMid,
                sdpMLineIndex: candidate.sdpMLineIndex,
              },
            });
            console.log("Added ICE candidate:", candidate);
          } catch (err) {
            console.error("Error adding ICE candidate:", err);
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
        if (!stompRef.current?.connected) {
          console.error('STOMP not connected, cannot send signal');
          return;
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
      toast.error("Không thể bắt đầu cuộc gọi.");
      return;
    }

    console.log("🔁 Bắt đầu cuộc gọi: khởi tạo stream cục bộ...");

    isCallInitiatorRef.current = true;
    isCallHandledRef.current = true;

    const newStream = await initializeMediaStream();
    if (!newStream) {
      console.error("❌ Không lấy được media stream!");
      toast.error("Không thể khởi tạo stream media.");
      return;
    }

    console.log("Local stream tracks in startCall:", newStream.getTracks().map(t => ({
      kind: t.kind,
      enabled: t.enabled,
    })));

    attachStreamToVideo(videoRef, newStream, "Local video");

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/chat/call/start/${chatId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Không thể khởi tạo cuộc gọi.");
      const callSession = await response.json();
      setCallSessionId(callSession.id);

      pendingCandidatesRef.current = [];

      console.log("📡 Tạo peer mới với initiator=true. Trickle ICE: true");

      const newPeer = new Peer({
        initiator: true,
        trickle: true,
        stream: newStream,
        config: { iceServers, iceTransportPolicy: "relay" },
      });
      peerRef.current = newPeer;

      let gotCandidate = false;

      newPeer._pc.onicecandidate = (event) => {
        if (event.candidate) {
          gotCandidate = true;
          console.log("📤 Đã tạo ICE candidate:", event.candidate);
        } else {
          console.log("✅ Hoàn tất ICE gathering.");
        }
      };

      setTimeout(() => {
        if (!gotCandidate) {
          console.warn("⚠️ Không nhận được ICE candidate nào. TURN server có thể bị chặn.");
        }
      }, 5000);

      newPeer.on("signal", (signalData) => {
        console.log("📶 Tín hiệu WebRTC:", signalData);

        if (signalData.type === "offer") {
          console.log("📨 Gửi offer qua STOMP:", signalData);
          stompRef.current.publish({
            destination: "/app/call/offer",
            body: JSON.stringify({
              chatId: Number(chatId),
              type: "offer",
              sdp: JSON.stringify(signalData),
              userId: Number(user.id),
              candidate: null,
            }),
          });
        } else if (signalData.candidate) {
          console.log("📨 Gửi ICE candidate:", signalData.candidate);
          stompRef.current.publish({
            destination: "/app/call/ice-candidate",
            body: JSON.stringify({
              chatId: Number(chatId),
              type: "ice-candidate",
              candidate: {
                candidate: signalData.candidate.candidate || "",
                sdpMid: signalData.candidate.sdpMid || "",
                sdpMLineIndex: signalData.candidate.sdpMLineIndex || 0,
              },
              userId: Number(user.id),
              sdp: null,
            }),
          });
        }
      });

      newPeer._pc.oniceconnectionstatechange = () => {
        console.log("🌐 ICE State:", newPeer._pc.iceConnectionState);
        if (newPeer._pc.iceConnectionState === "failed") {
          console.error("ICE connection failed, restarting ICE...");
          newPeer._pc.restartIce();
          toast.error("Kết nối thất bại, đang thử lại...");
        }
        if (newPeer._pc.iceConnectionState === "disconnected") {
          console.warn("ICE connection disconnected, attempting to reconnect...");
        }
        if (newPeer._pc.iceConnectionState === "connected") {
          console.log("ICE connection established successfully");
        }
      };

      newPeer._pc.onsignalingstatechange = () => {
        console.log("🔁 Signaling State:", newPeer._pc.signalingState);
      };

      // ✅ Thêm ontrack song song với .on("stream")
      newPeer._pc.ontrack = (event) => {
        console.log("📺 Nhận được track từ remote:", event.track.kind);
        attachStreamToVideo(remoteVideoRef, event.streams[0], "Remote video (ontrack)");
      };

      newPeer.on("stream", (remoteStream) => {
        console.log("Received remote stream in startCall:", remoteStream.getTracks().map(t => ({
          kind: t.kind,
          enabled: t.enabled,
        })));
        if (remoteVideoRef.current) {
          console.log("Assigning remote stream to remoteVideoRef:", remoteStream);
          remoteVideoRef.current.srcObject = remoteStream;
          remoteVideoRef.current.play().catch(err => console.error("Remote video play error:", err));
        }
        setShowCallPanel(true);
      });

      newPeer.on("connect", () => {
        console.log("✅ WebRTC Peer Connected!");
      });

      newPeer.on("error", (err) => {
        console.error("❌ Peer error in startCall:", err);
        if (err.code === "ERR_ICE_CONNECTION_FAILURE") {
          toast.error("Kết nối ICE thất bại. Vui lòng kiểm tra mạng.");
        } else if (err.code === "ERR_SIGNALING") {
          toast.error("Lỗi tín hiệu WebRTC. Vui lòng thử lại.");
        } else {
          toast.error("Lỗi trong quá trình gọi video: " + err.message);
        }
      });

      setShowCallPanel(true);
    } catch (err) {
      console.error("Start call error:", err);
      toast.error(err.message);
      leaveCall();
    }
  };


  const handleOffer = async () => {
    console.log("🔁 Nhận offer, khởi tạo stream cục bộ...");
    const newStream = await initializeMediaStream();
    if (!newStream) {
      console.error("❌ Không lấy được media stream!");
      toast.error("Không thể khởi tạo media stream.");
      return;
    }

    console.log("Local stream tracks in handleOffer:", newStream.getTracks().map(t => ({
      kind: t.kind,
      enabled: t.enabled,
    })));

    attachStreamToVideo(videoRef, newStream, "Local video (handleOffer)");

    const offerData = JSON.parse(localStorage.getItem("lastOffer") || "{}");
    if (!offerData.sdp) {
      toast.error("Dữ liệu offer không hợp lệ.");
      return;
    }

    const newPeer = new Peer({
      initiator: false,
      trickle: true,
      stream: newStream,
      config: { iceServers, iceTransportPolicy: "relay" },
    });

    peerRef.current = newPeer;
    let gotCandidate = false;

    try {
      console.log("📨 Đang set remote offer SDP...");
      newPeer.signal(JSON.parse(offerData.sdp));
      console.log("✅ Remote description (offer) set thành công.");

      console.log("Pending candidates before applying:", pendingCandidatesRef.current);
      if (pendingCandidatesRef.current.length > 0) {
        pendingCandidatesRef.current.forEach(candidate => {
          console.log("📨 Áp dụng ICE candidate pending:", candidate);
          newPeer.signal({
            candidate: {
              candidate: candidate.candidate,
              sdpMid: candidate.sdpMid,
              sdpMLineIndex: candidate.sdpMLineIndex,
            },
          });
        });
        pendingCandidatesRef.current = [];
      }
    } catch (err) {
      console.error("Handle offer error:", err);
      toast.error("Lỗi khi xử lý offer: " + err.message);
      setShowCallModal(false);
      return;
    }

    newPeer._pc.onicecandidate = (event) => {
      if (event.candidate) {
        gotCandidate = true;
        console.log("📤 Tạo ICE candidate trong handleOffer:", event.candidate);
        stompRef.current?.publish({
          destination: "/app/call/ice-candidate",
          body: JSON.stringify({
            chatId: Number(chatId),
            type: "ice-candidate",
            candidate: {
              candidate: event.candidate.candidate || "",
              sdpMid: event.candidate.sdpMid || "",
              sdpMLineIndex: event.candidate.sdpMLineIndex || 0,
            },
            userId: Number(user.id),
            sdp: null,
          }),
        });
      } else {
        console.log("✅ Hoàn tất ICE gathering trong handleOffer.");
      }
    };

    setTimeout(() => {
      if (!gotCandidate) {
        console.warn("⚠️ Không nhận được ICE candidate nào. TURN server có thể bị chặn.");
      }
    }, 5000);

    newPeer._pc.oniceconnectionstatechange = () => {
      console.log("🌐 ICE state in handleOffer:", newPeer._pc.iceConnectionState);
      if (newPeer._pc.iceConnectionState === "failed") {
        console.error("ICE connection failed, restarting ICE...");
        newPeer._pc.restartIce();
        toast.error("Kết nối thất bại, đang thử lại...");
      }
      if (newPeer._pc.iceConnectionState === "disconnected") {
        console.warn("ICE connection disconnected, attempting to reconnect...");
      }
      if (newPeer._pc.iceConnectionState === "connected") {
        console.log("ICE connection established successfully");
      }
    };

    newPeer._pc.onsignalingstatechange = () => {
      console.log("🔁 Signaling state in handleOffer:", newPeer._pc.signalingState);
    };

    // ✅ Thêm ontrack
    newPeer._pc.ontrack = (event) => {
      console.log("📺 Nhận track từ remote (handleOffer):", event.track.kind);
      attachStreamToVideo(remoteVideoRef, event.streams[0], "Remote video (ontrack - handleOffer)");
    };

    newPeer.on("signal", (signalData) => {
      console.log("📶 Tín hiệu WebRTC từ handleOffer:", signalData);

      if (signalData.type === "answer") {
        console.log("📨 Gửi answer:", signalData);
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
      } else if (signalData.candidate) {
        console.log("📨 Gửi ICE candidate trong handleOffer:", signalData.candidate);
        stompRef.current.publish({
          destination: "/app/call/ice-candidate",
          body: JSON.stringify({
            chatId: Number(chatId),
            type: "ice-candidate",
            candidate: {
              candidate: signalData.candidate.candidate || "",
              sdpMid: signalData.candidate.sdpMid || "",
              sdpMLineIndex: signalData.candidate.sdpMLineIndex || 0,
            },
            userId: Number(user.id),
            sdp: null,
          }),
        });
      }
    });

    newPeer.on("stream", (remoteStream) => {
      console.log("Received remote stream in handleOffer:", remoteStream.getTracks().map(t => ({
        kind: t.kind,
        enabled: t.enabled,
      })));
      attachStreamToVideo(remoteVideoRef, remoteStream, "Remote video (stream - handleOffer)");
      setShowCallPanel(true);
    });

    newPeer.on("connect", () => {
      console.log("✅ WebRTC Peer Connected (handleOffer)!");
    });

    newPeer.on("error", (err) => {
      console.error("❌ Peer error in handleOffer:", err);
      if (err.message.includes("InvalidStateError")) {
        console.log("Ignoring InvalidStateError do state mismatch");
      } else {
        toast.error("Lỗi trong quá trình gọi video: " + err.message);
      }
    });

    setShowCallPanel(true);
    setShowCallModal(false);
  };


  const leaveCall = () => {
    if (videoRef.current) videoRef.current.srcObject = null;
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    isCallHandledRef.current = false;
    isCallInitiatorRef.current = false;
    if (stompRef.current?.connected && callSessionId) {
      const payload = {
        chatId: Number(chatId),
        callSessionId: Number(callSessionId),
        userId: Number(user.id),
      };
      console.log("Sending call end signal:", payload);
      stompRef.current.publish({
        destination: "/app/call/end",
        body: JSON.stringify({
          chatId: Number(chatId),
          callSessionId: Number(callSessionId),
          userId: Number(user.id),
        }),
      });
    }
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setShowCallPanel(false);
    setCallSessionId(null);
    pendingCandidatesRef.current = [];
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
                      onLoadedMetadata={() => console.log("Local video metadata loaded")}
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
                      onLoadedMetadata={() => console.log("Remote video metadata loaded")}
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

