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
    const [showReplies, setShowReplies] = useState(false);

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
        <div className="mb-3">
            <div className="d-flex">
                {avatarUrl ? (
                    <Image
                        src={avatarUrl}
                        alt="avatar"
                        roundedCircle
                        width={36}
                        height={36}
                        style={{ objectFit: 'cover' }}
                        className="me-2 flex-shrink-0"
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
                            <p className="mb-1 mt-2 text-[var(--text-color)]">{comment.content}</p>
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
                                    {avatarUrl ? (
                                        <Image
                                            src={avatarUrl}
                                            alt="avatar"
                                            roundedCircle
                                            width={36}
                                            height={36}
                                            style={{ objectFit: 'cover' }}
                                            className="me-2 flex-shrink-0"
                                        />
                                    ) : (
                                        <FaUserCircle
                                            size={40}
                                            className="me-2 text-[var(--text-color-muted)] flex-shrink-0"
                                        />
                                    )}
                                    <InputGroup>
                                        <Form.Control
                                            type="text"
                                            placeholder="Viết phản hồi..."
                                            value={replyText}
                                            onChange={(e) => setReplyText(e.target.value)}
                                            className="rounded-full border-[var(--border-color)] bg-[var(--background-color)] text-[var(--text-color)]"
                                            size="sm"
                                        />
                                        <Button
                                            type="submit"
                                            size="sm"
                                            variant="primary"
                                            className="rounded-full"
                                        >
                                            Gửi
                                        </Button>
                                    </InputGroup>
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