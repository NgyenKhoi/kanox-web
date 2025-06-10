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
import SidebarLeft from "./components/layout/SidebarLeft/SidebarLeft";
// import SidebarRight from "./components/layout/SidebarRight/SidebarRight"; // SidebarRight is now imported in CommunityPage directly

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

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
    // eslint-disable-next-line no-undef
    toast.success("Đăng bài thành công!"); // Use toast here
  };

  return (
    <Router>
      <AuthProvider>
        {isLoading ? (
          <LoadingPage />
        ) : (
          <div className="app-container d-flex">
            {/* <SidebarLeft
              onToggleDarkMode={toggleDarkMode}
              isDarkMode={isDarkMode}
            /> */}

            <div className="main-content flex-grow-1">
              <Routes>
                {/* Set SignupPage as the default route 
                SignupPage*/}
                <Route path="/" element={<HomePage />} />
                {/* Authentication Routes */}
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/verify-email" element={<VerifyEmailPage />} />
                {/* Main Application Routes */}
                <Route path="/home" element={<HomePage />} />
                {/* <Route path="/profile/:username" element={<ProfilePage />} /> */}
                <Route path="/profile/:userId" element={<ProfilePage />} />
                <Route path="/profile/me" element={<ProfilePage />} />
                <Route path="/explore" element={<ExplorePage />} />
                <Route path="/notifications" element={<NotificationPage />} />
                <Route path="/messages" element={<MessengerPage />} />
                <Route path="/communities" element={<CommunityPage />} />{" "}
                {/* New route for Communities */}
                <Route
                  path="/community/:communityId"
                  element={<CommunityDetail />}
                />{" "}
                {/* New route for Community Detail */}
                {/* Add more routes here as needed */}
              </Routes>
            </div>
          </div>
        )}
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
