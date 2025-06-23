import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { toast } from "react-toastify";

// Simple in-memory cache
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
    console.log("⏱️ useMedia called with:");
    console.log("👉 targetIds:", targetIds);
    console.log("👉 targetTypeCode:", targetTypeCode);
    console.log("👉 mediaTypeName:", mediaTypeName);
    if (!Array.isArray(targetIds) || targetIds.length === 0) {
      console.warn("❌ useMedia: Không có targetIds hợp lệ, bỏ qua fetch.");
      setMediaData({});
      return;
    }

    let isMounted = true;
    const controller = new AbortController();

    const validIds = [...new Set(targetIds.filter((id) => !!id))];
    console.log("✅ validIds:", validIds);

    if (validIds.length === 0) {
      console.warn("❌ useMedia: Tất cả targetIds không hợp lệ sau khi lọc.");
      setMediaData({});
      return;
    }
    const cacheKey = `${validIds
      .sort()
      .join(",")}:${targetTypeCode}:${mediaTypeName}`;

    const fetchMedia = async () => {
      setLoading(true);
      setError(null);

      if (mediaCache.has(cacheKey)) {
        setMediaData(mediaCache.get(cacheKey));
        setLoading(false);
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

        if (!response.ok)
          throw new Error(`Lỗi fetch media: ${response.status}`);

        const data = await response.json();
        const grouped = {};

        for (const item of data) {
          if (!grouped[item.targetId]) grouped[item.targetId] = [];
          grouped[item.targetId].push(item.url);
        }

        mediaCache.set(cacheKey, grouped);

        if (isMounted) setMediaData(grouped);
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

    const delay = setTimeout(fetchMedia, 150);

    return () => {
      isMounted = false;
      controller.abort();
      clearTimeout(delay);
    };
  }, [targetIds, targetTypeCode, mediaTypeName, token]);

  return { mediaData, loading, error };
};

export default useMedia;
