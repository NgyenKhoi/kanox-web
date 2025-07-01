import { Modal, Button, ListGroup, Spinner, Image } from "react-bootstrap";
import { useEffect, useState } from "react";

export default function ReactionUserListModal({ show, onHide, targetId, targetTypeCode, emojiName }) {
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]);
    const token = localStorage.getItem("token");

    useEffect(() => {
        if (!show || !emojiName || !targetId || !targetTypeCode) return;

        const fetchUsers = async () => {
            setLoading(true);
            try {
                const res = await fetch(
                    `${process.env.REACT_APP_API_URL}/reactions/list-by-type?targetId=${targetId}&targetTypeCode=${targetTypeCode}&emojiName=${emojiName}`,
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

        fetchUsers();
    }, [show, emojiName, targetId, targetTypeCode]);

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton>
                <Modal.Title className="text-[var(--text-color)]">Người dùng đã thả: {emojiName}</Modal.Title>
            </Modal.Header>
            <Modal.Body className="bg-[var(--background-color)]">
                {loading ? (
                    <div className="text-center">
                        <Spinner animation="border" className="text-[var(--text-color)]" />
                    </div>
                ) : (
                    <ListGroup variant="flush">
                        {users.map((user) => (
                            <ListGroup.Item
                                key={user.id}
                                className="d-flex align-items-center bg-[var(--background-color)] text-[var(--text-color)]"
                            >
                                <Image
                                    src={user.avatarUrl || "/default-avatar.png"}
                                    roundedCircle
                                    className="w-10 h-10 object-cover mr-2.5"
                                />
                                <span>{user.displayName || user.username}</span>
                            </ListGroup.Item>
                        ))}
                        {users.length === 0 && <div className="text-[var(--text-color-muted)] text-center">Không có người dùng.</div>}
                    </ListGroup>
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