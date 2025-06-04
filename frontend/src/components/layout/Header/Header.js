import React from "react";
import { Navbar, Container, Image, Button } from "react-bootstrap";
import { FaTwitter, FaSearch, FaPlus } from "react-icons/fa";
import { Link } from "react-router-dom";

function Header() {
  return (
      <Navbar
          expand="lg"
          className="border-bottom shadow-sm fixed-top bg-primary d-md-none"
      >
        <Container className="d-flex justify-content-between align-items-center">
          <Image
              src="https://via.placeholder.com/40"
              alt="User Avatar"
              roundedCircle
              width={40}
              height={40}
              className="me-2"
          />

          <Navbar.Brand as={Link} to="/Home" className="mx-auto">
            <FaTwitter size={30} className="text-white" />
          </Navbar.Brand>

          <div className="d-flex align-items-center">
            <Button
                variant="outline-light"
                className="rounded-circle p-1 ms-2 d-md-none"
                onClick={() => window.location.href = "/create-story"}
            >
              <FaPlus size={16} color="#fff" />
            </Button>
            <FaSearch size={20} className="text-white ms-2" />
          </div>
        </Container>
      </Navbar>
  );
}

export default Header;