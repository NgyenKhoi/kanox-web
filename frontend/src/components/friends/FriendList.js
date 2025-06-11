import React, { useState } from "react";
import { ListGroup, Image, Button, Alert } from "react-bootstrap";
import { Link } from "react-router-dom";
import FriendshipButton from "../friendship/FriendshipButton"; // Đổi tên từ FriendButton
import FollowActionButton from "../utils/FollowActionButton"; // Đổi tên từ FollowButton

function FriendList({ users, showActions = false, onAction }) {
    const [error, setError] = useState(null);

    const handleAccept = async (friendshipId) => {
        setError(null);
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                throw new Error("Không tìm thấy token. Vui lòng đăng nhập lại.");
            }

            const response = await fetch(
                `${process.env.REACT_APP_API_URL}/friendships/accept/${friendshipId}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Không thể chấp nhận lời mời!");
            }
            if (onAction) {
                onAction();
            }
        } catch (error) {
            console.error("Error accepting friend request:", error);
            setError(error.message || "Không thể chấp nhận lời mời");
        }
    };

    const handleReject = async (friendshipId) => {
        setError(null);
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                throw new Error("Không tìm thấy token. Vui lòng đăng nhập lại.");
            }

            const response = await fetch(
                `${process.env.REACT_APP_API_URL}/friendships/reject/${friendshipId}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Không thể từ chối lời mời!");
            }
            if (onAction) {
                onAction();
            }
        } catch (error) {
            console.error("Error rejecting friend request:", error);
            setError(error.message || "Không thể từ chối lời mời");
        }
    };

    if (!users || users.length === 0) {
        return <p className="text-dark text-center py-4">Không có dữ liệu để hiển thị!</p>;
    }

    return (
        <>
            {error && (
                <Alert variant="danger" onClose={() => setError(null)} dismissible>
                    {error}
                </Alert>
            )}
            <ListGroup variant="flush">
                {users.map((user) => (
                    <ListGroup.Item key={user.id} className="d-flex align-items-center py-3">
                        <Link to={`/profile/${user.username}`}>
                            <Image
                                src={user.photo || "https://via.placeholder.com/50?text=Avatar"}
                                roundedCircle
                                style={{ width: "50px", height: "50px", objectFit: "cover" }}
                                className="me-3"
                            />
                        </Link>
                        <div className="flex-grow-1">
                            <Link
                                to={`/profile/${user.username}`}
                                className="text-dark text-decoration-none"
                            >
                                {user.displayName || user.username}
                            </Link>
                            <p className="text-secondary small mb-0">@{user.username}</p>
                        </div>
                        {showActions ? (
                            <div className="d-flex">
                                <Button
                                    variant="primary"
                                    size="sm"
                                    className="me-2"
                                    onClick={() => handleAccept(user.friendshipId)} // Giả định user có friendshipId
                                >
                                    Chấp nhận
                                </Button>
                                <Button
                                    variant="outline-secondary"
                                    size="sm"
                                    onClick={() => handleReject(user.friendshipId)} // Giả định user có friendshipId
                                >
                                    Từ chối
                                </Button>
                            </div>
                        ) : (
                            <div className="d-flex">
                                <FriendshipButton targetId={user.id} />
                                <FollowActionButton targetId={user.id} />
                            </div>
                        )}
                    </ListGroup.Item>
                ))}
            </ListGroup>
        </>
    );
}

export default FriendList;