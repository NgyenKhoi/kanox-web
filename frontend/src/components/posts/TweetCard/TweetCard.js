// src/components/posts/TweetCard/TweetCard.jsx
import React from "react";
import { Card, Image, Button } from "react-bootstrap";
import {
  FaRegComment,
  FaRetweet,
  FaRegHeart,
  FaShareAlt,
} from "react-icons/fa"; // Icons tương tác
import moment from "moment"; // Để định dạng thời gian (cần cài đặt: npm install moment)

// Cài đặt thư viện moment nếu chưa có: npm install moment
// Import moment ở đầu file

function TweetCard({ tweet }) {
  const { user, content, imageUrl, timestamp, comments, retweets, likes } =
      tweet;

  return (
      <Card className="mb-3 rounded-4 shadow-sm border-0">
        <Card.Body className="d-flex p-3">
          <Image
              src={user.avatar}
              alt={`${user.name}'s Avatar`}
              roundedCircle
              width={50}
              height={50}
              className="me-3"
          />
          <div className="flex-grow-1">
            <div className="d-flex align-items-center mb-1">
              <h6 className="mb-0 fw-bold me-1">{user.name}</h6>
              <span className="text-muted small me-1">@{user.username}</span>
              <span className="text-muted small">
              · {moment(timestamp).fromNow()}
            </span>{" "}
              {/* Thời gian */}
            </div>
            <p className="mb-2">{content}</p>
            {imageUrl && <Image src={imageUrl} fluid rounded className="mb-2" />}
            <div className="d-flex justify-content-between text-muted mt-2">
              <Button
                  variant="link"
                  className="text-muted p-1 rounded-circle hover-bg-light"
              >
                <FaRegComment size={18} className="me-1" />{" "}
                {comments > 0 && comments}
              </Button>
              <Button
                  variant="link"
                  className="text-muted p-1 rounded-circle hover-bg-light"
              >
                <FaRetweet size={18} className="me-1" />{" "}
                {retweets > 0 && retweets}
              </Button>
              <Button
                  variant="link"
                  className="text-muted p-1 rounded-circle hover-bg-light"
              >
                <FaRegHeart size={18} className="me-1" /> {likes > 0 && likes}
              </Button>
              <Button
                  variant="link"
                  className="text-muted p-1 rounded-circle hover-bg-light"
              >
                <FaShareAlt size={18} />
              </Button>
            </div>
          </div>
        </Card.Body>
      </Card>
  );
}

export default TweetCard;