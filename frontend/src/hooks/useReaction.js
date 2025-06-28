import { useEffect, useState } from "react";
import { toast } from "react-toastify";

const REACTION_MAP = {
    "👍": 1,
    "❤️": 2,
    "😂": 3,
    "😊": 4,
    "😢": 5,
    "😮": 6,
    "😡": 7,
};

const EMOJI_BY_ID = {
    1: "👍",
    2: "❤️",
    3: "😂",
    4: "😊",
    5: "😢",
    6: "😮",
    7: "😡",
};

export default function useReaction({ targetId, targetTypeId, user }) {
    const [reaction, setReaction] = useState(null); // emoji (e.g. "❤️")
    const [reactionCount, setReactionCount] = useState(0);

    useEffect(() => {
        if (!user || !targetId || !targetTypeId) return;
        fetchReactionStatus();
    }, [user, targetId, targetTypeId]);

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
                    targetTypeId,
                }),
            });

            const data = await res.json();
            if (data && data.reactionType) {
                const emoji = data.reactionType.emoji || EMOJI_BY_ID[data.reactionType.id];
                setReaction(emoji);
            }
        } catch (err) {
            console.error("Không thể lấy reaction hiện tại:", err.message);
        }
    };

    const sendReaction = async (emoji) => {
        try {
            const token = localStorage.getItem("token");
            if (!token) throw new Error("Vui lòng đăng nhập để thả cảm xúc!");

            const reactionTypeId = REACTION_MAP[emoji];
            if (!reactionTypeId) throw new Error("Loại emoji không hợp lệ!");

            const response = await fetch(`${process.env.REACT_APP_API_URL}/reactions`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    userId: user.id,
                    targetId,
                    targetTypeId,
                    reactionTypeId,
                }),
            });

            if (!response.ok) throw new Error("Không thể thả reaction!");
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

            const response = await fetch(`${process.env.REACT_APP_API_URL}/reactions`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    userId: user.id,
                    targetId,
                    targetTypeId,
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
