import React, { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { X as XCloseIcon } from "react-bootstrap-icons";
import { FcGoogle } from "react-icons/fc";
import KLogoSvg from "../../../components/svgs/KSvg";
import CreateAccountModal from "./CreateAccountModal";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const apiBase = process.env.REACT_APP_API_URL;

const JoinXModal = ({ show, handleClose, onShowLoginModal }) => {
  const [showCreateAccountModalFromJoinX, setShowCreateAccountModalFromJoinX] =
    useState(false);
  const [loading, setLoading] = useState(false);

  const handleShowCreateAccountModalFromJoinX = () => {
    handleClose();
    setShowCreateAccountModalFromJoinX(true);
  };

  const handleCloseCreateAccountModalFromJoinX = () =>
    setShowCreateAccountModalFromJoinX(false);

  const handleLoginClick = () => {
    handleClose();
    if (onShowLoginModal) {
      onShowLoginModal();
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      // Giả định đây là logic gọi OAuth2 Google (cần tích hợp thư viện như @react-oauth/google)
      // Tạm thời giả lập gọi API backend
      const response = await fetch(`${apiBase}/auth/google-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Body sẽ chứa credential từ Google nếu dùng thư viện OAuth
      });

      const contentType = response.headers.get("content-type");
      let data;

      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        data = { message: await response.text() };
      }

      if (response.ok) {
        toast.success(data.message || "Đăng nhập bằng Google thành công!");
        handleClose();
      } else {
        toast.error(data.message || "Đăng nhập bằng Google thất bại!");
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

  return (
    <>
      <ToastContainer />
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

          <h3 className="fw-bold mb-4 text-center">
            Tham gia KaNox ngay hôm nay
          </h3>

          <div
            className="d-flex flex-column gap-3 mx-auto"
            style={{ maxWidth: "300px" }}
          >
            <Button
              variant="outline-secondary"
              className="d-flex align-items-center justify-content-center py-2 rounded-pill fw-bold"
              style={{ borderColor: "#e0e0e0", color: "#000" }}
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              <span
                className="bg-light rounded-circle p-1 me-2 d-flex align-items-center justify-content-center"
                style={{ width: "30px", height: "30px" }}
              >
                <FcGoogle size={20} />
              </span>
              {loading ? "Đang xử lý..." : "Đăng nhập với Google"}
            </Button>

            <div className="d-flex align-items-center my-3">
              <hr className="flex-grow-1 border-secondary" />
              <span className="mx-2 text-muted">hoặc</span>
              <hr className="flex-grow-1 border-secondary" />
            </div>

            <Button
              variant="dark"
              className="py-3 rounded-pill fw-bold"
              style={{ backgroundColor: "#000", borderColor: "#000" }}
              onClick={handleShowCreateAccountModalFromJoinX}
              disabled={loading}
            >
              Tạo tài khoản
            </Button>

            <p className="text-muted small mt-2 text-center">
              Khi đăng ký, bạn đã đồng ý với{" "}
              <a
                href="/terms"
                className="text-decoration-none"
                style={{ color: "#1A8CD8" }}
              >
                Điều khoản Dịch vụ
              </a>{" "}
              và{" "}
              <a
                href="privacy"
                className="text-decoration-none"
                style={{ color: "#1A8CD8" }}
              >
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

      <CreateAccountModal
        show={showCreateAccountModalFromJoinX}
        handleClose={handleCloseCreateAccountModalFromJoinX}
      />
    </>
  );
};

export default JoinXModal;
