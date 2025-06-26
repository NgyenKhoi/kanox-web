import React, { useState, useEffect } from "react";

const UsersManagement = () => {
  // Dữ liệu giả cho người dùng
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
                      👁️ {/* Biểu tượng Xem */}
                    </button>
                    <button
                      onClick={() => handleEdit(user.id)}
                      className="p-2 rounded-full hover:bg-yellow-100 text-yellow-600 transition-colors duration-200"
                      title="Chỉnh sửa"
                    >
                      ✏️ {/* Biểu tượng Chỉnh sửa */}
                    </button>
                    {user.status !== "banned" ? (
                      <button
                        onClick={() => handleBan(user.id)}
                        className="p-2 rounded-full hover:bg-red-100 text-red-600 transition-colors duration-200"
                        title="Cấm người dùng"
                      >
                        🚫 {/* Biểu tượng Cấm */}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUnban(user.id)}
                        className="p-2 rounded-full hover:bg-green-100 text-green-600 transition-colors duration-200"
                        title="Bỏ cấm người dùng"
                      >
                        ✅ {/* Biểu tượng Bỏ cấm */}
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
                      🛡️ {/* Biểu tượng Vai trò */}
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors duration-200"
                      title="Xóa người dùng"
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

export default UsersManagement;
