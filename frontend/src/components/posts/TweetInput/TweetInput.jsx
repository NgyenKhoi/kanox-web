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
      <>
        <Card className="mb-3 rounded-2xl shadow-sm border-0 bg-[var(--background-color)] text-[var(--text-color)]">
          <Card.Body>
            <FormControl
                as="textarea"
                rows={3}
                placeholder="Bạn đang nghĩ gì?"
                className="border-0 shadow-none mb-2 bg-[var(--input-bg-color)] text-[var(--text-color)]"
                style={{ resize: "none" }}
                value={tweetContent}
                onChange={(e) => setTweetContent(e.target.value)}
            />

            {renderMediaPreview()}

            {taggedUserIds.length > 0 && (
                <div className="d-flex flex-wrap mb-2">
                  {taggedUserIds.map((tagId, index) => (
                      <span
                          key={index}
                          className="badge bg-primary text-white me-2 mb-1 rounded-pill"
                      >
                  @User_{tagId}
                        <Button
                            variant="link"
                            className="text-white p-0 ms-1"
                            onClick={() => handleRemoveTag(tagId)}
                        >
                    <AiOutlineClose size={12} />
                  </Button>
                </span>
                  ))}
                </div>
            )}

            {status === "custom" && (
                <Dropdown className="mb-2">
                  <Dropdown.Toggle
                      variant="outline-primary"
                      className="w-100 text-start rounded-pill bg-[var(--input-bg-color)] text-[var(--text-color)] border-[var(--border-color)]"
                  >
                    {customListId
                        ? customLists.find((l) => l.id === customListId)?.listName
                        : "Chọn danh sách tùy chỉnh"}
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    {customLists.map((list) => (
                        <Dropdown.Item
                            key={list.id}
                            onClick={() => handleCustomListSelect(list.id)}
                            className="text-[var(--text-color)]"
                        >
                          {list.listName}
                        </Dropdown.Item>
                    ))}
                  </Dropdown.Menu>
                </Dropdown>
            )}

            {error && <p className="text-[var(--error-color)]">{error}</p>}

            <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-t border-[var(--border-color)] flex-wrap">
              <div className="d-flex align-items-center mb-2 mb-md-0">
                <div className="position-relative me-2">
                  <Button
                      variant="link"
                      className="text-primary p-2 rounded-full hover-bg-light"
                      onClick={() =>
                          document.getElementById("hiddenMediaInput").click()
                      }
                  >
                    <FaPollH size={20} />
                  </Button>
                  <input
                      type="file"
                      id="hiddenMediaInput"
                      accept="image/*,video/*"
                      multiple
                      style={{ display: "none" }}
                      onChange={handleMediaChange}
                  />
                </div>

                <Button
                    variant="link"
                    className="text-primary p-2 rounded-full hover-bg-light me-2"
                >
                  <FaSmile size={20} />
                </Button>
                <Button
                    variant="link"
                    className="text-primary p-2 rounded-full hover-bg-light me-2"
                >
                  <FaCalendarAlt size={20} />
                </Button>

                <Dropdown className="me-2">
                  <Dropdown.Toggle
                      variant="link"
                      className="text-primary p-2 rounded-full hover-bg-light"
                  >
                    <FaUserFriends size={20} />
                  </Dropdown.Toggle>
                  <Dropdown.Menu className="bg-[var(--background-color)]">
                    <div className="p-2 d-flex align-items-center">
                      <FormControl
                          type="text"
                          placeholder="Nhập username"
                          value={tagInput}
                          onChange={handleTagInputChange}
                          className="me-2 bg-[var(--input-bg-color)] border-[var(--border-color)] text-[var(--text-color)]"
                      />
                      <Button
                          variant="primary"
                          size="sm"
                          onClick={handleAddTag}
                          disabled={!tagInput.trim()}
                          className="rounded-full"
                      >
                        Thêm
                      </Button>
                    </div>
                  </Dropdown.Menu>
                </Dropdown>

                <OverlayTrigger
                    placement="top"
                    overlay={
                      <Tooltip id="status-tooltip" className="text-[var(--text-color)] bg-[var(--tooltip-bg-color)]">
                        Chọn đối tượng xem bài đăng
                      </Tooltip>
                    }
                >
                  <Dropdown>
                    <Dropdown.Toggle
                        variant="outline-primary"
                        className="rounded-pill px-3 py-1 d-flex align-items-center bg-[var(--input-bg-color)] text-[var(--text-color)] border-[var(--border-color)]"
                    >
                      {renderStatusIcon(status)}
                      {renderStatusText(status)}
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      <Dropdown.Item onClick={() => handleStatusChange("public")} className="text-[var(--text-color)]">
                        <FaGlobeAmericas className="me-2" /> Công khai
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => handleStatusChange("friends")} className="text-[var(--text-color)]">
                        <FaUserFriends className="me-2" /> Bạn bè
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => handleStatusChange("only_me")} className="text-[var(--text-color)]">
                        <FaLock className="me-2" /> Chỉ mình tôi
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => handleStatusChange("custom")} className="text-[var(--text-color)]">
                        <FaList className="me-2" /> Tùy chỉnh
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </OverlayTrigger>
              </div>

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
                {loading ? "Đang đăng..." : "Đăng"}
              </Button>
            </div>
          </Card.Body>
        </Card>

        <Modal
            show={showMediaModal}
            onHide={handleCloseMediaModal}
            centered
            size="lg"
            className="bg-[var(--background-color)] text-[var(--text-color)]"
        >
          <Modal.Body className="p-0 position-relative">
            <Button
                variant="dark"
                className="position-absolute top-2 end-2 rounded-full"
                onClick={handleCloseMediaModal}
            >
              <AiOutlineClose size={16} />
            </Button>
            <Button
                variant="dark"
                className="position-absolute top-1/2 -translate-y-1/2 start-2 rounded-full"
                onClick={handlePrevMedia}
                style={{ zIndex: 1 }}
            >
              <FaChevronLeft />
            </Button>
            <Button
                variant="dark"
                className="position-absolute top-1/2 -translate-y-1/2 end-2 rounded-full"
                onClick={handleNextMedia}
                style={{ zIndex: 1 }}
            >
              <FaChevronRight />
            </Button>
            {mediaPreviews[currentMediaIndex]?.includes("video") ? (
                <video
                    src={mediaPreviews[currentMediaIndex]}
                    controls
                    className="w-full max-h-[60vh] object-contain"
                />
            ) : (
                <img
                    src={mediaPreviews[currentMediaIndex]}
                    alt="media"
                    className="w-full max-h-[60vh] object-contain"
                />
            )}
          </Modal.Body>
        </Modal>
      </>
  );
}

export default TweetInput;