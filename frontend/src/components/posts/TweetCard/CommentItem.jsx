import React from "react";
import Image from "react-bootstrap/Image";
import { FaUserCircle } from "react-icons/fa";
import moment from "moment";
import useCommentAvatar from "../../../hooks/useCommentAvatars";

// 💅 Style giống Facebook
const commentStyles = {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    marginBottom: "16px",
};

const commentAvatarStyles = {
    width: "36px",
    height: "36px",
    objectFit: "cover",
    flexShrink: 0,
};

const commentContentWrapper = {
    display: "flex",
    flexDirection: "column",
};

const commentBubbleStyles = {
    backgroundColor: "#f0f2f5",
    padding: "8px 12px",
    borderRadius: "18px",
    maxWidth: "100%",
    wordBreak: "break-word",
};

const nameAndTimeStyles = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "4px",
};

const displayNameStyles = {
    fontWeight: "600",
    fontSize: "14px",
};

const timeStyles = {
    fontSize: "12px",
    color: "#65676b",
};

const CommentItem = ({ comment }) => {
    const { avatarUrl } = useCommentAvatar(comment?.user?.id);

    return (
        <div style={commentStyles}>
            {avatarUrl ? (
                <Image
                    src={avatarUrl}
                    style={commentAvatarStyles}
                    roundedCircle
                    alt="Ảnh đại diện"
                />
            ) : (
                <FaUserCircle
                    size={36}
                    style={{ color: "#6c757d" }}
                    aria-label="Ảnh đại diện mặc định"
                />
            )}

            <div style={commentContentWrapper}>
                <div style={commentBubbleStyles}>
                    <div style={nameAndTimeStyles}>
            <span style={displayNameStyles}>
              {comment?.user?.displayName || "Người dùng"}
            </span>
                        <span style={timeStyles}>
              {moment(comment.createdAt * 1000).fromNow()}
            </span>
                    </div>
                    <div style={{ fontSize: "14px" }}>{comment.content}</div>
                </div>
            </div>
        </div>
    );
};

export default CommentItem;
