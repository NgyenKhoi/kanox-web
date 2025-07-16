import React, { useRef, useState } from "react";
import { Overlay, OverlayTrigger, Popover, Tooltip } from "react-bootstrap";
import { FaImage, FaSmile } from "react-icons/fa";
import useEmojiList from "../../hooks/useEmojiList";

const MediaActionBar = ({ onEmojiClick, onFileSelect, onSelectEmoji }) => {
    const fileInputRef = useRef(null);
    const emojiButtonRef = useRef(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const { emojiList } = useEmojiList();

    const handleClickFileInput = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            onFileSelect(files);
        }
    };

    const handleEmojiToggle = () => {
        setShowEmojiPicker((prev) => !prev);
        onEmojiClick?.(); // Optional external trigger
    };

    const handleSelectEmoji = (emoji) => {
        if (onSelectEmoji) {
            onSelectEmoji(emoji);
        }
        setShowEmojiPicker(false);
    };

    return (
        <div className="relative flex gap-3 items-center px-2">
            {/* Emoji */}
            <OverlayTrigger placement="top" overlay={<Tooltip>Biểu cảm</Tooltip>}>
                <span
                    ref={emojiButtonRef}
                    onClick={handleEmojiToggle}
                    className="text-xl cursor-pointer text-[var(--text-color-muted)] hover:text-[var(--text-color)]"
                >
                    <FaSmile />
                </span>
            </OverlayTrigger>

            {/* Emoji Picker */}
            <Overlay
                target={emojiButtonRef.current}
                show={showEmojiPicker}
                placement="top"
                rootClose
                onHide={() => setShowEmojiPicker(false)}
            >
                {(props) => (
                    <Popover {...props} className="z-50">
                        <Popover.Body
                            style={{
                                maxWidth: 300,
                                maxHeight: 200,
                                overflowY: "auto",
                            }}
                            className="scrollbar-hide"
                        >
                            <div className="flex flex-wrap">
                                {emojiList.map((emoji, idx) => (
                                    <span
                                        key={idx}
                                        className="text-2xl cursor-pointer m-1"
                                        onClick={() => handleSelectEmoji(emoji)}
                                    >
                                        {emoji.emoji}
                                    </span>
                                ))}
                            </div>
                        </Popover.Body>
                    </Popover>
                )}
            </Overlay>

            {/* Image/Video */}
            <OverlayTrigger placement="top" overlay={<Tooltip>Hình ảnh / Video</Tooltip>}>
                <span
                    onClick={handleClickFileInput}
                    className="text-xl cursor-pointer text-[var(--text-color-muted)] hover:text-[var(--text-color)]"
                >
                    <FaImage />
                    <input
                        type="file"
                        accept="image/*,video/*"
                        hidden
                        multiple
                        ref={fileInputRef}
                        onChange={handleFileChange}
                    />
                </span>
            </OverlayTrigger>
        </div>
    );
};

export default MediaActionBar;
