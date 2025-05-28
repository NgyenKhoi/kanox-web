import React, { useState } from "react";
import { Container, Row, Col, Button } from "react-bootstrap";
import { FcGoogle } from "react-icons/fc";
import { FaApple } from "react-icons/fa";
import CreateAccountModal from "../login/CreateAccountModal";
import LoginModal from "../login/LoginModal";
import Footer from "../../../components/layout/Footer/Footer";

import KLogoSvg from "../../../components/svgs/KSvg"; // Đảm bảo đường dẫn này chính xác

const SignupPage = () => {
  const [showCreateAccountModal, setShowCreateAccountModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleShowCreateAccountModal = () => setShowCreateAccountModal(true);
  const handleCloseCreateAccountModal = () => setShowCreateAccountModal(false);

  const handleShowLoginModal = () => setShowLoginModal(true);
  const handleCloseLoginModal = () => setShowLoginModal(false);

  return (
    <Container
      fluid
      className="d-flex flex-column min-vh-100 bg-white text-black"
    >
      <Row className="flex-grow-1 w-100">
        {/* Left Section - K Logo */}
        <Col
          xs={12}
          lg={6}
          className="d-flex align-items-center justify-content-center p-3"
        >
          <div style={{ maxWidth: "600px", width: "100%" }}>
            <KLogoSvg className="w-100 h-auto" fill="black" />
          </div>
        </Col>

        {/* Right Section - Signup Form */}
        <Col
          xs={12}
          lg={6}
          className="d-flex flex-column justify-content-center align-items-start p-4"
        >
          <h1 className="display-4 fw-bold mb-4">Đang diễn ra ngay bây giờ</h1>
          <h2 className="mb-4">Tham gia ngay.</h2>

          <div
            className="d-flex flex-column gap-3 w-100"
            style={{ maxWidth: "300px" }}
          >
            <Button
              variant="outline-dark"
              className="d-flex align-items-center justify-content-center py-2 rounded-pill fw-bold"
            >
              <FcGoogle className="me-2" size={24} />
              Đăng nhập với Google
              <span className="ms-1" style={{ color: "#888" }}></span>
            </Button>

            <div className="d-flex align-items-center my-3">
              <hr className="flex-grow-1 border-secondary" />
              <span className="mx-2 text-muted">HOẶC</span>
              <hr className="flex-grow-1 border-secondary" />
            </div>

            <Button
              variant="primary"
              className="py-2 rounded-pill fw-bold"
              style={{ backgroundColor: "#1A8CD8", borderColor: "#1A8CD8" }}
              onClick={handleShowCreateAccountModal}
            >
              Tạo tài khoản
            </Button>

            <p className="text-muted small mt-2">
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

            <h5 className="mt-5 mb-3">Đã có tài khoản?</h5>
            <Button
              variant="outline-primary"
              className="py-2 rounded-pill btn-white-border fw-bold"
              style={{ color: "#1A8CD8", borderColor: "#1A8CD8" }}
              onClick={handleShowLoginModal}
            >
              Đăng nhập
            </Button>
          </div>
        </Col>
      </Row>

      <CreateAccountModal
        show={showCreateAccountModal}
        handleClose={handleCloseCreateAccountModal}
      />

      {/* Truyền handleShowLoginModal xuống LoginModal */}
      <LoginModal
        show={showLoginModal}
        handleClose={handleCloseLoginModal}
        onShowLogin={handleShowLoginModal} // THAY ĐỔI QUAN TRỌNG: Truyền hàm mở LoginModal
      />

      <Footer />
    </Container>
  );
};

export default SignupPage;
