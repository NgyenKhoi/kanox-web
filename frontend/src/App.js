import React, { useState, useEffect } from "react";
import "./App.css";

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
import CommunityPage from "./pages/community/CommunityPage";
import CommunityDetail from "./pages/community/CommunityDetail";
import CreatePostModal from "./components/posts/CreatePostModal/CreatePostModal";

// Import SidebarLeft and SidebarRight if they are part of the main layout
import SidebarLeft from "./components/layout/SidebarLeft/SidebarLeft";
// import SidebarRight from "./components/layout/SidebarRight/SidebarRight"; // SidebarRight is now imported in CommunityPage directly

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { toast } from "react-toastify"; // Make sure you have react-toastify installed and configured

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

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
                <Route path="/" element={<SignupPage />} />
                {/* Authentication Routes */}
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/verify-email" element={<VerifyEmailPage />} />
                {/* Main Application Routes */}
                <Route path="/home" element={<HomePage />} />
                {/* <Route path="/profile/:username" element={<ProfilePage />} /> */}
                <Route path="/profile/:username" element={<ProfilePage />} />
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
