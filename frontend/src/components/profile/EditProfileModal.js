// src/components/profile/EditProfileModal.jsx
import React, { useState } from "react";
import { Modal, Button, Form, Image, Row, Col } from "react-bootstrap";
import { FaCamera, FaTimes } from "react-icons/fa"; // Import FaTimes cho nút đóng

function EditProfileModal({ show, handleClose, userProfile, onSave }) {
  const [name, setName] = useState(userProfile.name);
  const [bio, setBio] = useState(userProfile.bio || ""); // Thêm bio vào userProfile nếu chưa có
  const [location, setLocation] = useState(userProfile.location || ""); // Thêm location
  const [website, setWebsite] = useState(userProfile.website || ""); // Thêm website
  const [dob, setDob] = useState(userProfile.dob || "2004-03-14"); // Định dạng YYYY-MM-DD cho input type="date"

  // Giả định bạn có thể thay đổi avatar và banner
  const [avatarPreview, setAvatarPreview] = useState(userProfile.avatar);
  const [bannerPreview, setBannerPreview] = useState(userProfile.banner);

  const handleSave = () => {
    // Gọi hàm onSave truyền từ ProfilePage với dữ liệu mới
    onSave({ name, bio, location, website, dob });
    handleClose();
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarPreview(URL.createObjectURL(file));
      // Trong ứng dụng thực tế, bạn sẽ cần upload file này lên server
    }
  };

  const handleBannerChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBannerPreview(URL.createObjectURL(file));
      // Trong ứng dụng thực tế, bạn sẽ cần upload file này lên server
    }
  };

  return (
    <Modal show={show} onHide={handleClose} fullscreen="sm-down" centered>
      <Modal.Header className="d-flex justify-content-between align-items-center border-bottom-0 pb-0">
        <div className="d-flex align-items-center">
          <Button
            variant="link"
            className="text-dark p-0 me-3"
            onClick={handleClose}
          >
            <FaTimes size={24} />
          </Button>
          <Modal.Title className="fw-bold fs-5">Chỉnh sửa hồ sơ</Modal.Title>
        </div>
        <Button
          variant="dark"
          className="rounded-pill px-3 py-1 fw-bold"
          onClick={handleSave}
        >
          Lưu
        </Button>
      </Modal.Header>
      <Modal.Body className="p-0">
        {/* Banner Section */}
        <div
          className="position-relative"
          style={{ height: "200px", backgroundColor: "#ced4da" }}
        >
          <Image
            src={bannerPreview}
            fluid
            className="w-100 h-100"
            style={{ objectFit: "cover" }}
          />
          <div
            className="position-absolute top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
            style={{ backgroundColor: "rgba(0,0,0,0.3)" }}
          >
            <label
              htmlFor="banner-upload"
              className="btn btn-dark rounded-circle me-2 d-flex align-items-center justify-content-center"
              style={{ width: "40px", height: "40px", cursor: "pointer" }}
            >
              <FaCamera size={18} />
              <input
                type="file"
                id="banner-upload"
                className="d-none"
                accept="image/*"
                onChange={handleBannerChange}
              />
            </label>
            <Button
              variant="dark"
              className="rounded-circle d-flex align-items-center justify-content-center"
              style={{ width: "40px", height: "40px" }}
            >
              <FaTimes size={18} />
            </Button>
          </div>
        </div>

        {/* Avatar Section */}
        <div
          className="position-relative"
          style={{ marginTop: "-75px", marginLeft: "20px", zIndex: 3 }}
        >
          <Image
            src={avatarPreview}
            roundedCircle
            className="border border-white border-4"
            style={{ width: "130px", height: "130px", objectFit: "cover" }}
          />
          <label
            htmlFor="avatar-upload"
            className="position-absolute top-50 start-50 translate-middle btn btn-dark rounded-circle d-flex align-items-center justify-content-center"
            style={{ width: "50px", height: "50px", cursor: "pointer" }}
          >
            <FaCamera size={20} />
            <input
              type="file"
              id="avatar-upload"
              className="d-none"
              accept="image/*"
              onChange={handleAvatarChange}
            />
          </label>
        </div>

        <Form className="p-3 pt-4">
          <Form.Group className="mb-3" controlId="formName">
            <Form.Label className="text-muted small mb-0">Tên</Form.Label>
            <Form.Control
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border-0 border-bottom rounded-0 px-0 pt-0 pb-1"
              style={{
                fontSize: "1.25rem",
                outline: "none",
                boxShadow: "none",
              }}
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="formBio">
            <Form.Label className="text-muted small mb-0">Tiểu sử</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="border-0 border-bottom rounded-0 px-0 pt-0 pb-1"
              style={{
                fontSize: "1.25rem",
                outline: "none",
                boxShadow: "none",
                resize: "none",
              }}
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="formLocation">
            <Form.Label className="text-muted small mb-0">Vị trí</Form.Label>
            <Form.Control
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="border-0 border-bottom rounded-0 px-0 pt-0 pb-1"
              style={{
                fontSize: "1.25rem",
                outline: "none",
                boxShadow: "none",
              }}
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="formWebsite">
            <Form.Label className="text-muted small mb-0">Trang web</Form.Label>
            <Form.Control
              type="text"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="border-0 border-bottom rounded-0 px-0 pt-0 pb-1"
              style={{
                fontSize: "1.25rem",
                outline: "none",
                boxShadow: "none",
              }}
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="formDob">
            <Form.Label className="text-muted small mb-0">Ngày sinh</Form.Label>
            <Form.Control
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="border-0 border-bottom rounded-0 px-0 pt-0 pb-1"
              style={{
                fontSize: "1.25rem",
                outline: "none",
                boxShadow: "none",
              }}
            />
          </Form.Group>
        </Form>
      </Modal.Body>
    </Modal>
  );
}

export default EditProfileModal;
