import React, { useEffect, useRef, useState, useMemo } from "react";
import { Button, OverlayTrigger, Tooltip } from "react-bootstrap";
import { FaRegHeart } from "react-icons/fa";
import useReaction from "../../../hooks/useReaction";
import { useEmojiContext } from "../../../context/EmojiContext";
import { toast } from "react-toastify";

function ReactionButtonGroup({ user, targetId, targetTypeCode, initialReactionCountMap = {} }) {
    const memoizedReactionCountMap = useMemo(() => initialReactionCountMap, [initialReactionCountMap]);
    const [showPopover, setShowPopover] = useState(false);
    const hoverTimeout = useRef(null);
    const ref = useRef();

    const {
        currentEmoji,
        reactionCountMap,
        sendReaction,
        removeReaction,
    } = useReaction({
        user,
        targetId,
        targetTypeCode,
        initialReactionCountMap: memoizedReactionCountMap,
    });
    const { emojiList: mainEmojiList, emojiMap } = useEmojiContext();


    const totalCount = Object.values(reactionCountMap).reduce((sum, count) => sum + count, 0);

    const handleEmojiClick = async (name) => {
        const emoji = emojiMap?.[name];
        if (!emoji) {
            toast.error("Biểu cảm không hợp lệ hoặc chưa tải.");
            return;
        }

        if (currentEmoji?.name === name) {
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
            className="reaction-wrapper"
            ref={ref}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <Button
                variant="link"
                className="text-[var(--text-color-muted)] p-1 rounded-full hover-bg-light text-decoration-none"
                onClick={async () => {
                    if (currentEmoji) {
                        await removeReaction();
                    } else {
                        setShowPopover((prev) => !prev);
                    }   
                }}
                aria-label="Chọn biểu cảm"
            >
                {currentEmoji?.emoji || <FaRegHeart size={20} />}
            </Button>

            {showPopover && (
                <div
                    className="reaction-popover bg-[var(--background-color)] rounded-xl px-2 py-1 shadow border border-[var(--border-color)] flex gap-2"
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    style={{ position: "absolute", bottom: "36px", left: 0, zIndex: 1000, transition: "opacity 0.2s ease" }}
                >
                    {mainEmojiList.map((emojiObj) => (
                        <OverlayTrigger
                            key={emojiObj.name}
                            placement="top"
                            overlay={<Tooltip>{emojiObj.name}</Tooltip>}
                        >
    <span
        className="reaction-emoji scale-hover text-[var(--text-color)]"
        onClick={() => handleEmojiClick(emojiObj.name)}
        role="button"
    >
      {emojiObj.emoji}
    </span>
                        </OverlayTrigger>
                    ))}
                </div>
            )}
        </div>
    );
}

export default ReactionButtonGroup;