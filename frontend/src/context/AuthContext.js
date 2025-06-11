import { createContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUserState] = useState(null);
  const [token, setToken] = useState(
    sessionStorage.getItem("token") || localStorage.getItem("token") || null
  );
  const [refreshToken, setRefreshToken] = useState(
    localStorage.getItem("refreshToken") || null
  );
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false); // Thêm trạng thái đồng bộ
  const navigate = useNavigate();

  const setUser = (userObj, newToken = null, newRefreshToken = null) => {
    setUserState(userObj);
    if (userObj) {
      if (newToken) {
        setToken(newToken);
        sessionStorage.removeItem("token");
        localStorage.removeItem("token");
        localStorage.setItem("token", newToken);
      }
      if (newRefreshToken) {
        setRefreshToken(newRefreshToken);
        localStorage.setItem("refreshToken", newRefreshToken);
      }
      localStorage.setItem("user", JSON.stringify(userObj));
    } else {
      setToken(null);
      setRefreshToken(null);
      localStorage.clear();
      sessionStorage.clear();
    }
  };

  const syncAllData = async (authToken = null) => {
    setIsSyncing(true);
    try {
      console.log("Starting data sync with Elasticsearch...");
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/search/sync`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(authToken && { Authorization: `Bearer ${authToken}` }),
          },
        }
      );
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Lỗi khi đồng bộ dữ liệu: ${errorText}`);
      }
      console.log("Data synced successfully with Elasticsearch.");
      toast.success("Đã đồng bộ toàn bộ dữ liệu sang Elasticsearch");
    } catch (error) {
      console.error("Lỗi đồng bộ dữ liệu:", error);
      toast.error("Đồng bộ thất bại: " + error.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const checkTokenValidity = async () => {
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
        setUser(data.user, data.token, refreshToken);
        if (data.user) {
          setUserState(data.user);
          localStorage.setItem("user", JSON.stringify(data.user));
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
  };

  const refreshAccessToken = async () => {
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
        setUser(data.user, data.token, refreshToken);
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

  const logout = () => {
    setUserState(null);
    setToken(null);
    setRefreshToken(null);
    localStorage.clear();
    sessionStorage.clear();
    navigate("/");
  };

  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      const savedUser = localStorage.getItem("user");
      const savedToken =
        sessionStorage.getItem("token") || localStorage.getItem("token");
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

      if (savedToken) {
        await checkTokenValidity();
      }

      // Gọi đồng bộ dữ liệu
      await syncAllData(savedToken);

      setLoading(false);
    };

    initializeAuth();
    const interval = setInterval(checkTokenValidity, 5 * 60 * 1000); // Kiểm tra mỗi 5 phút
    return () => clearInterval(interval);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, setUser, token, logout, loading, isSyncing }}
    >
      {loading || isSyncing ? (
        <div className="d-flex justify-content-center align-items-center min-vh-100">
          <span className="ms-2">Đang tải dữ liệu...</span>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};
