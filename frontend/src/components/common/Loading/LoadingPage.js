// src/components/common/LoadingPage/LoadingPage.js
import React from "react";
import { Container, Spinner } from "react-bootstrap";
import KLogoSvg from "../../svgs/KSvg"; // Adjust path if your KLogoSvg is elsewhere

function LoadingPage() {
  return (
    <Container
      fluid
      className="d-flex flex-column justify-content-center align-items-center vh-100 bg-[var(--background-color)]"
    >
      {/* Logo của web */}
      <KLogoSvg
        width="1000px"
        height="1000px"
        fill="#000000"
        className="mb-4"
      />
      {/* Spinner tải */}
      {/* <Spinner animation="border" role="status" variant="primary">
        <span className="visually-hidden">Đang tải...</span>
      </Spinner>
      <p className="mt-3 text-muted">Đang tải trang, vui lòng chờ...</p> */}
    </Container>
  );
}

export default LoadingPage;
