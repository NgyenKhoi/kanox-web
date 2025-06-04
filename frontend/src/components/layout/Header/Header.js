import React from "react";
import { Navbar, Container, Image, Button } from "react-bootstrap";
import { FaSearch, FaPlus } from "react-icons/fa";
import { Link } from "react-router-dom";

function Header() {
  return (
      <Navbar
          expand="lg"
          className="border-bottom shadow-sm fixed-top bg-white"
          style={{ height: "60px" }}
      >
        <Container className="d-flex justify-content-between align-items-center px-3">
          <Image
              src="https://via.placeholder.com/40"
              alt="User Avatar"
              roundedCircle
              width={40}
              height={40}
              className="me-3 border border-dark"
              style={{ transition: "transform 0.2s", cursor: "pointer" }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1.0)")}
          />
            <div className="d-flex align-items-center">
            <Button
                variant="outline-dark"
                className="rounded-circle p-2 ms-2 d-md-none"
                style={{
                  borderWidth: "2px",
                  transition: "transform 0.2s, box-shadow 0.2s",
                }}
                onClick={() => window.location.href = "/create-story"}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.1)";
                  e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1.0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
            >
              <FaPlus size={18} />
            </Button>
            <Button
                variant="outline-dark"
                className="rounded-circle p-2 ms-2 d-md-none"
                style={{
                  borderWidth: "2px",
                  transition: "transform 0.2s, box-shadow 0.2s",
                }}
                onClick={() => window.location.href = "/search"}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.1)";
                  e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1.0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
            >
              <FaSearch size={18} />
            </Button>
          </div>
        </Container>
      </Navbar>
  );
}

export default Header;