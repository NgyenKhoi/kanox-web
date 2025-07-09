import React, { useState, useEffect, useContext } from "react";
import { toast } from "react-toastify";
import { WebSocketContext } from "../../context/WebSocketContext";
import { useLocation, useNavigate } from "react-router-dom";

const ReportsManagement = () => {
  const { subscribe, unsubscribe } = useContext(WebSocketContext);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [reportHistory, setReportHistory] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();

  const token = localStorage.getItem("token") || sessionStorage.getItem("token");

  const loadReports = async () => {
    if (!token) {
      toast.error("Vui lòng đăng nhập để tải báo cáo!");
      return;
    }
    try {
      setLoading(true);
      const url = new URL(`${process.env.REACT_APP_API_URL}/admin/reports`);
      url.searchParams.append("page", currentPage);
      url.searchParams.append("size", 10);
      if (statusFilter) {
        url.searchParams.append("status", statusFilter === "true" || statusFilter === "false" ? statusFilter : "");
      }
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Không thể tải danh sách báo cáo");
      setReports(data.content || []);
      setTotalPages(data.totalPages || 0);
    } catch (error) {
      console.error("Lỗi khi tải báo cáo:", error);
      toast.error("Không thể tải danh sách báo cáo: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadReportHistory = async (reportId) => {
    if (!token) {
      toast.error("Vui lòng đăng nhập để tải lịch sử báo cáo!");
      return;
    }
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/reports/${reportId}/history`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Lỗi khi lấy lịch sử báo cáo");
      setReportHistory(data);
    } catch (error) {
      toast.error("Lỗi khi lấy lịch sử báo cáo: " + error.message);
    }
  };

  const handleViewDetail = async (reportId) => {
    if (!token) {
      toast.error("Vui lòng đăng nhập để xem chi tiết báo cáo!");
      return;
    }
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/reports/${reportId}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Lỗi khi lấy chi tiết báo cáo");
      setSelectedReport(data);
      await loadReportHistory(reportId);
      setShowDetailModal(true);
    } catch (error) {
      toast.error("Lỗi khi lấy chi tiết báo cáo: " + error.message);
    }
  };

  const handleDismissReport = async (id) => {
    if (!token) {
      toast.error("Vui lòng đăng nhập để xóa báo cáo!");
      return;
    }
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/reports/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Lỗi khi xóa báo cáo");
      }
      toast.success("Đã xóa báo cáo!");
      loadReports();
    } catch (error) {
      toast.error("Lỗi khi xóa báo cáo: " + error.message);
    }
  };

  const handleUpdateStatus = async (reportId, statusId) => {
    if (!token) {
      toast.error("Vui lòng đăng nhập để cập nhật trạng thái báo cáo!");
      return;
    }
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/reports/${reportId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          adminId: localStorage.getItem("userId"),
          processingStatusId: statusId,
        }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Lỗi khi cập nhật trạng thái");
      }
      toast.success("Đã cập nhật trạng thái báo cáo!");
      setShowDetailModal(false);
      loadReports();
    } catch (error) {
      toast.error("Lỗi khi cập nhật trạng thái: " + error.message);
    }
  };

  useEffect(() => {
    loadReports();
    // Xử lý báo cáo mới từ state của useLocation
    if (location.state?.newReport) {
      toast.info(`Báo cáo mới từ ${location.state.newReport.reporterUsername}: ${location.state.newReport.reason}`);
    }
  }, [currentPage, statusFilter, location.state]);

  useEffect(() => {
    if (!subscribe || !unsubscribe) return;

    const subscription = subscribe("/topic/admin/reports", (message) => {
      console.log("Received new report:", message);
      toast.info("Có báo cáo mới!");
      loadReports();
    }, "admin-reports");

    return () => {
      if (subscription) unsubscribe("admin-reports");
    };
  }, [subscribe, unsubscribe]);

  return (
      <div className="bg-background text-text p-6 min-h-screen">
        <h2 className="text-2xl font-bold mb-4 dark:text-white">Quản lý Báo cáo</h2>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2 dark:text-gray-300">Lọc theo trạng thái</label>
          <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(0);
              }}
              className="w-full p-2 border border-border rounded-md bg-background text-text focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
          >
            <option value="">Tất cả</option>
            <option value="1">Đang chờ xử lý</option>
            <option value="2">Đã duyệt</option>
            <option value="3">Đã từ chối</option>
          </select>
        </div>

        {loading ? (
            <div className="flex justify-center">
              <svg className="animate-spin h-8 w-8 text-blue-500" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8 8 8 0 01-8-8z" />
              </svg>
            </div>
        ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-background border border-border rounded-md">
                <thead>
                <tr className="bg-gray-100 dark:bg-gray-800">
                  <th className="p-3 text-left text-text dark:text-white">ID</th>
                  <th className="p-3 text-left text-text dark:text-white">Người báo cáo</th>
                  <th className="p-3 text-left text-text dark:text-white">Loại</th>
                  <th className="p-3 text-left text-text dark:text-white">ID mục tiêu</th>
                  <th className="p-3 text-left text-text dark:text-white">Lý do</th>
                  <th className="p-3 text-left text-text dark:text-white">Trạng thái</th>
                  <th className="p-3 text-left text-text dark:text-white">Hành động</th>
                </tr>
                </thead>
                <tbody>
                {reports.map((report) => (
                    <tr key={report.id} className="border-t border-border hover:bg-hover-bg dark:hover:bg-gray-700">
                      <td className="p-3 text-text dark:text-white">{report.id}</td>
                      <td className="p-3 text-text dark:text-white">{report.reporterUsername}</td>
                      <td className="p-3 text-text dark:text-white">{report.targetTypeId === 1 ? "Bài đăng" : "Người dùng"}</td>
                      <td className="p-3 text-text dark:text-white">{report.targetId}</td>
                      <td className="p-3 text-text dark:text-white">{report.reason?.name || "Không xác định"}</td>
                      <td className="p-3">
                    <span
                        className={`px-2 py-1 rounded-full text-sm ${
                            report.processingStatusId === 1
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-200"
                                : report.processingStatusId === 2
                                    ? "bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-200"
                                    : "bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-200"
                        }`}
                    >
                      {report.processingStatusId === 1 ? "Đang chờ" : report.processingStatusId === 2 ? "Đã duyệt" : "Đã từ chối"}
                    </span>
                      </td>
                      <td className="p-3 flex gap-2">
                        <button
                            onClick={() => handleViewDetail(report.id)}
                            className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          Chi tiết
                        </button>
                        <button
                            onClick={() => handleDismissReport(report.id)}
                            className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                ))}
                </tbody>
              </table>
            </div>
        )}

        {/* Modal chi tiết báo cáo */}
        <div
            className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center transition-opacity duration-300 ${
                showDetailModal ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
        >
          <div className="bg-background rounded-lg shadow-lg w-full max-w-2xl p-6 dark:bg-gray-800">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-text dark:text-white">Chi tiết Báo cáo</h3>
              <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-text-muted hover:text-text dark:text-gray-400 dark:hover:text-white"
              >
                ✕
              </button>
            </div>
            {selectedReport ? (
                <>
                  <p className="text-text dark:text-white"><strong>ID Báo cáo:</strong> {selectedReport.id}</p>
                  <p className="text-text dark:text-white"><strong>Người báo cáo:</strong> {selectedReport.reporterUsername}</p>
                  <p className="text-text dark:text-white"><strong>Loại:</strong> {selectedReport.targetTypeId === 1 ? "Bài đăng" : "Người dùng"}</p>
                  <p className="text-text dark:text-white"><strong>ID mục tiêu:</strong> {selectedReport.targetId}</p>
                  <p className="text-text dark:text-white"><strong>Lý do:</strong> {selectedReport.reason?.name || "Không xác định"}</p>
                  <p className="text-text dark:text-white"><strong>Thời gian:</strong> {new Date(selectedReport.reportTime).toLocaleString("vi-VN")}</p>
                  <p className="text-text dark:text-white"><strong>Trạng thái:</strong> {selectedReport.processingStatus?.name || "Không xác định"}</p>
                  <h5 className="text-lg font-semibold mt-4 text-text dark:text-white">Lịch sử xử lý</h5>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse bg-background border border-border rounded-md">
                      <thead>
                      <tr className="bg-gray-100 dark:bg-gray-800">
                        <th className="p-3 text-left text-text dark:text-white">Thời gian</th>
                        <th className="p-3 text-left text-text dark:text-white">Admin</th>
                        <th className="p-3 text-left text-text dark:text-white">Trạng thái</th>
                      </tr>
                      </thead>
                      <tbody>
                      {reportHistory.map((history) => (
                          <tr key={history.id} className="border-t border-border">
                            <td className="p-3 text-text dark:text-white">{new Date(history.actionTime).toLocaleString("vi-VN")}</td>
                            <td className="p-3 text-text dark:text-white">{history.reporter?.username || "Không xác định"}</td>
                            <td className="p-3 text-text dark:text-white">{history.processingStatus?.name || "Không xác định"}</td>
                          </tr>
                      ))}
                      </tbody>
                    </table>
                  </div>
                </>
            ) : (
                <p className="text-text dark:text-white">Không có thông tin báo cáo.</p>
            )}
            <div className="flex justify-end gap-2 mt-4">
              <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Đóng
              </button>
              <button
                  onClick={() => handleUpdateStatus(selectedReport.id, 2)}
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                Duyệt
              </button>
              <button
                  onClick={() => handleUpdateStatus(selectedReport.id, 3)}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Từ chối
              </button>
            </div>
          </div>
        </div>
      </div>
  );
};

export default ReportsManagement;