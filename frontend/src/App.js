import logo from "./logo.svg";
import "./App.css";
import SignupPage from "./pages/auth/signup/signupPage";
import HomePage from "./pages/home/HomePage";
import ResetPasswordPage from "./pages/auth/login/ResetPasswordPage.js"; // import trang reset password
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SignupPage />} /> {/* Trang mặc định là SignupPage */}
        <Route path="/home" element={<HomePage />} /> {/* Route cho trang Home */}
        <Route path="/reset-password" element={<ResetPasswordPage />} /> {/* Route cho trang đặt lại mật khẩu */}
        {/* Bạn có thể thêm các route khác ở đây nếu cần */}
      </Routes>
    </Router>
  );
}

export default App;
