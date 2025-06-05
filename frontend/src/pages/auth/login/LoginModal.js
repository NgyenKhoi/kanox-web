import React, { useState, useContext } from "react";
import { Modal, Button, Form, Spinner } from "react-bootstrap";
import { X as XCloseIcon } from "react-bootstrap-icons";
import ForgotPasswordModal from "./ForgotPasswordModal";
import JoinXModal from "./JoinXModal";
import { useNavigate } from "react-router-dom";
import KLogoSvg from "../../../components/svgs/KSvg";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { GoogleLogin } from "@react-oauth/google";
import { AuthContext } from "../../../context/AuthContext";

const LoginModal = ({ show, handleClose, onShowLogin }) => {
  const { setUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [showJoinXModal, setShowJoinXModal] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "loginIdentifier") setLoginIdentifier(value);
    else if (name === "password") setPassword(value);
    if (errors[name]) {
      setErrors((prevErrors) => {
        const newErrors = { ...prevErrors };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleRememberMeChange = (e) => {
    setRememberMe(e.target.checked);
  };

  const validateForm = () => {
    let newErrors = {};
    if (!loginIdentifier)
      newErrors.loginIdentifier =
        "Email, số điện thoại hoặc tên người dùng là bắt buộc.";
    if (!password) newErrors.password = "Mật khẩu là bắt buộc.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            identifier: loginIdentifier,
            password: password,
          }),
        }
      );

      const contentType = response.headers.get("content-type");
      let data;
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        data = { message: await response.text() };
      }

      if (response.ok) {
        const { token, user } = data;
        setUser(user);
        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem("user", JSON.stringify(user));
        storage.setItem("token", token);
        toast.success("Đăng nhập thành công! Đang chuyển hướng...");
        handleClose();
        setTimeout(() => navigate("/home"), 2000);
      } else {
        toast.error(data.message || "Đăng nhập thất bại. Vui lòng thử lại!");
      }
    } catch (err) {
      toast.error("Lỗi kết nối. Vui lòng thử lại sau!");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLoginSuccess = async (credentialResponse) => {
    setLoading(true);
    try {
      const idToken = credentialResponse.credential;
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/auth/login-google`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken }),
        }
      );

      const data = await response.json();
      if (response.ok) {
        const { token, user } = data;
        const storage = rememberMe ? localStorage : sessionStorage; // <-- sửa ở đây
        storage.setItem("user", JSON.stringify(user));
        storage.setItem("token", token);
        toast.success("Đăng nhập bằng Google thành công! Đang chuyển hướng...");
        handleClose();
        setTimeout(() => navigate("/home"), 2000);
      } else {
        toast.error(data.message || "Đăng nhập Google thất bại.");
      }
    } catch (error) {
      toast.error("Lỗi đăng nhập Google. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLoginError = () => {
    toast.error("Đăng nhập Google thất bại hoặc bị hủy.");
  };

  const handleShowForgotPasswordModal = () => {
    handleClose();
    setShowForgotPasswordModal(true);
  };

  const handleCloseForgotPasswordModal = () =>
    setShowForgotPasswordModal(false);

  const handleShowJoinXModal = () => {
    handleClose();
    setShowJoinXModal(true);
  };

  const handleCloseJoinXModal = () => setShowJoinXModal(false);

  return (
    <>
      <ToastContainer />
      <Modal show={show} onHide={handleClose} centered size="lg">
        <Modal.Body
          className="p-4 rounded-3"
          style={{ backgroundColor: "#fff", color: "#000" }}
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
            <GoogleLogin
              onSuccess={handleGoogleLoginSuccess}
              onError={handleGoogleLoginError}
              useOneTap
              size="large"
              shape="pill"
              text="continue_with"
              theme="outline"
              disabled={loading}
            />

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
                  isInvalid={!!errors.loginIdentifier}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.loginIdentifier}
                </Form.Control.Feedback>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Control
                  type="password"
                  placeholder="Mật khẩu"
                  name="password"
                  value={password}
                  onChange={handleInputChange}
                  className="py-3 px-3 rounded-3"
                  style={{ fontSize: "1.1rem", borderColor: "#ccc" }}
                  isInvalid={!!errors.password}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.password}
                </Form.Control.Feedback>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  id="rememberMe"
                  label="Ghi nhớ đăng nhập"
                  checked={rememberMe}
                  onChange={handleRememberMeChange}
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
                disabled={loading}
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
                  "Tiếp theo"
                )}
              </Button>
            </Form>

            <Button
              variant="outline-secondary"
              className="py-3 rounded-pill fw-bold w-100 mt-2"
              style={{ borderColor: "#e0e0e0", color: "#000" }}
              onClick={handleShowForgotPasswordModal}
              disabled={loading}
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
                disabled={loading}
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
      <JoinXModal
        show={showJoinXModal}
        handleClose={handleCloseJoinXModal}
        onShowLoginModal={onShowLogin}
      />
    </>
  );
};

export default LoginModal;
