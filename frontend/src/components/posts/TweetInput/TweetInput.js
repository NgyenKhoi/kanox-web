// src/components/posts/TweetInput/TweetInput.jsx
import React, { useState } from "react";
import { Card, Form, Button, Image } from "react-bootstrap";
import {
  FaImage,
  FaPollH,
  FaSmile,
  FaCalendarAlt,
  FaPaperclip,
} from "react-icons/fa"; // Bỏ FaGif, thêm FaPaperclip nếu muốn

function TweetInput() {
  const [tweetContent, setTweetContent] = useState("");

  const handleTweetChange = (e) => {
    setTweetContent(e.target.value);
  };

  const handleSubmitTweet = () => {
    if (tweetContent.trim()) {
      alert("Đăng tweet: " + tweetContent); // Logic xử lý đăng tweet thực tế
      setTweetContent(""); // Xóa nội dung sau khi đăng
    } else {
      alert("Tweet không được để trống!");
    }
  };

  return (
      <Card className="mb-3 rounded-4 shadow-sm border-0">
        <Card.Body>
          <div className="d-flex align-items-start">
            <Image
                src="https://via.placeholder.com/50" // Ảnh đại diện người dùng hiện tại
                alt="User Avatar"
                roundedCircle
                width={50}
                height={50}
                className="me-3"
            />
            <Form.Control
                as="textarea"
                rows={3}
                placeholder="What's happening?"
                className="border-0 shadow-none" // Loại bỏ border và shadow mặc định của form-control
                style={{ resize: "none" }}
                value={tweetContent}
                onChange={handleTweetChange}
            />
          </div>
          <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
            <div>
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
                {/* <FaGif size={20} /> */}
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
                  className="text-primary p-2 rounded-circle hover-bg-light"
              >
                <FaCalendarAlt size={20} />
              </Button>
            </div>
            <Button
                variant="primary"
                className="rounded-pill px-4 fw-bold"
                onClick={handleSubmitTweet}
                disabled={!tweetContent.trim()} // Vô hiệu hóa nút nếu tweet rỗng
            >
              Tweet
            </Button>
          </div>
        </Card.Body>
      </Card>
  );
}

export default TweetInput;