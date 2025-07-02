import React, { useContext, useState } from "react";
import { ListGroup, Alert } from "react-bootstrap";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthContext } from "../../context/AuthContext";
import FriendItem from "./FriendItem"; // Import FriendItem

function FriendList({ users, showActions = false, onAction }) {
    const { user } = useContext(AuthContext);
    const [error, setError] = useState(null);

    const handleAccept = async (userId) => {
        setError(null);
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                throw new Error("Không tìm thấy token. Vui lòng đăng nhập lại.");
            }

            const response = await fetch(
                `${process.env.REACT_APP_API_URL}/friends/accept/${userId}`,
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
            toast.error(error.message || "Không thể chấp nhận lời mời");
        }
    };

    const handleReject = async (userId) => {
        setError(null);
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                throw new Error("Không tìm thấy token. Vui lòng đăng nhập lại.");
            }

            const response = await fetch(
                `${process.env.REACT_APP_API_URL}/friends/reject/${userId}`,
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
            toast.error(error.message || "Không thể từ chối lời mời");
        }
    };

    if (!users || users.length === 0) {
        return <p className="text-dark text-center py-4">Không có dữ liệu để hiển thị!</p>;
    }

    return (
        <>
            <ToastContainer />
            {error && (
                <Alert variant="danger" onClose={() => setError(null)} dismissible>
                    {error}
                </Alert>
            )}
            <ListGroup variant="flush">
                {users.map((user) => (
                    <FriendItem
                        key={user.id}
                        user={user}
                        showActions={showActions}
                        handleAccept={handleAccept}
                        handleReject={handleReject}
                        onAction={onAction}
                    />
                ))}
            </ListGroup>
        </>
    );
}

export default FriendList;