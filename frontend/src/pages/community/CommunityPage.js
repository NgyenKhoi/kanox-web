    import React, { useState, useEffect, useContext } from "react";
    import { Container, Row, Col, Spinner, Card } from "react-bootstrap";
    import { FaSearch } from "react-icons/fa";
    import { useNavigate } from "react-router-dom";
    import { toast } from "react-toastify";
    import { AuthContext } from "../../context/AuthContext";
    import SidebarRight from "../../components/layout/SidebarRight/SidebarRight";
    import CommunitySidebarLeft from "../../components/community/CommunitySidebarLeft";
    import TweetCard from "../../components/posts/TweetCard/TweetCard";

    function CommunityPage({ selectedView, onSelectView, onToggleDarkMode, isDarkMode, refreshTrigger }) {
        const navigate = useNavigate();
        const {
            user,
            token,
            loading: authLoading,
            isSyncing,
        } = useContext(AuthContext);
        const [posts, setPosts] = useState([]);
        const [yourGroups, setYourGroups] = useState([]);
        const [loading, setLoading] = useState(true);
        const [error, setError] = useState(null);
        


        // Fetch posts or groups based on viewMode
        const fetchData = async () => {
            if (!token || !user?.username) {
                setError("Vui lòng đăng nhập để xem nội dung.");
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                if (selectedView === "feed") {
                    const res = await fetch(
                        `${process.env.REACT_APP_API_URL}/posts/community-feed`,
                        {
                            headers: { Authorization: `Bearer ${token}` },
                        }
                    );
                    if (!res.ok) throw new Error("Không thể lấy bài đăng.");
                    const response = await res.json();
                    setPosts(response.data || []);
                } else if (selectedView === "yourGroups") {
                    const res = await fetch(
                        `${process.env.REACT_APP_API_URL}/groups/your-groups?username=${user.username}`,
                        {
                            headers: { Authorization: `Bearer ${token}` },
                        }
                    );
                    if (!res.ok) throw new Error("Không thể lấy danh sách nhóm.");
                    const data = await res.json();
                    setYourGroups(
                        data.map((group) => ({
                            id: group.id,
                            name: group.name,
                            avatar: group.avatarUrl || "https://via.placeholder.com/40",
                            description: group.description,
                            isJoined: true,
                        }))
                    );
                }
            } catch (err) {
                setError("Lỗi khi tải dữ liệu: " + err.message);
            } finally {
                setLoading(false);
            }
        };

        useEffect(() => {
            fetchData();
        }, [selectedView, token, user, refreshTrigger]);

        const handleCommunityClick = (id) => {
            navigate(`/community/${id}`);
        };

        // Show loading spinner if auth or syncing is in progress
        if (authLoading || isSyncing) {
            return (
                <div className="d-flex justify-content-center align-items-center min-vh-100">
                    <Spinner animation="border" role="status" />
                    <span className="ms-2">Đang tải dữ liệu...</span>
                </div>
            );
        }

        const handleJoinGroup = async (groupId) => {
            try {
                const response = await fetch(
                    `${process.env.REACT_APP_API_URL}/groups/${groupId}/request-join`,
                    {
                        method: "POST",
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ username: user.username }),
                    }
                );
                const result = await response.json();
                if (!response.ok) {
                    throw new Error(result.message || "Không thể gửi yêu cầu tham gia nhóm.");
                }
                toast.success("Đã gửi yêu cầu tham gia nhóm!");
                fetchData(); // Làm mới danh sách nhóm
            } catch (err) {
                if (err.message.includes("đã gửi yêu cầu")) {
                    toast.info("Bạn đã gửi yêu cầu trước đó, vui lòng chờ duyệt");
                } else if (err.message.includes("đã là thành viên")) {
                    toast.info("Bạn đã là thành viên của nhóm này");
                } else {
                    toast.error("Lỗi: " + err.message);
                }
            }
        };

        return (
            <Container fluid className="p-0 min-vh-100 bg-[var(--background-color)] text-[var(--text-color)] transition-colors duration-200">
                <Row className="m-0 h-100">
                    {/* SidebarLeft */}

                    {/* Nội dung chính và SidebarRight */}
                    <Col xs={12} className="p-0">
                        <Row className="m-0 h-100">
                            {/* Nội dung trung tâm */}
                            <Col xs={12} lg={8} className="p-0 border-end">
                                <div className="sticky top-0 z-[1020] bg-[var(--background-color)] text-[var(--text-color)] font-bold text-lg px-3 py-2 border-b shadow-sm d-flex justify-content-between align-items-center">
                                    <h2 className="me-auto">Cộng đồng</h2>
                                    <FaSearch frameBorder={0} size={20} />
                                </div>
                                {loading ? (
                                    <div className="text-center p-4">Đang tải...</div>
                                ) : error ? (
                                    <div className="text-danger text-center p-4">{error}</div>
                                ) : selectedView === "feed" ? (
                                    posts.length === 0 ? (
                                        <div className="text-center text-muted p-4">
                                            Không có bài đăng
                                        </div>
                                    ) : (
                                        posts.map((post) => (
                                            <TweetCard
                                                key={post.id}
                                                tweet={post}
                                                onPostUpdate={fetchData}
                                                savedPosts={posts.filter((p) => p.isSaved)}
                                            />
                                        ))
                                    )
                                ) : (
                                    yourGroups.map((group) => (
                                        <Card key={group.id} className="mb-3">
                                            <Card.Body className="d-flex">
                                                <img
                                                    src={group.avatar}
                                                    alt="Avatar"
                                                    className="rounded me-3"
                                                    style={{
                                                        width: "50px",
                                                        height: "50px",
                                                        objectFit: "cover",
                                                    }}
                                                />
                                                <div className="flex-grow-1">
                                                    <h5
                                                        className="mb-1"
                                                        style={{ cursor: "pointer" }}
                                                        onClick={() => handleCommunityClick(group.id)}
                                                    >
                                                        {group.name}
                                                    </h5>
                                                    <p className="mb-2 text-muted small">
                                                        {group.description}
                                                    </p>
                                                    {!group.isJoined && (
                                                        <button
                                                            className="btn btn-primary btn-sm"
                                                            onClick={() => handleJoinGroup(group.id)}
                                                        >
                                                            Tham gia
                                                        </button>
                                                    )}
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    ))
                                )}
                            </Col>

                            {/* SidebarRight */}
                            <Col xs={0} lg={4} className="d-none d-lg-block border-start p-0">
                                <SidebarRight />
                            </Col>
                        </Row>
                    </Col>
                </Row>
            </Container>
        );
    }

    export default CommunityPage;