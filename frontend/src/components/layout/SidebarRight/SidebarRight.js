import React, { useState, useEffect, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaSearch, FaEllipsisH } from "react-icons/fa";
import useUserSearch from "../../../hooks/useUserSearch";
import { AuthContext } from "../../../context/AuthContext";

function SidebarRight() {
  const [showFullFooter, setShowFullFooter] = useState(false);
  const [showTrends, setShowTrends] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const { token, hasSynced, loading } = useContext(AuthContext);
  const navigate = useNavigate();
  const {
    searchKeyword,
    setSearchKeyword,
    searchResults,
    isSearching,
    debouncedSearch,
  } = useUserSearch(token, navigate);

  useEffect(() => {
    if (searchKeyword.trim()) debouncedSearch(searchKeyword);
  }, [searchKeyword, debouncedSearch]);

  useEffect(() => {
    if ("requestIdleCallback" in window) {
      requestIdleCallback(() => setShowTrends(true));
      requestIdleCallback(() => setShowSuggestions(true));
    } else {
      // Fallback nếu trình duyệt không hỗ trợ
      setTimeout(() => {
        setShowTrends(true);
        setShowSuggestions(true);
      }, 500);
    }
  }, []);

  const trends = [
    { id: 1, name: "Doanh nghiệp & Tài chính", title: "Investing", tweets: "143 N bài đăng" },
    { id: 2, name: "Chủ đề ở Việt Nam", title: "Quời", tweets: "436 N bài đăng" },
    { id: 3, name: "Chủ đề ở Việt Nam", title: "#riyadh", tweets: "989 N bài đăng" },
    { id: 4, name: "Khác", title: "Count", tweets: "82.2 N bài đăng" },
  ];

  const suggestedUsers = [
    {
      id: 1,
      name: "Ayii",
      username: "Ayiiyiii",
      avatar: "https://via.placeholder.com/40?text=Ayii",
    },
    {
      id: 2,
      name: "無一",
      username: "cero_09051",
      avatar: "https://via.placeholder.com/40?text=無一",
    },
    {
      id: 3,
      name: "Dilibay ✨💛",
      username: "Dilibay_heaven",
      avatar: "https://via.placeholder.com/40?text=Dilibay",
    },
  ];

  const fullFooterLinks = [
    { to: "/about", text: "Giới thiệu" },
    { to: "/help-center", text: "Trung tâm Trợ giúp" },
    { to: "/terms", text: "Điều khoản Dịch vụ" },
    { to: "/privacy", text: "Chính sách Riêng tư" },
    { to: "/cookies", text: "Chính sách cookie" },
    { to: "/accessibility", text: "Khả năng truy cập" },
    { to: "/ads-info", text: "Thông tin quảng cáo" },
    { to: "/blog", text: "Blog" },
    { to: "/ads", text: "Quảng cáo" },
    { to: "/business", text: "KaNox dành cho doanh nghiệp" },
    { to: "/developers", text: "Nhà phát triển" },
    { to: "/directory", text: "Danh mục" },
    { to: "/settings", text: "Cài đặt" },
  ];

  const defaultFooterLinks = fullFooterLinks.slice(0, 5);
  const handleSubscribePremiumClick = () => navigate("/premium");

  return (
      <div className="p-3 pt-2 hidden lg:block sticky top-0 h-screen overflow-y-auto scrollbar-hide bg-[var(--background-color)] text-[var(--text-color)]">
        {/* Tìm kiếm */}
        <div className="sticky top-0 bg-[var(--background-color)] z-30">
          <div className="relative w-full mb-4">
            <FaSearch
                className="absolute top-1/2 left-3 transform -translate-y-1/2 text-gray-500"
                size={18}
            />
            <input
                type="search"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="Tìm kiếm"
                className="w-full pl-10 pr-4 py-3 rounded-full bg-[var(--background-color)] border border-[var(--border-color)] text-[var(--text-color)] shadow-sm text-sm"
            />
          </div>
        </div>

        {/* Premium Card (LCP target) */}
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl shadow-sm mb-4 p-4">
          <h5 className="font-bold mb-2">Đăng ký gói Premium</h5>
          <p className="text-sm mb-3" style={{ minHeight: "1.25rem" }}>
            Đăng ký để mở khóa các tính năng mới và nhận chia sẻ doanh thu nếu bạn là người sáng tạo nội dung.
          </p>
          <button
              onClick={handleSubscribePremiumClick}
              className="bg-[var(--background-color)] text-[var(--text-color)] px-4 py-2 rounded-full font-bold"
          >
            Đăng ký
          </button>
        </div>

        {/* Trends (lazy loaded) */}
        {showTrends && (
            <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl shadow-sm mb-4">
              <div className="p-4 pb-2 font-bold">Những điều đang diễn ra</div>
              {trends.map((trend) => (
                  <div
                      key={trend.id}
                      className="px-4 py-3 hover:bg-[var(--hover-bg-color)] cursor-pointer border-b border-[var(--border-color)]"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-xs text-gray-500">{trend.name}</div>
                        <div className="font-bold text-sm">{trend.title}</div>
                        <div className="text-xs text-gray-500">{trend.tweets}</div>
                      </div>
                      <FaEllipsisH className="text-gray-500" size={16} />
                    </div>
                  </div>
              ))}
              <div className="px-4 py-2 font-bold text-sm hover:bg-[var(--hover-bg-color)] cursor-pointer">
                Hiển thị thêm
              </div>
            </div>
        )}

        {/* Suggested users (lazy loaded) */}
        {showSuggestions && (
            <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl shadow-sm mb-4">
              <div className="p-4 pb-2 font-bold">Gợi ý theo dõi</div>
              {suggestedUsers.map((user) => (
                  <div
                      key={user.id}
                      className="flex items-center px-4 py-3 hover:bg-[var(--hover-bg-color)] cursor-pointer border-b border-[var(--border-color)]"
                  >
                    <img
                        loading="lazy"
                        src={user.avatar}
                        alt={user.name}
                        className="w-10 h-10 rounded-full border border-[var(--border-color)] mr-3"
                    />
                    <div className="flex-1">
                      <div className="font-bold text-sm">{user.name}</div>
                      <div className="text-xs text-gray-500">@{user.username}</div>
                    </div>
                    <button className="border border-[var(--border-color)] text-sm rounded-full px-3 py-1 font-bold">
                      Theo dõi
                    </button>
                    <button className="border border-[var(--border-color)] text-sm rounded-full px-3 py-1 font-bold">
                      Kết Bạn
                    </button>
                  </div>
              ))}
              <div className="px-4 py-2 font-bold text-sm hover:bg-[var(--hover-bg-color)] cursor-pointer">
                Hiển thị thêm
              </div>
            </div>
        )}

        {/* Footer */}
        <div className="px-3 flex flex-wrap text-sm text-gray-500">
          {(showFullFooter ? fullFooterLinks : defaultFooterLinks).map((link, index) => (
              <Link key={index} to={link.to} className="mr-3 mb-1 hover:underline">
                {link.text}
              </Link>
          ))}
          <button
              onClick={() => setShowFullFooter(!showFullFooter)}
              className="text-left mr-3 mb-1 hover:underline"
          >
            {showFullFooter ? "Ẩn bớt" : "Thêm..."}
          </button>
          <span className="w-full mt-2">© 2025 KaNox Corp.</span>
        </div>
      </div>
  );
}

export default SidebarRight;
