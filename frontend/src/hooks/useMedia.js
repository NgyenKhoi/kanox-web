import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { toast } from "react-toastify";

const mediaCache = new Map();
window.mediaCache = mediaCache;

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
    const validIds = Array.isArray(targetIds)
      ? [...new Set(targetIds.filter((id) => id !== null && id !== undefined))]
      : [];

    if (validIds.length === 0) {
      setMediaData({});
      console.debug("[useMedia] Không có targetIds hợp lệ.");
      return;
    }

    const cacheKey = `${validIds
      .sort()
      .join(",")}:${targetTypeCode}:${mediaTypeName}`;
    const controller = new AbortController();
    let isMounted = true;

    const fetchMedia = async () => {
      console.debug("[useMedia] Fetching media for:", validIds);
      setLoading(true);
      setError(null);

      if (mediaCache.has(cacheKey)) {
        const cached = mediaCache.get(cacheKey);
        console.debug("[useMedia] Dữ liệu lấy từ cache:", cached);
        if (isMounted) {
          setMediaData(cached);
          setLoading(false);
        }
        return;
      }

      try {
        const query = new URLSearchParams();
        validIds.forEach((id) => query.append("targetIds", id));
        query.append("targetTypeCode", targetTypeCode);
        query.append("mediaTypeName", mediaTypeName);
        query.append("status", "true");

        const apiUrl = `${process.env.REACT_APP_API_URL}/media/targets?${query}`;
        console.debug("[useMedia] API URL:", apiUrl);

        const response = await fetch(apiUrl, {
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Lỗi fetch media: ${response.status}`);
        }

        const data = await response.json();
        console.debug("[useMedia] Data nhận được từ API:", data);

        const grouped = {};
        for (const item of data) {
          const targetId = item.targetId;
          if (!grouped[targetId]) grouped[targetId] = [];
          grouped[targetId].push(item);
        }

        mediaCache.set(cacheKey, grouped);
        if (isMounted) setMediaData(grouped);
      } catch (err) {
        console.error("[useMedia] Lỗi:", err);
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
