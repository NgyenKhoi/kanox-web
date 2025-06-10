import React, { useState } from "react";
import { Modal, Form, ListGroup, Button } from "react-bootstrap";
import { FaSearch } from "react-icons/fa"; // Import search icon

function FollowListModal({ show, handleClose, title, users }) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.handle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Modal
      show={show}
      onHide={handleClose}
      centered
      scrollable
      className="follow-list-modal"
    >
      <Modal.Header
        closeButton
        className="d-flex justify-content-between align-items-center"
      >
        <Modal.Title className="ms-auto text-center w-100">{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-3">
        {/* Search Input */}
        <Form className="mb-3 d-flex align-items-center follow-list-search-input-wrapper">
          <FaSearch className="me-2 text-muted" />
          <Form.Control
            type="text"
            placeholder="Tìm kiếm người"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="rounded-pill border-0 bg-light flex-grow-1"
            style={{ boxShadow: "none" }}
          />
        </Form>

        {/* User List */}
        <ListGroup variant="flush">
          {filteredUsers.length === 0 ? (
            <p className="text-center text-muted mt-4">
              Không tìm thấy người dùng nào.
            </p>
          ) : (
            filteredUsers.map((user) => (
              <ListGroup.Item
                key={user.id}
                className="d-flex align-items-center py-2 px-0 follow-list-item"
              >
                <img
                  src={user.avatar}
                  alt="User Avatar"
                  className="rounded-circle me-3"
                  style={{ width: "50px", height: "50px", objectFit: "cover" }}
                />
                <div className="flex-grow-1">
                  <div className="fw-bold">{user.username}</div>
                  <div className="text-muted">@{user.handle}</div>
                </div>
                {/* You might want a "Theo dõi" (Follow) / "Đang theo dõi" (Following) button here */}
                {/* This button's text/variant should depend on the current user's follow status */}
                <Button variant="outline-primary" className="rounded-pill px-3">
                  Theo dõi
                </Button>
              </ListGroup.Item>
            ))
          )}
        </ListGroup>
      </Modal.Body>
    </Modal>
  );
}

export default FollowListModal;
