import React, { useEffect, useState, useContext, useRef, useCallback } from "react";
import { Modal, Button, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { toast } from "react-toastify";
import useUserSearch from "../../hooks/useUserSearch";
import useSingleMedia from "../../hooks/useSingleMedia";

function InviteMemberModal({ show, onHide, groupId }) {
    const { token } = useContext(AuthContext);
    const navigate = useNavigate();

    const [users, setUsers] = useState([]);
    const [page, setPage] = useState(0);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    const {
        searchKeyword,
        setSearchKeyword,
        searchResults,
        isSearching,
        debouncedSearch,
    } = useUserSearch(token, navigate);

    const observer = useRef();
    const lastUserRef = useCallback(
        (node) => {
            if (loadingMore || !hasMore || searchKeyword.trim()) return; // ⛔ tránh gọi khi đang tìm kiếm
            if (observer.current) observer.current.disconnect();
            observer.current = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting) setPage((prev) => prev + 1);
            });
            if (node) observer.current.observe(node);
        },
        [loadingMore, hasMore, searchKeyword]
    );

    const fetchUsers = async () => {
        setLoadingMore(true);
        try {
            const res = await fetch(`${process.env.REACT_APP_API_URL}/users?page=${page}&size=5`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.length === 0) setHasMore(false);
            else setUsers((prev) => [...prev, ...data]);
        } catch (err) {
            console.error(err);
            toast.error("Không thể tải danh sách người dùng");
        } finally {
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        if (show && !searchKeyword.trim()) fetchUsers();
    }, [page, show, searchKeyword]);

    const handleInvite = async (userId) => {
        try {
            const res = await fetch(`${process.env.REACT_APP_API_URL}/groups/${groupId}/invite`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ userId }),
            });
            if (!res.ok) throw new Error("Mời không thành công");
            toast.success("Đã gửi lời mời");
        } catch (err) {
            toast.error("Lỗi khi mời: " + err.message);
        }
    };

    const UserItem = ({ user, refItem }) => {
        const { mediaUrl } = useSingleMedia(user.id, "PROFILE", "image");
        return (
            <div
                ref={refItem}
                className="flex items-center justify-between px-3 py-2 border-b cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
            >
                <div className="flex items-center gap-3" onClick={() => navigate(`/profile/${user.username}`)}>
                    <img src={mediaUrl || "https://via.placeholder.com/40"} alt="" className="w-8 h-8 rounded-full" />
                    <div className="text-sm">
                        <p className="font-semibold">{user.displayName || user.username}</p>
                        <p className="text-gray-500">@{user.username}</p>
                    </div>
                </div>
                <Button size="sm" onClick={() => handleInvite(user.id)}>Mời</Button>
            </div>
        );
    };

    const displayedUsers = searchKeyword.trim() ? searchResults : users;

    return (
        <Modal show={show} onHide={onHide} size="lg" centered scrollable>
            <Modal.Header closeButton>
                <Modal.Title>Mời thành viên vào nhóm</Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-3">
                <input
                    type="text"
                    className="form-control mb-3"
                    placeholder="Tìm kiếm người dùng"
                    value={searchKeyword}
                    onChange={(e) => {
                        setSearchKeyword(e.target.value);
                        debouncedSearch(e.target.value);
                    }}
                />

                {displayedUsers.length === 0 && !isSearching && (
                    <p className="text-muted text-center">Không có người dùng nào.</p>
                )}

                {displayedUsers.map((user, idx) => (
                    <UserItem
                        key={user.id}
                        user={user}
                        refItem={idx === displayedUsers.length - 1 && !searchKeyword.trim() ? lastUserRef : null}
                    />
                ))}

                {loadingMore && !searchKeyword && (
                    <div className="text-center mt-2">
                        <Spinner animation="border" size="sm" />
                    </div>
                )}
                {isSearching && (
                    <div className="text-center mt-2">
                        <Spinner animation="border" size="sm" />
                    </div>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>Đóng</Button>
            </Modal.Footer>
        </Modal>
    );
}

export default InviteMemberModal;
