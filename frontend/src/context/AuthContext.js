import { createContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUserState] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem("refreshToken") || null);
  const navigate = useNavigate();

  const setUser = (userObj) => {
    setUserState(userObj);
    if (userObj) {
      localStorage.setItem("user", JSON.stringify(userObj));
      localStorage.setItem("token", token);
      localStorage.setItem("refreshToken", refreshToken);
    } else {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      sessionStorage.removeItem("user");
      sessionStorage.removeItem("token");
    }
  };

  useEffect(() => {
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

    const checkTokenValidity = async () => {
      if (token) {
        try {
          const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/check-token`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await response.json();
          if (response.ok) {
            setToken(data.token);
            localStorage.setItem("token", data.token);
            if (data.user) {
              setUserState(data.user);
            }
          } else if (response.status === 401) {
            await refreshAccessToken();
          } else {
            logout();
          }
        } catch (error) {
          console.error("Lỗi kiểm tra token:", error);
          await refreshAccessToken();
        }
      }
    };

    const refreshAccessToken = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/refresh-token`, {
          method: "POST",
          headers: { Authorization: `Bearer ${refreshToken}` },
        });
        if (response.ok) {
          const data = await response.json();
          setToken(data.token);
          localStorage.setItem("token", data.token);
          if (data.user) {
            setUserState(data.user);
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

    checkTokenValidity();
    const interval = setInterval(checkTokenValidity, 5 * 60 * 1000); // Kiểm tra mỗi 5 phút
    return () => clearInterval(interval);
  }, [token, refreshToken, navigate]);

  const logout = () => {
    setUserState(null);
    setToken(null);
    setRefreshToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    navigate("/signup");
  };

  return (
    <AuthContext.Provider value={{ user, setUser, token, logout }}>
      {children}
    </AuthContext.Provider>
  );
};