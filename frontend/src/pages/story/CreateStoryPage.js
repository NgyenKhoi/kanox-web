import React, { useState, useContext } from "react";
import {
  Container,
  Form,
  Button,
  ProgressBar,
  Alert,
  Card,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { FaUpload } from "react-icons/fa";
import { AuthContext } from "../../context/AuthContext";

const CreateStoryPage = () => {
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("video/")) {
      setVideoFile(file);
      // Tạo URL xem trước cho video
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

    try {
      // Sử dụng XMLHttpRequest để theo dõi tiến trình upload
      const xhr = new XMLHttpRequest();
      xhr.open(
        "POST",
        `${process.env.REACT_APP_API_URL}/api/stories/create`,
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
          // Upload thành công, chuyển hướng về trang chủ
          navigate("/home", { state: { message: "Đăng story thành công!" } });
        } else {
          const errorResponse = JSON.parse(xhr.responseText);
          setError(errorResponse.message || "Đã có lỗi xảy ra khi đăng story.");
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
