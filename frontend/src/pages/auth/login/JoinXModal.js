import React, { useState, useContext } from "react";
import { Modal, Button, Spinner } from "react-bootstrap";
import { X as XCloseIcon } from "react-bootstrap-icons";
import KLogoSvg from "../../../components/svgs/KSvg";
import CreateAccountModal from "./CreateAccountModal";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../../context/AuthContext";

const JoinXModal = ({ show, handleClose, onShowLoginModal }) => {
  const { setUser } = useContext(AuthContext);
  const [showCreateAccountModal, setShowCreateAccountModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const openCreateAccountModal = () => {
    handleClose();
    setShowCreateAccountModal(true);
  };

  const closeCreateAccountModal = () => setShowCreateAccountModal(false);

  const handleLoginClick = () => {
    handleClose();
    if (onShowLoginModal) {
      onShowLoginModal();
    }
  };

  const handleGoogleLoginSuccess = async (credentialResponse) => {
    setLoading(true);
    try {
      const idToken = credentialResponse.credential;
      const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/login-google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      const data = await response.json();
      if (response.ok) {
        const { token, user } = data;
        setUser(user);
        localStorage.setItem("user", JSON.stringify(user)); // ✅ Không phụ thuộc rememberMe
        localStorage.setItem("token", token);

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

  return (
      <>
        <ToastContainer />
        <Modal show={show} onHide={handleClose} centered size="lg">
          <Modal.Body className="p-4 rounded-3" style={{ backgroundColor: "#fff", color: "#000" }}>
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

            <h3 className="fw-bold mb-4 text-center">Tham gia KaNox ngay hôm nay</h3>

            <div className="d-flex flex-column gap-3 mx-auto" style={{ maxWidth: "300px" }}>
              <GoogleLogin
                  onSuccess={handleGoogleLoginSuccess}
                  onError={handleGoogleLoginError}
                  useOneTap
                  size="large"
                  shape="pill"
                  text="signup_with"
                  theme="outline"
                  disabled={loading}
              />

              <div className="d-flex align-items-center my-3">
                <hr className="flex-grow-1 border-secondary" />
                <span className="mx-2 text-muted">hoặc</span>
                <hr className="flex-grow-1 border-secondary" />
              </div>

              <Button
                  variant="dark"
                  className="py-3 rounded-pill fw-bold"
                  style={{ backgroundColor: "#000", borderColor: "#000" }}
                  onClick={openCreateAccountModal}
                  disabled={loading}
              >
                {loading ? (
                    <>
                      <Spinner as="span" animation="border" size="sm" role="status" className="me-2" />
                      Đang xử lý...
                    </>
                ) : (
                    "Tạo tài khoản"
                )}
              </Button>

              <p className="text-muted small mt-2 text-center">
                Khi đăng ký, bạn đã đồng ý với{" "}
                <a href="/terms" className="text-decoration-none" style={{ color: "#1A8CD8" }}>
                  Điều khoản Dịch vụ
                </a>{" "}
                và{" "}
                <a href="/privacy" className="text-decoration-none" style={{ color: "#1A8CD8" }}>
                  Chính sách Quyền riêng tư
                </a>
                , gồm cả Sử dụng Cookie.
              </p>

              <h5 className="mt-5 mb-3 text-center">Bạn đã có tài khoản?</h5>
              <Button
                  variant="outline-primary"
                  className="py-2 rounded-pill fw-bold"
                  style={{ color: "#1A8CD8", borderColor: "#1A8CD8" }}
                  onClick={handleLoginClick}
                  disabled={loading}
              >
                Đăng nhập
              </Button>
            </div>
          </Modal.Body>
        </Modal>

        <CreateAccountModal show={showCreateAccountModal} handleClose={closeCreateAccountModal} />
      </>
  );
};

export default JoinXModal;