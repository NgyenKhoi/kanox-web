import React, { useState, useEffect, useContext } from "react";
import { FaSearch, FaEllipsisH } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import SidebarRight from "../../components/layout/SidebarRight/SidebarRight";
import { AuthContext } from "../../context/AuthContext";
import useSingleMedia from "../../hooks/useSingleMedia";
import useUserSearch from "../../hooks/useUserSearch";

function ExplorePage() {
  const { token, hasSynced, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  const {
    searchKeyword,
    setSearchKeyword,
    searchResults,
    isSearching,
    debouncedSearch,
  } = useUserSearch(token, navigate);

  const [activeTab, setActiveTab] = useState("for-you");

  // Handle debounced search
  useEffect(() => {
    if (searchKeyword.trim()) {
      debouncedSearch(searchKeyword);
    }
  }, [searchKeyword, debouncedSearch]);

  const trendingTopics = [
    {
      id: 1,
      category: "Chủ đề nổi trội ở Việt Nam",
      title: "cuội",
      posts: 587,
    },
    {
      id: 2,
      category: "Chủ đề nổi trội ở Việt Nam",
      title: "#khảo_oam",
      posts: 390,
    },
    {
      id: 3,
      category: "Chủ đề nổi trội ở Việt Nam",
      title: "Trung Quốc",
      posts: 197,
    },
    {
      id: 4,
      category: "Chủ đề nổi trội ở Việt Nam",
      title: "Incredible",
      posts: 197,
    },
    {
      id: 5,
      category: "Chủ đề nổi trội ở Việt Nam",
      title: "#QuangHungMasterDxForestival",
      posts: 2119,
    },
    {
      id: 6,
      category: "Chủ đề nổi trội ở Việt Nam",
      title: "#linglingkwong",
      posts: 84,
    },
    {
      id: 7,
      category: "Chủ đề nổi trội ở Việt Nam",
      title: "Movies",
      posts: 150,
    },
  ];

  const suggestedFollows = [
    {
      id: 1,
      name: "Người dùng 1",
      username: "@user1",
      avatar: "https://via.placeholder.com/40",
    },
    {
      id: 2,
      name: "Người dùng 2",
      username: "@user2",
      avatar: "https://via.placeholder.com/40",
    },
  ];

  const UserSearchItem = ({ item }) => {
    const { mediaUrl } = useSingleMedia(item.id, "PROFILE", "image");

    return (
        <div
            onClick={() => navigate(`/profile/${item.username}`)}
            className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 cursor-pointer"
        >
          <img
              src={mediaUrl || "https://via.placeholder.com/30?text=Avatar"}
              alt="User avatar"
              className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-600"
          />
          <div className="flex-1">
            <p className="font-semibold text-[var(--text-color)] text-sm">
              {item.displayName || item.username}
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-xs">
              @{item.username}
            </p>
            {item.bio && (
                <p className="text-gray-500 dark:text-gray-400 text-xs line-clamp-2">
                  {item.bio.slice(0, 100)}...
                </p>
            )}
          </div>
        </div>
    );
  };

  const renderSearchResults = () =>
      searchKeyword.trim() && (
          <div className="absolute top-full left-0 w-full mt-2 bg-[var(--content-bg)] dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-80 overflow-y-auto">
            <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                Kết quả tìm kiếm
              </p>
            </div>
            {isSearching ? (
                <div className="px-4 py-3 text-center text-sm text-gray-500 dark:text-gray-400">
                  <div className="animate-spin inline-block w-5 h-5 border-2 border-t-gray-500 rounded-full mr-2"></div>
                  Đang tải...
                </div>
            ) : searchResults.length > 0 ? (
                searchResults.map((item) => (
                    <UserSearchItem key={item.id} item={item} />
                ))
            ) : (
                <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                  Không tìm thấy kết quả.
                </div>
            )}
          </div>
      );

  const renderTabContent = () => (
      <div className="mt-0">
        {trendingTopics.length === 0 ? (
            <p className="text-center text-gray-500 p-4">
              Không có chủ đề nào đang phổ biến.
            </p>
        ) : (
            trendingTopics.map((topic) => (
                <div
                    key={topic.id}
                    className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <div>
                    <p className="text-xs text-gray-500">{topic.category}</p>
                    <p className="font-bold text-[var(--text-color)]">
                      {topic.title}
                    </p>
                    <p className="text-xs text-gray-500">{topic.posts} bài đăng</p>
                  </div>
                  <button className="text-gray-600 hover:text-black dark:text-gray-300 dark:hover:text-white">
                    <FaEllipsisH />
                  </button>
                </div>
            ))
        )}
      </div>
  );

  if (loading || !hasSynced) {
    return (
        <div className="flex justify-center items-center min-h-screen text-gray-600">
          <span className="animate-spin mr-2 border-t-2 border-gray-500 rounded-full h-5 w-5"></span>
          Đang đồng bộ dữ liệu khám phá...
        </div>
    );
  }

  return (
      <div className="flex min-h-screen bg-[var(--background-color)] text-[var(--text-color)]">
        <div className="flex flex-col flex-grow">
          <div className="sticky top-0 z-50 bg-[var(--content-bg)] border-b border-gray-200 dark:border-gray-700">
            <div className="max-w-2xl mx-auto w-full p-4">
              {/* Search input + dropdown */}
              <div className="relative z-50">
                <div className="relative flex items-center">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-300">
                    <FaSearch size={16} />
                  </div>
                  <input
                      type="text"
                      value={searchKeyword}
                      onChange={(e) => setSearchKeyword(e.target.value)}
                      placeholder="Tìm kiếm người dùng"
                      className="w-full pl-10 pr-4 py-2.5 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-[var(--text-color)] focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all duration-200"
                  />
                </div>
                {renderSearchResults()}
              </div>

              {/* Tabs */}
              <div className="flex justify-around mt-4 text-sm font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 bg-[var(--content-bg)]">
                {["for-you", "trending", "news", "sports", "entertainment"].map(
                    (tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`py-2 px-4 flex-1 text-center ${
                                activeTab === tab
                                    ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400 font-bold"
                                    : "hover:bg-gray-100 dark:hover:bg-gray-700"
                            } transition-colors duration-200`}
                        >
                          {
                            {
                              "for-you": "Cho Bạn",
                              trending: "Đang thịnh hành",
                              news: "Tin tức",
                              sports: "Thể thao",
                              entertainment: "Giải trí",
                            }[tab]
                          }
                        </button>
                    )
                )}
              </div>
            </div>
          </div>

          {/* Main content: Trending topics */}
          <div className="w-full px-4 flex-grow">
            {renderTabContent()}
          </div>
        </div>

        {/* Sidebar */}
        <div className="hidden lg:block w-[350px] border-l border-gray-200 dark:border-gray-700">
          <SidebarRight trendingTopics={trendingTopics} />
        </div>
      </div>
  );
}

export default ExplorePage;