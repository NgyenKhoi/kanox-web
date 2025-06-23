import { useState, useEffect, useContext } from "react";
import { toast } from "react-toastify";
import { AuthContext } from "../context/AuthContext";

// Local cache để lưu trữ dữ liệu media đã fetch
const mediaCache = new Map();

const useMedia = (
  targetIds,
  targetTypeCode = "PROFILE",
  mediaTypeName = "image"
) => {
  const [mediaData, setMediaData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const authContext = useContext(AuthContext);
  const token =
    authContext?.token ||
    sessionStorage.getItem("token") ||
    localStorage.getItem("token");

  useEffect(() => {
    if (!Array.isArray(targetIds) || targetIds.length === 0) {
      setMediaData({});
      return;
    }

    let isMounted = true;
    const controller = new AbortController();

    const fetchMedia = async () => {
      setLoading(true);
      try {
        if (!token) throw new Error("Vui lòng đăng nhập để tải media!");
        if (!process.env.REACT_APP_API_URL)
          throw new Error("API URL chưa được định nghĩa!");

        const validTargetIds = targetIds.filter(
          (id) => id && typeof id === "string"
        );
        if (validTargetIds.length === 0) {
          setMediaData({});
          return;
        }

        // Tạo key cho cache dựa trên targetIds, targetTypeCode, và mediaTypeName
        const cacheKey = `${validTargetIds.join(",")}:${targetTypeCode}:${mediaTypeName}`;
        if (mediaCache.has(cacheKey)) {
          // Sử dụng dữ liệu từ cache nếu có
          if (isMounted) {
            setMediaData(mediaCache.get(cacheKey));
          }
          return;
        }

        const responses = await Promise.all(
          validTargetIds.map((targetId) =>
            fetch(
              `${process.env.REACT_APP_API_URL}/media/target?targetId=${targetId}&targetTypeCode=${targetTypeCode}&mediaTypeName=${mediaTypeName}&status=true`,
              {
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                signal: controller.signal,
              }
            )
          )
        );

        const mediaResults = await Promise.all(
          responses.map(async (res) => {
            if (!res.ok) throw new Error(`Lỗi fetch media: ${res.status}`);
            return res.json();
          })
        );

        const newMediaData = {};
        mediaResults.forEach((data, index) => {
          newMediaData[validTargetIds[index]] = Array.isArray(data?.data)
            ? data.data.map((m) => m?.url).filter(Boolean)
            : [];
        });

        // Lưu vào cache
        mediaCache.set(cacheKey, newMediaData);

        if (isMounted) {
          setMediaData(newMediaData);
        }
      } catch (err) {
        if (err.name === "AbortError") return;
        const msg = err.message || "Lỗi khi lấy media.";
        if (isMounted) {
          setError(msg);
          toast.error(msg);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchMedia();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [targetIds, targetTypeCode, mediaTypeName, token]);

  return { mediaData, loading, error };
};

export default useMedia;