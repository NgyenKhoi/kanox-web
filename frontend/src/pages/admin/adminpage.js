import React, { useState, useEffect } from "react";

// Icons replaced with Unicode characters due to compilation environment constraints.
// In a local development environment, you would typically install react-icons:
// npm install react-icons
// import {
//   FaTachometerAlt, FaUsers, FaClipboardList, FaUsersCog, FaFlag, FaCog, FaSignOutAlt,
//   FaEye, FaEdit, FaTrash, FaBan, FaCheckCircle, FaUserShield, FaChartLine
// } from 'react-icons/fa';
// import { LuFileWarning } from "react-icons/lu";
// import { MdOutlinePublic } from "react-icons/md";

// Component: Sidebar
const Sidebar = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { name: "Tổng quan", icon: "📊", tab: "dashboard" }, // Replaced FaTachometerAlt
    { name: "Người dùng", icon: "👥", tab: "users" }, // Replaced FaUsers
    { name: "Bài viết", icon: "📋", tab: "posts" }, // Replaced FaClipboardList
    { name: "Cộng đồng", icon: "🏘️", tab: "communities" }, // Replaced FaUsersCog
    { name: "Báo cáo", icon: "⚠️", tab: "reports" }, // Replaced LuFileWarning
    { name: "Cài đặt", icon: "⚙️", tab: "settings" }, // Replaced FaCog
  ];

  return (
    <div className="w-64 bg-gray-800 text-white flex flex-col h-screen rounded-tr-lg rounded-br-lg shadow-lg">
      <div className="p-4 border-b border-gray-700 flex items-center">
        <span className="text-blue-400 text-3xl mr-2">🌐</span>{" "}
        {/* Replaced MdOutlinePublic */}
        <h1 className="text-2xl font-bold">KaNox Admin</h1>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.tab}
            onClick={() => setActiveTab(item.tab)}
            className={`flex items-center w-full px-4 py-2 text-lg font-medium rounded-lg transition-colors duration-200
              ${
                activeTab === item.tab
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
              }`}
          >
            <span className="mr-3 text-xl">{item.icon}</span>
            {item.name}
          </button>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={() => console.log("Đăng xuất")}
          className="flex items-center w-full px-4 py-2 text-lg font-medium rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-200"
        >
          <span className="mr-3 text-xl">🚪</span> {/* Replaced FaSignOutAlt */}
          Đăng xuất
        </button>
      </div>
    </div>
  );
};

// Component: DashboardOverview
const DashboardOverview = () => {
  // Mock data for dashboard statistics
  const stats = [
    { label: "Tổng số người dùng", value: "15,450", icon: "👥" }, // Replaced FaUsers
    { label: "Tổng số bài viết", value: "8,210", icon: "📋" }, // Replaced FaClipboardList
    { label: "Tổng số cộng đồng", value: "120", icon: "🏘️" }, // Replaced FaUsersCog
    { label: "Báo cáo mới", value: "45", icon: "⚠️" }, // Replaced LuFileWarning
  ];

  return (
    <div className="p-6 bg-white rounded-lg shadow-md mb-6">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">
        Tổng quan Dashboard
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-gray-50 p-6 rounded-lg shadow-sm flex items-center space-x-4"
          >
            <div className="text-4xl text-blue-500">{stat.icon}</div>
            <div>
              <p className="text-gray-600 text-sm">{stat.label}</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stat.value}
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-8">
        <h3 className="text-2xl font-bold mb-4 text-gray-800">
          Hoạt động gần đây
        </h3>
        <ul className="space-y-3">
          <li className="bg-gray-50 p-4 rounded-lg shadow-sm text-gray-700">
            <span className="font-semibold">Nguyễn Văn A</span> đã đăng ký tài
            khoản mới.{" "}
            <span className="text-sm text-gray-500 ml-2">10 phút trước</span>
          </li>
          <li className="bg-gray-50 p-4 rounded-lg shadow-sm text-gray-700">
            <span className="font-semibold">Bài viết ID #12345</span> đã bị báo
            cáo.{" "}
            <span className="text-sm text-gray-500 ml-2">30 phút trước</span>
          </li>
          <li className="bg-gray-50 p-4 rounded-lg shadow-sm text-gray-700">
            <span className="font-semibold">Cộng đồng "Yêu Thích ReactJS"</span>{" "}
            được tạo.{" "}
            <span className="text-sm text-gray-500 ml-2">1 giờ trước</span>
          </li>
        </ul>
      </div>
      <div className="mt-8">
        <h3 className="text-2xl font-bold mb-4 text-gray-800">
          Biểu đồ thống kê
        </h3>
        <div className="bg-gray-50 p-6 rounded-lg shadow-sm h-64 flex items-center justify-center text-gray-500">
          {/* Placeholder for a chart */}
          <span className="text-6xl text-gray-300 mr-4">📈</span>{" "}
          {/* Replaced FaChartLine */}
          <p>
            Biểu đồ hiển thị lượt đăng ký người dùng hàng tháng (placeholder)
          </p>
        </div>
      </div>
    </div>
  );
};

