import React, { useState } from "react";
import { Container, Form, Button, Row, Col, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom"; // Dùng để chuyển hướng
import KLogoSvg from "../../components/svgs/KSvg"; // Đảm bảo đường dẫn này chính xác

const CompleteProfilePage = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    displayName: "",
    phoneNumber: "",
    dob: "", // Date of Birth
    bio: "",
  });

  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(""); // State cho lỗi tổng thể khi gửi form

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    // Xóa lỗi cho trường hiện tại khi người dùng nhập liệu
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
    if (!formData.phoneNumber) {
      newErrors.phoneNumber = "Số điện thoại là bắt buộc.";
    } else if (!/^\d{10,11}$/.test(formData.phoneNumber)) {
      // Ví dụ: 10-11 chữ số
      newErrors.phoneNumber = "Số điện thoại không hợp lệ (10-11 chữ số).";
    }

    // Kiểm tra displayName (tùy chọn: có thể thêm yêu cầu độ dài tối thiểu/tối đa)
    if (!formData.displayName) {
      newErrors.displayName = "Tên hiển thị không được để trống.";
    }

    // Bạn có thể thêm các validation khác cho dob và bio nếu cần
    // Ví dụ: kiểm tra định dạng dob, độ dài bio

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0; // Trả về true nếu không có lỗi
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(""); // Reset lỗi tổng thể

    if (validateForm()) {
      // Logic gửi thông tin profile lên server
      try {
        // Trong một ứng dụng thực tế, bạn sẽ gửi dữ liệu này lên API backend
        // Ví dụ:
        // const token = localStorage.getItem("token"); // Lấy token nếu cần cho API này
        // const response = await fetch(`${process.env.REACT_APP_API_URL}/user/complete-profile`, {
        //   method: 'POST',
        //   headers: {
        //     'Content-Type': 'application/json',
        //     'Authorization': `Bearer ${token}`,
        //   },
        //   body: JSON.stringify(formData),
        // });

        // if (!response.ok) {
        //   const errorData = await response.json();
        //   throw new Error(errorData.message || "Không thể cập nhật hồ sơ.");
        // }

        // const result = await response.json();
        console.log("Dữ liệu profile đã gửi:", formData);
        alert("Thông tin hồ sơ đã được cập nhật thành công!"); // Thông báo thành công tạm thời

        // Sau khi hoàn thành, chuyển hướng người dùng đến trang chính
        navigate("/home");
      } catch (error) {
        console.error("Lỗi khi hoàn thành hồ sơ:", error);
        setSubmitError(`Đã xảy ra lỗi: ${error.message}. Vui lòng thử lại.`);
      }
    } else {
      setSubmitError(
        "Vui lòng điền đầy đủ và chính xác các thông tin bắt buộc."
      );
    }
  };

  return (
    <Container
      fluid
      className="d-flex flex-column min-vh-100 bg-white text-black"
    >
      <Row className="flex-grow-1 justify-content-center align-items-center">
        <Col xs={12} sm={10} md={8} lg={6} xl={5} className="p-4">
          <div className="text-center mb-4">
            <KLogoSvg style={{ height: "100px", width: "auto" }} fill="black" />
          </div>
          <h2 className="mb-4 text-center">Hoàn thành hồ sơ của bạn</h2>

          {submitError && <Alert variant="danger">{submitError}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="formDisplayName">
              <Form.Label>Tên hiển thị</Form.Label>
              <Form.Control
                type="text"
                placeholder="Nhập tên hiển thị của bạn"
                name="displayName"
                value={formData.displayName}
                onChange={handleChange}
                isInvalid={!!errors.displayName}
              />
              <Form.Control.Feedback type="invalid">
                {errors.displayName}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3" controlId="formPhoneNumber">
              <Form.Label>
                Số điện thoại <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="tel" // Sử dụng type="tel" cho số điện thoại
                placeholder="Nhập số điện thoại của bạn"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                isInvalid={!!errors.phoneNumber}
              />
              <Form.Control.Feedback type="invalid">
                {errors.phoneNumber}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-4" controlId="formBio">
              <Form.Label>Tiểu sử</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Viết một chút về bản thân bạn"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                isInvalid={!!errors.bio}
              />
              <Form.Control.Feedback type="invalid">
                {errors.bio}
              </Form.Control.Feedback>
            </Form.Group>

            <Button
              variant="primary"
              type="submit"
              className="w-100 py-2 rounded-pill fw-bold"
              style={{ backgroundColor: "#000", borderColor: "#000" }}
            >
              Tiếp theo
            </Button>
          </Form>
        </Col>
      </Row>
      {/* Footer nếu bạn muốn hiển thị ở đây */}
      {/* <Footer /> */}
    </Container>
  );
};

export default CompleteProfilePage;
