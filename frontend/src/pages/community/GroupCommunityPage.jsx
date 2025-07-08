import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button, Dropdown } from "react-bootstrap";
import { AuthContext } from "../../context/AuthContext";
import TweetCard from "../../components/posts/TweetCard/TweetCard";
import CommunitySidebarLeft from "../../components/community/CommunitySidebarLeft";
import SidebarRight from "../../components/layout/SidebarRight/SidebarRight"
import TweetInput from "../../components/posts/TweetInput/TweetInput";
import { toast } from "react-toastify";

export default function GroupCommunityPage() {
    const { groupId } = useParams();
    const { user, token } = useContext(AuthContext);
    const [groupInfo, setGroupInfo] = useState(null);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isMember, setIsMember] = useState(false);
    const navigate = useNavigate();
    const [showInviteModal, setShowInviteModal] = useState(false);

    // SidebarLeft support
    const [viewMode, setViewMode] = useState("feed");
    const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem("theme") === "dark");

    const handleToggleDarkMode = () => {
        const newTheme = isDarkMode ? "light" : "dark";
        setIsDarkMode(!isDarkMode);
        localStorage.setItem("theme", newTheme);
        document.documentElement.setAttribute("data-theme", newTheme);
    };

    const handleGroupCreated = () => {
        fetchGroupDetail(); // refresh group info
        toast.success("Tạo nhóm thành công");
    };

    useEffect(() => {
        if (!groupId || !token) return;

        const fetchGroupData = async () => {
            try {
                await Promise.all([fetchGroupDetail(), fetchPostsByGroup()]);
                setLoading(false);
            } catch (err) {
                console.error("Lỗi khi tải dữ liệu nhóm:", err.message);
                setLoading(false);
            }
        };

        fetchGroupData();
    }, [groupId, token]);

    const fetchGroupDetail = async () => {
        try {
            const res = await fetch(`${process.env.REACT_APP_API_URL}/groups/${groupId}/detail`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Không thể lấy thông tin nhóm.");
            const data = await res.json();
            setGroupInfo(data);
            setIsMember(data.isMember || false);
        } catch (err) {
            console.error("Lỗi khi lấy thông tin nhóm:", err.message);
        }
    };

    const fetchPostsByGroup = async () => {
        try {
            const res = await fetch(`${process.env.REACT_APP_API_URL}/posts/group/${groupId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Không thể lấy bài đăng nhóm.");
            const data = await res.json();
            setPosts(data.content || []);
        } catch (err) {
            console.error("Lỗi khi lấy bài đăng nhóm:", err.message);
        }
    };

    const handleJoinGroup = async () => {
        try {
            const res = await fetch(`${process.env.REACT_APP_API_URL}/groups/${groupId}/join`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || "Không thể tham gia nhóm.");
            }
            setIsMember(true);
            toast.success("Tham gia nhóm thành công!");
        } catch (err) {
            console.error("Lỗi khi tham gia nhóm:", err.message);
            toast.error(err.message);
        }
    };

    const handleLeaveGroup = async () => {
        try {
            const res = await fetch(`${process.env.REACT_APP_API_URL}/groups/${groupId}/leave`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || "Không thể rời nhóm.");
            }
            setIsMember(false);
            toast.success("Rời nhóm thành công!");
        } catch (err) {
            console.error("Lỗi khi rời nhóm:", err.message);
            toast.error(err.message);
        }
    };

    if (loading) return <div className="text-center py-4">Đang tải...</div>;
    if (!groupInfo) return <div className="text-center py-4">Không tìm thấy nhóm.</div>;

    return (
        <div className="container-fluid">
            <div className="row">
                {/* Sidebar Left */}
                <div className="col-lg-3 d-none d-lg-block p-0">
                    <div
                        style={{
                            position: "sticky",
                            top: 0,
                            height: "100vh",
                            overflowY: "auto",
                        }}
                    >
                        <CommunitySidebarLeft
                            selectedView={viewMode}
                            onSelectView={setViewMode}
                            onToggleDarkMode={handleToggleDarkMode}
                            isDarkMode={isDarkMode}
                            onGroupCreated={handleGroupCreated}
                        />
                    </div>
                </div>

                {/* Wrapper: Content + SidebarRight */}
                <div className="col-lg-9 p-0">
                    <div className="row m-0">
                        {/* Center Content */}
                        <div className="col-lg-8 p-4 border-end">
                            {/* Group Info */}
                            <div className="mb-6 flex items-center gap-4">
                                <img
                                    src={groupInfo.avatarUrl || "https://via.placeholder.com/80"}
                                    alt={groupInfo.name}
                                    className="w-16 h-16 rounded-full object-cover"
                                />
                                <div className="flex-1">
                                    <h1 className="text-2xl font-bold">{groupInfo.name}</h1>
                                    <p className="text-sm text-gray-500">{groupInfo.description}</p>
                                    <p className="text-sm text-gray-500">
                                        Ngày tạo: {new Date(groupInfo.createdAt).toLocaleDateString()}
                                    </p>
                                    <div className="mt-2 flex gap-2">
                                        {groupInfo.inviteStatus === "PENDING" && (
                                            <p className="text-sm text-warning">Đang chờ duyệt vào nhóm</p>
                                        )}
                                        {!isMember &&
                                            !groupInfo.isOwner &&
                                            !groupInfo.isAdmin &&
                                            groupInfo.inviteStatus !== "PENDING" &&
                                            (groupInfo.privacyLevel === "private" || groupInfo.privacyLevel === "hidden") && (
                                                <Button variant="primary" size="sm" onClick={handleJoinGroup}>
                                                    Yêu cầu tham gia
                                                </Button>
                                            )}
                                        {isMember && (
                                            <Button variant="outline-danger" size="sm" onClick={handleLeaveGroup}>
                                                Rời nhóm
                                            </Button>
                                        )}
                                        {(groupInfo.isAdmin || groupInfo.isOwner) && (
                                            <Button variant="primary" size="sm" onClick={() => setShowInviteModal(true)}>
                                                Mời thành viên
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Dropdown menu */}
                            <Dropdown align="end">
                                <Dropdown.Toggle variant="light" className="border px-2">⋯</Dropdown.Toggle>
                                <Dropdown.Menu>
                                    <Dropdown.Item onClick={() => alert("Báo cáo nhóm")}>Báo cáo nhóm</Dropdown.Item>
                                    <Dropdown.Item onClick={() => navigate(`/my-group-posts/${groupId}`)}>Bài đăng của tôi</Dropdown.Item>
                                    <Dropdown.Item onClick={() => navigate(`/groups/${groupId}/members`)}>Xem danh sách thành viên</Dropdown.Item>
                                    {(groupInfo.isAdmin || groupInfo.isOwner) && (
                                        <>
                                            <Dropdown.Divider />
                                            <Dropdown.Item className="text-danger" onClick={() => alert("Xóa nhóm")}>
                                                Xóa nhóm
                                            </Dropdown.Item>
                                            <Dropdown.Item onClick={() => navigate(`/groups/${groupId}/manage-admins`)}>
                                                Trao quyền quản trị viên
                                            </Dropdown.Item>
                                        </>
                                    )}
                                </Dropdown.Menu>
                            </Dropdown>

                            {/* Post Form */}
                            {isMember && (
                                <div className="mt-4">
                                    <TweetInput onPostSuccess={fetchPostsByGroup} groupId={groupId} />
                                </div>
                            )}

                            {/* Danh sách bài đăng */}
                            <div className="space-y-4 mt-4">
                                {posts.length > 0 ? (
                                    posts.map((post) => (
                                        <TweetCard
                                            key={post.id}
                                            tweet={post}
                                            onPostUpdate={fetchPostsByGroup}
                                            savedPosts={posts.filter((p) => p.isSaved)}
                                        />
                                    ))
                                ) : (
                                    <p>Chưa có bài đăng nào trong nhóm này.</p>
                                )}
                            </div>
                        </div>

                        {/* Sidebar Right */}
                        <div className="col-lg-4 d-none d-lg-block p-0">
                            <SidebarRight />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
