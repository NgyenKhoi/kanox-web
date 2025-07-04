import React from "react";
import { FaUserCircle } from "react-icons/fa";
import moment from "moment";
import useCommentAvatar from "../../../hooks/useCommentAvatar";

const CommentItem = ({ comment }) => {
    const { avatarUrl } = useCommentAvatar(comment?.user?.id);

    return (
        <div className="flex gap-3 mb-3 w-full">
            {/* Avatar */}
            <div className="flex-shrink-0">
                {avatarUrl ? (
                    <img
                        src={avatarUrl}
                        alt="avatar"
                        className="w-9 h-9 rounded-full object-cover"
                    />
                ) : (
                    <FaUserCircle
                        size={36}
                        className="text-[var(--text-color-muted)]"
                        aria-label="Ảnh đại diện mặc định"
                    />
                )}
            </div>

            {/* Nội dung comment */}
            <div className="flex-grow min-w-0">
                <div className="bg-[var(--hover-bg-color)] p-2 rounded-2xl break-words text-[var(--text-color)] transition-colors duration-200">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">
                            {comment?.user?.displayName || "Người dùng"}
                        </span>
                        <span className="text-xs text-[var(--text-color-muted)]">
                            {moment(comment.createdAt * 1000).fromNow()}
                        </span>
                    </div>

                    <div className="text-sm">{comment.content}</div>

                    {comment.media?.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                            {comment.media.map((media, index) => {
                                const isImage = media.type === "image" || media.type === "gif";
                                const isVideo = media.type === "video";
                                const isAudio = media.type === "audio";

                                return (
                                    <div key={index} className="rounded overflow-hidden">
                                        {isImage && (
                                            <img
                                                src={media.url}
                                                alt={`media-${index}`}
                                                className="w-32 h-auto max-w-[200px] max-h-[200px] rounded object-cover"
                                            />
                                        )}
                                        {isVideo && (
                                            <video controls className="w-48 max-h-[200px] rounded">
                                                <source src={media.url} type="video/mp4" />
                                                Trình duyệt không hỗ trợ video.
                                            </video>
                                        )}
                                        {isAudio && (
                                            <audio controls>
                                                <source src={media.url} type="audio/mpeg" />
                                                Trình duyệt không hỗ trợ audio.
                                            </audio>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CommentItem;
