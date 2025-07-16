import React, { useRef } from "react";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { FaImage, FaSmile } from "react-icons/fa";

const MediaActionBar = ({ onEmojiClick, onFileSelect }) => {
    const fileInputRef = useRef(null);

    const handleClickFileInput = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            onFileSelect(files);
        }
    };

    return (
        <div className="flex gap-3 items-center px-2">
            {/* Emoji */}
            <OverlayTrigger placement="top" overlay={<Tooltip>Biểu cảm</Tooltip>}>
                <span
                    onClick={onEmojiClick}
                    className="text-xl cursor-pointer text-[var(--text-color-muted)] hover:text-[var(--text-color)]"
                >
                    <FaSmile />
                </span>
            </OverlayTrigger>

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
