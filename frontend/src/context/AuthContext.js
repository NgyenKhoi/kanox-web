import { createContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios"; // Import axios

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUserState] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [refreshToken, setRefreshToken] = useState(
    localStorage.getItem("refreshToken") || null
  );
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const setUser = (userObj, newToken = null, newRefreshToken = null) => {
    setUserState(userObj);
    if (userObj) {
      localStorage.setItem("user", JSON.stringify(userObj));
      if (newToken) {
        setToken(newToken);
        localStorage.setItem("token", newToken);
      }
      if (newRefreshToken) {
        setRefreshToken(newRefreshToken);
        localStorage.setItem("refreshToken", newRefreshToken);
      }
    } else {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      // sessionStorage.removeItem("user"); // Remove if not used
      // sessionStorage.removeItem("token"); // Remove if not used
    }
  };

  // NEW: Function to handle login with local mock accounts (from json-server)
  const loginLocal = async (username, password) => {
    setLoading(true);
    try {
      // Assuming json-server is running on port 3001
      const response = await axios.get(
        `http://localhost:3001/users?username=${username}`
      );
      const users = response.data;

      if (users.length > 0) {
        const foundUser = users[0];
        if (foundUser.password === password) {
          // For local login, we create a dummy token and refresh token
          // In a real app, this would come from the backend's /auth/login
          const dummyToken = `mock-token-${foundUser.id}-${Date.now()}`;
          const dummyRefreshToken = `mock-refresh-${
            foundUser.id
          }-${Date.now()}`;

          // Using the existing setUser to correctly store user and tokens
          // Note: The structure of 'foundUser' should match what your real backend 'user' object looks like
          // if you want consistency. Add 'token' and 'refreshToken' props to foundUser if your real
          // backend's user object has them, or adjust setUserState to only take userObj.
          setUser(foundUser, dummyToken, dummyRefreshToken); // Use your custom setUser
          setLoading(false);
          return {
            success: true,
            user: foundUser,
            message: "Đăng nhập tài khoản ảo thành công!",
          };
        } else {
          setLoading(false);
          return { success: false, message: "Sai mật khẩu." };
        }
      } else {
        setLoading(false);
        return { success: false, message: "Tên người dùng không tồn tại." };
      }
    } catch (error) {
      console.error("Lỗi khi đăng nhập tài khoản ảo:", error);
      setLoading(false);
      return {
        success: false,
        message: "Đã xảy ra lỗi khi đăng nhập tài khoản ảo. Vui lòng thử lại.",
      };
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const savedUser = localStorage.getItem("user");
      const savedToken = localStorage.getItem("token");
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
        }
      }

      // Only check token validity if a real token exists (not a mock token from json-server)
      // This assumes mock tokens won't pass your real backend's /auth/check-token
      if (savedToken && !savedToken.startsWith("mock-")) {
        // <--- IMPORTANT: Differentiate mock tokens
        await checkTokenValidity();
      }
      setLoading(false); // Hoàn tất khởi tạo
    };

    const checkTokenValidity = async () => {
      // Skip if token is a mock token (from json-server login)
      if (!token || token.startsWith("mock-")) {
        // console.log("Skipping token validity check for mock token.");
        return;
      }

      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/auth/check-token`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const data = await response.json();
        if (response.ok) {
          setToken(data.token);
          localStorage.setItem("token", data.token);
          if (data.user) {
            setUserState(data.user);
            localStorage.setItem("user", JSON.stringify(data.user));
          }
        } else if (response.status === 401) {
          await refreshAccessToken();
        } else {
          logout(); // Logout if other errors occur
        }
      } catch (error) {
        console.error("Lỗi kiểm tra token:", error);
        await refreshAccessToken(); // Attempt to refresh even on network errors
      }
    };

    const refreshAccessToken = async () => {
      // Skip if refresh token is a mock token
      if (!refreshToken || refreshToken.startsWith("mock-")) {
        // console.log("Skipping token refresh for mock refresh token.");
        logout(); // If refresh token is mock, cannot refresh, so logout.
        return false;
      }

      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/auth/refresh-token`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${refreshToken}` },
          }
        );
        if (response.ok) {
          const data = await response.json();
          setToken(data.token);
          localStorage.setItem("token", data.token);
          if (data.user) {
            setUserState(data.user);
            localStorage.setItem("user", JSON.stringify(data.user));
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

    initializeAuth();
    // Only set up interval for real tokens
    const interval = setInterval(() => {
      if (token && !token.startsWith("mock-")) {
        checkTokenValidity();
      }
    }, 5 * 60 * 1000); // Kiểm tra mỗi 5 phút

    return () => clearInterval(interval);
  }, [token, refreshToken, navigate]); // Add navigate to dependency array

  const logout = () => {
    setUserState(null);
    setToken(null);
    setRefreshToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    navigate("/"); // Changed to "/" to go to the SignupPage
  };

  return (
    <AuthContext.Provider
      value={{ user, setUser, token, logout, loading, loginLocal }}
    >
      {" "}
      {/* Add loginLocal to context value */}
      {loading ? <div>Loading...</div> : children}
    </AuthContext.Provider>
  );
};
