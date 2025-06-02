import logo from "./logo.svg";
import "./App.css";
import SignupPage from "./pages/auth/signup/signupPage";
import HomePage from "./pages/home/HomePage";
import ProfilePage from "./pages/profile/ProfilePage";
import ResetPasswordPage from "./pages/auth/login/ResetPasswordPage"; // import trang reset password
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import VerifyEmailPage from "./pages/auth/login/VerifyEmailPage";
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SignupPage />} />{" "}
        <Route path="/profile/:username" element={<ProfilePage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />{" "}
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        {/* Route cho trang đặt lại mật khẩu */}
        {/* Trang mặc định là SignupPage */}
        <Route path="/home" element={<HomePage />} />{" "}
        {/* Route cho trang Home */}
        {/* Bạn có thể thêm các route khác ở đây nếu cần */}
      </Routes>
    </Router>
  );
}
export default App;
