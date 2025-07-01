import React, { useContext } from "react";
import {
  Modal,
  Form,
  ListGroup,
  Spinner,
  InputGroup,
  Image,
  Button,
} from "react-bootstrap";
import { FaSearch } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { toast } from "react-toastify";
import useSingleMedia from "../../hooks/useSingleMedia";

const UserAvatar = ({ userId, username, onClick }) => {
  const { mediaUrl: avatarUrl, loading: avatarLoading } = useSingleMedia(
      userId,
      "PROFILE",
      "image"
  );

  return (
      <div onClick={onClick} style={{ cursor: "pointer" }}>
        {avatarLoading ? (
            <div
                className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center me-2"
                style={{ width: "40px", height: "40px" }}
            >
              <Spinner animation="border" size="sm" />
            </div>
        ) : avatarUrl ? (
            <Image
                src={avatarUrl}
                roundedCircle
                width="40"
                height="40"
                className="me-2"
                alt={`Avatar của ${username}`}
            />
        ) : (
            <div
                className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center me-2"
                style={{ width: "40px", height: "40px" }}
            >
              <span>{username?.charAt(0).toUpperCase() || "U"}</span>
            </div>
        )}
      </div>
  );
};

function UserSelectionModal({
                              show,
                              handleClose,
                              searchKeyword,
                              setSearchKeyword,
                              searchResults,
                              isSearching,
                              handleSelectUser,
                            }) {
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);

  const handleSelectUserWithAuth = async (userId) => {
    if (!token) {
      toast.error("Vui lòng đăng nhập lại để tạo tin nhắn.");
      navigate("/login");
      return;
    }
    try {
      await handleSelectUser(userId);
      handleClose();
    } catch (err) {
      toast.error("Lỗi khi chọn người dùng: " + err.message);
    }
  };

  return (
      <Modal show={show} onHide={handleClose} centered size="md" className="bg-[var(--background-color)] text-[var(--text-color)]">
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">Tin nhắn mới</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <InputGroup className="mb-3 rounded-pill shadow-sm">
            <InputGroup.Text className="bg-[var(--background-color)] border-0 rounded-pill ps-3">
              <FaSearch className="text-[var(--text-color-muted)]" />
            </InputGroup.Text>
            <Form.Control
                type="text"
                placeholder="Tìm kiếm theo tên hoặc email"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="bg-[var(--input-bg-color)] border-0 rounded-pill py-2"
                autoFocus
            />
          </InputGroup>

          {isSearching ? (
              <div className="d-flex justify-content-center my-3">
                <Spinner animation="border" role="status" />
              </div>
          ) : (
              <ListGroup variant="flush">
                {searchResults.length > 0 ? (
                    searchResults.map((user) => (
                        <ListGroup.Item
                            key={user.id}
                            className="d-flex align-items-center p-2 hover-bg-[var(--background-color)]"
                        >
                          <UserAvatar
                              userId={user.id}
                              username={user.username}
                              onClick={() => navigate(`/profile/${user.username}`)}
                          />
                          <div className="flex-grow-1">
                            <p
                                className="fw-bold mb-0"
                                onClick={() => navigate(`/profile/${user.username}`)}
                                style={{ cursor: "pointer" }}
                            >
                              {user.displayName || user.username}
                            </p>
                            <p className="text-muted small mb-0">@{user.username}</p>
                          </div>
                          <Button
                              variant="primary"
                              size="sm"
                              className="rounded-pill"
                              onClick={() => handleSelectUserWithAuth(user.id)}
                          >
                            Nhắn tin
                          </Button>
                        </ListGroup.Item>
                    ))
                ) : searchKeyword.length > 0 ? (
                    <p className="text-center text-muted p-4">
                      Không tìm thấy người dùng nào.
                    </p>
                ) : (
                    <p className="text-center text-muted p-4">
                      Nhập tên hoặc email để tìm kiếm.
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