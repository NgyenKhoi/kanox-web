import React, { useState, useContext } from "react";
import {
  Container,
  Form,
  Button,
  ProgressBar,
  Alert,
  Card,
  Dropdown,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import {
  FaUpload,
  FaGlobeAmericas,
  FaUserFriends,
  FaLock,
} from "react-icons/fa";
import { toast } from "react-toastify";

const CreateStoryPage = () => {
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();
  // State để lưu quyền riêng tư, mặc định là 'public'
  const [privacy, setPrivacy] = useState("public");

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("video/")) {
      setVideoFile(file);
      const previewUrl = URL.createObjectURL(file);
      setVideoPreview(previewUrl);
      setError("");
    } else {
      setError("Vui lòng chọn một file video hợp lệ.");
      setVideoFile(null);
      setVideoPreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!videoFile) {
      setError("Bạn chưa chọn video để đăng.");
      return;
    }

    setIsLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", videoFile);
    // **Thêm dữ liệu quyền riêng tư vào request**
    formData.append("privacy", privacy);

    try {
      const xhr = new XMLHttpRequest();
      xhr.open(
        "POST",
        // Đảm bảo endpoint của bạn có thể xử lý multipart/form-data
        `${process.env.REACT_APP_API_URL}/stories`,
        true
      );
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round(
            (event.loaded / event.total) * 100
          );
          setUploadProgress(percentComplete);
        }
      };

      xhr.onload = () => {
        setIsLoading(false);
        if (xhr.status === 200 || xhr.status === 201) {
          toast.success("Đăng story thành công!");
          navigate("/home");
        } else {
          try {
            const errorResponse = JSON.parse(xhr.responseText);
            setError(
              errorResponse.message || "Đã có lỗi xảy ra khi đăng story."
            );
          } catch (parseError) {
            setError("Đã có lỗi xảy ra khi đăng story.");
          }
        }
      };

      xhr.onerror = () => {
        setIsLoading(false);
        setError("Lỗi mạng hoặc server không phản hồi.");
      };

      xhr.send(formData);
    } catch (err) {
      setIsLoading(false);
      setError(err.message || "Một lỗi không mong muốn đã xảy ra.");
    }
  };

  return (
    <Container className="mt-4 d-flex justify-content-center">
      <Card
        className="w-100"
        style={{
          maxWidth: "500px",
          backgroundColor: "var(--background-color-secondary)",
          border: "1px solid var(--border-color)",
        }}
      >
        <Card.Header as="h4" className="text-center text-[var(--text-color)]">
          Tạo Story mới
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Form.Group controlId="formFile" className="mb-3">
              <Form.Label className="text-[var(--text-color-muted)]">
                Chọn video ngắn của bạn
              </Form.Label>
              <Form.Control
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                disabled={isLoading}
              />
            </Form.Group>

            {videoPreview && (
              <div className="mb-3 text-center">
                <video
                  src={videoPreview}
                  controls
                  autoPlay
                  muted
                  className="rounded"
                  style={{ maxWidth: "100%", maxHeight: "400px" }}
                >
                  Trình duyệt của bạn không hỗ trợ thẻ video.
                </video>
              </div>
            )}

            {/* GIAO DIỆN CHỌN QUYỀN RIÊNG TƯ */}
            <Form.Group className="mb-3">
              <Form.Label className="text-[var(--text-color-muted)]">
                Quyền riêng tư
              </Form.Label>
              <Dropdown onSelect={(eventKey) => setPrivacy(eventKey)}>
                <Dropdown.Toggle
                  variant="outline-secondary"
                  id="dropdown-privacy"
                  className="w-100 d-flex justify-content-between align-items-center"
                >
                  <span>
                    {privacy === "public" && (
                      <>
                        <FaGlobeAmericas className="me-2" /> Công khai
                      </>
                    )}
                    {privacy === "friends" && (
                      <>
                        <FaUserFriends className="me-2" /> Bạn bè
                      </>
                    )}
                    {privacy === "only_me" && (
                      <>
                        <FaLock className="me-2" /> Chỉ mình tôi
                      </>
                    )}
                  </span>
                </Dropdown.Toggle>
                <Dropdown.Menu className="w-100">
                  <Dropdown.Item eventKey="public">
                    <div className="d-flex align-items-center">
                      <FaGlobeAmericas className="me-3" size={20} />
                      <div>
                        <div className="fw-bold">Công khai</div>
                        <p className="small text-muted mb-0">
                          Mọi người đều có thể xem story của bạn.
                        </p>
                      </div>
                    </div>
                  </Dropdown.Item>
                  <Dropdown.Item eventKey="friends">
                    <div className="d-flex align-items-center">
                      <FaUserFriends className="me-3" size={20} />
                      <div>
                        <div className="fw-bold">Bạn bè</div>
                        <p className="small text-muted mb-0">
                          Chỉ những người bạn đã kết bạn mới thấy.
                        </p>
                      </div>
                    </div>
                  </Dropdown.Item>
                  <Dropdown.Item eventKey="only_me">
                    <div className="d-flex align-items-center">
                      <FaLock className="me-3" size={20} />
                      <div>
                        <div className="fw-bold">Chỉ mình tôi</div>
                        <p className="small text-muted mb-0">
                          Chỉ một mình bạn có thể xem story này.
                        </p>
                      </div>
                    </div>
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </Form.Group>

            {isLoading && (
              <ProgressBar
                animated
                now={uploadProgress}
                label={`${uploadProgress}%`}
                className="mb-3"
              />
            )}

            <div className="d-grid">
              <Button
                variant="primary"
                type="submit"
                disabled={!videoFile || isLoading}
              >
                {isLoading ? (
                  "Đang đăng..."
                ) : (
                  <>
                    <FaUpload className="me-2" /> Đăng Story
                  </>
                )}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default CreateStoryPage;
