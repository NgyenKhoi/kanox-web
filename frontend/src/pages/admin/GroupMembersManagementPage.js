
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, Button, Spinner } from "react-bootstrap";

const GroupMembersManagementPage = () => {
    const { groupId } = useParams();
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const API_URL = process.env.REACT_APP_API_URL;
    const token = sessionStorage.getItem("token") || localStorage.getItem("token");

    const getUsernameFromToken = () => {
        try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            return payload.username || payload.sub || payload.email; // ⚠️ ưu tiên "username"
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
            const response = await fetch(
                `${API_URL}/groups/${groupId}/members?page=0&size=100`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
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
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
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
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            if (!response.ok) throw new Error("Không thể trao quyền admin");
            alert("Trao quyền admin thành công");
            fetchMembers(); // Reload danh sách sau khi cập nhật
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
            <h3>Quản lý thành viên nhóm</h3>
            {loading ? (
                <Spinner animation="border" />
            ) : members.length === 0 ? (
                <p>Không có thành viên nào trong nhóm.</p>
            ) : (
                members.map((member) => (
                    <Card key={member.id} className="mb-3">
                        <Card.Body>
                            <Card.Title>{member.displayName || member.username}</Card.Title>
                            <Card.Subtitle className="mb-2 text-muted">
                                @{member.username}
                            </Card.Subtitle>
                            <Card.Text>
                                {member.isOwner
                                    ? "Chủ nhóm"
                                    : member.isAdmin
                                        ? "Admin"
                                        : "Thành viên"}
                            </Card.Text>

                            {!member.isOwner && member.username !== getUsernameFromToken() && (
                                <>
                                    <Button
                                        variant="danger"
                                        className="me-2"
                                        onClick={() => handleRemove(member.id)}
                                    >
                                        Xoá
                                    </Button>
                                    {!member.isAdmin && (
                                        <Button
                                            variant="warning"
                                            onClick={() => handlePromoteToAdmin(member.id)}
                                        >
                                            Trao quyền Admin
                                        </Button>
                                    )}
                                </>
                            )}
                        </Card.Body>
                    </Card>
                ))
            )}
        </div>
    );
};

export default GroupMembersManagementPage;
