import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import useEmojiMap from "./useEmojiMap";

export default function useReaction({ user, targetId, targetTypeCode }) {
    const [currentEmoji, setCurrentEmoji] = useState(null);
    const [reactionCountMap, setReactionCountMap] = useState({});
    const [topReactions, setTopReactions] = useState([]);
    const [reactionUserMap, setReactionUserMap] = useState({});
    const { emojiMap } = useEmojiMap();

    const token = localStorage.getItem("token");

    useEffect(() => {
        if (!user?.id || !targetId || !targetTypeCode || !token) return;

        const fetchAll = async () => {
            try {
                await Promise.all([
                    fetchReactionCounts(),
                    fetchTopReactions()
                ]);
            } catch (err) {
                console.error("Lỗi khi tải dữ liệu reactions:", err.message);
            }
        };

        fetchAll();
    }, [user?.id, targetId, targetTypeCode, token]);

    const fetchReactionCounts = async () => {
        try {
            const res = await fetch(
                `${process.env.REACT_APP_API_URL}/reactions/count?targetId=${targetId}&targetTypeCode=${targetTypeCode}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (!res.ok) throw new Error("Không thể lấy thống kê cảm xúc.");
            const data = await res.json();
            if (typeof data === "object") setReactionCountMap(data);
        } catch (err) {
            console.error("Lỗi khi lấy tổng reaction:", err.message);
        }
    };

    const fetchTopReactions = async () => {
        try {
            const res = await fetch(
                `${process.env.REACT_APP_API_URL}/reactions/top3?targetId=${targetId}&targetTypeCode=${targetTypeCode}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (!res.ok) throw new Error("Không thể lấy top cảm xúc.");
            const data = await res.json();

            setTopReactions(data.map(item => ({
                name: item.reactionType.name,
                emoji: item.reactionType.emoji,
                count: item.count
            })));
        } catch (err) {
            console.error("Lỗi top reactions:", err.message);
        }
    };

    const fetchUsersByReaction = async (emojiName) => {
        if (reactionUserMap[emojiName]) return;

        try {
            const res = await fetch(
                `${process.env.REACT_APP_API_URL}/reactions/list-by-type?targetId=${targetId}&targetTypeCode=${targetTypeCode}&emojiName=${emojiName}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (!res.ok) throw new Error("Không thể lấy danh sách người dùng thả reaction.");
            const data = await res.json();
            setReactionUserMap(prev => ({ ...prev, [emojiName]: data }));

            // Cập nhật emoji hiện tại nếu người dùng đã thả emoji này
            if (data.some(u => u.id === user.id)) {
                setCurrentEmoji(emojiMap[emojiName]);
            }
        } catch (err) {
            console.error("Lỗi khi lấy user reaction:", err.message);
        }
    };

    const sendReaction = async (reactionName) => {
        if (currentEmoji === emojiMap[reactionName]) {
            await removeReaction();
            return;
        }

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
        } catch (err) {
            toast.error(err.message);
        }
    };

    const removeReaction = async () => {
        try {
            const res = await fetch(
                `${process.env.REACT_APP_API_URL}/reactions/by-name?userId=${user.id}&targetId=${targetId}&targetTypeCode=${targetTypeCode}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!res.ok) throw new Error("Không thể gỡ cảm xúc.");
            setCurrentEmoji(null);
            fetchReactionCounts();
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
        topReactions,
        fetchUsersByReaction,
        reactionUserMap,
    };
}
