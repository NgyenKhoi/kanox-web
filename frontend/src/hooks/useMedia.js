import { useState, useEffect, useContext } from "react";
import { toast } from "react-toastify";
import { AuthContext } from "../context/AuthContext";

const useMedia = (targetIds, targetTypeCode = "PROFILE", mediaTypeName = "image") => {
  const [mediaData, setMediaData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const authContext = useContext(AuthContext);
  const token = authContext?.token || sessionStorage.getItem("token") || localStorage.getItem("token");

  useEffect(() => {
    if (!targetIds || targetIds.length === 0) return;

    let isMounted = true;

    const fetchMedia = async () => {
      setLoading(true);
      try {
        const responses = await Promise.all(targetIds.map(targetId => 
          fetch(`${process.env.REACT_APP_API_URL}/media/target?targetId=${targetId}&targetTypeCode=${targetTypeCode}&mediaTypeName=${mediaTypeName}&status=true`, {
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          })
        ));

        const mediaResults = await Promise.all(responses.map(res => res.json()));

        const newMediaData = {};
        mediaResults.forEach((data, index) => {
          if (Array.isArray(data?.data)) {
            newMediaData[targetIds[index]] = data.data.map(m => m.url).filter(Boolean);
          }
        });

        if (isMounted) {
          setMediaData(newMediaData);
        }
      } catch (err) {
        const msg = err.message || "Lỗi khi lấy ảnh.";
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
    };
  }, [targetIds, targetTypeCode, token]);

  return { mediaData, loading, error };
};

export default useMedia;
