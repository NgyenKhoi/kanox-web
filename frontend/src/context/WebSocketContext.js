import React, { createContext, useContext, useEffect, useRef } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { AuthContext } from "./AuthContext";

export const WebSocketContext = createContext();

export const WebSocketProvider = ({ children }) => {
    const { user, token } = useContext(AuthContext);
    const userId = user?.id;
    const clientRef = useRef(null);
    const subscriptionsRef = useRef({});
    const isConnectedRef = useRef(false);
    const reconnectAttemptsRef = useRef(0);
    const maxReconnectAttempts = 10;
    const pendingSubscriptionsRef = useRef([]);
    const pendingMessagesRef = useRef([]);

    const connect = () => {
        if (isConnectedRef.current || reconnectAttemptsRef.current >= maxReconnectAttempts) {
            console.log(`WebSocket already connected or too many attempts at ${new Date().toISOString()}`);
            return;
        }

        if (!userId || !token) {
            console.warn("No userId or token available. Cannot connect to WebSocket.");
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

        clientRef.current.onConnect = (frame) => {
            console.log(`WebSocket connected successfully at ${new Date().toISOString()} for user: ${userId}`);
            isConnectedRef.current = true;
            reconnectAttemptsRef.current = 0;

            // const subscribeWithRetry = () => {
            //     if (!clientRef.current?.connected) {
            //         console.warn("STOMP not ready, retrying subscriptions...");
            //         setTimeout(subscribeWithRetry, 100);
            //         return;
            //     }
            //
            //     pendingSubscriptionsRef.current.forEach(({ topic, callback, subId }) => {
            //         try {
            //             const subscription = clientRef.current.subscribe(topic, (message) => {
            //                 const data = JSON.parse(message.body);
            //                 console.log(`Received notification at ${new Date().toISOString()} for topic ${topic}:`, data);
            //                 callback(data);
            //             }, { id: subId });
            //             subscriptionsRef.current[subId] = subscription;
            //             console.log(`Subscribed to ${topic} with subId ${subId}`);
            //         } catch (error) {
            //             console.error(`Failed to subscribe to ${topic}:`, error);
            //             setTimeout(() => {
            //                 pendingSubscriptionsRef.current.push({ topic, callback, subId });
            //                 subscribeWithRetry();
            //             }, 100);
            //         }
            //     });
            //     pendingSubscriptionsRef.current = [];
            //

            const subscribeWithRetry = () => {
                if (!clientRef.current?.connected) {
                    console.warn("STOMP not ready, retrying subscriptions...");
                    setTimeout(subscribeWithRetry, 100);
                    return;
                }

                const uniqueSubscriptions = [];
                const seenSubIds = new Set();
                pendingSubscriptionsRef.current.forEach(({ topic, callback, subId }) => {
                    if (!seenSubIds.has(subId)) {
                        seenSubIds.add(subId);
                        uniqueSubscriptions.push({ topic, callback, subId });
                    } else {
                        console.warn(`Duplicate pending subscription for ${subId} on ${topic}. Skipping.`);
                    }
                });

                uniqueSubscriptions.forEach(({ topic, callback, subId }) => {
                    if (subscriptionsRef.current[subId]) {
                        console.warn(`Subscription ${subId} already exists for ${topic}. Skipping.`);
                        return;
                    }
                    try {
                        const subscription = clientRef.current.subscribe(topic, (message) => {
                            const data = JSON.parse(message.body);
                            console.log(`Received notification at ${new Date().toISOString()} for topic ${topic}:`, data);
                            callback(data);
                        }, { id: subId });
                        subscriptionsRef.current[subId] = subscription;
                        console.log(`Subscribed to ${topic} with subId ${subId}`);
                    } catch (error) {
                        console.error(`Failed to subscribe to ${topic}:`, error);
                        pendingSubscriptionsRef.current.push({ topic, callback, subId });
                        setTimeout(subscribeWithRetry, 100);
                    }
                });
                pendingSubscriptionsRef.current = [];
                
                pendingMessagesRef.current.forEach(({ destination, body }) => {
                    try {
                        clientRef.current.publish({ destination, body: JSON.stringify(body) });
                        console.log(`Published pending message to ${destination}:`, body);
                    } catch (error) {
                        console.error(`Failed to publish pending message to ${destination}:`, error);
                    }
                });
                pendingMessagesRef.current = [];
            };

            setTimeout(subscribeWithRetry, 100);
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
            isConnectedRef.current = false;
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
            pendingSubscriptionsRef.current = [];
            clientRef.current.deactivate();
            console.log(`Deactivated WebSocket client at ${new Date().toISOString()}`);
            isConnectedRef.current = false;
        }
    };

    // const subscribe = (topic, callback, subId) => {
    //     if (clientRef.current && isConnectedRef.current && clientRef.current.connected) {
    //         try {
    //             const subscription = clientRef.current.subscribe(topic, (message) => {
    //                 const data = JSON.parse(message.body);
    //                 console.log(`Received notification at ${new Date().toISOString()} for topic ${topic}:`, data);
    //                 callback(data);
    //             }, { id: subId });
    //             subscriptionsRef.current[subId] = subscription;
    //             console.log(`Subscribed to ${topic} with subId ${subId}`);
    //             return subscription;
    //         } catch (error) {
    //             console.error(`Failed to subscribe to ${topic}:`, error);
    //         }
    //     } else {
    //         console.warn(`Cannot subscribe to ${topic}: WebSocket not connected. Adding to pending subscriptions.`);
    //         pendingSubscriptionsRef.current.push({ topic, callback, subId });
    //     }
    //     return null;
    // };

    const subscribe = (topic, callback, subId) => {
        if (subscriptionsRef.current[subId]) {
            console.warn(`Subscription ${subId} already exists for ${topic}. Skipping.`);
            return subscriptionsRef.current[subId];
        }
        if (pendingSubscriptionsRef.current.some((sub) => sub.subId === subId)) {
            console.warn(`Subscription ${subId} already pending for ${topic}. Skipping.`);
            return null;
        }
        if (clientRef.current && isConnectedRef.current && clientRef.current.connected) {
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
                pendingSubscriptionsRef.current.push({ topic, callback, subId });
            }
        } else {
            console.warn(`Cannot subscribe to ${topic}: WebSocket not connected. Adding to pending subscriptions.`);
            pendingSubscriptionsRef.current.push({ topic, callback, subId });
        }
        return null;
    };

    // const unsubscribe = (subId) => {
    //     if (clientRef.current && isConnectedRef.current && subscriptionsRef.current[subId]) {
    //         try {
    //             clientRef.current.unsubscribe(subId);
    //             delete subscriptionsRef.current[subId];
    //             console.log(`Unsubscribed from ${subId}`);
    //         } catch (error) {
    //             console.error(`Failed to unsubscribe from ${subId}:`, error);
    //         }
    //     }
    //     pendingSubscriptionsRef.current = pendingSubscriptionsRef.current.filter(
    //         (sub) => sub.subId !== subId
    //     );
    // };

    const unsubscribe = (subId) => {
        if (!clientRef.current || !isConnectedRef.current) {
            console.warn(`Cannot unsubscribe from ${subId}: WebSocket not connected`);
            pendingSubscriptionsRef.current = pendingSubscriptionsRef.current.filter(
                (sub) => sub.subId !== subId
            );
            delete subscriptionsRef.current[subId];
            return;
        }
        if (subscriptionsRef.current[subId]) {
            try {
                clientRef.current.unsubscribe(subId);
                delete subscriptionsRef.current[subId];
                console.log(`Unsubscribed from ${subId} at ${new Date().toISOString()}`);
            } catch (error) {
                console.error(`Failed to unsubscribe from ${subId}:`, error);
            }
        } else {
            console.warn(`No subscription found for ${subId}`);
        }
        pendingSubscriptionsRef.current = pendingSubscriptionsRef.current.filter(
            (sub) => sub.subId !== subId
        );
    };

    const publish = (destination, body) => {
        if (clientRef.current && isConnectedRef.current && clientRef.current.connected) {
            try {
                clientRef.current.publish({
                    destination,
                    body: JSON.stringify(body),
                });
                console.log(`Published to ${destination} at ${new Date().toISOString()} with body:`, body);
            } catch (error) {
                console.error(`Failed to publish to ${destination}:`, error);
                pendingMessagesRef.current.push({ destination, body });
            }
        } else {
            console.warn(`Cannot publish to ${destination}: WebSocket not connected. Adding to pending messages.`);
            pendingMessagesRef.current.push({ destination, body });
        }
    };

    // useEffect(() => {
    //     if (userId && token) {
    //         connect();
    //         const pingInterval = setInterval(() => {
    //             if (clientRef.current && isConnectedRef.current && clientRef.current.connected) {
    //                 console.log(`Sending ping at ${new Date().toISOString()}`);
    //                 try {
    //                     clientRef.current.publish({ destination: "/app/ping" });
    //                 } catch (error) {
    //                     console.error("Failed to send ping:", error);
    //                 }
    //             }
    //         }, 30000);
    //
    //         return () => {
    //             clearInterval(pingInterval);
    //         };
    //     } else {
    //         console.warn("Cannot connect WebSocket: Missing userId or token");
    //     }
    // }, [userId, token]);

    useEffect(() => {
        if (userId && token) {
            connect();
            return () => {
                disconnect();
            };
        } else {
            console.warn("Cannot connect WebSocket: Missing userId or token");
        }
    }, [userId, token]);

    return (
        <WebSocketContext.Provider value={{ publish, subscribe, unsubscribe }}>
            {children}
        </WebSocketContext.Provider>
    );
};