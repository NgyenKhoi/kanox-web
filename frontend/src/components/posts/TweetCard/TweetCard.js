import React, { useState, useContext, useEffect } from "react";
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
    Popover,
} from "react-bootstrap";
import {
  FaBookmark,
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
import "./TweetCard.css";
import ReactionButtonGroup from "./ReactionButtonGroup";
import useReaction from "../../../hooks/useReaction";
import ReactionUserListModal from "./ReactionUserListModal";
import PostImages from "./PostImages";
import { useCommentActions } from "../../../hooks/useCommentAction";

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
  const [showReactionUserModal, setShowReactionUserModal] = useState(false);
  const [selectedEmojiName, setSelectedEmojiName] = useState("");
  const [commentUserList, setCommentUserList] = useState([]);

  const currentUserId = user?.id;
  const ownerId = owner?.id || null;
  const postId = id || null;
  const targetTypeId = tweet?.targetTypeId || 1;

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

  const {
    reactionCountMap,
    topReactions,
    currentEmoji,
    sendReaction,
    removeReaction,
    fetchUsersByReaction,
    reactionUserMap
  } = useReaction({ user, targetId: tweet.id, targetTypeCode: "POST" });

  const totalCount = Object.values(reactionCountMap).reduce((sum, count) => sum + count, 0);


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
          { headers: { Authorization: `Bearer ${token}` } }
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
    if (comments.length > 0) {
      const uniqueUsers = [];
      const seen = new Set();

      comments.forEach((comment) => {
        const u = comment?.user;
        if (u && !seen.has(u.id)) {
          seen.add(u.id);
          uniqueUsers.push(u);
        }
      });

      setCommentUserList(uniqueUsers);
    }
  }, [comments]);

  useEffect(() => {
    if (id) fetchComments();
  }, [id]);

  const {
    handleReplyToComment,
    handleUpdateComment,
    handleDeleteComment,
  } = useCommentActions({
    user,
    postId,
    setComments,
    fetchComments,
  });

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

      const newCommentObj = data.data;
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
            { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
        );
        if (!response.ok) throw new Error("Không thể xóa bài đăng!");
        toast.success("Đã xóa bài đăng!");
        if (onPostUpdate) onPostUpdate();
      } catch (err) {
        toast.error(err.message);
      }
    }
  };

  const handleSavePost = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Vui lòng đăng nhập để lưu bài viết!");

      const response = await fetch(
          `${process.env.REACT_APP_API_URL}/posts/${id}/save`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
          }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Không thể lưu bài viết.");
      }

      toast.success("Đã lưu bài viết!");
    } catch (err) {
      toast.error("Lỗi khi lưu bài viết: " + err.message);
    }
  };

  const handleHidePost = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Vui lòng đăng nhập để ẩn bài viết!");

      const response = await fetch(
          `${process.env.REACT_APP_API_URL}/posts/${id}/hide`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
          }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Không thể ẩn bài viết.");
      }

      toast.success("Đã ẩn bài viết!");
      if (onPostUpdate) onPostUpdate(); // để cập nhật view nếu cần
    } catch (err) {
      toast.error("Lỗi khi ẩn bài viết: " + err.message);
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
      case "public": return "Công khai";
      case "friends": return "Bạn bè";
      case "only_me": return "Chỉ mình tôi";
      case "custom": return "Tùy chỉnh";
      default: return "Công khai";
    }
  };


  const renderComments = () => {
    if (isLoadingComments) return <div className="text-[var(--text-color-muted)]">Đang tải bình luận...</div>;

    if (!Array.isArray(comments) || comments.length === 0)
      return <div className="text-[var(--text-color-muted)]">Chưa có bình luận nào.</div>;

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
        <Card className="mb-3 rounded-2xl shadow-sm border-0 bg-[var(--background-color)]">
          <Card.Body className="d-flex p-3">
            {/* avatar và info */}
            {avatarUrl ? (
                <BootstrapImage
                    src={avatarUrl}
                    alt="Avatar"
                    roundedCircle
                    className="me-3 d-none d-md-block w-[50px] h-[50px] object-cover"
                    aria-label={`Ảnh đại diện của ${owner?.displayName || "Người dùng"}`}
                />
            ) : (
                <FaUserCircle
                    size={50}
                    className="me-3 d-none d-md-block text-[var(--text-color-muted)]"
                    aria-label="Ảnh đại diện mặc định"
                />
            )}
            <div className="flex-grow-1">
              {/* header */}
              <div className="position-relative mb-1">
                <div className="d-flex align-items-center pe-5"> {/* padding để tránh đè lên nút X */}
                  <h6
                      className="mb-0 fw-bold me-1 cursor-pointer text-[var(--text-color)]"
                      onClick={handleNavigateToProfile}
                  >
                    {owner?.displayName || "Người dùng"}
                  </h6>
                  <span className="text-[var(--text-color-muted)] small me-1">
      @{owner?.username || "unknown"}
    </span>
                  <span className="text-[var(--text-color-muted)] small me-1">
      · {moment(createdAt * 1000).fromNow()}
    </span>
                  <OverlayTrigger
                      placement="top"
                      overlay={<Tooltip>{renderStatusText(privacySetting)}</Tooltip>}
                  >
                    <span>{renderStatusIcon(privacySetting)}</span>
                  </OverlayTrigger>
                </div>
                {/* dropdown */}
                <div className="position-absolute top-0 end-0 d-flex align-items-center gap-1">
                <Dropdown>
                  <Dropdown.Toggle
                      variant="link"
                      className="text-[var(--text-color-muted)] p-1 rounded-circle"
                  >
                    <FaEllipsisH />
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    {isOwnTweet && (
                        <>
                          <Dropdown.Item onClick={handleEditTweet}>
                            <FaEdit className="me-2 text-[var(--text-color)]" /> Chỉnh sửa
                          </Dropdown.Item>
                          <Dropdown.Item onClick={handleDeleteTweet}>
                            <FaTrash className="me-2 text-[var(--text-color)]" /> Xóa
                          </Dropdown.Item>
                          <Dropdown drop="end">
                            <Dropdown.Toggle
                                variant="link"
                                className="text-[var(--text-color)] p-0 w-100 text-start"
                            >
                              <FaShareAlt className="me-2 text-[var(--text-color)]" /> Trạng thái:{" "}
                              {renderStatusText(privacySetting)}
                            </Dropdown.Toggle>
                            <Dropdown.Menu>
                              <Dropdown.Item onClick={() => handleStatusChange("public")}>
                                <FaGlobeAmericas className="me-2 text-primary" /> Công khai
                              </Dropdown.Item>
                              <Dropdown.Item onClick={() => handleStatusChange("friends")}>
                                <FaUserFriends className="me-2 text-success" /> Bạn bè
                              </Dropdown.Item>
                              <Dropdown.Item onClick={() => handleStatusChange("only_me")}>
                                <FaLock className="me-2 text-danger" /> Chỉ mình tôi
                              </Dropdown.Item>
                              <Dropdown.Item onClick={() => handleStatusChange("custom")}>
                                <FaList className="me-2 text-info" /> Tùy chỉnh
                              </Dropdown.Item>
                            </Dropdown.Menu>
                          </Dropdown>
                        </>
                    )}
                    <Dropdown.Item onClick={handleSavePost()}>
                      <FaSave className="me-2 text-[var(--text-color)]" /> Lưu bài đăng
                    </Dropdown.Item>
                    <Dropdown.Item>
                      <FaFlag className="me-2 text-[var(--text-color)]" /> Báo cáo
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
                  <Button
                      variant="link"
                      className="p-1 text-muted hover:text-danger"
                      style={{
                        fontSize: "1.4rem",
                        lineHeight: 1,
                      }}
                      onClick={handleHidePost}
                  >
                    ✕
                  </Button>
                </div>
              </div>

              {/* nội dung */}
              <p className="mb-2 text-[var(--text-color)]">{content}</p>

              {/* tag người */}
              {Array.isArray(taggedUsers) && taggedUsers.length > 0 && (
                  <div className="mb-2">
                    <small className="text-[var(--text-color-muted)]">
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

              <PostImages images={imageUrls.map((img) => img.url)} onClickImage={handleImageClick} />

              {/* video */}
              {Array.isArray(videoUrls) &&
                  videoUrls.length > 0 &&
                  videoUrls.map((url, idx) => (
                      <div key={idx} className="mb-2">
                        <video
                            controls
                            width="100%"
                            className="rounded-2xl"
                            aria-label={`Video bài đăng ${idx + 1}`}
                        >
                          <source src={url} type="video/mp4" />
                          Trình duyệt không hỗ trợ phát video.
                        </video>
                      </div>
                  ))}

              {/* reaction count + actions */}
              {(totalCount > 0 || commentCount > 0) && (
                  <div className="d-flex justify-content-between align-items-center mt-2 px-2">
                    <div className="d-flex align-items-center gap-1">
                      {topReactions.map(({ emoji, name }) => (
                          <OverlayTrigger
                              key={name}
                              placement="top"
                              delay={{ show: 250, hide: 200 }}
                              overlay={
                                <Popover id={`popover-${name}`}>
                                  <Popover.Header as="h3">
                                    {emoji} {name}
                                  </Popover.Header>
                                  <Popover.Body>
                                    {!reactionUserMap[name] ? (
                                        <div>Đang tải...</div>
                                    ) : reactionUserMap[name]?.length > 0 ? (
                                        reactionUserMap[name].slice(0, 5).map((u, idx) => (
                                            <div key={idx}>{u.displayName || u.username}</div>
                                        ))
                                    ) : (
                                        <div>Chưa có ai</div>
                                    )}
                                    {reactionUserMap[name]?.length > 5 && (
                                        <div className="text-muted small mt-1">
                                          +{reactionUserMap[name].length - 5} người khác
                                        </div>
                                    )}
                                  </Popover.Body>
                                </Popover>
                              }
                          >
                    <span
                        onMouseEnter={() => {
                          if (!reactionUserMap[name]) {
                            fetchUsersByReaction(name);
                          }
                        }}
                        onClick={() => {
                          if (name) {
                            setSelectedEmojiName(name);
                            setShowReactionUserModal(true);
                          } else {
                            toast.error("Tên emoji không hợp lệ!");
                          }
                        }}
                        style={{ fontSize: "1.2rem", cursor: "pointer", marginRight: "4px" }}
                    >
                          {emoji}
                        </span>

                          </OverlayTrigger>
                      ))}

                      {totalCount > 0 && (
                          <span className="text-[var(--text-color-muted)] ms-1">{totalCount}</span>
                      )}
                    </div>

                    <div className="text-[var(--text-color-muted)] small text-end">
                      <OverlayTrigger
                          placement="top"
                          overlay={
                            <Popover id="popover-comment-users">
                              <Popover.Header as="h3">Người bình luận</Popover.Header>
                              <Popover.Body>
                                {commentUserList.length === 0 ? (
                                    <div>Chưa có ai bình luận</div>
                                ) : (
                                    commentUserList.slice(0, 5).map((u, idx) => (
                                        <div key={idx}>{u.displayName || u.username}</div>
                                    ))
                                )}
                                {commentUserList.length > 5 && (
                                    <div className="text-muted small mt-1">
                                      +{commentUserList.length - 5} người khác
                                    </div>
                                )}
                              </Popover.Body>
                            </Popover>
                          }
                      >
                      <span
                          className="text-[var(--text-color-muted)] small text-end cursor-pointer"
                          onMouseEnter={() => {
                            // Nếu sau này muốn fetch động, có thể làm ở đây
                          }}
                      >
                        {commentCount} bình luận
                      </span>
                      </OverlayTrigger>
                      {shareCount > 0 && ` · ${shareCount} lượt chia sẻ`}
                    </div>
                  </div>
              )}

              <div className="d-flex justify-content-between text-[var(--text-color-muted)] mt-2 w-100 px-0">
                <div className="text-center">
                  <OverlayTrigger placement="top" overlay={<Tooltip>Bình luận</Tooltip>}>
                    <Button
                        variant="link"
                        className="p-2 rounded-full hover-bg-light text-[var(--text-color)]"
                        onClick={() => setShowCommentBox((prev) => !prev)}
                    >
                      <FaRegComment size={20} />
                    </Button>
                  </OverlayTrigger>
                </div>
                <div className="text-center">
                  <OverlayTrigger placement="top" overlay={<Tooltip>Lưu bài viết</Tooltip>}>
                    <Button
                        variant="link"
                        className="p-2 rounded-full hover-bg-light text-[var(--text-color)]"
                        onClick={handleSavePost}
                    >
                      <FaBookmark size={20} />
                    </Button>
                  </OverlayTrigger>
                </div>
                <div className="text-center">
                  <ReactionButtonGroup user={user} targetId={postId} targetTypeCode="POST" />
                </div>
                <div className="text-center">
                  <OverlayTrigger placement="top" overlay={<Tooltip>Chia sẻ</Tooltip>}>
                    <Button
                        variant="link"
                        className="p-2 rounded-full hover-bg-light text-[var(--text-color)]"
                    >
                      <FaShareAlt size={20} />
                    </Button>
                  </OverlayTrigger>
                </div>
              </div>

              {/* comments */}
              {showCommentBox && (
                  <div className="mt-2 pt-2 border-t border-[var(--border-color)]">
                    {renderComments()}
                    <Form onSubmit={handleCommentSubmit} className="mt-2">
                      <div className="d-flex align-items-center">
                        {user?.avatarUrl ? (
                            <BootstrapImage
                                src={user.avatarUrl}
                                style={{ width: 32, height: 32, objectFit: 'cover' }}
                                className="mr-2 rounded-full"
                                roundedCircle
                                alt={`Ảnh đại diện của ${user.displayName}`}
                            />
                        ) : (
                            <FaUserCircle
                                size={32}
                                className="me-2 text-[var(--text-color-muted)]"
                                aria-label="Ảnh đại diện mặc định"
                            />
                        )}
                        <InputGroup>
                          <Form.Control
                              type="text"
                              placeholder="Viết bình luận..."
                              value={newComment}
                              onChange={(e) => setNewComment(e.target.value)}
                              className="rounded-full border-[var(--border-color)] bg-[var(--background-color)] text-[var(--text-color)]"
                              disabled={isCommenting}
                          />
                          <Button
                              type="submit"
                              size="sm"
                              variant="primary"
                              className="rounded-full"
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
        </Card>

        {/* Modal edit post */}
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

        {selectedEmojiName && (
            <ReactionUserListModal
                show={showReactionUserModal}
                onHide={() => setShowReactionUserModal(false)}
                targetId={postId}
                targetTypeCode="POST"
                emojiName={selectedEmojiName}
            />
        )}

        {/* Modal ảnh */}
        <Modal
            show={showImageModal}
            onHide={() => setShowImageModal(false)}
            centered
            size="xl"
            contentClassName="bg-[var(--background-color)]"
        >
          <Modal.Body className="p-0 position-relative">
            <Button
                variant="secondary"
                className="position-absolute top-2 end-2 rounded-full"
                onClick={() => setShowImageModal(false)}
            >
              ✕
            </Button>
            {imageUrls.length > 1 && (
                <>
                  <Button
                      variant="secondary"
                      className="position-absolute top-1/2 -translate-y-1/2 left-2 rounded-full"
                      onClick={handlePrevImage}
                      disabled={currentImageIndex === 0}
                  >
                    <FaArrowLeft />
                  </Button>
                  <Button
                      variant="secondary"
                      className="position-absolute top-1/2 -translate-y-1/2 right-2 rounded-full"
                      onClick={handleNextImage}
                      disabled={currentImageIndex === imageUrls.length - 1}
                  >
                    <FaArrowRight />
                  </Button>
                </>
            )}
            {selectedImage && (
                <BootstrapImage
                    src={selectedImage}
                    className="max-w-full max-h-[80vh] mx-auto object-contain"
                    fluid
                />
            )}
          </Modal.Body>
        </Modal>
      </>
  );
}
export default TweetCard;
