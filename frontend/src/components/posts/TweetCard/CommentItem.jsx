import React from "react";
import Image from "react-bootstrap/Image";
import { FaUserCircle } from "react-icons/fa";
import moment from "moment";
import useCommentAvatar from "../../../hooks/useCommentAvatar";

const CommentItem = ({ comment }) => {
    const { avatarUrl } = useCommentAvatar(comment?.user?.id);

    return (
        <div className="flex items-start gap-3 mb-3">
            {avatarUrl ? (
                <img
                    src={avatarUrl}
                    alt="avatar"
                    className="w-9 h-9 rounded-full object-cover me-2 flex-shrink-0"
                />
            ) : (
                <FaUserCircle
                    size={36}
                    className="text-[var(--text-color-muted)] flex-shrink-0"
                    aria-label="Ảnh đại diện mặc định"
                />
            )}

            <div className="flex flex-col">
                <div className="bg-[var(--comment-bg-color)] p-2 rounded-2xl max-w-full break-words text-[var(--text-color)]">
                    <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm">
              {comment?.user?.displayName || "Người dùng"}
            </span>
                        <span className="text-xs text-[var(--text-color-muted)]">
              {moment(comment.createdAt * 1000).fromNow()}
            </span>
                    </div>
                    <div className="text-sm">{comment.content}</div>
                </div>
            </div>
        </div>
    );
};

export default CommentItem;