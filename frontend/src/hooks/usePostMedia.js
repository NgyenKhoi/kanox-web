import { useEffect, useState } from "react";

export default function usePostMedia(postId) {
    const [imageData, setImageData] = useState([]);
    const [videoData, setVideoData] = useState([]);
    const [error, setError] = useState(null);
    const token = localStorage.getItem("token");

    useEffect(() => {
        if (!postId || !token) return;

        const fetchPostMedia = async () => {
            try {
                const res = await fetch(`${process.env.REACT_APP_API_URL}/media/post/${postId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (!res.ok) throw new Error("Không thể tải media của bài viết");

                const data = await res.json();
                setImageData(data.image || []);
                setVideoData(data.video || []);
            } catch (err) {
                setError(err.message);
            }
        };

        fetchPostMedia();
    }, [postId, token]);

    return { imageData, videoData, error };
}
