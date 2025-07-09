import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button, Dropdown, Row, Col, Modal, ListGroup, Form } from "react-bootstrap"; // Thêm Modal, ListGroup, Form
import { AuthContext } from "../../context/AuthContext";
import TweetCard from "../../components/posts/TweetCard/TweetCard";
import TweetInput from "../../components/posts/TweetInput/TweetInput";
import { toast } from "react-toastify";
import SidebarRight from "../../components/layout/SidebarRight/SidebarRight";

export default function GroupCommunityPage() {
    const { groupId } = useParams();
    const { user, token } = useContext(AuthContext);
    const navigate = useNavigate();

    const [groupInfo, setGroupInfo] = useState(null);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isMember, setIsMember] = useState(false);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [showJoinRequestsModal, setShowJoinRequestsModal] = useState(false); // Thêm state
    const [joinRequests, setJoinRequests] = useState([]); // Thêm state

    useEffect(() => {
        if (!groupId || !token) return;
        const fetchGroupData = async () => {
            try {
                await Promise.all([fetchGroupDetail(), fetchPostsByGroup()]);
                if (groupInfo?.isAdmin || groupInfo?.isOwner) {
                    await fetchJoinRequests(); // Gọi fetchJoinRequests khi là admin/owner
                }
                setLoading(false);
            } catch (err) {
                console.error("Lỗi khi tải dữ liệu nhóm:", err.message);
                setLoading(false);
            }
        };
        fetchGroupData();
    }, [groupId, token, groupInfo?.isAdmin, groupInfo?.isOwner]); // Thêm groupInfo.isAdmin, groupInfo.isOwner vào dependency

    const fetchGroupDetail = async () => {
        try {
            const res = await fetch(`${process.env.REACT_APP_API_URL}/groups/${groupId}/detail`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Không thể lấy thông tin nhóm.");
            const data = await res.json();
            setGroupInfo(data);
            setIsMember(data.member || false);
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

    const fetchJoinRequests = async () => {
        try {
            const res = await fetch(
                `${process.env.REACT_APP_API_URL}/groups/${groupId}/join-requests?adminUsername=${user.username}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!res.ok) throw new Error("Không thể lấy danh sách yêu cầu tham gia.");
            const data = await res.json();
            setJoinRequests(data);
        } catch (err) {
            console.error("Lỗi khi lấy danh sách yêu cầu tham gia:", err.message);
        }
    };

    const handleJoinGroup = async () => {
        try {
            let res;

            if (groupInfo.privacyLevel === "public") {
                res = await fetch(`${process.env.REACT_APP_API_URL}/groups/${groupId}/join`, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ userId: user.id }), // hoặc username nếu backend dùng username
                });
            } else if (groupInfo.privacyLevel === "private") {
                res = await fetch(`${process.env.REACT_APP_API_URL}/groups/${groupId}/request-join`, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ userId: user.id }),
                });
            }

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || "Không thể tham gia nhóm.");
            }

            if (groupInfo.privacyLevel === "public") {
                setIsMember(true);
                toast.success("Tham gia nhóm thành công!");
            } else {
                setGroupInfo({ ...groupInfo, inviteStatus: "PENDING" });
                toast.success("Yêu cầu tham gia đã được gửi!");
            }
        } catch (err) {
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
            setGroupInfo({ ...groupInfo, inviteStatus: null });
            toast.success("Rời nhóm thành công!");
        } catch (err) {
            toast.error(err.message);
        }
    };

    const handleApproveRequest = async (userId) => {
        try {
            const res = await fetch(
                `${process.env.REACT_APP_API_URL}/groups/${groupId}/approve-join-request?userId=${userId}&adminUsername=${user.username}`,
                {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!res.ok) throw new Error("Không thể duyệt yêu cầu.");
            setJoinRequests(joinRequests.filter((req) => req.id !== userId));
            toast.success("Đã duyệt yêu cầu tham gia!");
        } catch (err) {
            toast.error(err.message);
        }
    };

    const handleRejectRequest = async (userId) => {
        try {
            const res = await fetch(
                `${process.env.REACT_APP_API_URL}/groups/${groupId}/reject-join-request?userId=${userId}&adminUsername=${user.username}`,
                {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!res.ok) throw new Error("Không thể từ chối yêu cầu.");
            setJoinRequests(joinRequests.filter((req) => req.id !== userId));
            toast.success("Đã từ chối yêu cầu tham gia!");
        } catch (err) {
            toast.error(err.message);
        }
    };

    // Modal mời thành viên
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

    // Modal quản lý yêu cầu tham gia
    const JoinRequestsModal = ({ show, onHide, joinRequests }) => {
        return (
            <Modal show={show} onHide={onHide} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Quản lý yêu cầu tham gia</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {joinRequests.length > 0 ? (
                        <ListGroup>
                            {joinRequests.map((request) => (
                                <ListGroup.Item key={request.id} className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <strong>{request.displayName || request.username}</strong>
                                    </div>
                                    <div>
                                        <Button
                                            variant="success"
                                            size="sm"
                                            className="me-2"
                                            onClick={() => handleApproveRequest(request.id)}
                                        >
                                            Duyệt
                                        </Button>
                                        <Button variant="danger" size="sm" onClick={() => handleRejectRequest(request.id)}>
                                            Từ chối
                                        </Button>
                                    </div>
                                </ListGroup.Item>
                            ))}
                        </ListGroup>
                    ) : (
                        <p>Không có yêu cầu tham gia nào.</p>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={onHide}>
                        Đóng
                    </Button>
                </Modal.Footer>
            </Modal>
        );
    };

    if (loading) return <div className="text-center py-4">Đang tải...</div>;
    if (!groupInfo) return <div className="text-center py-4">Không tìm thấy nhóm.</div>;
    const canViewContent = isMember || groupInfo.privacyLevel === "public";

    return (
        <Row className="m-0 h-100 w-100">
            {/* Nội dung chính */}
            <Col xs={12} lg={8} className="p-0 border-end">
                <div className="px-4 py-3">
                    {/* Banner */}
                    <img
                        src={groupInfo.avatarUrl || "https://via.placeholder.com/1200x300"}
                        alt="Banner"
                        className="w-full h-[250px] object-cover mb-3"
                    />

                    {/* Header info */}
                    <h1 className="text-2xl font-bold">{groupInfo.name}</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{groupInfo.description}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Ngày tạo: {new Date(groupInfo.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{groupInfo.memberCount || 0} thành viên</p>
                    {groupInfo.friendInGroup && (
                        <p
                            className="text-sm text-blue-600 hover:underline cursor-pointer"
                            onClick={() => navigate(`/profile/${groupInfo.friendInGroup.username}`)}
                        >
                            {groupInfo.friendInGroup.displayName || groupInfo.friendInGroup.username} cũng đang ở trong nhóm này
                        </p>
                    )}

                    {/* Action buttons */}
                    <div className="mt-3 flex gap-2 flex-wrap">
                        {groupInfo.inviteStatus === "PENDING" && (
                            <p className="text-sm text-yellow-500">Đang chờ duyệt vào nhóm</p>
                        )}
                        {!isMember &&
                            !groupInfo.isOwner &&
                            !groupInfo.isAdmin &&
                            groupInfo.inviteStatus !== "PENDING" && (
                                <>
                                    {groupInfo.privacyLevel === "public" && (
                                        <Button variant="primary" size="sm" onClick={handleJoinGroup}>
                                            Tham gia nhóm
                                        </Button>
                                    )}
                                    {groupInfo.privacyLevel === "private" && (
                                        <Button variant="primary" size="sm" onClick={handleJoinGroup}>
                                            Yêu cầu tham gia
                                        </Button>
                                    )}
                                    {groupInfo.privacyLevel === "hidden" && (
                                        <p className="text-sm text-muted">Bạn cần được mời để tham gia nhóm này.</p>
                                    )}
                                </>
                            )}
                        {isMember && (
                            <Button variant="outline-danger" size="sm" onClick={handleLeaveGroup}>
                                Rời nhóm
                            </Button>
                        )}
                        {(groupInfo.isAdmin || groupInfo.isOwner) && (
                            <>
                                <Button variant="primary" size="sm" onClick={() => setShowInviteModal(true)}>
                                    Mời thành viên
                                </Button>
                                <Button variant="primary" size="sm" onClick={() => setShowJoinRequestsModal(true)}>
                                    Quản lý yêu cầu tham gia
                                </Button>
                            </>
                        )}
                    </div>

                    {/* Dropdown Menu */}
                    <div className="mt-3">
                        <Dropdown align="end">
                            <Dropdown.Toggle variant="light" className="border px-2">
                                ⋯
                            </Dropdown.Toggle>
                            <Dropdown.Menu>
                                <Dropdown.Item onClick={() => alert("Báo cáo nhóm")}>Báo cáo nhóm</Dropdown.Item>
                                <Dropdown.Item onClick={() => navigate(`/my-group-posts/${groupId}`)}>
                                    Bài đăng của tôi
                                </Dropdown.Item>
                                <Dropdown.Item onClick={() => navigate(`/groups/${groupId}/members`)}>
                                    Xem danh sách thành viên
                                </Dropdown.Item>
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
                    </div>

                    {/* Nội dung bài đăng */}
                    {canViewContent ? (
                        <>
                            {isMember && (
                                <div className="mt-4">
                                    <TweetInput onPostSuccess={fetchPostsByGroup} groupId={groupId} />
                                </div>
                            )}
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
                                    <p className="text-muted">Chưa có bài đăng nào trong nhóm này.</p>
                                )}
                            </div>
                        </>
                    ) : (
                        <p className="text-muted mt-4">
                            Đây là nhóm <strong>{groupInfo.privacyLevel}</strong>. Bạn cần tham gia để xem nội dung.
                        </p>
                    )}
                </div>
            </Col>

            {/* SidebarRight */}
            <Col xs={0} lg={4} className="d-none d-lg-block p-0 border-start">
                <SidebarRight />
            </Col>

            {/* Modal mời thành viên */}
            <InviteMemberModal show={showInviteModal} onHide={() => setShowInviteModal(false)} groupId={groupId} token={token} />

            {/* Modal quản lý yêu cầu tham gia */}
            <JoinRequestsModal show={showJoinRequestsModal} onHide={() => setShowJoinRequestsModal(false)} joinRequests={joinRequests} />
        </Row>
    );
}