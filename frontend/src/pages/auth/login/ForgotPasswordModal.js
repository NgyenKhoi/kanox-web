import React, { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { X as XCloseIcon } from "react-bootstrap-icons";
import KLogoSvg from "../../../components/svgs/KSvg"; // Logo SVG KaNox

const ForgotPasswordModal = ({ show, handleClose }) => {
  const [step, setStep] = useState(1);
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleInputChange = (e) => {
    setIdentifier(e.target.value);
  };
  const handleSubmitEmail = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/auth/forgot-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: identifier }),
        }
      );

      if (response.ok) {
        setStep(2); // Show confirmation message
      } else {
        const errorText = await response.text();
        setErrorMsg(errorText || "Gửi yêu cầu thất bại.");
      }
    } catch (error) {
      console.error("Lỗi khi gửi yêu cầu đặt lại mật khẩu:", error);
      setErrorMsg("Đã xảy ra lỗi. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  const onClose = () => {
    handleClose();
    setStep(1);
    setIdentifier("");
    setErrorMsg("");
    setLoading(false);
  };

  return (
    <Modal show={show} onHide={onClose} centered size="lg">
      <Modal.Body className="p-4 rounded-3" style={{ backgroundColor: "#fff", color: "#000", borderRadius: "15px" }}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <Button variant="link" onClick={onClose} className="p-0" style={{ color: "#000", fontSize: "1.5rem" }}>
            <XCloseIcon />
          </Button>
          <div style={{ width: "100px", height: "100px" }}>
            <KLogoSvg className="w-100 h-100" fill="black" />
          </div>
          <div style={{ width: "30px" }}></div>
        </div>

        {step === 1 && (
          <>
            <h3 className="fw-bold mb-2 text-center">Tìm tài khoản KaNox của bạn</h3>
            <p className="text-muted small mb-4 text-center">
              Nhập email liên kết với tài khoản để thay đổi mật khẩu của bạn.
            </p>
            {errorMsg && <p className="text-danger text-center mb-3">{errorMsg}</p>}
            <Form onSubmit={handleSubmitEmail} className="mx-auto" style={{ maxWidth: "300px" }}>
              <Form.Group className="mb-5">
                <Form.Control
                  type="email"
                  placeholder="Email của bạn"
                  value={identifier}
                  onChange={handleInputChange}
                  className="py-3 px-3 rounded-3"
                  style={{ fontSize: "1.1rem", borderColor: "#ccc" }}
                  required
                />
              </Form.Group>
              <Button
                type="submit"
                variant="dark"
                className="py-3 rounded-pill fw-bold w-100"
                style={{ fontSize: "1.2rem" }}
                disabled={!identifier || loading}
              >
                {loading ? "Đang gửi..." : "Tiếp theo"}
              </Button>
            </Form>
          </>
        )}

        {step === 2 && (
          <>
            <h3 className="fw-bold mb-2 text-center">Đã gửi email đặt lại mật khẩu</h3>
            <p className="text-muted small mb-4 text-center">
              Hãy kiểm tra email của bạn và nhấp vào liên kết đặt lại mật khẩu để tiếp tục.
            </p>
            <div className="text-center">
              <Button variant="dark" onClick={onClose} className="mt-3">Đóng</Button>
            </div>
          </>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default ForgotPasswordModal;