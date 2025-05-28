// src/components/layout/Header/Header.jsx
import React from "react";
import { Navbar, Container, Image } from "react-bootstrap";
import { FaTwitter, FaSearch } from "react-icons/fa"; // Dùng FaTwitter tạm thời cho logo X
import { Link } from "react-router-dom";

function Header() {
  return (
    <Navbar
      bg="white"
      expand="lg"
      className="border-bottom shadow-sm fixed-top d-lg-none"
    >
      {" "}
      <Container className="d-flex justify-content-between align-items-center">
        {/* Avatar người dùng ở góc trái trên mobile */}
        <Image
          src="https://via.placeholder.com/40" // Thay bằng ảnh avatar thật
          alt="User Avatar"
          roundedCircle
          width={40}
          height={40}
          className="me-2"
        />

        <Navbar.Brand as={Link} to="/" className="mx-auto">
          <FaTwitter size={30} className="text-dark" />{" "}
        </Navbar.Brand>

        <FaSearch size={20} className="text-secondary" />
      </Container>
    </Navbar>
  );
}

export default Header;
