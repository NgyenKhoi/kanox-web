import React, { useEffect, useState } from "react";
import { Modal, Button, ListGroup } from "react-bootstrap";
import { toast } from "react-toastify";

export default function AssignRoleModal({ show, onHide, groupId, token, onRoleAssigned }) {
    const [memberList, setMemberList] = useState([]);

    useEffect(() => {
        if (show) fetchMembers();
    }, [show]);

    const fetchMembers = async () => {
        try {
            const res = await fetch(`${process.env.REACT_APP_API_URL}/groups/${groupId}/members`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Không thể lấy danh sách thành viên.");
            const data = await res.json();
            setMemberList(data.members || []);
        } catch (err) {
            toast.error(err.message);
        }
    };

    const handleAssign = async (targetUserId, role) => {
        const confirm = window.confirm(`Bạn có chắc muốn trao quyền ${role === "OWNER" ? "chủ nhóm" : "quản trị viên"} không?`);
        if (!confirm) return;

        try {
            const res = await fetch(
                `${process.env.REACT_APP_API_URL}/groups/${groupId}/assign-role?targetUserId=${targetUserId}&role=${role}`,
                {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || "Không thể trao quyền.");
            }

            toast.success(`Đã trao quyền ${role === "OWNER" ? "chủ nhóm" : "quản trị viên"} thành công`);
            onRoleAssigned?.(); // gọi callback nếu có
            onHide(); // đóng modal
        } catch (err) {
            toast.error(err.message);
        }
    };

    return (
        <Modal show={show} onHide={onHide} size="lg" centered>
            <Modal.Header closeButton>
                <Modal.Title>Trao quyền thành viên</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {memberList.length === 0 ? (
                    <p>Không có thành viên nào.</p>
                ) : (
                    <ListGroup>
                        {memberList.map((member) => (
                            <ListGroup.Item key={member.id} className="d-flex justify-content-between align-items-center">
                                <span>{member.displayName || member.username}</span>
                                <div className="d-flex gap-2">
                                    <Button
                                        variant="outline-primary"
                                        size="sm"
                                        onClick={() => handleAssign(member.id, "ADMIN")}
                                    >
                                        Trao Admin
                                    </Button>
                                    <Button
                                        variant="outline-danger"
                                        size="sm"
                                        onClick={() => handleAssign(member.id, "OWNER")}
                                    >
                                        Trao Owner
                                    </Button>
                                </div>
                            </ListGroup.Item>
                        ))}
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
