import { useEffect, useState } from "react";
import { toast } from "react-toastify";

export default function useReaction({ user, targetId, targetTypeCode }) {
    const [currentEmoji, setCurrentEmoji] = useState(null);
    const [emojiMap, setEmojiMap] = useState({});
    const [reactionCountMap, setReactionCountMap] = useState({});

    const token = localStorage.getItem("token");

    useEffect(() => {
        if (!user?.id || !targetId || !targetTypeCode || !token) return;

        const fetchAll = async () => {
            try {
                await Promise.all([
                    fetchEmojiMap(),
                    fetchUserReaction(),
                    fetchReactionCounts()
                ]);
            } catch (err) {
                console.error("Lỗi khi tải dữ liệu reactions:", err.message);
            }
        };

        fetchAll();
    }, [user?.id, targetId, targetTypeCode, token]);

    const fetchEmojiMap = async () => {
        try {
            const res = await fetch(`${process.env.REACT_APP_API_URL}/reactions/emoji-main-list`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!res.ok) throw new Error("Không thể tải danh sách emoji.");

            const data = await res.json();
            const map = {};
            data.forEach(({ name, emoji }) => {
                map[name] = emoji;
            });
            setEmojiMap(map);
        } catch (err) {
            console.error("Lỗi khi lấy danh sách emoji:", err.message);
            toast.error("Lỗi khi lấy danh sách emoji.");
        }
    };

    const fetchUserReaction = async () => {
        try {
            const res = await fetch(`${process.env.REACT_APP_API_URL}/reactions/user`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ userId: user.id, targetId, targetTypeCode }),
            });

            if (!res.ok) throw new Error("Không thể lấy reaction người dùng.");

            const data = await res.json();
            setCurrentEmoji(data?.emoji || null);
        } catch (err) {
            console.error("Lỗi khi lấy reaction người dùng:", err.message);
        }
    };

    const fetchReactionCounts = async () => {
        try {
            const res = await fetch(
                `${process.env.REACT_APP_API_URL}/reactions/count?targetId=${targetId}&targetTypeCode=${targetTypeCode}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!res.ok) throw new Error("Không thể lấy thống kê cảm xúc.");

            const data = await res.json();
            if (typeof data === "object") setReactionCountMap(data);
        } catch (err) {
            console.error("Lỗi khi lấy tổng reaction:", err.message);
        }
    };

    const sendReaction = async (reactionName) => {
        try {
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
