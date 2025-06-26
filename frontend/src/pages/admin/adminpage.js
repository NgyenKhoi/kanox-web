import React, { useState } from "react";
import { Container, Row, Col, Navbar, Tab, Button } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import CommunitiesManagement from "../components/CommunitiesManagement";
import DashboardOverview from "../components/DashboardOverview";
import ReportsManagement from "../components/ReportsManagement";
import Settings from "../components/Settings";
import Sidebar from "../components/Sidebar";
import PostsManagement from "../components/PostsManagement";
import UsersManagement from "../components/UsersManagement";

// Main Admin Dashboard App Component - Component ứng dụng Dashboard Admin chính
const AdminDashboardApp = () => {
  const [activeTab, setActiveTab] = useState("dashboard"); // Tab mặc định là 'Tổng quan'

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
    </div>
  );
};

export default AdminDashboardApp;
