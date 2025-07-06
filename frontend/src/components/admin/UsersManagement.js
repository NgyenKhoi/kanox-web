import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { adminService } from "../../services/adminService";

const UsersManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // Lấy danh sách người dùng từ API
  const fetchUsers = async (page = 0, search = "") => {
    try {
      setLoading(true);
      const result = await adminService.getUsers(page, 10, search);
      const userData = result.data;
      setUsers(userData.content || []);
      setTotalPages(userData.totalPages || 0);
      setCurrentPage(userData.number || 0);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error(error.message || "Lỗi khi tải danh sách người dùng");
    } finally {
      setLoading(false);
    }
  };

  // Xem chi tiết người dùng
  const handleView = async (id) => {
    try {
      const result = await adminService.getUserById(id);
      setSelectedUser(result.data);
      setShowUserModal(true);
    } catch (error) {
      console.error('Error fetching user details:', error);
      toast.error(error.message || "Lỗi khi tải thông tin người dùng");
    }
  };

  // Chỉnh sửa người dùng
  const handleEdit = async (id) => {
    try {
      const result = await adminService.getUserById(id);
      setEditingUser(result.data);
      setShowEditModal(true);
    } catch (error) {
      console.error('Error fetching user for edit:', error);
      toast.error(error.message || "Lỗi khi tải thông tin người dùng");
    }
  };

  // Lưu thay đổi người dùng
  const handleSaveEdit = async (updatedUserData) => {
    try {
      await adminService.updateUser(editingUser.id, updatedUserData);
      toast.success("Đã cập nhật thông tin người dùng thành công");
      setShowEditModal(false);
      setEditingUser(null);
      fetchUsers(currentPage, searchTerm);
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error(error.message || "Lỗi khi cập nhật thông tin người dùng");
    }
  };

  // Xóa người dùng (placeholder - thường không cho phép xóa hoàn toàn)
  const handleDelete = (id) => {
    toast.warning("Chức năng xóa người dùng không được khuyến khích. Hãy sử dụng chức năng khóa tài khoản thay thế.");
  };

  // Khóa/mở khóa người dùng
  const handleBan = async (id) => {
    if (window.confirm(`Bạn có chắc muốn khóa người dùng ID: ${id}?`)) {
      try {
        await adminService.updateUserStatus(id, false);
        toast.success("Đã khóa tài khoản người dùng");
        fetchUsers(currentPage, searchTerm);
      } catch (error) {
        console.error('Error banning user:', error);
        toast.error(error.message || "Lỗi khi khóa tài khoản người dùng");
      }
    }
  };

  const handleUnban = async (id) => {
    if (window.confirm(`Bạn có chắc muốn mở khóa người dùng ID: ${id}?`)) {
      try {
        await adminService.updateUserStatus(id, true);
        toast.success("Đã mở khóa tài khoản người dùng");
        fetchUsers(currentPage, searchTerm);
      } catch (error) {
        console.error('Error unbanning user:', error);
        toast.error(error.message || "Lỗi khi mở khóa tài khoản người dùng");
      }
    }
  };

  // Phân quyền admin
  const handleToggleAdmin = async (id, isCurrentlyAdmin) => {
    const action = isCurrentlyAdmin ? "hủy quyền admin" : "cấp quyền admin";
    
    if (window.confirm(`Bạn có chắc muốn ${action} cho người dùng ID: ${id}?`)) {
      try {
        if (isCurrentlyAdmin) {
          await adminService.revokeAdminRole(id);
        } else {
          await adminService.grantAdminRole(id);
        }
        toast.success(`Đã ${action} thành công`);
        fetchUsers(currentPage, searchTerm);
      } catch (error) {
        console.error('Error toggling admin role:', error);
        toast.error(error.message || `Lỗi khi ${action}`);
      }
    }
  };

  // Tìm kiếm người dùng
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(0);
    fetchUsers(0, searchTerm);
  };

  // Load dữ liệu khi component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">
        Quản lý Người dùng
      </h2>
      
      {/* Thanh tìm kiếm */}
      <div className="mb-6">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Tìm kiếm theo tên người dùng hoặc email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            🔍 Tìm kiếm
          </button>
          <button
            type="button"
            onClick={() => {
              setSearchTerm("");
              setCurrentPage(0);
              fetchUsers(0, "");
            }}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
          >
            🔄 Làm mới
          </button>
        </form>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Đang tải...</span>
        </div>
      ) : (
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
                Ngày sinh
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
                <td className="py-3 px-4 text-gray-800">{user.username || 'N/A'}</td>
                <td className="py-3 px-4 text-gray-800">{user.email}</td>
                <td className="py-3 px-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold
                    ${
                      user.status
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {user.status ? "Hoạt động" : "Đã khóa"}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold
                    ${
                      user.isAdmin
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {user.isAdmin ? "Quản trị viên" : "Người dùng"}
                  </span>
                </td>
                <td className="py-3 px-4 text-gray-800">
                  {user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString('vi-VN') : 'N/A'}
                </td>
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
                    {user.status ? (
                      <button
                        onClick={() => handleBan(user.id)}
                        className="p-2 rounded-full hover:bg-red-100 text-red-600 transition-colors duration-200"
                        title="Khóa tài khoản"
                      >
                        🚫 {/* Biểu tượng Khóa */}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUnban(user.id)}
                        className="p-2 rounded-full hover:bg-green-100 text-green-600 transition-colors duration-200"
                        title="Mở khóa tài khoản"
                      >
                        ✅ {/* Biểu tượng Mở khóa */}
                      </button>
                    )}
                    <button
                      onClick={() => handleToggleAdmin(user.id, user.isAdmin)}
                      className="p-2 rounded-full hover:bg-purple-100 text-purple-600 transition-colors duration-200"
                      title={
                        user.isAdmin
                          ? "Hủy quyền Admin"
                          : "Cấp quyền Admin"
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
        
        {/* Phân trang */}
        {totalPages > 1 && (
          <div className="mt-6 flex justify-center items-center space-x-2">
            <button
              onClick={() => {
                if (currentPage > 0) {
                  fetchUsers(currentPage - 1, searchTerm);
                }
              }}
              disabled={currentPage === 0}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Trước
            </button>
            
            <span className="px-4 py-2 text-gray-700">
              Trang {currentPage + 1} / {totalPages}
            </span>
            
            <button
              onClick={() => {
                if (currentPage < totalPages - 1) {
                  fetchUsers(currentPage + 1, searchTerm);
                }
              }}
              disabled={currentPage >= totalPages - 1}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sau →
            </button>
          </div>
        )}
      </div>
      )}
      
      {/* Modal xem chi tiết người dùng */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold text-gray-800">Chi tiết người dùng</h3>
              <button
                onClick={() => {
                  setShowUserModal(false);
                  setSelectedUser(null);
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID</label>
                <p className="text-gray-900">{selectedUser.id}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên người dùng</label>
                <p className="text-gray-900">{selectedUser.username || 'N/A'}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <p className="text-gray-900">{selectedUser.email}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên hiển thị</label>
                <p className="text-gray-900">{selectedUser.displayName || 'N/A'}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  selectedUser.status ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                }`}>
                  {selectedUser.status ? "Hoạt động" : "Đã khóa"}
                </span>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vai trò</label>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  selectedUser.isAdmin ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"
                }`}>
                  {selectedUser.isAdmin ? "Quản trị viên" : "Người dùng"}
                </span>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ngày sinh</label>
                <p className="text-gray-900">
                  {selectedUser.dateOfBirth ? new Date(selectedUser.dateOfBirth).toLocaleDateString('vi-VN') : 'N/A'}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                <p className="text-gray-900">
                  {selectedUser.phoneNumber || 'N/A'}
                </p>
              </div>
              
              {selectedUser.bio && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tiểu sử</label>
                  <p className="text-gray-900">{selectedUser.bio}</p>
                </div>
              )}
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  setShowUserModal(false);
                  setSelectedUser(null);
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal chỉnh sửa người dùng */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold text-gray-800">Chỉnh sửa người dùng</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingUser(null);
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            
            <EditUserForm
              user={editingUser}
              onSave={handleSaveEdit}
              onCancel={() => {
                setShowEditModal(false);
                setEditingUser(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Component form chỉnh sửa người dùng
const EditUserForm = ({ user, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    displayName: user.displayName || '',
    bio: user.bio || '',
    phoneNumber: user.phoneNumber || '',
    dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split('T')[0] : '',
    gender: user.gender || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tên hiển thị
          </label>
          <input
            type="text"
            name="displayName"
            value={formData.displayName}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Nhập tên hiển thị"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Số điện thoại
          </label>
          <input
            type="tel"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Nhập số điện thoại"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ngày sinh
          </label>
          <input
            type="date"
            name="dateOfBirth"
            value={formData.dateOfBirth}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Giới tính
          </label>
          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Chọn giới tính</option>
            <option value="MALE">Nam</option>
            <option value="FEMALE">Nữ</option>
            <option value="OTHER">Khác</option>
          </select>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tiểu sử
        </label>
        <textarea
          name="bio"
          value={formData.bio}
          onChange={handleChange}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Nhập tiểu sử"
        />
      </div>
      
      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
        >
          Hủy
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
          Lưu thay đổi
        </button>
      </div>
    </form>
  );
};

export default UsersManagement;
