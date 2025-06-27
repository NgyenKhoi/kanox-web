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
    const lastConnectionAttempt = useRef(0);
    const pingIntervalRef = useRef(null);

    const initializeWebSocket = useCallback(() => {
        if (!token || !user) {
            console.log("No token or user available, skipping WebSocket initialization");
            return () => {};
        }

        const now = Date.now();
        if (clientRef.current?.connected || isConnecting.current || (now - lastConnectionAttempt.current < 2000)) {
            console.log(`WebSocket already connected, connecting, or too soon since last attempt at ${new Date(now).toISOString()}`);
            return () => {};
        }

        isConnecting.current = true;
        lastConnectionAttempt.current = now;
        console.log(`Initializing WebSocket at ${new Date(now).toISOString()} for user: ${user.id}`);

        const client = new Client({
            webSocketFactory: () => new SockJS(`${process.env.REACT_APP_WS_URL}/ws`),
            connectHeaders: { Authorization: `Bearer ${token}` },
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            onConnect: (frame) => {
                console.log(`WebSocket connected successfully at ${new Date().toISOString()} for user: ${user.id}`, frame);
                isConnecting.current = false;
                reconnectAttempts.current = 0;

                // Subscribe vào các topic
                const notificationSub = client.subscribe(`${topicPrefix}${user.id}`, (message) => {
                    try {
                        const data = JSON.parse(message.body);
                        console.log(`Received notification at ${new Date().toISOString()}:`, data);
                        onMessage(data);
                        setUnreadCount((prev) => prev + 1);
                    } catch (error) {
                        console.error(`Error parsing notification message at ${new Date().toISOString()}:`, error);
                    }
                });

                const messageSub = client.subscribe(`/topic/messages/${user.id}`, (message) => {
                    try {
                        const msg = JSON.parse(message.body);
                        console.log(`Received new message at ${new Date().toISOString()}:`, msg);
                        onMessage(msg);
                        setUnreadCount((prev) => prev + 1);
                    } catch (error) {
                        console.error(`Error parsing message at ${new Date().toISOString()}:`, error);
                    }
                });

                const callSubs = chatIds.map((chatId) =>
                    client.subscribe(`/topic/call/${chatId}`, (message) => {
                        try {
                            const callData = JSON.parse(message.body);
                            console.log(`Received incoming call at ${new Date().toISOString()}:`, callData);
                            onMessage({ type: "CALL", data: callData });
                        } catch (error) {
                            console.error(`Error parsing call message at ${new Date().toISOString()}:`, error);
                        }
                    })
                );

                subscriptionsRef.current = [notificationSub, messageSub, ...callSubs];
                console.log(`Subscribed to topics: ${[topicPrefix + user.id, `/topic/messages/${user.id}`, ...chatIds.map(id => `/topic/call/${id}`)]}`);

                // Bắt đầu ping để giữ kết nối
                if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
                pingIntervalRef.current = setInterval(() => {
                    if (client.connected) {
                        console.log(`Sending ping at ${new Date().toISOString()}`);
                        client.publish({ destination: "/app/ping", body: null });
                    }
                }, 30000);
            },
            onWebSocketError: (error) => {
                console.error(`WebSocket error at ${new Date().toISOString()}:`, error);
                toast.error("Lỗi kết nối WebSocket. Đang thử lại...");
                isConnecting.current = false;
            },
            onStompError: (frame) => {
                console.error(`STOMP error at ${new Date().toISOString()}:`, frame);
                toast.error(`Lỗi giao thức STOMP: ${frame.body || "Không xác định"}`);
                isConnecting.current = false;
            },
            onDisconnect: () => {
                console.log(`WebSocket disconnected at ${new Date().toISOString()}`);
                isConnecting.current = false;
                if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
                if (reconnectAttempts.current < maxReconnectAttempts) {
                    reconnectAttempts.current += 1;
                    console.log(`Reconnect attempt ${reconnectAttempts.current}/${maxReconnectAttempts} scheduled`);
                    setTimeout(initializeWebSocket, 2000); // Thử lại sau 2 giây
                } else {
                    console.log("Max reconnect attempts reached, stopping reconnection");
                }
            },
            debug: (str) => console.log(`STOMP Debug at ${new Date().toISOString()}:`, str),
        });

        clientRef.current = client;
        console.log("Activating WebSocket client");
        client.activate();

        return () => {
            subscriptionsRef.current.forEach((sub) => {
                console.log(`Unsubscribing from ${sub.id} at ${new Date().toISOString()}`);
                sub.unsubscribe();
            });
            if (clientRef.current?.connected) {
                clientRef.current.deactivate();
                console.log("Deactivated WebSocket client at", new Date().toISOString());
            }
            if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        };
    }, [token, user, onMessage, setUnreadCount, topicPrefix, chatIds]);

    useEffect(() => {
        if (!user || !token) {
            if (clientRef.current?.connected) {
                console.log("Deactivating WebSocket due to missing user or token at", new Date().toISOString());
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
        if (!clientRef.current || !clientRef.current.connected) {
            console.error(`Cannot publish at ${new Date().toISOString()}: WebSocket is not connected. Client state: ${clientRef.current?.state}, Connected: ${clientRef.current?.connected}`);
            toast.error("Không thể gửi tin nhắn: WebSocket chưa kết nối");
            return false;
        }
        try {
            clientRef.current.publish({
                destination,
                body: typeof body === "string" ? body : JSON.stringify(body),
            });
            console.log(`Published to ${destination} at ${new Date().toISOString()} with body:`, body);
            return true;
        } catch (error) {
            console.error(`Error publishing message to ${destination} at ${new Date().toISOString()}:`, error);
            toast.error("Lỗi khi gửi tin nhắn qua WebSocket");
            return false;
        }
    };

    return { client: clientRef.current, publish };
};

export default useWebSocket;