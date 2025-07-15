import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, Button, Spinner, Row, Col, Badge } from "react-bootstrap";

const GroupMembersManagementPage = () => {
    const { groupId } = useParams();
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const API_URL = process.env.REACT_APP_API_URL;
    const token = sessionStorage.getItem("token") || localStorage.getItem("token");

    const getUsernameFromToken = () => {
        try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            return payload.username || payload.sub || payload.email;
        } catch (e) {
            return null;
        }
    };

    const fetchMembers = async () => {
        if (!token) {
            alert("Vui lòng đăng nhập lại.");
            return;
        }

        try {
            const response = await fetch(`${API_URL}/groups/${groupId}/members?page=0&size=100`, {
                method: "GET",
                headers: { Authorization: `Bearer ${token}` },
            });

            const result = await response.json();

            if (!response.ok) {
                if (response.status === 403) {
                    alert(result.message || "Bạn không có quyền xem danh sách thành viên.");
                    return;
                }
                throw new Error(result.message || "Failed to load members");
            }

            setMembers(result.content || []);
        } catch (error) {
            console.error("Lỗi khi tải danh sách thành viên:", error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = async (targetUserId) => {
        try {
            const response = await fetch(
                `${API_URL}/groups/${groupId}/remove-member?targetUserId=${targetUserId}&requesterUsername=${getUsernameFromToken()}`,
                {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!response.ok) throw new Error("Không thể xóa thành viên");
            setMembers(members.filter((m) => m.id !== targetUserId));
        } catch (error) {
            console.error("Xóa thành viên lỗi:", error.message);
        }
    };

    const handlePromoteToAdmin = async (targetUserId) => {
        try {
            const response = await fetch(
                `${API_URL}/groups/${groupId}/assign-role?targetUserId=${targetUserId}&role=admin&requesterUsername=${getUsernameFromToken()}`,
                {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!response.ok) throw new Error("Không thể trao quyền admin");
            alert("Trao quyền admin thành công");
            fetchMembers();
        } catch (error) {
            console.error("Trao quyền admin lỗi:", error.message);
        }
    };

    useEffect(() => {
        fetchMembers();
        // eslint-disable-next-line
    }, [groupId]);

    return (
        <div className="container mt-4">
            <h3 className="fw-bold mb-4 text-primary">Quản lý thành viên nhóm</h3>
            {loading ? (
                <Spinner animation="border" />
            ) : members.length === 0 ? (
                <p>Không có thành viên nào trong nhóm.</p>
            ) : (
                <Row xs={1} md={2} lg={2} className="g-4">
                    {members.map((member) => (
                        <Col key={member.id}>
                            <Card className="shadow-sm border-0 rounded-4">
                                <Card.Body className="d-flex flex-column justify-content-between h-100">
                                    <div>
                                        <Card.Title className="fw-semibold fs-5">
                                            {member.displayName || member.username}
                                        </Card.Title>
                                        <Card.Subtitle className="mb-2 text-muted">@{member.username}</Card.Subtitle>
                                        <Card.Text className="mt-2">
                      <span className="me-2">
                        {member.isOwner ? (
                            <Badge bg="dark">👑 Chủ nhóm</Badge>
                        ) : member.isAdmin ? (
                            <Badge bg="warning" text="dark">
                                🛡️ Admin
                            </Badge>
                        ) : (
                            <Badge bg="secondary">👤 Thành viên</Badge>
                        )}
                      </span>
                                        </Card.Text>
                                    </div>

                                    {!member.isOwner && member.username !== getUsernameFromToken() && (
                                        <div className="mt-3 d-flex gap-2">
                                            <Button variant="outline-danger" size="sm" onClick={() => handleRemove(member.id)}>
                                                ❌ Xoá
                                            </Button>
                                            {!member.isAdmin && (
                                                <Button variant="outline-warning" size="sm" onClick={() => handlePromoteToAdmin(member.id)}>
                                                    🚀 Trao Admin
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}
        </div>
    );
};

export default GroupMembersManagementPage;
