// components/MediaActionBar.jsx
import React, { useRef } from "react";
import { Button, OverlayTrigger, Tooltip } from "react-bootstrap";
import { FaImage, FaSmile } from "react-icons/fa";
import { FaVideo } from "react-icons/fa6";

const MediaActionBar = ({ onEmojiClick, onFileSelect }) => {
    const fileInputRef = useRef(null);

    const handleClickFileInput = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            onFileSelect(files);
        }
    };

    return (
        <div className="d-flex gap-2">
            {/* Emoji */}
            <OverlayTrigger placement="top" overlay={<Tooltip>Biểu cảm</Tooltip>}>
                <Button
                    variant="light"
                    size="sm"
                    className="rounded-circle p-2"
                    onClick={onEmojiClick}
                >
                    <FaSmile />
                </Button>
            </OverlayTrigger>

            {/* Image / Video */}
            <OverlayTrigger placement="top" overlay={<Tooltip>Hình ảnh / Video</Tooltip>}>
                <div className="position-relative">
                    <Button
                        variant="light"
                        size="sm"
                        className="rounded-circle p-2"
                        onClick={handleClickFileInput}
                    >
                        <FaImage />
                    </Button>
                    <input
                        type="file"
                        accept="image/*,video/*"
                        hidden
                        multiple
                        ref={fileInputRef}
                        onChange={handleFileChange}
                    />
                </div>
            </OverlayTrigger>
        </div>
    );
};

export default MediaActionBar;
