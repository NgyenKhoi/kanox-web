import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Container, Row, Col, Spinner, Card } from "react-bootstrap";
import { FaSearch, FaRegComment, FaRetweet, FaHeart, FaShareAlt } from "react-icons/fa";

export default function GroupCommunityPage() {
    const { groupId } = useParams();
    const [groupInfo, setGroupInfo] = useState(null);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    const token = localStorage.getItem("token");

    useEffect(() => {
        if (!groupId || !token) return;

        const fetchGroupData = async () => {
            try {
                await Promise.all([fetchGroupDetail(), fetchPostsByGroup()]);
            } catch (err) {
                console.error("Lỗi khi tải dữ liệu nhóm:", err.message);
            }
        };

        fetchGroupData();
    }, [groupId, token]);

    const fetchGroupDetail = async () => {
        try {
            const res = await fetch(
                `${process.env.REACT_APP_API_URL}/groups/${groupId}/detail`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (!res.ok) throw new Error("Không thể lấy thông tin nhóm.");
            const data = await res.json();
            setGroupInfo(data);
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


    if (loading) return <div>Đang tải...</div>;
    if (!groupInfo) return <div>Không tìm thấy nhóm.</div>;

    return (
        <div className="p-4 max-w-3xl mx-auto">
            {/* Header Nhóm */}
            <div className="mb-6 flex items-center gap-4">
                <img
                    src={groupInfo.avatarUrl || "https://via.placeholder.com/80"}
                    alt={groupInfo.name}
                    className="w-16 h-16 rounded-full object-cover"
                />
                <div>
                    <h1 className="text-2xl font-bold">{groupInfo.name}</h1>
                    <p className="text-sm text-gray-500">{groupInfo.description}</p>
                </div>
            </div>

            {/* Danh sách bài đăng */}
            <div className="space-y-4">
                {posts.length > 0 ? (
                    posts.map((post) => (
                        <Card key={post.id} className="mb-3">
                            <Card.Body>
                                {/* Avatar và tên người đăng */}
                                <div className="d-flex align-items-start mb-2">
                                    <img
                                        src={post.owner.avatarUrl || "https://via.placeholder.com/40"}
                                        alt="User Avatar"
                                        className="rounded-circle me-2"
                                        width={40}
                                        height={40}
                                    />
                                    <div>
                                        <span className="fw-bold">{post.owner.displayName || post.owner.username}</span>
                                        <div className="text-muted small">
                                            {new Date(post.createdAt).toLocaleString()}
                                        </div>
                                    </div>
                                </div>

                                {/* Nội dung */}
                                <Card.Text>{post.content}</Card.Text>
                                {post.mediaUrls?.length > 0 && (
                                    <img
                                        src={post.mediaUrls[0]}
                                        className="img-fluid rounded"
                                        alt="Post"
                                    />
                                )}
                                {/* Reactions */}
                                <div className="d-flex justify-content-around mt-2 text-muted">
                                    <div><FaRegComment /> {post.commentCount}</div>
                                    <div><FaRetweet /> {post.shareCount}</div>
                                    <div><FaHeart /> {post.likeCount}</div>
                                    <div><FaShareAlt /> {post.shareCount}</div>
                                </div>
                            </Card.Body>
                        </Card>
                    ))
                ) : (
                    <p>Chưa có bài đăng nào trong nhóm này.</p>
                )}
            </div>
        </div>
    );
}
