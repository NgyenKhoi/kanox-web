import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { adminService } from '../../services/adminService';

const TestUnlockUser = () => {
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState(null);
  const [lastError, setLastError] = useState(null);

  const testUnlock = async () => {
    if (!userId || isNaN(parseInt(userId))) {
      toast.error('Vui lòng nhập User ID hợp lệ');
      return;
    }

    setLoading(true);
    setLastResponse(null);
    setLastError(null);

    try {
      console.log('=== TEST UNLOCK START ===');
      console.log('User ID:', parseInt(userId));
      
      const result = await adminService.updateUserStatus(parseInt(userId), true);
      
      console.log('=== TEST UNLOCK SUCCESS ===');
      console.log('Result:', result);
      
      setLastResponse(result);
      toast.success('Mở khóa thành công!');
    } catch (error) {
      console.error('=== TEST UNLOCK ERROR ===');
      console.error('Error:', error);
      console.error('Error message:', error.message);
      console.error('Error response:', error.response);
      
      setLastError({
        message: error.message,
        status: error.status,
        response: error.response
      });
      
      toast.error(`Lỗi: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testLock = async () => {
    if (!userId || isNaN(parseInt(userId))) {
      toast.error('Vui lòng nhập User ID hợp lệ');
      return;
    }

    setLoading(true);
    setLastResponse(null);
    setLastError(null);

    try {
      console.log('=== TEST LOCK START ===');
      console.log('User ID:', parseInt(userId));
      
      const result = await adminService.updateUserStatus(parseInt(userId), false);
      
      console.log('=== TEST LOCK SUCCESS ===');
      console.log('Result:', result);
      
      setLastResponse(result);
      toast.success('Khóa thành công!');
    } catch (error) {
      console.error('=== TEST LOCK ERROR ===');
      console.error('Error:', error);
      console.error('Error message:', error.message);
      console.error('Error response:', error.response);
      
      setLastError({
        message: error.message,
        status: error.status,
        response: error.response
      });
      
      toast.error(`Lỗi: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      border: '2px solid #007bff', 
      padding: '20px', 
      margin: '20px 0', 
      borderRadius: '8px',
      backgroundColor: '#f8f9fa'
    }}>
      <h4 style={{ color: '#007bff', marginBottom: '15px' }}>🔧 Test Unlock/Lock User</h4>
      
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          User ID:
        </label>
        <input
          type="number"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="Nhập User ID (ví dụ: 13, 14, 15)"
          min="1"
          style={{
            width: '200px',
            padding: '8px',
            border: '1px solid #ccc',
            borderRadius: '4px'
          }}
          disabled={loading}
        />
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <button
          onClick={testUnlock}
          disabled={loading || !userId}
          style={{
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '4px',
            marginRight: '10px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? '⏳ Đang xử lý...' : '🔓 Test Unlock'}
        </button>
        
        <button
          onClick={testLock}
          disabled={loading || !userId}
          style={{
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? '⏳ Đang xử lý...' : '🔒 Test Lock'}
        </button>
      </div>
      
      {lastResponse && (
        <div style={{
          backgroundColor: '#d4edda',
          border: '1px solid #c3e6cb',
          padding: '10px',
          borderRadius: '4px',
          marginBottom: '10px'
        }}>
          <h5 style={{ color: '#155724', margin: '0 0 10px 0' }}>✅ Kết quả thành công:</h5>
          <pre style={{ margin: 0, fontSize: '12px', overflow: 'auto' }}>
            {JSON.stringify(lastResponse, null, 2)}
          </pre>
        </div>
      )}
      
      {lastError && (
        <div style={{
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          padding: '10px',
          borderRadius: '4px'
        }}>
          <h5 style={{ color: '#721c24', margin: '0 0 10px 0' }}>❌ Lỗi chi tiết:</h5>
          <div style={{ fontSize: '12px' }}>
            <p><strong>Message:</strong> {lastError.message}</p>
            <p><strong>Status:</strong> {lastError.status}</p>
            {lastError.response && (
              <div>
                <p><strong>Response:</strong></p>
                <pre style={{ margin: 0, overflow: 'auto' }}>
                  {JSON.stringify(lastError.response, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
      
      <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '10px' }}>
        💡 <strong>Hướng dẫn:</strong> Nhập User ID và nhấn nút để test. Kiểm tra Console (F12) để xem log chi tiết.
      </div>
    </div>
  );
};

export default TestUnlockUser;