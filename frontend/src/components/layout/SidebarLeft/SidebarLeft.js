import React, { useState, useContext, useEffect } from "react";
import { Nav, Button, Dropdown, Offcanvas } from "react-bootstrap";
import {
  FaHome,
  FaSearch,
  FaBell,
  FaEnvelope,
  FaUserAlt,
  FaEllipsisH,
  FaSignOutAlt,
  FaLock,
  FaTrash,
  FaRegPlusSquare,
  FaBars, // For the hamburger icon
  FaPlusCircle, // A common icon for "Post" or "Create"
  FaMoon, // Moon icon for dark mode
  FaSun, // Sun icon for light mode
} from "react-icons/fa";
import { BsStars } from "react-icons/bs";
import { Link, useNavigate, useLocation } from "react-router-dom";
import KLogoSvg from "../../svgs/KSvg";
import { AuthContext } from "../../../context/AuthContext";
import "./SidebarLeft.css"; // Import the CSS file

function SidebarLeft({ onToggleDarkMode, isDarkMode }) {
  const { user, logout } = useContext(AuthContext); // Assuming logout function exists in AuthContext
  const navigate = useNavigate();
  const location = useLocation();
  const [showOffcanvas, setShowOffcanvas] = useState(false);

  const handleCloseOffcanvas = () => setShowOffcanvas(false);
  const handleShowOffcanvas = () => setShowOffcanvas(true);

  // Define sidebar tabs
  const mainTabs = [
    { icon: <FaHome size={24} />, label: "Trang chủ", path: "/home" }, // Changed to /home as per App.js route
    { icon: <FaSearch size={24} />, label: "Khám phá", path: "/explore" },
    { icon: <FaBell size={24} />, label: "Thông báo", path: "/notifications" },
    { icon: <FaEnvelope size={24} />, label: "Tin nhắn", path: "/messages" },
    { icon: <FaUserAlt size={24} />, label: "Cộng đồng", path: "/communities" },
    { icon: <BsStars size={24} />, label: "Premium", path: "/premium" },
    {
      icon: <FaUserAlt size={24} />,
      label: "Hồ sơ",
      path: `/profile/${user?.username || "default"}`, // Use a default username if user is null
      protected: true,
    },
  ];

  const additionalTabs = [
    {
      icon: <FaRegPlusSquare size={24} />,
      label: "Tạo Story",
      path: "/create-story",
      protected: true,
    },
    {},
    { icon: <FaLock size={24} />, label: "Cài đặt Bảo mật", path: "/settings" },
    {
      icon: <FaTrash size={24} />,
      label: "Xóa Tài khoản",
      path: "/delete-account",
      protected: true,
    },
    {
      icon: <FaSignOutAlt size={24} />,
      label: "Đăng xuất",
      path: "/logout",
      protected: true,
      action: "logout",
    },
  ];

  const handleNavLinkClick = (tab) => {
    handleCloseOffcanvas(); // Close offcanvas on navigation

    if (tab.action === "logout") {
      logout(); // Call the logout function from AuthContext
      navigate("/"); // Redirect to signup/login page after logout
      return;
    }

    if (tab.protected && !user) {
      navigate("/"); // Redirect to signup if protected and not logged in
    } else {
      navigate(tab.path);
    }
  };

  const isLinkActive = (path) => {
    // For profile, check if the location path starts with /profile/
    if (
      path.startsWith("/profile/") &&
      location.pathname.startsWith("/profile/")
    ) {
      return true;
    }
    // Handle the '/' route specifically if it maps to /home content or signup page
    if (
      path === "/home" &&
      (location.pathname === "/" || location.pathname === "/home")
    ) {
      return true;
    }
    return location.pathname === path;
  };

  // Render content for the sidebar (used in both main sidebar and offcanvas)
  const renderSidebarContent = () => (
    <>
      <Nav className="flex-column mb-auto">
        {mainTabs.map((tab) => (
          <Nav.Item key={tab.label} className="mb-1">
            <Nav.Link
              onClick={() => handleNavLinkClick(tab)}
              className={`d-flex align-items-center text-dark py-2 px-3 rounded-pill sidebar-nav-link ${
                isLinkActive(tab.path) ? "active-sidebar-link" : ""
              }`}
            >
              <span className="me-3">{tab.icon}</span>
              <span className="fs-5 d-none d-lg-inline">{tab.label}</span>{" "}
              {/* Hide text on small (md) screens, show on large (lg) */}
            </Nav.Link>
          </Nav.Item>
        ))}

        {/* "Thêm" Dropdown */}
        <Dropdown className="mt-2 sidebar-more-dropdown">
          <Dropdown.Toggle
            as={Nav.Link}
            className="d-flex align-items-center text-dark py-2 px-3 rounded-pill sidebar-nav-link"
          >
            <span className="me-3">
              <FaEllipsisH size={24} />
            </span>
            <span className="fs-5 d-none d-lg-inline">Thêm</span>{" "}
          </Dropdown.Toggle>

          <Dropdown.Menu className="sidebar-dropdown-menu">
            {additionalTabs.map((tab) => (
              <Dropdown.Item
                key={tab.label}
                onClick={() => handleNavLinkClick(tab)}
                className="d-flex align-items-center py-2 px-3 sidebar-dropdown-item"
              >
                <span className="me-3">{tab.icon}</span>
                {tab.label}
              </Dropdown.Item>
            ))}
          </Dropdown.Menu>
        </Dropdown>
      </Nav>

      <Button
        variant="primary" // Changed to primary for a more prominent "Post" button
        className="rounded-pill mt-3 py-3 fw-bold sidebar-post-button d-none d-lg-block" // Show only on large screens
        onClick={() => {
          handleCloseOffcanvas();
          navigate("/create-post");
        }}
      >
        Đăng
      </Button>
      {/* Floating action button for small screens */}
      <Button
        variant="primary"
        className="sidebar-fab d-lg-none rounded-circle p-3 shadow" // Show only on small screens, added shadow
        onClick={() => {
          handleCloseOffcanvas();
          navigate("/create-post");
        }}
      >
        <FaPlusCircle size={24} />
      </Button>

      {/* User Profile Thumbnail at the bottom */}
      <div className="mt-auto pt-3">
        {" "}
        {/* Added mt-auto to push to bottom */}
        <Dropdown drop="up" className="w-100">
          {" "}
          {/* Dropdown for user options, drops upwards */}
          <Dropdown.Toggle
            as="div"
            className="d-flex align-items-center p-2 rounded-pill hover-bg-light cursor-pointer w-100"
            style={{ backgroundColor: isDarkMode ? "#222" : "#f8f9fa" }} // Adjust bg color for dark mode
          >
            <img
              src={user?.avatar || "https://via.placeholder.com/40"} // Use user avatar or placeholder
              alt="User Avatar"
              className="rounded-circle me-2"
              style={{ width: "40px", height: "40px", objectFit: "cover" }}
            />
            <div className="d-none d-lg-block flex-grow-1">
              {" "}
              {/* Hide text on small screens */}
              <div className="fw-bold text-dark">
                {user?.name || "Người dùng"}
              </div>
              <div className="text-muted small">
                @{user?.username || "username"}
              </div>
            </div>
            <FaEllipsisH className="ms-auto me-2 text-dark d-none d-lg-block" />{" "}
            {/* Show ellipsis on large screens */}
          </Dropdown.Toggle>
          <Dropdown.Menu className="sidebar-user-dropdown-menu">
            <Dropdown.Item
              onClick={() =>
                navigate(`/profile/${user?.username || "default"}`)
              }
            >
              Xem hồ sơ
            </Dropdown.Item>
            <Dropdown.Item
              onClick={() => handleNavLinkClick({ action: "logout" })}
            >
              <FaSignOutAlt className="me-2" /> Đăng xuất
            </Dropdown.Item>
            {/* Add more user-specific options if needed */}
          </Dropdown.Menu>
        </Dropdown>
      </div>
    </>
  );

  return (
    <>
      {/* Hamburger icon for small screens - visible when main sidebar is hidden */}
      <Button
        variant="light"
        className="d-md-none position-fixed top-0 start-0 m-3 z-3" // Higher z-index
        onClick={handleShowOffcanvas}
      >
        <FaBars size={24} />
      </Button>

      {/* Main Sidebar for larger screens */}
      <div
        className="d-none d-md-flex flex-column flex-shrink-0 pt-2 pb-3 ps-3 pe-0 border-end sidebar-left-container"
        style={{
          width: "280px",
          height: "100vh",
          position: "sticky",
          top: 0,
          overflowY: "auto",
        }} // Explicit width, height, sticky, and scroll
      >
        <div className="d-flex justify-content-between align-items-center mb-3 px-3">
          <Link to="/home" className="d-block me-auto">
            <KLogoSvg width="50px" height="50px" /> {/* Increased logo size */}
          </Link>
          {/* Dark Mode Toggle Button for main sidebar */}
          <Button
            variant="link"
            onClick={onToggleDarkMode}
            className="text-dark p-0 toggle-dark-mode-button"
          >
            {isDarkMode ? <FaSun size={20} /> : <FaMoon size={20} />}
          </Button>
        </div>
        {renderSidebarContent()}
      </div>

      {/* Offcanvas for smaller screens */}
      <Offcanvas
        show={showOffcanvas}
        onHide={handleCloseOffcanvas}
        placement="start"
        className="sidebar-offcanvas" // Add a class for styling offcanvas
      >
        <Offcanvas.Header closeButton>
          <Offcanvas.Title className="d-flex align-items-center">
            <Link to="/home" className="d-block me-auto">
              <KLogoSvg width="50px" height="50px" />{" "}
              {/* Increased logo size */}
            </Link>
            {/* Dark Mode Toggle Button for Offcanvas */}
            <Button
              variant="link"
              onClick={onToggleDarkMode}
              className="text-dark p-0 toggle-dark-mode-button"
            >
              {isDarkMode ? <FaSun size={20} /> : <FaMoon size={20} />}
            </Button>
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="d-flex flex-column">
          {renderSidebarContent()}
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
}

export default SidebarLeft;