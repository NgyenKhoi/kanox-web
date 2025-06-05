import logo from "./logo.svg";
import "./App.css";
import React, { useState, useEffect } from "react"; // Import useState và useEffect
import SignupPage from "./pages/auth/signup/signupPage";
import HomePage from "./pages/home/HomePage";
import ProfilePage from "./pages/profile/ProfilePage";
import ResetPasswordPage from "./pages/auth/login/ResetPasswordPage"; // import trang reset password
import CompleteProfilePage from "./components/profile/CompleteProfilePage";
import ExplorePage from "./pages/search/ExplorePage";
import NotificationPage from "./pages/Notifications/NotificationPage";
import MessengerPage from "./pages/Messenger/MessengerPage";
import LoadingPage from "./components/common/Loading/LoadingPage";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

function App() {
  const [isLoading, setIsLoading] = useState(true); // Khởi tạo state isLoading

  useEffect(() => {
    // Giả lập quá trình tải tài nguyên hoặc kiểm tra xác thực ban đầu
    // Trong một ứng dụng thực tế, bạn có thể thực hiện:
    // - Gọi API để lấy dữ liệu ban đầu
    // - Kiểm tra trạng thái đăng nhập của người dùng
    // - Tải các tài nguyên cần thiết khác
    const timer = setTimeout(() => {
      setIsLoading(false); // Sau khi tải xong, đặt isLoading về false
    }, 2000); // Giả lập thời gian tải là 2 giây

    return () => clearTimeout(timer); // Dọn dẹp timer khi component unmount
  }, []); // [] đảm bảo useEffect chỉ chạy một lần khi component mount
  return (
    <Router>
      {isLoading ? (
        <LoadingPage /> // Hiển thị trang LoadingPage nếu isLoading là true
      ) : (
        <Routes>
          <Route path="/" element={<SignupPage />} />{" "}
          <Route path="/profile/:username" element={<ProfilePage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />{" "}
          <Route path="/complete-profile" element={<CompleteProfilePage />} />{" "}
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/notifications" element={<NotificationPage />} />{" "}
          <Route path="/messages" element={<MessengerPage />} />{" "}
          {/* Route for Notifications */}
          {/* Route cho trang đặt lại mật khẩu */}
          {/* Trang mặc định là SignupPage */}
          <Route path="/home" element={<HomePage />} />{" "}
          {/* Route cho trang Home */}
          {/* Bạn có thể thêm các route khác ở đây nếu cần */}
        </Routes>
      )}
    </Router>
  );
}
export default App;
