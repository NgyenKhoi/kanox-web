import React, { useEffect, useState, useContext } from "react";
import { Container, Row, Col, Button, Spinner } from "react-bootstrap";
import { FcGoogle } from "react-icons/fc";
import { useNavigate } from "react-router-dom";
import CreateAccountModal from "../login/CreateAccountModal";
import LoginModal from "../login/LoginModal";
import Footer from "../../../components/layout/Footer/Footer";
import KLogoSvg from "../../../components/svgs/KSvg";
import { AuthContext } from "../../../context/AuthContext";
import { GoogleLogin } from "@react-oauth/google";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const SignupPage = () => {
  const [showCreateAccountModal, setShowCreateAccountModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, setUser } = useContext(AuthContext);

  useEffect(() => {
    if (user) {
      navigate("/home");
    }
  }, [user, navigate]);

  const handleShowCreateAccountModal = () => setShowCreateAccountModal(true);
  const handleCloseCreateAccountModal = () => setShowCreateAccountModal(false);

  const handleShowLoginModal = () => setShowLoginModal(true);
  const handleCloseLoginModal = () => setShowLoginModal(false);

  const handleGoogleRegisterSuccess = async (credentialResponse) => {
    console.log("Credential Response:", credentialResponse);
    console.log("idToken:", credentialResponse.credential);
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
        setUser(user); // Cập nhật user vào AuthContext
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("token", token);
        toast.success("Đăng ký bằng Google thành công! Đang chuyển hướng...");
        setTimeout(() => navigate("/home"), 2000);
      } else {
        toast.error(data.message || "Đăng ký Google thất bại.");
      }
    } catch (error) {
      toast.error("Lỗi khi đăng ký Google. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegisterError = () => {
    toast.error("Đăng ký Google thất bại hoặc bị hủy.");
  };


  return (
      <Container fluid className="d-flex flex-column min-vh-100 bg-white text-black">
        <ToastContainer />
        <Row className="flex-grow-1 w-100">
          <Col
              xs={12}
              lg={6}
              className="d-flex align-items-center justify-content-center p-3"
          >
            <div style={{ maxWidth: "600px", width: "100%" }}>
              <KLogoSvg className="w-100 h-auto" fill="black" />
            </div>
          </Col>

          <Col
              xs={12}
              lg={6}
              className="d-flex flex-column justify-content-center align-items-start p-4"
          >
            <h1 className="display-4 fw-bold mb-4">Đang diễn ra ngay bây giờ</h1>
            <h2 className="mb-4">Tham gia ngay.</h2>

            <div className="d-flex flex-column gap-3 w-100" style={{ maxWidth: "300px" }}>
              <GoogleLogin
                  onSuccess={handleGoogleRegisterSuccess}
                  onError={handleGoogleRegisterError}
                  useOneTap
                  size="large"
                  shape="pill"
                  text="signup_with"
                  theme="outline"
                  disabled={loading}
              />
              
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

              <p className="text-muted small mt-2">
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

              <h5 className="mt-5 mb-3">Đã có tài khoản?</h5>
              <Button
                  variant="outline-primary"
                  className="py-2 rounded-pill fw-bold"
                  style={{ color: "#1A8CD8", borderColor: "#1A8CD8" }}
                  onClick={handleShowLoginModal}
                  disabled={loading}
              >
                Đăng nhập
              </Button>
            </div>
          </Col>
        </Row>

        <CreateAccountModal show={showCreateAccountModal} handleClose={handleCloseCreateAccountModal} />
        <LoginModal show={showLoginModal} handleClose={handleCloseLoginModal} onShowLogin={handleShowLoginModal} />
        <Footer />
      </Container>
  );
};

export default SignupPage;