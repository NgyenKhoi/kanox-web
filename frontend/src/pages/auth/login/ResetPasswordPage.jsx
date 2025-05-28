import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Form, Button, Alert } from "react-bootstrap";

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!token) {
      setError("Token không hợp lệ hoặc không tồn tại.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      if (res.ok) {
        setMessage("Đặt lại mật khẩu thành công! Bạn có thể đăng nhập lại.");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        const errText = await res.text();
        setError(errText || "Đặt lại mật khẩu thất bại.");
      }
    } catch (e) {
      setError("Đã xảy ra lỗi. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form onSubmit={handleSubmit} style={{ maxWidth: 400, margin: "auto" }}>
      <h3 className="mb-4 text-center">Đặt lại mật khẩu</h3>
      {error && <Alert variant="danger">{error}</Alert>}
      {message && <Alert variant="success">{message}</Alert>}

      <Form.Group className="mb-3">
        <Form.Label>Mật khẩu mới</Form.Label>
        <Form.Control
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
      </Form.Group>

      <Form.Group className="mb-4">
        <Form.Label>Xác nhận mật khẩu</Form.Label>
        <Form.Control
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
      </Form.Group>

      <Button type="submit" variant="dark" disabled={loading} className="w-100">
        {loading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
      </Button>
    </Form>
  );
};

export default ResetPasswordPage;