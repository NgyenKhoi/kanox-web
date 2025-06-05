import React, { useState } from "react";
import { Modal, Button, Form, Spinner } from "react-bootstrap";
import { X as XCloseIcon } from "react-bootstrap-icons";
import KLogoSvg from "../../../components/svgs/KSvg";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const apiBase = process.env.REACT_APP_API_URL;

const ForgotPasswordModal = ({ show, handleClose }) => {
  const [identifier, setIdentifier] = useState(""); // Email or username
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // Step 1: Nhập email, Step 2: Xác nhận thành công
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const value = e.target.value;
    setIdentifier(value);
    if (errors.identifier) {
      setErrors((prevErrors) => {
        const newErrors = { ...prevErrors };
        delete newErrors.identifier;
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    let newErrors = {};
    if (!identifier) newErrors.identifier = "Email là bắt buộc.";
    else if (!/\S+@\S+\.\S+/.test(identifier))
      newErrors.identifier = "Email không hợp lệ.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitEmail = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${apiBase}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: identifier }),
      });

      const contentType = response.headers.get("content-type");
      let data;

      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        data = { message: await response.text() };
      }

      if (response.ok) {
        toast.success(
            data.message || "Yêu cầu khôi phục mật khẩu đã được gửi thành công!"
        );
        setStep(2); // Chuyển sang bước 2 để hiển thị thông báo thành công
      } else {
        toast.error(data.message || "Đã xảy ra lỗi. Vui lòng thử lại!");
        if (data.errors && Object.keys(data.errors).length > 0) {
          const errorDetails = Object.values(data.errors).join(", ");
          toast.error(`${data.message} - Chi tiết: ${errorDetails}`);
        }
      }
    } catch (error) {
      toast.error("Lỗi kết nối. Vui lòng thử lại sau!");
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
      <>
        <ToastContainer />
        <Modal show={show} onHide={handleClose} centered size="lg">
          <Modal.Body
              className="p-4 rounded-3"
              style={{ backgroundColor: "#fff", color: "#000", borderRadius: "15px" }}
          >
            <div className="d-flex justify-content-between align-items-center mb-4">
              <Button
                  variant="link"
                  onClick={handleClose}
                  className="p-0"
                  style={{ color: "#000", fontSize: "1.5rem" }}
              >
                <XCloseIcon />
              </Button>
              <div style={{ width: "100px", height: "100px" }}>
                <KLogoSvg className="w-100 h-100" fill="black" />
              </div>
              <div style={{ width: "30px" }}></div>
            </div>

            <h3 className="fw-bold mb-4 text-center">Quên mật khẩu</h3>

            {step === 1 && (
                <Form onSubmit={handleSubmitEmail}>
                  <Form.Group className="mb-4">
                    <Form.Label>Email <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                        type="email"
                        placeholder="Nhập email của bạn"
                        value={identifier}
                        onChange={handleInputChange}
                        className="py-3 px-3 rounded-3"
                        style={{ fontSize: "1.1rem", borderColor: "#ccc" }}
                        isInvalid={!!errors.identifier}
                        disabled={loading}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.identifier}
                    </Form.Control.Feedback>
                  </Form.Group>
                  <Button
                      type="submit"
                      variant="dark"
                      className="py-3 rounded-pill fw-bold w-100"
                      style={{
                        backgroundColor: "#000",
                        borderColor: "#000",
                        fontSize: "1.1rem",
                      }}
                      disabled={loading || !identifier}
                  >
                    {loading ? (
                        <>
                          <Spinner
                              as="span"
                              animation="border"
                              size="sm"
                              role="status"
                              className="me-2"
                          />
                          Đang xử lý...
                        </>
                    ) : (
                        "Gửi yêu cầu"
                    )}
                  </Button>
                </Form>
            )}

            {step === 2 && (
                <div className="text-center">
                  <p className="mb-4" style={{ fontSize: "1.1rem", color: "#000" }}>
                    Yêu cầu khôi phục mật khẩu đã được gửi thành công! Vui lòng kiểm
                    tra email của bạn.
                  </p>
                  <Button
                      variant="dark"
                      className="py-3 rounded-pill fw-bold w-100"
                      style={{
                        backgroundColor: "#000",
                        borderColor: "#000",
                        fontSize: "1.1rem",
                      }}
                      onClick={handleClose}
                  >
                    Đóng
                  </Button>
                </div>
            )}
          </Modal.Body>
        </Modal>
      </>
  );
};

export default ForgotPasswordModal;