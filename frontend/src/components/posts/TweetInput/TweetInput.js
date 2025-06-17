import React, { useState, useEffect, useContext } from "react";
import {
  Card,
  Form,
  Button,
  Dropdown,
  FormControl,
  OverlayTrigger,
  Tooltip,
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

      // upload media nếu có
      if (mediaFiles.length > 0) {
        const formData = new FormData();
        formData.append("userId", user.id);
        formData.append("caption", tweetContent);
        mediaFiles.forEach((file) => formData.append("files", file));

        const mediaRes = await fetch(
          `${process.env.REACT_APP_API_URL}/api/media/posts/${postId}/media`,
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

  const handleMediaChange = (e) => {
    const files = Array.from(e.target.files);
    setMediaFiles(files);
    setMediaPreviews(files.map((f) => URL.createObjectURL(f)));
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

  return (
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

        <Form.Group controlId="mediaUpload" className="mb-2">
          <Form.Control
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={handleMediaChange}
          />
        </Form.Group>

        {mediaPreviews.length > 0 && (
          <div className="d-flex flex-wrap mb-2 gap-2">
            {mediaPreviews.map((url, i) => (
              <div key={i} style={{ maxWidth: "150px" }}>
                {url.includes("video") ? (
                  <video src={url} controls width="100%" />
                ) : (
                  <img src={url} alt="preview" className="img-fluid rounded" />
                )}
              </div>
            ))}
          </div>
        )}

        {taggedUserIds.length > 0 && (
          <div className="d-flex flex-wrap mb-2">
            {taggedUserIds.map((tagId, index) => (
              <span
                key={index}
                className="badge bg-primary text-white me-2 mb-1"
              >
                @User_{tagId}
                <Button
                  variant="link"
                  className="text-white p-0 ms-1"
                  onClick={() => handleRemoveTag(tagId)}
                >
                  x
                </Button>
              </span>
            ))}
          </div>
        )}

        {status === "custom" && (
          <Dropdown className="mb-2">
            <Dropdown.Toggle
              variant="outline-primary"
              className="w-100 text-start rounded-pill"
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
                >
                  {list.listName}
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>
        )}

        {error && <p className="text-danger">{error}</p>}

        <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top flex-wrap">
          <div className="d-flex align-items-center mb-2 mb-md-0">
            <Button
              variant="link"
              className="text-primary p-2 rounded-circle hover-bg-light me-2"
            >
              <FaPollH size={20} />
            </Button>
            <Button
              variant="link"
              className="text-primary p-2 rounded-circle hover-bg-light me-2"
            >
              <FaSmile size={20} />
            </Button>
            <Button
              variant="link"
              className="text-primary p-2 rounded-circle hover-bg-light me-2"
            >
              <FaCalendarAlt size={20} />
            </Button>

            <Dropdown className="me-2">
              <Dropdown.Toggle
                variant="link"
                className="text-primary p-2 rounded-circle hover-bg-light"
              >
                <FaUserFriends size={20} />
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <div className="p-2 d-flex align-items-center">
                  <FormControl
                    type="text"
                    placeholder="Nhập username"
                    value={tagInput}
                    onChange={handleTagInputChange}
                    className="me-2"
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleAddTag}
                    disabled={!tagInput.trim()}
                  >
                    Thêm
                  </Button>
                </div>
              </Dropdown.Menu>
            </Dropdown>

            <OverlayTrigger
              placement="top"
              overlay={
                <Tooltip id="status-tooltip">
                  Chọn đối tượng xem bài đăng
                </Tooltip>
              }
            >
              <Dropdown>
                <Dropdown.Toggle
                  variant="outline-primary"
                  className="rounded-pill px-3 py-1 d-flex align-items-center"
                >
                  {renderStatusIcon(status)}
                  {renderStatusText(status)}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item onClick={() => handleStatusChange("public")}>
                    <FaGlobeAmericas className="me-2" /> Công khai
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => handleStatusChange("friends")}>
                    <FaUserFriends className="me-2" /> Bạn bè
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => handleStatusChange("only_me")}>
                    <FaLock className="me-2" /> Chỉ mình tôi
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => handleStatusChange("custom")}>
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
            {loading ? "Đang đăng..." : "Tweet"}
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
}

export default TweetInput;
