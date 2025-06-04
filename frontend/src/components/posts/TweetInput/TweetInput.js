import React, { useState } from "react";
import { Card, Form, Button, Image, Dropdown, FormControl } from "react-bootstrap";
import {
  FaImage,
  FaPollH,
  FaSmile,
  FaCalendarAlt,
  FaPaperclip,
  FaUserFriends,
} from "react-icons/fa";

function TweetInput() {
  const [tweetContent, setTweetContent] = useState("");
  const [status, setStatus] = useState("public");
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");

  const handleTweetChange = (e) => {
    setTweetContent(e.target.value);
  };

  const handleTagInputChange = (e) => {
    setTagInput(e.target.value);
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleStatusChange = (newStatus) => {
    setStatus(newStatus);
  };

  const handleAttachFile = () => {
    alert("Tính năng đính kèm file đang phát triển!");
  };

  const handleSubmitTweet = () => {
    if (tweetContent.trim()) {
      alert(`Đăng tweet: ${tweetContent}\nTrạng thái: ${status}\nTag: ${tags.join(", ")}`);
      setTweetContent("");
      setTags([]);
      setStatus("public");
    } else {
      alert("Tweet không được để trống!");
    }
  };

  return (
      <Card className="mb-3 rounded-4 shadow-sm border-0">
        <Card.Body>
          <div className="d-flex align-items-start">
            <Image
                src="https://via.placeholder.com/50"
                alt="User Avatar"
                roundedCircle
                width={50}
                height={50}
                className="me-3 d-none d-md-block"
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
              {tags.length > 0 && (
                  <div className="d-flex flex-wrap mb-2">
                    {tags.map((tag, index) => (
                        <span
                            key={index}
                            className="badge bg-primary text-white me-2 mb-1"
                        >
                    @{tag}{" "}
                          <Button
                              variant="link"
                              className="text-white p-0"
                              onClick={() => handleRemoveTag(tag)}
                          >
                      x
                    </Button>
                  </span>
                    ))}
                  </div>
              )}
            </div>
          </div>
          <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top flex-wrap">
            <div className="d-flex align-items-center mb-2 mb-md-0">
              <Button
                  variant="link"
                  className="text-primary p-2 rounded-circle hover-bg-light me-2"
              >
                <FaImage size={20} />
              </Button>
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
              <Button
                  variant="link"
                  className="text-primary p-2 rounded-circle hover-bg-light me-2"
                  onClick={handleAttachFile}
              >
                <FaPaperclip size={20} />
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
                disabled={!tweetContent.trim()}
            >
              Tweet
            </Button>
          </div>
        </Card.Body>
      </Card>
  );
}

export default TweetInput;