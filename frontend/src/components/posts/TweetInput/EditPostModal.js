import React, { useState, useEffect, useContext } from "react";
import {
    Modal,
    Form,
    Button,
    FormControl,
    FormGroup,
    FormLabel,
    Dropdown,
    Badge,
    Row,
    Col,
    Image as BootstrapImage,
} from "react-bootstrap";
import { AuthContext } from "../../../context/AuthContext";
import { FaTrash } from "react-icons/fa";

function EditPostModal({ show, onHide, post, onSave }) {
    const { user } = useContext(AuthContext);
    const [formData, setFormData] = useState({
        content: "",
        privacySetting: "public",
        taggedUserIds: [],
        tagInput: "",
        customListId: null,
        images: [],
        existingImageUrls: [],
        imagesToDelete: [],
    });
    const [customLists, setCustomLists] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchCustomLists = async () => {
            try {
                const token = localStorage.getItem("token");
                const response = await fetch(`${process.env.REACT_APP_API_URL}/privacy/lists`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!response.ok) throw new Error("Không thể lấy danh sách tùy chỉnh!");
                const { data } = await response.json();
                setCustomLists(data);
            } catch (err) {
                console.error("Lỗi lấy danh sách:", err);
            }
        };
        fetchCustomLists();
    }, []);

    useEffect(() => {
        if (post) {
            setFormData({
                content: post.content || "",
                privacySetting: post.privacySetting === "private" ? "only_me" : post.privacySetting || "public",
                taggedUserIds: post.taggedUsers ? post.taggedUsers.map(tag => parseInt(tag.id)) : [],
                tagInput: "",
                customListId: post.customListId || null,
                images: [],
                existingImageUrls: post.imageUrls || [],
                imagesToDelete: [],
            });
        }
    }, [post]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleTagInputChange = (e) => {
        setFormData(prev => ({ ...prev, tagInput: e.target.value }));
    };

    const handleAddTag = async () => {
        const username = formData.tagInput.trim();
        if (username && !formData.taggedUserIds.includes(username)) {
            try {
                const token = localStorage.getItem("token");
                const res = await fetch(`${process.env.REACT_APP_API_URL}/users/username/${username}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) throw new Error("Không tìm thấy người dùng!");
                const data = await res.json();
                setFormData(prev => ({
                    ...prev,
                    taggedUserIds: [...prev.taggedUserIds, parseInt(data.id)],
                    tagInput: "",
                }));
            } catch (err) {
                setError(err.message);
            }
        }
    };

    const handleRemoveTag = (tagId) => {
        setFormData(prev => ({
            ...prev,
            taggedUserIds: prev.taggedUserIds.filter(id => id !== tagId),
        }));
    };

    const handleStatusChange = (status) => {
        setFormData(prev => ({
            ...prev,
            privacySetting: status,
            customListId: status !== "custom" ? null : prev.customListId,
        }));
    };

    const handleCustomListSelect = (id) => {
        setFormData(prev => ({ ...prev, customListId: id }));
    };

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);
        const validImageTypes = ['image/jpeg', 'image/png', 'image/gif'];
        const maxSize = 5 * 1024 * 1024;

        const validFiles = files.filter(file =>
            validImageTypes.includes(file.type) && file.size <= maxSize
        );

        if (validFiles.length < files.length) {
            setError("Một số file không hợp lệ (chỉ hỗ trợ JPEG, PNG, GIF, tối đa 5MB)");
        }

        setFormData(prev => ({
            ...prev,
            images: [...prev.images, ...validFiles],
        }));
    };

    const handleRemoveImage = (index, isExisting = false) => {
        if (isExisting) {
            const imageUrl = formData.existingImageUrls[index];
            const imageId = imageUrl.split('/').pop();
            setFormData(prev => ({
                ...prev,
                existingImageUrls: prev.existingImageUrls.filter((_, i) => i !== index),
                imagesToDelete: [...prev.imagesToDelete, imageId],
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                images: prev.images.filter((_, i) => i !== index),
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!formData.content.trim()) return setError("Nội dung không được để trống!");
        if (formData.privacySetting === "custom" && !formData.customListId) {
            return setError("Vui lòng chọn danh sách tùy chỉnh!");
        }

        try {
            setLoading(true);
            const token = localStorage.getItem("token");
            const formDataToSend = new FormData();

            formDataToSend.append('content', formData.content);
            formDataToSend.append('privacySetting', formData.privacySetting);
            formDataToSend.append('taggedUserIds', JSON.stringify(formData.taggedUserIds));
            if (formData.customListId) {
                formDataToSend.append('customListId', formData.customListId);
            }
            if (formData.imagesToDelete.length > 0) {
                formDataToSend.append('imagesToDelete', JSON.stringify(formData.imagesToDelete));
            }

            formData.images.forEach((image, index) => {
                formDataToSend.append(`images[${index}]`, image);
            });

            const res = await fetch(`${process.env.REACT_APP_API_URL}/posts/${post.id}`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formDataToSend,
            });

            const text = await res.text();
            if (!res.ok) {
                let errData;
                try {
                    errData = JSON.parse(text);
                } catch {
                    throw new Error(`Lỗi server: ${res.status} - ${text || "Không rõ lỗi"}`);
                }
                throw new Error(errData.message || `Không thể cập nhật bài đăng!`);
            }

            onSave();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} centered className="bg-[var(--background-color)] text-[var(--text-color)]">
            <Modal.Header closeButton>
                <Modal.Title>Chỉnh sửa bài đăng</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form onSubmit={handleSubmit}>
                    <FormGroup className="mb-3">
                        <FormLabel>Nội dung</FormLabel>
                        <FormControl
                            as="textarea"
                            rows={4}
                            name="content"
                            value={formData.content}
                            onChange={handleChange}
                            placeholder="Bạn đang nghĩ gì?"
                            className="bg-[var(--input-bg-color)] border-[var(--border-color)] text-[var(--text-color)]"
                        />
                    </FormGroup>

                    <FormGroup className="mb-3">
                        <FormLabel>Trạng thái hiển thị</FormLabel>
                        <Dropdown>
                            <Dropdown.Toggle variant="outline-secondary" className="w-100 text-start bg-[var(--input-bg-color)] text-[var(--text-color)] border-[var(--border-color)]">
                                {formData.privacySetting === "only_me"
                                    ? "Riêng tư"
                                    : formData.privacySetting === "friends"
                                        ? "Bạn bè"
                                        : formData.privacySetting === "custom"
                                            ? "Tùy chỉnh"
                                            : "Công khai"}
                            </Dropdown.Toggle>
                            <Dropdown.Menu>
                                <Dropdown.Item onClick={() => handleStatusChange("public")}>Công khai</Dropdown.Item>
                                <Dropdown.Item onClick={() => handleStatusChange("friends")}>Bạn bè</Dropdown.Item>
                                <Dropdown.Item onClick={() => handleStatusChange("only_me")}>Riêng tư</Dropdown.Item>
                                <Dropdown.Item onClick={() => handleStatusChange("custom")}>Tùy chỉnh</Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>
                    </FormGroup>

                    {formData.privacySetting === "custom" && (
                        <FormGroup className="mb-3">
                            <FormLabel>Danh sách tùy chỉnh</FormLabel>
                            <Dropdown>
                                <Dropdown.Toggle variant="outline-secondary" className="w-100 text-start bg-[var(--input-bg-color)] text-[var(--text-color)] border-[var(--border-color)]">
                                    {formData.customListId
                                        ? customLists.find(l => l.id === formData.customListId)?.listName
                                        : "Chọn danh sách"}
                                </Dropdown.Toggle>
                                <Dropdown.Menu>
                                    {customLists.map(list => (
                                        <Dropdown.Item key={list.id} onClick={() => handleCustomListSelect(list.id)}>
                                            {list.listName}
                                        </Dropdown.Item>
                                    ))}
                                </Dropdown.Menu>
                            </Dropdown>
                        </FormGroup>
                    )}

                    <FormGroup className="mb-3">
                        <FormLabel>Tag người dùng</FormLabel>
                        <Row className="g-2">
                            <Col xs={9}>
                                <FormControl
                                    type="text"
                                    placeholder="Nhập username"
                                    value={formData.tagInput}
                                    onChange={handleTagInputChange}
                                    className="bg-[var(--input-bg-color)] border-[var(--border-color)] text-[var(--text-color)]"
                                />
                            </Col>
                            <Col xs={3}>
                                <Button variant="primary" onClick={handleAddTag} disabled={!formData.tagInput.trim()} className="w-100">
                                    Thêm
                                </Button>
                            </Col>
                        </Row>
                        <div className="mt-2">
                            {formData.taggedUserIds.map((tagId) => (
                                <Badge key={tagId} bg="primary" className="me-2 mb-2 text-white">
                                    @User_{tagId}{" "}
                                    <Button
                                        variant="link"
                                        size="sm"
                                        className="text-white p-0 ms-1"
                                        onClick={() => handleRemoveTag(tagId)}
                                    >
                                        ×
                                    </Button>
                                </Badge>
                            ))}
                        </div>
                    </FormGroup>

                    <FormGroup className="mb-3">
                        <FormLabel>Ảnh</FormLabel>
                        <FormControl
                            type="file"
                            multiple
                            accept="image/jpeg,image/png,image/gif"
                            onChange={handleImageUpload}
                            className="bg-[var(--input-bg-color)] border-[var(--border-color)] text-[var(--text-color)]"
                        />
                        <Row className="mt-2 g-2">
                            {formData.existingImageUrls.map((url, index) => (
                                <Col xs={4} key={`existing-${index}`}>
                                    <div className="position-relative">
                                        <BootstrapImage
                                            src={url}
                                            className="w-full h-[100px] object-cover rounded-lg"
                                            fluid
                                        />
                                        <Button
                                            variant="danger"
                                            size="sm"
                                            className="position-absolute top-1 end-1"
                                            onClick={() => handleRemoveImage(index, true)}
                                        >
                                            <FaTrash />
                                        </Button>
                                    </div>
                                </Col>
                            ))}
                            {formData.images.map((image, index) => (
                                <Col xs={4} key={`new-${index}`}>
                                    <div className="position-relative">
                                        <BootstrapImage
                                            src={URL.createObjectURL(image)}
                                            className="w-full h-[100px] object-cover rounded-lg"
                                            fluid
                                        />
                                        <Button
                                            variant="danger"
                                            size="sm"
                                            className="position-absolute top-1 end-1"
                                            onClick={() => handleRemoveImage(index)}
                                        >
                                            <FaTrash />
                                        </Button>
                                    </div>
                                </Col>
                            ))}
                        </Row>
                    </FormGroup>

                    {error && <p className="text-[var(--error-color)] text-center">{error}</p>}

                    <div className="d-flex justify-content-end">
                        <Button variant="secondary" onClick={onHide} className="me-2" disabled={loading}>
                            Hủy
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={loading || (formData.privacySetting === "custom" && !formData.customListId)}
                        >
                            {loading ? "Đang lưu..." : "Lưu"}
                        </Button>
                    </div>
                </Form>
            </Modal.Body>
        </Modal>
    );
}

export default EditPostModal;