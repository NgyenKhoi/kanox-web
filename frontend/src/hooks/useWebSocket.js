import { useEffect, useRef, useContext } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { AuthContext } from "../context/AuthContext";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export const useWebSocket = (onNotification, setUnreadCount) => {
    const { user, token } = useContext(AuthContext); // Sử dụng token từ AuthContext
    const clientRef = useRef(null);

    useEffect(() => {
        if (!user) {
            console.log("No user found, skipping WebSocket connection");
            if (clientRef.current) clientRef.current.deactivate();
            return;
        }

        console.log("WebSocket Token from AuthContext:", token);

        const initializeWebSocket = () => {
            if (!token) {
                console.error("No token available for WebSocket");
                toast.error("Không có token để kết nối WebSocket. Vui lòng đăng nhập lại.");
                return;
            }

            const client = new Client({
                webSocketFactory: () => new SockJS("https://kanox.duckdns.org/ws"), // Hoặc http://localhost:8080/ws
                connectHeaders: {
                    Authorization: `Bearer ${token}`,
                },
                reconnectDelay: 5000,
                reconnectAttempts: 3,
                heartbeatIncoming: 4000,
                heartbeatOutgoing: 4000,
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
                    if (clientRef.current) clientRef.current.deactivate();
                },
                onStompError: (frame) => {
                    console.error("STOMP error:", frame);
                    toast.error("Lỗi giao thức STOMP: " + frame.body);
                    if (clientRef.current) clientRef.current.deactivate();
                },
                onDisconnect: () => {
                    console.log("WebSocket disconnected");
                },
                debug: (str) => {
                    console.log("STOMP Debug:", str);
                },
            });

            clientRef.current = client;
            console.log("Activating WebSocket client");
            client.activate();
        };

        initializeWebSocket();

        return () => {
            console.log("Deactivating WebSocket client");
            if (clientRef.current) clientRef.current.deactivate();
        };
    }, [user, token, onNotification, setUnreadCount]); // Theo dõi thay đổi token

    return clientRef.current;
};