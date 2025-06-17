// src/components/messages/UserSelectionModal/UserSelectionModal.js
import React, { useState, useEffect, useContext } from "react";
import {
  Modal,
  Form,
  Button,
  ListGroup,
  Spinner,
  InputGroup,
  Image,
} from "react-bootstrap";
import { FaSearch, FaUserPlus } from "react-icons/fa";
import { AuthContext } from "../../context/AuthContext";
import { toast } from "react-toastify";

function UserSelectionModal({ show, handleClose }) {
  const { token, user } = useContext(AuthContext); // Get token and current user from AuthContext
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [sendingRequest, setSendingRequest] = useState(false);
  const [sentRequests, setSentRequests] = useState({}); // To track sent requests

  // Debounce search term to avoid excessive API calls
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (show) {
        // Only fetch when modal is open
        fetchUsers(searchTerm);
      }
    }, 500); // 500ms delay

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, show, token]);

  const fetchUsers = async (query) => {
    if (!token || !query) {
      setUsers([]);
      return;
    }
    setLoadingUsers(true);
    try {
      // Assuming a user search endpoint like /users/search?q=
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/users/search?q=${encodeURIComponent(
          query
        )}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch users");
      }

      const data = await response.json();
      // Filter out the current logged-in user from the search results
      setUsers(data.filter((u) => u.id !== user.id)); // Assuming user object has an 'id'
    } catch (error) {
      toast.error("Lỗi khi tìm người dùng: " + error.message);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSendFriendRequest = async (targetUserId) => {
    if (sendingRequest || sentRequests[targetUserId]) return;

    setSendingRequest(true);
    try {
      const response = await fetch(
          `${process.env.REACT_APP_API_URL}/friends/request`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ targetUserId }),
          }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to send friend request");
      }

      // Tạo chat mới sau khi gửi yêu cầu kết bạn
      const chatResponse = await fetch(
          `${process.env.REACT_APP_API_URL}/chat/create`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ targetUserId }),
          }
      );

      if (!chatResponse.ok) {
        const errorData = await chatResponse.json();
        throw new Error(errorData.message || "Failed to create chat");
      }

      toast.success("Đã gửi yêu cầu kết bạn và tạo chat mới!");
      setSentRequests((prev) => ({ ...prev, [targetUserId]: true }));
      handleClose(); // Đóng modal sau khi thành công
    } catch (error) {
      toast.error("Lỗi: " + error.message);
    } finally {
      setSendingRequest(false);
    }
  };

  return (
    <Modal show={show} onHide={handleClose} centered size="md">
      <Modal.Header closeButton>
        <Modal.Title className="fw-bold">Tin nhắn mới</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <InputGroup className="mb-3">
          <InputGroup.Text className="bg-light border-0 rounded-pill ps-3">
            <FaSearch className="text-muted" />
          </InputGroup.Text>
          <Form.Control
            type="text"
            placeholder="Tìm kiếm theo tên hoặc email"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-light border-0 rounded-pill py-2"
            style={{ height: "auto" }}
          />
        </InputGroup>

        {loadingUsers ? (
          <div className="d-flex justify-content-center my-3">
            <Spinner animation="border" role="status" />
          </div>
        ) : (
          <ListGroup variant="flush">
            {users.length > 0
              ? users.map((u) => (
                  <ListGroup.Item
                    key={u.id}
                    className="d-flex align-items-center justify-content-between p-2"
                  >
                    <div className="d-flex align-items-center">
                      <Image
                        src={
                          u.profilePicture || "https://via.placeholder.com/40"
                        } // Placeholder if no profile pic
                        roundedCircle
                        width="40"
                        height="40"
                        className="me-2"
                      />
                      <div>
                        <p className="fw-bold mb-0">{u.username || u.email}</p>{" "}
                        {/* Assuming username or email */}
                        <p className="text-muted small mb-0">
                          @{u.handle || u.username}
                        </p>{" "}
                        {/* Assuming handle or username */}
                      </div>
                    </div>
                    {sentRequests[u.id] ? (
                      <Button variant="outline-secondary" size="sm" disabled>
                        Đã gửi
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleSendFriendRequest(u.id)}
                        disabled={sendingRequest}
                      >
                        <FaUserPlus className="me-1" />
                        Gửi yêu cầu
                      </Button>
                    )}
                  </ListGroup.Item>
                ))
              : searchTerm.length > 0 && (
                  <p className="text-center text-muted p-4">
                    Không tìm thấy người dùng nào.
                  </p>
                )}
          </ListGroup>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Đóng
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default UserSelectionModal;
