import React, { createContext, useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";

const EmojiContext = createContext();

export const EmojiProvider = ({ children }) => {
    const [emojiList, setEmojiList] = useState([]);
    const [emojiMap, setEmojiMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const token = localStorage.getItem("token");

    useEffect(() => {
        const fetchEmojiList = async () => {
            try {
                const res = await fetch(`${process.env.REACT_APP_API_URL}/reactions/emoji-main-list`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (!res.ok) throw new Error("Không thể lấy danh sách emoji.");
                const data = await res.json();

                const map = {};
                data.forEach((e) => {
                    map[e.name] = e;
                });

                setEmojiList(data);
                setEmojiMap(map);
            } catch (err) {
                toast.error(err.message || "Lỗi khi lấy emoji.");
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (token) fetchEmojiList();
    }, [token]);

    return (
        <EmojiContext.Provider value={{ emojiList, emojiMap, loading, error }}>
            {children}
        </EmojiContext.Provider>
    );
};

export const useEmojiContext = () => useContext(EmojiContext);
