import React, { useState, useContext, useEffect, useCallback } from "react";
import { Modal, Button, Form, Spinner } from "react-bootstrap";
import { X as XCloseIcon } from "react-bootstrap-icons";
import ForgotPasswordModal from "./ForgotPasswordModal";
import CreateAccountModal from "./CreateAccountModal";
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
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [showCreateAccountModal, setShowCreateAccountModal] = useState(false);

  useEffect(() => {
    if (!show) {
      setLoginIdentifier("");
      setPassword("");
      setRememberMe(false);
      setErrors({});
      setLoading(false);
    }
  }, [show]);

  const handleInputChange = useCallback(
      (e) => {
        const { name, value } = e.target;
        if (name === "loginIdentifier") setLoginIdentifier(value);
        if (name === "password") setPassword(value);

        if (errors[name]) {
          setErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors[name];
            return newErrors;
          });
        }
      },
      [errors]
  );

  const validateForm = () => {
    const newErrors = {};
    if (!loginIdentifier)
      newErrors.loginIdentifier =
          "Email, số điện thoại hoặc tên người dùng là bắt buộc.";
    if (!password) newErrors.password = "Mật khẩu là bắt buộc.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const storeUserSession = (user, token, refreshToken, remember) => {
    setUser(user, token, refreshToken);
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem("token", token);
    storage.setItem("refreshToken", refreshToken);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: loginIdentifier, password }),
      });

      const contentType = res.headers.get("content-type");
      const data = contentType?.includes("application/json")
          ? await res.json()
          : { message: await res.text() || "Lỗi không xác định từ máy chủ" };

      if (res.ok) {
        storeUserSession(data.user, data.token, data.refreshToken, rememberMe);
        toast.success("Đăng nhập thành công! Đang chuyển hướng...");
        handleClose();
        setTimeout(() => {
          if (data.user?.isAdmin) {
            navigate("/admin");
          } else {
            navigate("/home");
          }
        }, 2000);
      } else {
        const errorMessage = data.message || "Đăng nhập thất bại. Vui lòng kiểm tra thông tin đăng nhập!";
        toast.error(errorMessage);
      }
    } catch (error) {
      toast.error("Lỗi kết nối đến máy chủ. Vui lòng thử lại sau!");
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLoginSuccess = async ({ credential }) => {
    setLoading(true);
    try {
      const res = await fetch(
          `${process.env.REACT_APP_API_URL}/auth/login-google`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken: credential }),
          }
      );

      const data = await res.json();
      if (res.ok) {
        storeUserSession(data.user, data.token, data.refreshToken, true);
        toast.success("Đăng nhập bằng Google thành công! Đang chuyển hướng...");
        handleClose();
        setTimeout(() => navigate("/home"), 2000);
      } else {
        const errorMessage = data.error || data.message || "Đăng nhập Google thất bại.";
        toast.error(errorMessage);
      }
    } catch (error) {
      toast.error("Lỗi đăng nhập Google. Vui lòng thử lại.");
      console.error("Google login error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
      <>
        <ToastContainer />
        <Modal show={show} onHide={handleClose} centered size="lg">
          <Modal.Body className="p-4 rounded-3 bg-white text-black">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <Button
                  variant="link"
                  onClick={handleClose}
                  className="p-0 text-black fs-3"
              >
                <XCloseIcon />
              </Button>
              <div style={{ width: 100, height: 100 }}>
                <KLogoSvg className="w-100 h-100" fill="black" />
              </div>
              <div style={{ width: 30 }}></div>
            </div>

            <h3 className="fw-bold mb-4 text-center">Đăng nhập vào KaNox</h3>

            <div
                className="d-flex flex-column gap-3 mx-auto"
                style={{ maxWidth: 300 }}
            >
              <GoogleLogin
                  onSuccess={handleGoogleLoginSuccess}
                  onError={() =>
                      toast.error("Đăng nhập Google thất bại hoặc bị hủy.")
                  }
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
                      isInvalid={Boolean(errors.loginIdentifier)}
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
                      isInvalid={Boolean(errors.password)}
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
                      onChange={(e) => setRememberMe(e.target.checked)}
                  />
                </Form.Group>

                <Button
                    type="submit"
                    variant="dark"
                    className="py-3 rounded-pill fw-bold w-100"
                    style={{ fontSize: "1.1rem" }}
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
                  onClick={() => {
                    handleClose();
                    setShowForgotPasswordModal(true);
                  }}
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
                    onClick={() => {
                      handleClose();
                      setShowCreateAccountModal(true);
                    }}
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
            handleClose={() => setShowForgotPasswordModal(false)}
        />
        <CreateAccountModal
            show={showCreateAccountModal}
            handleClose={() => setShowCreateAccountModal(false)}
        />
      </>
  );
};

export default LoginModal;