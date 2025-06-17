import { useState, useCallback } from "react";
import { toast } from "react-toastify";

function useUserSearch(token, navigate) {
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

  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  const debouncedSearch = useCallback(debounce(searchUsers, 300), [
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

export default useUserSearch;
