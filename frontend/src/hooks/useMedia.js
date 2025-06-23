import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { toast } from "react-toastify";

const mediaCache = new Map();
window.mediaCache = mediaCache;

const useMedia = (targetIds, targetTypeCode = "PROFILE", mediaTypeName = "image") => {
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

    const validIds = [...new Set(targetIds.filter((id) => id !== null && id !== undefined))];
    if (validIds.length === 0) {
      setMediaData({});
      return;
    }

    const cacheKey = `${validIds.sort().join(",")}:${targetTypeCode}:${mediaTypeName}`;
    const controller = new AbortController();
    let isMounted = true;

    const fetchMedia = async () => {
      setLoading(true);
      setError(null);

      // Cache hit
      if (mediaCache.has(cacheKey)) {
        if (isMounted) {
          setMediaData(mediaCache.get(cacheKey));
          setLoading(false);
        }
        return;
      }

      try {
        const query = new URLSearchParams({
          targetIds: validIds.join(","),
          targetTypeCode,
          mediaTypeName,
          status: "true",
        });

        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/media/targets?${query}`,
          {
            headers: {
              "Content-Type": "application/json",
              ...(token && { Authorization: `Bearer ${token}` }),
            },
            signal: controller.signal,
          }
        );

        if (!response.ok) throw new Error(`Lỗi fetch media: ${response.status}`);

        const data = await response.json();
        const grouped = {};

        for (const item of data) {
          const targetId = item.targetId;
          if (!grouped[targetId]) grouped[targetId] = [];
          grouped[targetId].push(item);
        }

        mediaCache.set(cacheKey, grouped);
        if (isMounted) setMediaData(grouped);
      } catch (err) {
        if (err.name !== "AbortError" && isMounted) {
          const msg = err.message || "Lỗi khi lấy media.";
          setError(msg);
          toast.error(msg);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    const delay = setTimeout(fetchMedia, 100);

    return () => {
      isMounted = false;
      controller.abort();
      clearTimeout(delay);
    };
  }, [targetIds, targetTypeCode, mediaTypeName, token]);

  return { mediaData, loading, error };
};

export default useMedia;
