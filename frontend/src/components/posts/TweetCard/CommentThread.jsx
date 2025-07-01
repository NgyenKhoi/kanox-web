import React, { useState } from "react";
import { FaReply, FaUserCircle, FaEllipsisH } from "react-icons/fa";
import moment from "moment";
import useCommentAvatar from "../../../hooks/useCommentAvatar";
import ReactionButtonGroup from "./ReactionButtonGroup";

function CommentThread({
                           comment,
                           onReply,
                           onUpdate,
                           onDelete,
                           currentUserId,
                       }) {
    const [showReplyBox, setShowReplyBox] = useState(false);
    const [replyText, setReplyText] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [editedText, setEditedText] = useState(comment.content);
    const { avatarUrl } = useCommentAvatar(comment.user?.id);

    const handleReplySubmit = (e) => {
        e.preventDefault();
        if (replyText.trim()) {
            onReply(comment.commentId, replyText);
            setReplyText("");
            setShowReplyBox(false);
        }
    };

    const handleEditSubmit = (e) => {
        e.preventDefault();
        if (editedText.trim()) {
            onUpdate(comment.commentId, editedText);
            setIsEditing(false);
        }
    };

    return (
        <div className="mb-4">
            <div className="flex">
                {avatarUrl ? (
                    <img
                        src={avatarUrl}
                        alt="avatar"
                        className="w-10 h-10 rounded-full object-cover mr-3"
                    />
                ) : (
                    <FaUserCircle size={40} className="mr-3 text-[var(--text-color-muted)]" />
                )}

                <div className="flex-1">
                    <div className="rounded-2xl p-3 text-sm bg-[var(--comment-bg-color)]">
                        <div className="flex justify-between">
                            <div>
                                <strong className="text-[var(--text-color)]">
                                    {comment.user?.displayName}
                                </strong>{" "}
                                <span className="text-[var(--text-color-muted)]">
                  @{comment.user?.username}
                </span>{" "}
                                <span className="text-xs text-[var(--text-color-muted)] ml-2">
                  {moment(comment.createdAt * 1000).fromNow()}
                </span>
                            </div>
                            {currentUserId === comment.userId && (
                                <div className="relative">
                                    <button
                                        onClick={() => setIsEditing(!isEditing)}
                                        className="text-[var(--text-color-muted)]"
                                    >
                                        <FaEllipsisH />
                                    </button>
                                    {isEditing && (
                                        <div className="absolute right-0 mt-1 bg-white dark:bg-[var(--background-color)] border border-[var(--border-color)] rounded shadow">
                                            <button
                                                onClick={() => setIsEditing(true)}
                                                className="block px-4 py-2 w-full text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                                            >
                                                Chỉnh sửa
                                            </button>
                                            <button
                                                onClick={() => onDelete(comment.commentId)}
                                                className="block px-4 py-2 w-full text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                                            >
                                                Xóa
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {isEditing ? (
                            <form onSubmit={handleEditSubmit} className="mt-2 flex gap-2">
                                <input
                                    value={editedText}
                                    onChange={(e) => setEditedText(e.target.value)}
                                    className="flex-1 px-3 py-1 rounded-full border border-[var(--border-color)] bg-[var(--background-color)] text-[var(--text-color)]"
                                />
                                <button
                                    type="submit"
                                    className="px-4 py-1 text-sm rounded-full bg-blue-500 text-white"
                                >
                                    Lưu
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(false)}
                                    className="px-4 py-1 text-sm rounded-full bg-gray-400 text-white"
                                >
                                    Hủy
                                </button>
                            </form>
                        ) : (
                            <p className="mt-2 text-[var(--text-color)]">{comment.content}</p>
                        )}

                        <div className="flex items-center gap-3 mt-3">
                            <button
                                onClick={() => setShowReplyBox(!showReplyBox)}
                                className="flex items-center text-[var(--text-color)] text-sm hover:underline"
                            >
                                <FaReply className="mr-1" /> Phản hồi
                            </button>
                            <ReactionButtonGroup
                                user={{ id: currentUserId }}
                                targetId={comment.commentId}
                                targetTypeCode="COMMENT"
                            />
                        </div>

                        {showReplyBox && (
                            <form onSubmit={handleReplySubmit} className="mt-3 flex gap-2 items-center">
                                {avatarUrl ? (
                                    <img
                                        src={avatarUrl}
                                        alt="avatar"
                                        className="w-8 h-8 rounded-full object-cover"
                                    />
                                ) : (
                                    <FaUserCircle size={32} className="text-[var(--text-color-muted)]" />
                                )}
                                <input
                                    type="text"
                                    placeholder="Viết phản hồi..."
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    className="flex-1 px-3 py-1 rounded-full border border-[var(--border-color)] bg-[var(--background-color)] text-[var(--text-color)]"
                                />
                                <button
                                    type="submit"
                                    className="px-4 py-1 text-sm rounded-full bg-blue-500 text-white"
                                >
                                    Gửi
                                </button>
                            </form>
                        )}
                    </div>

                    {/* Replies */}
                    {comment.replies?.length > 0 && (
                        <div className="mt-4 ml-6 border-l-2 border-gray-200 dark:border-gray-700 pl-4">
                            {comment.replies.map((reply) => (
                                <CommentThread
                                    key={reply.commentId}
                                    comment={reply}
                                    onReply={onReply}
                                    onUpdate={onUpdate}
                                    onDelete={onDelete}
                                    currentUserId={currentUserId}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default CommentThread;
