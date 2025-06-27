import { useEffect, useRef, useContext, useCallback } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { AuthContext } from "../context/AuthContext";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export const useWebSocket = (onMessage, setUnreadCount, topicPrefix = "/topic/notifications/", chatIds = []) => {
    const { user, token } = useContext(AuthContext);
    const clientRef = useRef(null);
    const isConnecting = useRef(false);
    const reconnectAttempts = useRef(0);
    const maxReconnectAttempts = 10;
    const subscriptionsRef = useRef([]);

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
            webSocketFactory: () => new SockJS(`${process.env.REACT_APP_WS_URL}/ws`),
            connectHeaders: { Authorization: `Bearer ${token}` },
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            onConnect: (frame) => {
                console.log("WebSocket connected successfully for user:", user.id, frame);
                isConnecting.current = false;
                reconnectAttempts.current = 0;

                // Subscribe vào thông báo chung
                const notificationSub = client.subscribe(`${topicPrefix}${user.id}`, (message) => {
                    try {
                        const data = JSON.parse(message.body);
                        console.log("Received notification:", data);
                        onMessage(data);
                        setUnreadCount((prev) => prev + 1);
                    } catch (error) {
                        console.error("Error parsing WebSocket message:", error);
                    }
                });

                // Subscribe vào tin nhắn
                const messageSub = client.subscribe(`/topic/messages/${user.id}`, (message) => {
                    try {
                        const msg = JSON.parse(message.body);
                        console.log("Received new message:", msg);
                        onMessage(msg);
                        setUnreadCount((prev) => prev + 1);
                    } catch (error) {
                        console.error("Error parsing WebSocket message:", error);
                    }
                });

                // Subscribe vào thông báo cuộc gọi cho mỗi chatId
                const callSubs = chatIds.map((chatId) =>
                    client.subscribe(`/topic/call/${chatId}`, (message) => {
                        try {
                            const callData = JSON.parse(message.body);
                            console.log("Received incoming call:", callData);
                            onMessage({ type: "CALL", data: callData });
                        } catch (error) {
                            console.error("Error parsing call message:", error);
                        }
                    })
                );

                subscriptionsRef.current = [notificationSub, messageSub, ...callSubs];
            },
            onWebSocketError: (error) => {
                console.error("WebSocket error:", error);
                toast.error("Lỗi kết nối WebSocket. Đang thử lại...");
                isConnecting.current = false;
            },
            onStompError: (frame) => {
                console.error("STOMP error:", frame);
                toast.error(`Lỗi giao thức STOMP: ${frame.body || "Không xác định"}`);
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
            debug: (str) => console.log("STOMP Debug:", str),
        });

        clientRef.current = client;
        console.log("Activating WebSocket client");
        client.activate();

        return () => {
            subscriptionsRef.current.forEach((sub) => sub.unsubscribe());
            if (clientRef.current?.active) {
                clientRef.current.deactivate();
                console.log("Deactivated WebSocket client");
            }
        };
    }, [token, user, onMessage, setUnreadCount, topicPrefix, chatIds]);

    useEffect(() => {
        if (!user || !token) {
            if (clientRef.current?.active) {
                console.log("Deactivating WebSocket due to missing user or token");
                clientRef.current.deactivate();
            }
            return;
        }

        const cleanup = initializeWebSocket();

        return () => {
            if (typeof cleanup === "function") cleanup();
        };
    }, [initializeWebSocket]);

    const publish = (destination, body) => {
        if (!clientRef.current?.active) {
            console.error("Cannot publish: WebSocket is not connected");
            toast.error("Không thể gửi tin nhắn: WebSocket chưa kết nối");
            return false;
        }
        try {
            clientRef.current.publish({
                destination,
                body: typeof body === "string" ? body : JSON.stringify(body),
            });
            console.log(`Published to ${destination}:`, body);
            return true;
        } catch (error) {
            console.error("Error publishing message:", error);
            toast.error("Lỗi khi gửi tin nhắn qua WebSocket");
            return false;
        }
    };

    return { client: clientRef.current, publish };
};