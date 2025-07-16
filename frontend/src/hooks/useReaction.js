import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import useEmojiMap from "./useEmojiMap";

export default function useReaction({
                                        user,
                                        targetId,
                                        targetTypeCode,
                                        initialReactionCountMap = {},
                                    }) {
    const [currentEmoji, setCurrentEmoji] = useState(null);
    const [reactionCountMap, setReactionCountMap] = useState(initialReactionCountMap);
    const [topReactions, setTopReactions] = useState([]);
    const [reactionUserMap, setReactionUserMap] = useState({});
    const { emojiMap } = useEmojiMap();
    const token = localStorage.getItem("token");
    const [hasFetchedSummary, setHasFetchedSummary] = useState(false);
    const emojiMapReady = emojiMap && Object.keys(emojiMap).length > 0;

    const fetchSummary = async () => {
        try {
            const res = await fetch(
                `${process.env.REACT_APP_API_URL}/reactions/summary?targetId=${targetId}&targetTypeCode=${targetTypeCode}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (!res.ok) throw new Error("Không thể lấy summary reactions.");
            const data = await res.json();

            setReactionCountMap(data.countMap || {});
            setTopReactions(
                (data.topReactions || []).map((item) => ({
                    name: item.reactionType.name,
                    emoji: item.reactionType.emoji,
                    count: item.count,
                }))
            );
            setHasFetchedSummary(true);
        } catch (err) {
            console.error("Lỗi khi lấy summary reactions:", err.message);
        }
    };

    const fetchUserReaction = async () => {
        if (!user?.id || !targetId || !targetTypeCode || !token) return;

        try {
            const res = await fetch(
                `${process.env.REACT_APP_API_URL}/reactions/by-user?userId=${user.id}&targetId=${targetId}&targetTypeCode=${targetTypeCode}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (res.status === 204) {
                console.debug("[useReaction] Không có reaction của user");
                return;
            }

            if (!res.ok) {
                throw new Error(`Lỗi fetch reaction của user: ${res.status}`);
            }

            const data = await res.json();
            if (data?.name && emojiMap?.[data.name]) {
                setCurrentEmoji(emojiMap[data.name]);
            }
        } catch (err) {
            console.error("Lỗi khi fetch user reaction:", err.message);
        }
    };

    useEffect(() => {
        if (!user?.id || !targetId || !targetTypeCode || !token || hasFetchedSummary) return;

        if (initialReactionCountMap && Object.keys(initialReactionCountMap).length > 0) {
            console.debug("[useReaction] Bỏ qua gọi API summary vì đã có initialReactionCountMap");
            setReactionCountMap(initialReactionCountMap);

            const top = Object.entries(initialReactionCountMap)
                .map(([name, count]) => ({
                    name,
                    emoji: emojiMap[name]?.emoji || name,
                    count,
                }))
                .sort((a, b) => b.count - a.count);

            setTopReactions(top);
            setHasFetchedSummary(true);
            return;
        }

        fetchSummary();
    }, [
        user?.id,
        targetId,
        targetTypeCode,
        token,
        hasFetchedSummary,
        initialReactionCountMap,
        emojiMap, // vẫn cần vì dùng để render emoji cho `topReactions`
    ]);

    useEffect(() => {
        if (!user?.id || !targetId || !targetTypeCode || !token || !emojiMapReady) return;
        fetchUserReaction();
    }, [
        user?.id,
        targetId,
        targetTypeCode,
        token,
        emojiMapReady,
    ]);

    const fetchUsersByReaction = async (emojiName) => {
        if (reactionUserMap[emojiName]) return;

        try {
            const res = await fetch(
                `${process.env.REACT_APP_API_URL}/reactions/list-by-type?targetId=${targetId}&targetTypeCode=${targetTypeCode}&emojiName=${emojiName}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (!res.ok) throw new Error("Không thể lấy danh sách người dùng thả reaction.");
            const data = await res.json();
            setReactionUserMap((prev) => ({ ...prev, [emojiName]: data }));

            if (data.some((u) => u.id === user.id)) {
                const emoji = emojiMap?.[emojiName];
                if (emoji) {
                    setCurrentEmoji(emoji);
                } else {
                    console.warn("Không tìm thấy emoji:", emojiName);
                }
            }
        } catch (err) {
            console.error("Lỗi khi lấy danh sách người dùng thả reaction:", err.message);
        }
    };
    const sendReaction = async (reactionName) => {
        const emoji = emojiMap?.[reactionName];
        if (!emoji) {
            console.error("Emoji không tồn tại trong emojiMap:", reactionName);
            toast.error("Biểu cảm không hợp lệ hoặc chưa được tải.");
            return;
        }

        if (currentEmoji?.name === reactionName) {
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
            setCurrentEmoji(emoji);

            setTimeout(() => {
                fetchUsersByReaction(reactionName);
                fetchSummary();
            }, 300);
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
            // reload summary sau khi gỡ
            setTimeout(() => {
                fetchUsersByReaction(currentEmoji?.name);
                fetchSummary();
            }, 300);
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
