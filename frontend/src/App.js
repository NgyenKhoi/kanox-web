import logo from "./logo.svg";
import "./App.css";
import SignupPage from "./pages/auth/signup/signupPage";
import HomePage from "./pages/home/HomePage";
import ProfilePage from "./pages/profile/ProfilePage";
import ResetPasswordPage from "./pages/auth/login/ResetPasswordPage"; // import trang reset password
import CompleteProfilePage from "./components/profile/CompleteProfilePage";
import ExplorePage from "./pages/search/ExplorePage";
import NotificationPage from "./pages/Notifications/NotificationPage";
import MessengerPage from "./pages/Messenger/MessengerPage";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import VerifyEmailPage from "./pages/auth/login/VerifyEmailPage";
import { AuthProvider } from "./context/AuthContext";
function App() {
  return (
    <Router>
      <AuthProvider>
      <Routes>
        <Route path="/" element={<HomePage />} />{" "}
        <Route path="/profile/:username" element={<ProfilePage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />{" "}
        <Route path="/complete-profile" element={<CompleteProfilePage />} />{" "}
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/notifications" element={<NotificationPage />} />{" "}
        <Route path="/messages" element={<MessengerPage />} />{" "}
        {/* Route for Notifications */}
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        {/* Route cho trang đặt lại mật khẩu */}
        {/* Trang mặc định là SignupPage */}
        <Route path="/home" element={<HomePage />} />{" "}
        {/* Route cho trang Home */}
        {/* Bạn có thể thêm các route khác ở đây nếu cần */}
      </Routes>
      </AuthProvider>
    </Router>
  );
}
export default App;
