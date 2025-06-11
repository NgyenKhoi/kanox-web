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

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { toast } from "react-toastify";

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

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

  const handleToggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
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
              <div className={`app-container d-flex ${isDarkMode ? "dark-mode" : ""}`}>
                <div className="main-content flex-grow-1">
                  <Routes>
                    <Route path="/" element={<SignupPage />} />
                    <Route path="/reset-password" element={<ResetPasswordPage />} />
                    <Route path="/verify-email" element={<VerifyEmailPage />} />
                    <Route
                        path="/home"
                        element={
                          <HomePage
                              onShowCreatePost={handleOpenCreatePostModal}
                              isDarkMode={isDarkMode}
                              onToggleDarkMode={handleToggleDarkMode}
                          />
                        }
                    />
                    <Route path="/profile/:username" element={<ProfilePage />} />
                    <Route path="/profile/me" element={<ProfilePage />} />
                    <Route path="/explore" element={<ExplorePage />} />
                    <Route path="/notifications" element={<NotificationPage />} />
                    <Route path="/messages" element={<MessengerPage />} />
                    <Route path="/communities" element={<CommunityPage />} />
                    <Route path="/community/:communityId" element={<CommunityDetail />} />
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