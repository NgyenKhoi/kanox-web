import { useState, useEffect, useContext, useMemo } from "react";
import { AuthContext } from "../context/AuthContext";
import { toast } from "react-toastify";

const mediaCache = new Map();

const useSingleMedia = (
    targetId,
    targetTypeCode = "PROFILE",
    mediaTypeName = "image"
) => {
  const [mediaUrl, setMediaUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { token } = useContext(AuthContext);

  useEffect(() => {
    if (!targetId || !token) {
      setMediaUrl(null);
      return;
    }

    const cacheKey = `${targetId}-${targetTypeCode}-${mediaTypeName}`;
    if (mediaCache.has(cacheKey)) {
      setMediaUrl(mediaCache.get(cacheKey));
      return;
    }

    const controller = new AbortController();
    let isMounted = true;

    const fetchMedia = async () => {
      setLoading(true);
      setError(null);

      try {
        const query = new URLSearchParams({
          targetId: targetId.toString(),
          targetTypeCode,
          mediaTypeName,
          status: "true",
        });

        const apiUrl = `${process.env.REACT_APP_API_URL}/media/target?${query}`;
        console.debug("[useSingleMedia] Fetching:", apiUrl);

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
        console.debug("[useSingleMedia] Media response:", data);

        if (isMounted) {
          const firstUrl = data?.[0]?.url || null;
          setMediaUrl(firstUrl);
          mediaCache.set(cacheKey, firstUrl);
        }
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

    fetchMedia();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [targetId, targetTypeCode, mediaTypeName, token]);

  return { mediaUrl, loading, error };
};

export default useSingleMedia;