import React, { useState, useEffect } from "react";
import { Container, Row, Col, Navbar, Tab, Button } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CommunitiesManagement from "../../components/admin/CommunitiesManagement";
import DashboardOverview from "../../components/admin/DashboardOverview";
import ReportsManagement from "../../components/admin/ReportsManagement";
import Settings from "../../components/admin/Settings";
import Sidebar from "../../components/admin/Sidebar";
import PostsManagement from "../../components/admin/PostsManagement";
import UsersManagement from "../../components/admin/UsersManagement";
import { useLocation } from "react-router-dom";

// Main Admin Dashboard App Component - Component ứng dụng Dashboard Admin chính
const AdminDashboardApp = () => {
  const [activeTab, setActiveTab] = useState("dashboard"); // Tab mặc định là 'Tổng quan'
  const location = useLocation();
  const newReport = location.state?.newReport;

  useEffect(() => {
    if (newReport) {
      toast.info(`Báo cáo mới từ ${newReport.reporterUsername}: ${newReport.reason}`);
      // Tự động chuyển sang tab Reports nếu có báo cáo mới
      setActiveTab("reports");
    }
  }, [newReport]);
  // Hàm render nội dung dựa trên tab đang hoạt động
  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardOverview />;
      case "users":
        return <UsersManagement />;
      case "posts":
        return <PostsManagement />;
      case "communities":
        return <CommunitiesManagement />;
      case "reports":
        return <ReportsManagement />;
      case "settings":
        return <Settings />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
      <div className="min-h-screen bg-light">
        <Container fluid>
          <Row>
            <Col md={3}>
              <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
            </Col>
            <Col md={9}>
              <Tab.Container
                  activeKey={activeTab}
                  onSelect={(k) => setActiveTab(k)}
                  className="h-full"
              >
                <Tab.Content className="p-4">{renderContent()}</Tab.Content>
              </Tab.Container>
            </Col>
          </Row>
        </Container>
        <Container className="text-center mt-4">
          <p className="text-muted">Quản lý hệ thống mạng xã hội KaNox.</p>
        </Container>
        <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
        />
      </div>
  );
};

export default AdminDashboardApp;
