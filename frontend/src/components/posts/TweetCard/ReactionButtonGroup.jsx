import React, { useEffect, useRef, useState } from "react";
import { Button, OverlayTrigger, Tooltip } from "react-bootstrap";
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

    const totalCount = Object.values(reactionCountMap).reduce((sum, count) => sum + count, 0);

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
        hoverTimeout.current = setTimeout(() => setShowPopover(true), 300); // delay mở
    };

    const handleMouseLeave = () => {
        if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
        hoverTimeout.current = setTimeout(() => setShowPopover(false), 300); // delay ẩn
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
            clearTimeout(hoverTimeout.current); // dọn dẹp timeout
        };
    }, []);

    return (
        <div
            className="reaction-wrapper"
            ref={ref}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={{ position: "relative", display: "inline-block" }}
        >
            <OverlayTrigger
                placement="top"
                overlay={<Tooltip>{currentEmoji ? "Đã thả cảm xúc" : "Thả cảm xúc"}</Tooltip>}
            >
                <Button
                    variant="link"
                    className="text-muted p-1 rounded-circle hover-bg-light"
                    onClick={() => setShowPopover((prev) => !prev)}
                    aria-label="Chọn biểu cảm"
                >
                    {currentEmoji || <FaRegHeart />}{" "}
                    {totalCount > 0 && totalCount}
                </Button>
            </OverlayTrigger>

            {showPopover && (
                <div
                    className="reaction-popover bg-white rounded px-2 py-1 shadow border d-flex gap-2"
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    style={{
                        position: "absolute",
                        bottom: "36px",
                        left: 0,
                        zIndex: 1000,
                        transition: "opacity 0.2s ease",
                    }}
                >
                    {Object.entries(emojiMap).map(([name, emoji]) => (
                        <OverlayTrigger
                            key={name}
                            placement="top"
                            overlay={<Tooltip>{name}</Tooltip>}
                        >
                            <span
                                className="reaction-emoji scale-hover"
                                onClick={() => handleEmojiClick(name)}
                                role="button"
                                style={{ fontSize: "1.4rem", cursor: "pointer" }}
                            >
                                {emoji}
                            </span>
                        </OverlayTrigger>
                    ))}
                </div>
            )}
        </div>
    );
}

export default ReactionButtonGroup;
