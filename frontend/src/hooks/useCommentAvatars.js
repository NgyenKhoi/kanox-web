import { useState, useEffect } from "react";
import { toast } from "react-toastify";

const useCommentAvatars = (comments) => {
  const [avatars, setAvatars] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    const fetchAvatars = async () => {
      try {
        setError(null);
        if (!Array.isArray(comments) || comments.length === 0) {
          setAvatars({});
          return;
        }

        const uniqueUserIds = [
          ...new Set(
            comments
              .map((c) => c?.user?.id)
              .filter((id) => id && typeof id === "string")
          ),
        ];

        if (uniqueUserIds.length === 0) {
          setAvatars({});
          return;
        }

        const responses = await Promise.all(
          uniqueUserIds.map((userId) =>
            fetch(
              `${process.env.REACT_APP_API_URL}/media/target?targetId=${userId}&targetTypeCode=PROFILE&mediaTypeName=image&status=true`,
              {
                headers: {
                  "Content-Type": "application/json",
                },
                signal: controller.signal,
              }
            )
          )
        );

        const avatarResults = await Promise.all(
          responses.map(async (res) => {
            if (!res.ok) throw new Error(`Lỗi khi fetch avatar: ${res.status}`);
            return res.json();
          })
        );

        const newAvatars = {};
        avatarResults.forEach((data, index) => {
          const mediaArray = Array.isArray(data?.data) ? data.data : [];
          newAvatars[uniqueUserIds[index]] = mediaArray[0]?.url || null;
        });

        setAvatars(newAvatars);
      } catch (err) {
        if (err.name === "AbortError") return;
        const msg = err.message || "Lỗi khi lấy avatar.";
        setError(msg);
        toast.error(msg);
      }
    };

    fetchAvatars();

    return () => {
      controller.abort();
    };
  }, [comments]);

  return { avatars, error };
};

export default useCommentAvatars;