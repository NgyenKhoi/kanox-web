import React from "react";
import { Link } from "react-router-dom";

function Footer({ isWhiteBackground = false }) {
  return (
      <div className={`mt-auto py-3 px-4 border-t text-sm ${isWhiteBackground ? "bg-white text-gray-800" : "bg-[var(--background-color)] text-gray-400 dark:text-gray-400"}`}>
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
          {[
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
          ].map((item) => (
              <Link key={item.to} to={item.to} className="hover:underline">
                {item.text}
              </Link>
          ))}
          <span className="ml-4">&copy; 2025 KaNox</span>
        </div>
      </div>
  );
}

export default Footer;
