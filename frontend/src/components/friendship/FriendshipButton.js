import React, { useState, useEffect, useContext } from "react";
import { Button } from "react-bootstrap";
import { AuthContext } from "../../context/AuthContext";

function FriendshipButton({ targetId, disabled, onAction }) {
  const { user } = useContext(AuthContext);
  const [status, setStatus] = useState("none");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || user.id === targetId) return;

    const fetchStatus = async () => {
      try {
        const token =
          sessionStorage.getItem("token") || localStorage.getItem("token");
        if (!token) throw new Error("Không tìm thấy token");

        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/friends/status/${targetId}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!response.ok) throw new Error("Không thể lấy trạng thái bạn bè");
        const data = await response.json();
        setStatus(data.status || "none"); // Đảm bảo trạng thái "none" nếu không có bản ghi
      } catch (err) {
        console.error("Lỗi khi lấy trạng thái bạn bè:", err);
      }
    };

    fetchStatus();
  }, [user, targetId]);

  const handleAction = async (action) => {
    setLoading(true);
    try {
      const token =
        sessionStorage.getItem("token") || localStorage.getItem("token");
      if (!token) throw new Error("Không tìm thấy token");

      let url, method;
      if (action === "send") {
        url = `${process.env.REACT_APP_API_URL}/friends/request/${targetId}`;
        method = "POST";
      } else if (action === "accept") {
        url = `${process.env.REACT_APP_API_URL}/friends/accept/${targetId}`;
        method = "PUT";
      } else if (action === "reject") {
        url = `${process.env.REACT_APP_API_URL}/friends/reject/${targetId}`;
        method = "PUT";
      } else if (action === "cancel") {
        url = `${process.env.REACT_APP_API_URL}/friends/${targetId}`;
        method = "DELETE";
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Hành động thất bại");
      setStatus(
        action === "send"
          ? "pendingSent"
          : action === "accept"
          ? "accepted"
          : action === "reject" || action === "cancel"
          ? "none"
          : status
      );
      if (onAction) onAction(); // Gọi callback để làm mới danh sách sentRequests
    } catch (err) {
      console.error("Lỗi:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.id === targetId) return null;

  return (
    <Button
      onClick={() =>
        handleAction(
          status === "none"
            ? "send"
            : status === "pendingReceived"
            ? "accept"
            : status === "pendingSent" || status === "accepted"
            ? "cancel"
            : "reject"
        )
      }
      disabled={loading || disabled}
      variant={
        status === "accepted"
          ? "outline-danger"
          : status === "pendingSent"
          ? "outline-secondary"
          : status === "pendingReceived"
          ? "primary"
          : status === "none"
          ? "success"
          : "primary"
      }
      className="rounded-pill px-3 py-1"
    >
      {status === "none" && "Kết bạn"}
      {status === "pendingSent" && "Đã gửi"}
      {status === "pendingReceived" && "Chấp nhận"}
      {status === "accepted" && "Hủy kết bạn"}
    </Button>
  );
}

export default FriendshipButton;
