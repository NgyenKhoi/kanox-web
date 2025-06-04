import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Image } from "react-bootstrap";
import { FaCamera, FaTimes } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify"; // Import Toastify
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
    gender: "", // "0" for Female, "1" for Male, "2" for Other, "" for not set
  });

  // State để lưu trữ file ảnh được chọn (cho việc upload sau này)
  const [avatarFile, setAvatarFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);

  // useEffect để cập nhật formData khi modal hiển thị hoặc userProfile thay đổi
  useEffect(() => {
    if (show && userProfile) {
      setFormData({
        displayName: userProfile.displayName || "",
        bio: userProfile.bio || "",
        location: userProfile.location || "",
        website: userProfile.website || "",
        // Chuyển đổi định dạng ngày tháng từ ISO string sang YYYY-MM-DD
        dateOfBirth: userProfile.dateOfBirth
          ? new Date(userProfile.dateOfBirth).toISOString().split("T")[0]
          : "",
        // Đảm bảo gender là string để set vào select, hoặc "" nếu null
        gender: userProfile.gender != null ? String(userProfile.gender) : "",
        avatar: userProfile.avatar || "",
        banner: userProfile.banner || "",
      });
      // Reset files khi modal mở
      setAvatarFile(null);
      setBannerFile(null);
    }
  }, [show, userProfile]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (field, e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file); // Tạo URL tạm thời để hiển thị preview
      setFormData((prev) => ({ ...prev, [field]: imageUrl }));

      // Lưu file vào state tương ứng để upload sau này
      if (field === "avatar") {
        setAvatarFile(file);
      } else if (field === "banner") {
        setBannerFile(file);
      }
    }
  };

  const handleClearImage = (field) => {
    setFormData((prev) => ({ ...prev, [field]: "" })); // Xóa ảnh hiển thị
    if (field === "avatar") {
      setAvatarFile(null); // Xóa file đã chọn
    } else if (field === "banner") {
      setBannerFile(null); // Xóa file đã chọn
    }
    // TODO: Gửi request API để xóa ảnh trên server nếu ảnh đã được lưu trước đó
    // hoặc xử lý logic này trong handleSave nếu bạn chỉ gửi null/empty string cho ảnh.
  };

  // Hàm giả định upload file lên server và trả về URL
  const uploadFile = async (file) => {
    // Đây chỉ là một ví dụ đơn giản, bạn cần thay thế bằng logic upload thực tế của mình
    // Ví dụ: sử dụng FormData và fetch API để gửi file
    // const formData = new FormData();
    // formData.append('image', file);
    // const response = await fetch(`${process.env.REACT_APP_API_URL}/upload-image`, {
    //   method: 'POST',
    //   headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }, // Có thể cần token
    //   body: formData,
    // });
    // const data = await response.json();
    // return data.imageUrl; // Giả sử API trả về { imageUrl: "..." }

    // Hiện tại chỉ trả về một URL giả định
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(
          `https://via.placeholder.com/150x150/0000FF/FFFFFF?text=${file.name}`
        );
      }, 500);
    });
  };

  const handleSave = async () => {
  const token = localStorage.getItem("token");
  const payload = { ...formData }; // Bắt đầu từ bản sao đầy đủ của formData

  try {
    // Upload ảnh avatar nếu có
    if (avatarFile) {
      const newAvatarUrl = await uploadFile(avatarFile);
      payload.avatar = newAvatarUrl;
    }

    // Nếu avatar bị xóa
    if (!formData.avatar && userProfile.avatar) {
      payload.avatar = "";
    }

    // Upload ảnh banner nếu có
    if (bannerFile) {
      const newBannerUrl = await uploadFile(bannerFile);
      payload.banner = newBannerUrl;
    }

    // Nếu banner bị xóa
    if (!formData.banner && userProfile.banner) {
      payload.banner = "";
    }

    // Đảm bảo format đúng kiểu cho ngày sinh và giới tính
    if (payload.dateOfBirth) {
      payload.dateOfBirth = payload.dateOfBirth;
    }

    payload.gender = payload.gender ? Number(payload.gender) : null;

    // Gửi PUT request với toàn bộ payload
    const response = await fetch(
      `${process.env.REACT_APP_API_URL}/user/profile/${username}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Lỗi khi cập nhật hồ sơ.");
    }

    // Reload lại profile từ server
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
  }
};

  // Các tùy chọn cho giới tính
  const genderOptions = [
    { value: "", label: "Không xác định" }, // Tùy chọn mặc định
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
              src={
                formData.banner ||
                "https://source.unsplash.com/1200x400/?nature,water"
              } // Fallback image
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
              {formData.banner && ( // Chỉ hiển thị nút xóa nếu có ảnh banner
                <Button
                  variant="dark"
                  className="rounded-circle d-flex align-items-center justify-content-center"
                  style={{ width: "40px", height: "40px" }}
                  onClick={() => handleClearImage("banner")}
                >
                  <FaTimes size={18} />
                </Button>
              )}
            </div>
          </div>

          {/* Avatar */}
          <div
            className="position-relative"
            style={{ marginTop: "-75px", marginLeft: "20px", zIndex: 3 }}
          >
            <Image
              src={
                formData.avatar ||
                "https://source.unsplash.com/150x150/?portrait"
              } // Fallback image
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
            {formData.avatar && ( // Chỉ hiển thị nút xóa nếu có ảnh avatar
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
                  zIndex: 4,
                }}
                onClick={() => handleClearImage("avatar")}
              >
                <FaTimes size={18} />
              </Button>
            )}
          </div>

          {/* Form */}
          <Form className="p-3 pt-4">
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
                <Form.Label className="text-muted small mb-0">
                  {label}
                </Form.Label>
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

            {/* Trường giới tính */}
            <Form.Group className="mb-3" controlId="formGender">
              <Form.Label className="text-muted small mb-0">
                Giới tính
              </Form.Label>
              <Form.Select
                name="gender"
                value={formData.gender}
                onChange={(e) => handleInputChange("gender", e.target.value)}
                className="border-0 border-bottom rounded-0 px-0 pt-0 pb-1"
                style={{
                  fontSize: "1.25rem",
                  outline: "none",
                  boxShadow: "none",
                }}
              >
                {genderOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
      </Modal>
    </>
  );
}

export default EditProfileModal;
