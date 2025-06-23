import useMedia from "./useMedia";

const useCommentAvatars = (comments) => {
  const userIds = comments?.map((c) => c?.user?.id).filter((id) => !!id) || [];

  const { mediaData, loading, error } = useMedia(userIds, "PROFILE", "image");

  const avatars = {};
  for (const userId of userIds) {
    avatars[userId] = mediaData[userId]?.[0]?.url || null;
  }

  return { avatars, loading, error };
};

export default useCommentAvatars;
