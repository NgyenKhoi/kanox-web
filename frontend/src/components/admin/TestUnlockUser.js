import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { adminService } from '../../services/adminService';

// Component test để kiểm tra chức năng mở khóa tài khoản
const TestUnlockUser = () => {
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(false);

  const testUnlock = async () => {
    if (!userId) {
      toast.error('Vui lòng nhập User ID');
      return;
    }

    setLoading(true);
    try {
      console.log('Testing unlock for user ID:', userId);
      await adminService.updateUserStatus(userId, true);
      toast.success('Test mở khóa thành công!');
    } catch (error) {
      console.error('Test unlock error:', error);
      toast.error('Test mở khóa thất bại: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const testLock = async () => {
    if (!userId) {
      toast.error('Vui lòng nhập User ID');
      return;
    }

    setLoading(true);
    try {
      console.log('Testing lock for user ID:', userId);
      await adminService.updateUserStatus(userId, false);
      toast.success('Test khóa thành công!');
    } catch (error) {
      console.error('Test lock error:', error);
      toast.error('Test khóa thất bại: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border border-gray-300 rounded-lg bg-yellow-50">
      <h3 className="text-lg font-bold mb-4 text-yellow-800">Test Khóa/Mở Khóa Tài Khoản</h3>
      <div className="flex gap-4 items-center">
        <input
          type="text"
          placeholder="Nhập User ID để test"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg"
        />
        <button
          onClick={testUnlock}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? 'Đang test...' : 'Test Mở Khóa'}
        </button>
        <button
          onClick={testLock}
          disabled={loading}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? 'Đang test...' : 'Test Khóa'}
        </button>
      </div>
      <p className="text-sm text-yellow-700 mt-2">
        Component này chỉ để test. Xóa sau khi fix xong.
      </p>
    </div>
  );
};

export default TestUnlockUser;