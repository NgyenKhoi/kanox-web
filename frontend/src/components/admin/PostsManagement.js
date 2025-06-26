import React, { useState, useEffect } from "react";

const PostsManagement = () => {
  // Dữ liệu giả cho bài viết
  const [posts, setPosts] = useState([
    {
      id: "p1",
      author: "nguyenvana",
      content: "Bài viết đầu tiên về React Hooks!",
      status: "active",
      reports: 0,
      date: "2024-05-10",
    },
    {
      id: "p2",
      author: "tranb",
      content: "Thảo luận về Next.js performance.",
      status: "active",
      reports: 1,
      date: "2024-05-12",
    },
    {
      id: "p3",
      author: "spamuser",
      content: "Mua hàng giá rẻ tại website XXXXXX!",
      status: "reported",
      reports: 5,
      date: "2024-05-13",
    },
    {
      id: "p4",
      author: "phamc",
      content: "Giao diện admin mới của KaNox trông thế nào?",
      status: "active",
      reports: 0,
      date: "2024-05-14",
    },
    {
      id: "p5",
      author: "ann",
      content: "Tìm kiếm thành viên cho cộng đồng AI.",
      status: "hidden",
      reports: 0,
      date: "2024-05-15",
    },
  ]);

  const handleView = (id) => console.log(`Xem bài viết ID: ${id}`);
  const handleDelete = (id) => {
    if (window.confirm(`Bạn có chắc muốn xóa bài viết ID: ${id}?`)) {
      setPosts(posts.filter((post) => post.id !== id));
      console.log(`Đã xóa bài viết ID: ${id}`);
    }
  };
  const handleToggleVisibility = (id, currentStatus) => {
    const newStatus = currentStatus === "hidden" ? "active" : "hidden";
    if (
      window.confirm(
        `Bạn có chắc muốn ${
          newStatus === "active" ? "hiển thị" : "ẩn"
        } bài viết ID: ${id}?`
      )
    ) {
      setPosts(
        posts.map((post) =>
          post.id === id ? { ...post, status: newStatus } : post
        )
      );
      console.log(
        `Đã ${newStatus === "active" ? "hiển thị" : "ẩn"} bài viết ID: ${id}`
      );
    }
  };
  const handleMarkAsReviewed = (id) => {
    if (window.confirm(`Đánh dấu báo cáo bài viết ID: ${id} là đã xem xét?`)) {
      setPosts(
        posts.map((post) =>
          post.id === id ? { ...post, reports: 0, status: "active" } : post
        )
      );
      console.log(`Đã đánh dấu báo cáo bài viết ID: ${id} là đã xem xét`);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">
        Quản lý Bài viết
      </h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-3 px-4 border-b text-left text-gray-600 font-semibold text-sm">
                ID
              </th>
              <th className="py-3 px-4 border-b text-left text-gray-600 font-semibold text-sm">
                Tác giả
              </th>
              <th className="py-3 px-4 border-b text-left text-gray-600 font-semibold text-sm">
                Nội dung
              </th>
              <th className="py-3 px-4 border-b text-left text-gray-600 font-semibold text-sm">
                Trạng thái
              </th>
              <th className="py-3 px-4 border-b text-left text-gray-600 font-semibold text-sm">
                Báo cáo
              </th>
              <th className="py-3 px-4 border-b text-left text-gray-600 font-semibold text-sm">
                Ngày đăng
              </th>
              <th className="py-3 px-4 border-b text-left text-gray-600 font-semibold text-sm">
                Hành động
              </th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr
                key={post.id}
                className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50"
              >
                <td className="py-3 px-4 text-gray-800">{post.id}</td>
                <td className="py-3 px-4 text-gray-800">{post.author}</td>
                <td className="py-3 px-4 text-gray-800 truncate max-w-xs">
                  {post.content}
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold
                    ${
                      post.status === "active"
                        ? "bg-green-100 text-green-800"
                        : post.status === "reported"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {post.status === "active"
                      ? "Hoạt động"
                      : post.status === "reported"
                      ? "Bị báo cáo"
                      : "Đã ẩn"}
                  </span>
                </td>
                <td className="py-3 px-4 text-gray-800">{post.reports}</td>
                <td className="py-3 px-4 text-gray-800">{post.date}</td>
                <td className="py-3 px-4">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleView(post.id)}
                      className="p-2 rounded-full hover:bg-blue-100 text-blue-600 transition-colors duration-200"
                      title="Xem chi tiết"
                    >
                      👁️ {/* Biểu tượng Xem */}
                    </button>
                    <button
                      onClick={() =>
                        handleToggleVisibility(post.id, post.status)
                      }
                      className="p-2 rounded-full hover:bg-yellow-100 text-yellow-600 transition-colors duration-200"
                      title={
                        post.status === "hidden"
                          ? "Hiển thị bài viết"
                          : "Ẩn bài viết"
                      }
                    >
                      {post.status === "hidden" ? "✅" : "🚫"}{" "}
                      {/* Biểu tượng Hiển thị/Ẩn */}
                    </button>
                    {post.reports > 0 && (
                      <button
                        onClick={() => handleMarkAsReviewed(post.id)}
                        className="p-2 rounded-full hover:bg-green-100 text-green-600 transition-colors duration-200"
                        title="Đánh dấu đã xem xét"
                      >
                        ✅ {/* Biểu tượng Đã xem xét */}
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="p-2 rounded-full hover:bg-red-100 text-red-600 transition-colors duration-200"
                      title="Xóa bài viết"
                    >
                      🗑️ {/* Biểu tượng Xóa */}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PostsManagement;
