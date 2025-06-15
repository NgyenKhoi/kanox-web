import { useState, useEffect, useContext } from "react";
import { toast } from "react-toastify";
import { AuthContext } from "../context/AuthContext";

const useUserMedia = (userId, targetTypeCode = "PROFILE", mediaTypeName = "image") => {
    const [mediaUrl, setMediaUrl] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { token } = useContext(AuthContext);

    useEffect(() => {
        if (!userId) return;

        const fetchMedia = async () => {
            setLoading(true);
            if (!token) {
                setError("Không tìm thấy token. Vui lòng đăng nhập lại.");
                toast.error("Không tìm thấy token. Vui lòng đăng nhập lại.");
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(
                    `${process.env.REACT_APP_API_URL}/media/target?targetId=${userId}&targetTypeCode=${targetTypeCode}&mediaTypeName=${mediaTypeName}&status=true`,
                    {
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.message || "Lỗi khi lấy ảnh.");
                }

                setMediaUrl(data.length > 0 ? data[0].url : null);
            } catch (err) {
                setError(err.message);
                toast.error(err.message || "Lỗi khi lấy ảnh.");
                setMediaUrl(null);
            } finally {
                setLoading(false);
            }
        };

        fetchMedia();
    }, [userId, targetTypeCode, mediaTypeName, token]);

    return { mediaUrl, loading, error };
};

export default useUserMedia;