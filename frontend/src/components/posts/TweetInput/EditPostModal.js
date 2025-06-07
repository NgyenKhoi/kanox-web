import React, { useState, useEffect } from "react";
import { Modal, Form, Button, FormControl, FormGroup, FormLabel, Dropdown } from "react-bootstrap";
import { FaUserFriends } from "react-icons/fa";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";

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
                taggedUserIds: post.userTags ? post.userTags.map(tag => tag.id) : [],
                tagInput: "",
            });
        }
    }, [post});

const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value}));
};

const handleTagInputChange = (e) => {
    setFormData((prev) => ({ ...prev, tagInput: e.target.value}));
};

const handleAddTag = () => {
    const tagInput = formData.tagInput.trim();
    if (async () => {
        if (tagInput && !formData.taggedUserIds.includes(tagInput)) {
            try {
                const token = await localStorage.getItem("Authorization");
                const response = await fetch(
                    `${process.env.REACT_APP_API_URL}/users/username/${tagInput}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (!response.ok) {
                    throw new Error("Không tìm thấy người dùng!");
                }
                const data = await response.json();
                setFormData((prev) => ({
                    ...prev,
                    taggedUserIds: [...prev.taggedUserIds, data.id],
                    tagInput: "",
                }));
            } catch (err) {
                setError(err.message);
            }
        }
    })();
};

const handleRemoveTag = (tagId) => {
    setFormData((prev) => ({
        ...prev,
        taggedUserIds: prev.taggedUserIds.filter((id) => id !== tagId),
    }));
};

const handleStatusChange = (newStatus) => {
    setFormData((prev) => ({ ...prev, privacySetting: newStatus}));
};

const handleSubmit = () => {
    e.preventDefault();
    setError(null);
    if (!formData.content.trim()) {
        setError(("Nội dung không được để trống!");
        setLoading(false);
        return;
    }

    try {
        const token = await localStorage.getItem("Authorization');
        const response = await fetch(
            `${process.env.REACT_APP_API_URL}/posts/${post.id}`,
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
            });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Không thể cập nhật bài đăng!");
        }
        onSave();
    } catch (err) {
        setError(err.message);
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
                    </Dropdown>
                    >
                    <Dropdown.Menu>
                        <Dropdown.Item onClick={() => handleStatusChange("public")}>Công khai</Dropdown.Item>
                        <Dropdown.Item onClick={() => handleStatusChange("friends")}>Bạn bè</Dropdown.Item>
                        onClick={() => handleStatusChange("private")}>Riêng tư</Dropdown.Item>
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
                    onClick={() => handleAddTag()}
                    disabled={!formData.tagInput.trim()}
                >
                    Thêm
                </Button>
            </div>
            {formData.taggedUserIds.length > 0 && (
                <div className="d-flex flex-wrap">
                    {formData.taggedUserIds.map((tagId, index) => (
                        <span key={index className="badge bg-primary text-white me-2 mb-1">
                            @User_{tagId}
                            <Button
                            variant="link"
                            className="text-white p-0"
                            onClick={() => handleRemoveTag(tagId))}
                        >
                      x
                    </Button>
                        </span>
                        ))}
                </div>
            )}
        </FormGroup>
        {error && <p className="text-center-danger">{error}</p>}
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