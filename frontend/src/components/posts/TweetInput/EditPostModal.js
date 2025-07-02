import React, { useState, useEffect, useContext } from "react";
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
                taggedUserIds: post.taggedUsers ? post.taggedUsers.map((tag) => parseInt(tag.id)) : [],
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
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleTagInputChange = (e) => {
        setFormData((prev) => ({ ...prev, tagInput: e.target.value }));
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
                setFormData((prev) => ({
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
        setFormData((prev) => ({
            ...prev,
            taggedUserIds: prev.taggedUserIds.filter((id) => id !== tagId),
        }));
    };

    const handleStatusChange = (status) => {
        setFormData((prev) => ({
            ...prev,
            privacySetting: status,
            customListId: status !== "custom" ? null : prev.customListId,
        }));
    };

    const handleCustomListSelect = (id) => {
        setFormData((prev) => ({ ...prev, customListId: id }));
    };

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);
        const validImageTypes = ["image/jpeg", "image/png", "image/gif"];
        const maxSize = 5 * 1024 * 1024;

        const validFiles = files.filter((file) => validImageTypes.includes(file.type) && file.size <= maxSize);

        if (validFiles.length < files.length) {
            setError("Một số file không hợp lệ (chỉ hỗ trợ JPEG, PNG, GIF, tối đa 5MB)");
        }

        setFormData((prev) => ({
            ...prev,
            images: [...prev.images, ...validFiles],
        }));
    };

    const handleRemoveImage = (index, isExisting = false) => {
        if (isExisting) {
            const imageUrl = formData.existingImageUrls[index];
            const imageId = imageUrl.split("/").pop();
            setFormData((prev) => ({
                ...prev,
                existingImageUrls: prev.existingImageUrls.filter((_, i) => i !== index),
                imagesToDelete: [...prev.imagesToDelete, imageId],
            }));
        } else {
            setFormData((prev) => ({
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

            formDataToSend.append("content", formData.content);
            formDataToSend.append("privacySetting", formData.privacySetting);
            formDataToSend.append("taggedUserIds", JSON.stringify(formData.taggedUserIds));
            if (formData.customListId) {
                formDataToSend.append("customListId", formData.customListId);
            }
            if (formData.imagesToDelete.length > 0) {
                formDataToSend.append("imagesToDelete", JSON.stringify(formData.imagesToDelete));
            }

            formData.images.forEach((image, index) => {
                formDataToSend.append(`images[${index}]`, image);
            });

            const res = await fetch(`${process.env.REACT_APP_API_URL}/posts/${post.id}`, {
                method: "PUT",
                headers: { Authorization: `Bearer ${token}` },
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
                throw new Error(errData.message || "Không thể cập nhật bài đăng!");
            }

            onSave();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        show && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white dark:bg-[var(--background-color)] w-full max-w-2xl rounded-xl shadow-xl p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-[var(--text-color)]">Chỉnh sửa bài đăng</h2>
                        <button onClick={onHide} className="text-xl font-bold text-red-500">×</button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
            <textarea
                name="content"
                value={formData.content}
                onChange={handleChange}
                rows={4}
                placeholder="Bạn đang nghĩ gì?"
                className="w-full p-2 rounded border border-[var(--border-color)] bg-[var(--background-color)] text-[var(--text-color)]"
            />

                        {/* Other UI elements omitted for brevity */}

                        {error && <p className="text-red-500 text-center">{error}</p>}

                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={onHide}
                                disabled={loading}
                                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 disabled:opacity-50"
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                disabled={loading || (formData.privacySetting === "custom" && !formData.customListId)}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                            >
                                {loading ? "Đang lưu..." : "Lưu"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )
    );
}

export default EditPostModal;
