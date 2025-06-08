import React, { useState, useEffect, useContext } from "react";
import { Modal, Form, Button, FormControl, FormGroup, FormLabel, Dropdown } from "react-bootstrap";
import { FaUserFriends } from "react-icons/fa";
import { AuthContext } from "../../../context/AuthContext";

function EditPostModal({ show, onHide, post, onSave }) {
    const { user } = useContext(AuthContext);
    const [formData, setFormData] = useState({
        content: "",
        privacySetting: "public",
        taggedUserIds: [],
        tagInput: "",
    });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (post) {
            setFormData({
                content: post.content || "",
                privacySetting: post.privacySetting || "public",
                taggedUserIds: post.taggedUsers ? post.taggedUsers.map(tag => parseInt(tag.id)) : [], // Parse ID thành Integer
                tagInput: "",
            });
        }
    }, [post]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleTagInputChange = (e) => {
        setFormData((prev) => ({ ...prev, tagInput: e.target.value }));
    };

    const handleAddTag = async () => {
        const tagInput = formData.tagInput.trim();
        if (tagInput && !formData.taggedUserIds.includes(parseInt(tagInput))) {
            try {
                const token = localStorage.getItem("token");
                const response = await fetch(
                    `${process.env.REACT_APP_API_URL}/users/${tagInput}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error("Tag user error:", response.status, errorText);
                    throw new Error("Không tìm thấy người dùng!");
                }
                const data = await response.json();
                setFormData((prev) => ({
                    ...prev,
                    taggedUserIds: [...prev.taggedUserIds, parseInt(data.id)], // Parse ID thành Integer
                    tagInput: "",
                }));
            } catch (err) {
                setError(err.message);
                console.error("Tag user exception:", err);
            }
        }
    };

    const handleRemoveTag = (tagId) => {
        setFormData((prev) => ({
            ...prev,
            taggedUserIds: prev.taggedUserIds.filter((id) => id !== tagId),
        }));
    };

    const handleStatusChange = (newStatus) => {
        setFormData((prev) => ({ ...prev, privacySetting: newStatus }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        if (!formData.content.trim()) {
            setError("Nội dung không được để trống!");
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const token = localStorage.getItem("token");
            const response = await fetch(
                `${process.env.REACT_APP_API_URL}
                /posts/${post.id}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        content: formData.content,
                        privacySetting: formData.privacySetting,
                        taggedUserIds: formData.taggedUserIds,
                    }),
                }
            );

            console.log("Update post response:", response.status, await response.text());

            if (!response.ok) {
                let errorData;
                try {
                    errorData = await response.json();
                } catch {
                    throw new Error(`Lỗi server: ${response.status} - ${await response.text() || "No response body"}`);
                }
                throw new Error(errorData.message || `Không thể cập nhật bài đăng! (Status: ${response.status})`);
            }

            let responseData = {};
            try {
                responseData = await response.json();
            } catch {
                console.warn("Response body is empty or not JSON");
            }

            onSave();
        } catch (err) {
            setError(err.message);
            console.error("Update post exception:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton>
                <Modal.Title>Chỉnh sửa bài đăng</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form onSubmit={handleSubmit}>
                    <FormGroup className="mb-3">
                        <FormLabel>Nội dung</FormLabel>
                        <FormControl
                            as="textarea"
                            rows={3}
                            name="content"
                            value={formData.content}
                            onChange={handleChange}
                            placeholder="Bạn đang nghĩ gì?"
                        />
                    </FormGroup>
                    <FormGroup className="mb-3">
                        <FormLabel>Trạng thái</FormLabel>
                        <Dropdown>
                            <Dropdown.Toggle variant="outline-primary" className="w-100 text-start">
                                Trạng thái: {formData.privacySetting}
                            </Dropdown.Toggle>
                            <Dropdown.Menu>
                                <Dropdown.Item onClick={() => handleStatusChange("public")}>Công khai</Dropdown.Item>
                                <Dropdown.Item onClick={() => handleStatusChange("friends")}>Bạn bè</Dropdown.Item>
                                <Dropdown.Item onClick={() => handleStatusChange("private")}>Riêng tư</Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>
                    </FormGroup>
                    <FormGroup className="mb-3">
                        <FormLabel>Tag người dùng</FormLabel>
                        <div className="d-flex align-items-center mb-2">
                            <FormControl
                                type="text"
                                placeholder="Nhập username"
                                value={formData.tagInput}
                                onChange={handleTagInputChange}
                                className="me-2"
                            />
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={handleAddTag}
                                disabled={!formData.tagInput.trim()}
                            >
                                Thêm
                            </Button>
                        </div>
                        {formData.taggedUserIds.length > 0 && (
                            <div className="d-flex flex-wrap">
                                {formData.taggedUserIds.map((tagId, index) => (
                                    <span key={index} className="badge bg-primary text-white me-2 mb-1">
                                        @User_{tagId}
                                        <Button
                                            variant="link"
                                            className="text-white p-0"
                                            onClick={() => handleRemoveTag(tagId)}
                                        >
                                            x
                                        </Button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </FormGroup>
                    {error && <p className="text-danger text-center">{error}</p>}
                    <div className="d-flex justify-content-end">
                        <Button variant="secondary" onClick={onHide} className="me-2" disabled={loading}>
                            Hủy
                        </Button>
                        <Button variant="primary" type="submit" disabled={loading}>
                            {loading ? "Đang lưu..." : "Lưu"}
                        </Button>
                    </div>
                </Form>
            </Modal.Body>
        </Modal>
    );
}

export default EditPostModal;
