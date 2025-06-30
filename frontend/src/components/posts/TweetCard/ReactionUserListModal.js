import { Modal, Button, ListGroup, Spinner, Image } from "react-bootstrap";
import { useEffect, useState } from "react";

export default function ReactionUserListModal({ show, onHide, targetId, targetTypeCode, emojiName }) {
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]);
    const token = localStorage.getItem("token");

    useEffect(() => {
        if (!show || !emojiName) return;
        const fetchUsers = async () => {
            setLoading(true);
            try {
                const res = await fetch(
                    `${process.env.REACT_APP_API_URL}/reactions/list-by-type?targetId=${targetId}&targetTypeCode=${targetTypeCode}&emojiName=${emojiName}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
                const data = await res.json();
                setUsers(data || []);
            } catch (err) {
                console.error("Lỗi khi tải danh sách người dùng:", err.message);
                setUsers([]);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, [show, emojiName]);

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton>
                <Modal.Title>Người dùng đã thả: {emojiName}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {loading ? (
                    <div className="text-center">
                        <Spinner animation="border" />
                    </div>
                ) : (
                    <ListGroup variant="flush">
                        {users.map((user) => (
                            <ListGroup.Item key={user.id} className="d-flex align-items-center">
                                <Image
                                    src={user.avatarUrl || "/default-avatar.png"}
                                    roundedCircle
                                    style={{ width: 40, height: 40, objectFit: "cover", marginRight: 10 }}
                                />
                                <span>{user.displayName || user.username}</span>
                            </ListGroup.Item>
                        ))}
                        {users.length === 0 && <div className="text-muted text-center">Không có người dùng.</div>}
                    </ListGroup>
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
