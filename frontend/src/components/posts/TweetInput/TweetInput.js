import React, { useState } from "react";
import { Card, Form, Button, Dropdown, FormControl } from "react-bootstrap";
import {
  FaPollH, FaSmile, FaCalendarAlt, FaUserFriends, FaUser
} from "react-icons/fa";
import { useContext } from "react";
import { AuthContext } from "../../../context/AuthContext";

function TweetInput({ onPostSuccess }) {
  const { user } = useContext(AuthContext);
  const [tweetContent, setTweetContent] = useState("");
  const [status, setStatus] = useState("public");
  const [taggedUserIds, setTaggedUserIds] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleTweetChange = (e) => {
    setTweetContent(e.target.value);
  };

  const handleTagInputChange = (e) => {
    setTagInput(e.target.value);
  };

  const handleAddTag = async () => {
    if (tagInput.trim() && !taggedUserIds.includes(tagInput.trim())) {
      try {
        const token = localStorage.getItem("token");
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
        setTaggedUserIds([...taggedUserIds, data.id]);
        setTagInput("");
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleRemoveTag = (tagId) => {
    setTaggedUserIds(taggedUserIds.filter((id) => id !== tagId));
  };

  const handleStatusChange = (newStatus) => {
    setStatus(newStatus);
  };

  const handleSubmitTweet = async () => {
    if (!tweetContent.trim()) {
      setError("Tweet không được để trống!");
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.REACT_APP_API_URL}/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: tweetContent,
          privacySetting: status,
          taggedUserIds,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Không thể đăng bài!");
      }
      setTweetContent("");
      setTaggedUserIds([]);
      setStatus("public");
      setError(null);
      if (onPostSuccess) onPostSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
      <Card className="mb-3 rounded-4 shadow-sm border-0">
        <Card.Body>
          <div className="d-flex align-items-start">
            <FaUser
                size={50}
                className="me-3 d-none d-md-block text-muted"
            />
            <div className="flex-grow-1">
              <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="What's happening?"
                  className="border-0 shadow-none mb-2"
                  style={{ resize: "none" }}
                  value={tweetContent}
                  onChange={handleTweetChange}
              />
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
                              className="text-white p-0"
                              onClick={() => handleRemoveTag(tagId)}
                          >
                      x
                    </Button>
                  </span>
                    ))}
                  </div>
              )}
              {error && <p className="text-danger">{error}</p>}
            </div>
          </div>
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
              <Dropdown>
                <Dropdown.Toggle
                    variant="link"
                    className="text-primary p-2 rounded-circle hover-bg-light"
                >
                  Trạng thái: {status}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item onClick={() => handleStatusChange("public")}>
                    Công khai
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => handleStatusChange("friends")}>
                    Bạn bè
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => handleStatusChange("private")}>
                    Riêng tư
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </div>
            <Button
                variant="primary"
                className="rounded-pill px-4 fw-bold"
                onClick={handleSubmitTweet}
                disabled={!tweetContent.trim() || loading}
            >
              {loading ? "Đang đăng..." : "Tweet"}
            </Button>
          </div>
        </Card.Body>
      </Card>
  );
}

export default TweetInput;