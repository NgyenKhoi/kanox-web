    import React, { useState, useEffect, useRef, useContext } from "react";
    import { useParams, useNavigate } from "react-router-dom";
    import { Button, Row, Col } from "react-bootstrap";
    import { FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash, FaPhone } from "react-icons/fa";
    import { AuthContext } from "../../context/AuthContext";
    import { ToastContainer, toast } from "react-toastify";
    import "react-toastify/dist/ReactToastify.css";
    import { WebSocketContext } from "../../context/WebSocketContext";


    const Call = ({ onEndCall, onStartCall }) => {
        const { user, token } = useContext(AuthContext);
        const { chatId } = useParams();
        const navigate = useNavigate();
        const [isMuted, setIsMuted] = useState(false);
        const [isVideoOff, setIsVideoOff] = useState(false);
        const [callStarted, setCallStarted] = useState(false);
        const [recipientId, setRecipientId] = useState(null);
        const [callSessionId, setCallSessionId] = useState(null);
        const [isSpam, setIsSpam] = useState(false); // Thêm trạng thái isSpam
        const stringeeClientRef = useRef(null);
        const stringeeCallRef = useRef(null);
        const localVideoRef = useRef(null);
        const remoteVideoRef = useRef(null);
        const localStreamRef = useRef(null);
        const [localStream, setLocalStream] = useState(null);
        const [isStringeeConnected, setIsStringeeConnected] = useState(false);
        const [signalingCode, setSignalingCode] = useState(null);
        const { publish, subscribe, unsubscribe } = useContext(WebSocketContext);
        const currentCallRef = useRef(null);
        const incomingCallRef = useRef(null);
        let reconnectTimer = null;

        const sendCallStatusMessage = (statusMessage) => {
            if (!publish || !chatId || !user) return;

            const msg = {
                chatId: Number(chatId),
                senderId: user.id,
                content: statusMessage,
                typeId: 4, // ✅ Dùng typeId = 2 để phân biệt với tin nhắn thường
            };

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

            const subscription = subscribe(`/topic/chat/${chatId}`, callback, subId);

            return () => {
                clearTimeout(reconnectTimer);
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

            const subId = `call-fail-${chatId}`;
            const endCallSubId = `call-end-${chatId}`;


            const busyCallback = (data) => {
                if (data.content === "⚠️ Máy bận") {
                    toast.warning("Người kia đang bận. Quay lại chat.");
                    navigate(`/messages?chatId=${chatId}`);
                }
            };

            const endCallCallback = (data) => {
                if (data.content === "❔ Cuộc gọi kết thúc" && data.senderId !== user.id) {
                    console.log("📴 Nhận tín hiệu kết thúc cuộc gọi từ bên kia");
                    endCall(); // Gọi endCall để thoát giao diện và dọn dẹp
                }
            };

            const busySubscription = subscribe(`/topic/chat/${chatId}`, busyCallback, subId);
            const endCallSubscription = subscribe(`/topic/chat/${chatId}`, endCallCallback, endCallSubId);

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
                            setIsSpam(recipient.isSpam || false); // Lấy trạng thái isSpam
                        } else {
                            toast.error("Không tìm thấy người nhận trong cuộc trò chuyện.");
                        }
                        console.log("👤 Current user:", user.username);
                        console.log("📄 All members:", members);
                    } else {
                        const errorText = await response.text();
                        throw new Error("Lỗi khi lấy danh sách thành viên: ", `${errorText}`);
                    }
                } catch (err) {
                    if (isMounted) {
                        console.error("Error fetching chat members:", err);
                        toast.error(err.message || "Lỗi khi lấy thông tin cuộc trò chuyện.");
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
                    if (!response.ok) {
                        const errorText = await response.text();
                        throw new Error("Lỗi khi lấy access token:", `${errorText}`);
                    }
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
                        setTimeout(() => {
                            initializeStringee(accessToken, retryCount + 1);
                        }, 200);
                    } else {
                        toast.error("Không thể tải Stringee SDK. Vui lòng tải lại trang.");
                    }
                    return;
                }

                navigator.mediaDevices.getUserMedia({ audio: true, video: true })
                    .then((stream) => {
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
                    reconnectTimer = setTimeout(() => {
                        stringeeClientRef.current.connect(accessToken);
                    }, 3000);
                });


                stringeeClientRef.current.on("incomingcall", (incomingCall) => {
                    console.log("📞 incomingCall.toNumber:", incomingCall.toNumber);
                    console.log("👤 currentUser.username:", user.username);
                    if (callStarted || stringeeCallRef.current) {
                        console.warn("❌ Đang trong cuộc gọi khác, từ chối cuộc gọi mới.");

                        const busyMsg = {
                            chatId: incomingCall.customData?.chatId || -1,
                            senderId: user.id,
                            content: "⚠️ Máy bận",
                            typeId: 4,
                        };
                        if (busyMsg.chatId !== -1) {
                            publish("/app/sendMessage", busyMsg);
                            console.log("📨 Gửi tin nhắn máy bận đến chatId:", busyMsg.chatId);
                            publish("/app/call/end", {
                                chatId: busyMsg.chatId,
                                callSessionId: incomingCall.callId,
                                userId: user.id,
                            });
                        } else {
                            console.error("🚫 Không có chatId hợp lệ để gửi tin nhắn máy bận");
                        }

                        incomingCall.reject((res) => {
                            if (res.r === 0) {
                                console.log("📴 Cuộc gọi từ", incomingCall.fromNumber, "đã bị từ chối");
                            } else {
                                console.error("Lỗi khi từ chối cuộc gọi:", res.message);
                            }
                        });
                        return;
                    }

                    incomingCallRef.current = incomingCall;
                    if (incomingCall.fromNumber === user.username) {
                        console.log("⚠️ Bỏ qua cuộc gọi vì mình là người gọi");
                        return;
                    }

                    incomingCall.on("addlocalstream", (stream) => {
                        localStreamRef.current = stream;
                        if (localVideoRef.current) {
                            localVideoRef.current.srcObject = stream;
                            localVideoRef.current.play().catch((err) => {
                                console.warn("Local video play error:", err);
                                setTimeout(() => {
                                    localVideoRef.current?.play().catch(err => console.error("Retry local video error:", err));
                                }, 300);
                            });
                        }
                    });

                    incomingCall.on("addremotestream", (stream) => {
                        if (remoteVideoRef.current) {
                            remoteVideoRef.current.srcObject = stream;
                            remoteVideoRef.current.play().catch((err) => {
                                console.warn("Remote video play error:", err);
                                setTimeout(() => {
                                    remoteVideoRef.current?.play().catch(err => console.error("Retry remote video error:", err));
                                }, 300);
                            });
                        }
                    });

                    incomingCall.on("end", () => {
                        console.log("❌ Cuộc gọi đến kết thúc");
                        endCall();
                    });

                    // Chỉ trả lời cuộc gọi nếu không bị từ chối trước đó
                    incomingCall.answer((res) => {
                        if (res.r === 0) {
                            setCallStarted(true);
                            console.log("📞 Cuộc gọi đã được trả lời");
                            stringeeCallRef.current = incomingCall;
                            publish("/app/call/start", {
                                chatId: Number(incomingCall.customData?.chatId) || -1,
                                callSessionId: incomingCall.callId,
                                userId: user.id,
                            });
                        } else {
                            toast.error("Không thể trả lời cuộc gọi: " + res.message);
                            endCall();
                        }
                    });
                });

            };

            fetchChatMembers();
            fetchAccessToken();

            return () => {
                isMounted = false;
                if (stringeeClientRef.current) {
                    try {
                        stringeeClientRef.current.disconnect();
                    } catch (error) {
                        console.error("Error disconnecting Stringee:", error);
                    }
                }
                if (stringeeCallRef.current) {
                    try {
                        stringeeCallRef.current.hangup();
                        stringeeCallRef.current = null;
                    } catch (error) {
                        console.error("Error hanging up Stringee call:", error);
                    }
                }
                clearTimeout(reconnectTimer);
                unsubscribe(subId);
                unsubscribe(endCallSubId);
            };
        }, [chatId, token, user, navigate, publish, subscribe, unsubscribe]);

        const startCall = async () => {
            if (isSpam) {
                toast.error("Không thể gọi video cho người dùng đã đánh dấu spam.");
                return;
            }
            let stream;
            try {
                stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
                console.log("🎥 Đã lấy được quyền truy cập camera/mic");
            } catch (err) {
                console.error("❌ Không lấy được cam/mic:", err);
                toast.error("Không thể truy cập camera/micro. Vui lòng cấp quyền.");
                return;
            }

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
            //setCallStarted(false);

            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => track.stop());
                localStreamRef.current = null;
            }
            if (localVideoRef.current) localVideoRef.current.srcObject = null;
            if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;

            try {
                const response = await fetch(`${process.env.REACT_APP_API_URL}/chat/call/start/${chatId}`, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error("Không thể khởi tạo cuộc gọi: ", `${errorText}`);
                }
                const callSession = await response.json();
                setCallSessionId(callSession.sessionId);

                stringeeCallRef.current = new window.Stringee.StringeeCall(
                    stringeeClientRef.current,
                    user.username,
                    recipientId,
                    true,
                    { chatId: Number(chatId) }
                );

                stringeeCallRef.current.on("signalingstate", (state) => {
                    setSignalingCode(state.code);
                    console.log("📶 Signaling state:", state);

                    if (state.code === 3) {
                        toast.error("Người nhận đang bận cuộc gọi khác.");
                    }
                });
                stringeeCallRef.current.on("mediastate", (state) => {
                    console.log("📺 Media state:", state);
                });

                stringeeCallRef.current.on("addlocalstream", (stream) => {
                    console.log("🎥 [addlocalstream] Stream:", stream);
                    localStreamRef.current = stream;

                    const tryAssignStream = () => {
                        if (localVideoRef.current) {
                            localVideoRef.current.srcObject = localStreamRef.current;
                            localVideoRef.current.play().catch((err) => {
                                console.warn("Local video play error:", err);
                            });
                        } else {
                            // Chờ đến khi localVideoRef mount xong
                            setTimeout(tryAssignStream, 100);
                        }
                    };

                    tryAssignStream();
                });


                stringeeCallRef.current.on("addremotestream", (stream) => {
                    if (remoteVideoRef.current) {
                        remoteVideoRef.current.srcObject = stream;
                        setTimeout(() => {
                            remoteVideoRef.current
                                .play()
                                .then(() => console.log("▶️ Remote video playing"))
                                .catch(err => console.warn("Remote video play error:", err));
                        }, 300); // ⏱️ delay để tránh AbortError
                    }
                });

                stringeeCallRef.current.on("end", () => {
                    console.log("❌ Cuộc gọi kết thúc từ Stringee");
                    endCall();
                });


    // Thêm debug state
                stringeeCallRef.current.on("signalingstate", (state) => {
                    setSignalingCode(state.code);
                    console.log("📶 Signaling state:", state);
                });
                stringeeCallRef.current.on("mediastate", (state) => {
                    console.log("📺 Media state:", state);
                });

                stringeeCallRef.current.makeCall((res) => {
                    if (res.r === 0) {
                        console.log("Call started:", res);
                        setCallStarted(true);
                        if (onStartCall) onStartCall(true); // <--- ✅ Gọi về AppContent
                    } else {
                        console.error("Call failed:", res);
                        toast.error("Không thể bắt đầu cuộc gọi: " + res.message);
                        if (onStartCall) onStartCall(false); // fallback nếu call fail
                    }
                });
            } catch (err) {
                console.error("Start call error:", err);
                toast.error("Lỗi khi bắt đầu cuộc gọi: " + err.message);
            } finally {
                // Dừng stream tạm thời nếu không sử dụng
                if (!callStarted) {
                    stream.getTracks().forEach(track => track.stop());
                }
            }
        };

        const endCall = async () => {
            // Dừng Stringee call
            if (stringeeCallRef.current) {
                try {
                    stringeeCallRef.current.hangup();
                    console.log("📞 Hung up call");
                } catch (error) {
                    console.error("Error hanging up Stringee call:", error);
                }
                stringeeCallRef.current = null;
            }

            // Dừng incoming call nếu có
            if (incomingCallRef.current) {
                try {
                    incomingCallRef.current.hangup();
                    console.log("📞 Hung up incoming call");
                } catch (error) {
                    console.error("Error hanging up incoming call:", error);
                }
                incomingCallRef.current = null;
            }

            // Dừng tất cả media tracks
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach((track) => {
                    console.log(`🛑 Stopped track: ${track.kind}`);
                    track.stop();
                });
                localStreamRef.current = null;
            }

            // Xóa stream khỏi video elements
            if (localVideoRef.current) localVideoRef.current.srcObject = null;
            if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;

            // Gửi tín hiệu kết thúc cuộc gọi qua WebSocket
            if (publish && chatId && user) {
                const endCallMsg = {
                    chatId: Number(chatId),
                    senderId: user.id,
                    content: "❔ Cuộc gọi kết thúc",
                    typeId: 4,
                };
                publish("/app/sendMessage", endCallMsg);
                console.log("📨 Gửi tín hiệu kết thúc cuộc gọi đến chatId:", chatId);
                // Gửi tín hiệu từ chối/kết thúc cuộc gọi
                if (callSessionId) {
                    publish("/app/call/end", {
                        chatId: Number(chatId),
                        callSessionId,
                        userId: user.id,
                    });
                }
            }

            // Cập nhật trạng thái và điều hướng
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
                console.log("📞 Cuộc gọi kết thúc bình thường");
                sendCallStatusMessage("❔ Cuộc gọi kết thúc");
            }

            setCallStarted(false);
            setIsMuted(false);
            setIsVideoOff(false);
            setSignalingCode(null);
            if (onEndCall) onEndCall();

            // Gọi API để kết thúc session
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

            // Điều hướng về trang chat
            navigate(`/messages?chatId=${chatId}`);
        };


        const toggleMute = () => {
            if (!stringeeCallRef.current || !localVideoRef.current?.srcObject) {
                toast.error("Không thể tắt micro: Cuộc gọi chưa sẵn sàng.");
                return;
            }

            const newMuteState = !isMuted;
            try {
                // Gọi hàm mute của Stringee
                stringeeCallRef.current.mute(newMuteState);

                // Cập nhật trạng thái track audio
                const audioTracks = localVideoRef.current.srcObject.getAudioTracks();
                if (audioTracks.length > 0) {
                    audioTracks.forEach((track) => {
                        track.enabled = !newMuteState;
                    });
                    setIsMuted(newMuteState);
                    toast.info(newMuteState ? "Micro đã tắt" : "Micro đã bật");
                } else {
                    console.warn("Không tìm thấy audio track.");
                    toast.warn("Không tìm thấy micro để tắt/bật.");
                }
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
                const videoTracks = localStreamRef.current.getVideoTracks();
                if (videoTracks.length > 0) {
                    videoTracks.forEach((track) => {
                        track.enabled = !newVideoState;
                    });
                    setIsVideoOff(newVideoState);
                    toast.info(newVideoState ? "Camera đã tắt" : "Camera đã bật");
                } else {
                    console.warn("Không tìm thấy video track.");
                    toast.warn("Không tìm thấy camera để tắt/bật.");
                }
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
                {callStarted && (
                    <div className="absolute bottom-6 right-6 w-[25%] max-w-[240px] aspect-video rounded-xl overflow-hidden shadow-2xl border border-gray-700 bg-gray-900">
                        <video
                            ref={localVideoRef}
                            autoPlay
                            muted
                            playsInline
                            className="w-full h-full object-cover"
                        />
                    </div>
                )}
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
                <ToastContainer
                    position="top-center"
                    autoClose={3000}
                    hideProgressBar
                    theme="dark"
                />
            </div>
        );
    };

    export default Call;

























