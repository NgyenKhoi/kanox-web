import React, { useState } from "react";
import { Modal, Button, Form, Row, Col, Alert } from "react-bootstrap";
import KLogoSvg from "../../../components/svgs/KSvg";
import { X as XCloseIcon } from "react-bootstrap-icons";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const CreateAccountModal = ({ show, handleClose }) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    month: "",
    day: "",
    year: "",
    displayName: "",
    phoneNumber: "",
    bio: "",
    gender: "OTHER",
  });

  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    // Clear error for the current field when user types
    if (errors[name]) {
      setErrors((prevErrors) => {
        const newErrors = { ...prevErrors };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    let newErrors = {};

    // Username validation
    if (!formData.username) {
      newErrors.username = "Tên người dùng là bắt buộc.";
    } else if (!/^[A-Za-z0-9]+$/.test(formData.username)) {
      newErrors.username = "Tên người dùng chỉ được chứa chữ cái và số.";
    }

    // Email validation
    if (!formData.email) {
      newErrors.email = "Email là bắt buộc.";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email không hợp lệ.";
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Mật khẩu là bắt buộc.";
    } else if (
      !/^(?=.*[A-Z])(?=.*[!@#$%^&*()_+=.])(?=.{8,}).*$/.test(formData.password)
    ) {
      newErrors.password =
        "Mật khẩu phải dài ít nhất 8 ký tự, chứa ít nhất 1 chữ cái in hoa và 1 ký tự đặc biệt (!@#$%^&*()_+=.)";
    }

    // Date of birth validation
    if (!formData.month || !formData.day || !formData.year) {
      newErrors.dob = "Ngày sinh là bắt buộc.";
    }

    // Display name validation
    if (!formData.displayName) {
      newErrors.displayName = "Tên hiển thị là bắt buộc.";
    } else if (formData.displayName.length > 50) {
      newErrors.displayName = "Tên hiển thị không được quá 50 ký tự.";
    }

    // Phone number validation
    if (!formData.phoneNumber) {
      newErrors.phoneNumber = "Số điện thoại là bắt buộc.";
    } else if (!/^\+?[0-9]{7,15}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = "Số điện thoại không hợp lệ (7-15 chữ số).";
    }

    // Bio validation
    if (formData.bio && formData.bio.length > 255) {
      newErrors.bio = "Bio không được quá 255 ký tự.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");

    if (!validateForm()) return;

    const fullProfile = {
      username: formData.username,
      email: formData.email,
      password: formData.password,
      year: parseInt(formData.year),
      month: parseInt(formData.month),
      day: parseInt(formData.day),
      displayName: formData.displayName,
      phoneNumber: formData.phoneNumber,
      bio: formData.bio || "",
      gender: formData.gender,
    };

    try {
      console.log("Sending registration data:", fullProfile);
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(fullProfile),
        }
      );

      console.log("Response status:", response.status);
      console.log(
        "Response headers:",
        Object.fromEntries(response.headers.entries())  
      );

      const contentType = response.headers.get("content-type");
      let data;
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.log("Non-JSON response:", text);
        data = { message: text };
      }

      console.log("Registration response:", data);

      if (response.ok) {
        toast.success(
          data.message || "Đăng ký thành công! Vui lòng xác thực email."
        );
        handleClose();
      } else {
        const errorMessage =
          data.message || "Đăng ký thất bại. Vui lòng thử lại.";
        console.error("Registration failed:", errorMessage);
        toast.error(errorMessage);
        if (data.errors && Object.keys(data.errors).length > 0) {
          const errorDetails = Object.values(data.errors).join(", ");
          console.error("Validation errors:", errorDetails);
          toast.error(`${errorMessage} - Chi tiết: ${errorDetails}`);
        }
      }
    } catch (err) {
      console.error("Lỗi khi đăng ký:", err);
      toast.error("Lỗi kết nối đến máy chủ.");
    }
  };

  // Generate arrays for date options
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

          <h3 className="fw-bold mb-4">Tạo tài khoản của bạn</h3>

          {submitError && <Alert variant="danger">{submitError}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Control
                type="text"
                placeholder="Tên người dùng (username)"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className="py-3 px-3 rounded-3"
                style={{ fontSize: "1.1rem" }}
                isInvalid={!!errors.username}
              />
              <Form.Control.Feedback type="invalid">
                {errors.username}
              </Form.Control.Feedback>
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
                isInvalid={!!errors.email}
              />
              <Form.Control.Feedback type="invalid">
                {errors.email}
              </Form.Control.Feedback>
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
                isInvalid={!!errors.password}
              />
              <Form.Control.Feedback type="invalid">
                {errors.password}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Control
                type="text"
                placeholder="Tên hiển thị"
                name="displayName"
                value={formData.displayName}
                onChange={handleInputChange}
                className="py-3 px-3 rounded-3"
                style={{ fontSize: "1.1rem" }}
                isInvalid={!!errors.displayName}
              />
              <Form.Control.Feedback type="invalid">
                {errors.displayName}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Control
                type="tel"
                placeholder="Số điện thoại"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                className="py-3 px-3 rounded-3"
                style={{ fontSize: "1.1rem" }}
                isInvalid={!!errors.phoneNumber}
              />
              <Form.Control.Feedback type="invalid">
                {errors.phoneNumber}
              </Form.Control.Feedback>
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
                  isInvalid={!!errors.dob}
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
                  isInvalid={!!errors.dob}
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
                  isInvalid={!!errors.dob}
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
            {errors.dob && <div className="text-danger mb-3">{errors.dob}</div>}

            <Form.Group className="mb-4">
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Viết một chút về bản thân bạn"
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                className="py-3 px-3 rounded-3"
                style={{ fontSize: "1.1rem" }}
              />
            </Form.Group>

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
              >
                Đăng ký
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default CreateAccountModal;
