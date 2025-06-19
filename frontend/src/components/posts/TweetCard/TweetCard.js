import React, { useState, useContext } from "react";
import {
  Card,
  Button,
  Dropdown,
  OverlayTrigger,
  Tooltip,
  Image as BootstrapImage,
  Row,
  Col,
  Modal,
} from "react-bootstrap";
import {
  FaRegComment,
  FaRetweet,
  FaRegHeart,
  FaShareAlt,
  FaEllipsisH,
  FaSave,
  FaFlag,
  FaEdit,
  FaTrash,
  FaGlobeAmericas,
  FaUserFriends,
  FaLock,
  FaList,
  FaUserCircle,
} from "react-icons/fa";
import moment from "moment";
import { AuthContext } from "../../../context/AuthContext";
import EditPostModal from "../TweetInput/EditPostModal";
import useMedia from "../../../hooks/useMedia";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

// Thêm CSS inline hoặc có thể đưa vào file CSS riêng
const imageContainerStyles = {
  overflow: "hidden",
  borderRadius: "12px",
  marginBottom: "8px",
};

const imageStyles = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  display: "block",
  cursor: "pointer", // Add cursor pointer to indicate clickability
};

const enlargedImageStyles = {
  maxWidth: "100%",
  maxHeight: "80vh",
  objectFit: "contain",
  margin: "auto",
  display: "block",
};

