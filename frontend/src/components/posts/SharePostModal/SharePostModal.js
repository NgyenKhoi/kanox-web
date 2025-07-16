import React, { useState, useContext, useEffect } from "react";
import { Modal, Button, Form, Spinner } from "react-bootstrap";
import { AuthContext } from "../../../context/AuthContext";
import { toast } from "react-toastify";

const SharedPostPreview = ({ tweet }) => {
  return (
    <div className="border border-[var(--border-color)] rounded-lg p-3 mt-2">
      <div className="d-flex align-items-center mb-2">
        <img
          src={tweet?.owner?.avatarUrl || "https://placehold.co/40x40"}
          alt="avatar"
          className="rounded-full w-10 h-10 me-2 object-cover"
        />
        <div>
          <h6 className="mb-0 fw-bold text-[var(--text-color)]">
            {tweet?.owner?.displayName || "Người dùng không xác định"}
          </h6>
          <span className="text-sm text-[var(--text-color-muted)]">
            @{tweet?.owner?.username || "unknown"}
          </span>
        </div>
      </div>
      <p className="text-[var(--text-color)]">{tweet?.content}</p>
      {/* Bạn có thể thêm media preview ở đây nếu muốn */}
    </div>
  );
};

const SharePostModal = ({ show, onHide, tweet, onPostShared }) => {
  const { user, token } = useContext(AuthContext);
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = React.useCallback(async () => {
    if (!tweet?.id) {
      toast.error("Không tìm thấy bài viết để chia sẻ.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/posts/share`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            originalPostId: tweet.id,
            content: content,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Chia sẻ bài viết thất bại.");
      }

      toast.success("Chia sẻ thành công!");
      if (onPostShared) onPostShared();
      onHide();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
      setContent("");
    }
  }, [tweet, content, token, onPostShared, onHide]);

  useEffect(() => {
    if (!show) {
      setContent("");
    }
  }, [show]);

  return (
    <Modal
      show={show}
      onHide={onHide}
      centered
      contentClassName="bg-[var(--background-color)] text-[var(--text-color)]"
    >
      <Modal.Header closeButton>
        <Modal.Title>Chia sẻ bài viết</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Control
          as="textarea"
          rows={3}
          placeholder="Hãy nói gì đó về điều này..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="bg-[var(--hover-bg-color)] border-[var(--border-color)] text-[var(--text-color)]"
        />

        {tweet && <SharedPostPreview tweet={tweet} />}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Hủy
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={isSubmitting || !tweet}
        >
          {isSubmitting ? (
            <Spinner as="span" animation="border" size="sm" />
          ) : (
            "Đăng"
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default SharePostModal;
