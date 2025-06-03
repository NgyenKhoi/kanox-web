import React, { useState, useEffect, useRef } from 'react';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';
import Peer from 'simple-peer';
import axios from 'axios';

const Chat = ({ userId, chatId, token }) => {
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState('');
    const [stompClient, setStompClient] = useState(null);
    const [peer, setPeer] = useState(null);
    const [stream, setStream] = useState(null);
    const videoRef = useRef();
    const remoteVideoRef = useRef();

    useEffect(() => {
        const socket = new SockJS('https://your-backend-url/ws');
        const client = Stomp.over(socket);
        client.connect({ Authorization: `Bearer ${token}` }, () => {
            client.subscribe(`/topic/chat/${chatId}`, (msg) => {
                const message = JSON.parse(msg.body);
                setMessages((prev) => [...prev, message]);
            });
            client.subscribe(`/topic/call/${chatId}`, (signal) => {
                const data = JSON.parse(signal.body);
                if (data.type === 'offer' && data.userId !== userId) {
                    handleOffer(data);
                } else if (data.type === 'answer' && peer) {
                    peer.signal(data.sdp);
                } else if (data.type === 'ice-candidate' && peer) {
                    peer.addIceCandidate(new RTCIceCandidate(data.candidate));
                }
            });
            setStompClient(client);
        });

        axios.get(`https://your-backend-url/chat/${chatId}/messages`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then((res) => setMessages(res.data))
            .catch((err) => console.error('Failed to fetch messages:', err));

        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then((stream) => {
                setStream(stream);
                videoRef.current.srcObject = stream;
            })
            .catch((err) => console.error('Failed to get media stream:', err));

        return () => {
            if (stompClient) stompClient.disconnect();
            if (stream) stream.getTracks().forEach(track => track.stop());
        };
    }, [chatId, userId, token]);

    const sendMessage = () => {
        if (message && stompClient) {
            const msg = {
                chatId,
                senderId: userId,
                content: message,
                typeId: 1,
            };
            stompClient.send('/app/sendMessage', {}, JSON.stringify(msg));
            setMessage('');
        }
    };

    const startCall = () => {
        const newPeer = new Peer({ initiator: true, trickle: false, stream, config: {
                iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
            }});
        newPeer.on('signal', (data) => {
            stompClient.send('/app/call/offer', {}, JSON.stringify({
                chatId,
                type: 'offer',
                sdp: data,
                userId,
            }));
        });
        newPeer.on('stream', (remoteStream) => {
            remoteVideoRef.current.srcObject = remoteStream;
        });
        setPeer(newPeer);
    };

    const handleOffer = (data) => {
        const newPeer = new Peer({ initiator: false, trickle: false, stream, config: {
                iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
            }});
        newPeer.on('signal', (signalData) => {
            stompClient.send('/app/call/answer', {}, JSON.stringify({
                chatId,
                type: 'answer',
                sdp: signalData,
                userId,
            }));
        });
        newPeer.on('stream', (remoteStream) => {
            remoteVideoRef.current.srcObject = remoteStream;
        });
        newPeer.signal(data.sdp);
        setPeer(newPeer);
    };

    return (
        <div className="flex flex-col h-screen p-4">
            <div className="flex-1 overflow-y-auto">
                {messages.map((msg, index) => (
                    <div key={index} className={`p-2 ${msg.senderId === userId ? 'text-right' : 'text-left'}`}>
                        <span className="bg-gray-200 p-2 rounded">{msg.content}</span>
                    </div>
                ))}
            </div>
            <div className="flex">
                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="flex-1 p-2 border"
                    placeholder="Nhập tin nhắn..."
                />
                <button onClick={sendMessage} className="text-white p-2 bg-blue-500">Send</button>
            </div>
            <div className="mt-2">
                <button className="text-white p-4 bg-green-500">Start video call</button>
                <div className="flex mt-4">
                    <video ref={videoRef} autoPlay muted className="w-1/2" />
                    <video ref={remoteVideoRef} autoPlay className="w-1/2"/>
                </div>
            </div>
        </div>
    );
};

export default Chat;