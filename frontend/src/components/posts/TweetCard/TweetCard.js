import React, { useState, useContext } from "react";
import { Card, Button, Dropdown, OverlayTrigger, Tooltip } from "react-bootstrap";
import {
  FaRegComment, FaRetweet, FaRegHeart, FaShareAlt, FaEllipsisH, FaSave, FaFlag, FaEdit, FaTrash, FaSmile, FaUser
} from "react-icons/fa";
import moment from "moment";
import { AuthContext } from "../../context/AuthContext";
import EditPostModal from "../../components/posts/EditPostModal";

function TweetCard({ tweet, onPostUpdate }) {
  const { user } = useContext(AuthContext);
  const { id, owner, content, createdAt, commentCount, shareCount, likeCount, taggedUsers = [], privacySetting = "public" } = tweet;
  const isOwnTweet = user && user.username === owner.username;
  const [reaction, setReaction] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const handleEditTweet = () => {
    setShowEditModal(true);
  };

  const handleDeleteTweet = () => {
    if (window.confirm("Bạn có chắc muốn xóa bài đăng này?")) {
      alert(`Đã xóa bài đăng: ${content}`);
    }
  };

  const handleSaveTweet = () => {
    alert(`Đã lưu bài đăng: ${content}`);
  };

  const handleReportTweet = () => {
    alert(`Đã báo cáo bài đăng: ${content}`);
  };

  const handleEmojiReaction = (emoji) => {
    setReaction(emoji);
    alert(`Phản ứng với ${emoji}`);
  };

  const handleStatusChange = (newStatus) => {
    alert(`Đổi trạng thái bài đăng thành: ${newStatus}`);
  };

  return (
      <Card className="mb-3 rounded-4 shadow-sm border-0">
        <Card.Body className="d-flex p-3">
          <FaUser
              size={50}
              className="me-3 d-none d-md-block text-muted"
          />
          <div className="flex-grow-1">
            <div className="d-flex align-items-center justify-content-between mb-1">
              <div className="d-flex align-items-center">
                <h6 className="mb-0 fw-bold me-1">{owner.displayName}</h6>
                <span className="text-muted small me-1">@{owner.username}</span>
                <span className="text-muted small">
                · {moment(createdAt).fromNow()}
              </span>
              </div>
              <Dropdown>
                <Dropdown.Toggle
                    variant="link"
                    className="text-muted p-1 rounded-circle"
                    id="dropdown-tweet-options"
                >
                  <FaEllipsisH />
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  {isOwnTweet && (
                      <>
                        <Dropdown.Item onClick={handleEditTweet}>
                          <FaEdit className="me-2" /> Chỉnh sửa
                        </Dropdown.Item>
                        <Dropdown.Item onClick={handleDeleteTweet}>
                          <FaTrash className="me-2" /> Xóa
                        </Dropdown.Item>
                        <Dropdown.Item>
                          <Dropdown drop="end">
                            <Dropdown.Toggle variant="link" className="text-dark p-0">
                              <FaShareAlt className="me-2" /> Trạng thái: {privacySetting}
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
                        </Dropdown.Item>
                      </>
                  )}
                  <Dropdown.Item onClick={handleSaveTweet}>
                    <FaSave className="me-2" /> Lưu bài đăng
                  </Dropdown.Item>
                  <Dropdown.Item onClick={handleReportTweet}>
                    <FaFlag className="me-2" /> Báo cáo
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </div>
            <p className="mb-2">{content}</p>
            {taggedUsers.length > 0 && (
                <div className="mb-2">
                  <small className="text-muted">
                    Đã tag: {taggedUsers.map((tag, index) => (
                      <span key={index} className="text-primary me-1">
                    @{tag.username}
                  </span>
                  ))}
                  </small>
                </div>
            )}
            <div className="d-flex justify-content-between text-muted mt-2">
              <Button
                  variant="link"
                  className="text-muted p-1 rounded-circle hover-bg-light"
              >
                <FaRegComment size={18} className="me-1" />{" "}
                {commentCount > 0 && commentCount}
              </Button>
              <Button
                  variant="link"
                  className="text-muted p-1 rounded-circle hover-bg-light"
              >
                <FaRetweet size={18} className="me-1" />{" "}
                {shareCount > 0 && shareCount}
              </Button>
              <OverlayTrigger
                  placement="top"
                  overlay={
                    <Tooltip id="emoji-tooltip">
                      Chọn biểu cảm
                    </Tooltip>
                  }
              >
                <Dropdown>
                  <Dropdown.Toggle
                      variant="link"
                      className="text-muted p-1 rounded-circle hover-bg-light"
                  >
                    {reaction ? (
                        <span>{reaction} </span>
                    ) : (
                        <FaRegHeart size={18} className="me-1" />
                    )}
                    {likeCount > 0 && likeCount}
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item onClick={() => handleEmojiReaction("😊")}>😊</Dropdown.Item>
                    <Dropdown.Item onClick={() => handleEmojiReaction("❤️")}>❤️</Dropdown.Item>
                    <Dropdown.Item onClick={() => handleEmojiReaction("👍")}>👍</Dropdown.Item>
                    <Dropdown.Item onClick={() => handleEmojiReaction("😂")}>😂</Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </OverlayTrigger>
              <Button
                  variant="link"
                  className="text-muted p-1 rounded-circle hover-bg-light"
              >
                <FaShareAlt size={18} />
              </Button>
            </div>
          </div>
        </Card.Body>
        {isOwnTweet && (
            <EditPostModal
                post={tweet}
                show={showEditModal}
                onHide={() => setShowEditModal(false)}
                onSave={() => {
                  setShowEditModal(false);
                  if (onPostUpdate) onPostUpdate();
                }}
            />
        )}
      </Card>
  );
}

export default TweetCard;