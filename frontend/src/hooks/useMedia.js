import { useState, useEffect, useContext, useMemo } from "react";
import { AuthContext } from "../context/AuthContext";
import { toast } from "react-toastify";

const profileMediaCache = new Map();

const useMedia = (
    targetIds,
    targetTypeCode = "PROFILE",
    mediaTypeName = "image"
) => {
  const [mediaData, setMediaData] = useState({});
  const [mediaUrl, setMediaUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { token } = useContext(AuthContext);

  const stableTargetIds = useMemo(() => {
    return Array.isArray(targetIds)
        ? [...new Set(targetIds.filter((id) => id !== null && id !== undefined))]
        : [];
  }, [JSON.stringify(targetIds || [])]);

  useEffect(() => {
    if (stableTargetIds.length === 0 || !token) {
      setMediaData({});
      setMediaUrl(null);
      console.debug("[useMedia] Không có targetIds hợp lệ hoặc chưa có token.");
      return;
    }

    const controller = new AbortController();
    let isMounted = true;

    const fetchMedia = async () => {
      console.debug("[useMedia] Fetching media for:", stableTargetIds);
      setLoading(true);
      setError(null);

      try {
        const cacheKey = `${mediaTypeName}-${stableTargetIds.join(",")}`;

        // ✅ Nếu là PROFILE và đã cache rồi → dùng lại
        if (targetTypeCode === "PROFILE" && profileMediaCache.has(cacheKey)) {
          const cached = profileMediaCache.get(cacheKey);
          if (isMounted) {
            setMediaData(cached);
            if (stableTargetIds.length === 1) {
              const firstUrl = cached?.[stableTargetIds[0]]?.[0]?.url || null;
              setMediaUrl(firstUrl);
            }
          }
          setLoading(false);
          return;
        }

        const query = new URLSearchParams();
        stableTargetIds.forEach((id) => query.append("targetIds", id));
        query.append("targetTypeCode", targetTypeCode);
        query.append("mediaTypeName", mediaTypeName);
        query.append("status", "true");

        const apiUrl = `https://kanox.duckdns.org/api/media/targets?${query}`;
        console.debug("[useMedia] API URL:", apiUrl);

        const response = await fetch(apiUrl, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(`Lỗi fetch media: ${response.status} - ${text}`);
        }

        const data = await response.json();
        const grouped = data;

        if (isMounted) {
          setMediaData(grouped);
          if (stableTargetIds.length === 1) {
            const firstUrl = grouped?.[stableTargetIds[0]]?.[0]?.url || null;
            setMediaUrl(firstUrl);
          } else {
            setMediaUrl(null);
          }
        }

        // ✅ Cache lại nếu là PROFILE
        if (targetTypeCode === "PROFILE") {
          profileMediaCache.set(cacheKey, grouped);
        }
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

    fetchMedia();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [stableTargetIds, targetTypeCode, mediaTypeName, token]);

  return { mediaData, mediaUrl, loading, error };
};

export default useMedia;
