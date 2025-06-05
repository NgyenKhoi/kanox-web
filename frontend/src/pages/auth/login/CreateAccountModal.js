import React, { useState } from "react";
import { Modal, Button, Form, Alert } from "react-bootstrap";
import KLogoSvg from "../../../components/svgs/KSvg";
import { X as XCloseIcon } from "react-bootstrap-icons";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const CreateAccountModal = ({ show, handleClose }) => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    phoneNumber: "",
  });

  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
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

    // Phone number validation
    if (!formData.phoneNumber) {
      newErrors.phoneNumber = "Số điện thoại là bắt buộc.";
    } else if (!/^\+?[0-9]{7,15}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = "Số điện thoại không hợp lệ (7-15 chữ số).";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");

    if (!validateForm()) return;

    try {
      const response = await fetch(
          `${process.env.REACT_APP_API_URL}/auth/register`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify(formData),
          }
      );

      const contentType = response.headers.get("content-type");
      let data;
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = { message: text };
      }

      if (response.ok) {
        toast.success(
            data.message || "Đăng ký thành công! Vui lòng xác thực email."
        );
        handleClose();
      } else {
        const errorMessage =
            data.message || "Đăng ký thất bại. Vui lòng thử lại.";
        toast.error(errorMessage);
        if (data.errors && Object.keys(data.errors).length > 0) {
          const errorDetails = Object.values(data.errors).join(", ");
          toast.error(`${errorMessage} - Chi tiết: ${errorDetails}`);
        }
      }
    } catch (err) {
      toast.error("Lỗi kết nối đến máy chủ.");
    }
  };

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

              <Form.Group className="mb-4">
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