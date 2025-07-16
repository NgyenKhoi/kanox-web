// Admin Service - Quản lý các API calls cho admin

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

// Lấy token từ localStorage hoặc sessionStorage
const getAuthToken = () => {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
};

// Tạo headers cho API request
const getHeaders = () => {
  const token = getAuthToken();
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

// Xử lý response từ API
const handleResponse = async (response) => {
  console.log('=== API RESPONSE DEBUG ===');
  console.log('Response status:', response.status);
  console.log('Response ok:', response.ok);
  console.log('Response url:', response.url);
  
  if (!response.ok) {
    let errorData = {};
    let errorText = '';
    
    try {
      // Thử parse JSON trước
      const text = await response.text();
      errorText = text;
      
      if (text) {
        try {
          errorData = JSON.parse(text);
        } catch (jsonError) {
          // Nếu không parse được JSON, sử dụng text
          errorData = { message: text };
        }
      }
      
      console.log('Error response data:', errorData);
      console.log('Error response text:', errorText);
    } catch (parseError) {
      console.log('Failed to parse error response:', parseError);
      errorData = { message: `HTTP ${response.status} Error` };
    }
    
    const error = new Error(errorData.message || errorText || `HTTP error! status: ${response.status}`);
    error.status = response.status;
    error.response = {
      status: response.status,
      data: errorData,
      headers: response.headers
    };
    throw error;
  }
  
  try {
    const data = await response.json();
    console.log('Success response data:', data);
    return data;
  } catch (parseError) {
    console.log('Success but failed to parse JSON:', parseError);
    return { success: true, message: 'Operation completed successfully' };
  }
};

export const adminService = {
  // === QUẢN LÝ NGƯỜI DÙNG ===
  
  // Lấy danh sách người dùng
  async getUsers(page = 0, size = 10, search = '') {
    const url = new URL(`${API_BASE_URL}/admin/users`);
    url.searchParams.append('page', page);
    url.searchParams.append('size', size);
    if (search) {
      url.searchParams.append('search', search);
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(),
    });

    return await handleResponse(response);
  },

  // Lấy thông tin chi tiết một người dùng
  async getUserById(userId) {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    return await handleResponse(response);
  },

  // Cập nhật thông tin người dùng
  async updateUser(userId, userUpdate) {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(userUpdate),
    });

    return await handleResponse(response);
  },

  // Cập nhật trạng thái người dùng (khóa/mở khóa)
  async updateUserStatus(userId, status) {
    const url = `${API_BASE_URL}/admin/users/${userId}/status?status=${status}`;
    const headers = getHeaders();
    
    console.log('=== UPDATE USER STATUS DEBUG ===');
    console.log('URL:', url);
    console.log('Method: PATCH');
    console.log('Headers:', headers);
    console.log('User ID:', userId);
    console.log('Status:', status);
    
    try {
      const response = await fetch(url, {
        method: 'PATCH',
        headers: headers,
      });
      
      return await handleResponse(response);
    } catch (error) {
      console.error('=== FETCH ERROR ===');
      console.error('Error in updateUserStatus:', error);
      throw error;
    }
  },



  // Gửi thông báo cho người dùng
  async sendNotification(userId, message, type = 'ADMIN_MESSAGE') {
    const response = await fetch(`${API_BASE_URL}/admin/users/send-notification`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        userId,
        message,
        type,
      }),
    });

    return await handleResponse(response);
  },

  // === QUẢN LÝ BÁO CÁO ===
  
  // Lấy danh sách báo cáo
  async getReports(page = 0, size = 10, status = '') {
    const url = new URL(`${API_BASE_URL}/admin/list`);
    url.searchParams.append('page', page);
    url.searchParams.append('size', size);
    if (status) {
      url.searchParams.append('processingStatusId', status);
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(),
    });

    return await handleResponse(response);
  },

  // Lấy chi tiết một báo cáo
  async getReportById(reportId) {
    const response = await fetch(`${API_BASE_URL}/admin/${reportId}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    return await handleResponse(response);
  },

  // Cập nhật trạng thái báo cáo
  async updateReportStatus(reportId, status, adminNote = '') {
    const response = await fetch(`${API_BASE_URL}/admin/${reportId}/status`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({
        processingStatusId: status,
        adminNote
      }),
    });

    return await handleResponse(response);
  },

  // Xóa báo cáo (dismiss)
  async deleteReport(reportId) {
    const response = await fetch(`${API_BASE_URL}/admin/${reportId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });

    return await handleResponse(response);
  },

  // === CÁC TÍNH NĂNG ADMIN KHÁC CÓ THỂ ĐƯỢC THÊM VÀO ĐÂY ===
  
  // Lấy thống kê tổng quan
  async getDashboardStats() {
    // Placeholder cho API thống kê
    // const response = await fetch(`${API_BASE_URL}/admin/stats`, {
    //   method: 'GET',
    //   headers: getHeaders(),
    // });
    // return await handleResponse(response);
    
    // Trả về dữ liệu giả cho đến khi API được implement
    return {
      data: {
        totalUsers: 0,
        activeUsers: 0,
        totalPosts: 0,
        totalReports: 0,
      }
    };
  },
};

export default adminService;