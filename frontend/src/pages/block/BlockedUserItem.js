import React from "react";
import { ListGroup, Button, Image } from "react-bootstrap";
import { FaUserSlash } from "react-icons/fa";
import useMedia from "../../hooks/useMedia";
import { Spinner } from "react-bootstrap";

function BlockedUserItem({ blockedUser, handleUnblock }) {
    const { mediaUrl: avatarUrl, loading: mediaLoading } = useMedia(blockedUser.id, "PROFILE", "image");

    const renderAvatar = () => {
        if (mediaLoading) {
            return <Spinner animation="border" size="sm" className="me-3 mt-1" />;
        }
        return (
            <Image
                src={avatarUrl || "https://placehold.co/40x40"}
                alt={blockedUser.displayName || blockedUser.username}
                roundedCircle
                width={40}
                height={40}
                className="me-3"
                style={{ objectFit: "cover" }}
            />
        );
    };

    return (
        <ListGroup.Item className="d-flex align-items-center py-3">
            {avatarUrl ? renderAvatar() : <FaUserSlash className="me-3 text-muted" size={24} />}
            <div className="flex-grow-1">
                <div className="fw-bold text-dark">{blockedUser.displayName || blockedUser.username}</div>
                <div className="text-muted">@{blockedUser.username}</div>
            </div>
            <Button
                variant="outline-primary"
                className="rounded-pill px-3"
                onClick={() => handleUnblock(blockedUser.id)}
            >
                Bỏ chặn
            </Button>
        </ListGroup.Item>
    );
}

export default BlockedUserItem;