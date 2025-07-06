import React, { useState, useEffect } from "react";
import { Modal, Form, Button, Image } from "react-bootstrap";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

function CreateGroupModal({ show, onHide, onGroupCreated }) {
    const navigate = useNavigate();
    const [groupForm, setGroupForm] = useState({
        name: "",
        description: "",
        privacyLevel: "public",
    });
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");

    // Xử lý thay đổi form
    const handleGroupFormChange = (e) => {
        const { name, value } = e.target;
        setGroupForm((prev) => ({ ...prev, [name]: value }));
    };

    // Xử lý chọn file avatar
    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error("File ảnh không được vượt quá 5MB.");
                return;
            }
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
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
            const formData = new FormData();
            formData.append("ownerUsername", username);
            formData.append("name", groupForm.name);
            formData.append("description", groupForm.description);
            formData.append("privacyLevel", groupForm.privacyLevel);
            if (avatarFile) {
                formData.append("avatar", avatarFile);
            }

            const res = await fetch(`${process.env.REACT_APP_API_URL}/groups/create`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || "Không thể tạo nhóm.");
            }

            const response = await res.json();
            const newGroup = response.data; // Lấy GroupDisplayDto từ response.data
            onGroupCreated({
                id: newGroup.id,
                name: newGroup.name,
                avatar: newGroup.avatarUrl || "https://via.placeholder.com/40",
                description: newGroup.description,
                isJoined: true,
            });
            setGroupForm({ name: "", description: "", privacyLevel: "public" });
            setAvatarFile(null);
            setAvatarPreview(null);
            onHide();
            toast.success("Tạo nhóm thành công!");
            navigate(`/community/${newGroup.id}`);
        } catch (err) {
            toast.error(err.message);
        }
    };

    // Hủy preview ảnh khi component unmount
    useEffect(() => {
        return () => {
            if (avatarPreview) {
                URL.revokeObjectURL(avatarPreview);
            }
        };
    }, [avatarPreview]);

    return (
        <Modal
            show={show}
            onHide={onHide}
            centered
            className="text-[var(--text-color)]"
        >
            <Modal.Header
                closeButton
                className="bg-[var(--background-color)] border-[var(--border-color)]"
            >
                <Modal.Title>Tạo nhóm mới</Modal.Title>
            </Modal.Header>
            <Modal.Body className="bg-[var(--background-color)]">
                <Form>
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
                    <Form.Group className="mb-3">
                        <Form.Label>Ảnh đại diện nhóm</Form.Label>
                        <Form.Control
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarChange}
                            className="bg-[var(--input-bg)] text-[var(--text-color)] border-[var(--border-color)]"
                        />
                        {avatarPreview && (
                            <div className="mt-2">
                                <Image
                                    src={avatarPreview}
                                    alt="Avatar preview"
                                    style={{ width: "100px", height: "100px", objectFit: "cover" }}
                                    roundedCircle
                                />
                            </div>
                        )}
                    </Form.Group>
                    <Button
                        onClick={handleCreateGroup}
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