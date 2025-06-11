import { useEffect, useRef, useContext } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { AuthContext } from "../context/AuthContext";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export const useWebSocket = (onNotification, setUnreadCount) => {
    const { user } = useContext(AuthContext);
    const clientRef = useRef(null);

    useEffect(() => {
        if (!user) {
            console.log("No user found, skipping WebSocket connection");
            return;
        }

        const token = sessionStorage.getItem("token") || localStorage.getItem("token");
        if (!token) {
            toast.error("Không tìm thấy token. Vui lòng đăng nhập lại.");
            console.error("No token found");
            return;
        }

        console.log("WebSocket Token:", token); // Log token

        const client = new Client({
            webSocketFactory: () => new SockJS("https://kanox.duckdns.org/api/ws"), // Hoặc http://localhost:8080/ws
            connectHeaders: {
                Authorization: `Bearer ${token}`,
            },
            onConnect: () => {
                console.log("WebSocket connected successfully for user:", user.id);
                client.subscribe(`/topic/notifications/${user.id}`, (message) => {
                    try {
                        const notification = JSON.parse(message.body);
                        console.log("Received notification:", notification);
                        onNotification(notification);
                        setUnreadCount((prev) => prev + 1);
                    } catch (error) {
                        console.error("Error parsing WebSocket message:", error);
                    }
                });
            },
            onWebSocketError: (error) => {
                console.error("WebSocket error:", error);
                toast.error("Lỗi kết nối WebSocket!");
            },
            onStompError: (frame) => {
                console.error("STOMP error:", frame);
                toast.error("Lỗi giao thức STOMP: " + frame.body);
            },
            debug: (str) => {
                console.log("STOMP Debug:", str);
            },
        });

        clientRef.current = client;
        console.log("Activating WebSocket client");
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

                console.log("Unread notifications count:", data.content ? data.content.length : 0);
                setUnreadCount(data.content ? data.content.length : 0);
            } catch (error) {
                console.error("Lỗi khi lấy số chưa đọc:", error);
                toast.error(error.message || "Lỗi khi lấy số thông báo chưa đọc!");
            }
        };

        fetchUnreadCount();

        return () => {
            console.log("Deactivating WebSocket client");
            client.deactivate();
        };
    }, [user, onNotification, setUnreadCount]);

    return clientRef.current;
};