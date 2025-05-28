import React, { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { X as XCloseIcon } from "react-bootstrap-icons";
import { FcGoogle } from "react-icons/fc";
import { FaApple } from "react-icons/fa";
import ForgotPasswordModal from "./ForgotPasswordModal";
import JoinXModal from "./JoinXModal";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import KLogoSvg from "../../../components/svgs/KSvg";

// Nhận prop onShowLogin từ SignupPage
const LoginModal = ({ show, handleClose, onShowLogin }) => {
  const navigate = useNavigate(); // Khởi tạo useNavigate

  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [showJoinXModal, setShowJoinXModal] = useState(false);

  const handleInputChange = (e) => {
    setLoginIdentifier(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          identifier: loginIdentifier,
          password: password,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const { token, user } = data;

        localStorage.setItem("token", token);
        localStorage.setItem("username", data.user.username);
        console.log("User:", user);

        handleClose();
        navigate("/home");
      } else {
        const error = await response.text();
        alert("Login failed: " + error);
      }
    } catch (err) {
      console.error("Login error:", err);
      alert("Có lỗi xảy ra khi đăng nhập.");
    }
  };

  const handleShowForgotPasswordModal = () => {
    handleClose(); // Close LoginModal before opening forgot password modal
    setShowForgotPasswordModal(true);
  };
  const handleCloseForgotPasswordModal = () =>
    setShowForgotPasswordModal(false);

  const handleShowJoinXModal = () => {
    handleClose(); // Close LoginModal before opening JoinXModal
    setShowJoinXModal(true);
  };
  const handleCloseJoinXModal = () => setShowJoinXModal(false);

  return (
    <>
      <Modal show={show} onHide={handleClose} centered size="lg">
        <Modal.Body
          className="p-4 rounded-3"
          style={{
            backgroundColor: "#fff",
            color: "#000",
            borderRadius: "15px",
          }}
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

          <h3 className="fw-bold mb-4 text-center">Đăng nhập vào KaNox</h3>

          <div
            className="d-flex flex-column gap-3 mx-auto"
            style={{ maxWidth: "300px" }}
          >
            <Button
              variant="outline-secondary"
              className="d-flex align-items-center justify-content-center py-2 rounded-pill fw-bold"
              style={{ borderColor: "#e0e0e0", color: "#000" }}
            >
              <span
                className="bg-light rounded-circle p-1 me-2 d-flex align-items-center justify-content-center"
                style={{ width: "30px", height: "30px" }}
              >
                <FcGoogle size={20} />
              </span>
              Đăng nhập với Google
              <span
                className="ms-1 text-muted"
                style={{ fontSize: "0.9rem" }}
              ></span>
            </Button>

            <div className="d-flex align-items-center my-3">
              <hr className="flex-grow-1 border-secondary" />
              <span className="mx-2 text-muted">hoặc</span>
              <hr className="flex-grow-1 border-secondary" />
            </div>

            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Control
                  type="text"
                  placeholder="Số điện thoại, email hoặc tên người dùng"
                  name="loginIdentifier"
                  value={loginIdentifier}
                  onChange={handleInputChange}
                  className="py-3 px-3 rounded-3"
                  style={{ fontSize: "1.1rem", borderColor: "#ccc" }}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Control
                  type="password"
                  placeholder="Mật khẩu"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="py-3 px-3 rounded-3"
                  style={{ fontSize: "1.1rem", borderColor: "#ccc" }}
                />
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
                disabled={!loginIdentifier || !password}
              >
                Tiếp theo
              </Button>
            </Form>

            <Button
              variant="outline-secondary"
              className="py-3 rounded-pill fw-bold w-100 mt-2"
              style={{ borderColor: "#e0e0e0", color: "#000" }}
              onClick={handleShowForgotPasswordModal}
            >
              Quên mật khẩu?
            </Button>

            <p className="text-muted small mt-5 text-center">
              Không có tài khoản?{" "}
              <Button
                variant="link"
                className="p-0 fw-bold text-decoration-none"
                style={{ color: "#1A8CD8" }}
                onClick={handleShowJoinXModal}
              >
                Đăng ký
              </Button>
            </p>
          </div>
        </Modal.Body>
      </Modal>

      <ForgotPasswordModal
        show={showForgotPasswordModal}
        handleClose={handleCloseForgotPasswordModal}
      />

      {/* Truyền onShowLogin xuống JoinXModal */}
      <JoinXModal
        show={showJoinXModal}
        handleClose={handleCloseJoinXModal}
        onShowLoginModal={onShowLogin} // THAY ĐỔI QUAN TRỌNG: Truyền hàm mở LoginModal
      />
    </>
  );
};

export default LoginModal;
