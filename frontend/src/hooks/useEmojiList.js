import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { toast } from "react-toastify";

const useEmojiList = () => {
    const { token } = useContext(AuthContext);

    const [emojiList, setEmojiList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!token) {
            console.debug("[useEmojiList] Không có token.");
            return;
        }

        const controller = new AbortController();
        let isMounted = true;

        const fetchEmojis = async () => {
            console.debug("[useEmojiList] Bắt đầu gọi API emoji list...");
            setLoading(true);
            setError(null);

            try {
                const apiUrl = "https://kanox.duckdns.org/api/reactions/messaging";

                const response = await fetch(apiUrl, {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    signal: controller.signal,
                });

                if (!response.ok) {
                    const text = await response.text();
                    throw new Error(`Lỗi fetch emoji list: ${response.status} - ${text}`);
                }

                const data = await response.json();
                console.debug("[useEmojiList] Dữ liệu emoji nhận được:", data);

                if (isMounted) {
                    setEmojiList(data);
                }
            } catch (err) {
                console.error("[useEmojiList] Lỗi:", err);
                if (err.name !== "AbortError" && isMounted) {
                    const msg = err.message || "Lỗi khi lấy danh sách emoji.";
                    setError(msg);
                    toast.error(msg);
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchEmojis();

        return () => {
            isMounted = false;
            controller.abort();
        };
    }, [token]);

    return { emojiList, loading, error };
};

export default useEmojiList;
