import { useState, useEffect, useContext } from "react";
import { toast } from "react-toastify";
import { AuthContext } from "../context/AuthContext";

const useUserMedia = (userId, targetTypeCode = "PROFILE", mediaTypeName = "image") => {
    const [mediaUrl, setMediaUrl] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const authContext = useContext(AuthContext);
    const token = authContext?.token
        || sessionStorage.getItem("token")
        || localStorage.getItem("token");

    useEffect(() => {
        if (!userId) return;

        const fetchMedia = async () => {
            setLoading(true);

            try {
                const response = await fetch(
                    `${process.env.REACT_APP_API_URL}/media/target?targetId=${userId}&targetTypeCode=${targetTypeCode}&mediaTypeName=${mediaTypeName}&status=true`,
                    {
                        headers: {
                            "Content-Type": "application/json",
                            ...(token ? { Authorization: `Bearer ${token}` } : {}),
                        },
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || "Lỗi khi lấy ảnh.");
                }

                if (Array.isArray(data)) {
                    if (data.length > 0 && data[0].url) {
                        setMediaUrl(data[0].url);
                    } else {
                        setMediaUrl(null);
                    }
                } else if (data?.url) {
                    setMediaUrl(data.url);
                } else {
                    setMediaUrl(null);
                }
            } catch (err) {
                const msg = err.message || "Lỗi khi lấy ảnh.";
                setError(msg);
                toast.error(msg);
                setMediaUrl(null);
            }   finally {
                setLoading(false);
            }
        };

        fetchMedia();
    }, [userId, targetTypeCode, mediaTypeName, token]);

    return { mediaUrl, loading, error };
};

export default useUserMedia;
