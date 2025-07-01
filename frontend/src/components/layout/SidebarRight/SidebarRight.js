import React, { useState } from "react";
import { FaSearch, FaEllipsisH } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";

function SidebarRight() {
  const [showFullFooter, setShowFullFooter] = useState(false);
  const navigate = useNavigate();

  const trends = [
    {
      id: 1,
      name: "Doanh nghiệp & Tài chính - nổi bật",
      title: "Investing",
      tweets: "143 N bài đăng",
    },
    {
      id: 2,
      name: "Chủ đề nổi trội ở Việt Nam",
      title: "Quời",
      tweets: "436 N bài đăng",
    },
    {
      id: 3,
      name: "Chủ đề nổi trội ở Việt Nam",
      title: "#riyadh",
      tweets: "989 N bài đăng",
    },
    { id: 4, name: "Count", title: "Count", tweets: "82.2 N bài đăng" },
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

  const handleSubscribePremiumClick = () => {
    navigate("/premium");
  };

  return (
      <aside className="hidden lg:block sticky top-0 h-screen overflow-y-auto px-4 pt-4 text-[var(--text-color)] bg-[var(--background-color)]">
        {/* Search Box */}
        <div className="sticky top-0 bg-[var(--background-color)] z-10">
          <div className="relative mb-4">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
                type="text"
                placeholder="Tìm kiếm"
                className="w-full pl-10 pr-4 py-3 rounded-full bg-white dark:bg-gray-800 text-black dark:text-white shadow border border-gray-300 dark:border-gray-600"
            />
          </div>
        </div>

        {/* Gói Premium */}
        <div className="bg-[var(--background-color)] rounded-xl p-4 shadow mb-4 border border-[var(--border-color)]">
          <h2 className="text-lg font-bold mb-2">Đăng ký gói Premium</h2>
          <p className="text-[var(--text-color-muted)] mb-3">
            Đăng ký để mở khóa các tính năng mới...
          </p>
          <button
              className="px-4 py-2 bg-black text-white rounded-full font-semibold"
              onClick={() => navigate("/premium")}
          >
            Đăng ký
          </button>
        </div>

        {/* Các phần khác: trends, suggestedUsers, footer... tương tự */}
      </aside>
  );
}

export default SidebarRight;