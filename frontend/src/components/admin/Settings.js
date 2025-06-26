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

export default Settings;
