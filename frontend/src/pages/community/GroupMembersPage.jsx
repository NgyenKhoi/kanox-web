import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { Button, Spinner, Row, Col } from "react-bootstrap";
import CommunitySidebarLeft from "../../components/community/CommunitySidebarLeft";
import SidebarRight from "../../components/layout/SidebarRight/SidebarRight";

export default function GroupMembersPage() {
    const { groupId } = useParams();
    const { token, user } = useContext(AuthContext);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const [viewMode, setViewMode] = useState("feed");
    const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem("theme") === "dark");

    const handleToggleDarkMode = () => {
        const newTheme = isDarkMode ? "light" : "dark";
        setIsDarkMode(!isDarkMode);
        localStorage.setItem("theme", newTheme);
        document.documentElement.setAttribute("data-theme", newTheme);
    };

    const handleGroupCreated = () => {
        fetchMembers();
    };

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

    if (loading)
        return (
            <div className="text-center py-5">
                <Spinner animation="border" />
            </div>
        );

    return (
        <div className="min-vh-100 bg-white text-gray-800 dark:bg-gray-900 dark:text-white transition-colors duration-200">
            <Row className="m-0">
                {/* Main content */}
                <Col xs={12} lg={9} className="p-0">
                    <Row className="m-0">
                        {/* Center */}
                        <Col xs={12} lg={8} className="p-4 border-end">
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
                                                    <p
                                                        className="m-0 font-medium cursor-pointer hover:underline d-flex align-items-center gap-1"
                                                        onClick={() => navigate(`/profile/${member.username}`)}
                                                    >
                                                        {member.displayName}
                                                        {member.isOwner && <span title="Chủ nhóm">👑</span>}
                                                        {!member.isOwner && member.isAdmin && (
                                                            <span title="Quản trị viên">🛡️</span>
                                                        )}
                                                    </p>
                                                    <p className="m-0 text-sm text-gray-500 dark:text-gray-400">
                                                        @{member.username}
                                                    </p>
                                                </div>
                                            </div>

                                            {member.username !== user.username && (
                                                <Button
                                                    variant="outline-danger"
                                                    size="sm"
                                                    onClick={() => handleDelete(member.id)}
                                                >
                                                    Xóa
                                                </Button>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </Col>

                        {/* SidebarRight */}
                        <Col xs={0} lg={4} className="d-none d-lg-block p-0 border-start">
                            <SidebarRight />
                        </Col>
                    </Row>
                </Col>
            </Row>

            {/* SidebarLeft cố định ngoài cùng */}
            <div
                className="d-none d-lg-block"
                style={{ position: "fixed", top: 0, bottom: 0, left: 0, width: "25%", zIndex: 1000 }}
            >
                <CommunitySidebarLeft
                    selectedView={viewMode}
                    onSelectView={setViewMode}
                    onGroupCreated={handleGroupCreated}
                    onToggleDarkMode={handleToggleDarkMode}
                    isDarkMode={isDarkMode}
                />
            </div>
        </div>
    );
}
