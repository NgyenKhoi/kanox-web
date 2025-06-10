// src/pages/auth/login/LoginPage.js
import React from "react";
import { Container, Row, Col, Card, Form, Button } from "react-bootstrap";
import { Link } from "react-router-dom";

function LoginPage() {
  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle login logic here
    console.log("Login form submitted");
  };

  return (
    <Container
      fluid
      className="d-flex justify-content-center align-items-center min-vh-100 bg-light"
    >
      <Row className="w-100">
        <Col xs={12} md={8} lg={6} xl={4} className="mx-auto">
          <Card className="shadow-sm p-4">
            <Card.Body>
              <h2 className="text-center mb-4 text-primary fw-bold">
                Đăng nhập
              </h2>
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="formBasicEmail">
                  <Form.Label>Tên người dùng hoặc Email</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Nhập tên người dùng hoặc email"
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3" controlId="formBasicPassword">
                  <Form.Label>Mật khẩu</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Mật khẩu"
                    required
                  />
                </Form.Group>

                <div className="d-grid gap-2 mb-3">
                  <Button variant="primary" type="submit" className="fw-bold">
                    Đăng nhập
                  </Button>
                </div>

                <div className="text-center mb-3">
                  <Link to="/reset-password">Quên mật khẩu?</Link>
                </div>

                <div className="text-center">
                  Bạn chưa có tài khoản? <Link to="/signup">Đăng ký</Link>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default LoginPage;
