import React, { useState, useContext, useEffect } from "react";
import {
  Card,
  Button,
  Dropdown,
  OverlayTrigger,
  Tooltip,
  Image as BootstrapImage,
  Modal,
  Form,
  InputGroup,
} from "react-bootstrap";
import {
  FaBookmark,
  FaRegComment,
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
import ReactionButtonGroup from "./ReactionButtonGroup";
import useReaction from "../../../hooks/useReaction";
import ReactionUserListModal from "./ReactionUserListModal";

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

  const currentUserId = user?.id;
  const ownerId = owner?.id || null;
  const postId = id || null;
  const targetTypeId = tweet?.targetTypeId || 1;

  const avatarMedia = useMedia([ownerId], "PROFILE", "image");
  const imageMedia = useMedia([postId], "POST", "image");
  const videoMedia = useMedia([postId], "POST", "video");
  const avatarData = !loading && token && ownerId ? avatarMedia.mediaData : {};
  const avatarUrl = avatarData?.[ownerId]?.[0]?.url || null;
  const imageData = !loading && token && postId ? imageMedia.mediaData : {};
  const imageUrls = imageData?.[postId] || [];
  const videoData = !loading && token && postId ? videoMedia.mediaData : {};
  const videoUrls = videoData?.[postId] || [];

  const {
    reactionCountMap,
    topReactions,
    currentEmoji,
    sendReaction,
    removeReaction,
  } = useReaction({ user, targetId: tweet.id, targetTypeCode: "POST" });

  const totalCount = Object.values(reactionCountMap).reduce((sum, count) => sum + count, 0);

  useEffect(() => {
    if (!postId || !token) return;

    setIsLoadingComments(true);

    fetch(`${process.env.REACT_APP_API_URL}/comments/post/${postId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
        .then(res => {
          if (!res.ok) throw new Error("Lỗi khi tải bình luận");
          return res.json();
        })
        .then(data => {
          setComments(data);
        })
        .catch(err => {
          console.error("Comment fetch error:", err);
          toast.error("Không thể tải bình luận");
        })
        .finally(() => {
          setIsLoadingComments(false);
        });
  }, [postId, token]);

  return (
      <div className="mb-4 rounded-2xl shadow-sm border border-transparent bg-[var(--background-color)]">
        <div className="flex p-4">
          {avatarUrl ? (
              <img
                  src={avatarUrl}
                  alt="avatar"
                  className="w-12 h-12 rounded-full object-cover mr-4 hidden md:block"
              />
          ) : (
              <FaUserCircle
                  size={48}
                  className="text-[var(--text-color-muted)] mr-4 hidden md:block"
              />
          )}
          <div className="flex-1">
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center gap-2">
                <h6
                    className="font-bold text-[var(--text-color)] cursor-pointer"
                    onClick={() => navigate(`/profile/${owner?.username}`)}
                >
                  {owner?.displayName || "Người dùng"}
                </h6>
                <span className="text-sm text-[var(--text-color-muted)]">
                @{owner?.username || "unknown"} · {moment(createdAt * 1000).fromNow()}
              </span>
                <span>{/* Privacy icon here */}</span>
              </div>
              <div className="relative">
                <Dropdown>
                  <Dropdown.Toggle
                      variant="link"
                      className="text-[var(--text-color-muted)] p-1 rounded-full"
                  >
                    <FaEllipsisH />
                  </Dropdown.Toggle>
                  <Dropdown.Menu>{/* Options */}</Dropdown.Menu>
                </Dropdown>
              </div>
            </div>
            <p className="text-[var(--text-color)] mb-2 whitespace-pre-wrap">{content}</p>

            {Array.isArray(taggedUsers) && taggedUsers.length > 0 && (
                <div className="mb-2 text-sm text-[var(--text-color-muted)]">
                  Đã tag: {taggedUsers.map((u, i) => (
                    <span key={i} className="text-blue-500 mr-1">@{u.username}</span>
                ))}
                </div>
            )}

            {/* Images render logic */}

            {Array.isArray(videoUrls) && videoUrls.length > 0 && videoUrls.map((url, i) => (
                <div key={i} className="mb-2">
                  <video controls className="w-full rounded-2xl">
                    <source src={url} type="video/mp4" />
                    Trình duyệt không hỗ trợ phát video.
                  </video>
                </div>
            ))}

            {(totalCount > 0 || commentCount > 0) && (
                <div className="border-t border-[var(--border-color)] mt-2 pt-2">
                  <div className="flex justify-between items-center px-2">
                    <div className="flex items-center gap-2">
                      {topReactions.map(({ emoji, name }) => (
                          <span
                              key={name}
                              className="text-xl cursor-pointer"
                              onClick={() => {
                                setSelectedEmojiName(name);
                                setTimeout(() => setShowReactionUserModal(true), 0);
                              }}
                          >
                      {emoji}
                    </span>
                      ))}
                      <span className="text-sm text-[var(--text-color-muted)]">
                    {totalCount.toLocaleString("vi-VN")}
                  </span>
                    </div>
                    <div className="text-sm text-[var(--text-color-muted)]">
                      {commentCount} bình luận {shareCount > 0 && `· ${shareCount} lượt chia sẻ`}
                    </div>
                  </div>
                  <div className="flex justify-between mt-2 px-2">
                    <Button variant="link" className="text-[var(--text-color)]" onClick={() => setShowCommentBox(prev => !prev)}>
                      <FaRegComment size={18} />
                    </Button>
                    <Button variant="link" className="text-[var(--text-color)]">
                      <FaBookmark size={18} />
                    </Button>
                    <ReactionButtonGroup user={user} targetId={postId} targetTypeCode="POST" />
                    <Button variant="link" className="text-[var(--text-color)]">
                      <FaShareAlt size={18} />
                    </Button>
                  </div>
                </div>
            )}

            {showCommentBox && (
                <div className="mt-3 border-t pt-3">
                  {isLoadingComments ? (
                      <div className="text-[var(--text-color-muted)]">Đang tải bình luận...</div>
                  ) : comments.length === 0 ? (
                      <div className="text-[var(--text-color-muted)]">Chưa có bình luận nào.</div>
                  ) : (
                      comments.map((c) => (
                          <CommentThread
                              key={c.commentId}
                              comment={c}
                              currentUserId={currentUserId}
                              onReply={() => {}}
                              onUpdate={() => {}}
                              onDelete={() => {}}
                          />
                      ))
                  )}
                  <Form className="mt-2">
                    <div className="flex items-center gap-2">
                      {user?.avatarUrl ? (
                          <img src={user.avatarUrl} className="w-8 h-8 rounded-full" />
                      ) : (
                          <FaUserCircle size={32} className="text-[var(--text-color-muted)]" />
                      )}
                      <InputGroup>
                        <Form.Control
                            type="text"
                            placeholder="Viết bình luận..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            className="bg-[var(--background-color)] text-[var(--text-color)] border border-[var(--border-color)] rounded-full"
                        />
                        <Button type="submit" size="sm" className="rounded-full">Gửi</Button>
                      </InputGroup>
                    </div>
                  </Form>
                </div>
            )}
          </div>
        </div>

        <ReactionUserListModal
            show={showReactionUserModal}
            onHide={() => setShowReactionUserModal(false)}
            targetId={postId}
            targetTypeCode="POST"
            emojiName={selectedEmojiName}
        />
      </div>
  );
}

export default TweetCard;
