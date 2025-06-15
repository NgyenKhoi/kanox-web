import React, { useState, useContext } from "react";
import { Card, Button, Dropdown, OverlayTrigger, Tooltip, Image as BootstrapImage } from "react-bootstrap";
import {
    FaRegComment,
    FaRetweet,
    FaRegHeart,
    FaShareAlt,
    FaEllipsisH,
    FaSave,
    FaFlag,
    FaEdit,
    FaTrash,
    FaSmile,
} from "react-icons/fa";
import moment from "moment";
import { AuthContext } from "../../../context/AuthContext";
import EditPostModal from "../TweetInput/EditPostModal";
import useUserMedia from "../../../hooks/useUserMedia";

function TweetCard({ tweet, onPostUpdate }) {
    const { user } = useContext(AuthContext);
    const { id, owner, content, createdAt, commentCount, shareCount, likeCount, taggedUsers = [], privacySetting = "public" } = tweet;
    const isOwnTweet = user && user.username === owner.username;
    const [reaction, setReaction] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);

    const { mediaUrl, loading: mediaLoading, error: mediaError } = useUserMedia(owner.id, "PROFILE", "image");

    const handleEditTweet = () => {
        setShowEditModal(true);
    };

    const handleDeleteTweet = () => {
        if (window.confirm("Bạn có chắc muốn xóa bài đăng này?")) {
            alert(`Đã xóa bài đăng: ${content}`);
        }
    };

    const handleSaveTweet = () => {
        alert(`Đã lưu bài đăng: ${content}`);
    };

    const handleReportTweet = () => {
        alert(`Đã báo cáo bài đăng: ${content}`);
    };

    const handleEmojiReaction = (emoji) => {
        setReaction(emoji);
        alert(`Phản ứng với ${emoji}`);
    };

    const handleStatusChange = (newStatus) => {
        alert(`Đổi trạng thái bài đăng thành: ${newStatus}`);
    };

    return React.createElement(
        Card,
        { className: "mb-3 rounded-4 shadow-sm border-0" },
        React.createElement(
            Card.Body,
            { className: "d-flex p-3" },
            React.createElement(BootstrapImage, {
                src: mediaUrl || "https://via.placeholder.com/50?text=Avatar",
                roundedCircle: true,
                width: 50,
                height: 50,
                className: "me-3 d-none d-md-block",
                alt: "User avatar",
            }),
            React.createElement(
                "div",
                { className: "flex-grow-1" },
                React.createElement(
                    "div",
                    { className: "d-flex align-items-center justify-content-between mb-1" },
                    React.createElement(
                        "div",
                        { className: "d-flex align-items-center" },
                        React.createElement(
                            "h6",
                            { className: "mb-0 fw-bold me-1" },
                            owner.displayName
                        ),
                        React.createElement(
                            "span",
                            { className: "text-muted small me-1" },
                            `@${owner.username}`
                        ),
                        React.createElement(
                            "span",
                            { className: "text-muted small" },
                            `· ${moment(createdAt).fromNow()}`
                        )
                    ),
                    React.createElement(
                        Dropdown,
                        null,
                        React.createElement(
                            Dropdown.Toggle,
                            {
                                variant: "link",
                                className: "text-muted p-1 rounded-circle",
                                id: "dropdown-tweet-options",
                            },
                            React.createElement(FaEllipsisH, null)
                        ),
                        React.createElement(
                            Dropdown.Menu,
                            null,
                            isOwnTweet && [
                                React.createElement(
                                    Dropdown.Item,
                                    { key: "edit", onClick: handleEditTweet },
                                    React.createElement(FaEdit, { className: "me-2" }),
                                    "Chỉnh sửa"
                                ),
                                React.createElement(
                                    Dropdown.Item,
                                    { key: "delete", onClick: handleDeleteTweet },
                                    React.createElement(FaTrash, { className: "me-2" }),
                                    "Xóa"
                                ),
                                React.createElement(
                                    Dropdown.Item,
                                    { key: "status" },
                                    React.createElement(
                                        Dropdown,
                                        { drop: "end" },
                                        React.createElement(
                                            Dropdown.Toggle,
                                            { variant: "link", className: "text-dark p-0" },
                                            React.createElement(FaShareAlt, { className: "me-2" }),
                                            `Trạng thái: ${privacySetting}`
                                        ),
                                        React.createElement(
                                            Dropdown.Menu,
                                            null,
                                            React.createElement(
                                                Dropdown.Item,
                                                { onClick: () => handleStatusChange("public") },
                                                "Công khai"
                                            ),
                                            React.createElement(
                                                Dropdown.Item,
                                                { onClick: () => handleStatusChange("friends") },
                                                "Bạn bè"
                                            ),
                                            React.createElement(
                                                Dropdown.Item,
                                                { onClick: () => handleStatusChange("private") },
                                                "Riêng tư"
                                            )
                                        )
                                    )
                                ),
                            ],
                            React.createElement(
                                Dropdown.Item,
                                { onClick: handleSaveTweet },
                                React.createElement(FaSave, { className: "me-2" }),
                                "Lưu bài đăng"
                            ),
                            React.createElement(
                                Dropdown.Item,
                                { onClick: handleReportTweet },
                                React.createElement(FaFlag, { className: "me-2" }),
                                "Báo cáo"
                            )
                        )
                    )
                ),
                React.createElement("p", { className: "mb-2" }, content),
                taggedUsers.length > 0 &&
                React.createElement(
                    "div",
                    { className: "mb-2" },
                    React.createElement(
                        "small",
                        { className: "text-muted" },
                        "Đã tag: ",
                        taggedUsers.map((tag, index) =>
                            React.createElement(
                                "span",
                                { key: index, className: "text-primary me-1" },
                                `@${tag.username}`
                            )
                        )
                    )
                ),
                React.createElement(
                    "div",
                    { className: "d-flex justify-content-between text-muted mt-2" },
                    React.createElement(
                        Button,
                        {
                            variant: "link",
                            className: "text-muted p-1 rounded-circle hover-bg-light",
                        },
                        React.createElement(FaRegComment, { size: 18, className: "me-1" }),
                        commentCount > 0 && commentCount
                    ),
                    React.createElement(
                        Button,
                        {
                            variant: "link",
                            className: "text-muted p-1 rounded-circle hover-bg-light",
                        },
                        React.createElement(FaRetweet, { size: 18, className: "me-1" }),
                        shareCount > 0 && shareCount
                    ),
                    React.createElement(
                        OverlayTrigger,
                        {
                            placement: "top",
                            overlay: React.createElement(Tooltip, { id: "emoji-tooltip" }, "Chọn biểu cảm"),
                        },
                        React.createElement(
                            Dropdown,
                            null,
                            React.createElement(
                                Dropdown.Toggle,
                                {
                                    variant: "link",
                                    className: "text-muted p-1 rounded-circle hover-bg-light",
                                },
                                reaction
                                    ? React.createElement("span", null, `${reaction} `)
                                    : React.createElement(FaRegHeart, { size: 18, className: "me-1" }),
                                likeCount > 0 && likeCount
                            ),
                            React.createElement(
                                Dropdown.Menu,
                                null,
                                React.createElement(
                                    Dropdown.Item,
                                    { onClick: () => handleEmojiReaction("😊") },
                                    "😊"
                                ),
                                React.createElement(
                                    Dropdown.Item,
                                    { onClick: () => handleEmojiReaction("❤️") },
                                    "❤️"
                                ),
                                React.createElement(
                                    Dropdown.Item,
                                    { onClick: () => handleEmojiReaction("👍") },
                                    "👍"
                                ),
                                React.createElement(
                                    Dropdown.Item,
                                    { onClick: () => handleEmojiReaction("😂") },
                                    "😂"
                                )
                            )
                        )
                    ),
                    React.createElement(
                        Button,
                        {
                            variant: "link",
                            className: "text-muted p-1 rounded-circle hover-bg-light",
                        },
                        React.createElement(FaShareAlt, { size: 18 })
                    )
                )
            )
        ),
        isOwnTweet &&
        React.createElement(EditPostModal, {
            post: tweet,
            show: showEditModal,
            onHide: () => setShowEditModal(false),
            onSave: () => {
                setShowEditModal(false);
                if (onPostUpdate) onPostUpdate();
            },
        })
    );
}

export default TweetCard;