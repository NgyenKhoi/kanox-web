import useSingleMedia from "./useSingleMedia";

const useCommentAvatar = (userId) => {
  const { mediaUrl, loading, error } = useSingleMedia(userId, "PROFILE", "image");

  return {
    avatarUrl: mediaUrl,
    loading,
    error,
  };
};

export default useCommentAvatar;