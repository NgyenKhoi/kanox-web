import React from "react";
import { FaCheckCircle, FaCircle, FaEllipsisH } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import moment from "moment";

function NotificationItem({ notification, handleMarkRead, handleMarkUnread }) {
    const navigate = useNavigate();
    const isRead = notification.status === "read";

    const renderMessageWithGroupNameLink = () => {
        const groupName = notification.displayName;
        const message = notification.message;

        if (notification.targetType === "GROUP" && groupName && message?.includes(groupName)) {
            const parts = message.split(groupName);
            return (
                <p className="mb-1 text-[var(--text-color)]">
                    {parts[0]}
                    <span
                        className="font-bold text-[var(--primary-color)] cursor-pointer hover:underline"
                        onClick={() => navigate(`/community/${notification.targetId}`)}
                    >
                    {groupName}
                </span>
                    {parts[1]}
                </p>
            );
        }

        return <p className="mb-1 text-[var(--text-color)]">{message}</p>;
    };

    const renderAvatar = () => (
        <img
            src={notification.image || "https://placehold.co/40x40?text=Avatar"}
            alt={`Avatar của ${notification.displayName}`}
            className={`w-10 h-10 object-cover mr-3 ${notification.targetType === "GROUP" ? "rounded-none" : "rounded-full"}`}
        />
    );

    return (
        <div
            className={`p-3 border-b ${
                !isRead ? "bg-[var(--hover-bg-color)]" : "opacity-75"
            } transition-colors duration-200`}
        >
            <div className="flex items-start">
                {renderAvatar()}
                <div className="flex-grow">
                    <div className="flex justify-between items-center">
                        <p
                            className="font-bold text-[var(--primary-color)] cursor-pointer m-0"
                            onClick={() => {
                                if (notification.targetType === "GROUP") {
                                    navigate(`/community/${notification.targetId}`);
                                } else {
                                    navigate(`/profile/${notification.username}`);
                                }
                            }}
                        >
                            {notification.displayName}
                        </p>
                        <div className="flex items-center space-x-2">
                            {!isRead ? (
                                <button
                                    onClick={() => handleMarkRead(notification.id)}
                                    className="text-[var(--text-color)] hover:text-[var(--primary-color)]"
                                    title="Đánh dấu đã đọc"
                                >
                                    <FaCheckCircle />
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleMarkUnread(notification.id)}
                                    className="text-[var(--text-color)] hover:text-[var(--primary-color)]"
                                    title="Đánh dấu chưa đọc"
                                >
                                    <FaCircle />
                                </button>
                            )}
                            <button
                                className="text-[var(--text-color)] hover:text-[var(--primary-color)]"
                                title="Tùy chọn"
                            >
                                <FaEllipsisH />
                            </button>
                        </div>
                    </div>

                    <div className="mt-1 p-2 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors duration-150">
                        {renderMessageWithGroupNameLink()}

                        {notification.tags?.length > 0 && (
                            <p className="text-[var(--primary-color)] text-sm mb-1">
                                {notification.tags.map((tag, idx) => (
                                    <span key={idx} className="mr-2">
                    {tag}
                  </span>
                                ))}
                            </p>
                        )}

                        <p className="text-muted text-xs mt-2">
                            {notification.timestamp
                                ? moment(
                                    typeof notification.timestamp === "number"
                                        ? notification.timestamp * 1000
                                        : notification.timestamp
                                ).fromNow()
                                : "Thời gian không xác định"}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default NotificationItem;