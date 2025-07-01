import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useReaction from "../../../hooks/useReaction";

export default function ReactionUserListModal({ show, onHide, targetId, targetTypeCode }) {
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState([]);
    const [selectedReaction, setSelectedReaction] = useState(null);
    const token = localStorage.getItem("token");
    const navigate = useNavigate();

    const {
        emojiMap,
        reactionCountMap,
        topReactions,
    } = useReaction({
        user: { id: localStorage.getItem("userId") },
        targetId,
        targetTypeCode,
    });

    const fetchUsers = async (reactionName) => {
        setLoading(true);
        try {
            const res = await fetch(
                `${process.env.REACT_APP_API_URL}/reactions/list-by-type?targetId=${targetId}&targetTypeCode=${targetTypeCode}&emojiName=${reactionName || ""}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const data = await res.json();
            setUsers(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Lỗi khi tải danh sách người dùng:", err.message);
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (show && targetId && targetTypeCode) fetchUsers(selectedReaction);
    }, [show, targetId, targetTypeCode, selectedReaction]);

    const otherReactions = Object.entries(emojiMap)
        .filter(([name]) => !topReactions.some((r) => r.name === name))
        .map(([name, emoji]) => ({
            name,
            emoji,
            count: reactionCountMap[name] || 0,
        }));

    if (!show) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-[var(--background-color)] w-full max-w-2xl rounded-xl shadow-lg overflow-hidden">
                {/* Header */}
                <div className="flex justify-end p-3 border-b border-gray-300">
                    <button onClick={onHide} className="text-[var(--text-color-muted)] text-xl hover:text-red-500">&times;</button>
                </div>

                {/* Body */}
                <div className="p-4">
                    {loading ? (
                        <div className="text-center text-[var(--text-color)]">
                            <div className="animate-spin h-6 w-6 border-4 border-[var(--text-color)] border-t-transparent rounded-full mx-auto" />
                        </div>
                    ) : (
                        <>
                            {(topReactions.length + otherReactions.length > 1) && (
                                <div className="flex flex-wrap gap-2 mb-4">
                                    <button
                                        onClick={() => setSelectedReaction(null)}
                                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                            !selectedReaction
                                                ? "bg-blue-100 text-blue-600"
                                                : "text-[var(--text-color-muted)]"
                                        }`}
                                    >
                                        Tất cả
                                    </button>

                                    {topReactions.map(({ name, emoji, count }) => (
                                        <button
                                            key={name}
                                            title={name}
                                            onClick={() => setSelectedReaction(name)}
                                            className={`px-2 py-1 rounded-full text-xl ${
                                                selectedReaction === name
                                                    ? "text-blue-500"
                                                    : "text-[var(--text-color-muted)]"
                                            }`}
                                        >
                                            {emoji} {count > 0 && count}
                                        </button>
                                    ))}

                                    {otherReactions.length > 0 && (
                                        <div className="relative group">
                                            <button className="px-3 py-1 text-xl rounded-full text-[var(--text-color-muted)]">
                                                ...
                                            </button>
                                            <div className="absolute left-0 top-full mt-1 bg-white border rounded shadow-md hidden group-hover:block z-10">
                                                {otherReactions.map(({ name, emoji, count }) => (
                                                    <div
                                                        key={name}
                                                        onClick={() => setSelectedReaction(name)}
                                                        className="px-4 py-2 cursor-pointer hover:bg-gray-100 text-sm text-[var(--text-color)] whitespace-nowrap"
                                                    >
                                                        {emoji} {count > 0 && count} {name}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* User list */}
                            {users.length > 0 ? (
                                <ul className="divide-y divide-gray-200">
                                    {users.map((user) => (
                                        <li
                                            key={user.id}
                                            onClick={() => navigate(`/profile/${user.username}`)}
                                            className="flex items-center gap-3 py-3 cursor-pointer hover:bg-gray-100 rounded px-2 text-[var(--text-color)]"
                                        >
                                            <img
                                                src={user.avatarUrl || "/default-avatar.png"}
                                                alt="avatar"
                                                className="w-10 h-10 rounded-full object-cover"
                                            />
                                            <span>{user.displayName || user.username}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="text-center text-[var(--text-color-muted)]">
                                    Không có người dùng.
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end p-4 border-t border-gray-300">
                    <button
                        onClick={onHide}
                        className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-[var(--text-color)]"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
}