// Component: UsersManagement
const UsersManagement = () => {
  // Mock data for users
  const [users, setUsers] = useState([
    {
      id: "u1",
      username: "nguyenvana",
      email: "vana@example.com",
      status: "active",
      role: "user",
      joined: "2023-01-15",
    },
    {
      id: "u2",
      username: "tranb",
      email: "tranb@example.com",
      status: "banned",
      role: "user",
      joined: "2022-11-01",
    },
    {
      id: "u3",
      username: "phamc",
      email: "phamc@example.com",
      status: "active",
      role: "admin",
      joined: "2023-03-20",
    },
    {
      id: "u4",
      username: "led",
      email: "led@example.com",
      status: "active",
      role: "moderator",
      joined: "2024-02-10",
    },
    {
      id: "u5",
      username: "maie",
      email: "maie@example.com",
      status: "suspended",
      role: "user",
      joined: "2023-07-05",
    },
  ]);

  const handleView = (id) => console.log(`Xem người dùng ID: ${id}`);
  const handleEdit = (id) => console.log(`Chỉnh sửa người dùng ID: ${id}`);
  const handleDelete = (id) => {
    if (window.confirm(`Bạn có chắc muốn xóa người dùng ID: ${id}?`)) {
      setUsers(users.filter((user) => user.id !== id));
      console.log(`Đã xóa người dùng ID: ${id}`);
    }
  };
  const handleBan = (id) => {
    if (window.confirm(`Bạn có chắc muốn cấm người dùng ID: ${id}?`)) {
      setUsers(
        users.map((user) =>
          user.id === id ? { ...user, status: "banned" } : user
        )
      );
      console.log(`Đã cấm người dùng ID: ${id}`);
    }
  };
  const handleUnban = (id) => {
    if (window.confirm(`Bạn có chắc muốn bỏ cấm người dùng ID: ${id}?`)) {
      setUsers(
        users.map((user) =>
          user.id === id ? { ...user, status: "active" } : user
        )
      );
      console.log(`Đã bỏ cấm người dùng ID: ${id}`);
    }
  };
  const handleToggleAdmin = (id, currentRole) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    if (
      window.confirm(
        `Bạn có chắc muốn thay đổi vai trò của người dùng ID: ${id} thành ${newRole}?`
      )
    ) {
      setUsers(
        users.map((user) =>
          user.id === id ? { ...user, role: newRole } : user
        )
      );
      console.log(
        `Đã thay đổi vai trò của người dùng ID: ${id} thành ${newRole}`
      );
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">
        Quản lý Người dùng
      </h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-3 px-4 border-b text-left text-gray-600 font-semibold text-sm">
                ID
              </th>
              <th className="py-3 px-4 border-b text-left text-gray-600 font-semibold text-sm">
                Tên người dùng
              </th>
              <th className="py-3 px-4 border-b text-left text-gray-600 font-semibold text-sm">
                Email
              </th>
              <th className="py-3 px-4 border-b text-left text-gray-600 font-semibold text-sm">
                Trạng thái
              </th>
              <th className="py-3 px-4 border-b text-left text-gray-600 font-semibold text-sm">
                Vai trò
              </th>
              <th className="py-3 px-4 border-b text-left text-gray-600 font-semibold text-sm">
                Ngày tham gia
              </th>
              <th className="py-3 px-4 border-b text-left text-gray-600 font-semibold text-sm">
                Hành động
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50"
              >
                <td className="py-3 px-4 text-gray-800">{user.id}</td>
                <td className="py-3 px-4 text-gray-800">{user.username}</td>
                <td className="py-3 px-4 text-gray-800">{user.email}</td>
                <td className="py-3 px-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold
                    ${
                      user.status === "active"
                        ? "bg-green-100 text-green-800"
                        : user.status === "banned"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {user.status === "active"
                      ? "Hoạt động"
                      : user.status === "banned"
                      ? "Đã cấm"
                      : "Đình chỉ"}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold
                    ${
                      user.role === "admin"
                        ? "bg-blue-100 text-blue-800"
                        : user.role === "moderator"
                        ? "bg-purple-100 text-purple-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {user.role === "admin"
                      ? "Quản trị viên"
                      : user.role === "moderator"
                      ? "Kiểm duyệt viên"
                      : "Người dùng"}
                  </span>
                </td>
                <td className="py-3 px-4 text-gray-800">{user.joined}</td>
                <td className="py-3 px-4">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleView(user.id)}
                      className="p-2 rounded-full hover:bg-blue-100 text-blue-600 transition-colors duration-200"
                      title="Xem chi tiết"
                    >
                      👁️ {/* Replaced FaEye */}
                    </button>
                    <button
                      onClick={() => handleEdit(user.id)}
                      className="p-2 rounded-full hover:bg-yellow-100 text-yellow-600 transition-colors duration-200"
                      title="Chỉnh sửa"
                    >
                      ✏️ {/* Replaced FaEdit */}
                    </button>
                    {user.status !== "banned" ? (
                      <button
                        onClick={() => handleBan(user.id)}
                        className="p-2 rounded-full hover:bg-red-100 text-red-600 transition-colors duration-200"
                        title="Cấm người dùng"
                      >
                        🚫 {/* Replaced FaBan */}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUnban(user.id)}
                        className="p-2 rounded-full hover:bg-green-100 text-green-600 transition-colors duration-200"
                        title="Bỏ cấm người dùng"
                      >
                        ✅ {/* Replaced FaCheckCircle */}
                      </button>
                    )}
                    <button
                      onClick={() => handleToggleAdmin(user.id, user.role)}
                      className="p-2 rounded-full hover:bg-purple-100 text-purple-600 transition-colors duration-200"
                      title={
                        user.role === "admin"
                          ? "Hạ cấp thành Người dùng"
                          : "Nâng cấp thành Quản trị viên"
                      }
                    >
                      🛡️ {/* Replaced FaUserShield */}
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors duration-200"
                      title="Xóa người dùng"
                    >
                      🗑️ {/* Replaced FaTrash */}
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

// Component: PostsManagement
const PostsManagement = () => {
  // Mock data for posts
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
                      👁️ {/* Replaced FaEye */}
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
                      {/* Replaced FaCheckCircle / FaBan */}
                    </button>
                    {post.reports > 0 && (
                      <button
                        onClick={() => handleMarkAsReviewed(post.id)}
                        className="p-2 rounded-full hover:bg-green-100 text-green-600 transition-colors duration-200"
                        title="Đánh dấu đã xem xét"
                      >
                        ✅ {/* Replaced FaCheckCircle */}
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="p-2 rounded-full hover:bg-red-100 text-red-600 transition-colors duration-200"
                      title="Xóa bài viết"
                    >
                      🗑️ {/* Replaced FaTrash */}
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

// Component: CommunitiesManagement
const CommunitiesManagement = () => {
  // Mock data for communities
  const [communities, setCommunities] = useState([
    {
      id: "c1",
      name: "Yêu Thích ReactJS",
      members: 1200,
      status: "active",
      type: "public",
      created: "2023-02-01",
    },
    {
      id: "c2",
      name: "Game Thủ Việt",
      members: 5000,
      status: "active",
      type: "public",
      created: "2022-08-10",
    },
    {
      id: "c3",
      name: "Marketing Pro",
      members: 300,
      status: "private",
      created: "2023-11-15",
    },
    {
      id: "c4",
      name: "Fans K-Pop Việt",
      members: 1500,
      status: "active",
      type: "public",
      created: "2024-01-05",
    },
    {
      id: "c5",
      name: "Developer Freelancer",
      members: 180,
      status: "active",
      type: "private",
      created: "2023-04-20",
    },
  ]);

  const handleView = (id) => console.log(`Xem cộng đồng ID: ${id}`);
  const handleManageMembers = (id) =>
    console.log(`Quản lý thành viên cộng đồng ID: ${id}`);
  const handleDelete = (id) => {
    if (window.confirm(`Bạn có chắc muốn xóa cộng đồng ID: ${id}?`)) {
      setCommunities(communities.filter((comm) => comm.id !== id));
      console.log(`Đã xóa cộng đồng ID: ${id}`);
    }
  };
  const handleToggleStatus = (id, currentStatus) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    if (
      window.confirm(
        `Bạn có chắc muốn chuyển trạng thái cộng đồng ID: ${id} thành ${
          newStatus === "active" ? "hoạt động" : "không hoạt động"
        }?`
      )
    ) {
      setCommunities(
        communities.map((comm) =>
          comm.id === id ? { ...comm, status: newStatus } : comm
        )
      );
      console.log(
        `Đã thay đổi trạng thái cộng đồng ID: ${id} thành ${newStatus}`
      );
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">
        Quản lý Cộng đồng
      </h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-3 px-4 border-b text-left text-gray-600 font-semibold text-sm">
                ID
              </th>
              <th className="py-3 px-4 border-b text-left text-gray-600 font-semibold text-sm">
                Tên cộng đồng
              </th>
              <th className="py-3 px-4 border-b text-left text-gray-600 font-semibold text-sm">
                Thành viên
              </th>
              <th className="py-3 px-4 border-b text-left text-gray-600 font-semibold text-sm">
                Trạng thái
              </th>
              <th className="py-3 px-4 border-b text-left text-gray-600 font-semibold text-sm">
                Loại
              </th>
              <th className="py-3 px-4 border-b text-left text-gray-600 font-semibold text-sm">
                Ngày tạo
              </th>
              <th className="py-3 px-4 border-b text-left text-gray-600 font-semibold text-sm">
                Hành động
              </th>
            </tr>
          </thead>
          <tbody>
            {communities.map((community) => (
              <tr
                key={community.id}
                className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50"
              >
                <td className="py-3 px-4 text-gray-800">{community.id}</td>
                <td className="py-3 px-4 text-gray-800">{community.name}</td>
                <td className="py-3 px-4 text-gray-800">{community.members}</td>
                <td className="py-3 px-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold
                    ${
                      community.status === "active"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {community.status === "active"
                      ? "Hoạt động"
                      : "Không hoạt động"}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold
                    ${
                      community.type === "public"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-purple-100 text-purple-800"
                    }`}
                  >
                    {community.type === "public" ? "Công khai" : "Riêng tư"}
                  </span>
                </td>
                <td className="py-3 px-4 text-gray-800">{community.created}</td>
                <td className="py-3 px-4">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleView(community.id)}
                      className="p-2 rounded-full hover:bg-blue-100 text-blue-600 transition-colors duration-200"
                      title="Xem chi tiết"
                    >
                      👁️ {/* Replaced FaEye */}
                    </button>
                    <button
                      onClick={() => handleManageMembers(community.id)}
                      className="p-2 rounded-full hover:bg-yellow-100 text-yellow-600 transition-colors duration-200"
                      title="Quản lý thành viên"
                    >
                      👥 {/* Replaced FaUsers */}
                    </button>
                    <button
                      onClick={() =>
                        handleToggleStatus(community.id, community.status)
                      }
                      className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors duration-200"
                      title={
                        community.status === "active"
                          ? "Tạm ngừng cộng đồng"
                          : "Kích hoạt lại cộng đồng"
                      }
                    >
                      {community.status === "active" ? "🚫" : "✅"}{" "}
                      {/* Replaced FaBan / FaCheckCircle */}
                    </button>
                    <button
                      onClick={() => handleDelete(community.id)}
                      className="p-2 rounded-full hover:bg-red-100 text-red-600 transition-colors duration-200"
                      title="Xóa cộng đồng"
                    >
                      🗑️ {/* Replaced FaTrash */}
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

// Component: ReportsManagement
const ReportsManagement = () => {
  // Mock data for reports
  const [reports, setReports] = useState([
    {
      id: "r1",
      type: "Bài viết",
      targetId: "p3",
      reporter: "user123",
      reason: "Nội dung spam",
      status: "pending",
      date: "2024-05-13",
    },
    {
      id: "r2",
      type: "Người dùng",
      targetId: "u2",
      reporter: "user456",
      reason: "Quấy rối",
      status: "pending",
      date: "2024-05-14",
    },
    {
      id: "r3",
      type: "Cộng đồng",
      targetId: "c1",
      reporter: "user789",
      reason: "Vi phạm quy tắc",
      status: "resolved",
      date: "2024-05-10",
    },
    {
      id: "r4",
      type: "Bài viết",
      targetId: "p1",
      reporter: "userabc",
      reason: "Hình ảnh không phù hợp",
      status: "pending",
      date: "2024-05-15",
    },
  ]);

  const handleViewTarget = (type, id) =>
    console.log(`Xem chi tiết ${type} ID: ${id}`);
  const handleResolveReport = (id) => {
    if (window.confirm(`Đánh dấu báo cáo ID: ${id} là đã giải quyết?`)) {
      setReports(
        reports.map((report) =>
          report.id === id ? { ...report, status: "resolved" } : report
        )
      );
      console.log(`Đã giải quyết báo cáo ID: ${id}`);
    }
  };
  const handleDismissReport = (id) => {
    if (window.confirm(`Bạn có chắc muốn bỏ qua báo cáo ID: ${id}?`)) {
      setReports(reports.filter((report) => report.id !== id)); // Remove from list
      console.log(`Đã bỏ qua báo cáo ID: ${id}`);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">Quản lý Báo cáo</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-3 px-4 border-b text-left text-gray-600 font-semibold text-sm">
                ID
              </th>
              <th className="py-3 px-4 border-b text-left text-gray-600 font-semibold text-sm">
                Loại
              </th>
              <th className="py-3 px-4 border-b text-left text-gray-600 font-semibold text-sm">
                ID Mục tiêu
              </th>
              <th className="py-3 px-4 border-b text-left text-gray-600 font-semibold text-sm">
                Người báo cáo
              </th>
              <th className="py-3 px-4 border-b text-left text-gray-600 font-semibold text-sm">
                Lý do
              </th>
              <th className="py-3 px-4 border-b text-left text-gray-600 font-semibold text-sm">
                Trạng thái
              </th>
              <th className="py-3 px-4 border-b text-left text-gray-600 font-semibold text-sm">
                Ngày báo cáo
              </th>
              <th className="py-3 px-4 border-b text-left text-gray-600 font-semibold text-sm">
                Hành động
              </th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <tr
                key={report.id}
                className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50"
              >
                <td className="py-3 px-4 text-gray-800">{report.id}</td>
                <td className="py-3 px-4 text-gray-800">{report.type}</td>
                <td className="py-3 px-4 text-gray-800">{report.targetId}</td>
                <td className="py-3 px-4 text-gray-800">{report.reporter}</td>
                <td className="py-3 px-4 text-gray-800">{report.reason}</td>
                <td className="py-3 px-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold
                    ${
                      report.status === "pending"
                        ? "bg-orange-100 text-orange-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {report.status === "pending" ? "Đang chờ" : "Đã giải quyết"}
                  </span>
                </td>
                <td className="py-3 px-4 text-gray-800">{report.date}</td>
                <td className="py-3 px-4">
                  <div className="flex space-x-2">
                    <button
                      onClick={() =>
                        handleViewTarget(report.type, report.targetId)
                      }
                      className="p-2 rounded-full hover:bg-blue-100 text-blue-600 transition-colors duration-200"
                      title="Xem mục tiêu"
                    >
                      👁️ {/* Replaced FaEye */}
                    </button>
                    {report.status === "pending" && (
                      <>
                        <button
                          onClick={() => handleResolveReport(report.id)}
                          className="p-2 rounded-full hover:bg-green-100 text-green-600 transition-colors duration-200"
                          title="Giải quyết báo cáo"
                        >
                          ✅ {/* Replaced FaCheckCircle */}
                        </button>
                        <button
                          onClick={() => handleDismissReport(report.id)}
                          className="p-2 rounded-full hover:bg-red-100 text-red-600 transition-colors duration-200"
                          title="Bỏ qua báo cáo"
                        >
                          🗑️ {/* Replaced FaTrash */}
                        </button>
                      </>
                    )}
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

// Component: Settings (Placeholder)
const Settings = () => {
  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">Cài đặt Admin</h2>
      <p className="text-gray-700">
        Các tùy chọn cài đặt hệ thống, vai trò, quyền hạn sẽ được quản lý tại
        đây.
      </p>
      <div className="mt-4 p-4 bg-gray-50 rounded-lg shadow-sm">
        <h3 className="text-xl font-semibold mb-2 text-gray-800">
          Quản lý vai trò & quyền hạn
        </h3>
        <p className="text-gray-600">
          Thêm, chỉnh sửa, hoặc xóa các vai trò người dùng (ví dụ: quản trị
          viên, kiểm duyệt viên) và các quyền liên quan của họ.
        </p>
        <button className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200">
          Đi tới trang quản lý vai trò
        </button>
      </div>
      <div className="mt-4 p-4 bg-gray-50 rounded-lg shadow-sm">
        <h3 className="text-xl font-semibold mb-2 text-gray-800">
          Cài đặt thông báo
        </h3>
        <p className="text-gray-600">
          Cấu hình các loại thông báo admin và kênh nhận thông báo.
        </p>
        <button className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200">
          Cấu hình thông báo
        </button>
      </div>
    </div>
  );
};

// Main Admin Dashboard App Component
const AdminDashboardApp = () => {
  const [activeTab, setActiveTab] = useState("dashboard"); // Default active tab

  // Function to render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardOverview />;
      case "users":
        return <UsersManagement />;
      case "posts":
        return <PostsManagement />;
      case "communities":
        return <CommunitiesManagement />;
      case "reports":
        return <ReportsManagement />;
      case "settings":
        return <Settings />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    // Load Tailwind CSS for styling
    <div className="min-h-screen bg-gray-100 flex font-inter antialiased">
      <script src="https://cdn.tailwindcss.com"></script>
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <style>{`
        body {
          font-family: 'Inter', sans-serif;
        }
        /* Custom scrollbar for better aesthetics */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #e0e0e0;
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
        /* Firefox scrollbar */
        * {
          scrollbar-width: thin;
          scrollbar-color: #888 #e0e0e0;
        }
      `}</style>
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-1 p-6 overflow-auto">
        {/* Main content header */}
        <header className="mb-6">
          <h1 className="text-4xl font-extrabold text-gray-900 leading-tight">
            Chào mừng, Admin!
          </h1>
          <p className="text-gray-600 mt-2">
            Quản lý hệ thống mạng xã hội KaNox.
          </p>
        </header>

        {renderContent()}
      </div>
    </div>
  );
};

export default AdminDashboardApp;
