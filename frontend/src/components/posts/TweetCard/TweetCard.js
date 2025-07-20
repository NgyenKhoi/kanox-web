import React, { useState, useContext, useEffect, useRef, useMemo } from "react";
import {
  Card,
  Button,
  Dropdown,
  OverlayTrigger,
  Overlay,
  Tooltip,
  Image,
  Row,
  Col,
  Modal,
  Form,
  InputGroup,
  Popover,
  Spinner,
} from "react-bootstrap";
import {
  FaImage,
  FaVideo,
  FaSmile,
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
  FaRegBookmark,
} from "react-icons/fa";
import moment from "moment";
import { AuthContext } from "../../../context/AuthContext";
import { WebSocketContext } from "../../../context/WebSocketContext";
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
import useEmojiList from "../../../hooks/useEmojiList";
import MediaActionBar from "../../utils/MediaActionBar";
import useCommentAvatar from "../../../hooks/useCommentAvatar";
import usePostMedia from "../../../hooks/usePostMedia";
import { useEmojiContext } from "../../../context/EmojiContext";
import SharePostModal from "../SharePostModal/SharePostModal";

function TweetCard({ tweet, onPostUpdate }) {
  const { user, loading, token } = useContext(AuthContext);
  const { publish } = useContext(WebSocketContext);
  const navigate = useNavigate();
  const {
    id,
    owner,
    content,
    createdAt,
    commentCount: initialCommentCount,
    shareCount,
    likeCount,
    taggedUsers = [],
    privacySetting = "public",
    groupId,
    groupName,
    groupAvatarUrl,
    sharedPost,
  } = tweet || {};
  const isSaved = tweet?.isSaved ?? false;
  const isOwnTweet = user && user.username === owner?.username;
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(true);
  const [showReactionUserModal, setShowReactionUserModal] = useState(false);
  const [selectedEmojiName, setSelectedEmojiName] = useState("");
  const [commentUserList, setCommentUserList] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedMediaFiles, setSelectedMediaFiles] = useState([]);
  const [selectedMediaPreviews, setSelectedMediaPreviews] = useState([]);
  const commentInputRef = useRef(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReasonId, setReportReasonId] = useState("");
  const [reasons, setReasons] = useState([]);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const memoizedInitialReactionCountMap = useMemo(
    () => tweet.reactionCountMap || {},
    [tweet.reactionCountMap]
  );
  const [commentCount, setCommentCount] = useState(tweet.commentCount || 0);
  const [showShareModal, setShowShareModal] = useState(false);

  const currentUserId = user?.id;
  const ownerId = owner?.id || null;
  const postId = id || null;
  const targetTypeId = tweet?.targetTypeId || 1;

  const avatarMedia = useMedia([ownerId], "PROFILE", "image");
  const { imageData, videoData } = usePostMedia(postId);
  const avatarData = !loading && token && ownerId ? avatarMedia.mediaData : {};
  const avatarError = avatarMedia.error;
  const { emojiList: mainEmojiList, emojiMap } = useEmojiContext();
  const { emojiList: messageEmojiList } = useEmojiList();

  const avatarUrl = avatarData?.[ownerId]?.[0]?.url || null;
  const imageUrls = imageData || [];
  const videoUrls = videoData || [];
  const { avatarUrl: currentAvatarUrl } = useCommentAvatar(user?.id);

  const {
    reactionCountMap,
    topReactions,
    currentEmoji,
    sendReaction,
    removeReaction,
    fetchUsersByReaction,
    reactionUserMap,
  } = useReaction({
    user,
    targetId: id,
    targetTypeCode: "POST",
    initialReactionCountMap: memoizedInitialReactionCountMap,
  });

  const totalCount = Object.values(reactionCountMap).reduce(
    (sum, count) => sum + count,
    0
  );

  const handleNavigateToProfile = () => {
    if (owner?.username && owner.username !== "unknown") {
      navigate(`/profile/${owner.username}`);
    }
  };

  // New function to navigate to group page
  const handleNavigateToGroup = () => {
    if (groupId) {
      navigate(`/community/${groupId}`);
    }
  };

  const handleNextImage = () => {
    if (Array.isArray(imageUrls) && currentImageIndex < imageUrls.length - 1) {
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

  const handleShareNow = async () => {
    if (
      !window.confirm(
        "Bạn có chắc muốn chia sẻ bài viết này lên trang cá nhân?"
      )
    )
      return;
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/posts/share`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ originalPostId: id, content: "" }),
        }
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Chia sẻ thất bại.");
      toast.success("Đã chia sẻ bài viết!");
      if (onPostUpdate) onPostUpdate();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleCopyLink = () => {
    const postUrl = `${window.location.origin}/posts/${id}`;
    navigator.clipboard.writeText(postUrl);
    toast.info("Đã sao chép liên kết!");
  };

  const handleUnsavePost = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Vui lòng đăng nhập để bỏ lưu bài viết!");

      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/posts/unsave/${id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Bỏ lưu thất bại");

      toast.success("Đã bỏ lưu bài viết");
      if (onPostUpdate) onPostUpdate(); // Gọi để làm mới danh sách bài viết
    } catch (err) {
      toast.error("Lỗi khi bỏ lưu bài viết: " + err.message);
    }
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
    const fetchReportReasons = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/reports/report-reasons`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await response.json();
        if (response.ok) {
          setReasons(Array.isArray(data) ? data : []);
        } else {
          throw new Error(
            data.message || "Lỗi khi lấy danh sách lý do báo cáo"
          );
        }
      } catch (error) {
        toast.error("Lỗi khi lấy danh sách lý do báo cáo: " + error.message);
      }
    };

    if (showReportModal) {
      fetchReportReasons();
    }
  }, [showReportModal, token]);

  const handleReportSubmit = async () => {
    if (!reportReasonId) {
      toast.error("Vui lòng chọn lý do báo cáo!");
      return;
    }

    try {
      setIsSubmittingReport(true);
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/reports/create`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            reporterId: user.id,
            targetId: id,
            targetTypeId: 1, // 1 = POST
            reasonId: parseInt(reportReasonId),
          }),
        }
      );

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Không thể gửi báo cáo!");

      toast.success("Đã gửi báo cáo thành công!");
      setShowReportModal(false);
      setReportReasonId("");
    } catch (err) {
      toast.error("Lỗi khi gửi báo cáo: " + err.message);
    } finally {
      setIsSubmittingReport(false);
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

  const handleEmojiClick = () => {
    setShowEmojiPicker((prev) => !prev);
  };

  const { handleReplyToComment, handleUpdateComment, handleDeleteComment } =
    useCommentActions({
      user,
      postId,
      setComments,
      fetchComments,
    });

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() && selectedMediaFiles.length === 0) return;

    try {
      setIsCommenting(true);
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Vui lòng đăng nhập để bình luận!");

      const formData = new FormData();
      const commentPayload = {
        userId: user?.id,
        postId: id,
        content: newComment,
        privacySetting: "public",
        parentCommentId: null,
        customListId: null,
      };

      formData.append(
        "comment",
        new Blob([JSON.stringify(commentPayload)], { type: "application/json" })
      );

      selectedMediaFiles.forEach((file) => {
        formData.append("media", file);
      });

      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/comments`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Không thể tạo bình luận!");

      toast.success("Đã đăng bình luận!");
      setNewComment("");
      setSelectedMediaFiles([]);
      setSelectedMediaPreviews([]);

      const newCommentObj = data.data;
      setComments((prev) => [newCommentObj, ...prev]);
      setCommentCount((prev) => prev + 1);
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

  const renderComments = () => {
    if (isLoadingComments)
      return (
        <div className="text-[var(--text-color-muted)]">
          Đang tải bình luận...
        </div>
      );

    if (!Array.isArray(comments) || comments.length === 0)
      return (
        <div className="text-[var(--text-color-muted)]">
          Chưa có bình luận nào.
        </div>
      );

    return (
      <>
        {comments.map((comment) => (
          <CommentThread
            key={comment.commentId}
            comment={comment}
            currentUserId={currentUserId}
            onReply={handleReplyToComment}
            onUpdate={handleUpdateComment}
            onDelete={handleDeleteComment}
            currentUser={user}
          />
        ))}
      </>
    );
  };

  const SharedPostPreview = ({ post }) => (
    <div className="border border-[var(--border-color)] rounded-lg p-3 mt-2">
      <div className="d-flex align-items-center mb-2">
        <img
          src={post.owner?.avatarUrl || "https://placehold.co/40x40"}
          alt="avatar"
          className="rounded-full w-10 h-10 me-2 object-cover"
        />
        <div>
          <h6 className="mb-0 fw-bold text-[var(--text-color)]">
            {post.owner?.displayName}
          </h6>
          <span className="text-sm text-[var(--text-color-muted)]">
            @{post.owner?.username}
          </span>
        </div>
      </div>
      <p className="text-[var(--text-color)]">{post.content}</p>
      {post.media && post.media.length > 0 && (
        <PostImages
          images={post.media
            .filter((m) => m.mediaType === "image")
            .map((m) => m.url)}
        />
      )}
    </div>
  );

  return (
    <>
      <Card className="mb-3 rounded-2xl shadow-sm border-0 bg-[var(--background-color)]">
        <Card.Body className="d-flex p-3">
          {/* Avatar và info */}
          <div className="d-flex align-items-start">
            {/* Nếu post trong group, hiển thị avatar nhóm + avatar user đè lên giống Facebook */}
            {groupId && groupAvatarUrl ? (
              <div
                className="position-relative me-3"
                style={{ width: 50, height: 50 }}
              >
                {/* Avatar group (vuông) */}
                <img
                  src={groupAvatarUrl}
                  alt="Ảnh đại diện nhóm"
                  className="w-100 h-100 object-cover rounded"
                  onClick={handleNavigateToGroup}
                  style={{ cursor: "pointer" }}
                />
                {/* Avatar user (tròn nhỏ) đè lên */}
                {avatarUrl && (
                  <img
                    src={avatarUrl}
                    alt="Ảnh người đăng"
                    className="position-absolute border border-white"
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: "50%",
                      bottom: -1,
                      right: -1,
                      objectFit: "cover",
                      cursor: "pointer",
                    }}
                    onClick={handleNavigateToProfile}
                  />
                )}
              </div>
            ) : // Nếu không phải post trong group, chỉ hiển thị avatar người dùng
            avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Ảnh đại diện"
                className="w-[50px] h-[50px] rounded-full object-cover mr-3 flex-shrink-0"
                onClick={handleNavigateToProfile}
                style={{ cursor: "pointer" }}
              />
            ) : (
              <FaUserCircle
                size={50}
                className="me-3 d-none d-md-block text-[var(--text-color-muted)]"
                aria-label="Ảnh đại diện mặc định"
                onClick={handleNavigateToProfile}
                style={{ cursor: "pointer" }}
              />
            )}
          </div>
          <div className="flex-grow-1">
            {/* Header */}
            <div className="position-relative mb-1">
              <div className="d-flex align-items-center pe-5">
                <h6
                  className="mb-0 fw-bold me-1 cursor-pointer text-[var(--text-color)]"
                  onClick={handleNavigateToProfile}
                >
                  {owner?.displayName || "Người dùng"}
                </h6>
                <span className="text-[var(--text-color-muted)] small me-1">
                  @{owner?.username || "unknown"}
                </span>
                {/* Hiển thị thông tin nhóm */}
                {groupId && groupName && (
                  <span className="text-[var(--text-color-muted)] small me-1">
                    đã đăng trong{" "}
                    <span
                      className="fw-bold text-primary cursor-pointer"
                      onClick={handleNavigateToGroup}
                    >
                      {groupName}
                    </span>
                  </span>
                )}
                <span className="text-[var(--text-color-muted)] small me-1">
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
              {/* Dropdown và nút X */}
              <div className="position-absolute top-0 end-0 d-flex align-items-center gap-2">
                <Dropdown>
                  <Dropdown.Toggle
                    variant="link"
                    className="text-[var(--text-color-muted)] p-0 w-9 h-9 rounded-full d-flex align-items-center justify-content-center hover:bg-gray-700 hover:text-white"
                    style={{
                      fontSize: "1.2rem",
                      textDecoration: "none",
                      "::after": {
                        display: "none",
                      },
                    }}
                  >
                    <FaEllipsisH />
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    {isOwnTweet && (
                      <>
                        <Dropdown.Item onClick={handleEditTweet}>
                          <FaEdit className="me-2 text-[var(--text-color)]" />{" "}
                          Chỉnh sửa
                        </Dropdown.Item>
                        <Dropdown.Item onClick={handleDeleteTweet}>
                          <FaTrash className="me-2 text-[var(--text-color)]" />{" "}
                          Xóa
                        </Dropdown.Item>
                        <Dropdown drop="end">
                          <Dropdown.Toggle
                            variant="link"
                            className="text-[var(--text-color)] p-0 w-100 text-start"
                          >
                            <FaShareAlt className="me-2 text-[var(--text-color)]" />{" "}
                            Trạng thái: {renderStatusText(privacySetting)}
                          </Dropdown.Toggle>
                          <Dropdown.Menu>
                            <Dropdown.Item
                              onClick={() => handleStatusChange("public")}
                            >
                              <FaGlobeAmericas className="me-2 text-primary" />{" "}
                              Công khai
                            </Dropdown.Item>
                            <Dropdown.Item
                              onClick={() => handleStatusChange("friends")}
                            >
                              <FaUserFriends className="me-2 text-success" />{" "}
                              Bạn bè
                            </Dropdown.Item>
                            <Dropdown.Item
                              onClick={() => handleStatusChange("only_me")}
                            >
                              <FaLock className="me-2 text-danger" /> Chỉ mình
                              tôi
                            </Dropdown.Item>
                            <Dropdown.Item
                              onClick={() => handleStatusChange("custom")}
                            >
                              <FaList className="me-2 text-info" /> Tùy chỉnh
                            </Dropdown.Item>
                          </Dropdown.Menu>
                        </Dropdown>
                      </>
                    )}
                    {!isSaved ? (
                      <Dropdown.Item onClick={handleSavePost}>
                        <FaSave className="me-2 text-[var(--text-color)]" /> Lưu
                        bài đăng
                      </Dropdown.Item>
                    ) : (
                      <Dropdown.Item onClick={handleUnsavePost}>
                        <FaRegBookmark className="me-2 text-[var(--text-color)]" />{" "}
                        Bỏ lưu
                      </Dropdown.Item>
                    )}
                    <Dropdown.Item onClick={() => setShowReportModal(true)}>
                      <FaFlag className="me-2 text-[var(--text-color)]" /> Báo
                      cáo
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
                <Button
                  variant="link"
                  className="w-9 h-9 d-flex align-items-center justify-content-center text-[var(--text-color-muted)] rounded-full hover:bg-gray-700 hover:text-white"
                  style={{
                    fontSize: "1.2rem",
                    textDecoration: "none",
                    lineHeight: 1,
                  }}
                  onClick={handleHidePost}
                >
                  ✕
                </Button>
              </div>
            </div>
            {/* Nội dung */}
            <p className="mb-2 text-[var(--text-color)]">{content}</p>

            {sharedPost ? (
              <SharedPostPreview post={sharedPost} />
            ) : (
              <>
                {/* Tag người */}
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

                <PostImages
                  images={imageUrls.map((img) => img.url)}
                  onClickImage={handleImageClick}
                />

                {/* Video */}
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
              </>
            )}

            {/* Reaction count + actions */}
            {(totalCount > 0 || commentCount > 0 || shareCount > 0) && (
              <div
                className={[
                  "d-flex justify-content-between align-items-center px-2 py-2",
                  imageUrls.length > 0
                    ? "border-t border-[var(--border-color)]"
                    : "",
                  "border-b border-[var(--border-color)]",
                ].join(" ")}
              >
                {/* LEFT: Reaction count */}
                <div className="d-flex align-items-center gap-1">
                  {totalCount > 0 && (
                    <>
                      {topReactions.map(({ name, emoji }) => (
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
                                  reactionUserMap[name]
                                    .slice(0, 5)
                                    .map((u, idx) => (
                                      <div key={idx}>
                                        {u.displayName || u.username}
                                      </div>
                                    ))
                                ) : (
                                  <div>Chưa có ai</div>
                                )}
                                {reactionUserMap[name]?.length > 5 && (
                                  <div className="text-muted small mt-1">
                                    +{reactionUserMap[name].length - 5} người
                                    khác
                                  </div>
                                )}
                              </Popover.Body>
                            </Popover>
                          }
                        >
                          <span
                            onMouseEnter={() => {
                              if (!reactionUserMap[name])
                                fetchUsersByReaction(name);
                            }}
                            onClick={() => {
                              setSelectedEmojiName(name);
                              setShowReactionUserModal(true);
                            }}
                            style={{
                              fontSize: "1.2rem",
                              cursor: "pointer",
                              marginRight: "4px",
                            }}
                          >
                            {emoji}
                          </span>
                        </OverlayTrigger>
                      ))}
                      <span className="text-[var(--text-color-muted)] ms-1">
                        {totalCount}
                      </span>
                    </>
                  )}
                </div>

                {/* RIGHT: Comment count + Share count */}
                <div className="d-flex align-items-center gap-2 text-[var(--text-color-muted)]">
                  {commentCount > 0 && (
                    <OverlayTrigger
                      placement="top"
                      overlay={
                        <Popover id="popover-comment-users">
                          <Popover.Header as="h3">
                            Người bình luận
                          </Popover.Header>
                          <Popover.Body>
                            {commentUserList.length === 0 ? (
                              <div>Chưa có ai bình luận</div>
                            ) : (
                              commentUserList
                                .slice(0, 5)
                                .map((u, idx) => (
                                  <div key={idx}>
                                    {u.displayName || u.username}
                                  </div>
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
                        className="cursor-pointer"
                        onClick={() => setShowCommentBox(true)}
                      >
                        {commentCount} bình luận
                      </span>
                    </OverlayTrigger>
                  )}
                  {shareCount > 0 && <span>· {shareCount} lượt chia sẻ</span>}
                </div>
              </div>
            )}

            <div className="d-flex justify-content-between text-[var(--text-color-muted)] mt-2 w-100 px-0">
              <div className="text-center">
                <OverlayTrigger
                  placement="top"
                  overlay={<Tooltip>Bình luận</Tooltip>}
                >
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
                <OverlayTrigger
                  placement="top"
                  overlay={<Tooltip>Lưu bài viết</Tooltip>}
                >
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
                <ReactionButtonGroup
                  user={user}
                  targetId={id}
                  targetTypeCode="POST"
                  initialReactionCountMap={tweet.reactionCountMap}
                />
              </div>
              <div className="text-center">
                <Dropdown>
                  <Dropdown.Toggle
                    as={Button}
                    variant="link"
                    className="p-2 rounded-full hover-bg-light text-[var(--text-color)]"
                    id={`share-dropdown-${id}`}
                  >
                    <FaShareAlt size={20} />
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item onClick={handleShareNow}>
                      Chia sẻ ngay
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => setShowShareModal(true)}>
                      Chia sẻ và viết bình luận
                    </Dropdown.Item>
                    <Dropdown.Item onClick={handleCopyLink}>
                      Sao chép liên kết
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </div>
            </div>

            {/* Comments */}
            {showCommentBox && (
              <div className="mt-2 pt-2 border-t border-[var(--border-color)]">
                {renderComments()}
                <Form onSubmit={handleCommentSubmit} className="mt-2">
                  <div className="d-flex align-items-start">
                    {currentAvatarUrl ? (
                      <Image
                        src={currentAvatarUrl}
                        alt={`Ảnh đại diện của ${
                          user?.displayName || "Người dùng"
                        }`}
                        roundedCircle
                        width={36}
                        height={36}
                        style={{ objectFit: "cover" }}
                        className="me-2 flex-shrink-0"
                      />
                    ) : (
                      <FaUserCircle
                        size={36}
                        className="me-2 text-[var(--text-color-muted)] flex-shrink-0"
                        aria-label="Ảnh đại diện mặc định"
                      />
                    )}

                    <div className="flex-grow-1 w-100">
                      <Form.Control
                        type="text"
                        placeholder="Viết bình luận..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="rounded-full border-[var(--border-color)] bg-[var(--hover-bg-color)] text-[var(--text-color)] transition-colors duration-200"
                        disabled={isCommenting}
                        ref={commentInputRef}
                      />
                      {selectedMediaPreviews.length > 0 && (
                        <div className="mt-2 d-flex flex-wrap gap-2">
                          {selectedMediaPreviews.map((preview, index) => (
                            <div key={index} className="position-relative">
                              {preview.type.startsWith("image") ? (
                                <Image
                                  src={preview.url}
                                  alt={`Preview ${index}`}
                                  style={{
                                    width: 100,
                                    height: 100,
                                    objectFit: "cover",
                                  }}
                                  className="rounded"
                                />
                              ) : (
                                <video
                                  src={preview.url}
                                  controls
                                  style={{
                                    width: 100,
                                    height: 100,
                                    objectFit: "cover",
                                  }}
                                  className="rounded"
                                />
                              )}
                              <Button
                                variant="danger"
                                size="sm"
                                className="position-absolute top-0 end-0 rounded-circle"
                                onClick={() => {
                                  setSelectedMediaPreviews((prev) =>
                                    prev.filter((_, i) => i !== index)
                                  );
                                  setSelectedMediaFiles((prev) =>
                                    prev.filter((_, i) => i !== index)
                                  );
                                }}
                              >
                                ✕
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Action bar below the input */}
                      <div className="d-flex justify-content-between align-items-center mt-2 px-1">
                        <MediaActionBar
                          onEmojiClick={handleEmojiClick}
                          onFileSelect={(files) => {
                            setSelectedMediaFiles((prev) => [
                              ...prev,
                              ...files,
                            ]);
                            setSelectedMediaPreviews((prev) => [
                              ...prev,
                              ...files.map((f) => ({
                                url: URL.createObjectURL(f),
                                type: f.type,
                              })),
                            ]);
                          }}
                        />
                        {/* Send button */}
                        <Button
                          type="submit"
                          size="sm"
                          variant="primary"
                          className="rounded-full"
                          disabled={isCommenting}
                        >
                          Gửi
                        </Button>

                        {/* Emoji Popover */}
                        {showEmojiPicker && (
                          <Overlay
                            target={commentInputRef.current}
                            show={showEmojiPicker}
                            placement="top"
                            rootClose
                            onHide={() => setShowEmojiPicker(false)}
                          >
                            {(props) => (
                              <Popover {...props} className="z-50">
                                <Popover.Body
                                  style={{
                                    maxWidth: 300,
                                    maxHeight: 200,
                                    overflowY: "auto",
                                  }}
                                  className="scrollbar-hide"
                                >
                                  <div className="flex flex-wrap">
                                    {messageEmojiList.map((emoji, idx) => (
                                      <span
                                        key={idx}
                                        className="text-2xl cursor-pointer m-1"
                                        onClick={() => {
                                          const input = commentInputRef.current;
                                          if (!input) return;

                                          const start = input.selectionStart;
                                          const end = input.selectionEnd;
                                          const emojiChar = emoji.emoji;

                                          const updated =
                                            newComment.slice(0, start) +
                                            emojiChar +
                                            newComment.slice(end);
                                          setNewComment(updated);

                                          // Đặt lại vị trí con trỏ sau emoji
                                          setTimeout(() => {
                                            input.focus();
                                            const cursor =
                                              start + emojiChar.length;
                                            input.setSelectionRange(
                                              cursor,
                                              cursor
                                            );
                                          }, 0);

                                          setShowEmojiPicker(false);
                                        }}
                                      >
                                        {emoji.emoji}
                                      </span>
                                    ))}
                                  </div>
                                </Popover.Body>
                              </Popover>
                            )}
                          </Overlay>
                        )}
                      </div>
                    </div>
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
            <Image
              src={selectedImage}
              className="max-w-full max-h-[80vh] mx-auto object-contain"
              fluid
            />
          )}
        </Modal.Body>
      </Modal>

      {/* Modal báo cáo */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[var(--background-color)] rounded-lg shadow-lg w-full max-w-md p-6 text-[var(--text-color)]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Báo cáo bài đăng</h3>
              <button
                className="text-[var(--text-color)] hover:text-[var(--primary-color)]"
                onClick={() => setShowReportModal(false)}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="mb-4">
              <label
                htmlFor="reportReason"
                className="block text-sm font-medium mb-2"
              >
                Lý do báo cáo
              </label>
              <select
                id="reportReason"
                value={reportReasonId}
                onChange={(e) => setReportReasonId(e.target.value)}
                className="w-full p-2 rounded-md bg-[var(--background-color)] border border-gray-300 dark:border-gray-600 text-[var(--text-color)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
              >
                <option value="">Chọn lý do</option>
                {reasons.map((reason) => (
                  <option key={reason.id} value={reason.id}>
                    {reason.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-[var(--text-color)] rounded-md hover:bg-gray-400 dark:hover:bg-gray-500"
                onClick={() => setShowReportModal(false)}
              >
                Hủy
              </button>
              <button
                className="px-4 py-2 bg-[var(--primary-color)] text-white rounded-md hover:bg-blue-600 disabled:opacity-50 flex items-center"
                onClick={handleReportSubmit}
                disabled={isSubmittingReport}
              >
                {isSubmittingReport ? (
                  <svg
                    className="animate-spin h-5 w-5 mr-2 text-white"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                ) : (
                  "Gửi báo cáo"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default TweetCard;
