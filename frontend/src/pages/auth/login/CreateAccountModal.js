import React, { useState } from "react";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";
import KLogoSvg from "../../../components/svgs/KSvg"; // Assuming XSvg is in the same 'components' directory
import { X as XCloseIcon } from "react-bootstrap-icons"; // For the close icon
import { useNavigate } from "react-router-dom"; // Import useNavigate

const CreateAccountModal = ({ show, handleClose }) => {
  const navigate = useNavigate(); // Khởi tạo useNavigate

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
      const response = await fetch("http://localhost:9090/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          month: parseInt(formData.month),
          day: parseInt(formData.day),
          year: parseInt(formData.year),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Register success:", data);
        handleClose();
        navigate("/home"); // Điều hướng sau đăng ký thành công
      } else {
        const error = await response.text();
        alert("Đăng ký thất bại: " + error);
      }
    } catch (error) {
      console.error("Error registering:", error);
      alert("Có lỗi xảy ra khi đăng ký.");
    }
  };

  // Generate options for Month, Day, Year
  const months = Array.from({ length: 12 }, (_, i) =>
    new Date(0, i).toLocaleString("vi-VN", { month: "long" })
  );
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const currentYear = new Date().getFullYear();
  // Let's assume a reasonable range for birth years, e.g., last 100 years
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

  return (
    <Modal show={show} onHide={handleClose} centered size="lg">
      {" "}
      {/* Using 'lg' for a larger modal */}
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
            <XCloseIcon /> {/* Close X icon */}
          </Button>
          <div style={{ width: "100px", height: "100px" }}>
            <KLogoSvg className="w-100 h-100" fill="black" />{" "}
            {/* Small X logo */}
          </div>
          <div style={{ width: "30px" }}></div>{" "}
          {/* Spacer to balance the layout */}
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
              variant="dark" // Use secondary to match the gray color
              className="py-3 rounded-pill fw-bold"
              style={{
                backgroundColor: "#000",
                borderColor: "#000",
                fontSize: "1.2rem",
              }} // Custom gray
              disabled={
                !formData.username ||
                !formData.email ||
                !formData.password ||
                !formData.month ||
                !formData.day ||
                !formData.year
              } // Disable if any field is empty
            >
              Tiếp theo
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default CreateAccountModal;
