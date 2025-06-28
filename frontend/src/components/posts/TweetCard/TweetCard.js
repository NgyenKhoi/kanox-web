import React, { useState, useContext, useCallback, useEffect } from "react";
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
  Form,
  InputGroup,
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
  FaArrowLeft,
  FaArrowRight,
} from "react-icons/fa";
import moment from "moment";
import { AuthContext } from "../../../context/AuthContext";
import EditPostModal from "../TweetInput/EditPostModal";
import useMedia from "../../../hooks/useMedia";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import CommentItem from "./CommentItem";
import CommentThread from "./CommentThread";
import useReaction from "../../../hooks/useReaction";

// Inline styles
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
  cursor: "pointer",
};

const enlargedImageStyles = {
  maxWidth: "100%",
  maxHeight: "80vh",
  objectFit: "contain",
  margin: "auto",
  display: "block",
};

const arrowButtonStyles = {
  position: "absolute",
  top: "50%",
  transform: "translateY(-50%)",
  background: "rgba(0, 0, 0, 0.5)",
  color: "white",
  borderRadius: "50%",
  width: "40px",
  height: "40px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};

const commentSectionStyles = {
  marginTop: "10px",
  padding: "10px 0",
  borderTop: "1px solid #e6ecf0",
};


const commentStyles = {
  display: "flex",
  alignItems: "flex-start",
  marginBottom: "10px",
};


const commentContentStyles = {
  backgroundColor: "#f0f2f5",
  borderRadius: "16px",
  padding: "8px 12px",
  maxWidth: "80%",
};

function TweetCard({ tweet, onPostUpdate }) {
  const { user, loading, token } = useContext(AuthContext);
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
  } = tweet || {};

  const isOwnTweet = user && user.username === owner?.username;
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(true);

  const currentUserId = user?.id;
  const ownerId = owner?.id || null;
  const postId = id || null;
  const targetTypeId = tweet?.targetTypeId || 1;

  const {
    reaction,
    sendReaction,
    removeReaction,
  } = useReaction({ targetId: postId, targetTypeId, user });

  const avatarMedia = useMedia([ownerId], "PROFILE", "image");
  const imageMedia = useMedia([postId], "POST", "image");
  const videoMedia = useMedia([postId], "POST", "video");
  const avatarData = !loading && token && ownerId ? avatarMedia.mediaData : {};
  const avatarError = avatarMedia.error;
  const imageData = !loading && token && postId ? imageMedia.mediaData : {};
  const mediaError = imageMedia.error;
  const videoData = !loading && token && postId ? videoMedia.mediaData : {};
  const videoError = videoMedia.error;

  const avatarUrl = avatarData?.[ownerId]?.[0]?.url || null;
  const imageUrls = imageData?.[postId] || [];
  const videoUrls = videoData?.[postId] || [];


  const handleNextImage = () => {
    if (currentImageIndex < imageUrls.length - 1) {
      setCurrentImageIndex((prev) => prev + 1);
      setSelectedImage(imageUrls[currentImageIndex + 1].url);
    }
  };

  const handlePrevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex((prev) => prev - 1);
      setSelectedImage(imageUrls[currentImageIndex - 1].url);
    }
  };

  const handleImageClick = (url, index) => {
    setSelectedImage(url);
    setCurrentImageIndex(index);
    setShowImageModal(true);
  };

  const fetchComments = async () => {
    try {
      setIsLoadingComments(true);
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Vui lòng đăng nhập để tải bình luận!");
      const response = await fetch(
          `${process.env.REACT_APP_API_URL}/comments?postId=${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
      );
      if (!response.ok) throw new Error("Không thể lấy bình luận!");
      const data = await response.json();
      setComments(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      toast.error("Lỗi khi tải bình luận: " + err.message);
    } finally {
      setIsLoadingComments(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchComments();
    }
  }, [id]);

    const handleCommentSubmit = async (e) => {
      e.preventDefault();
      if (!newComment.trim()) return;

      try {
        setIsCommenting(true);
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Vui lòng đăng nhập để bình luận!");

        const response = await fetch(`${process.env.REACT_APP_API_URL}/comments`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            userId: user?.id,
            postId: id,
            content: newComment,
            privacySetting: "public",
            parentCommentId: null,
            customListId: null,
          }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Không thể tạo bình luận!");

        toast.success("Đã đăng bình luận!");
        setNewComment("");

        // 👇 Thêm comment ngay vào danh sách
        const newCommentObj = data.data; // giả sử backend trả về comment vừa tạo
        setComments((prev) => [newCommentObj, ...prev]);
      } catch (err) {
        toast.error("Lỗi khi đăng bình luận: " + err.message);
      } finally {
        setIsCommenting(false);
      }
    };


    const handleEditTweet = () => setShowEditModal(true);

  const handleDeleteTweet = async () => {
    if (window.confirm("Bạn có chắc muốn xóa bài đăng này?")) {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Vui lòng đăng nhập để xóa bài đăng!");
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
  const handleEmojiReaction = async (emoji) => {
    if (reaction === emoji) {
      await removeReaction();
    } else {
      await sendReaction(emoji);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Vui lòng đăng nhập để cập nhật trạng thái!");
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
            taggedUserIds: Array.isArray(taggedUsers)
              ? taggedUsers.map((u) => u?.id).filter(Boolean)
              : [],
            customListId: newStatus === "custom" ? tweet?.customListId : null,
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
    if (owner?.username && owner.username !== "unknown") {
      navigate(`/profile/${owner.username}`);
    }
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

  const renderImages = (images) => {
    if (!Array.isArray(images) || images.length === 0) return null;

    const imageCount = images.length;

    if (imageCount === 1) {
      return (
        <div style={imageContainerStyles}>
          <BootstrapImage
            src={images[0]}
            style={{ ...imageStyles, maxHeight: "500px" }}
            fluid
            rounded
            onClick={() => handleImageClick(images[0], 0)}
            aria-label="Hình ảnh bài đăng"
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
                onClick={() => handleImageClick(url, idx)}
                aria-label={`Hình ảnh bài đăng ${idx + 1}`}
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
              onClick={() => handleImageClick(images[0], 0)}
              aria-label="Hình ảnh bài đăng chính"
            />
          </Col>
          <Col xs={6}>
            <div className="d-flex flex-column h-100 g-2">
              <BootstrapImage
                src={images[1]}
                style={{ ...imageStyles, height: "198px", marginBottom: "4px" }}
                fluid
                rounded
                onClick={() => handleImageClick(images[1], 1)}
                aria-label="Hình ảnh bài đăng phụ 1"
              />
              <BootstrapImage
                src={images[2]}
                style={{ ...imageStyles, height: "198px" }}
                fluid
                rounded
                onClick={() => handleImageClick(images[2], 2)}
                aria-label="Hình ảnh bài đăng phụ 2"
              />
            </div>
          </Col>
        </Row>
      );
    }

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
                onClick={() => idx < 4 ? handleImageClick(url, idx) : null}
                aria-label={`Hình ảnh bài đăng ${idx + 1}`}
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
                    pointerEvents: "none",
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

    const handleReplyToComment = async (parentId, replyText) => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Vui lòng đăng nhập để bình luận!");

        const response = await fetch(`${process.env.REACT_APP_API_URL}/comments`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: user.id,
            postId: postId,
            content: replyText,
            privacySetting: "default",
            parentCommentId: parentId,
          }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Không thể phản hồi");

        toast.success("Phản hồi thành công");

        const newReply = data.data;

        // 👇 Cập nhật đúng comment cha
        setComments((prevComments) =>
            prevComments.map((comment) => {
              if (comment.commentId === parentId) {
                return {
                  ...comment,
                  replies: [...(comment.replies || []), newReply],
                };
              }
              return comment;
            })
        );
      } catch (error) {
        console.error("Lỗi phản hồi:", error);
        toast.error("Không thể phản hồi bình luận: " + error.message);
      }
    };

  const handleUpdateComment = async (commentId, newText) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Vui lòng đăng nhập để chỉnh sửa!");

      const response = await fetch(
          `${process.env.REACT_APP_API_URL}/comments/${commentId}`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userId: currentUserId,
              content: newText,
            }),
          }
      );

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || "Không thể cập nhật bình luận.");

      toast.success("Đã cập nhật bình luận!");
      fetchComments();
    } catch (err) {
      toast.error("Lỗi khi cập nhật bình luận: " + err.message);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Bạn có chắc muốn xóa bình luận này?")) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Vui lòng đăng nhập để xóa bình luận!");

      const response = await fetch(
          `${process.env.REACT_APP_API_URL}/comments/${commentId}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Xóa bình luận thất bại.");
      }

      toast.success("Đã xóa bình luận!");
      fetchComments();
    } catch (err) {
      toast.error("Lỗi khi xóa bình luận: " + err.message);
    }
  };

  const renderComments = () => {
    if (isLoadingComments)
      return <div className="text-muted">Đang tải bình luận...</div>;

    if (!Array.isArray(comments) || comments.length === 0)
      return <div className="text-muted">Chưa có bình luận nào.</div>;

    return comments.map((comment) => (
        <CommentThread
            key={comment.commentId}
            comment={comment}
            currentUserId={currentUserId}
            onReply={handleReplyToComment}
            onUpdate={handleUpdateComment}
            onDelete={handleDeleteComment}
        />
    ));
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
              aria-label={`Ảnh đại diện của ${owner?.displayName || "Người dùng"}`}
            />
          ) : (
            <FaUserCircle
              size={50}
              className="me-3 d-none d-md-block text-secondary"
              aria-label="Ảnh đại diện mặc định"
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
                  {owner?.displayName || "Người dùng"}
                </h6>
                <span className="text-muted small me-1">
                  @{owner?.username || "unknown"}
                </span>
                <span className="text-muted small me-1">
                  · {moment(createdAt * 1000).fromNow()}
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
                  aria-label="Tùy chọn bài đăng"
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

            {Array.isArray(taggedUsers) && taggedUsers.length > 0 && (
              <div className="mb-2">
                <small className="text-muted">
                  Đã tag:{" "}
                  {taggedUsers
                    .filter((tag) => tag?.username)
                    .map((tag, index) => (
                      <span key={index} className="text-primary me-1">
                        @{tag.username}
                      </span>
                    ))}
                </small>
              </div>
            )}

            {renderImages(imageUrls.map((img) => img.url))}

            {Array.isArray(videoUrls) &&
              videoUrls.length > 0 &&
              videoUrls.map((url, idx) => (
                <div key={idx} className="mb-2">
                  <video
                    controls
                    width="100%"
                    style={{ borderRadius: "12px" }}
                    aria-label={`Video bài đăng ${idx + 1}`}
                  >
                    <source src={url} type="video/mp4" />
                    Trình duyệt không hỗ trợ phát video.
                  </video>
                </div>
              ))}

            <div className="d-flex justify-content-between text-muted mt-2">
              <Button
                variant="link"
                className="text-muted p-1 rounded-circle hover-bg-light"
                onClick={() => setShowCommentBox((prev) => !prev)}
                aria-label="Mở/đóng hộp bình luận"
              >
                <FaRegComment size={18} className="me-1" />
                {commentCount > 0 && commentCount}
              </Button>
              <Button
                variant="link"
                className="text-muted p-1 rounded-circle hover-bg-light"
                aria-label="Chia sẻ lại"
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
                      aria-label="Chọn biểu cảm"
                  >
                    {reaction ? (
                        <span>{reaction}</span>
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
                aria-label="Chia sẻ"
              >
                <FaShareAlt size={18} />
              </Button>
            </div>

            {showCommentBox && (
                <div style={commentSectionStyles}>
                  {renderComments()}
                  <Form onSubmit={handleCommentSubmit} className="mt-2">
                    <div className="d-flex align-items-center">
                      {user?.avatarUrl ? (
                          <BootstrapImage
                              src={user.avatarUrl}
                              style={{ width: 32, height: 32, objectFit: "cover", marginRight: 8 }}
                              roundedCircle
                              aria-label={`Ảnh đại diện của ${user.displayName}`}
                          />
                      ) : (
                          <FaUserCircle
                              size={32}
                              className="me-2 text-secondary"
                              aria-label="Ảnh đại diện mặc định"
                          />
                      )}
                      <InputGroup>
                        <Form.Control
                            type="text"
                            placeholder="Viết bình luận..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            style={{ borderRadius: "20px" }}
                            disabled={isCommenting}
                            aria-label="Viết bình luận"
                        />
                        <Button
                            type="submit"
                            size="sm"
                            variant="primary"
                            style={{ borderRadius: "20px" }}
                            disabled={isCommenting}
                        >
                          Gửi
                        </Button>
                      </InputGroup>
                    </div>
                  </Form>
                </div>
            )}
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

      <Modal
        show={showImageModal}
        onHide={() => setShowImageModal(false)}
        centered
        size="xl"
        contentClassName="bg-dark"
      >
        <Modal.Body className="p-0 position-relative">
          <Button
            variant="dark"
            className="position-absolute top-0 end-0 m-2 rounded-circle"
            onClick={() => setShowImageModal(false)}
            aria-label="Đóng modal hình ảnh"
          >
            ✕
          </Button>
          {imageUrls.length > 1 && (
            <>
              <Button
                variant="dark"
                style={{ ...arrowButtonStyles, left: "10px" }}
                onClick={handlePrevImage}
                disabled={currentImageIndex === 0}
                aria-label="Ảnh trước đó"
              >
                <FaArrowLeft />
              </Button>
              <Button
                variant="dark"
                style={{ ...arrowButtonStyles, right: "10px" }}
                onClick={handleNextImage}
                disabled={currentImageIndex === imageUrls.length - 1}
                aria-label="Ảnh tiếp theo"
              >
                <FaArrowRight />
              </Button>
            </>
          )}
          {selectedImage && (
            <BootstrapImage
              src={selectedImage}
              style={enlargedImageStyles}
              fluid
              aria-label={`Hình ảnh bài đăng ${currentImageIndex + 1}`}
            />
          )}
        </Modal.Body>
      </Modal>
    </>
  );
}

export default TweetCard;