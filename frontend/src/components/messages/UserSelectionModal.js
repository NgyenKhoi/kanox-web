import React from "react";
import { Modal, Form, ListGroup, Spinner, InputGroup, Image, Button } from "react-bootstrap";
import { FaSearch } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

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

    console.log("UserSelectionModal rendered, searchKeyword:", searchKeyword); // Debug log

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
                        value={searchKeyword}
                        onChange={(e) => {
                            console.log("Search keyword changed:", e.target.value); // Debug log
                            setSearchKeyword(e.target.value);
                        }}
                        className="bg-light border-0 rounded-pill py-2"
                        style={{ height: "auto" }}
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
                                    className="d-flex align-items-center p-2"
                                >
                                    <Image
                                        src={user.avatar || "https://via.placeholder.com/40"}
                                        roundedCircle
                                        width="40"
                                        height="40"
                                        className="me-2"
                                        onClick={() => navigate(`/profile/${user.username}`)} // Chuyển hướng đến ProfilePage
                                        style={{ cursor: "pointer" }}
                                    />
                                    <div className="flex-grow-1">
                                        <p
                                            className="fw-bold mb-0"
                                            onClick={() => navigate(`/profile/${user.username}`)} // Chuyển hướng đến ProfilePage
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
                                        onClick={() => {
                                            handleSelectUser(user.id); // Tạo chat
                                            handleClose();
                                        }}
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