import logo from "./logo.svg";
import "./App.css";
import SignupPage from "./pages/auth/signup/signupPage";
import HomePage from "./pages/home/HomePage";
import ProfilePage from "./pages/profile/ProfilePage";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SignupPage />} />{" "}
        {/* Trang mặc định là SignupPage */}
        <Route path="/home" element={<HomePage />} />{" "}
        <Route path="/profile" element={<ProfilePage />} />{" "}
        {/* Route cho trang Home */}
        {/* Bạn có thể thêm các route khác ở đây nếu cần */}
      </Routes>
    </Router>
  );
}

export default App;
