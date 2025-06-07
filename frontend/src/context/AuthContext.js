import { createContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUserState] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem("refreshToken") || null);
  const [rememberMe, setRememberMe] = useState(
    localStorage.getItem("rememberMe") === "true" || false
  );
  const navigate = useNavigate();

  const setUser = (userObj, rememberMeValue = rememberMe) => {
    setUserState(userObj);
    setRememberMe(rememberMeValue); // Cập nhật trạng thái rememberMe
    const storage = rememberMeValue ? localStorage : sessionStorage;
    if (userObj) {
      storage.setItem("user", JSON.stringify(userObj));
      storage.setItem("token", token); // Lưu token
      if (rememberMeValue) {
        localStorage.setItem("refreshToken", refreshToken); // Lưu refresh token nếu rememberMe
        localStorage.setItem("rememberMe", "true"); // Lưu trạng thái rememberMe
      } else {
        sessionStorage.setItem("token", token);
        localStorage.removeItem("refreshToken"); // Xóa refresh token nếu không rememberMe
        localStorage.removeItem("rememberMe"); // Xóa trạng thái rememberMe
      }
    } else {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("rememberMe");
      sessionStorage.removeItem("user");
      sessionStorage.removeItem("token");
    }
  };

  useEffect(() => {
    const savedUser = localStorage.getItem("user") || sessionStorage.getItem("user");
    const savedToken = localStorage.getItem("token") || sessionStorage.getItem("token");
    const savedRefreshToken = localStorage.getItem("refreshToken");

    if (savedUser && savedToken) {
      try {
        setUserState(JSON.parse(savedUser));
        setToken(savedToken);
        if (savedRefreshToken) setRefreshToken(savedRefreshToken);
      } catch (e) {
        console.error("Lỗi parse user hoặc token:", e);
        setUserState(null);
        setToken(null);
        setRefreshToken(null);
        localStorage.clear();
        sessionStorage.clear();
      }
    }

    const checkTokenValidity = async () => {
      if (token) {
        try {
          const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/check-token`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}`, "Refresh-Token": `Bearer ${refreshToken}` },
          });
          if (response.ok) {
            const data = await response.json();
            setToken(data.token); // Cập nhật token mới nếu có
            const storage = rememberMe ? localStorage : sessionStorage;
            storage.setItem("token", data.token);
          } else if (response.status === 401 && refreshToken) {
            // Thử refresh token
            await refreshAccessToken();
          } else {
            logout();
          }
        } catch (error) {
          console.error("Lỗi kiểm tra token:", error);
          logout();
        }
      }
    };

    checkTokenValidity();
    const interval = setInterval(checkTokenValidity, 5 * 60 * 1000); // Kiểm tra mỗi 5 phút
    return () => clearInterval(interval);
  }, [token, refreshToken, navigate, rememberMe]);

  const refreshAccessToken = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/refresh-token`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${refreshToken}` },
      });
      if (response.ok) {
        const data = await response.json();
        setToken(data.token);
        setUser(data.user ? JSON.parse(data.user) : user); // Cập nhật user nếu có
        if (rememberMe) {
          localStorage.setItem("token", data.token);
        } else {
          sessionStorage.setItem("token", data.token);
        }
        return true;
      } else {
        logout();
        return false;
      }
    } catch (error) {
      console.error("Lỗi refresh token:", error);
      logout();
      return false;
    }
  };

  const logout = () => {
    setUserState(null);
    setToken(null);
    setRefreshToken(null);
    setRememberMe(false);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("rememberMe");
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("token");
    navigate("/signup");
  };

  return (
    <AuthContext.Provider value={{ user, setUser, token, rememberMe, setRememberMe, logout }}>
      {children}
    </AuthContext.Provider>
  );
};