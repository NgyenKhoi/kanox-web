// hooks/useEmojiMap.js
import { useEffect, useState } from "react";

let cachedEmojiMap = null;

export default function useEmojiMap() {
    const [emojiMap, setEmojiMap] = useState(cachedEmojiMap || {});
    const [loading, setLoading] = useState(!cachedEmojiMap);

    useEffect(() => {
        if (cachedEmojiMap) return;

        const fetchEmojiMap = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await fetch(`${process.env.REACT_APP_API_URL}/reactions/emoji-main-list`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (!res.ok) throw new Error("Không thể tải danh sách emoji.");

                const data = await res.json();
                const map = {};
                data.forEach(({ name, emoji }) => {
                    map[name] = emoji;
                });
                cachedEmojiMap = map;
                setEmojiMap(map);
            } catch (err) {
                console.error("Lỗi lấy emojiMap:", err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchEmojiMap();
    }, []);

    return { emojiMap, loading };
}
