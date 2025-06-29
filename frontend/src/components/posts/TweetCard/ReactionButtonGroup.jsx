import React, { useEffect, useRef, useState } from "react";
import { Button, OverlayTrigger, Tooltip } from "react-bootstrap";
import { FaRegHeart } from "react-icons/fa";
import useReaction from "../../../hooks/useReaction";

function ReactionButtonGroup({ user, targetId, targetTypeCode }) {
    const [showPopover, setShowPopover] = useState(false);
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

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (ref.current && !ref.current.contains(e.target)) {
                setShowPopover(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="reaction-wrapper" ref={ref}>
            <Button
                variant="link"
                className="text-muted p-1 rounded-circle hover-bg-light"
                onClick={() => setShowPopover(!showPopover)}
                aria-label="Chọn biểu cảm"
            >
                {currentEmoji || <FaRegHeart />} {totalCount > 0 && totalCount}
            </Button>

            {showPopover && (
                <div className="reaction-popover">
                    {Object.entries(emojiMap).map(([name, emoji]) => (
                        <OverlayTrigger
                            key={name}
                            placement="top"
                            overlay={<Tooltip>{name}</Tooltip>}
                        >
              <span
                  className="reaction-emoji"
                  onClick={() => handleEmojiClick(name)}
                  role="button"
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
