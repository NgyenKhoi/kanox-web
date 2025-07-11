import React, { useState, useEffect, useContext } from "react";
import { toast } from "react-toastify";
import { WebSocketContext } from "../../context/WebSocketContext";
import { useLocation, useNavigate } from "react-router-dom";

const ReportsManagement = () => {
    const { subscribe, unsubscribe } = useContext(WebSocketContext);
    const [postReports, setPostReports] = useState([]);
    const [userReports, setUserReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [selectedReport, setSelectedReport] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [reportHistory, setReportHistory] = useState([]);
    const [activeMainTab, setActiveMainTab] = useState("posts");
    const [activeSubTab, setActiveSubTab] = useState("all");
    const location = useLocation();
    const navigate = useNavigate();

    const token = localStorage.getItem("token") || sessionStorage.getItem("token");

    const loadReports = async (mainTab = activeMainTab, subTab = activeSubTab) => {
        if (!token) {
            toast.error("Vui lòng đăng nhập để tải báo cáo!");
            return;
        }
        try {
            setLoading(true);
            const url = new URL(`${process.env.REACT_APP_API_URL}/api/admin/list`);
            url.searchParams.append("page", currentPage);
            url.searchParams.append("size", 10);
            if (mainTab === "posts") {
                url.searchParams.append("targetTypeId", "1");
            } else if (mainTab === "users") {
                url.searchParams.append("targetTypeId", "4");
            }
            if (subTab !== "all") {
                url.searchParams.append("processingStatusId", subTab);
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
            if (mainTab === "posts") {
                setPostReports(data.data?.content || []);
            } else {
                setUserReports(data.data?.content || []);
            }
            setTotalPages(data.data?.totalPages || 0);
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
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/${reportId}/history`, {
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
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/${reportId}`, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Lỗi khi lấy chi tiết báo cáo");
        setSelectedReport(data.data);
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
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/${id}`, {
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
    if (!reportId || isNaN(parseInt(reportId))) {
        toast.error("ID báo cáo không hợp lệ!");
        console.error("Invalid reportId:", reportId);
        return;
    }
    try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/${parseInt(reportId)}/status`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                adminId: parseInt(localStorage.getItem("userId")),
                processingStatusId: parseInt(statusId),
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
        console.error("Lỗi khi cập nhật trạng thái:", error, { reportId, statusId });
        toast.error("Lỗi khi cập nhật trạng thái: " + error.message);
    }
};

useEffect(() => {
    loadReports();
    if (location.state?.newReport) {
        toast.info(`Báo cáo mới từ ${location.state.newReport.reporterUsername}: ${location.state.newReport.reason}`);
    }
}, [currentPage, activeMainTab, activeSubTab]);

useEffect(() => {
    if (!subscribe || !unsubscribe) return;

    const subscription = subscribe("/topic/admin/reports", (message) => {
        console.log("Received new report:", message);
        toast.info(`Báo cáo mới từ ${message.reporterUsername}: ${message.reason}`, {
            onClick: () => {
                navigate("/admin", { state: { newReport: message } });
            },
        });
        if (message.targetTypeId === 1 && (activeMainTab === "posts" && (activeSubTab === "all" || activeSubTab === "1"))) {
            setPostReports((prev) => [message, ...prev]);
        }
        if (message.targetTypeId === 4 && (activeMainTab === "users" && (activeSubTab === "all" || activeSubTab === "1"))) {
            setUserReports((prev) => [message, ...prev]);
        }
    }, "admin-reports");

    return () => {
        if (subscription) unsubscribe("admin-reports");
    };
}, [subscribe, unsubscribe, navigate, activeMainTab, activeSubTab]);

const handlePageChange = (page) => {
    setCurrentPage(page);
};

return (
    <div className="bg-background text-text p-6 min-h-screen">
        <h2 className="text-2xl font-bold mb-4 dark:text-white">Quản lý Báo cáo</h2>
        <div className="mb-4">
            <div className="flex gap-4 mb-4">
                <button
                    className={`px-4 py-2 rounded-md ${
                        activeMainTab === "posts" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-white"
                    }`}
                    onClick={() => {
                        setActiveMainTab("posts");
                        setActiveSubTab("all");
                        setCurrentPage(0);
                        loadReports("posts", "all");
                    }}
                >
                    Báo cáo bài đăng
                </button>
                <button
                    className={`px-4 py-2 rounded-md ${
                        activeMainTab === "users" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-white"
                    }`}
                    onClick={() => {
                        setActiveMainTab("users");
                        setActiveSubTab("all");
                        setCurrentPage(0);
                        loadReports("users", "all");
                    }}
                >
                    Báo cáo người dùng
                </button>
            </div>
            <div className="flex gap-4 mb-4">
                {["all", "1", "2", "3", "4"].map((subTab) => (
                    <button
                        key={subTab}
                        className={`px-4 py-2 rounded-md ${
                            activeSubTab === subTab ? "bg-blue-300 text-white" : "bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-white"
                        }`}
                        onClick={() => {
                            setActiveSubTab(subTab);
                            setCurrentPage(0);
                            loadReports(activeMainTab, subTab);
                        }}
                    >
                        {subTab === "all"
                            ? "Tất cả"
                            : subTab === "1"
                                ? "Đang chờ"
                                : subTab === "2"
                                    ? "Đang xem xét"
                                    : subTab === "3"
                                        ? "Đã duyệt"
                                        : "Đã từ chối"}
                    </button>
                ))}
            </div>
        </div>

        {loading ? (
            <div className="flex justify-center">
                <svg className="animate-spin h-8 w-8 text-blue-500" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8 8 8 0 01-8-8z" />
                </svg>
            </div>
        ) : (
            <>
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse bg-background border border-gray-light rounded-md">
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
                        {(activeMainTab === "posts" ? postReports : userReports).map((report) => (
                            <tr
                                key={report.id}
                                className="border-t border-gray-light hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                                <td className="p-3 text-text dark:text-white">{report.id}</td>
                                <td className="p-3 text-text dark:text-white">{report.reporterUsername}</td>
                                <td className="p-3 text-text dark:text-white">
                                    {report.targetTypeId === 1 ? "Bài đăng" : "Người dùng"}
                                </td>
                                <td className="p-3 text-text dark:text-white">{report.targetId}</td>
                                <td className="p-3 text-text dark:text-white">{report.reason?.name || "Không xác định"}</td>
                                <td className="p-3">
                                            <span
                                                className={`px-2 py-1 rounded-full text-sm ${
                                                    report.processingStatusId === 1
                                                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-200"
                                                        : report.processingStatusId === 2
                                                            ? "bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-200"
                                                            : report.processingStatusId === 3
                                                                ? "bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-200"
                                                                : "bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-200"
                                                }`}
                                            >
                                                {report.processingStatusId === 1
                                                    ? "Đang chờ"
                                                    : report.processingStatusId === 2
                                                        ? "Đang xem xét"
                                                        : report.processingStatusId === 3
                                                            ? "Đã duyệt"
                                                            : "Đã từ chối"}
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
                {totalPages > 1 && (
                    <div className="flex justify-center mt-4">
                        <button
                            disabled={currentPage === 0}
                            onClick={() => handlePageChange(currentPage - 1)}
                            className="px-4 py-2 mx-1 bg-gray-200 text-gray-700 rounded-md disabled:opacity-50"
                        >
                            Trước
                        </button>
                        {[...Array(totalPages).keys()].map((page) => (
                            <button
                                key={page}
                                onClick={() => handlePageChange(page)}
                                className={`px-4 py-2 mx-1 ${
                                    currentPage === page ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"
                                } rounded-md`}
                            >
                                {page + 1}
                            </button>
                        ))}
                        <button
                            disabled={currentPage === totalPages - 1}
                            onClick={() => handlePageChange(currentPage + 1)}
                            className="px-4 py-2 mx-1 bg-gray-200 text-gray-700 rounded-md disabled:opacity-50"
                        >
                            Sau
                        </button>
                    </div>
                )}
            </>
        )}

        <div
            className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center transition-opacity duration-300 ${
                showDetailModal ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
        >
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-2xl p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-text dark:text-white">Chi tiết Báo cáo</h3>
                    <button
                        onClick={() => setShowDetailModal(false)}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
                    >
                        ✕
                    </button>
                </div>
                {selectedReport ? (
                    <>
                        <p className="text-text dark:text-white">
                            <strong>ID Báo cáo:</strong> {selectedReport.id}
                        </p>
                        <p className="text-text dark:text-white">
                            <strong>Người báo cáo:</strong> {selectedReport.reporterUsername}
                        </p>
                        <p className="text-text dark:text-white">
                            <strong>Loại:</strong> {selectedReport.targetTypeId === 1 ? "Bài đăng" : "Người dùng"}
                        </p>
                        <p className="text-text dark:text-white">
                            <strong>ID mục tiêu:</strong> {selectedReport.targetId}
                        </p>
                        <p className="text-text dark:text-white">
                            <strong>Lý do:</strong> {selectedReport.reason?.name || "Không xác định"}
                        </p>
                        <p className="text-text dark:text-white">
                            <strong>Thời gian:</strong> {new Date(selectedReport.reportTime * 1000).toLocaleString("vi-VN")}
                        </p>
                        <p className="text-text dark:text-white">
                            <strong>Trạng thái:</strong> {selectedReport.processingStatusName || "Không xác định"}
                        </p>
                        <h5 className="text-lg font-semibold mt-4 dark:text-white">Lịch sử xử lý</h5>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse bg-white dark:bg-gray-900 border border-gray-light rounded-md">
                                <thead>
                                <tr className="bg-gray-100 dark:bg-gray-800">
                                    <th className="p-3 text-left text-text dark:text-white">Thời gian</th>
                                    <th className="p-3 text-left text-text dark:text-white">Admin</th>
                                    <th className="p-3 text-left text-text dark:text-white">Trạng thái</th>
                                </tr>
                                </thead>
                                <tbody>
                                {reportHistory.map((history) => (
                                    <tr key={history.id} className="border-t border-gray-200 dark:border-gray-700">
                                        <td className="p-3 text-gray-900 dark:text-gray-300">
                                            {new Date(history.actionTime).toLocaleString("vi-VN")}
                                        </td>
                                        <td className="p-3 text-gray-900 dark:text-gray-300">
                                            {history.reporterUsername || "Không xác định"}
                                        </td>
                                        <td className="p-3 text-gray-900 dark:text-gray-300">
                                            {history.processingStatusName || "Không xác định"}
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex justify-end gap-2 mt-4">
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className="px-4 py-2 bg-gray-300 text-gray-700 dark:bg-gray-600 dark:text-gray-300 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400"
                            >
                                Đóng
                            </button>
                            <button
                                onClick={() => handleUpdateStatus(selectedReport?.id, 2)}
                                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 dark:hover:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                Đang xem xét
                            </button>
                            <button
                                onClick={() => handleUpdateStatus(selectedReport?.id, 3)}
                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 dark:hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                            >
                                Duyệt
                            </button>
                            <button
                                onClick={() => handleUpdateStatus(selectedReport?.id, 4)}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 dark:hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                            >
                                Từ chối
                            </button>
                        </div>
                    </>
                ) : (
                    <p className="text-gray-900 dark:text-gray-300">Không có thông tin báo cáo.</p>
                )}
            </div>
        </div>
    </div>
);
};

export default ReportsManagement;