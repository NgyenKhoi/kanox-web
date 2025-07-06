import React, { useState, useEffect, useRef, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button, Row, Col } from "react-bootstrap";
import { FaMicrophoneSlash, FaVideoSlash, FaPhone, FaMicrophone, FaVideo} from "react-icons/fa";
import { AuthContext } from "../../context/AuthContext";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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
    const [isStringeeConnected, setIsStringeeConnected] = useState(false);

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
                    }, 200); // mỗi 200ms kiểm tra lại
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
                setIsStringeeConnected(true); // đánh dấu đã kết nối
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
                toast.warn("Mất kết nối với Stringee.");
            });

            stringeeClientRef.current.on("incomingcall", (incomingCall) => {
                console.log("📞 incomingCall.toNumber:", incomingCall.toNumber);
                console.log("👤 currentUser.username:", user.username);

                // 👉 Lọc ra nếu mình là người gọi thì bỏ qua
                if (incomingCall.fromNumber === user.username) {
                    console.log("⚠️ Bỏ qua cuộc gọi vì mình là người gọi");
                    return;
                }

                stringeeCallRef.current = incomingCall;

                stringeeCallRef.current.on("signalingstate", (state) => {
                    console.log("📶 Signaling state:", state);
                });
                stringeeCallRef.current.on("mediastate", (state) => {
                    console.log("📺 Media state:", state);
                });

                incomingCall.on("addlocalstream", (stream) => {
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
                    endCall();
                });

                incomingCall.answer((res) => {
                    if (res.r === 0) {
                        setCallStarted(true);
                        console.log("📞 Cuộc gọi đã được trả lời");
                    } else {
                        toast.error("Không thể trả lời cuộc gọi: " + res.message);
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
                    stringeeCallRef.current = null; // ✅ THÊM
                } catch (error) {
                    console.error("Error hanging up Stringee call:", error);
                }
            }
        };
    }, [chatId, token, user, navigate]);

    const startCall = async () => {
        if (!isStringeeConnected) {
            toast.error("Chưa kết nối Stringee.");
            return;
        }
        if (!recipientId) {
            toast.error("Không tìm thấy người nhận để gọi.");
            return;
        }

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
                true
            );

            stringeeCallRef.current.on("signalingstate", (state) => {
                console.log("📶 Signaling state:", state);
            });
            stringeeCallRef.current.on("mediastate", (state) => {
                console.log("📺 Media state:", state);
            });

            stringeeCallRef.current.on("addlocalstream", (stream) => {
                console.log("🎥 [addlocalstream] Stream:", stream);
                console.log("🎥 [addlocalstream] Tracks:", stream.getTracks());
                stream.getVideoTracks().forEach(track => {
                    console.log("📹 Local Video Track - enabled:", track.enabled, "readyState:", track.readyState);
                });
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                    setTimeout(() => {
                        localVideoRef.current
                            .play()
                            .then(() => console.log("▶️ Local video playing"))
                            .catch(err => console.warn("Local video play error:", err));
                    }, 300); // ⏱️ delay giúp stream ổn định
                }
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
                endCall();
            });


// Thêm debug state
            stringeeCallRef.current.on("signalingstate", (state) => {
                console.log("📶 Signaling state:", state);
            });
            stringeeCallRef.current.on("mediastate", (state) => {
                console.log("📺 Media state:", state);
            });

            stringeeCallRef.current.makeCall((res) => {
                if (res.r === 0) {
                    console.log("Call started:", res);
                    setCallStarted(true);
                } else {
                    console.error("Call failed:", res);
                    toast.error("Không thể bắt đầu cuộc gọi: " + res.message);
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
            } catch (error) {
                console.error("Error hanging up Stringee call:", error);
            }
        }
        if (localVideoRef.current) localVideoRef.current.srcObject = null;
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
        setCallStarted(false);
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
        }
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
        if (!stringeeCallRef.current || !localVideoRef.current?.srcObject) {
            toast.error("Không thể tắt camera: Cuộc gọi chưa sẵn sàng.");
            return;
        }

        const newVideoState = !isVideoOff;
        try {
            // Gọi hàm enableVideo của Stringee (nếu có)
            if (typeof stringeeCallRef.current.enableVideo === "function") {
                stringeeCallRef.current.enableVideo(!newVideoState);
            } else {
                console.warn("Hàm enableVideo không tồn tại trong Stringee SDK.");
            }

            // Cập nhật trạng thái track video
            const videoTracks = localVideoRef.current.srcObject.getVideoTracks();
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
            {/* Video của người nhận (khung lớn) */}
            <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover bg-gray-900"
            />

            {/* Video của người gọi (khung nhỏ ở góc dưới bên phải) */}
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

            {/* Thông tin cuộc gọi (tên người nhận, trạng thái) */}
            <div className="absolute top-4 left-4 text-white text-lg font-semibold">
                {recipientId ? `Đang gọi ${recipientId}` : "Đang kết nối..."}
            </div>

            {/* Nút điều khiển */}
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