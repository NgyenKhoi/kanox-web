import React, { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { X as XCloseIcon } from "react-bootstrap-icons";
import { FcGoogle } from "react-icons/fc";
import { FaApple } from "react-icons/fa";
import KLogoSvg from "../../../components/svgs/KSvg";
import CreateAccountModal from "./CreateAccountModal";

// Nhận prop onShowLoginModal
const JoinXModal = ({ show, handleClose, onShowLoginModal }) => {
  const [showCreateAccountModalFromJoinX, setShowCreateAccountModalFromJoinX] =
    useState(false);

  const handleShowCreateAccountModalFromJoinX = () => {
    handleClose(); // Close JoinXModal before opening CreateAccountModal
    setShowCreateAccountModalFromJoinX(true);
  };
  const handleCloseCreateAccountModalFromJoinX = () =>
    setShowCreateAccountModalFromJoinX(false);

  // Hàm xử lý khi bấm nút "Đăng nhập"
  const handleLoginClick = () => {
    handleClose(); // Đóng JoinXModal
    if (onShowLoginModal) {
      onShowLoginModal(); // GỌI HÀM ĐỂ MỞ LẠI LOGINMODAL
    }
  };

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

            <Button
              variant="dark"
              className="py-3 rounded-pill fw-bold"
              style={{ backgroundColor: "#000", borderColor: "#000" }}
              onClick={handleShowCreateAccountModalFromJoinX}
            >
              Tạo tài khoản
            </Button>

            <p className="text-muted small mt-2 text-center">
              Khi đăng ký, bạn đã đồng ý với{" "}
              <a
                href="#"
                className="text-decoration-none"
                style={{ color: "#1A8CD8" }}
              >
                Điều khoản Dịch vụ
              </a>{" "}
              và{" "}
              <a
                href="#"
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
