import React, { useState, useContext } from "react";
import { Modal, Button, Form, Alert, Spinner } from "react-bootstrap";
import KLogoSvg from "../../../components/svgs/KSvg";
import { X as XCloseIcon } from "react-bootstrap-icons";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthContext } from "../../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const CreateAccountModal = ({ show, handleClose }) => {
  const { setUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    phoneNumber: "",
  });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
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
    if (!formData.username) newErrors.username = "Tên người dùng là bắt buộc.";
    else if (!/^[A-Za-z0-9]+$/.test(formData.username))
      newErrors.username = "Tên người dùng chỉ được chứa chữ cái và số.";

    if (!formData.email) newErrors.email = "Email là bắt buộc.";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Email không hợp lệ.";

    if (!formData.password) newErrors.password = "Mật khẩu là bắt buộc.";
    else if (
        !/^(?=.*[A-Z])(?=.*[!@#$%^&*()_+=.])(?=.{8,}).*$/.test(formData.password)
    )
      newErrors.password =
          "Mật khẩu phải dài ít nhất 8 ký tự, chứa ít nhất 1 chữ cái in hoa và 1 ký tự đặc biệt.";

    if (!formData.phoneNumber) newErrors.phoneNumber = "Số điện thoại là bắt buộc.";
    else if (!/^\+?[0-9]{7,15}$/.test(formData.phoneNumber))
      newErrors.phoneNumber = "Số điện thoại không hợp lệ (7-15 chữ số).";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    setLoading(true);

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(formData),
      });

      const contentType = response.headers.get("content-type");
      let data;
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = { message: text };
      }

      if (response.ok) {
        const { token, user } = data;
        setUser(user);
        sessionStorage.setItem("user", JSON.stringify(user));
        sessionStorage.setItem("token", token);
        toast.success("Đăng ký thành công! Vui lòng xác thực email.");
        handleClose();
        setTimeout(() => navigate("/home"), 2000);
      } else {
        setSubmitError(data.message || "Đăng ký thất bại. Vui lòng thử lại.");
        if (data.errors && Object.keys(data.errors).length > 0) {
          const errorDetails = Object.values(data.errors).join(", ");
          setSubmitError(`${data.message} - Chi tiết: ${errorDetails}`);
        }
      }
    } catch (err) {
      setSubmitError("Lỗi kết nối đến máy chủ.");
    } finally {
      setLoading(false);
    }
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

            <h3 className="fw-bold mb-4 text-center">Tạo tài khoản của bạn</h3>

            {submitError && <Alert variant="danger">{submitError}</Alert>}

            <Form onSubmit={handleSubmit}>
              {[
                { name: "username", type: "text", placeholder: "Tên người dùng (username)" },
                { name: "email", type: "email", placeholder: "Email" },
                { name: "password", type: "password", placeholder: "Mật khẩu" },
                { name: "phoneNumber", type: "tel", placeholder: "Số điện thoại" },
              ].map((field) => (
                  <Form.Group className="mb-3" key={field.name}>
                    <Form.Control
                        type={field.type}
                        placeholder={field.placeholder}
                        name={field.name}
                        value={formData[field.name]}
                        onChange={handleInputChange}
                        className="py-3 px-3 rounded-3"
                        style={{ fontSize: "1.1rem" }}
                        isInvalid={!!errors[field.name]}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors[field.name]}
                    </Form.Control.Feedback>
                  </Form.Group>
              ))}

              <div className="d-grid gap-2 mt-5">
                <Button
                    type="submit"
                    variant="dark"
                    className="py-3 rounded-pill fw-bold"
                    style={{ backgroundColor: "#000", borderColor: "#000", fontSize: "1.2rem" }}
                    disabled={loading}
                >
                  {loading ? (
                      <>
                        <Spinner as="span" animation="border" size="sm" role="status" className="me-2" />
                        Đang xử lý...
                      </>
                  ) : (
                      "Đăng ký"
                  )}
                </Button>
              </div>
            </Form>
          </Modal.Body>
        </Modal>
      </>
  );
};

export default CreateAccountModal;