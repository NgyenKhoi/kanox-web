import { createContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Spinner } from "react-bootstrap";

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
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasSynced, setHasSynced] = useState(
      localStorage.getItem("hasSynced") === "true"
  );

  const navigate = useNavigate();

  const setUser = (userObj, newToken = null, newRefreshToken = null) => {
    setUserState(userObj);
    if (userObj) {
      if (newToken) {
        setToken(newToken);
        localStorage.setItem("token", newToken);
        sessionStorage.removeItem("token");
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

  const syncAllData = async (authToken) => {
    if (hasSynced) return;

    setIsSyncing(true);
    let retries = 3;
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    while (retries > 0) {
      try {
        const response = await fetch(
            `${process.env.REACT_APP_API_URL}/search/sync`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${authToken}`,
              },
            }
      );

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(errText);
        }

        console.log("✅ Sync Elasticsearch thành công.");
        localStorage.setItem("hasSynced", "true");
        setHasSynced(true);
        toast.success("Đã đồng bộ dữ liệu tìm kiếm.");
        break;
      } catch (error) {
        console.error("❌ Lỗi sync:", error);
        retries--;
        if (retries === 0) toast.error("Lỗi đồng bộ dữ liệu tìm kiếm.");
        else await delay(2000);
      }
    }
    setIsSyncing(false);
  };

  const checkTokenValidity = async (accessToken) => {
    try {
      const response = await fetch(
          `${process.env.REACT_APP_API_URL}/auth/check-token`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${accessToken}` },
          }
    );

      const data = await response.json();
      if (response.ok) {
        setToken(data.token);
        localStorage.setItem("token", data.token);
        setUser(data.user, data.token, refreshToken);
        return data.token;
      } else if (response.status === 401) {
        return await refreshAccessToken();
      } else {
        logout();
        return null;
      }
    } catch (error) {
      console.error("❌ Token validation failed:", error);
      return await refreshAccessToken();
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
        return data.token;
      } else {
        logout();
        return null;
      }
    } catch (err) {
      console.error("❌ Refresh token lỗi:", err);
      logout();
      return null;
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
          console.error("Lỗi parse dữ liệu lưu trữ:", e);
          logout();
        }
      }

      const validToken = savedToken
          ? await checkTokenValidity(savedToken)
          : null;

      if (validToken) await syncAllData(validToken);

      setLoading(false);
    };

    initializeAuth();

    const interval = setInterval(() => {
      if (token) checkTokenValidity(token);
    }, 30 * 60 * 1000); // 30 phút

    return () => clearInterval(interval);
  }, []);

  return (
      <AuthContext.Provider
          value={{ user, setUser, token, logout, loading, isSyncing, hasSynced }}
      >
        {loading || isSyncing ? (
            <div className="d-flex justify-content-center align-items-center min-vh-100">
              <Spinner animation="border" role="status" />
              <span className="ms-2">Đang tải dữ liệu...</span>
            </div>
        ) : (
            children
        )}
      </AuthContext.Provider>
  );
};