import React from "react";
import { Nav, Navbar, Button } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

const Sidebar = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { name: "Tổng quan", icon: "📊", tab: "dashboard" },
    { name: "Người dùng", icon: "👥", tab: "users" },
    { name: "Bài viết", icon: "📋", tab: "posts" },
  ];

  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="h-screen w-64 flex flex-col rounded-tr-lg rounded-br-lg">
      <Navbar.Brand className="p-4 flex items-center">
        <span className="text-primary text-3xl mr-2">🌐</span>
        <span className="text-2xl font-bold">KaNox Admin</span>
      </Navbar.Brand>
      <Nav className="flex-1 px-2 py-4 space-y-2">
        {navItems.map((item) => (
          <Nav.Link
            key={item.tab}
            active={activeTab === item.tab}
            onClick={() => setActiveTab(item.tab)}
            className="flex items-center w-full px-4 py-2 text-lg font-medium rounded-lg transition-colors duration-200"
          >
            <span className="mr-3 text-xl">{item.icon}</span>
            {item.name}
          </Nav.Link>
        ))}
      </Nav>
      <div className="p-4 border-top">
        <Button
          variant="outline-light"
          onClick={() => console.log("Đăng xuất")}
          className="w-full text-lg flex items-center"
        >
          <span className="mr-3 text-xl">🚪</span>
          Đăng xuất
        </Button>
      </div>
    </Navbar>
  );
};

export default Sidebar;