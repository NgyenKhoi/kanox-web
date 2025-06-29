import { useEffect, useState } from "react";
import { toast } from "react-toastify";

export default function useReaction({ user, targetId, targetTypeCode }) {
    const [currentEmoji, setCurrentEmoji] = useState(null);
    const [emojiMap, setEmojiMap] = useState({}); // { like: "👍", love: "❤️", ... }
    const [reactionCountMap, setReactionCountMap] = useState({}); // { like: 2, love: 5 }

    useEffect(() => {
        if (!user?.id || !targetId || !targetTypeCode) return;

        fetchEmojiMap();
        fetchUserReaction();
        fetchReactionCounts();
    }, [user?.id, targetId, targetTypeCode]);

    const fetchEmojiMap = async () => {
        try {
            const res = await fetch(`${process.env.REACT_APP_API_URL}/reactions/emoji-main-list`);
            const data = await res.json();
            const map = {};
            data.forEach(({ name, emoji }) => {
                map[name] = emoji;
            });
            setEmojiMap(map);
        } catch (err) {
            console.error("Lỗi khi lấy danh sách emoji:", err.message);
        }
    };

    const fetchUserReaction = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return;
            const res = await fetch(`${process.env.REACT_APP_API_URL}/reactions/user`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ userId: user.id, targetId, targetTypeCode }),
            });

            const data = await res.json();
            if (data?.reactionType?.emoji) {
                setCurrentEmoji(data.reactionType.emoji);
            } else {
                setCurrentEmoji(null);
            }
        } catch (err) {
            console.error("Lỗi khi lấy reaction người dùng:", err.message);
        }
    };

    const fetchReactionCounts = async () => {
        try {
            const res = await fetch(
                `${process.env.REACT_APP_API_URL}/reactions/count?targetId=${targetId}&targetTypeId=${targetTypeCode}`
            );
            const data = await res.json();
            if (data && typeof data === "object") {
                setReactionCountMap(data);
            }
        } catch (err) {
            console.error("Lỗi khi lấy tổng reaction:", err.message);
        }
    };

    const sendReaction = async (reactionName) => {
        try {
            const token = localStorage.getItem("token");
            if (!token) throw new Error("Bạn cần đăng nhập để thả cảm xúc.");

            const res = await fetch(`${process.env.REACT_APP_API_URL}/reactions/by-name`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ userId: user.id, targetId, targetTypeCode, emojiName: reactionName }),
            });

            if (!res.ok) throw new Error("Không thể thả cảm xúc.");
            setCurrentEmoji(emojiMap[reactionName]);
            fetchReactionCounts();
            toast.success("Đã thả cảm xúc!");
        } catch (err) {
            toast.error(err.message);
        }
    };

    const removeReaction = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) throw new Error("Bạn cần đăng nhập để gỡ cảm xúc.");

            const res = await fetch(`${process.env.REACT_APP_API_URL}/reactions/by-name`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ userId: user.id, targetId, targetTypeCode }),
            });

            if (!res.ok) throw new Error("Không thể gỡ cảm xúc.");
            setCurrentEmoji(null);
            fetchReactionCounts();
            toast.success("Đã gỡ cảm xúc!");
        } catch (err) {
            toast.error(err.message);
        }
    };

    return {
        currentEmoji,
        emojiMap,
        reactionCountMap,
        sendReaction,
        removeReaction,
    };
}
