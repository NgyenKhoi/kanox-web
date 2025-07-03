import {
    Modal,
    Button,
    ListGroup,
    Spinner,
    Image,
    Dropdown,
    OverlayTrigger,
    Tooltip,
} from "react-bootstrap";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useReaction from "../../../hooks/useReaction";
import FriendshipButton from "../../friendship/FriendshipButton";
import FollowActionButton from "../../utils/FollowActionButton";

export default function ReactionUserListModal({
                                                  show,
                                                  onHide,
                                                  targetId,
                                                  targetTypeCode,
                                                  emojiName,
                                              }) {
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState([]);
    const [selectedReaction, setSelectedReaction] = useState(null);
    const token = localStorage.getItem("token");
    const currentUserId = localStorage.getItem("userId");
    const navigate = useNavigate();

    const {
        emojiMap,
        reactionCountMap,
        topReactions,
    } = useReaction({ user: { id: currentUserId }, targetId, targetTypeCode });

    useEffect(() => {
        if (show) {
            setSelectedReaction(emojiName || null);
        }
    }, [show, emojiName]);

    const fetchUsers = async (reactionName) => {
        if (!reactionName && reactionName !== null) return;

        setLoading(true);
        try {
            const res = await fetch(
                `${process.env.REACT_APP_API_URL}/reactions/list-by-type?targetId=${targetId}&targetTypeCode=${targetTypeCode}&emojiName=${reactionName || ""}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await res.json();
            setUsers(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Lỗi khi tải danh sách người dùng:", err.message);
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (show && targetId && targetTypeCode) {
            fetchUsers(selectedReaction);
        }
    }, [show, targetId, targetTypeCode, selectedReaction]);

    const top3Reactions = topReactions.slice(0, 3);
    const otherReactions = Object.entries(emojiMap)
        .filter(([name]) => !top3Reactions.some((r) => r.name === name))
        .map(([name, emoji]) => ({
            name,
            emoji,
            count: reactionCountMap[name] || 0,
        }))
        .filter((item) => item.count > 0);

    return (
        <Modal show={show} onHide={onHide} centered size="lg">
            <Modal.Header closeButton className="border-0 pb-0" />
            <Modal.Body className="bg-[var(--background-color)]">
                {loading ? (
                    <div className="text-center">
                        <Spinner animation="border" className="text-[var(--text-color)]" />
                    </div>
                ) : (
                    <>
                        {(top3Reactions.length + otherReactions.length > 1) && (
                            <div className="d-flex gap-2 flex-wrap mb-3 ps-3 pe-3 align-items-center">
                                <Button
                                    variant="link"
                                    className={`p-1 rounded-pill fw-semibold ${!selectedReaction ? "text-primary" : "text-muted"}`}
                                    onClick={() => setSelectedReaction(null)}
                                >
                                    Tất cả
                                </Button>

                                {top3Reactions.map(({ name, emoji, count }) => (
                                    <OverlayTrigger key={name} placement="top" overlay={<Tooltip>{name}</Tooltip>}>
                                        <Button
                                            variant="link"
                                            className={`p-1 rounded-circle fs-4 ${selectedReaction === name ? "text-primary" : "text-muted"}`}
                                            onClick={() => setSelectedReaction(name)}
                                        >
                                            {emoji} {count}
                                        </Button>
                                    </OverlayTrigger>
                                ))}

                                {otherReactions.length > 0 && (
                                    <Dropdown align="end">
                                        <Dropdown.Toggle variant="link" className="p-1 rounded fs-5 text-muted">
                                            Khác
                                        </Dropdown.Toggle>
                                        <Dropdown.Menu>
                                            {otherReactions.map(({ name, emoji, count }) => (
                                                <Dropdown.Item key={name} onClick={() => setSelectedReaction(name)}>
                                                    {emoji} {count} {name}
                                                </Dropdown.Item>
                                            ))}
                                        </Dropdown.Menu>
                                    </Dropdown>
                                )}
                            </div>
                        )}

                        <ListGroup variant="flush">
                            {users.length > 0 ? (
                                users.map((user) => (
                                    <ListGroup.Item
                                        key={user.id}
                                        className="d-flex justify-content-between align-items-center bg-[var(--background-color)] text-[var(--text-color)]"
                                    >
                                        <div
                                            className="d-flex align-items-center"
                                            onClick={() => navigate(`/profile/${user.username}`)}
                                            style={{ cursor: "pointer" }}
                                        >
                                            <Image
                                                src={user.avatarUrl || "/default-avatar.png"}
                                                roundedCircle
                                                style={{
                                                    width: 40,
                                                    height: 40,
                                                    objectFit: "cover",
                                                    marginRight: 10,
                                                }}
                                            />
                                            <span>{user.displayName || user.username}</span>
                                        </div>
                                        {user.id !== currentUserId && (
                                            <div className="d-flex gap-2 align-items-center">
                                                <FriendshipButton targetId={user.id} />
                                                <FollowActionButton targetId={user.id} />
                                            </div>
                                        )}
                                    </ListGroup.Item>
                                ))
                            ) : (
                                <div className="text-[var(--text-color-muted)] text-center">
                                    Không có người dùng.
                                </div>
                            )}
                        </ListGroup>
                    </>
                )}
            </Modal.Body>
            <Modal.Footer className="bg-[var(--background-color)]">
                <Button variant="secondary" className="text-[var(--text-color)]" onClick={onHide}>
                    Đóng
                </Button>
            </Modal.Footer>
        </Modal>
    );
}