import React, { useState, useEffect } from "react";

const ReportsManagement = () => {
  // Dữ liệu giả cho báo cáo
  const [reports, setReports] = useState([
    {
      id: "r1",
      type: "Bài viết",
      targetId: "p3",
      reporter: "user123",
      reason: "Nội dung spam",
      status: "pending",
      date: "2024-05-13",
    },
    {
      id: "r2",
      type: "Người dùng",
      targetId: "u2",
      reporter: "user456",
      reason: "Quấy rối",
      status: "pending",
      date: "2024-05-14",
    },
    {
      id: "r3",
      type: "Cộng đồng",
      targetId: "c1",
      reporter: "user789",
      reason: "Vi phạm quy tắc",
      status: "resolved",
      date: "2024-05-10",
    },
    {
      id: "r4",
      type: "Bài viết",
      targetId: "p1",
      reporter: "userabc",
      reason: "Hình ảnh không phù hợp",
      status: "pending",
      date: "2024-05-15",
    },
  ]);

  const handleViewTarget = (type, id) =>
    console.log(`Xem chi tiết ${type} ID: ${id}`);
  const handleResolveReport = (id) => {
    if (window.confirm(`Đánh dấu báo cáo ID: ${id} là đã giải quyết?`)) {
      setReports(
        reports.map((report) =>
          report.id === id ? { ...report, status: "resolved" } : report
        )
      );
      console.log(`Đã giải quyết báo cáo ID: ${id}`);
    }
  };
  const handleDismissReport = (id) => {
    if (window.confirm(`Bạn có chắc muốn bỏ qua báo cáo ID: ${id}?`)) {
      setReports(reports.filter((report) => report.id !== id)); // Xóa khỏi danh sách
      console.log(`Đã bỏ qua báo cáo ID: ${id}`);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">Quản lý Báo cáo</h2>
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
            {reports.map((report) => (
              <tr
                key={report.id}
                className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50"
              >
                <td className="py-3 px-4 text-gray-800">{report.id}</td>
                <td className="py-3 px-4 text-gray-800">{report.type}</td>
                <td className="py-3 px-4 text-gray-800">{report.targetId}</td>
                <td className="py-3 px-4 text-gray-800">{report.reporter}</td>
                <td className="py-3 px-4 text-gray-800">{report.reason}</td>
                <td className="py-3 px-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold
                    ${
                      report.status === "pending"
                        ? "bg-orange-100 text-orange-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {report.status === "pending" ? "Đang chờ" : "Đã giải quyết"}
                  </span>
                </td>
                <td className="py-3 px-4 text-gray-800">{report.date}</td>
                <td className="py-3 px-4">
                  <div className="flex space-x-2">
                    <button
                      onClick={() =>
                        handleViewTarget(report.type, report.targetId)
                      }
                      className="p-2 rounded-full hover:bg-blue-100 text-blue-600 transition-colors duration-200"
                      title="Xem mục tiêu"
                    >
                      👁️ {/* Biểu tượng Xem */}
                    </button>
                    {report.status === "pending" && (
                      <>
                        <button
                          onClick={() => handleResolveReport(report.id)}
                          className="p-2 rounded-full hover:bg-green-100 text-green-600 transition-colors duration-200"
                          title="Giải quyết báo cáo"
                        >
                          ✅ {/* Biểu tượng Đã giải quyết */}
                        </button>
                        <button
                          onClick={() => handleDismissReport(report.id)}
                          className="p-2 rounded-full hover:bg-red-100 text-red-600 transition-colors duration-200"
                          title="Bỏ qua báo cáo"
                        >
                          🗑️ {/* Biểu tượng Bỏ qua */}
                        </button>
                      </>
                    )}
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

export default ReportsManagement;
