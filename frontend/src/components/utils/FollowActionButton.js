import React, { useState, useEffect, useContext } from "react";
import { Button } from "react-bootstrap";
import { AuthContext } from "../../context/AuthContext";

function FollowActionButton({ targetId, disabled, onFollowChange }) {
  const { user } = useContext(AuthContext);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || user.id === targetId) return;

    const fetchFollowStatus = async () => {
      try {
        const token = sessionStorage.getItem("token") || localStorage.getItem("token");
        if (!token) throw new Error("Không tìm thấy token");

        const response = await fetch(
            `${process.env.REACT_APP_API_URL}/follows/status/${targetId}`,
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            }
        );
        if (!response.ok) throw new Error("Không thể lấy trạng thái theo dõi");
        const data = await response.json();
        setIsFollowing(data.isFollowing);
      } catch (err) {
        console.error("Lỗi khi lấy trạng thái theo dõi:", err);
      }
    };

    fetchFollowStatus();
  }, [user, targetId]);

  const handleAction = async (action) => {
    if (loading || disabled) return;
    setLoading(true);
    try {
      const token = sessionStorage.getItem("token") || localStorage.getItem("token");
      if (!token) throw new Error("Không tìm thấy token");

      const response = await fetch(
          `${process.env.REACT_APP_API_URL}/follows/${targetId}`,
          {
            method: action === "follow" ? "POST" : "DELETE",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
      );
      if (!response.ok) throw new Error(await response.text());
      const newIsFollowing = action === "follow";
      setIsFollowing(newIsFollowing);
      if (onFollowChange) onFollowChange(newIsFollowing);
    } catch (err) {
      console.error("Lỗi:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.id === targetId) return null;

  return (
      <Button
          onClick={() => handleAction(isFollowing ? "unfollow" : "follow")}
          disabled={loading || disabled}
          variant={isFollowing ? "secondary" : "primary"}
          className="rounded-pill px-3 py-1 ms-2"
      >
        {loading ? "Đang xử lý..." : isFollowing ? "Bỏ theo dõi" : "Theo dõi"}
      </Button>
  );
}

export default FollowActionButton;