import React, { useState, useEffect, useContext } from "react";
import {
  Card,
  Form,
  Button,
  Dropdown,
  FormControl,
  OverlayTrigger,
  Tooltip,
  Modal,
} from "react-bootstrap";
import {
  FaPollH,
  FaSmile,
  FaCalendarAlt,
  FaUserFriends,
  FaGlobeAmericas,
  FaLock,
  FaList,
} from "react-icons/fa";
import { AuthContext } from "../../../context/AuthContext";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function TweetInput({ onPostSuccess }) {
  const { user } = useContext(AuthContext);
  const [tweetContent, setTweetContent] = useState("");
  const [status, setStatus] = useState("public");
  const [taggedUserIds, setTaggedUserIds] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [customLists, setCustomLists] = useState([]);
  const [customListId, setCustomListId] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaPreviews, setMediaPreviews] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentModalIndex, setCurrentModalIndex] = useState(0);

  useEffect(() => {
    const fetchPrivacySettings = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/privacy`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
              Accept: "application/json",
            },
          }
        );
        if (!response.ok)
          throw new Error("Không thể lấy cài đặt quyền riêng tư!");
        const { data } = await response.json();
        setStatus(data.postVisibility || "public");
      } catch (err) {
        console.error("Privacy error:", err);
        toast.error(err.message);
      }
    };

    const fetchCustomLists = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/privacy/lists`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!response.ok) throw new Error("Không thể lấy danh sách tùy chỉnh!");
        const { data } = await response.json();
        setCustomLists(data);
      } catch (err) {
        console.error("Custom list error:", err);
        toast.error(err.message);
      }
    };

    fetchPrivacySettings();
    fetchCustomLists();
  }, []);

  const handleTagInputChange = (e) => setTagInput(e.target.value);

  const handleAddTag = async () => {
    if (tagInput.trim() && !taggedUserIds.includes(tagInput.trim())) {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(
          `${process.env.REACT_APP_API_URL}/users/username/${tagInput}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!res.ok) throw new Error("Không tìm thấy người dùng!");
        const data = await res.json();
        setTaggedUserIds([...taggedUserIds, data.id]);
        setTagInput("");
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleRemoveTag = (id) => {
    setTaggedUserIds(taggedUserIds.filter((tagId) => tagId !== id));
  };

  const handleStatusChange = (newStatus) => {
    setStatus(newStatus);
    if (newStatus !== "custom") setCustomListId(null);
  };

  const handleCustomListSelect = (listId) => setCustomListId(listId);

  const handleMediaChange = (e) => {
    const files = Array.from(e.target.files);
    setMediaFiles([...mediaFiles, ...files]);
    setMediaPreviews([
      ...mediaPreviews,
      ...files.map((f) => URL.createObjectURL(f)),
    ]);
  };

  const handleSubmitTweet = async () => {
    if (!tweetContent.trim()) return setError("Tweet không được để trống!");
    if (status === "custom" && !customListId)
      return setError("Vui lòng chọn danh sách tùy chỉnh!");
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const postRes = await fetch(`${process.env.REACT_APP_API_URL}/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: tweetContent,
          privacySetting: status,
          taggedUserIds,
          customListId: status === "custom" ? customListId : null,
        }),
      });

      if (!postRes.ok) throw new Error("Không thể đăng bài!");
      const newPost = await postRes.json();
      const postId = newPost.data.id;

      if (mediaFiles.length > 0) {
        const formData = new FormData();
        formData.append("userId", user.id);
        formData.append("caption", tweetContent);
        mediaFiles.forEach((file) => formData.append("files", file));

        const mediaRes = await fetch(
          `${process.env.REACT_APP_API_URL}/media/posts/${postId}/media`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          }
        );

        if (!mediaRes.ok) throw new Error("Tải lên media thất bại.");
        toast.success("Media tải lên thành công!");
      }

      setTweetContent("");
      setTaggedUserIds([]);
      setMediaFiles([]);
      setMediaPreviews([]);
      setStatus("public");
      setCustomListId(null);
      setError(null);
      toast.success("Đăng bài thành công!");
      if (onPostSuccess) onPostSuccess(newPost.data);
    } catch (err) {
      console.error("Submit error:", err);
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderMediaLayout = () => {
    const count = mediaPreviews.length;
    if (count === 1) {
      return (
        <div className="mb-2 w-100">
          <img
            src={mediaPreviews[0]}
            className="img-fluid rounded w-100"
            alt="preview"
            onClick={() => openModal(0)}
            style={{ cursor: "pointer" }}
          />
        </div>
      );
    }
    return (
      <div className="d-flex flex-wrap gap-1 mb-2">
        {mediaPreviews.slice(0, 4).map((url, index) => (
          <div
            key={index}
            className="position-relative"
            style={{
              width:
                count === 2
                  ? "49%"
                  : count === 3 && index === 0
                  ? "100%"
                  : "49%",
              cursor: "pointer",
            }}
            onClick={() => openModal(index)}
          >
            <img
              src={url}
              alt={`media-${index}`}
              className="img-fluid rounded"
              style={{ objectFit: "cover", width: "100%", height: "auto" }}
            />
            <Button
              variant="danger"
              size="sm"
              className="position-absolute top-0 end-0 m-1 p-1 rounded-circle"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveMedia(index);
              }}
            >
              ×
            </Button>
            {count > 4 && index === 3 && (
              <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-50 rounded text-white fs-4">
                +{count - 4}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const openModal = (index) => {
    setCurrentModalIndex(index);
    setShowModal(true);
  };

  const nextImage = () => {
    setCurrentModalIndex((prev) => (prev + 1) % mediaPreviews.length);
  };

  const prevImage = () => {
    setCurrentModalIndex(
      (prev) => (prev - 1 + mediaPreviews.length) % mediaPreviews.length
    );
  };

  const handleRemoveMedia = (index) => {
    setMediaFiles(mediaFiles.filter((_, i) => i !== index));
    setMediaPreviews(mediaPreviews.filter((_, i) => i !== index));
  };

  return (
    <>
      <Card className="mb-3 rounded-4 shadow-sm border-0">
        <Card.Body>
          <Form.Control
            as="textarea"
            rows={3}
            placeholder="What's happening?"
            className="border-0 shadow-none mb-2"
            style={{ resize: "none" }}
            value={tweetContent}
            onChange={(e) => setTweetContent(e.target.value)}
          />

          {renderMediaLayout()}

          <input
            type="file"
            id="hiddenMediaInput"
            accept="image/*,video/*"
            multiple
            style={{ display: "none" }}
            onChange={handleMediaChange}
          />

          <Button
            variant="primary"
            className="rounded-pill px-4 fw-bold"
            onClick={handleSubmitTweet}
            disabled={
              !tweetContent.trim() ||
              (status === "custom" && !customListId) ||
              loading
            }
          >
            {loading ? "Đang đăng..." : "Tweet"}
          </Button>
        </Card.Body>
      </Card>

      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        centered
        size="lg"
      >
        <Modal.Body className="text-center bg-dark">
          <img
            src={mediaPreviews[currentModalIndex]}
            alt="modal-img"
            className="img-fluid"
          />
          <div className="mt-2 d-flex justify-content-between">
            <Button variant="light" onClick={prevImage}>
              Prev
            </Button>
            <Button variant="light" onClick={nextImage}>
              Next
            </Button>
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
}

export default TweetInput;
