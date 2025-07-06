import { useState, useCallback } from "react";
import { toast } from "react-toastify";

function useGroupSearch(token, navigate) {
    const [searchKeyword, setSearchKeyword] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    const searchGroups = async (keyword) => {
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
                `${process.env.REACT_APP_API_URL}/search/groups?keyword=${encodeURIComponent(keyword)}`,
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
                throw new Error("Lỗi khi tìm nhóm.");
            }

            const data = await response.json();
            setSearchResults(data);
        } catch (error) {
            toast.error("Không thể tìm nhóm: " + error.message);
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    const debounce = (func, delay) => {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func(...args), delay);
        };
    };

    const debouncedSearch = useCallback(debounce(searchGroups, 300), [
        token,
        navigate,
    ]);

    return {
        searchKeyword,
        setSearchKeyword,
        searchResults,
        isSearching,
        debouncedSearch,
    };
}

export default useGroupSearch;
