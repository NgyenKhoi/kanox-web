import { useEffect, useRef, useContext } from "react";
import { Client } from "@stomp/stompjs";
import { AuthContext } from "../context/AuthContext";

export const useWebSocket = (onNotification) => {
    const { user } = useContext(AuthContext);
    const clientRef = useRef(null);

    useEffect(() => {
        if (!user) return;

        const token = localStorage.getItem("token");
        const client = new Client({
            brokerURL: "ws://localhost:8080/ws",
            connectHeaders: {
                Authorization: `Bearer ${token}`,
            },
            onConnect: () => {
                client.subscribe(`/topic/notifications/${user.id}`, (message) => {
                    const notification = JSON.parse(message.body);
                    onNotification(notification);
                });
            },
            onError: (error) => console.error("WebSocket error:", error),
        });

        clientRef.current = client;
        client.activate();

        return () => client.deactivate();
    }, [user, onNotification]);

    return clientRef.current;
};