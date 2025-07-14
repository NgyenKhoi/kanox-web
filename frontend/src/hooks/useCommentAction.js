import { toast } from "react-toastify";
export const useCommentActions = ({
                                      user,
                                      postId,
                                      setComments,
                                      fetchComments,
                                  }) => {
    const handleReplyToComment = async (parentId, replyText, mediaFiles = []) => {
        try {
            const token = localStorage.getItem("token");
            if (!token) throw new Error("Vui lòng đăng nhập để bình luận!");

            const formData = new FormData();

            const commentPayload = {
                userId: user.id,
                postId,
                content: replyText,
                privacySetting: "default", // bạn có thể dùng "PUBLIC" nếu backend cho phép
                parentCommentId: parentId,
                customListId: null,
            };

            formData.append(
                "comment",
                new Blob([JSON.stringify(commentPayload)], { type: "application/json" })
            );

            mediaFiles.forEach((file) => {
                formData.append("media", file);
            });

            const response = await fetch(`${process.env.REACT_APP_API_URL}/comments`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Không thể phản hồi");

            const newReply = data.data;
            setComments((prev) =>
                prev.map((c) =>
                    c.commentId === parentId
                        ? { ...c, replies: [...(c.replies || []), newReply] }
                        : c
                )
            );
        } catch (error) {
            toast.error("Không thể phản hồi bình luận: " + error.message);
        }
    };
    const handleUpdateComment = async (commentId, newText) => {
        try {
            const token = localStorage.getItem("token");
            if (!token) throw new Error("Vui lòng đăng nhập để chỉnh sửa!");

            const response = await fetch(
                `${process.env.REACT_APP_API_URL}/comments/${commentId}`,
                {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        userId: user.id,
                        content: newText,
                    }),
                }
            );

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Không thể cập nhật.");

            toast.success("Đã cập nhật bình luận!");
            fetchComments();
        } catch (err) {
            toast.error("Lỗi khi cập nhật: " + err.message);
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (!window.confirm("Bạn có chắc muốn xóa bình luận này?")) return;

        try {
            const token = localStorage.getItem("token");
            if (!token) throw new Error("Vui lòng đăng nhập!");

            const response = await fetch(
                `${process.env.REACT_APP_API_URL}/comments/${commentId}`,
                {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || "Xóa bình luận thất bại.");
            }

            toast.success("Đã xóa bình luận!");
            fetchComments();
        } catch (err) {
            toast.error("Lỗi khi xóa bình luận: " + err.message);
        }
    };

    return {
        handleReplyToComment,
        handleUpdateComment,
        handleDeleteComment,
    };
};