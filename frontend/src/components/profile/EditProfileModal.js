import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Image, Spinner, Nav } from "react-bootstrap";
import { FaCamera, FaTimes, FaLock, FaTrash, FaPalette } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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
    theme: "light", // Thêm theme mặc định
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [loading, setLoading] = useState(false); // Thêm trạng thái loading
  const [errors, setErrors] = useState({}); // Thêm trạng thái lỗi để validate

  useEffect(() => {
    if (show && userProfile) {
      setFormData({
        displayName: userProfile.displayName || "",
        bio: userProfile.bio || "",
        location: userProfile.location || "",
        website: userProfile.website || "",
        dateOfBirth: userProfile.dateOfBirth
          ? new Date(userProfile.dateOfBirth).toISOString().split("T")[0]
          : "",
        gender: userProfile.gender != null ? String(userProfile.gender) : "",
        avatar: userProfile.avatar || "",
        banner: userProfile.banner || "",
        theme: userProfile.theme || "light", // Giả lập theme từ userProfile
      });
      setAvatarFile(null);
      setBannerFile(null);
      setErrors({});
    }
  }, [show, userProfile]);

  const validateForm = () => {
    const newErrors = {};
    if (formData.displayName.length > 50) {
      newErrors.displayName = "Tên hiển thị không được vượt quá 50 ký tự.";
    }
    if (formData.bio.length > 160) {
      newErrors.bio = "Tiểu sử không được vượt quá 160 ký tự.";
    }
    if (
      formData.website &&
      !/^https?:\/\/[^\s/$.?#].[^\s]*$/.test(formData.website)
    ) {
      newErrors.website =
        "Định dạng trang web không hợp lệ (phải bắt đầu bằng http:// hoặc https://).";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (field, e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setFormData((prev) => ({ ...prev, [field]: imageUrl }));
      if (field === "avatar") {
        setAvatarFile(file);
      } else if (field === "banner") {
        setBannerFile(file);
      }
    }
  };

  const handleClearImage = (field) => {
    setFormData((prev) => ({ ...prev, [field]: "" }));
    if (field === "avatar") {
      setAvatarFile(null);
    } else if (field === "banner") {
      setBannerFile(null);
    }
  };

  const uploadFile = async (file) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(
          `https://via.placeholder.com/150x150/0000FF/FFFFFF?text=${file.name}`
        );
      }, 500);
    });
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
        location: formData.location,
        website: formData.website,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender ? Number(formData.gender) : null,
        theme: formData.theme,
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

      const updatedProfileResponse = await fetch(
          `${process.env.REACT_APP_API_URL}/user/profile/${username}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
      );

      if (!updatedProfileResponse.ok) {
        throw new Error("Lỗi khi tải lại hồ sơ sau cập nhật.");
      }

      const updatedProfile = await updatedProfileResponse.json();

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
      alert("Chuyển hướng đến trang xóa tài khoản..."); // Giả lập, có thể thay bằng navigate
    }
  };

  const handleSecuritySettings = () => {
    alert("Chuyển hướng đến trang cài đặt bảo mật..."); // Giả lập, có thể thay bằng navigate
  };

  const handleThemeChange = (theme) => {
    handleInputChange("theme", theme);
    alert(`Đã chọn theme: ${theme}`); // Giả lập, có thể tích hợp theme thực tế
  };

  const genderOptions = [
    { value: "", label: "Không xác định" },
    { value: "0", label: "Nam" },
    { value: "1", label: "Nữ" },
    { value: "2", label: "Khác" },
  ];

  return (
    <>
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <Modal
        show={show}
        onHide={handleClose}
        fullscreen="sm-down"
        centered
        size="lg"
      >
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
        </Modal.Header>

        <Modal.Body className="p-3">
          <div className="mb-4">
            <h6 className="fw-bold mb-3">Ảnh bìa và đại diện</h6>
            <div className="position-relative mb-4">
              <Image
                src={
                  formData.banner ||
                  "https://source.unsplash.com/1200x400/?nature,water"
                }
                fluid
                className="w-100 rounded-3"
                style={{ height: "200px", objectFit: "cover" }}
              />
              <div
                className="position-absolute top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
                style={{ backgroundColor: "rgba(0,0,0,0.3)" }}
              >
                <label
                  htmlFor="banner-upload"
                  className="btn btn-dark rounded-circle me-2 d-flex align-items-center justify-content-center"
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
                {formData.banner && (
                  <Button
                    variant="dark"
                    className="rounded-circle d-flex align-items-center justify-content-center"
                    onClick={() => handleClearImage("banner")}
                  >
                    <FaTimes size={18} />
                  </Button>
                )}
              </div>
            </div>

            <div
              className="position-relative"
              style={{ marginTop: "-75px", marginLeft: "20px" }}
            >
              <Image
                src={
                  formData.avatar ||
                  "https://source.unsplash.com/150x150/?portrait"
                }
                roundedCircle
                className="border border-white border-4"
                style={{ width: "130px", height: "130px", objectFit: "cover" }}
              />
              <label
                htmlFor="avatar-upload"
                className="position-absolute top-50 start-50 translate-middle btn btn-dark rounded-circle d-flex align-items-center justify-content-center"
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
                  onClick={() => handleClearImage("avatar")}
                >
                  <FaTimes size={18} />
                </Button>
              )}
            </div>
          </div>

          <h6 className="fw-bold mb-3">Thông tin cá nhân</h6>
          <Form className="mb-4">
            {[
              { label: "Tên hiển thị", field: "displayName", type: "text" },
              { label: "Tiểu sử", field: "bio", type: "textarea", rows: 3 },
              { label: "Vị trí", field: "location", type: "text" },
              { label: "Trang web", field: "website", type: "text" },
              { label: "Ngày sinh", field: "dateOfBirth", type: "date" },
            ].map(({ label, field, type, rows }) => (
              <Form.Group
                className="mb-3"
                controlId={`form${field}`}
                key={field}
              >
                <Form.Label className="text-muted small mb-1">
                  {label}
                </Form.Label>
                {type === "textarea" ? (
                  <Form.Control
                    as="textarea"
                    rows={rows}
                    value={formData[field]}
                    onChange={(e) => handleInputChange(field, e.target.value)}
                    className="border-0 border-bottom rounded-0 px-0 py-1"
                    isInvalid={!!errors[field]}
                  />
                ) : (
                  <Form.Control
                    type={type}
                    value={formData[field]}
                    onChange={(e) => handleInputChange(field, e.target.value)}
                    className="border-0 border-bottom rounded-0 px-0 py-1"
                    isInvalid={!!errors[field]}
                  />
                )}
                <Form.Control.Feedback type="invalid">
                  {errors[field]}
                </Form.Control.Feedback>
              </Form.Group>
            ))}

            <Form.Group className="mb-3" controlId="formGender">
              <Form.Label className="text-muted small mb-1">
                Giới tính
              </Form.Label>
              <Form.Select
                name="gender"
                value={formData.gender}
                onChange={(e) => handleInputChange("gender", e.target.value)}
                className="border-0 border-bottom rounded-0 px-0 py-1"
              >
                {genderOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3" controlId="formTheme">
              <Form.Label className="text-muted small mb-1">
                Giao diện
              </Form.Label>
              <div className="d-flex">
                <Button
                  variant={
                    formData.theme === "light" ? "primary" : "outline-primary"
                  }
                  className="rounded-pill me-2"
                  onClick={() => handleThemeChange("light")}
                >
                  Sáng
                </Button>
                <Button
                  variant={
                    formData.theme === "dark" ? "primary" : "outline-primary"
                  }
                  className="rounded-pill"
                  onClick={() => handleThemeChange("dark")}
                >
                  Tối
                </Button>
              </div>
            </Form.Group>
          </Form>

          <h6 className="fw-bold mb-3">Cài đặt tài khoản</h6>
          <Nav className="flex-column">
            <Nav.Link
              onClick={handleSecuritySettings}
              className="text-dark d-flex align-items-center py-2 px-0 border-bottom"
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
        </Modal.Body>
      </Modal>
    </>
  );
}

export default EditProfileModal;
