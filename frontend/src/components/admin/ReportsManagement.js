import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { adminService } from "../../services/adminService";

const ReportsManagement = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [adminNote, setAdminNote] = useState('');

  // Load danh sách báo cáo từ API
  const loadReports = async () => {
    try {
      setLoading(true);
      const response = await adminService.getReports(currentPage, 10, statusFilter);
      setReports(response.data.content || response.data || []);
      setTotalPages(response.data.totalPages || 0);
    } catch (error) {
      console.error('Lỗi khi tải báo cáo:', error);
      toast.error('Không thể tải danh sách báo cáo');
    } finally {
      setLoading(false);
    }
  };

  // Load dữ liệu khi component mount hoặc khi thay đổi page/filter
  useEffect(() => {
    loadReports();
  }, [currentPage, statusFilter]);

  const handleViewDetail = async (reportId) => {
    try {
      const response = await adminService.getReportById(reportId);
      setSelectedReport(response.data);
      setShowDetailModal(true);
    } catch (error) {
      console.error('Lỗi khi tải chi tiết báo cáo:', error);
      toast.error('Không thể tải chi tiết báo cáo');
    }
  };

  const handleResolveReport = async (id) => {
    if (window.confirm(`Đánh dấu báo cáo ID: ${id} là đã giải quyết?`)) {
      try {
        await adminService.updateReportStatus(id, 'RESOLVED', adminNote);
        toast.success('Đã giải quyết báo cáo thành công');
        loadReports(); // Reload danh sách
      } catch (error) {
        console.error('Lỗi khi giải quyết báo cáo:', error);
        toast.error('Không thể giải quyết báo cáo');
      }
    }
  };

  const handleDismissReport = async (id) => {
    if (window.confirm(`Bạn có chắc muốn bỏ qua báo cáo ID: ${id}?`)) {
      try {
        await adminService.deleteReport(id);
        toast.success('Đã bỏ qua báo cáo thành công');
        loadReports(); // Reload danh sách
      } catch (error) {
        console.error('Lỗi khi bỏ qua báo cáo:', error);
        toast.error('Không thể bỏ qua báo cáo');
      }
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'PENDING': return 'Đang chờ';
      case 'RESOLVED': return 'Đã giải quyết';
      case 'DISMISSED': return 'Đã bỏ qua';
      default: return status;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'bg-orange-100 text-orange-800';
      case 'RESOLVED': return 'bg-green-100 text-green-800';
      case 'DISMISSED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-gray-600">Đang tải...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">Quản lý Báo cáo</h2>
      
      {/* Filter và Controls */}
      <div className="mb-6 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Lọc theo trạng thái:</label>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(0);
            }}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tất cả</option>
            <option value="PENDING">Đang chờ</option>
            <option value="RESOLVED">Đã giải quyết</option>
            <option value="DISMISSED">Đã bỏ qua</option>
          </select>
        </div>
        <button
          onClick={loadReports}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          🔄 Làm mới
        </button>
      </div>

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
            {reports.length === 0 ? (
              <tr>
                <td colSpan="8" className="py-8 text-center text-gray-500">
                  Không có báo cáo nào
                </td>
              </tr>
            ) : (
              reports.map((report) => (
                <tr
                  key={report.id}
                  className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50"
                >
                  <td className="py-3 px-4 text-gray-800">{report.id}</td>
                  <td className="py-3 px-4 text-gray-800">{report.reportType || report.type}</td>
                  <td className="py-3 px-4 text-gray-800">{report.targetId}</td>
                  <td className="py-3 px-4 text-gray-800">{report.reporterUsername || report.reporter}</td>
                  <td className="py-3 px-4 text-gray-800">{report.reason}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(report.status)}`}
                    >
                      {getStatusText(report.status)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-800">{formatDate(report.createdAt || report.date)}</td>
                  <td className="py-3 px-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewDetail(report.id)}
                        className="p-2 rounded-full hover:bg-blue-100 text-blue-600 transition-colors duration-200"
                        title="Xem chi tiết"
                      >
                        👁️
                      </button>
                      {report.status === "PENDING" && (
                        <>
                          <button
                            onClick={() => handleResolveReport(report.id)}
                            className="p-2 rounded-full hover:bg-green-100 text-green-600 transition-colors duration-200"
                            title="Giải quyết báo cáo"
                          >
                            ✅
                          </button>
                          <button
                            onClick={() => handleDismissReport(report.id)}
                            className="p-2 rounded-full hover:bg-red-100 text-red-600 transition-colors duration-200"
                            title="Bỏ qua báo cáo"
                          >
                            🗑️
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center items-center gap-2">
          <button
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
            className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            ← Trước
          </button>
          
          <span className="px-4 py-2 text-sm text-gray-700">
            Trang {currentPage + 1} / {totalPages}
          </span>
          
          <button
            onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
            disabled={currentPage >= totalPages - 1}
            className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Tiếp →
          </button>
        </div>
      )}

      {/* Modal xem chi tiết báo cáo */}
      {showDetailModal && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">Chi tiết báo cáo #{selectedReport.id}</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Loại báo cáo:</label>
                  <p className="text-gray-900">{selectedReport.reportType || selectedReport.type}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái:</label>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedReport.status)}`}>
                    {getStatusText(selectedReport.status)}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ID mục tiêu:</label>
                  <p className="text-gray-900">{selectedReport.targetId}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Người báo cáo:</label>
                  <p className="text-gray-900">{selectedReport.reporterUsername || selectedReport.reporter}</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lý do báo cáo:</label>
                <p className="text-gray-900 bg-gray-50 p-3 rounded-md">{selectedReport.reason}</p>
              </div>
              
              {selectedReport.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả chi tiết:</label>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-md">{selectedReport.description}</p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ngày tạo:</label>
                <p className="text-gray-900">{formatDate(selectedReport.createdAt || selectedReport.date)}</p>
              </div>
              
              {selectedReport.adminNote && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú admin:</label>
                  <p className="text-gray-900 bg-blue-50 p-3 rounded-md">{selectedReport.adminNote}</p>
                </div>
              )}
              
              {selectedReport.status === 'PENDING' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú admin:</label>
                  <textarea
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="Nhập ghi chú cho báo cáo này..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Đóng
              </button>
              {selectedReport.status === 'PENDING' && (
                <>
                  <button
                    onClick={() => {
                      handleResolveReport(selectedReport.id);
                      setShowDetailModal(false);
                    }}
                    className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                  >
                    ✅ Giải quyết
                  </button>
                  <button
                    onClick={() => {
                      handleDismissReport(selectedReport.id);
                      setShowDetailModal(false);
                    }}
                    className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                  >
                    🗑️ Bỏ qua
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsManagement;
