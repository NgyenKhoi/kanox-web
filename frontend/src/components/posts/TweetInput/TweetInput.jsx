import React, { useState, useEffect, useContext, useRef } from "react";
import {
  Card,
  Form,
  Button,
  Dropdown,
  FormControl,
  OverlayTrigger,
  Tooltip,
  Modal,
} from "react-bootstrap";
import {
  FaPollH,
  FaSmile,
  FaCalendarAlt,
  FaUserFriends,
  FaGlobeAmericas,
  FaLock,
  FaList,
  FaPlus,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import { AiOutlineClose } from "react-icons/ai";
import { AuthContext } from "../../../context/AuthContext";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import useEmojiList from "../../../hooks/useEmojiList";

function TweetInput({ onPostSuccess }) {
  const { user } = useContext(AuthContext);
  const [tweetContent, setTweetContent] = useState("");
  const [status, setStatus] = useState("public");
  const [taggedUserIds, setTaggedUserIds] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [customLists, setCustomLists] = useState([]);
  const [customListId, setCustomListId] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaPreviews, setMediaPreviews] = useState([]);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [showCustomList, setShowCustomList] = useState(false);
  const [showTagInput, setShowTagInput] = useState(false);
  const [showPrivacyDropdown, setShowPrivacyDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const { emojiList, loading: emojiLoading, error: emojiError } = useEmojiList();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef(null);


    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                emojiPickerRef.current &&
                !emojiPickerRef.current.contains(event.target)
            ) {
                setShowEmojiPicker(false);
            }
        };

        if (showEmojiPicker) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showEmojiPicker]);

    useEffect(() => {
    const fetchPrivacySettings = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
            `${process.env.REACT_APP_API_URL}/privacy`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
                Accept: "application/json",
              },
            }
        );
        if (!response.ok)
          throw new Error("Không thể lấy cài đặt quyền riêng tư!");
        const { data } = await response.json();
        setStatus(data.postVisibility || "public");
      } catch (err) {
        console.error("Privacy error:", err);
        toast.error(err.message);
      }
    };

    const fetchCustomLists = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
            `${process.env.REACT_APP_API_URL}/privacy/lists`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
        );
        if (!response.ok) throw new Error("Không thể lấy danh sách tùy chỉnh!");
        const { data } = await response.json();
        setCustomLists(data);
      } catch (err) {
        console.error("Custom list error:", err);
        toast.error(err.message);
      }
    };

    fetchPrivacySettings();
    fetchCustomLists();
  }, []);

  const handleTagInputChange = (e) => setTagInput(e.target.value);

  const handleAddTag = async () => {
    if (tagInput.trim() && !taggedUserIds.includes(tagInput.trim())) {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(
            `${process.env.REACT_APP_API_URL}/users/username/${tagInput}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
        );
        if (!res.ok) throw new Error("Không tìm thấy người dùng!");
        const data = await res.json();
        setTaggedUserIds([...taggedUserIds, data.id]);
        setTagInput("");
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleRemoveTag = (id) => {
    setTaggedUserIds(taggedUserIds.filter((tagId) => tagId !== id));
  };

  const handleStatusChange = (newStatus) => {
    setStatus(newStatus);
    if (newStatus !== "custom") setCustomListId(null);
  };

  const handleCustomListSelect = (listId) => setCustomListId(listId);

    const handleMediaChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            setMediaFiles((prev) => [...prev, ...files]);
            setMediaPreviews((prev) => [
                ...prev,
                ...files.map((f) => ({
                    url: URL.createObjectURL(f),
                    type: f.type, // <- thêm dòng này
                })),
            ]);
        }
    };

  const handleRemoveMedia = (index) => {
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
    setMediaPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitTweet = async () => {
    if (!tweetContent.trim()) return setError("Tweet không được để trống!");
    if (status === "custom" && !customListId)
      return setError("Vui lòng chọn danh sách tùy chỉnh!");
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const postRes = await fetch(`${process.env.REACT_APP_API_URL}/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: tweetContent,
          privacySetting: status,
          taggedUserIds,
          customListId: status === "custom" ? customListId : null,
        }),
      });

      if (!postRes.ok) throw new Error("Không thể đăng bài!");
      const newPost = await postRes.json();
      const postId = newPost.data.id;

      if (mediaFiles.length > 0) {
        const formData = new FormData();
        formData.append("userId", user.id);
        formData.append("caption", tweetContent);
        mediaFiles.forEach((file) => formData.append("files", file));

        const mediaRes = await fetch(
            `${process.env.REACT_APP_API_URL}/media/posts/${postId}/media`,
            {
              method: "POST",
              headers: { Authorization: `Bearer ${token}` },
              body: formData,
            }
        );

        if (!mediaRes.ok) throw new Error("Tải lên media thất bại.");
        toast.success("Media tải lên thành công!");
      }

      setTweetContent("");
      setTaggedUserIds([]);
      setMediaFiles([]);
      setMediaPreviews([]);
      setStatus("public");
      setCustomListId(null);
      setError(null);
      toast.success("Đăng bài thành công!");
      if (onPostSuccess) onPostSuccess(newPost.data);
    } catch (err) {
      console.error("Submit error:", err);
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderStatusIcon = (status) => {
    switch (status) {
      case "public":
        return <FaGlobeAmericas className="me-1" />;
      case "friends":
        return <FaUserFriends className="me-1" />;
      case "only_me":
        return <FaLock className="me-1" />;
      case "custom":
        return <FaList className="me-1" />;
      default:
        return null;
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

  const handleOpenMediaModal = (index) => {
    setCurrentMediaIndex(index);
    setShowMediaModal(true);
  };

  const handleCloseMediaModal = () => {
    setShowMediaModal(false);
  };

  const handleNextMedia = () => {
    setCurrentMediaIndex((prev) =>
        prev === mediaPreviews.length - 1 ? 0 : prev + 1
    );
  };

  const handlePrevMedia = () => {
    setCurrentMediaIndex((prev) =>
        prev === 0 ? mediaPreviews.length - 1 : prev - 1
    );
  };

      const renderMediaPreview = () => {
          if (mediaPreviews.length === 0) return null;

          const mediaStyle = "w-full h-full object-cover rounded-lg";
          const baseContainer = "grid gap-1 mb-3 overflow-hidden rounded-lg";

          const getMediaItem = (preview, index) => {
              const isVideo = preview.type.startsWith("video/");
              return (
                  <div key={index} className="relative group w-full h-full overflow-hidden">
                      {isVideo ? (
                          <video src={preview.url} controls className={mediaStyle}/>
                      ) : (
                          <img src={preview.url} alt="preview" className={mediaStyle}/>
                      )}
                      <button
                          className="absolute top-1 right-1 text-white bg-black/60 rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                          onClick={() => handleRemoveMedia(index)}
                      >
                          ×
                      </button>
                  </div>
              );
          };

          const filesToShow = mediaPreviews.slice(0, 4);
          const extraCount = mediaPreviews.length - 4;

          if (filesToShow.length === 1) {
              return (
                  <div className={`${baseContainer} grid-cols-1`}>
                      {getMediaItem(filesToShow[0], 0)}
                  </div>
              );
          }

          if (filesToShow.length === 2) {
              return (
                  <div className={`${baseContainer} grid-cols-2`}>
                      {filesToShow.map((url, i) => getMediaItem(url, i))}
                  </div>
              );
          }

          if (filesToShow.length === 3) {
              return (
                  <div className={`${baseContainer} grid-rows-2 grid-cols-2`}>
                      <div className="col-span-2 row-span-1">{getMediaItem(filesToShow[0], 0)}</div>
                      <div>{getMediaItem(filesToShow[1], 1)}</div>
                      <div>{getMediaItem(filesToShow[2], 2)}</div>
                  </div>
              );
          }

          // 4 files hoặc hơn
          return (
              <div className={`${baseContainer} grid-cols-2`}>
                  {filesToShow.map((url, i) => {
                      if (i === 3 && extraCount > 0) {
                          return (
                              <div key={i} className="relative group w-full h-full overflow-hidden cursor-pointer"
                                   onClick={() => handleOpenMediaModal(3)}>
                                  <img src={url} alt="preview" className={`${mediaStyle} opacity-70`}/>
                                  <div
                                      className="absolute inset-0 flex items-center justify-center text-white text-xl font-bold bg-black/50">
                                      +{extraCount}
                                  </div>
                                  <button
                                      className="absolute top-1 right-1 text-white bg-black/60 rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                                      onClick={(e) => {
                                          e.stopPropagation();
                                          handleRemoveMedia(i);
                                      }}
                                  >
                                      ×
                                  </button>
                              </div>
                          );
                      }
                      return getMediaItem(url, i);
                  })}
              </div>
          );
      };

  return (
      <>
        <div className="mb-3 rounded-2xl shadow-sm border border-[var(--border-color)] bg-[var(--background-color)] text-[var(--text-color)]">
          <div className="p-3">
            <textarea
                rows={3}
                placeholder="Bạn đang nghĩ gì?"
                className="w-full bg-transparent border-0 focus:ring-0 focus:outline-none mb-2 text-[var(--text-color)]"
                style={{ resize: "none" }}
                value={tweetContent}
                onChange={(e) => setTweetContent(e.target.value)}
            />
            {renderMediaPreview()}

            {taggedUserIds.length > 0 && (
                <div className="flex flex-wrap mb-2">
                  {taggedUserIds.map((tagId, index) => (
                      <span
                          key={index}
                          className="bg-[var(--primary-color)] text-white px-2 py-1 rounded mr-2 mb-1 text-sm"
                      >
                  @User_{tagId}
                        <Button
                            variant="link"
                            className="text-white p-0 ml-1"
                            onClick={() => handleRemoveTag(tagId)}
                        >
                    x
                  </Button>
                </span>
                  ))}
                </div>
            )}

            {status === "custom" && (
                <div className="relative">
                  <button onClick={() => setShowCustomList(!showCustomList)} className="w-full text-start rounded-full border border-[var(--border-color)] px-3 py-2">
                    {customListId
                        ? customLists.find((l) => l.id === customListId)?.listName
                        : "Chọn danh sách tùy chỉnh"}
                  </button>
                  {showCustomList && (
                      <div className="absolute z-50 mt-1 bg-[var(--background-color)] border border-[var(--border-color)] rounded shadow w-full">
                        {customLists.map((list) => (
                            <button
                                key={list.id}
                                onClick={() => {
                                  handleCustomListSelect(list.id);
                                  setShowCustomList(false);
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-[var(--hover-bg-color)]"
                            >
                              {list.listName}
                            </button>
                        ))}
                      </div>
                  )}
                </div>
            )}

            {error && <p className="text-red-600">{error}</p>}

        <div className="flex justify-between items-center mt-3 pt-3 border-t border-[var(--border-color)] flex-wrap">
        <div className="flex align-items-center mb-2 mb-md-0">
                <div className="relative mr-2">
                  <button
                      variant="link"
                      className="text-[var(--primary-color)] p-2 rounded-full hover:bg-[var(--hover-bg-color)] transition-colors"
                      onClick={() =>
                          document.getElementById("hiddenMediaInput").click()
                      }
                  >
                    <FaPollH size={20} />
                  </button>
                  <input
                      type="file"
                      id="hiddenMediaInput"
                      accept="image/*,video/*"
                      multiple
                      style={{ display: "none" }}
                      onChange={handleMediaChange}
                  />
                </div>

                <div className="relative mr-2">
                    <Button
                        variant="link"
                        className="text-[var(--primary-color)] p-2 rounded-full hover-bg-light"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    >
                        <FaSmile size={20} />
                    </Button>

                    {showEmojiPicker && (
                        <div
                            ref={emojiPickerRef}
                            className="absolute z-50 mt-2 w-64 max-h-64 overflow-y-auto bg-[var(--background-color)] border border-[var(--border-color)] rounded shadow p-2 grid grid-cols-6 gap-2"
                        >
                            {emojiLoading ? (
                                <div className="text-sm text-gray-400 px-2 py-1">Đang tải...</div>
                            ) : emojiList.length > 0 ? (
                                emojiList.map((emoji, i) => (
                                    <button
                                        key={i}
                                        className="text-xl hover:bg-[var(--hover-bg-color)] rounded p-1"
                                        onClick={() => {
                                            setTweetContent((prev) => prev + emoji.emoji);
                                            setShowEmojiPicker(false);
                                        }}
                                    >
                                        {emoji.emoji}
                                    </button>
                                ))
                            ) : (
                                <div className="text-sm text-gray-400 px-2 py-1">Không có emoji nào.</div>
                            )}
                        </div>
                    )}
                </div>
                <Button
                    variant="link"
                    className="text-[var(--primary-color)] p-2 rounded-full hover-bg-light mr-2"
                >
                  <FaCalendarAlt size={20} />
                </Button>

          <div className="relative mr-2">
            <button
                onClick={() => setShowTagInput(!showTagInput)} // bạn có thể tạo một state mới ví dụ showTagInput
                className="p-2 rounded-full text-[var(--primary-color)] hover:bg-[var(--hover-bg-color)] transition-colors"
            >
              <FaUserFriends size={20} />
            </button>

              {showTagInput && (
                <div className="absolute z-50 mt-2 w-64 bg-[var(--background-color)] border border-[var(--border-color)] rounded shadow p-3">
                  <input
                      type="text"
                      placeholder="Nhập username"
                      value={tagInput}
                      onChange={handleTagInputChange}
                      className="border border-[var(--border-color)] bg-[var(--background-color)] text-[var(--text-color)] px-3 py-2 rounded w-full mb-2"
                  />
                  <button
                      className="bg-[var(--primary-color)] text-white text-sm px-4 py-2 rounded w-full disabled:opacity-50"
                      onClick={handleAddTag}
                      disabled={!tagInput.trim()}
                  >
                    Thêm
                  </button>
                </div>
            )}
          </div>

                <OverlayTrigger
                    placement="top"
                    overlay={
                      <Tooltip id="status-tooltip">
                        Chọn đối tượng xem bài đăng
                      </Tooltip>
                    }
                >
                  <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setShowPrivacyDropdown(!showPrivacyDropdown)}
                        className="rounded-full border px-3 py-1 flex items-center gap-2 text-sm text-[var(--text-color)] border-[var(--border-color)] bg-transparent hover:bg-[var(--hover-bg-color)]"
                    >
                      {renderStatusIcon(status)}
                      {renderStatusText(status)}
                    </button>

                    {showPrivacyDropdown && (
                        <div className="absolute left-0 mt-1 w-48 bg-[var(--background-color)] border border-[var(--border-color)] rounded shadow z-50 text-sm">
                          <button
                              onClick={() => {
                                handleStatusChange("public");
                                setShowPrivacyDropdown(false);
                              }}
                              className="w-full px-4 py-2 text-left hover:bg-[var(--hover-bg-color)] flex items-center gap-2"
                          >
                            <FaGlobeAmericas /> Công khai
                          </button>
                          <button
                              onClick={() => {
                                handleStatusChange("friends");
                                setShowPrivacyDropdown(false);
                              }}
                              className="w-full px-4 py-2 text-left hover:bg-[var(--hover-bg-color)] flex items-center gap-2"
                          >
                            <FaUserFriends /> Bạn bè
                          </button>
                          <button
                              onClick={() => {
                                handleStatusChange("only_me");
                                setShowPrivacyDropdown(false);
                              }}
                              className="w-full px-4 py-2 text-left hover:bg-[var(--hover-bg-color)] flex items-center gap-2"
                          >
                            <FaLock /> Chỉ mình tôi
                          </button>
                          <button
                              onClick={() => {
                                handleStatusChange("custom");
                                setShowPrivacyDropdown(false);
                              }}
                              className="w-full px-4 py-2 text-left hover:bg-[var(--hover-bg-color)] flex items-center gap-2"
                          >
                            <FaList /> Tùy chỉnh
                          </button>
                        </div>
                    )}
                  </div>
                </OverlayTrigger>
              </div>

              <Button
                  variant="primary"
                  className="rounded-pill px-4 fw-bold"
                  onClick={handleSubmitTweet}
                  disabled={
                      !tweetContent.trim() ||
                      (status === "custom" && !customListId) ||
                      loading
                  }
              >
                {loading ? "Đang đăng..." : "Đăng"}
              </Button>
            </div>
          </div>
        </div>

        {showMediaModal && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-[var(--background-color)] relative w-full max-w-4xl max-h-[80vh] overflow-hidden rounded-lg">
            <button onClick={handleCloseMediaModal} className="absolute top-2 right-2 text-white text-xl">×</button>
            <button onClick={handlePrevMedia} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-white text-2xl">
              <FaChevronLeft />
            </button>
            <button onClick={handleNextMedia} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white text-2xl">
              <FaChevronRight />
            </button>
              {mediaPreviews[currentMediaIndex]?.type.startsWith("video/") ? (
                  <video
                      src={mediaPreviews[currentMediaIndex].url}
                      controls
                      style={{ width: "100%", maxHeight: "60vh", objectFit: "contain" }}
                  />
              ) : (
                  <img
                      src={mediaPreviews[currentMediaIndex].url}
                      alt="media"
                      style={{ width: "100%", maxHeight: "60vh", objectFit: "contain" }}
                  />
              )}
          </div>
        </div>
        )}
      </>
  );
}

export default TweetInput;