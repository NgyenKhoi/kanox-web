import React, { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // { username, email, ... } or null
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    } else {
      // Nếu dùng token: Gọi API để xác thực
      fetch("/api/auth/me", {
        credentials: "include", // Để gửi cookie (session ID)
      })
        .then((res) => res.ok ? res.json() : null)
        .then((data) => {
          if (data) setUser(data);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
