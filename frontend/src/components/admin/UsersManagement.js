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
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    displayName: '',
    email: '',
    bio: ''
  });

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
      const user = result.data;
      setEditingUser(user);
      // Xử lý ngày sinh an toàn
      let formattedDate = '';
      if (user.dateOfBirth) {
        try {
          // Nếu là string ISO, lấy phần ngày
          if (typeof user.dateOfBirth === 'string' && user.dateOfBirth.includes('T')) {
            formattedDate = user.dateOfBirth.split('T')[0];
          }
          // Nếu là string ngày đơn giản (YYYY-MM-DD)
          else if (typeof user.dateOfBirth === 'string' && user.dateOfBirth.match(/^\d{4}-\d{2}-\d{2}$/)) {
            formattedDate = user.dateOfBirth;
          }
          // Nếu là Date object hoặc timestamp
          else {
            const date = new Date(user.dateOfBirth);
            if (!isNaN(date.getTime())) {
              formattedDate = date.toISOString().split('T')[0];
            }
          }
        } catch (error) {
          console.warn('Error parsing date:', user.dateOfBirth, error);
          formattedDate = '';
        }
      }
      
      setEditForm({
        displayName: user.displayName || '',
        email: user.email || '',
        dateOfBirth: formattedDate,
        bio: user.bio || ''
      });
      setShowEditModal(true);
    } catch (error) {
      toast.error("Lỗi khi tải thông tin người dùng");
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!editForm.email || !editForm.email.trim()) {
      toast.error("Email không được để trống");
      return;
    }
    
    try {
      console.log('Updating user ID:', editingUser.id);
      console.log('Updating user with data:', editForm);
      
      const result = await adminService.updateUser(editingUser.id, editForm);
      console.log('Update result:', result);
      
      toast.success("Cập nhật thành công");
      setShowEditModal(false);
      fetchUsers(currentPage, searchTerm);
    } catch (error) {
      console.error('Error updating user:', error);
      console.error('Error details:', {
        status: error.status,
        message: error.message,
        response: error.response
      });
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          "Lỗi khi cập nhật người dùng";
      toast.error(errorMessage);
    }
  };

  // Xóa người dùng (placeholder - thường không cho phép xóa hoàn toàn)
  const handleDelete = (id) => {
    toast.warning("Chức năng xóa người dùng không được khuyến khích. Hãy sử dụng chức năng khóa tài khoản thay thế.");
  };

  // Khóa tài khoản người dùng
  const handleBan = (id) => {
    const user = users.find(u => u.id === id);
    setConfirmAction({
      type: 'ban',
      userId: id,
      userName: user?.username || user?.email || `ID: ${id}`,
      message: `Bạn có chắc muốn khóa tài khoản "${user?.username || user?.email || `ID: ${id}`}"?`,
      action: async () => {
        try {
          console.log('=== BANNING USER DEBUG ===');
          console.log('User ID:', id);
          
          // Kiểm tra token trước khi gọi API
          const token = localStorage.getItem('token') || sessionStorage.getItem('token');
          if (!token) {
            toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
            return;
          }
          
          // Gọi API khóa tài khoản
          await adminService.updateUserStatus(id, false);
          
          // Thông báo thành công
          toast.success("Đã khóa tài khoản người dùng thành công!");
          
          // Tải lại danh sách người dùng
          await fetchUsers(currentPage, searchTerm);
          
        } catch (error) {
          console.error('=== BAN ERROR DEBUG ===');
          console.error('Error:', error);
          
          // Xử lý lỗi và hiển thị thông báo phù hợp
          let errorMessage = "Có lỗi xảy ra khi khóa tài khoản";
          
          if (error.message && error.message.includes('token')) {
            errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
          } else if (error.message && error.message.includes('kết nối')) {
            errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.';
          } else if (error.response) {
            switch (error.response.status) {
              case 401:
                errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
                break;
              case 403:
                errorMessage = 'Bạn không có quyền thực hiện hành động này.';
                break;
              case 404:
                errorMessage = 'Không tìm thấy người dùng này.';
                break;
              case 500:
                errorMessage = 'Lỗi server. Vui lòng thử lại sau.';
                break;
              default:
                errorMessage = error.response.data?.message || error.response.data?.error || 'Có lỗi xảy ra khi khóa tài khoản';
            }
          } else if (error.message) {
            errorMessage = error.message;
          }
          
          toast.error(errorMessage);
        }
      }
    });
    setShowConfirmModal(true);
  };

  const handleUnban = (id) => {
    const user = users.find(u => u.id === id);
    setConfirmAction({
      type: 'unban',
      userId: id,
      userName: user?.username || user?.email || `ID: ${id}`,
      message: `Bạn có chắc muốn mở khóa tài khoản "${user?.username || user?.email || `ID: ${id}`}"?`,
      action: async () => {
        try {
          console.log('=== UNBANNING USER DEBUG ===');
          console.log('User ID:', id);
          
          // Kiểm tra token trước khi gọi API
          const token = localStorage.getItem('token') || sessionStorage.getItem('token');
          if (!token) {
            toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
            return;
          }
          
          // Gọi API mở khóa tài khoản
          await adminService.updateUserStatus(id, true);
          
          // Thông báo thành công
          toast.success("Đã mở khóa tài khoản người dùng thành công!");
          
          // Tải lại danh sách người dùng
          await fetchUsers(currentPage, searchTerm);
          
        } catch (error) {
          console.error('=== UNBAN ERROR DEBUG ===');
          console.error('Error:', error);
          
          // Xử lý lỗi và hiển thị thông báo phù hợp
          let errorMessage = "Có lỗi xảy ra khi mở khóa tài khoản";
          
          if (error.message && error.message.includes('token')) {
            errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
          } else if (error.message && error.message.includes('kết nối')) {
            errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.';
          } else if (error.response) {
            switch (error.response.status) {
              case 401:
                errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
                break;
              case 403:
                errorMessage = 'Bạn không có quyền thực hiện hành động này.';
                break;
              case 404:
                errorMessage = 'Không tìm thấy người dùng này.';
                break;
              case 500:
                errorMessage = 'Lỗi server. Vui lòng thử lại sau.';
                break;
              default:
                errorMessage = error.response.data?.message || error.response.data?.error || 'Có lỗi xảy ra khi mở khóa tài khoản';
            }
          } else if (error.message) {
            errorMessage = error.message;
          }
          
          toast.error(errorMessage);
        }
      }
    });
    setShowConfirmModal(true);
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
      
      {/* Modal chỉnh sửa người dùng */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">Chỉnh sửa người dùng</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleUpdateUser}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên hiển thị
                  </label>
                  <input
                    type="text"
                    value={editForm.displayName}
                    onChange={(e) => setEditForm({...editForm, displayName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày sinh
                  </label>
                  <input
                    type="date"
                    value={editForm.dateOfBirth}
                    onChange={(e) => setEditForm({...editForm, dateOfBirth: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tiểu sử
                  </label>
                  <textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Cập nhật
                </button>
              </div>
            </form>
          </div>
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
      
      {/* Modal xác nhận hành động */}
      {showConfirmModal && confirmAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                {confirmAction.type === 'ban' ? 'Xác nhận khóa tài khoản' : 'Xác nhận mở khóa tài khoản'}
              </h3>
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setConfirmAction(null);
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 mb-4">{confirmAction.message}</p>
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      {confirmAction.type === 'ban' 
                        ? 'Hành động này sẽ khóa tài khoản người dùng và họ sẽ không thể đăng nhập.' 
                        : 'Hành động này sẽ mở khóa tài khoản và người dùng có thể đăng nhập trở lại.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setConfirmAction(null);
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200"
              >
                Hủy
              </button>
              <button
                onClick={async () => {
                  setShowConfirmModal(false);
                  await confirmAction.action();
                  setConfirmAction(null);
                }}
                className={`px-4 py-2 text-white rounded-lg transition-colors duration-200 ${
                  confirmAction.type === 'ban' 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {confirmAction.type === 'ban' ? '🚫 Khóa tài khoản' : '✅ Mở khóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersManagement;
