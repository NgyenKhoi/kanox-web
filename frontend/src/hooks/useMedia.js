import { useState, useEffect, useContext, useMemo } from "react";
import { AuthContext } from "../context/AuthContext";
import { toast } from "react-toastify";

const useMedia = (
  targetIds,
  targetTypeCode = "PROFILE",
  mediaTypeName = "image"
) => {
  const [mediaData, setMediaData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { token } = useContext(AuthContext);

  // Tối ưu hóa targetIds để không gây gọi lại liên tục
  const stableTargetIds = useMemo(() => {
    return Array.isArray(targetIds)
      ? [...new Set(targetIds.filter((id) => id !== null && id !== undefined))]
      : [];
  }, [JSON.stringify(targetIds || [])]);

  useEffect(() => {
    if (stableTargetIds.length === 0 || !token) {
      setMediaData({});
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
        console.debug("[useMedia] Dữ liệu media nhận được:", data);

        const grouped = {};
        for (const item of data) {
          const targetId = item.targetId;
          if (!grouped[targetId]) grouped[targetId] = [];
          grouped[targetId].push(item);
        }

        if (isMounted) {
          setMediaData(grouped);
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

  return { mediaData, loading, error };
};

export default useMedia;
