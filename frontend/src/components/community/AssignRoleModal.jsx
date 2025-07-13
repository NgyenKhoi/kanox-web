import React, { useEffect, useState } from "react";
import { Modal, Button, ListGroup } from "react-bootstrap";
import { toast } from "react-toastify";

export default function AssignRoleModal({ show, onHide, groupId, token, onRoleAssigned }) {
    const [memberList, setMemberList] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (show && groupId && token) {
            fetchMembers();
        }
    }, [show, groupId, token]);

    const fetchMembers = async () => {
        setLoading(true);
        try {
            const res = await fetch(
                `${process.env.REACT_APP_API_URL}/groups/${groupId}/members?page=0&size=100`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || "Không thể lấy danh sách thành viên.");
            }

            const data = await res.json();
            console.log("Dữ liệu thành viên:", data); // Debug dữ liệu API trả về
            const members = data.content || [];
            // Sắp xếp: thành viên thường lên trên, admin/owner xuống dưới
            const sortedMembers = members.sort((a, b) => {
                const aHasRole = a.admin || a.owner;
                const bHasRole = b.admin || b.owner;
                return aHasRole === bHasRole ? 0 : aHasRole ? 1 : -1;
            });
            setMemberList(sortedMembers);
            if (members.length === 0) {
                toast.warn("Nhóm hiện không có thành viên nào.");
            }
        } catch (err) {
            console.error("Lỗi khi lấy danh sách thành viên:", err);
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async (targetUserId, role) => {
        const roleLabel = role === "OWNER" ? "chủ nhóm" : "quản trị viên";
        const confirm = window.confirm(`Bạn có chắc muốn trao quyền ${roleLabel} không?`);
        if (!confirm) return;

        try {
            const res = await fetch(
                `${process.env.REACT_APP_API_URL}/groups/${groupId}/assign-role?targetUserId=${targetUserId}&role=${role}`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || `Không thể trao quyền ${roleLabel}.`);
            }

            toast.success(`Đã trao quyền ${roleLabel} thành công`);
            onRoleAssigned?.();
            onHide();
        } catch (err) {
            console.error(`Lỗi khi trao quyền ${roleLabel}:`, err);
            toast.error(err.message);
        }
    };

    return (
        <Modal show={show} onHide={onHide} size="lg" centered>
            <Modal.Header closeButton>
                <Modal.Title>Trao quyền thành viên</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {loading ? (
                    <p>Đang tải danh sách thành viên...</p>
                ) : memberList.length === 0 ? (
                    <p>Không có thành viên nào.</p>
                ) : (
                    <ListGroup>
                        {memberList.map((member) => (
                            <ListGroup.Item
                                key={member.id}
                                className="d-flex justify-content-between align-items-center"
                            >
                                <div>
                                    <span>{member.displayName || member.username}</span>
                                    <span className="text-muted ms-2">
                                        {member.owner ? "(Chủ nhóm)" : member.admin ? "(Quản trị viên)" : ""}
                                    </span>
                                </div>
                                <div className="d-flex gap-2">
                                    {!member.admin && !member.owner && (
                                        <Button
                                            variant="outline-primary"
                                            size="sm"
                                            onClick={() => handleAssign(member.id, "ADMIN")}
                                        >
                                            Trao Admin
                                        </Button>
                                    )}
                                    {!member.owner && (
                                        <Button
                                            variant="outline-danger"
                                            size="sm"
                                            onClick={() => handleAssign(member.id, "OWNER")}
                                        >
                                            Trao Owner
                                        </Button>
                                    )}
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