import React from "react";
import { Container, Row, Col } from "react-bootstrap";

const HomePage = () => {
  return (
    <Container
      fluid
      className="d-flex min-vh-100 bg-light text-dark justify-content-center align-items-center"
    >
      <Row>
        <Col className="text-center">
          <h1 className="display-4 fw-bold">Chào mừng bạn đến với KaNox!</h1>
          <p className="lead">Bạn đã đăng nhập/đăng ký thành công.</p>
        </Col>
      </Row>
    </Container>
  );
};

export default HomePage;