function TweetCard({ tweet, onPostUpdate }) {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const {
    id,
    owner,
    content,
    createdAt,
    commentCount,
    shareCount,
    likeCount,
    taggedUsers = [],
    privacySetting = "public",
  } = tweet;

  const isOwnTweet = user && user.username === owner.username;
  const [reaction, setReaction] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const { mediaUrl: avatarUrl } = useMedia(owner.id, "PROFILE", "image");
  const { mediaUrls: imageUrls } = useMedia(id, "POST", "image");
  const { mediaUrls: videoUrls } = useMedia(id, "POST", "video");

  const handleEditTweet = () => setShowEditModal(true);

  const handleDeleteTweet = async () => {
    if (window.confirm("Bạn có chắc muốn xóa bài đăng này?")) {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/posts/${id}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!response.ok) throw new Error("Không thể xóa bài đăng!");
        toast.success("Đã xóa bài đăng!");
        if (onPostUpdate) onPostUpdate();
      } catch (err) {
        toast.error(err.message);
      }
    }
  };

  const handleSaveTweet = () => alert(`Đã lưu bài đăng: ${content}`);
  const handleReportTweet = () => alert(`Đã báo cáo bài đăng: ${content}`);
  const handleEmojiReaction = (emoji) => {
    setReaction(emoji);
    alert(`Phản ứng với ${emoji}`);
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/posts/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            content,
            privacySetting: newStatus,
            taggedUserIds: taggedUsers.map((u) => u.id),
            customListId: newStatus === "custom" ? tweet.customListId : null,
          }),
        }
      );
      if (!response.ok) throw new Error("Không thể cập nhật trạng thái!");
      toast.success("Cập nhật trạng thái thành công!");
      if (onPostUpdate) onPostUpdate();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleNavigateToProfile = () => {
    if (owner.username && owner.username !== "unknown") {
      navigate(`/profile/${owner.username}`);
    }
  };

  const handleImageClick = (url) => {
    setSelectedImage(url);
    setShowImageModal(true);
  };

  const renderStatusIcon = (status) => {
    switch (status) {
      case "public":
        return <FaGlobeAmericas className="text-primary" />;
      case "friends":
        return <FaUserFriends className="text-success" />;
      case "only_me":
        return <FaLock className="text-danger" />;
      case "custom":
        return <FaList className="text-info" />;
      default:
        return <FaGlobeAmericas className="text-primary" />;
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

  // Hàm render ảnh với bố cục giống Facebook
  const renderImages = (images) => {
    if (!images || images.length === 0) return null;

    const imageCount = images.length;

    if (imageCount === 1) {
      return (
        <div style={imageContainerStyles}>
          <BootstrapImage
            src={images[0]}
            style={{ ...imageStyles, maxHeight: "500px" }}
            fluid
            rounded
            onClick={() => handleImageClick(images[0])}
          />
        </div>
      );
    }

    if (imageCount === 2) {
      return (
        <Row style={imageContainerStyles} className="g-2">
          {images.map((url, idx) => (
            <Col key={idx} xs={6}>
              <BootstrapImage
                src={url}
                style={{ ...imageStyles, height: "300px" }}
                fluid
                rounded
                onClick={() => handleImageClick(url)}
              />
            </Col>
          ))}
        </Row>
      );
    }

    if (imageCount === 3) {
      return (
        <Row style={imageContainerStyles} className="g-2">
          <Col xs={6}>
            <BootstrapImage
              src={images[0]}
              style={{ ...imageStyles, height: "400px" }}
              fluid
              rounded
              onClick={() => handleImageClick(images[0])}
            />
          </Col>
          <Col xs={6}>
            <div className="d-flex flex-column h-100 g-2">
              <BootstrapImage
                src={images[1]}
                style={{ ...imageStyles, height: "198px", marginBottom: "4px" }}
                fluid
                rounded
                onClick={() => handleImageClick(images[1])}
              />
              <BootstrapImage
                src={images[2]}
                style={{ ...imageStyles, height: "198px" }}
                fluid
                rounded
                onClick={() => handleImageClick(images[2])}
              />
            </div>
          </Col>
        </Row>
      );
    }

    if (imageCount === 4) {
      return (
        <Row style={imageContainerStyles} className="g-2">
          {images.map((url, idx) => (
            <Col key={idx} xs={6}>
              <BootstrapImage
                src={url}
                style={{ ...imageStyles, height: "200px" }}
                fluid
                rounded
                onClick={() => handleImageClick(url)}
              />
            </Col>
          ))}
        </Row>
      );
    }

    // Trường hợp 5 ảnh trở lên
    return (
      <Row style={imageContainerStyles} className="g-2">
        {images.slice(0, 4).map((url, idx) => (
          <Col key={idx} xs={6}>
            <div style={{ position: "relative" }}>
              <BootstrapImage
                src={url}
                style={{ ...imageStyles, height: "200px" }}
                fluid
                rounded
                onClick={() => handleImageClick(url)}
              />
              {idx === 3 && images.length > 4 && (
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    background: "rgba(0, 0, 0, 0.5)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontSize: "24px",
                    fontWeight: "bold",
                    borderRadius: "12px",
                  }}
                >
                  +{images.length - 4}
                </div>
              )}
            </div>
          </Col>
        ))}
      </Row>
    );
  };

  return (
    <>
      <Card className="mb-3 rounded-4 shadow-sm border-0">
        <Card.Body className="d-flex p-3">
          {avatarUrl ? (
            <BootstrapImage
              src={avatarUrl}
              alt="Avatar"
              width={50}
              height={50}
              roundedCircle
              className="me-3 d-none d-md-block"
            />
          ) : (
            <FaUserCircle
              size={50}
              className="me-3 d-none d-md-block text-secondary"
            />
          )}
          <div className="flex-grow-1">
            <div className="d-flex align-items-center justify-content-between mb-1">
              <div className="d-flex align-items-center">
                <h6
                  className="mb-0 fw-bold me-1 cursor-pointer"
                  onClick={handleNavigateToProfile}
                  style={{ cursor: "pointer" }}
                >
                  {owner.displayName}
                </h6>
                <span className="text-muted small me-1">@{owner.username}</span>
                <span className="text-muted small me-1">
                  · {moment(createdAt).fromNow()}
                </span>
                <OverlayTrigger
                  placement="top"
                  overlay={
                    <Tooltip>{renderStatusText(privacySetting)}</Tooltip>
                  }
                >
                  <span>{renderStatusIcon(privacySetting)}</span>
                </OverlayTrigger>
              </div>
              <Dropdown>
                <Dropdown.Toggle
                  variant="link"
                  className="text-muted p-1 rounded-circle"
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
                      <Dropdown drop="end">
                        <Dropdown.Toggle
                          variant="link"
                          className="text-dark p-0 w-100 text-start"
                        >
                          <FaShareAlt className="me-2" /> Trạng thái:{" "}
                          {renderStatusText(privacySetting)}
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                          <Dropdown.Item
                            onClick={() => handleStatusChange("public")}
                          >
                            <FaGlobeAmericas className="me-2" /> Công khai
                          </Dropdown.Item>
                          <Dropdown.Item
                            onClick={() => handleStatusChange("friends")}
                          >
                            <FaUserFriends className="me-2" /> Bạn bè
                          </Dropdown.Item>
                          <Dropdown.Item
                            onClick={() => handleStatusChange("only_me")}
                          >
                            <FaLock className="me-2" /> Chỉ mình tôi
                          </Dropdown.Item>
                          <Dropdown.Item
                            onClick={() => handleStatusChange("custom")}
                          >
                            <FaList className="me-2" /> Tùy chỉnh
                          </Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
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
                  Đã tag:{" "}
                  {taggedUsers.map((tag, index) => (
                    <span key={index} className="text-primary me-1">
                      @{tag.username}
                    </span>
                  ))}
                </small>
              </div>
            )}

            {/* Hiển thị ảnh với bố cục mới */}
            {renderImages(imageUrls)}

            {/* Videos */}
            {videoUrls?.length > 0 &&
              videoUrls.map((url, idx) => (
                <div key={idx} className="mb-2">
                  <video controls width="100%" style={{ borderRadius: "12px" }}>
                    <source src={url} type="video/mp4" />
                    Trình duyệt không hỗ trợ phát video.
                  </video>
                </div>
              ))}

            <div className="d-flex justify-content-between text-muted mt-2">
              <Button
                variant="link"
                className="text-muted p-1 rounded-circle hover-bg-light"
              >
                <FaRegComment size={18} className="me-1" />
                {commentCount > 0 && commentCount}
              </Button>
              <Button
                variant="link"
                className="text-muted p-1 rounded-circle hover-bg-light"
              >
                <FaRetweet size={18} className="me-1" />
                {shareCount > 0 && shareCount}
              </Button>
              <OverlayTrigger
                placement="top"
                overlay={<Tooltip>Chọn biểu cảm</Tooltip>}
              >
                <Dropdown>
                  <Dropdown.Toggle
                    variant="link"
                    className="text-muted p-1 rounded-circle hover-bg-light"
                  >
                    {reaction ? (
                      <span>{`${reaction} `}</span>
                    ) : (
                      <FaRegHeart size={18} className="me-1" />
                    )}
                    {likeCount > 0 && likeCount}
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    {["😊", "❤️", "👍", "😂"].map((emoji) => (
                      <Dropdown.Item
                        key={emoji}
                        onClick={() => handleEmojiReaction(emoji)}
                      >
                        {emoji}
                      </Dropdown.Item>
                    ))}
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

      {/* Image Zoom Modal */}
      <Modal
        show={showImageModal}
        onHide={() => setShowImageModal(false)}
        centered
        size="xl"
        contentClassName="bg-dark"
      >
        <Modal.Body className="p-0">
          <Button
            variant="link"
            className="text-white position-absolute top-0 end-0 m-2"
            onClick={() => setShowImageModal(false)}
          >
            ✕
          </Button>
          {selectedImage && (
            <BootstrapImage
              src={selectedImage}
              style={enlargedImageStyles}
              fluid
            />
          )}
        </Modal.Body>
      </Modal>
    </>
  );
}

export default TweetCard;
