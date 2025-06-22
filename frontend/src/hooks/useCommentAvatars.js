import { useState, useEffect } from "react";

const useCommentAvatars = (comments) => {
  const [avatars, setAvatars] = useState({});

  useEffect(() => {
    const fetchAvatars = async () => {
      const newAvatars = {};
      for (const comment of comments) {
        const userId = comment.user.id;
        if (!newAvatars[userId]) {
          try {
            const res = await fetch(
              `${process.env.REACT_APP_API_URL}/media/target?targetId=${userId}&targetTypeCode=PROFILE&mediaTypeName=image&status=true`
            );
            const data = await res.json();
            const mediaArray = Array.isArray(data?.data) ? data.data : [];
            newAvatars[userId] = mediaArray[0]?.url || null;
          } catch (err) {
            console.error("Lỗi khi lấy avatar:", err.message);
            newAvatars[userId] = null;
          }
        }
      }
      setAvatars(newAvatars);
    };

    if (comments?.length > 0) {
      fetchAvatars();
    }
  }, [comments]);

  return avatars;
};

export default useCommentAvatars;
