import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      toast.error("Không tìm thấy token xác thực.");
      navigate("/");
      return;
    }

    const verifyToken = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/auth/verify-token?token=${token}`, {
          method: "POST",
        });

        const data = await res.json();
        if (res.ok) {
          toast.success(data.message || "Xác thực tài khoản thành công!");
          setVerified(true);
          setTimeout(() => navigate("/home"), 2000);
        } else {
          toast.error(data.message || "Xác thực thất bại.");
        }
      } catch (err) {
        console.error("Lỗi xác thực:", err);
        toast.error("Lỗi kết nối đến máy chủ.");
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();
  }, [searchParams, navigate]);

  return (
      <div className="d-flex flex-column justify-content-center align-items-center vh-100 bg-light">
        <ToastContainer />
        {verifying ? (
            <h3>Đang xác thực tài khoản...</h3>
        ) : verified ? (
            <h3>✅ Tài khoản đã được xác thực! Đang chuyển hướng...</h3>
        ) : (
            <h3>❌ Xác thực thất bại.</h3>
        )}
      </div>
  );
};

export default VerifyEmailPage;