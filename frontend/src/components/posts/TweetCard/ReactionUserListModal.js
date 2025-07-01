import { Modal, Button, ListGroup, Spinner, Image, Dropdown, OverlayTrigger, Tooltip } from "react-bootstrap";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useReaction from "../../../hooks/useReaction";

export default function ReactionUserListModal({ show, onHide, targetId, targetTypeCode }) {
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]);
    const [selectedReaction, setSelectedReaction] = useState(null);
    const token = localStorage.getItem("token");
    const navigate = useNavigate();

    const {
        currentEmoji,
        emojiMap,
        reactionCountMap,
        topReactions,
    } = useReaction({ user: { id: localStorage.getItem("userId") }, targetId, targetTypeCode });

    useEffect(() => {
        if (!show || !targetId || !targetTypeCode) return;

        const fetchUsers = async (reactionName) => {
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

        fetchUsers(selectedReaction);
    }, [show, targetId, targetTypeCode, selectedReaction, token]);

    const handleReactionClick = (reactionName) => {
        setSelectedReaction(reactionName);
    };

    const handleNavigateToProfile = (userId) => {
        navigate(`/profile/${userId}`);
    };

    const otherReactions = Object.entries(emojiMap)
        .filter(([name]) => !topReactions.some(r => r.name === name))
        .map(([name, emoji]) => ({
            name,
            emoji,
            count: reactionCountMap[name] || 0,
        }));

    return (
        <Modal show={show} onHide={onHide} centered size="lg" className="reaction-modal">
            <Modal.Header closeButton>
                <Modal.Title>Phản hồi bài viết</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {loading ? (
                    <div className="text-center">
                        <Spinner animation="border" />
                    </div>
                ) : (
                    <>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            {topReactions.map(({ name, emoji, count }) => (
                                <OverlayTrigger
                                    key={name}
                                    placement="top"
                                    overlay={<Tooltip>{name}</Tooltip>}
                                >
                                    <Button
                                        variant="link"
                                        className="text-muted p-1 rounded-circle hover-bg-light"
                                        onClick={() => handleReactionClick(name)}
                                        active={selectedReaction === name}
                                        style={{ fontSize: "1.5rem" }}
                                    >
                                        {emoji} {count > 0 && count}
                                    </Button>
                                </OverlayTrigger>
                            ))}
                            {otherReactions.length > 0 && (
                                <Dropdown align="end">
                                    <Dropdown.Toggle
                                        variant="link"
                                        className="text-muted p-1 rounded-circle hover-bg-light"
                                        style={{ fontSize: "1.5rem" }}
                                    >
                                        Xem thêm...
                                    </Dropdown.Toggle>
                                    <Dropdown.Menu>
                                        {otherReactions.map(({ name, emoji, count }) => (
                                            <Dropdown.Item
                                                key={name}
                                                onClick={() => handleReactionClick(name)}
                                            >
                                                {emoji} {count > 0 && count} {name}
                                            </Dropdown.Item>
                                        ))}
                                    </Dropdown.Menu>
                                </Dropdown>
                            )}
                        </div>
                        <ListGroup variant="flush">
                            {users.length > 0 ? (
                                users.map((user) => (
                                    <ListGroup.Item
                                        key={user.id}
                                        className="d-flex align-items-center p-2"
                                        onClick={() => handleNavigateToProfile(user.id)}
                                        style={{ cursor: "pointer" }}
                                    >
                                        <Image
                                            src={user.avatarUrl || "/default-avatar.png"}
                                            roundedCircle
                                            style={{ width: 40, height: 40, objectFit: "cover", marginRight: 10 }}
                                        />
                                        <span>{user.displayName || user.username}</span>
                                    </ListGroup.Item>
                                ))
                            ) : (
                                <div className="text-muted text-center">Không có người dùng.</div>
                            )}
                        </ListGroup>
                    </>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>
                    Đóng
                </Button>
            </Modal.Footer>
        </Modal>
    );
}