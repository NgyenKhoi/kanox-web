import React from "react";
import { Button, Image, Spinner } from "react-bootstrap";
import { Link } from "react-router-dom";
import useMedia from "../../hooks/useMedia";
import FriendshipButton from "../friendship/FriendshipButton";
import FollowActionButton from "../utils/FollowActionButton";

function FriendItem({ user, showActions, handleAccept, handleReject, onAction }) {
    const { mediaUrl: avatarUrl, loading: mediaLoading } = useMedia(user.id, "PROFILE", "image");

    const renderAvatar = () => {
        if (mediaLoading) {
            return <Spinner animation="border" size="sm" className="me-3 mt-1" />;
        }
        return (
            <Image
                src={avatarUrl || "https://placehold.co/40x40"}
                alt={user.displayName || user.username}
                roundedCircle
                width={50}
                height={50}
                className="me-3"
                style={{ objectFit: "cover" }}
            />
        );
    };

    return (
        <div className="d-flex align-items-center py-3 border-bottom">
            <Link to={`/profile/${user.username}`}>
                {renderAvatar()}
            </Link>
            <div className="flex-grow-1">
                <Link
                    to={`/profile/${user.username}`}
                    className="text-dark text-decoration-none fw-bold"
                >
                    {user.displayName || user.username}
                </Link>
                <p className="text-secondary small mb-0">@{user.username}</p>
            </div>
            {showActions ? (
                <div className="d-flex gap-2">
                    <Button
                        variant="primary"
                        size="sm"
                        className="rounded-pill px-3"
                        onClick={() => handleAccept(user.id)}
                    >
                        Chấp nhận
                    </Button>
                    <Button
                        variant="outline-secondary"
                        size="sm"
                        className="rounded-pill px-3"
                        onClick={() => handleReject(user.id)}
                    >
                        Từ chối
                    </Button>
                </div>
            ) : (
                <div className="d-flex gap-2">
                    <FriendshipButton targetId={user.id} />
                    <FollowActionButton targetId={user.id} />
                </div>
            )}
        </div>
    );
}

export default FriendItem;