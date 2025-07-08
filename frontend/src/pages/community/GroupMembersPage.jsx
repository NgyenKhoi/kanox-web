import React, { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { Button, Spinner } from "react-bootstrap";
import CommunitySidebarLeft from "../../components/community/CommunitySidebarLeft";
import SidebarRight from "../../components/layout/SidebarRight/SidebarRight";

export default function GroupMembersPage() {
    const { groupId } = useParams();
    const { token, user } = useContext(AuthContext);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!token || !groupId) return;
        fetchMembers();
    }, [token, groupId]);

    const fetchMembers = async () => {
        try {
            const res = await fetch(`${process.env.REACT_APP_API_URL}/groups/${groupId}/members`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await res.json();
            setMembers(data.content || []);
        } catch (err) {
            console.error("Lỗi khi tải danh sách thành viên:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (targetUserId) => {
        const confirmDelete = window.confirm("Bạn có chắc muốn xóa thành viên này?");
        if (!confirmDelete) return;

        try {
            const res = await fetch(
                `${process.env.REACT_APP_API_URL}/groups/${groupId}/remove?targetUserId=${targetUserId}&requesterUsername=${user.username}`,
                {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!res.ok) throw new Error("Không thể xóa thành viên");

            setMembers((prev) => prev.filter((m) => m.id !== targetUserId));
        } catch (err) {
            console.error("Lỗi khi xóa thành viên:", err.message);
        }
    };

    if (loading) return <div className="text-center py-5"><Spinner animation="border" /></div>;

    return (
        <div className="container-fluid">
            <div className="row">
                {/* Cột trái */}
                <div className="col-md-3">
                    <CommunitySidebarLeft />
                </div>

                {/* Cột giữa */}
                <div className="col-md-6 p-4">
                    <h2 className="text-xl font-bold mb-4">Danh sách thành viên</h2>
                    {members.length === 0 ? (
                        <p>Không có thành viên nào.</p>
                    ) : (
                        <ul className="space-y-3">
                            {members.map((member) => (
                                <li
                                    key={member.id}
                                    className="flex items-center justify-between border p-2 rounded"
                                >
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={member.avatarUrl || "https://via.placeholder.com/40"}
                                            alt="avatar"
                                            className="w-10 h-10 rounded-full object-cover"
                                        />
                                        <div>
                                            <p className="m-0 font-medium">{member.displayName}</p>
                                            <p className="m-0 text-sm text-gray-500">@{member.username}</p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="outline-danger"
                                        size="sm"
                                        onClick={() => handleDelete(member.id)}
                                    >
                                        Xóa
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Cột phải */}
                <div className="col-md-3 d-none d-md-block">
                    <SidebarRight />
                </div>
            </div>
        </div>
    );
}
