import React, { useState } from "react";
import {
    Button,
    Form,
    InputGroup,
    Image,
    Dropdown,
    Collapse,
    OverlayTrigger,
    Tooltip,
} from "react-bootstrap";
import { FaReply, FaUserCircle, FaEllipsisH } from "react-icons/fa";
import moment from "moment";
import useCommentAvatar from "../../../hooks/useCommentAvatar";
import ReactionButtonGroup from "./ReactionButtonGroup";
import MediaActionBar from "../../utils/MediaActionBar"

function CommentThread({
                           comment,
                           onReply,
                           onUpdate,
                           onDelete,
                           currentUserId,
                           currentUser,
                       }) {
    const [showReplyBox, setShowReplyBox] = useState(false);
    const [replyText, setReplyText] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [editedText, setEditedText] = useState(comment.content);
    const [showReplies, setShowReplies] = useState(false);
    const [selectedMediaFiles, setSelectedMediaFiles] = useState([]);
    const [selectedMediaPreviews, setSelectedMediaPreviews] = useState([]);

    const { avatarUrl } = useCommentAvatar(comment.user?.id);

    const handleReplySubmit = (e) => {
        e.preventDefault();
        if (replyText.trim()) {
            onReply(comment.commentId, replyText, selectedMediaFiles);
            setReplyText("");
            setSelectedMediaFiles([]);
            setSelectedMediaPreviews([]);
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
        <div className="mb-3">
            <div className="d-flex">
                {avatarUrl ? (
                    <img
                        src={avatarUrl}
                        alt="avatar"
                        className="w-9 h-9 rounded-full object-cover me-2 flex-shrink-0"
                    />
                ) : (
                    <FaUserCircle size={40} className="me-2 text-[var(--text-color-muted)]" />
                )}

                <div className="flex-grow-1">
                    <div
                        className="rounded-2xl p-3 text-base"
                        style={{ backgroundColor: "var(--comment-bg-color)" }}
                    >
                        <div className="d-flex justify-content-between align-items-start">
                            <div>
                                <strong className="text-[var(--text-color)]">
                                    {comment.user?.displayName}
                                </strong>{" "}
                                <span className="text-[var(--text-color-muted)]">
                  @{comment.user?.username}
                </span>{" "}
                                <span
                                    className="text-[var(--text-color-muted)] ms-2"
                                    style={{ fontSize: "12px" }}
                                >
                  {moment(comment.createdAt * 1000).fromNow()}
                </span>
                            </div>
                            {currentUserId === comment.userId && (
                                <Dropdown align="end">
                                    <Dropdown.Toggle
                                        variant="link"
                                        bsPrefix="p-0 border-0 text-[var(--text-color-muted)]"
                                    >
                                        <FaEllipsisH />
                                    </Dropdown.Toggle>
                                    <Dropdown.Menu>
                                        <Dropdown.Item onClick={() => setIsEditing(true)}>
                                            Chỉnh sửa
                                        </Dropdown.Item>
                                        <Dropdown.Item onClick={() => onDelete(comment.commentId)}>
                                            Xóa
                                        </Dropdown.Item>
                                    </Dropdown.Menu>
                                </Dropdown>
                            )}
                        </div>

                        {isEditing ? (
                            <Form onSubmit={handleEditSubmit} className="mt-2">
                                <InputGroup>
                                    <Form.Control
                                        value={editedText}
                                        onChange={(e) => setEditedText(e.target.value)}
                                        size="sm"
                                        className="rounded-full border-[var(--border-color)] bg-[var(--background-color)] text-[var(--text-color)]"
                                    />
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        type="submit"
                                        className="rounded-full"
                                    >
                                        Lưu
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => setIsEditing(false)}
                                        className="rounded-full"
                                    >
                                        Hủy
                                    </Button>
                                </InputGroup>
                            </Form>
                        ) : (
                            <>
                            <p className="mb-1 mt-2 text-[var(--text-color)]">{comment.content}</p>
                        {comment.media?.length > 0 && (
                            <div className="mt-2 d-flex flex-wrap gap-2">
                        {comment.media.map((media, index) => {
                            const isImage = media.type === "image";
                            const isVideo = media.type === "video";
                            const isAudio = media.type === "audio";

                            return (
                            <div key={index} className="rounded overflow-hidden">
                        {isImage && (
                            <Image
                                src={media.url}
                                alt={`comment-media-${index}`}
                                thumbnail
                                className="max-w-[200px] max-h-[200px] object-cover"
                            />
                        )}
                        {isVideo && (
                            <video
                                controls
                                className="max-w-[200px] max-h-[200px] rounded"
                            >
                                <source src={media.url} type="video/mp4" />
                                Trình duyệt của bạn không hỗ trợ video.
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
                            </>
                        )}

                        {/* Reaction & Reply Buttons */}
                        <div className="d-flex align-items-center gap-2 mt-2">
                            <OverlayTrigger
                                placement="top"
                                overlay={<Tooltip>Phản hồi</Tooltip>}
                            >
                                <Button
                                    variant="link"
                                    className="px-1 py-0 text-[var(--text-color)] text-decoration-none rounded-full hover-bg-light"
                                    size="sm"
                                    onClick={() => setShowReplyBox(!showReplyBox)}
                                    aria-label="Phản hồi"
                                >
                                    <FaReply className="me-1" size={18} />
                                </Button>
                            </OverlayTrigger>

                            <ReactionButtonGroup
                                user={{ id: currentUserId }}
                                targetId={comment.commentId}
                                targetTypeCode="COMMENT"
                            />
                        </div>

                        {/* Reply Box */}
                        {showReplyBox && (
                            <Form onSubmit={handleReplySubmit} className="mt-2">
                                <div className="d-flex align-items-start">
                                    {currentUser?.avatarUrl ? (
                                        <Image
                                            src={currentUser.avatarUrl}
                                            alt="avatar"
                                            roundedCircle
                                            width={36}
                                            height={36}
                                            style={{ objectFit: "cover" }}
                                            className="me-2 flex-shrink-0"
                                        />
                                    ) : (
                                        <FaUserCircle
                                            size={40}
                                            className="me-2 text-[var(--text-color-muted)] flex-shrink-0"
                                        />
                                    )}

                                    <div className="flex-grow-1 w-100">
                                        <Form.Control
                                            type="text"
                                            placeholder="Viết phản hồi..."
                                            value={replyText}
                                            onChange={(e) => setReplyText(e.target.value)}
                                            className="rounded-full border-[var(--border-color)] bg-[var(--background-color)] text-[var(--text-color)]"
                                            size="sm"
                                        />

                                        {/* Media Preview */}
                                        {selectedMediaPreviews.length > 0 && (
                                            <div className="mt-2 d-flex flex-wrap gap-2">
                                                {selectedMediaPreviews.map((preview, index) => (
                                                    <div key={index} className="position-relative">
                                                        {preview.type.startsWith("image") ? (
                                                            <Image
                                                                src={preview.url}
                                                                alt={`Preview ${index}`}
                                                                style={{ width: 100, height: 100, objectFit: "cover" }}
                                                                className="rounded"
                                                            />
                                                        ) : (
                                                            <video
                                                                src={preview.url}
                                                                controls
                                                                style={{ width: 100, height: 100, objectFit: "cover" }}
                                                                className="rounded"
                                                            />
                                                        )}
                                                        <Button
                                                            variant="danger"
                                                            size="sm"
                                                            className="position-absolute top-0 end-0 rounded-circle"
                                                            onClick={() => {
                                                                setSelectedMediaPreviews((prev) => prev.filter((_, i) => i !== index));
                                                                setSelectedMediaFiles((prev) => prev.filter((_, i) => i !== index));
                                                            }}
                                                        >
                                                            ✕
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Action bar */}
                                        <div className="d-flex justify-content-between align-items-center mt-2 px-1">
                                            <MediaActionBar
                                                onEmojiClick={() => {
                                                    // TODO: Chèn emoji vào replyText nếu bạn muốn
                                                }}
                                                onFileSelect={(files) => {
                                                    setSelectedMediaFiles((prev) => [...prev, ...files]);
                                                    setSelectedMediaPreviews((prev) => [
                                                        ...prev,
                                                        ...files.map((f) => ({
                                                            url: URL.createObjectURL(f),
                                                            type: f.type,
                                                        })),
                                                    ]);
                                                }}
                                            />
                                            <Button
                                                type="submit"
                                                size="sm"
                                                variant="primary"
                                                className="rounded-full"
                                            >
                                                Gửi
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </Form>
                        )}
                    </div>
                    {comment.replies?.length > 0 && (
                        <Button
                            variant="link"
                            size="sm"
                            className="text-[var(--text-color-muted)] px-0 mt-1"
                            onClick={() => setShowReplies(!showReplies)}
                        >
                            {showReplies ? "Ẩn phản hồi" : `Xem ${comment.replies.length} phản hồi`}
                        </Button>
                    )}
                    {/* Replies */}
                    <Collapse in={showReplies}>
                        <div className="mt-2 ms-4">
                            {comment.replies?.map((reply) => (
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
                    </Collapse>
                </div>
            </div>
        </div>
    );
}

export default CommentThread;