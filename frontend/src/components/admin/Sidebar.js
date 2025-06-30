import React from "react";
import { Nav, Navbar, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom"; // Giữ lại useNavigate nếu bạn dùng nó cho logic logout

const Sidebar = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { name: "Tổng quan", icon: "📊", tab: "dashboard" },
    { name: "Người dùng", icon: "👥", tab: "users" },
    { name: "Bài viết", icon: "📋", tab: "posts" },
    { name: "Cộng đồng", icon: "🏘️", tab: "communities" }, // Thêm lại các tab bị thiếu
    { name: "Báo cáo", icon: "⚠️", tab: "reports" }, // Thêm lại các tab bị thiếu
    { name: "Cài đặt", icon: "⚙️", tab: "settings" }, // Thêm lại các tab bị thiếu
  ];

  const navigate = useNavigate(); // Hook để điều hướng

  return (
    // Navbar component của React-Bootstrap được tùy chỉnh để làm sidebar cố định
    <Navbar
      bg="dark" // Màu nền tối
      variant="dark" // Văn bản màu sáng
      expand="lg" // Luôn mở rộng trên màn hình lớn
      className="d-flex flex-column rounded-end shadow" // Hiển thị dưới dạng cột, bo tròn góc phải, đổ bóng
      style={{
        position: "fixed", // Cố định vị trí
        left: 0, // Căn lề trái
        top: 0, // Căn lề trên
        bottom: 0, // Kéo dài xuống dưới cùng
        width: "16rem", // Chiều rộng cố định (256px = 16rem)
        zIndex: 1000, // Đảm bảo sidebar nằm trên các nội dung khác
      }}
    >
      {/* Phần thương hiệu/tiêu đề của sidebar */}
      <Navbar.Brand className="p-4 d-flex align-items-center border-bottom border-secondary">
        <span className="text-primary fs-3 me-2">🌐</span>{" "}
        {/* Biểu tượng KaNox */}
        <span className="fs-3 fw-bold">KaNox Admin</span>{" "}
        {/* Changed fs-4 to fs-3 for consistency */}
      </Navbar.Brand>

      {/* Phần điều hướng chính */}
      <Nav className="d-flex flex-column flex-grow-1 px-2 py-4 gap-2">
        {" "}
        {/* Dùng gap-2 cho Bootstrap 5+ */}
        {navItems.map((item) => (
          <Nav.Link
            key={item.tab}
            active={activeTab === item.tab} // Đánh dấu tab đang hoạt động
            onClick={() => setActiveTab(item.tab)} // Xử lý khi nhấp vào tab
            className="d-flex align-items-center w-100 px-4 py-2 fs-5 fw-medium rounded-3 text-light-emphasis" // căn giữa, rộng full, padding, font, bo góc
            style={{
              // Thêm style tùy chỉnh cho hiệu ứng hover và active nếu default Bootstrap không đủ
              backgroundColor:
                activeTab === item.tab ? "var(--bs-primary)" : "transparent", // Màu nền khi active
              color:
                activeTab === item.tab ? "white" : "var(--bs-light-emphasis)", // Màu chữ khi active
              transition: "background-color 0.2s, color 0.2s", // Hiệu ứng chuyển động
            }}
            onMouseOver={(e) => {
              // Xử lý hover để thay đổi màu nền khi không active
              if (activeTab !== item.tab) {
                e.currentTarget.style.backgroundColor = "var(--bs-gray-700)"; // Màu nền hover
              }
            }}
            onMouseOut={(e) => {
              // Đặt lại màu nền khi bỏ hover
              if (activeTab !== item.tab) {
                e.currentTarget.style.backgroundColor = "transparent";
              }
            }}
          >
            <span className="fs-4 me-3">{item.icon}</span> {/* Biểu tượng */}
            {item.name}
          </Nav.Link>
        ))}
      </Nav>

      {/* Phần nút đăng xuất ở cuối sidebar */}
      <div className="p-4 border-top border-secondary">
        {" "}
        {/* Padding và đường viền trên */}
        <Button
          variant="outline-light" // Nút với viền màu sáng
          onClick={() => navigate("/")} // Điều hướng về trang chủ khi đăng xuất
          className="w-100 fs-5 d-flex align-items-center justify-content-center py-2 rounded-pill" // Rộng full, font, căn giữa, bo tròn
        >
          <span className="fs-4 me-3">🚪</span> {/* Biểu tượng Đăng xuất */}
          Đăng xuất
        </Button>
      </div>
    </Navbar>
  );
};

export default Sidebar;
