import React, { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { X as XCloseIcon } from "react-bootstrap-icons";

import KLogoSvg from "../../../components/svgs/KSvg"; // Import component KLogoSvg mới

const ForgotPasswordModal = ({ show, handleClose }) => {
  const [identifier, setIdentifier] = useState("");

  const handleInputChange = (e) => {
    setIdentifier(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Identifier for password reset:", identifier);
    handleClose();
  };

  return (
    <Modal show={show} onHide={handleClose} centered size="lg">
      <Modal.Body
        className="p-4 rounded-3"
        style={{ backgroundColor: "#fff", color: "#000", borderRadius: "15px" }}
      >
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
            {/* Sử dụng component KLogoSvg */}
            <KLogoSvg className="w-100 h-100" fill="black" />{" "}
            {/* Đặt fill="black" */}
          </div>
          <div style={{ width: "30px" }}></div>
        </div>

        <h3 className="fw-bold mb-2 text-center">
          Tìm tài khoản KaNox của bạn
        </h3>
        <p className="text-muted small mb-4 text-center">
          Nhập email, số điện thoại hoặc tên người dùng liên kết với tài khoản
          để thay đổi mật khẩu của bạn.
        </p>

        <Form
          onSubmit={handleSubmit}
          className="mx-auto"
          style={{ maxWidth: "300px" }}
        >
          <Form.Group className="mb-5">
            <Form.Control
              type="text"
              placeholder="Email, số điện thoại hoặc tên người dùng"
              name="identifier"
              value={identifier}
              onChange={handleInputChange}
              className="py-3 px-3 rounded-3"
              style={{ fontSize: "1.1rem", borderColor: "#ccc" }}
            />
          </Form.Group>

          <Button
            type="submit"
            variant="dark"
            className="py-3 rounded-pill fw-bold w-100"
            style={{
              backgroundColor: "#000",
              borderColor: "#000",
              fontSize: "1.2rem",
            }}
            disabled={!identifier}
          >
            Tiếp theo
          </Button>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default ForgotPasswordModal;
