import React, { useState, useEffect, useRef, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "react-bootstrap";
import { FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash, FaPhone } from "react-icons/fa";
import { AuthContext } from "../../context/AuthContext";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { WebSocketContext } from "../../context/WebSocketContext";

const Call = ({ onEndCall }) => {
    const { user, token } = useContext(AuthContext);
    const { chatId } = useParams();
    const navigate = useNavigate();
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [callStarted, setCallStarted] = useState(false);
    const [recipientId, setRecipientId] = useState(null);
    const [callSessionId, setCallSessionId] = useState(null);
    const stringeeClientRef = useRef(null);
    const stringeeCallRef = useRef(null);
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const localStreamRef = useRef(null);
    const [isStringeeConnected, setIsStringeeConnected] = useState(false);
    const [signalingCode, setSignalingCode] = useState(null);
    const { publish, subscribe, unsubscribe } = useContext(WebSocketContext);
    const reconnectTimer = useRef(null);

    const sendCallStatusMessage = (statusMessage, targetChatId = Number(chatId)) => {
        if (!publish || !targetChatId || !user) return;
        const msg = {
            chatId: Number(targetChatId),
            senderId: user.id,
            content: statusMessage,
            typeId: 4,
        };
        console.log("📤 Sending call status message:", msg, "to topic:", `/topic/chat/${targetChatId}`);
        publish("/app/sendMessage", msg);
    };

    useEffect(() => {
        const subId = `call-fail-${chatId}`;
        const callback = (data) => {
            if (data.content === "⚠️ Máy bận") {
                toast.warning("Người kia đang bận. Quay lại chat.");
                navigate(`/messages?chatId=${chatId}`);
            }
        };
        subscribe(`/topic/chat/${chatId}`, callback, subId);
        return () => {
            unsubscribe(subId);
        };
    }, [chatId, subscribe, unsubscribe, navigate]);

    useEffect(() => {
        let isMounted = true;

        if (!chatId || isNaN(chatId)) {
            toast.error("ID cuộc trò chuyện không hợp lệ.");
            if (isMounted) navigate("/messages");
            return;
        }

        const fetchChatMembers = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_API_URL}/chat/${chatId}/members`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!isMounted) return;
                if (response.ok) {
                    const members = await response.json();
                    const recipient = members.find((member) => member.username !== user.username);
                    if (recipient) {
                        setRecipientId(recipient.stringeeUserId || recipient.username);
                    } else {
                        toast.error("Không tìm thấy người nhận trong cuộc trò chuyện.");
                    }
                    console.log("👤 Current user:", user.username);
                    console.log("📄 All members:", members);
                } else {
                    throw new Error("Lỗi khi lấy danh sách thành viên");
                }
            } catch (err) {
                if (isMounted) {
                    console.error("Error fetching chat members:", err);
                    toast.error("Lỗi khi lấy thông tin cuộc trò chuyện.");
                }
            }
        };

        const fetchAccessToken = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_API_URL}/chat/generate-token`, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ username: user.username }),
                });
                if (!isMounted) return;
                if (!response.ok) throw new Error("Lỗi khi lấy access token");
                const data = await response.json();
                initializeStringee(data.accessToken);
            } catch (err) {
                if (isMounted) {
                    console.error("Error fetching access token:", err);
                    toast.error("Lỗi kết nối server: " + err.message);
                }
            }
        };

        const initializeStringee = (accessToken, retryCount = 0) => {
            if (!window.Stringee) {
                if (retryCount < 10) {
                    setTimeout(() => initializeStringee(accessToken, retryCount + 1), 200);
                } else {
                    toast.error("Không thể tải Stringee SDK. Vui lòng tải lại trang.");
                }
                return;
            }

            // Kiểm tra quyền camera/micro
            navigator.mediaDevices.getUserMedia({ audio: true, video: true })
                .then(() => {
                    console.log("🎥 Đã có quyền truy cập camera và mic");
                })
                .catch((err) => {
                    console.error("❌ Không truy cập được camera/mic:", err);
                    toast.error("Không thể truy cập camera/micro. Vui lòng cấp quyền.");
                });

            console.log("✅ Stringee SDK đã sẵn sàng:", window.Stringee);
            stringeeClientRef.current = new window.Stringee.StringeeClient();
            stringeeClientRef.current.connect(accessToken);

            stringeeClientRef.current.on("connect", () => {
                toast.success("Đã kết nối với Stringee.");
                setIsStringeeConnected(true);
            });

            stringeeClientRef.current.on("authen", (res) => {
                if (res.r !== 0) {
                    toast.error("Lỗi xác thực Stringee: " + res.message);
                }
            });

            stringeeClientRef.current.on("error", (error) => {
                toast.error("Lỗi kết nối Stringee: " + error.message);
            });

            stringeeClientRef.current.on("disconnect", () => {
                toast.warn("Mất kết nối với Stringee. Đang thử kết nối lại...");
                reconnectTimer.current = setTimeout(() => {
                    if (stringeeClientRef.current) {
                        stringeeClientRef.current.connect(accessToken);
                    }
                }, 3000);
            });

            stringeeClientRef.current.on("incomingcall", (incomingCall) => {
                console.log("📞 incomingCall.toNumber:", incomingCall.toNumber);
                console.log("👤 currentUser.username:", user.username);
                console.log("📋 incomingCall.customData:", incomingCall.customData);

                let incomingChatId = null;
                try {
                    incomingChatId = incomingCall.customData ? JSON.parse(incomingCall.customData).chatId : null;
                } catch (err) {
                    console.error("❌ Lỗi parse customData:", err);
                }

                if (callStarted || stringeeCallRef.current) {
                    console.warn("⚠️ Đang trong cuộc gọi khác, từ chối cuộc gọi mới.");
                    if (incomingChatId) {
                        publish("/app/sendMessage", {
                            chatId: Number(incomingChatId),
                            senderId: user.id,
                            content: "⚠️ Máy bận",
                            typeId: 4,
                        });
                    }
                    incomingCall.reject();
                    return;
                }

                if (incomingCall.fromNumber === user.username) {
                    console.log("⚠️ Đã là người gọi, bỏ qua không phản hồi");
                    return;
                }

                // Kiểm tra quyền camera/micro trước khi xử lý cuộc gọi
                navigator.mediaDevices.getUserMedia({ audio: true, video: true })
                    .then(() => {
                        console.log("🎥 Đã lấy quyền camera/mic cho incoming call");

                        // Gắn sự kiện addlocalstream
                        incomingCall.on("addlocalstream", (stream) => {
                            console.log("🎥 [addlocalstream] Stream:", stream);
                            localStreamRef.current = stream;
                            const tryAttachLocalStream = (stream, attempts = 0) => {
                                if (localVideoRef.current) {
                                    localVideoRef.current.srcObject = stream;
                                    localVideoRef.current.play().catch((err) => {
                                        console.error("Local video play error:", err);
                                        if (attempts < 10) {
                                            setTimeout(() => tryAttachLocalStream(stream, attempts + 1), 300);
                                        } else {
                                            console.error("❌ Không thể phát local video sau nhiều lần thử");
                                            toast.error("Không thể hiển thị video local.");
                                        }
                                    });
                                } else if (attempts < 10) {
                                    setTimeout(() => tryAttachLocalStream(stream, attempts + 1), 200);
                                } else {
                                    console.error("❌ Không thể gắn localStream vào localVideo sau nhiều lần thử");
                                    toast.error("Không thể hiển thị video local.");
                                }
                            };
                            tryAttachLocalStream(stream);
                        });

                        // Gắn sự kiện addremotestream
                        incomingCall.on("addremotestream", (stream) => {
                            console.log("🎥 [addremotestream] Stream:", stream);
                            const tryAttachRemoteStream = (stream, attempts = 0) => {
                                if (remoteVideoRef.current) {
                                    remoteVideoRef.current.srcObject = stream;
                                    remoteVideoRef.current.play().catch((err) => {
                                        console.error("Remote video play error:", err);
                                        if (attempts < 10) {
                                            setTimeout(() => tryAttachRemoteStream(stream, attempts + 1), 300);
                                        } else {
                                            console.error("❌ Không thể phát remote video sau nhiều lần thử");
                                            toast.error("Không thể hiển thị video remote.");
                                        }
                                    });
                                } else if (attempts < 10) {
                                    setTimeout(() => tryAttachRemoteStream(stream, attempts + 1), 200);
                                } else {
                                    console.error("❌ Không thể gắn remoteStream vào remoteVideo sau nhiều lần thử");
                                    toast.error("Không thể hiển thị video remote.");
                                }
                            };
                            tryAttachRemoteStream(stream);
                        });

                        incomingCall.on("signalingstate", (state) => {
                            setSignalingCode(state.code);
                            console.log("📶 Incoming call signaling state:", state);
                            if (state.code === 6) endCall();
                        });

                        incomingCall.on("mediastate", (state) => {
                            console.log("📺 Media state:", state);
                        });

                        incomingCall.on("end", () => {
                            console.log("📞 Incoming call ended");
                            endCall();
                        });

                        // Gán vào ref sau khi gắn sự kiện
                        stringeeCallRef.current = incomingCall;

                        // Trả lời cuộc gọi
                        incomingCall.answer((res) => {
                            if (res.r === 0) {
                                console.log("📞 Cuộc gọi đã được trả lời");
                                setCallStarted(true);
                            } else {
                                console.error("❌ Không thể trả lời:", res.message);
                                toast.error("Không thể trả lời: " + res.message);
                                endCall();
                            }
                        });
                    })
                    .catch((err) => {
                        console.error("❌ Không truy cập được camera/mic:", err);
                        toast.error("Không thể truy cập camera/micro. Vui lòng cấp quyền.");
                        incomingCall.reject();
                        endCall();
                    });
            });

        };

        fetchChatMembers();
        fetchAccessToken();

        return () => {
            isMounted = false;
            clearTimeout(reconnectTimer.current);
            if (stringeeClientRef.current) {
                try {
                    stringeeClientRef.current.disconnect();
                    console.log("🔌 Disconnected Stringee client");
                } catch (error) {
                    console.error("Error disconnecting Stringee:", error);
                }
            }
            if (stringeeCallRef.current) {
                try {
                    stringeeCallRef.current.hangup();
                    console.log("📞 Hung up call");
                } catch (error) {
                    console.error("Error hanging up Stringee call:", error);
                }
                stringeeCallRef.current = null;
            }
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach((track) => {
                    console.log(`🛑 Stopped track: ${track.kind}`);
                    track.stop();
                });
                localStreamRef.current = null;
            }
        };
    }, [chatId, token, user, navigate, publish]);

    const startCall = async () => {
        if (!isStringeeConnected) {
            toast.error("Chưa kết nối Stringee.");
            return;
        }
        if (!recipientId) {
            toast.error("Không tìm thấy người nhận để gọi.");
            return;
        }
        if (callStarted || stringeeCallRef.current) {
            toast.warn("Bạn đang trong một cuộc gọi khác.");
            return;
        }

        try {
            // Kiểm tra quyền camera/micro
            await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
            console.log("🎥 Đã lấy quyền camera/mic");

            const response = await fetch(`${process.env.REACT_APP_API_URL}/chat/call/start/${chatId}`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Không thể khởi tạo cuộc gọi: ${errorText}`);
            }
            const callSession = await response.json();
            setCallSessionId(callSession.sessionId);

            stringeeCallRef.current = new window.Stringee.StringeeCall(
                stringeeClientRef.current,
                user.username,
                recipientId,
                true
            );

            // Thêm customData
            stringeeCallRef.current.customData = JSON.stringify({ chatId: Number(chatId) });
            console.log("📤 Gán customData cho cuộc gọi:", stringeeCallRef.current.customData);

            stringeeCallRef.current.on("addlocalstream", (stream) => {
                console.log("🎥 [addlocalstream] Stream:", stream);
                localStreamRef.current = stream;
                const tryAttachLocalStream = (stream, attempts = 0) => {
                    if (localVideoRef.current) {
                        localVideoRef.current.srcObject = stream;
                        localVideoRef.current.play().catch((err) => {
                            console.error("Local video play error:", err);
                            if (attempts < 10) {
                                setTimeout(() => tryAttachLocalStream(stream, attempts + 1), 300);
                            } else {
                                console.error("❌ Không thể phát local video sau nhiều lần thử");
                                toast.error("Không thể hiển thị video local.");
                            }
                        });
                    } else if (attempts < 10) {
                        setTimeout(() => tryAttachLocalStream(stream, attempts + 1), 200);
                    } else {
                        console.error("❌ Không thể gắn localStream vào localVideo sau nhiều lần thử");
                        toast.error("Không thể hiển thị video local.");
                    }
                };
                tryAttachLocalStream(stream);
            });

            stringeeCallRef.current.on("addremotestream", (stream) => {
                console.log("🎥 [addremotestream] Stream:", stream);
                const tryAttachRemoteStream = (stream, attempts = 0) => {
                    if (remoteVideoRef.current) {
                        remoteVideoRef.current.srcObject = stream;
                        remoteVideoRef.current.play().catch((err) => {
                            console.error("Remote video play error:", err);
                            if (attempts < 10) {
                                setTimeout(() => tryAttachRemoteStream(stream, attempts + 1), 300);
                            } else {
                                console.error("❌ Không thể phát remote video sau nhiều lần thử");
                                toast.error("Không thể hiển thị video remote.");
                            }
                        });
                    } else if (attempts < 10) {
                        setTimeout(() => tryAttachRemoteStream(stream, attempts + 1), 200);
                    } else {
                        console.error("❌ Không thể gắn remoteStream vào remoteVideo sau nhiều lần thử");
                        toast.error("Không thể hiển thị video remote.");
                    }
                };
                tryAttachRemoteStream(stream);
            });

            stringeeCallRef.current.on("signalingstate", (state) => {
                setSignalingCode(state.code);
                console.log("📶 Signaling state:", state);
                if (state.code === 6) {
                    console.log("📞 Outgoing call ended with state:", state.code);
                    endCall();
                }
            });

            stringeeCallRef.current.on("mediastate", (state) => {
                console.log("📺 Media state:", state);
            });

            stringeeCallRef.current.on("end", () => {
                console.log("📞 Hung up outgoing call");
                endCall();
            });

            stringeeCallRef.current.makeCall((res) => {
                if (res.r === 0) {
                    console.log("✅ Call started:", res);
                    setCallStarted(true);
                    sendCallStatusMessage("📞 Cuộc gọi bắt đầu");
                } else {
                    console.error("❌ Call failed:", res);
                    toast.error("Không thể bắt đầu cuộc gọi: " + res.message);
                    endCall();
                }
            });
        } catch (err) {
            console.error("Start call error:", err);
            toast.error("Lỗi khi bắt đầu cuộc gọi: " + err.message);
        }
    };

    const endCall = async () => {
        if (stringeeCallRef.current) {
            try {
                stringeeCallRef.current.hangup();
                console.log("📞 Hung up call");
            } catch (error) {
                console.error("Error hanging up Stringee call:", error);
            }
            stringeeCallRef.current = null;
        }

        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((track) => {
                console.log(`🛑 Stopped track: ${track.kind}`);
                track.stop();
            });
            localStreamRef.current = null;
        }

        if (localVideoRef.current) localVideoRef.current.srcObject = null;
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;

        if (!callStarted && signalingCode !== null) {
            switch (signalingCode) {
                case 5:
                    console.log("📵 Cuộc gọi nhỡ");
                    sendCallStatusMessage("📵 Cuộc gọi nhỡ");
                    break;
                case 6:
                    console.log("🚫 Cuộc gọi bị từ chối hoặc kết thúc");
                    sendCallStatusMessage("❔ Cuộc gọi kết thúc");
                    break;
                case 3:
                    console.log("⚠️ Máy bận");
                    sendCallStatusMessage("⚠️ Máy bận");
                    break;
                default:
                    console.log("ℹ️ Cuộc gọi kết thúc không rõ lý do:", signalingCode);
                    sendCallStatusMessage("❔ Cuộc gọi kết thúc");
                    break;
            }
        } else if (callStarted) {
            // THÊM VÀO ĐÂY: Gửi tin nhắn khi cuộc gọi đang hoạt động và kết thúc bình thường
            console.log("📞 Cuộc gọi kết thúc bình thường");
            sendCallStatusMessage("❔ Cuộc gọi kết thúc");
        }

        setCallStarted(false);
        setIsMuted(false);
        setIsVideoOff(false);
        setSignalingCode(null);
        if (onEndCall) onEndCall();

        if (callSessionId) {
            try {
                const response = await fetch(`${process.env.REACT_APP_API_URL}/chat/call/end/${callSessionId}`, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!response.ok) throw new Error("Không thể kết thúc cuộc gọi");
            } catch (err) {
                console.error("End call error:", err);
                toast.error("Lỗi khi kết thúc cuộc gọi: " + err.message);
            }
            setCallSessionId(null);
        }
        navigate(`/messages?chatId=${chatId}`);
    };

    const toggleMute = () => {
        if (!stringeeCallRef.current || !localStreamRef.current) {
            toast.error("Không thể tắt micro: Cuộc gọi chưa sẵn sàng.");
            return;
        }

        const newMuteState = !isMuted;
        try {
            stringeeCallRef.current.mute(newMuteState);
            localStreamRef.current.getAudioTracks().forEach((track) => {
                track.enabled = !newMuteState;
            });
            setIsMuted(newMuteState);
            toast.info(newMuteState ? "Micro đã tắt" : "Micro đã bật");
        } catch (error) {
            console.error("Lỗi khi tắt/bật micro:", error);
            toast.error("Lỗi khi điều chỉnh micro.");
        }
    };

    const toggleVideo = () => {
        if (!stringeeCallRef.current || !localStreamRef.current) {
            toast.error("Không thể tắt camera: Cuộc gọi chưa sẵn sàng.");
            return;
        }

        const newVideoState = !isVideoOff;
        try {
            localStreamRef.current.getVideoTracks().forEach((track) => {
                track.enabled = !newVideoState;
            });
            setIsVideoOff(newVideoState);
            toast.info(newVideoState ? "Camera đã tắt" : "Camera đã bật");
        } catch (error) {
            console.error("Lỗi khi tắt/bật camera:", error);
            toast.error("Lỗi khi điều chỉnh camera.");
        }
    };

    return (
        <div className="relative h-screen bg-black flex flex-col">
            <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover bg-gray-900"
            />
            <div className={`absolute bottom-6 right-6 w-[25%] max-w-[240px] aspect-video rounded-xl overflow-hidden shadow-2xl border border-gray-700 bg-gray-900 transition-opacity duration-300 ${callStarted ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                />
            </div>
            <div className="absolute top-4 left-4 text-white text-lg font-semibold">
                {recipientId ? `Đang gọi ${recipientId}` : "Đang kết nối..."}
            </div>
            <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2">
                {!callStarted ? (
                    <Button
                        variant="primary"
                        size="lg"
                        className="rounded-full w-12 h-12 flex items-center justify-center"
                        onClick={startCall}
                    >
                        <FaPhone size={20} />
                    </Button>
                ) : (
                    <div className="flex space-x-6 bg-gray-800 bg-opacity-70 p-4 rounded-full shadow-lg">
                        <Button
                            variant={isMuted ? "danger" : "light"}
                            size="lg"
                            className="rounded-full w-12 h-12 flex items-center justify-center"
                            onClick={toggleMute}
                        >
                            {isMuted ? <FaMicrophoneSlash size={20} /> : <FaMicrophone size={20} />}
                        </Button>
                        <Button
                            variant={isVideoOff ? "danger" : "light"}
                            size="lg"
                            className="rounded-full w-12 h-12 flex items-center justify-center"
                            onClick={toggleVideo}
                        >
                            {isVideoOff ? <FaVideoSlash size={20} /> : <FaVideo size={20} />}
                        </Button>
                        <Button
                            variant="danger"
                            size="lg"
                            className="rounded-full w-12 h-12 flex items-center justify-center"
                            onClick={endCall}
                        >
                            <FaPhone size={20} />
                        </Button>
                    </div>
                )}
            </div>
            <ToastContainer position="top-center" autoClose={3000} hideProgressBar theme="dark" />
        </div>
    );
};

export default Call;