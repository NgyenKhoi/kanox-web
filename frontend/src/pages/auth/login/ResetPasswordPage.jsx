import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Form, Button } from "react-bootstrap";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      toast.error("Token không hợp lệ hoặc không tồn tại.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await res.json(); // Lấy JSON response

      if (res.ok) {
        toast.success("Đặt lại mật khẩu thành công! Đang chuyển hướng...");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => navigate("/"), 2000); // Delay để hiển thị toast
      } else {
        const errorMessage = data.message || data.errors?.newPassword || "Đặt lại mật khẩu thất bại.";
        toast.error(errorMessage);
      }
    } catch (e) {
      toast.error("Đã xảy ra lỗi. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
      <>
        <ToastContainer />
        <Form onSubmit={handleSubmit} style={{ maxWidth: 400, margin: "auto", padding: "20px" }}>
          <h3 className="mb-4 text-center">Đặt lại mật khẩu</h3>

          <Form.Group className="mb-3">
            <Form.Label>Mật khẩu mới</Form.Label>
            <Form.Control
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="Nhập mật khẩu mới"
                className="py-3 px-3 rounded-3"
                style={{ fontSize: "1.1rem", borderColor: "#ccc" }}
            />
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label>Xác nhận mật khẩu</Form.Label>
            <Form.Control
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Xác nhận mật khẩu"
                className="py-3 px-3 rounded-3"
                style={{ fontSize: "1.1rem", borderColor: "#ccc" }}
            />
          </Form.Group>

          <Button
              type="submit"
              variant="dark"
              disabled={loading || !newPassword || !confirmPassword}
              className="w-100 py-3 rounded-pill fw-bold"
              style={{ backgroundColor: "#000", borderColor: "#000", fontSize: "1.1rem" }}
          >
            {loading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
          </Button>

          <div className="mt-3 d-flex justify-content-center">
            <Button
                variant="outline-primary"
                onClick={() => navigate("/")}
                className="py-2 rounded-pill"
            >
              Về trang chủ
            </Button>
          </div>
        </Form>
      </>
  );
};

export default ResetPasswordPage;