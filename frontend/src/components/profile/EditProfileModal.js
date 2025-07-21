import React, { useState, useEffect, useRef } from "react";
import { Modal, Button, Form, Image, Spinner, Nav } from "react-bootstrap";
import { FaCamera, FaTimes, FaLock, FaTrash } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import PlaceAutocomplete from "../location/PlaceAutocomplete"; // đường dẫn đúng tới file

const libraries = ["places"];

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
    dateOfBirth: "",
    avatar: "",
    gender: "",
    locationName: "",
    latitude: null,
    longitude: null,
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const placeInputRef = useRef(null);

  useEffect(() => {
    if (show && userProfile) {
      setFormData({
        displayName: userProfile.displayName || "",
        bio: userProfile.bio || "",
        dateOfBirth: userProfile.dateOfBirth
          ? new Date(userProfile.dateOfBirth).toISOString().split("T")[0]
          : "",
        gender: userProfile.gender != null ? String(userProfile.gender) : "",
        avatar: userProfile.profileImageUrl || "",
        locationName: userProfile.locationName || "",
        latitude: userProfile.latitude || null,
        longitude: userProfile.longitude || null,
      });
      setAvatarFile(null);
      setErrors({});
    }
  }, [show, userProfile]);

  useEffect(() => {
    const el = placeInputRef.current;
    if (el && formData.locationName) {
      el.querySelector("input")?.setAttribute("value", formData.locationName);
    }
  }, [formData.locationName]);



  const validateForm = () => {
    const newErrors = {};
    if (formData.displayName.length > 50) {
      newErrors.displayName = "Tên hiển thị không được vượt quá 50 ký tự.";
    }
    if (formData.bio.length > 160) {
      newErrors.bio = "Tiểu sử không được vượt quá 160 ký tự.";
    }
    if (formData.locationName && formData.locationName.length > 255) {
      newErrors.locationName = "Địa điểm không được vượt quá 255 ký tự.";
    }
    if (formData.latitude && (formData.latitude < -90 || formData.latitude > 90)) {
      newErrors.latitude = "Latitude phải nằm trong khoảng -90 đến 90.";
    }
    if (formData.longitude && (formData.longitude < -180 || formData.longitude > 180)) {
      newErrors.longitude = "Longitude phải nằm trong khoảng -180 đến 180.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setFormData((prev) => ({ ...prev, avatar: imageUrl }));
      setAvatarFile(file);
    }
  };

  const handleClearImage = () => {
    setFormData((prev) => ({ ...prev, avatar: "" }));
    setAvatarFile(null);
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error("Vui lòng kiểm tra lại thông tin!");
      return;
    }

    setLoading(true);
    const token = localStorage.getItem("token");

    try {
      const payload = {
        displayName: formData.displayName,
        bio: formData.bio,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender ? Number(formData.gender) : null,
        locationName: formData.locationName || null,
        latitude: formData.latitude || null,
        longitude: formData.longitude || null,
      };

      const form = new FormData();
      form.append(
          "data",
          new Blob([JSON.stringify(payload)], { type: "application/json" })
      );

      if (avatarFile) {
        form.append("avatar", avatarFile);
      }

      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/user/profile/${username}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: form,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Lỗi khi cập nhật hồ sơ.");
      }

      const updatedProfile = await response.json();
      onSave(updatedProfile);
      handleClose();
      toast.success("Hồ sơ đã được cập nhật thành công!");
    } catch (error) {
      console.error("Lỗi khi lưu hồ sơ:", error);
      toast.error(`Lỗi khi lưu hồ sơ: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    if (
      window.confirm(
        "Bạn có chắc chắn muốn xóa tài khoản? Hành động này không thể hoàn tác!"
      )
    ) {
      alert("Chuyển hướng đến trang xóa tài khoản...");
    }
  };

  const handleSecuritySettings = () => {
    alert("Chuyển hướng đến trang cài đặt bảo mật...");
  };

  const genderOptions = [
    { value: "", label: "Không xác định" },
    { value: "0", label: "Nam" },
    { value: "1", label: "Nữ" },
    { value: "2", label: "Khác" },
  ];

  return (
    <>
      <ToastContainer position="top-center" autoClose={3000} />
      <Modal
        show={show}
        onHide={handleClose}
        fullscreen="sm-down"
        centered
        size="lg"
        className="bg-[var(--background-color)] text-[var(--text-color)]"
      >
        <Modal.Header className="border-bottom-0 pb-0">
          <div className="d-flex align-items-center">
            <Button
              variant="link"
              className="text-[var(--text-color)] p-0 me-3"
              onClick={handleClose}
            >
              <FaTimes size={24} />
            </Button>
            <Modal.Title className="fw-bold fs-5">Chỉnh sửa hồ sơ</Modal.Title>
          </div>
        </Modal.Header>

        <Modal.Body className="p-3">
          <div className="mb-5 text-center">
            <div className="position-relative d-inline-block">
              <Image
                src={
                  formData.avatar ||
                  "https://source.unsplash.com/150x150/?portrait"
                }
                roundedCircle
                className="border border-[var(--border-color)] border-4"
                style={{ width: "150px", height: "150px", objectFit: "cover" }}
              />

              {/* Nút chọn ảnh: chuyển xuống dưới bên phải avatar */}
              <label
                htmlFor="avatar-upload"
                className="position-absolute bottom-0 end-0 mb-2 me-2 btn btn-dark rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: "40px", height: "40px" }}
              >
                <FaCamera size={16} />
                <input
                  type="file"
                  id="avatar-upload"
                  className="d-none"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </label>

              {/* Nút xoá ảnh */}
              {formData.avatar && (
                <Button
                  variant="dark"
                  className="rounded-circle d-flex align-items-center justify-content-center"
                  style={{
                    width: "40px",
                    height: "40px",
                    position: "absolute",
                    top: "0",
                    right: "0",
                    transform: "translate(50%, -50%)",
                  }}
                  onClick={handleClearImage}
                >
                  <FaTimes size={18} />
                </Button>
              )}
            </div>
          </div>

          <h6 className="fw-bold mb-3 text-[var(--text-color)]">Thông tin cá nhân</h6>
          <Form className="mb-4">
            <Form.Group className="mb-3" controlId="formDisplayName">
              <Form.Label className="text-[var(--muted-text-color)] small mb-1">
                Tên hiển thị
              </Form.Label>
              <Form.Control
                type="text"
                value={formData.displayName}
                onChange={(e) =>
                  handleInputChange("displayName", e.target.value)
                }
                className="border-0 border-b border-[var(--border-color)] rounded-0 px-0 py-1 text-[var(--text-color)]"
                isInvalid={!!errors.displayName}
              />
              <Form.Control.Feedback type="invalid">
                {errors.displayName}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3" controlId="formBio">
              <Form.Label className="text-[var(--muted-text-color)] small mb-1">Tiểu sử</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.bio}
                onChange={(e) => handleInputChange("bio", e.target.value)}
                className="border-0 border-b border-[var(--border-color)] rounded-0 px-0 py-1 text-[var(--text-color)]"
                isInvalid={!!errors.bio}
              />
              <Form.Control.Feedback type="invalid">
                {errors.bio}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3" controlId="formDateOfBirth">
              <Form.Label className="text-[var(--muted-text-color)] small mb-1">
                Ngày sinh
              </Form.Label>
              <Form.Control
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) =>
                  handleInputChange("dateOfBirth", e.target.value)
                }
                className="border-0 border-b border-[var(--border-color)] rounded-0 px-0 py-1 text-[var(--text-color)]"
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formGender">
              <Form.Label className="text-[var(--muted-text-color)] small mb-1">
                Giới tính
              </Form.Label>
              <Form.Select
                value={formData.gender}
                onChange={(e) => handleInputChange("gender", e.target.value)}
                className="border-0 border-b border-[var(--border-color)] rounded-0 px-0 py-1 text-[var(--text-color)]"
              >
                {genderOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3" controlId="formLocation">
              <Form.Label className="text-[var(--muted-text-color)] small mb-1">
                Địa điểm
              </Form.Label>
              <PlaceAutocomplete
                  ref={placeInputRef}
                  onPlaceSelect={(place) => {
                    if (!place || !place.geometry) return;
                    setFormData((prev) => ({
                      ...prev,
                      locationName: place.formattedAddress || "",
                      latitude: place.latitude,
                      longitude: place.longitude,
                    }));
                  }}
              />
              <Form.Control.Feedback type="invalid">
                {errors.locationName}
              </Form.Control.Feedback>
            </Form.Group>
          </Form>

          <h6 className="fw-bold mb-3">Cài đặt tài khoản</h6>
          <Nav className="flex-column">
            <Nav.Link
              onClick={handleSecuritySettings}
              className="text-[var(--text-color-muted)] d-flex align-items-center py-2 px-0 border-bottom"
            >
              <FaLock className="me-2" /> Cài đặt bảo mật
            </Nav.Link>
            <Nav.Link
              onClick={handleDeleteAccount}
              className="text-danger d-flex align-items-center py-2 px-0"
            >
              <FaTrash className="me-2" /> Xóa tài khoản
            </Nav.Link>
          </Nav>

          {/* Nút lưu */}
          <div className="text-end mt-4">
            <Button
              variant="dark"
              className="rounded-pill px-4 py-1 fw-bold"
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="me-2"
                  />
                  Đang lưu...
                </>
              ) : (
                "Lưu"
              )}
            </Button>
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
}

export default EditProfileModal;
