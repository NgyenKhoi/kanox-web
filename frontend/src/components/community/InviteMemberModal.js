import { Modal, Form } from "react-bootstrap";

const InviteMemberModal = ({ show, onHide, groupId, token }) => {
    const [username, setUsername] = useState("");

    const handleInvite = async () => {
        try {
            const res = await fetch(`${process.env.REACT_APP_API_URL}/groups/${groupId}/invite?username=${username}`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || "Không thể gửi lời mời.");
            }
            toast.success("Gửi lời mời thành công!");
            onHide();
            setUsername("");
        } catch (err) {
            toast.error(err.message);
        }
    };

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton>
                <Modal.Title>Mời thành viên</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form>
                    <Form.Group>
                        <Form.Label>Tên người dùng</Form.Label>
                        <Form.Control
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Nhập tên người dùng"
                        />
                    </Form.Group>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>
                    Đóng
                </Button>
                <Button variant="primary" onClick={handleInvite}>
                    Gửi lời mời
                </Button>
            </Modal.Footer>
        </Modal>
    );
};