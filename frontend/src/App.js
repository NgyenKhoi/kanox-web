import React, { useState, useEffect } from "react";
import "./App.css"; // Main CSS file
import "./styles/theme.css"; // New CSS file for theme-related styles

// Import all necessary page components
import SignupPage from "./pages/auth/signup/signupPage";
import HomePage from "./pages/home/HomePage";
import ProfilePage from "./pages/profile/ProfilePage";
import ResetPasswordPage from "./pages/auth/login/ResetPasswordPage";
import ExplorePage from "./pages/search/ExplorePage";
import NotificationPage from "./pages/Notifications/NotificationPage";
import MessengerPage from "./pages/Messenger/MessengerPage";
import LoadingPage from "./components/common/Loading/LoadingPage";
import VerifyEmailPage from "./pages/auth/login/VerifyEmailPage";
import CommunityPage from "./pages/community/CommunityPage"; // Import CommunityPage
import CommunityDetail from "./pages/community/CommunityDetail"; // Import CommunityDetail
import CreatePostModal from "./components/posts/CreatePostModal/CreatePostModal";

// Import SidebarLeft and SidebarRight if they are part of the main layout
import SidebarLeft from "./components/layout/SidebarLeft/SidebarLeft"; // Still need this import if SidebarLeft is used by pages
// import SidebarRight from "./components/layout/SidebarRight/SidebarRight"; // SidebarRight is now imported in CommunityPage directly

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { toast } from "react-toastify"; // Make sure you have react-toastify installed and configured

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false); // State for dark mode
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);

  useEffect(() => {
    const savedMode = localStorage.getItem("darkMode");
    if (savedMode !== null) {
      setIsDarkMode(JSON.parse(savedMode));
    } else if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      setIsDarkMode(true);
    }

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
    localStorage.setItem("darkMode", JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode((prevMode) => !prevMode);
  };

  const handleOpenCreatePostModal = () => {
    setShowCreatePostModal(true);
  };

  const handleCloseCreatePostModal = () => {
    setShowCreatePostModal(false);
  };

  const handlePostSuccess = (newPost) => {
    handleCloseCreatePostModal();
    toast.success("Đăng bài thành công!");
  };

  return (
    <Router>
      <AuthProvider>
        {isLoading ? (
          <LoadingPage />
        ) : (
          <div className="app-container d-flex">
            {/* SidebarLeft is rendered within each page component */}

            <div className="main-content flex-grow-1">
              <Routes>
                {/* Authentication Routes (these typically don't have SidebarLeft)
                SignupPage */}
                <Route path="/" element={<SignupPage />} />{" "}
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/verify-email" element={<VerifyEmailPage />} />
                {/* Main Application Routes - YOU MUST PASS PROPS HERE FOR EACH PAGE THAT USES SIDEBARLEFT */}
                <Route
                  path="/home"
                  element={
                    <HomePage
                      onShowCreatePost={handleOpenCreatePostModal}
                      isDarkMode={isDarkMode}
                      onToggleDarkMode={toggleDarkMode}
                    />
                  }
                />
                <Route
                  path="/profile/:userId"
                  element={
                    <ProfilePage
                      onShowCreatePost={handleOpenCreatePostModal}
                      isDarkMode={isDarkMode}
                      onToggleDarkMode={toggleDarkMode}
                    />
                  }
                />
                <Route
                  path="/profile/me"
                  element={
                    <ProfilePage
                      onShowCreatePost={handleOpenCreatePostModal}
                      isDarkMode={isDarkMode}
                      onToggleDarkMode={toggleDarkMode}
                    />
                  }
                />
                <Route
                  path="/explore"
                  element={
                    <ExplorePage
                      onShowCreatePost={handleOpenCreatePostModal}
                      isDarkMode={isDarkMode}
                      onToggleDarkMode={toggleDarkMode}
                    />
                  }
                />
                <Route
                  path="/notifications"
                  element={
                    <NotificationPage
                      onShowCreatePost={handleOpenCreatePostModal}
                      isDarkMode={isDarkMode}
                      onToggleDarkMode={toggleDarkMode}
                    />
                  }
                />
                <Route
                  path="/messages"
                  element={
                    <MessengerPage
                      onShowCreatePost={handleOpenCreatePostModal}
                      isDarkMode={isDarkMode}
                      onToggleDarkMode={toggleDarkMode}
                    />
                  }
                />
                <Route
                  path="/communities"
                  element={
                    <CommunityPage
                      onShowCreatePost={handleOpenCreatePostModal}
                      isDarkMode={isDarkMode}
                      onToggleDarkMode={toggleDarkMode}
                    />
                  }
                />
                <Route
                  path="/community/:communityId"
                  element={
                    <CommunityDetail
                      onShowCreatePost={handleOpenCreatePostModal}
                      isDarkMode={isDarkMode}
                      onToggleDarkMode={toggleDarkMode}
                    />
                  }
                />
                {/* Add more routes here as needed, ensuring props are passed if SidebarLeft is present */}
              </Routes>
            </div>
          </div>
        )}
        {/* Render the CreatePostModal here, outside the Routes, so it can be opened from any page */}
        <CreatePostModal
          show={showCreatePostModal}
          handleClose={handleCloseCreatePostModal}
          onPostSuccess={handlePostSuccess}
        />
      </AuthProvider>
    </Router>
  );
}

export default App;
