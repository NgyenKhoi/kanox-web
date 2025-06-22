import { useState, useEffect } from "react";

function useCommentAvatars(comments) {
  const [avatars, setAvatars] = useState({});

  useEffect(() => {
    const fetchAvatars = async () => {
      const newAvatars = {};
      for (const comment of comments) {
        const userId = comment.user.id;
        if (!newAvatars[userId]) {
          try {
            const res = await fetch(
              `${process.env.REACT_APP_API_URL}/media?targetId=${userId}&targetType=PROFILE&mediaType=image`
            );
            const data = await res.json();
            if (data?.data?.length > 0) {
              newAvatars[userId] = data.data[0].url;
            } else {
              newAvatars[userId] = null;
            }
          } catch (error) {
            console.error("Lỗi khi fetch avatar:", error.message);
            newAvatars[userId] = null;
          }
        }
      }
      setAvatars(newAvatars);
    };

    if (comments.length > 0) {
      fetchAvatars();
    }
  }, [comments]);

  return avatars;
}

export default useCommentAvatars;
