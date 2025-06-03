import React, { useState } from "react";
import { Container, Form, Button, Row, Col } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import KLogoSvg from "../../../components/svgs/KSvg";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const CompleteProfilePage = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    displayName: "",
    phoneNumber: "",
    bio: "",
    gender: "",
    day: "",
    month: "",
    year: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const tempRegister = JSON.parse(localStorage.getItem("tempRegister"));
    if (!tempRegister) {
      toast.error(
        "Thông tin tài khoản tạm không tồn tại. Vui lòng đăng ký lại."
      );
      setLoading(false);
      return;
    }

    const fullProfile = {
      username: tempRegister.username,
      email: tempRegister.email,
      password: tempRegister.password,
      day: Number(formData.day),
      month: Number(formData.month),
      year: Number(formData.year),
      displayName: formData.displayName,
      phoneNumber: formData.phoneNumber,
      bio: formData.bio,
      gender: formData.gender,
    };

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/auth/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(fullProfile),
        }
      );

      const contentType = response.headers.get("content-type");
      let data;

      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        data = { message: await response.text() };
      }

      if (response.ok) {
        localStorage.removeItem("tempRegister");
        toast.success(data.message || "Đăng ký thành công!");
        navigate("/home");
      } else {
        toast.error(data.message || "Đăng ký thất bại. Vui lòng thử lại!");
        if (data.errors && Object.keys(data.errors).length > 0) {
          const errorDetails = Object.values(data.errors).join(", ");
          toast.error(`${data.message} - Chi tiết: ${errorDetails}`);
        }
      }
    } catch (error) {
      toast.error("Lỗi kết nối đến máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container
      fluid
      className="d-flex flex-column min-vh-100 bg-white text-black"
    >
      <ToastContainer position="top-right" />
      <Row className="flex-grow-1 justify-content-center align-items-center">
        <Col xs={12} sm={10} md={8} lg={6} xl={5} className="p-4">
          <div className="text-center mb-4">
            <KLogoSvg style={{ height: "100px", width: "auto" }} fill="black" />
          </div>
          <h2 className="mb-4 text-center">Hoàn thành hồ sơ của bạn</h2>

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="formDisplayName">
              <Form.Label>Tên hiển thị</Form.Label>
              <Form.Control
                type="text"
                placeholder="Nhập tên hiển thị của bạn"
                name="displayName"
                value={formData.displayName}
                onChange={handleChange}
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formPhoneNumber">
              <Form.Label>
                Số điện thoại <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="tel"
                placeholder="Nhập số điện thoại của bạn"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formBio">
              <Form.Label>Tiểu sử</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Viết một chút về bản thân bạn"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formGender">
              <Form.Label>
                Giới tính <span className="text-danger">*</span>
              </Form.Label>
              <Form.Select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
              >
                <option value="">-- Chọn giới tính --</option>
                <option value="0">Nam</option>
                <option value="1">Nữ</option>
                <option value="2">Khác</option>
              </Form.Select>
            </Form.Group>

            <Row className="mb-4">
              <Form.Label>
                Ngày sinh <span className="text-danger">*</span>
              </Form.Label>
              <Col xs={4}>
                <Form.Control
                  type="number"
                  placeholder="Ngày"
                  name="day"
                  value={formData.day}
                  onChange={handleChange}
                  min={1}
                  max={31}
                />
              </Col>
              <Col xs={4}>
                <Form.Control
                  type="number"
                  placeholder="Tháng"
                  name="month"
                  value={formData.month}
                  onChange={handleChange}
                  min={1}
                  max={12}
                />
              </Col>
              <Col xs={4}>
                <Form.Control
                  type="number"
                  placeholder="Năm"
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  min={1900}
                  max={new Date().getFullYear()}
                />
              </Col>
            </Row>

            <Button
              variant="primary"
              type="submit"
              className="w-100 py-2 rounded-pill fw-bold"
              style={{ backgroundColor: "#000", borderColor: "#000" }}
              disabled={loading}
            >
              {loading ? "Đang gửi..." : "Tiếp theo"}
            </Button>
          </Form>
        </Col>
      </Row>
    </Container>
  );
};

export default CompleteProfilePage;
