import React, { useState, useEffect, useRef, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button, Row, Col } from "react-bootstrap";
import { FaMicrophoneSlash, FaVideoSlash, FaPhone } from "react-icons/fa";
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
                    const recipient = members.find((member) => member.userId !== user.id);
                    if (recipient) {
                        setRecipientId(recipient.stringeeUserId || recipient.username);
                    } else {
                        toast.error("Không tìm thấy người nhận trong cuộc trò chuyện.");
                    }
                } else {
                    const errorText = await response.text();
                    throw new Error(`Lỗi khi lấy danh sách thành viên: ${errorText}`);
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
                    throw new Error(`Lỗi khi lấy access token: ${errorText}`);
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

        const initializeStringee = (accessToken) => {
            if (!window.Stringee) {
                toast.error("Stringee SDK chưa được tải. Vui lòng kiểm tra kết nối.");
                return;
            }
            if (!accessToken || !isMounted) {
                toast.error("Access token không hợp lệ.");
                return;
            }
            stringeeClientRef.current = new window.Stringee.StringeeClient();
            stringeeClientRef.current.connect(accessToken);

            stringeeClientRef.current.on("connect", () => {
                if (isMounted) {
                    console.log("Stringee connected to ", process.env.REACT_APP_STRINGEE_WS_URL);
                    toast.success("Đã kết nối với Stringee.");
                }
            });

            stringeeClientRef.current.on("authen", (res) => {
                if (isMounted) {
                    console.log("Stringee authen:", res);
                    if (res.r !== 0) {
                        toast.error("Lỗi xác thực Stringee: " + res.message);
                    }
                }
            });

            stringeeClientRef.current.on("error", (error) => {
                if (isMounted) {
                    console.error("Stringee error:", error);
                    toast.error("Lỗi kết nối Stringee: " + error.message);
                }
            });

            stringeeClientRef.current.on("disconnect", () => {
                if (isMounted) {
                    console.log("Stringee disconnected");
                    toast.warn("Mất kết nối với Stringee.");
                }
            });

            stringeeClientRef.current.on("incomingcall", (incomingCall) => {
                if (!isMounted) return;
                stringeeCallRef.current = incomingCall;
                window.dispatchEvent(
                    new CustomEvent("incomingCall", {
                        detail: { chatId: chatId, sessionId: incomingCall.callId }
                    })
                );
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
                } catch (error) {
                    console.error("Error hanging up Stringee call:", error);
                }
            }
        };
    }, [chatId, token, user, navigate]);

    const startCall = async () => {
        if (!stringeeClientRef.current || !stringeeClientRef.current.connected) {
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

            stringeeCallRef.current.on("addlocalstream", (stream) => {
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                    localVideoRef.current.play().catch((err) => console.error("Local video play error:", err));
                }
            });

            stringeeCallRef.current.on("addremotestream", (stream) => {
                if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = stream;
                    remoteVideoRef.current.play().catch((err) => console.error("Remote video play error:", err));
                }
            });

            stringeeCallRef.current.on("end", () => {
                endCall();
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
        if (stringeeCallRef.current) {
            stringeeCallRef.current.mute(!isMuted);
            setIsMuted(!isMuted);
        }
    };

    const toggleVideo = () => {
        if (stringeeCallRef.current) {
            stringeeCallRef.current.enableVideo(!isVideoOff);
            setIsVideoOff(!isVideoOff);
        }
    };

    return (
        <div className="p-3 bg-light">
            <Row>
                <Col xs={6}>
                    <h6>Video của bạn</h6>
                    <video
                        ref={localVideoRef}
                        autoPlay
                        muted
                        style={{ width: "100%", borderRadius: 8, backgroundColor: "#000" }}
                    />
                    <div className="mt-2 d-flex justify-content-around">
                        <Button
                            size="sm"
                            variant={isMuted ? "danger" : "outline-danger"}
                            onClick={toggleMute}
                        >
                            <FaMicrophoneSlash />
                        </Button>
                        <Button
                            size="sm"
                            variant={isVideoOff ? "danger" : "outline-danger"}
                            onClick={toggleVideo}
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
                        style={{ width: "100%", borderRadius: 8, backgroundColor: "#000" }}
                    />
                    <Button
                        variant="danger"
                        className="w-100 mt-2"
                        onClick={endCall}
                    >
                        Thoát cuộc gọi
                    </Button>
                </Col>
            </Row>
            {!callStarted && (
                <Button
                    variant="outline-primary"
                    className="w-100 mt-2"
                    onClick={startCall}
                >
                    <FaPhone /> Bắt đầu cuộc gọi
                </Button>
            )}
            <ToastContainer />
        </div>
    );
};

export default Call;