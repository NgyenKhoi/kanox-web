import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, Button, Spinner } from "react-bootstrap";

const GroupMembersManagementPage = () => {
    const { groupId } = useParams();
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const API_URL = process.env.REACT_APP_API_URL;
    const token = sessionStorage.getItem("token") || localStorage.getItem("token");

    const fetchMembers = async () => {
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
            if (!response.ok) throw new Error(result.message || "Failed to load members");
            setMembers(result.data || []);
        } catch (error) {
            console.error("Lỗi khi tải danh sách thành viên:", error.message);
        } finally {
            setLoading(false);
        }
    };

    const getUsernameFromToken = () => {
        try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            return payload.sub;
        } catch (e) {
            return null;
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
                `${API_URL}/groups/${groupId}/assign-role?targetUserId=${targetUserId}&role=admin`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            if (!response.ok) throw new Error("Không thể trao quyền admin");
            alert("Trao quyền admin thành công");
        } catch (error) {
            console.error("Trao quyền admin lỗi:", error.message);
        }
    };

    useEffect(() => {
        fetchMembers();
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
                            <Card.Title>{member.username}</Card.Title>
                            <Card.Text>Email: {member.email}</Card.Text>
                            <Button
                                variant="danger"
                                className="me-2"
                                onClick={() => handleRemove(member.id)}
                            >
                                Xoá
                            </Button>
                            <Button
                                variant="warning"
                                onClick={() => handlePromoteToAdmin(member.id)}
                            >
                                Trao quyền Admin
                            </Button>
                        </Card.Body>
                    </Card>
                ))
            )}
        </div>
    );
};

export default GroupMembersManagementPage;
