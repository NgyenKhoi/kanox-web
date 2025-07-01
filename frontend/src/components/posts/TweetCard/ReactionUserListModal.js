import { Modal, Button, ListGroup, Spinner, Image, Dropdown, OverlayTrigger, Tooltip } from "react-bootstrap";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useReaction from "../../../hooks/useReaction";

export default function ReactionUserListModal({ show, onHide, targetId, targetTypeCode }) {
    const [loading, setLoading] = useState(false);
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

    const fetchUsers = async (reactionName) => {
        setLoading(true);
        try {
            const res = await fetch(
                `${process.env.REACT_APP_API_URL}/reactions/list-by-type?targetId=${targetId}&targetTypeCode=${targetTypeCode}&emojiName=${reactionName || ""}`,
                { headers: { Authorization: `Bearer ${token}` } }
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
        if (show && targetId && targetTypeCode) fetchUsers(selectedReaction);
    }, [show, targetId, targetTypeCode, selectedReaction]);

    const otherReactions = Object.entries(emojiMap)
        .filter(([name]) => !topReactions.some(r => r.name === name))
        .map(([name, emoji]) => ({ name, emoji, count: reactionCountMap[name] || 0 }));

    return (
        <Modal show={show} onHide={onHide} centered size="lg">
            <Modal.Header closeButton className="border-0 pb-0" />
            <Modal.Body>
                {loading ? (
                    <div className="text-center"><Spinner animation="border" /></div>
                ) : (
                    <>
                        {(topReactions.length + otherReactions.length > 1) && (
                            <div className="d-flex gap-2 flex-wrap mb-3 ps-3 pe-3 align-items-center">
                                <Button variant="link" className={`p-1 rounded-pill fw-semibold ${!selectedReaction ? 'text-primary' : 'text-muted'}`} onClick={() => setSelectedReaction(null)}>
                                    Tất cả
                                </Button>

                                {topReactions.map(({ name, emoji, count }) => (
                                    <OverlayTrigger key={name} placement="top" overlay={<Tooltip>{name}</Tooltip>}>
                                        <Button variant="link" className={`p-1 rounded-circle fs-4 ${selectedReaction === name ? 'text-primary' : 'text-muted'}`} onClick={() => setSelectedReaction(name)}>
                                            {emoji} {count > 0 && count}
                                        </Button>
                                    </OverlayTrigger>
                                ))}

                                {otherReactions.length > 0 && (
                                    <Dropdown align="end">
                                        <Dropdown.Toggle variant="link" className="p-1 rounded-circle fs-5 text-muted">...</Dropdown.Toggle>
                                        <Dropdown.Menu>
                                            {otherReactions.map(({ name, emoji, count }) => (
                                                <Dropdown.Item key={name} onClick={() => setSelectedReaction(name)}>
                                                    {emoji} {count > 0 && count} {name}
                                                </Dropdown.Item>
                                            ))}
                                        </Dropdown.Menu>
                                    </Dropdown>
                                )}
                            </div>
                        )}

                        <ListGroup variant="flush">
                            {users.length > 0 ? (
                                users.map(user => (
                                    <ListGroup.Item key={user.id} className="d-flex align-items-center p-2" onClick={() => navigate(`/profile/${user.username}`)} style={{ cursor: "pointer" }}>
                                        <Image src={user.avatarUrl || "/default-avatar.png"} roundedCircle style={{ width: 40, height: 40, objectFit: "cover", marginRight: 10 }} />
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
                <Button variant="secondary" onClick={onHide}>Đóng</Button>
            </Modal.Footer>
        </Modal>
    );
}
