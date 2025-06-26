import React, { useState } from "react";
import { Button, Form, InputGroup, Image, Dropdown } from "react-bootstrap";
import { FaReply, FaUserCircle, FaEllipsisH } from "react-icons/fa";
import useCommentAvatar from "../../../hooks/useCommentAvatar";
import moment from "moment";

function CommentThread({ comment, onReply, onUpdate, onDelete, currentUserId }) {
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
        <div className="mb-3">
            <div className="d-flex">
                {avatarUrl ? (
                    <Image
                        src={avatarUrl}
                        alt="avatar"
                        roundedCircle
                        width={36}
                        height={36}
                        className="me-2"
                    />
                ) : (
                    <FaUserCircle size={36} className="me-2 text-secondary" />
                )}
                <div className="flex-grow-1">
                    <div className="bg-light rounded-3 p-2 position-relative">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <strong>{comment.user?.displayName}</strong>{" "}
                                <span className="text-muted">@{comment.user?.username}</span>
                                <span className="text-muted ms-2" style={{ fontSize: "12px" }}>
                  {moment(comment.createdAt).fromNow()}
                </span>
                            </div>
                            {currentUserId === comment.userId && (
                                <Dropdown align="end">
                                    <Dropdown.Toggle variant="link" bsPrefix="p-0 border-0 text-muted">
                                        <FaEllipsisH />
                                    </Dropdown.Toggle>
                                    <Dropdown.Menu>
                                        <Dropdown.Item onClick={() => setIsEditing(true)}>Chỉnh sửa</Dropdown.Item>
                                        <Dropdown.Item onClick={() => onDelete(comment.commentId)}>Xóa</Dropdown.Item>
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
                                    />
                                    <Button variant="primary" size="sm" type="submit">
                                        Lưu
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => setIsEditing(false)}
                                    >
                                        Hủy
                                    </Button>
                                </InputGroup>
                            </Form>
                        ) : (
                            <p className="mb-0">{comment.content}</p>
                        )}
                    </div>

                    <Button
                        variant="link"
                        className="text-muted p-0 mt-1"
                        size="sm"
                        onClick={() => setShowReplyBox(!showReplyBox)}
                    >
                        <FaReply className="me-1" />
                        Phản hồi
                    </Button>

                    {showReplyBox && (
                        <Form onSubmit={handleReplySubmit} className="mt-2">
                            <InputGroup>
                                <Form.Control
                                    size="sm"
                                    placeholder="Viết phản hồi..."
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                />
                                <Button type="submit" size="sm">
                                    Gửi
                                </Button>
                            </InputGroup>
                        </Form>
                    )}
                </div>
            </div>

            {comment.replies?.map((reply) => (
                <div key={reply.commentId} className="ms-5 mt-2">
                    <CommentThread
                        comment={reply}
                        onReply={onReply}
                        onUpdate={onUpdate}
                        onDelete={onDelete}
                        currentUserId={currentUserId}
                    />
                </div>
            ))}
        </div>
    );
}

export default CommentThread;
