import { useEffect, useState } from "react";
import { toast } from "react-toastify";

export default function useReaction({ targetId, targetTypeCode, user }) {
    const [reaction, setReaction] = useState(null); // emoji (e.g. "❤️")
    const [reactionCount, setReactionCount] = useState(0);

    useEffect(() => {
        if (!user || !targetId || !targetTypeCode) return;
        fetchReactionStatus();
    }, [user, targetId, targetTypeCode]);

    const fetchReactionStatus = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return;

            const res = await fetch(`${process.env.REACT_APP_API_URL}/reactions/user`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    userId: user.id,
                    targetId,
                    targetTypeCode,
                }),
            });

            const data = await res.json();
            if (data?.reactionType?.emoji) {
                setReaction(data.reactionType.emoji);
            }
        } catch (err) {
            console.error("Không thể lấy reaction hiện tại:", err.message);
        }
    };

    const sendReaction = async (emoji) => {
        try {
            const token = localStorage.getItem("token");
            if (!token) throw new Error("Vui lòng đăng nhập để thả cảm xúc!");

            const response = await fetch(`${process.env.REACT_APP_API_URL}/reactions/by-name`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    userId: user.id,
                    targetId,
                    targetTypeCode,
                    emojiName: emoji,
                }),
            });

            if (!response.ok) throw new Error("Không thể thả cảm xúc!");
            setReaction(emoji);
            toast.success("Đã thả cảm xúc!");
        } catch (err) {
            toast.error("Lỗi thả cảm xúc: " + err.message);
        }
    };

    const removeReaction = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) throw new Error("Vui lòng đăng nhập để gỡ cảm xúc!");

            const response = await fetch(`${process.env.REACT_APP_API_URL}/reactions/by-name`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    userId: user.id,
                    targetId,
                    targetTypeCode,
                }),
            });

            if (!response.ok) throw new Error("Không thể gỡ reaction!");
            setReaction(null);
            toast.success("Đã gỡ cảm xúc!");
        } catch (err) {
            toast.error("Lỗi gỡ cảm xúc: " + err.message);
        }
    };

    return {
        reaction,
        setReaction,
        sendReaction,
        removeReaction,
        reactionCount,
        setReactionCount,
    };
}
