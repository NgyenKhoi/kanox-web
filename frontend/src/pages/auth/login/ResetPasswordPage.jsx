import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Form, Button, Container, Row, Col, Spinner } from "react-bootstrap";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    let newErrors = {};
    if (!newPassword) newErrors.newPassword = "Mật khẩu mới là bắt buộc.";
    else if (!/^(?=.*[A-Z])(?=.*[!@#$%^&*()_+=.])(?=.{8,}).*$/.test(newPassword))
      newErrors.newPassword =
          "Mật khẩu phải dài ít nhất 8 ký tự, chứa ít nhất 1 chữ cái in hoa và 1 ký tự đặc biệt.";
    if (newPassword !== confirmPassword)
      newErrors.confirmPassword = "Mật khẩu xác nhận không khớp.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!token) {
      toast.error("Token không hợp lệ hoặc không tồn tại.");
      setLoading(false);
      return;
    }

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Đặt lại mật khẩu thành công! Đang chuyển hướng...");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => navigate("/"), 2000);
      } else {
        toast.error(data.message || "Đặt lại mật khẩu thất bại.");
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
        <Container fluid className="d-flex flex-column min-vh-100 bg-light text-black">
          <Row className="flex-grow-1 justify-content-center align-items-center">
            <Col xs={12} sm={10} md={8} lg={6} xl={5} className="p-4">
              <h3 className="mb-4 text-center">Đặt lại mật khẩu</h3>
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Mật khẩu mới <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      placeholder="Nhập mật khẩu mới"
                      className="py-3 px-3 rounded-3"
                      style={{ fontSize: "1.1rem", borderColor: "#ccc" }}
                      isInvalid={!!errors.newPassword}
                  />
                  <Form.Control.Feedback type="invalid">{errors.newPassword}</Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>Xác nhận mật khẩu <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="Xác nhận mật khẩu"
                      className="py-3 px-3 rounded-3"
                      style={{ fontSize: "1.1rem", borderColor: "#ccc" }}
                      isInvalid={!!errors.confirmPassword}
                  />
                  <Form.Control.Feedback type="invalid">{errors.confirmPassword}</Form.Control.Feedback>
                </Form.Group>

                <Button
                    type="submit"
                    variant="dark"
                    disabled={loading}
                    className="w-100 py-3 rounded-pill fw-bold"
                    style={{ backgroundColor: "#000", borderColor: "#000", fontSize: "1.1rem" }}
                >
                  {loading ? (
                      <>
                        <Spinner as="span" animation="border" size="sm" role="status" className="me-2" />
                        Đang xử lý...
                      </>
                  ) : (
                      "Đặt lại mật khẩu"
                  )}
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
            </Col>
          </Row>
        </Container>
      </>
  );
};

export default ResetPasswordPage;