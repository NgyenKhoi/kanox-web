import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Container, Row, Col, Spinner } from "react-bootstrap";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      toast.error("Không tìm thấy token xác thực.");
      navigate("/");
      return;
    }

    const verifyToken = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/auth/verify-token?token=${token}`, {
          method: "POST",
        });

        const data = await res.json();
        if (res.ok) {
          toast.success(data.message || "Xác thực tài khoản thành công!");
          setVerified(true);
          setTimeout(() => navigate("/home"), 2000);
        } else {
          toast.error(data.message || "Xác thực thất bại.");
        }
      } catch (err) {
        console.error("Lỗi xác thực:", err);
        toast.error("Lỗi kết nối đến máy chủ.");
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();
  }, [searchParams, navigate]);

  return (
      <Container fluid className="d-flex flex-column min-vh-100 bg-light text-black">
        <ToastContainer />
        <Row className="flex-grow-1 justify-content-center align-items-center">
          <Col xs={12} sm={10} md={8} lg={6} xl={5} className="text-center">
            {verifying ? (
                <div>
                  <Spinner animation="border" role="status" className="mb-3" />
                  <h3>Đang xác thực tài khoản...</h3>
                </div>
            ) : verified ? (
                <h3>✅ Tài khoản đã được xác thực! Đang chuyển hướng...</h3>
            ) : (
                <h3>❌ Xác thực thất bại.</h3>
            )}
          </Col>
        </Row>
      </Container>
  );
};

export default VerifyEmailPage;