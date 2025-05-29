import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Image } from "react-bootstrap";
import { FaCamera, FaTimes } from "react-icons/fa";

function EditProfileModal({
  show,
  handleClose,
  userProfile,
  onSave,
  username,
}) {
  const [formData, setFormData] = useState({
    displayName: "",
    bio: "",
    location: "",
    website: "",
    dateOfBirth: "",
    avatar: "",
    banner: "",
    gender: "",
  });

  useEffect(() => {
    if (show && userProfile) {
      setFormData({
        displayName: userProfile.displayName || "",
        bio: userProfile.bio || "",
        dateOfBirth: userProfile.dateOfBirth || "",
        gender: userProfile.gender != null ? String(userProfile.gender) : "",
        location: userProfile.location || "",
        website: userProfile.website || "",
        avatar: userProfile.avatar || "",
        banner: userProfile.banner || "",
      });
    }
  }, [show, userProfile]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (field, e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setFormData((prev) => ({ ...prev, [field]: imageUrl }));
      // Thực tế cần upload ảnh lên server tại đây
    }
  };

  const handleSave = async () => {
    const token = localStorage.getItem("token");
    const payload = {};
    if (formData.displayName !== userProfile.displayName) {
      payload.displayName = formData.displayName;
    }
    if (formData.dateOfBirth !== userProfile.dateOfBirth) {
      payload.dateOfBirth = formData.dateOfBirth;
    }
        if (formData.bio !== userProfile.bio) {
      payload.bio = formData.bio;
    }
    if (
      formData.gender !==
      (userProfile.gender != null ? String(userProfile.gender) : "")
    ) {
      payload.gender = formData.gender ? Number(formData.gender) : null;
    }
    await fetch(`${process.env.REACT_APP_API_URL}/user/profile/${username}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const response = await fetch(
      `${process.env.REACT_APP_API_URL}/user/profile/${username}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const updatedProfile = await response.json();

    onSave(updatedProfile);
    handleClose();
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
        {/* Banner */}
        <div
          className="position-relative"
          style={{ height: "200px", backgroundColor: "#ced4da" }}
        >
          <Image
            src={formData.banner}
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
                onChange={(e) => handleImageChange("banner", e)}
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

        {/* Avatar */}
        <div
          className="position-relative"
          style={{ marginTop: "-75px", marginLeft: "20px", zIndex: 3 }}
        >
          <Image
            src={formData.avatar}
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
              onChange={(e) => handleImageChange("avatar", e)}
            />
          </label>
        </div>

        {/* Form */}
        <Form className="p-3 pt-4">
          {[
            { label: "Tên", field: "displayName", type: "text" },
            { label: "Tiểu sử", field: "bio", type: "textarea", rows: 3 },
            { label: "Vị trí", field: "location", type: "text" },
            { label: "Trang web", field: "website", type: "text" },
            { label: "Ngày sinh", field: "dateOfBirth", type: "date" },
          ].map(({ label, field, type, rows }) => (
            <Form.Group className="mb-3" controlId={`form${field}`} key={field}>
              <Form.Label className="text-muted small mb-0">{label}</Form.Label>
              {type === "textarea" ? (
                <Form.Control
                  as="textarea"
                  rows={rows}
                  value={formData[field]}
                  onChange={(e) => handleInputChange(field, e.target.value)}
                  className="border-0 border-bottom rounded-0 px-0 pt-0 pb-1"
                  style={{
                    fontSize: "1.25rem",
                    outline: "none",
                    boxShadow: "none",
                    resize: "none",
                  }}
                />
              ) : (
                <Form.Control
                  type={type}
                  value={formData[field]}
                  onChange={(e) => handleInputChange(field, e.target.value)}
                  className="border-0 border-bottom rounded-0 px-0 pt-0 pb-1"
                  style={{
                    fontSize: "1.25rem",
                    outline: "none",
                    boxShadow: "none",
                  }}
                />
              )}
            </Form.Group>
          ))}
        </Form>
      </Modal.Body>
    </Modal>
  );
}

export default EditProfileModal;
