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
  FaPlus,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import { AiOutlineClose } from "react-icons/ai";
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
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

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
    if (files.length > 0) {
      setMediaFiles((prev) => [...prev, ...files]);
      setMediaPreviews((prev) => [
        ...prev,
        ...files.map((f) => URL.createObjectURL(f)),
      ]);
    }
  };

  const handleRemoveMedia = (index) => {
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
    setMediaPreviews((prev) => prev.filter((_, i) => i !== index));
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

  const renderStatusIcon = (status) => {
    switch (status) {
      case "public":
        return <FaGlobeAmericas className="me-1" />;
      case "friends":
        return <FaUserFriends className="me-1" />;
      case "only_me":
        return <FaLock className="me-1" />;
      case "custom":
        return <FaList className="me-1" />;
      default:
        return null;
    }
  };

  const renderStatusText = (status) => {
    switch (status) {
      case "public":
        return "Công khai";
      case "friends":
        return "Bạn bè";
      case "only_me":
        return "Chỉ mình tôi";
      case "custom":
        return "Tùy chỉnh";
      default:
        return "Công khai";
    }
  };

  const handleOpenMediaModal = (index) => {
    setCurrentMediaIndex(index);
    setShowMediaModal(true);
  };

  const handleCloseMediaModal = () => {
    setShowMediaModal(false);
  };

  const handleNextMedia = () => {
    setCurrentMediaIndex((prev) =>
        prev === mediaPreviews.length - 1 ? 0 : prev + 1
    );
  };

  const handlePrevMedia = () => {
    setCurrentMediaIndex((prev) =>
        prev === 0 ? mediaPreviews.length - 1 : prev - 1
    );
  };

  const renderMediaPreview = () => {
    if (mediaPreviews.length === 0) return null;

    const containerStyle = {
      display: "grid",
      gap: "4px",
      marginBottom: "10px",
      position: "relative",
      maxWidth: "100%",
    };

    const mediaStyle = {
      maxWidth: "100%",
      maxHeight: "200px",
      objectFit: "cover",
      borderRadius: "8px",
    };

    const renderRemoveButton = (index) => (
        <Button
            variant="dark"
            size="sm"
            className="position-absolute top-0 end-0 m-2 rounded-circle shadow-sm"
            style={{ width: "24px", height: "24px", lineHeight: "12px", fontWeight: "bold", opacity: 0.85 }}
            onClick={() => handleRemoveMedia(index)}
            title="Xoá"
        >
          <AiOutlineClose size={14} />
        </Button>
    );

    if (mediaPreviews.length === 1) {
      return (
          <div style={containerStyle}>
            <div className="position-relative d-inline-block">
              {renderRemoveButton(0)}
              {mediaPreviews[0].includes("video") ? (
                  <video
                      src={mediaPreviews[0]}
                      controls
                      className="w-full h-[200px] object-cover rounded-lg"
                  />
              ) : (
                  <img
                      src={mediaPreviews[0]}
                      alt="preview"
                      className="w-full h-[200px] object-cover rounded-lg"
                  />
              )}
            </div>
          </div>
      );
    }

    if (mediaPreviews.length === 2) {
      return (
          <div style={{ ...containerStyle, gridTemplateColumns: "1fr 1fr" }}>
            {mediaPreviews.map((url, i) => (
                <div key={i} className="position-relative">
                  {renderRemoveButton(i)}
                  {url.includes("video") ? (
                      <video
                          src={url}
                          controls
                          className="w-full h-[200px] object-cover rounded-lg"
                      />
                  ) : (
                      <img
                          src={url}
                          alt="preview"
                          className="w-full h-[200px] object-cover rounded-lg"
                      />
                  )}
                </div>
            ))}
          </div>
      );
    }

    if (mediaPreviews.length === 3) {
      return (
          <div
              style={{
                ...containerStyle,
                gridTemplateRows: "auto auto",
                gridTemplateColumns: "1fr 1fr",
              }}
          >
            <div
                className="position-relative"
                style={{ gridColumn: "1 / 3", marginBottom: "4px" }}
            >
              {renderRemoveButton(0)}
              {mediaPreviews[0].includes("video") ? (
                  <video
                      src={mediaPreviews[0]}
                      controls
                      className="w-full h-[200px] object-cover rounded-lg"
                  />
              ) : (
                  <img
                      src={mediaPreviews[0]}
                      alt="preview"
                      className="w-full h-[200px] object-cover rounded-lg"
                  />
              )}
            </div>
            {mediaPreviews.slice(1).map((url, i) => (
                <div key={i + 1} className="position-relative">
                  {renderRemoveButton(i + 1)}
                  {url.includes("video") ? (
                      <video
                          src={url}
                          controls
                          className="w-full h-[200px] object-cover rounded-lg"
                      />
                  ) : (
                      <img
                          src={url}
                          alt="preview"
                          className="w-full h-[200px] object-cover rounded-lg"
                      />
                  )}
                </div>
            ))}
          </div>
      );
    }

    if (mediaPreviews.length >= 4) {
      return (
          <div
              style={{
                ...containerStyle,
                gridTemplateColumns: "1fr 1fr",
                gridTemplateRows: "auto auto",
              }}
          >
            {mediaPreviews.slice(0, 4).map((url, i) => (
                <div key={i} className="position-relative">
                  {renderRemoveButton(i)}
                  {url.includes("video") ? (
                      <video
                          src={url}
                          controls
                          className="w-full h-[200px] object-cover rounded-lg"
                      />
                  ) : (
                      <img
                          src={url}
                          alt="preview"
                          className="w-full h-[200px] object-cover rounded-lg"
                      />
                  )}
                </div>
            ))}
            {mediaPreviews.length > 4 && (
                <div
                    className="position-relative"
                    style={{ gridColumn: "2 / 3", gridRow: "2 / 3", cursor: "pointer" }}
                    onClick={() => handleOpenMediaModal(4)}
                >
                  {renderRemoveButton(4)}
                  <img
                      src={mediaPreviews[4]}
                      alt="preview"
                      className="w-full h-[200px] object-cover rounded-lg opacity-70"
                  />
                  <div
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white text-2xl font-bold"
                  >
                    <FaPlus /> +{mediaPreviews.length - 4}
                  </div>
                </div>
            )}
          </div>
      );
    }
  };

  return (
      <div className="mb-3 rounded-2xl shadow-sm border-0 bg-[var(--background-color)] text-[var(--text-color)] p-4">
      <textarea
          rows={3}
          placeholder="Bạn đang nghĩ gì?"
          className="w-full bg-[var(--input-bg-color)] text-[var(--text-color)] placeholder-[var(--text-color-muted)] border-none shadow-none rounded-lg p-3 focus:outline-none"
          value={tweetContent}
          onChange={(e) => setTweetContent(e.target.value)}
      />

        {mediaPreviews.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mt-3">
              {mediaPreviews.slice(0, 4).map((url, index) => (
                  <div key={index} className="relative">
                    <button
                        className="absolute top-1 right-1 bg-black bg-opacity-50 text-white p-1 rounded-full"
                        onClick={() => {
                          setMediaFiles((prev) => prev.filter((_, i) => i !== index));
                          setMediaPreviews((prev) => prev.filter((_, i) => i !== index));
                        }}
                    >
                      <AiOutlineClose size={14} />
                    </button>
                    {url.includes("video") ? (
                        <video src={url} controls className="w-full h-48 object-cover rounded-lg" />
                    ) : (
                        <img src={url} alt="preview" className="w-full h-48 object-cover rounded-lg" />
                    )}
                  </div>
              ))}
            </div>
        )}

        <div className="flex justify-between items-center mt-4">
          <div className="flex items-center gap-2">
            <label className="cursor-pointer">
              <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  className="hidden"
                  onChange={handleMediaChange}
              />
              <FaPollH className="text-primary" size={20} />
            </label>
            <FaSmile className="text-primary" size={20} />
            <FaCalendarAlt className="text-primary" size={20} />
          </div>

          <button
              className="bg-blue-500 text-white font-semibold rounded-full px-6 py-2 disabled:opacity-60"
              onClick={() => {}}
              disabled={!tweetContent.trim() || loading}
          >
            {loading ? "Đang đăng..." : "Đăng"}
          </button>
        </div>
      </div>
  );
}

export default TweetInput;
