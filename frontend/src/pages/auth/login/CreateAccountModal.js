import React, { useState } from "react";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";
import KLogoSvg from "../../../components/svgs/KSvg";
import { X as XCloseIcon } from "react-bootstrap-icons";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const apiBase = process.env.REACT_APP_API_URL;

const CreateAccountModal = ({ show, handleClose }) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    month: "",
    day: "",
    year: "",
  });

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`${apiBase}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          month: parseInt(formData.month),
          day: parseInt(formData.day),
          year: parseInt(formData.year),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Đăng ký thành công! Đang chuyển hướng...");
        handleClose();
        setTimeout(() => navigate("/home"), 2000); // Delay for toast visibility
      } else {
        toast.error(data.message || "Đăng ký thất bại. Vui lòng thử lại!");
        if (data.errors) {
          const errorDetails = Object.values(data.errors).join(", ");
          toast.error(`${data.message} - Chi tiết: ${errorDetails}`);
        }
      }
    } catch (error) {
      toast.error("Lỗi kết nối. Vui lòng thử lại sau!");
    }
  };

  const months = Array.from({ length: 12 }, (_, i) =>
      new Date(0, i).toLocaleString("vi-VN", { month: "long" })
  );
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

  return (
      <>
        <ToastContainer />
        <Modal show={show} onHide={handleClose} centered size="lg">
          <Modal.Body
              className="p-4 rounded-3"
              style={{ backgroundColor: "#fff", color: "#000", borderRadius: "15px" }}
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

            <h3 className="fw-bold mb-4">Tạo tài khoản của bạn</h3>

            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Control
                    type="text"
                    placeholder="Tên"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="py-3 px-3 rounded-3"
                    style={{ fontSize: "1.1rem" }}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Control
                    type="email"
                    placeholder="Email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="py-3 px-3 rounded-3"
                    style={{ fontSize: "1.1rem" }}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Control
                    type="password"
                    placeholder="Mật khẩu"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="py-3 px-3 rounded-3"
                    style={{ fontSize: "1.1rem" }}
                />
              </Form.Group>

              <h5 className="mt-4 mb-2 fw-bold">Ngày sinh</h5>
              <p className="text-muted small mb-4">
                Điều này sẽ không được hiển thị công khai. Xác nhận tuổi của bạn,
                ngay cả khi tài khoản này dành cho doanh nghiệp, thú cưng hoặc thứ
                gì khác.
              </p>

              <Row className="mb-4">
                <Col>
                  <Form.Select
                      name="month"
                      value={formData.month}
                      onChange={handleInputChange}
                      className="py-3 rounded-3"
                      style={{ fontSize: "1.1rem" }}
                  >
                    <option value="">Tháng</option>
                    {months.map((month, index) => (
                        <option key={index} value={index + 1}>
                          {month}
                        </option>
                    ))}
                  </Form.Select>
                </Col>
                <Col>
                  <Form.Select
                      name="day"
                      value={formData.day}
                      onChange={handleInputChange}
                      className="py-3 rounded-3"
                      style={{ fontSize: "1.1rem" }}
                  >
                    <option value="">Ngày</option>
                    {days.map((day) => (
                        <option key={day} value={day}>
                          {day}
                        </option>
                    ))}
                  </Form.Select>
                </Col>
                <Col>
                  <Form.Select
                      name="year"
                      value={formData.year}
                      onChange={handleInputChange}
                      className="py-3 rounded-3"
                      style={{ fontSize: "1.1rem" }}
                  >
                    <option value="">Năm</option>
                    {years.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                    ))}
                  </Form.Select>
                </Col>
              </Row>

              <div className="d-grid gap-2 mt-5">
                <Button
                    type="submit"
                    variant="dark"
                    className="py-3 rounded-pill fw-bold"
                    style={{
                      backgroundColor: "#000",
                      borderColor: "#000",
                      fontSize: "1.2rem",
                    }}
                    disabled={
                        !formData.username ||
                        !formData.email ||
                        !formData.password ||
                        !formData.month ||
                        !formData.day ||
                        !formData.year
                    }
                >
                  Tiếp theo
                </Button>
              </div>
            </Form>
          </Modal.Body>
        </Modal>
      </>
  );
};

export default CreateAccountModal;