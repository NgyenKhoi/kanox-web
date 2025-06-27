import React, { createContext, useContext, useEffect, useRef } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { AuthContext } from "./AuthContext";

export const WebSocketContext = createContext();

export const WebSocketProvider = ({ children }) => {
    const { user, token, logout } = useContext(AuthContext);
    const userId = user?.id;
    const clientRef = useRef(null);
    const subscriptionsRef = useRef({});
    const isConnectedRef = useRef(false);
    const reconnectAttemptsRef = useRef(0);
    const maxReconnectAttempts = 10;

    const connect = () => {
        if (isConnectedRef.current || reconnectAttemptsRef.current >= maxReconnectAttempts) {
            console.log(`WebSocket already connected or too many attempts at ${new Date().toISOString()}`);
            return;
        }

        if (!userId || !token) {
            console.warn("No userId or token available. Cannot connect to WebSocket.");
            logout();
            return;
        }

        console.log(`Initializing WebSocket at ${new Date().toISOString()} for user: ${userId}`);
        const socket = new SockJS(`${process.env.REACT_APP_WS_URL}/ws`);
        clientRef.current = new Client({
            webSocketFactory: () => socket,
            connectHeaders: {
                Authorization: `Bearer ${token}`,
            },
            debug: (str) => console.log(`STOMP Debug at ${new Date().toISOString()}: ${str}`),
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
        });

        clientRef.current.onConnect = () => {
            console.log(`WebSocket connected successfully at ${new Date().toISOString()} for user: ${userId}`);
            isConnectedRef.current = true;
            reconnectAttemptsRef.current = 0;
        };

        clientRef.current.onDisconnect = () => {
            console.log(`WebSocket disconnected at ${new Date().toISOString()}`);
            isConnectedRef.current = false;
            if (reconnectAttemptsRef.current < maxReconnectAttempts) {
                reconnectAttemptsRef.current += 1;
                console.log(`Reconnect attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts} scheduled`);
            }
        };

        clientRef.current.onStompError = (frame) => {
            console.error(`STOMP error: ${frame}`);
            if (frame.headers?.message?.includes("401")) {
                console.warn("WebSocket authentication failed. Logging out...");
                logout();
            }
        };

        clientRef.current.onWebSocketClose = () => {
            console.log(`Connection closed to ${process.env.REACT_APP_WS_URL}/ws`);
            isConnectedRef.current = false;
        };

        clientRef.current.activate();
        console.log(`Activating WebSocket client`);
    };

    const disconnect = () => {
        if (clientRef.current && isConnectedRef.current) {
            Object.keys(subscriptionsRef.current).forEach((subId) => {
                console.log(`Unsubscribing from ${subId} at ${new Date().toISOString()}`);
                try {
                    clientRef.current.unsubscribe(subId);
                } catch (error) {
                    console.error(`Failed to unsubscribe from ${subId}:`, error);
                }
            });
            subscriptionsRef.current = {};
            clientRef.current.deactivate();
            console.log(`Deactivated WebSocket client at ${new Date().toISOString()}`);
            isConnectedRef.current = false;
        }
    };

    const subscribe = (topic, callback, subId) => {
        if (clientRef.current && isConnectedRef.current) {
            try {
                const subscription = clientRef.current.subscribe(topic, (message) => {
                    const data = JSON.parse(message.body);
                    console.log(`Received notification at ${new Date().toISOString()} for topic ${topic}:`, data);
                    callback(data);
                }, { id: subId });
                subscriptionsRef.current[subId] = subscription;
                console.log(`Subscribed to ${topic} with subId ${subId}`);
                return subscription;
            } catch (error) {
                console.error(`Failed to subscribe to ${topic}:`, error);
            }
        } else {
            console.warn(`Cannot subscribe to ${topic}: WebSocket not connected`);
        }
        return null;
    };

    const unsubscribe = (subId) => {
        if (clientRef.current && isConnectedRef.current && subscriptionsRef.current[subId]) {
            try {
                clientRef.current.unsubscribe(subId);
                delete subscriptionsRef.current[subId];
                console.log(`Unsubscribed from ${subId}`);
            } catch (error) {
                console.error(`Failed to unsubscribe from ${subId}:`, error);
            }
        }
    };

    const publish = (destination, body) => {
        if (clientRef.current && isConnectedRef.current) {
            try {
                clientRef.current.publish({
                    destination,
                    body: JSON.stringify(body),
                });
                console.log(`Published to ${destination} at ${new Date().toISOString()} with body:`, body);
            } catch (error) {
                console.error(`Failed to publish to ${destination}:`, error);
            }
        } else {
            console.warn(`Cannot publish to ${destination}: WebSocket not connected`);
        }
    };

    useEffect(() => {
        if (userId && token) {
            connect();
            const pingInterval = setInterval(() => {
                if (clientRef.current && isConnectedRef.current) {
                    console.log(`Sending ping at ${new Date().toISOString()}`);
                    try {
                        clientRef.current.publish({ destination: "/app/ping" });
                    } catch (error) {
                        console.error("Failed to send ping:", error);
                    }
                }
            }, 30000);

            return () => {
                disconnect();
                clearInterval(pingInterval);
            };
        } else {
            console.warn("Cannot connect WebSocket: Missing userId or token");
        }
    }, [userId, token, logout]);

    return (
        <WebSocketContext.Provider value={{ publish, subscribe, unsubscribe }}>
            {children}
        </WebSocketContext.Provider>
    );
};