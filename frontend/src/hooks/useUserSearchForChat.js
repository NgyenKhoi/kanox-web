import { useState, useCallback } from "react";
import { toast } from "react-toastify";

// Sửa lỗi: Di chuyển hàm debounce lên đầu để đảm bảo nó được định nghĩa trước khi sử dụng
const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    };
};

function useUserSearchForChat(token, navigate) {
    const [searchKeyword, setSearchKeyword] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    const searchUsers = async (keyword) => {
        if (!keyword.trim()) {
            setSearchResults([]);
            setIsSearching(false);
            return;
        }

        if (!token) {
            toast.error("Vui lòng đăng nhập lại.");
            navigate("/");
            return;
        }

        setIsSearching(true);
        try {
            const response = await fetch(
                `${
                    process.env.REACT_APP_API_URL
                }/search/users?keyword=${encodeURIComponent(keyword)}`,
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.status === 401) {
                toast.error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
                sessionStorage.removeItem("token");
                localStorage.removeItem("token");
                navigate("/");
                return;
            }

            if (!response.ok) {
                throw new Error("Lỗi khi tìm kiếm.");
            }

            const data = await response.json();
            setSearchResults(data);
        } catch (error) {
            toast.error("Không thể tìm kiếm: " + error.message);
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    const createChat = async (userId) => {
        if (!token) {
            toast.error("Vui lòng đăng nhập lại.");
            navigate("/");
            return null;
        }

        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/chat/create`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ participantId: userId }),
            });

            if (response.status === 401) {
                toast.error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
                sessionStorage.removeItem("token");
                localStorage.removeItem("token");
                navigate("/");
                return null;
            }

            if (!response.ok) {
                throw new Error("Lỗi khi tạo chat.");
            }

            const data = await response.json();
            return data.chatId; // Giả định API trả về { chatId: number }
        } catch (error) {
            toast.error("Không thể tạo chat: " + error.message);
            return null;
        }
    };

    // Sử dụng debounce đã được định nghĩa ở trên
    const debouncedSearch = useCallback(
        debounce(searchUsers, 300),
        [token, navigate, searchUsers] // Thêm searchUsers vào dependency để đảm bảo hàm được cập nhật
    );

    // Hàm để xử lý khi chọn một người dùng từ kết quả tìm kiếm
    const handleSelectUser = async (userId) => {
        const chatId = await createChat(userId);
        if (chatId) {
            navigate(`/messages?chatId=${chatId}`); // Chuyển hướng đến chat
            setSearchKeyword(""); // Reset từ khóa tìm kiếm
            setSearchResults([]); // Reset kết quả tìm kiếm
        }
    };

    return {
        searchKeyword,
        setSearchKeyword,
        searchResults,
        isSearching,
        debouncedSearch,
        handleSelectUser,
    };
}

export default useUserSearchForChat;