import { useEffect, useRef, useContext } from "react";
import { Client } from "@stomp/stompjs";
import { AuthContext } from "../context/AuthContext";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export const useWebSocket = (onNotification, setUnreadCount) => {
    const { user } = useContext(AuthContext);
    const clientRef = useRef(null);

    useEffect(() => {
        if (!user) return;

        const token = sessionStorage.getItem("token") || localStorage.getItem("token");
        if (!token) {
            toast.error("Không tìm thấy token. Vui lòng đăng nhập lại.");
            return;
        }

        const client = new Client({
            brokerURL: "wss://kanox.duckdns.org/ws",
            connectHeaders: {
                Authorization: `Bearer ${token}`,
            },
            onConnect: () => {
                client.subscribe(`/topic/notifications/${user.id}`, (message) => {
                    const notification = JSON.parse(message.body);
                    onNotification(notification); // Loại bỏ notification.notification
                    setUnreadCount((prev) => prev + 1);
                });
            },
            onError: (error) => {
                console.error("WebSocket error:", error);
                toast.error("Lỗi kết nối WebSocket!");
            },
        });

        clientRef.current = client;
        client.activate();

        const fetchUnreadCount = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_API_URL}/notifications?status=unread`, {
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                });

                const contentType = response.headers.get("content-type");
                let data;
                if (contentType && contentType.includes("application/json")) {
                    data = await response.json();
                } else {
                    const text = await response.text();
                    data = { message: text };
                }

                if (!response.ok) {
                    throw new Error(data.message || "Không thể lấy thông báo chưa đọc.");
                }

                setUnreadCount(data.content ? data.content.length : 0); // Đếm số thông báo chưa đọc
            } catch (error) {
                console.error("Lỗi khi lấy số chưa đọc:", error);
                toast.error(error.message || "Lỗi khi lấy số thông báo chưa đọc!");
            }
        };

        fetchUnreadCount();

        return () => client.deactivate();
    }, [user, onNotification, setUnreadCount]);

    return clientRef.current;
};