import { useState, useEffect, useContext } from "react";
import { toast } from "react-toastify";
import { AuthContext } from "../context/AuthContext";

const useMedia = (
  targetId,
  targetTypeCode = "PROFILE",
  mediaTypeName = "image",
  onUpdate = () => {}
) => {
  const [mediaUrl, setMediaUrl] = useState(null);
  const [mediaUrls, setMediaUrls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const authContext = useContext(AuthContext);
  const token =
    authContext?.token ||
    sessionStorage.getItem("token") ||
    localStorage.getItem("token");

  useEffect(() => {
    if (!targetId) return;

    let isMounted = true;
    let retryCount = 0;
    const maxRetries = 5;
    const retryDelay = 1000;

    const fetchMedia = async () => {
      if (!isMounted) return;
      setLoading(true);
      try {
        const url = `${process.env.REACT_APP_API_URL}/media/target?targetId=${targetId}&targetTypeCode=${targetTypeCode}&mediaTypeName=${mediaTypeName}&status=true`;
        console.log("🔄 Fetching media:", url);

        const response = await fetch(url, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Lỗi khi lấy ảnh.");
        }

        const mediaArray = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : [];

        if (mediaArray.length > 0) {
          const urls = mediaArray.map((m) => m.url).filter(Boolean);
          if (isMounted) {
            setMediaUrls(urls);
            setMediaUrl(urls[0] || null);
            setLoading(false);
            onUpdate(urls[0] || null); // gọi callback khi có dữ liệu
          }
        } else if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(fetchMedia, retryDelay);
        } else {
          if (isMounted) {
            setMediaUrls([]);
            setMediaUrl(null);
            setLoading(false);
          }
        }
      } catch (err) {
        const msg = err.message || "Lỗi khi lấy ảnh.";
        if (isMounted) {
          setError(msg);
          toast.error(msg);
          setMediaUrls([]);
          setMediaUrl(null);
          setLoading(false);
        }
      }
    };

    fetchMedia();

    return () => {
      isMounted = false;
    };
  }, [targetId, targetTypeCode, mediaTypeName, token]); // 🟢 Gỡ onUpdate

  return { mediaUrl, mediaUrls, loading, error };
};

export default useMedia;
