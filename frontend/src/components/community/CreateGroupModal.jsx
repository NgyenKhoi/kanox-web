import React, { useState } from "react";
import { Modal, Form, Button } from "react-bootstrap";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

function CreateGroupModal({ show, onHide, onGroupCreated }) {
    const navigate = useNavigate();
    const [groupForm, setGroupForm] = useState({
        name: "",
        description: "",
        privacyLevel: "public",
    });
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");

    const handleGroupFormChange = (e) => {
        const { name, value } = e.target;
        setGroupForm((prev) => ({ ...prev, [name]: value }));
    };

    // Xử lý submit form tạo nhóm
    const handleCreateGroup = async (e) => {
        e.preventDefault();
        if (!token || !username) {
            toast.error("Vui lòng đăng nhập để tạo nhóm.");
            onHide();
            return;
        }

        try {
            const res = await fetch(`${process.env.REACT_APP_API_URL}/groups/create`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ownerUsername: username,
                    name: groupForm.name,
                    description: groupForm.description,
                    privacyLevel: groupForm.privacyLevel,
                }),
            });

            if (!res.ok) throw new Error("Không thể tạo nhóm.");
            const newGroup = await res.json();
            onGroupCreated({
                id: newGroup.id,
                name: newGroup.name,
                avatar: newGroup.avatar || "https://via.placeholder.com/40",
                description: newGroup.description,
                isJoined: true,
            });
            setGroupForm({ name: "", description: "", privacyLevel: "public" });
            onHide();
            toast.success("Tạo nhóm thành công!");
            navigate(`/community/${newGroup.id}`);
        } catch (err) {
            toast.error(err.message);
        }
    };

    return (
        <Modal
            show={show}
            onHide={onHide}
            centered
            className="text-[var(--text-color)]"
        >
            <Modal.Header closeButton className="bg-[var(--background-color)] border-[var(--border-color)]">
                <Modal.Title>Tạo nhóm mới</Modal.Title>
            </Modal.Header>
            <Modal.Body className="bg-[var(--background-color)]">
                <Form onSubmit={handleCreateGroup}>
                    <Form.Group className="mb-3">
                        <Form.Label>Tên nhóm</Form.Label>
                        <Form.Control
                            type="text"
                            name="name"
                            value={groupForm.name}
                            onChange={handleGroupFormChange}
                            required
                            className="bg-[var(--input-bg)] text-[var(--text-color)] border-[var(--border-color)]"
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Mô tả</Form.Label>
                        <Form.Control
                            as="textarea"
                            name="description"
                            value={groupForm.description}
                            onChange={handleGroupFormChange}
                            className="bg-[var(--input-bg)] text-[var(--text-color)] border-[var(--border-color)]"
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Chế độ riêng tư</Form.Label>
                        <Form.Select
                            name="privacyLevel"
                            value={groupForm.privacyLevel}
                            onChange={handleGroupFormChange}
                            className="bg-[var(--input-bg)] text-[var(--text-color)] border-[var(--border-color)]"
                        >
                            <option value="public">Công khai</option>
                            <option value="private">Riêng tư</option>
                        </Form.Select>
                    </Form.Group>
                    <Button
                        type="submit"
                        variant="primary"
                        className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                        Tạo nhóm
                    </Button>
                </Form>
            </Modal.Body>
        </Modal>
    );
}

export default CreateGroupModal;