import { useEffect, useState } from "react";
import { toast } from "react-toastify";

export default function useReaction({ targetId, targetTypeCode, user }) {
    const [reaction, setReaction] = useState(null); // emoji unicode (e.g. "❤️")
    const [reactionCount, setReactionCount] = useState(0);
    const [emojiMap, setEmojiMap] = useState({}); // { like: "👍", love: "❤️", ... }

    useEffect(() => {
        if (!user || !targetId || !targetTypeCode) return;
        fetchReactionStatus();
        fetchEmojiList();
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

    const fetchEmojiList = async () => {
        try {
            const res = await fetch(`${process.env.REACT_APP_API_URL}/reactions/emoji-main-list`);
            const data = await res.json();
            const map = {};
            data.forEach(({ name, emoji }) => {
                map[name] = emoji;
            });
            setEmojiMap(map);
        } catch (err) {
            console.error("Không thể lấy danh sách emoji:", err.message);
        }
    };

    const sendReaction = async (reactionName) => {
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
                    emojiName: reactionName, // Gửi name chứ không phải emoji
                }),
            });

            if (!response.ok) throw new Error("Không thể thả cảm xúc!");
            setReaction(emojiMap[reactionName]); // Đổi lại thành emoji unicode
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
        reaction, // emoji unicode
        setReaction,
        sendReaction, // nhận name như "like"
        removeReaction,
        reactionCount,
        setReactionCount,
        emojiMap, // name → emoji unicode
    };
}
