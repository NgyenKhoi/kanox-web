import { useEffect, useRef, useContext, useCallback } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { AuthContext } from "../context/AuthContext";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export const useWebSocket = (onMessage, setUnreadCount, topicPrefix = "/topic/notifications/") => {
    const { user, token } = useContext(AuthContext);
    const clientRef = useRef(null);
    const isConnecting = useRef(false);
    const reconnectAttempts = useRef(0);
    const maxReconnectAttempts = 10;

    const initializeWebSocket = useCallback(() => {
        if (!token || !user) {
            console.log("No token or user, skipping WebSocket connection");
            return;
        }

        if (clientRef.current?.active || isConnecting.current) {
            console.log("WebSocket already active or connecting");
            return;
        }

        isConnecting.current = true;
        console.log("Initializing WebSocket for user:", user.id);

        const client = new Client({
            webSocketFactory: () => new SockJS("https://kanox.duckdns.org/ws"),
            connectHeaders: {
                Authorization: `Bearer ${token}`,
            },
            reconnectDelay: 5000,
            reconnectAttempts: maxReconnectAttempts,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            onConnect: (frame) => {
                console.log("WebSocket connected successfully for user:", user.id);
                isConnecting.current = false;
                reconnectAttempts.current = 0;

                // Đăng ký topic cho thông báo
                client.subscribe(`${topicPrefix}${user.id}`, (message) => {
                    try {
                        const data = JSON.parse(message.body);
                        console.log("Received message:", data);
                        onMessage(data);
                        setUnreadCount((prev) => prev + 1);
                    } catch (error) {
                        console.error("Error parsing WebSocket message:", error);
                    }
                });

                // Đăng ký topic cho tin nhắn
                client.subscribe(`/topic/messages/${user.id}`, (message) => {
                    try {
                        const msg = JSON.parse(message.body);
                        console.log("Received new message:", msg);
                        onMessage(msg);
                        setUnreadCount((prev) => prev + 1);
                    } catch (error) {
                        console.error("Error parsing WebSocket message:", error);
                    }
                });
            },
            onWebSocketError: (error) => {
                console.error("WebSocket error:", error);
                toast.error("Lỗi kết nối WebSocket. Đang thử lại...");
                isConnecting.current = false;
            },
            onStompError: (frame) => {
                console.error("STOMP error:", frame);
                toast.error(`Lỗi giao thức STOMP: ${frame.body}`);
                isConnecting.current = false;
            },
            onDisconnect: () => {
                console.log("WebSocket disconnected");
                isConnecting.current = false;
                if (reconnectAttempts.current < maxReconnectAttempts) {
                    reconnectAttempts.current += 1;
                    console.log(`Reconnect attempt ${reconnectAttempts.current}/${maxReconnectAttempts}`);
                }
            },
            debug: (str) => {
                console.log("STOMP Debug:", str);
            },
        });

        clientRef.current = client;
        console.log("Activating WebSocket client");
        client.activate();
    }, [token, user, onMessage, setUnreadCount, topicPrefix]);

    useEffect(() => {
        if (!user || !token) {
            if (clientRef.current?.active) {
                console.log("Deactivating WebSocket due to missing user or token");
                clientRef.current.deactivate();
            }
            return;
        }

        initializeWebSocket();

        return () => {
            if (clientRef.current?.active) {
                console.log("Deactivating WebSocket client on cleanup");
                clientRef.current.deactivate();
            }
        };
    }, [initializeWebSocket]);

    return clientRef.current;
};