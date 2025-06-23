import useMedia from "./useMedia";

const useCommentAvatars = (comments) => {
  const userIds =
    Array.isArray(comments)
      ? comments.map((c) => c?.user?.id).filter((id) => id !== undefined && id !== null)
      : [];

  const { mediaData, loading, error } = useMedia(userIds, "PROFILE", "image");

  const avatars = {};
  for (const userId of userIds) {
    avatars[userId] = mediaData?.[userId]?.[0]?.url || null;
  }

  return { avatars, loading, error };
};

export default useCommentAvatars;
