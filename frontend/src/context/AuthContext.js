import React, { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Lấy user từ localStorage hoặc sessionStorage khi mount
    const savedUser = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error("Lỗi parse user từ localStorage:", error);
        setUser(null);
        localStorage.removeItem("user");
        sessionStorage.removeItem("user");
      }
    }

    // Theo dõi thay đổi của localStorage (do sự kiện từ các tab khác hoặc component khác)
    const handleStorageChange = (e) => {
      if (e.key === "user") {
        const newUser = e.newValue ? JSON.parse(e.newValue) : null;
        if (newUser !== user) {
          setUser(newUser);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);

    // Dọn dẹp event listener khi unmount
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [user]); // Thêm user vào dependencies để đồng bộ khi user thay đổi

  // Cập nhật localStorage khi user thay đổi
  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
      sessionStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
      sessionStorage.removeItem("user");
    }
  }, [user]);

  return (
      <AuthContext.Provider value={{ user, setUser }}>
        {children}
      </AuthContext.Provider>
  );
};