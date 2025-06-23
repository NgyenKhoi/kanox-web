import { useState, useEffect } from "react";

const useCommentAvatars = (comments) => {
  const [avatars, setAvatars] = useState({});

  useEffect(() => {
    const fetchAvatars = async () => {
      try {
        const newAvatars = {};
        const uniqueUserIds = [
          ...new Set(comments.map((c) => c.user?.id).filter(Boolean)),
        ];

        if (uniqueUserIds.length === 0) return;

        const responses = await Promise.all(
          uniqueUserIds.map((userId) =>
            fetch(
              `${process.env.REACT_APP_API_URL}/media/target?targetId=${userId}&targetTypeCode=PROFILE&mediaTypeName=image&status=true`
            )
          )
        );

        const avatarResults = await Promise.all(
          responses.map(async (res) => {
            if (!res.ok) throw new Error(`Lỗi khi fetch avatar: ${res.status}`);
            return res.json();
          })
        );

        avatarResults.forEach((data, index) => {
          const mediaArray = Array.isArray(data?.data) ? data.data : [];
          newAvatars[uniqueUserIds[index]] = mediaArray[0]?.url || null;
        });

        setAvatars(newAvatars);
      } catch (err) {
        console.error("Lỗi khi lấy avatar:", err.message);
      }
    };

    if (comments?.length > 0) {
      fetchAvatars();
    } else {
      setAvatars({});
    }
  }, [comments]);

  return { avatars };
};

export default useCommentAvatars;
