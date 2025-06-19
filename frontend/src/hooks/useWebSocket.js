import { useEffect, useRef, useContext, useCallback } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { AuthContext } from "../context/AuthContext";
import { toast } from "react-toastify";

export const useWebSocket = (chatId, onMessage, setIsTyping, onCallSignal) => {
    const { user, token } = useContext(AuthContext);
    const clientRef = useRef(null);
    const isConnecting = useRef(false);
    const reconnectAttempts = useRef(0);
    const maxReconnectAttempts = 10;

    const initializeWebSocket = useCallback(() => {
        if (!token || !user || !chatId) {
            console.log("No token, user, or chatId, skipping WebSocket connection");
            return;
        }

        if (clientRef.current?.active || isConnecting.current) {
            console.log("WebSocket already active or connecting");
            return;
        }

        isConnecting.current = true;
        console.log("Initializing WebSocket for chatId:", chatId);

        const client = new Client({
            webSocketFactory: () => new SockJS(`${process.env.REACT_APP_WS_URL}/ws`),
            connectHeaders: { Authorization: `Bearer ${token}` },
            reconnectDelay: 5000,
            reconnectAttempts: maxReconnectAttempts,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            onConnect: () => {
                console.log("WebSocket connected for chatId:", chatId);
                isConnecting.current = false;
                reconnectAttempts.current = 0;

                client.subscribe(`/topic/chat/${chatId}`, (msg) => {
                    const message = JSON.parse(msg.body);
                    onMessage(message);
                });

                client.subscribe(`/topic/typing/${chatId}`, (typingMsg) => {
                    const data = JSON.parse(typingMsg.body);
                    if (data.userId !== user?.id) setIsTyping(data.isTyping);
                });

                client.subscribe(`/topic/call/${chatId}`, (signal) => {
                    const data = JSON.parse(signal.body);
                    onCallSignal(data);
                });
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
        client.activate();

        return () => {
            if (clientRef.current?.active) {
                clientRef.current.deactivate();
            }
        };
    }, [token, user, chatId, onMessage, setIsTyping, onCallSignal]);

    useEffect(() => {
        const cleanup = initializeWebSocket();
        return cleanup;
    }, [initializeWebSocket]);

    return clientRef.current;
};