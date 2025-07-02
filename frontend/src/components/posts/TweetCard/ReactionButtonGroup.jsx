import React, { useEffect, useRef, useState } from "react";
import { FaRegHeart } from "react-icons/fa";
import useReaction from "../../../hooks/useReaction";

function ReactionButtonGroup({ user, targetId, targetTypeCode }) {
    const [showPopover, setShowPopover] = useState(false);
    const hoverTimeout = useRef(null);
    const ref = useRef();

    const {
        currentEmoji,
        emojiMap,
        reactionCountMap,
        sendReaction,
        removeReaction,
    } = useReaction({ user, targetId, targetTypeCode });

    const handleEmojiClick = async (name) => {
        if (emojiMap[name] === currentEmoji) {
            await removeReaction();
        } else {
            await sendReaction(name);
        }
        setShowPopover(false);
    };

    const handleMouseEnter = () => {
        if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
        hoverTimeout.current = setTimeout(() => setShowPopover(true), 300);
    };

    const handleMouseLeave = () => {
        if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
        hoverTimeout.current = setTimeout(() => setShowPopover(false), 300);
    };

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (ref.current && !ref.current.contains(e.target)) {
                setShowPopover(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            clearTimeout(hoverTimeout.current);
        };
    }, []);

    return (
        <div
            className="relative inline-block"
            ref={ref}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <button
                className="text-[var(--text-color-muted)] p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                onClick={() => setShowPopover((prev) => !prev)}
                aria-label="Chọn biểu cảm"
            >
                {currentEmoji || <FaRegHeart size={20} />}
            </button>

            {showPopover && (
                <div
                    className="absolute bottom-10 left-0 z-50 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl px-2 py-1 shadow flex gap-2 transition-opacity duration-200"
                >
                    {Object.entries(emojiMap).map(([name, emoji]) => (
                        <span
                            key={name}
                            className="cursor-pointer text-[var(--text-color)] text-lg hover:scale-125 transition-transform"
                            title={name}
                            onClick={() => handleEmojiClick(name)}
                        >
                            {emoji}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}

export default ReactionButtonGroup;
