import React, { useState, useEffect, useRef, useContext } from "react";
import { Button, Row, Col } from "react-bootstrap";
import { FaMicrophoneSlash, FaVideoSlash, FaPhone } from "react-icons/fa";
import { AuthContext } from "../../context/AuthContext";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Call = ({ chatId, onEndCall }) => {
    const { user, token } = useContext(AuthContext);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [callStarted, setCallStarted] = useState(false);
    const [recipientId, setRecipientId] = useState(null);
    const stringeeClientRef = useRef(null);
    const stringeeCallRef = useRef(null);
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);

    useEffect(() => {
        let isMounted = true;

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
                        setRecipientId(recipient.userId.toString());
                    } else {
                        toast.error("Không tìm thấy người nhận trong cuộc trò chuyện.");
                    }
                } else {
                    throw new Error("Lỗi khi lấy danh sách thành viên.");
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
                if (!response.ok) {
                    throw new Error("Lỗi khi lấy access token.");
                }
                const data = await response.json();
                initializeStringee(data.accessToken);
            } catch (err) {
                if (isMounted) {
                    console.error("Error fetching access token:", err);
                    toast.error("Lỗi kết nối server.");
                }
            }
        };

        const initializeStringee = (accessToken) => {
            if (!accessToken || !isMounted) {
                toast.error("Access token không hợp lệ.");
                return;
            }
            stringeeClientRef.current = new window.Stringee.StringeeClient();
            stringeeClientRef.current.connect(accessToken);

            stringeeClientRef.current.on("connect", () => {
                if (isMounted) {
                    console.log("Stringee connected");
                    toast.success("Đã kết nối với Stringee.");
                }
            });

            stringeeClientRef.current.on("incomingcall", (incomingCall) => {
                if (!isMounted) return;
                stringeeCallRef.current = incomingCall;
                handleIncomingCall(incomingCall);
            });
        };

        const handleIncomingCall = (incomingCall) => {
            incomingCall.on("addlocalstream", (stream) => {
                if (localVideoRef.current && isMounted) {
                    localVideoRef.current.srcObject = stream;
                    localVideoRef.current.play().catch((err) => console.error("Local video play error:", err));
                }
            });

            incomingCall.on("addremotestream", (stream) => {
                if (remoteVideoRef.current && isMounted) {
                    remoteVideoRef.current.srcObject = stream;
                    remoteVideoRef.current.play().catch((err) => console.error("Remote video play error:", err));
                }
            });

            incomingCall.on("end", () => {
                if (isMounted) endCall();
            });

            if (isMounted && window.confirm("Có cuộc gọi đến. Chấp nhận?")) {
                incomingCall.accept();
                setCallStarted(true);
            } else {
                incomingCall.reject();
            }
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
    }, [chatId, token, user]);

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
            if (!response.ok) throw new Error("Không thể khởi tạo cuộc gọi.");

            stringeeCallRef.current = new window.Stringee.StringeeCall(
                stringeeClientRef.current,
                user.id.toString(),
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
                    toast.error("Không thể bắt đầu cuộc gọi.");
                }
            });
        } catch (err) {
            console.error("Start call error:", err);
            toast.error("Lỗi khi bắt đầu cuộc gọi: " + err.message);
        }
    };

    const endCall = () => {
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