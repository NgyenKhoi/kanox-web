import React from "react";
import { Navbar, Container, Image, Button, Form, FormControl } from "react-bootstrap";
import { FaSearch, FaPlus } from "react-icons/fa";
import { Link } from "react-router-dom";
import KLogoSvg from "../../svgs/KSvg";

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

                <Navbar.Brand as={Link} to="/Home" className="mx-auto">
                    <KLogoSvg width="50px" height="50px" /> {/* Tăng kích thước logo lên 50px */}
                </Navbar.Brand>

                <div className="d-flex align-items-center">
                    {/* Thanh search */}
                    <Form className="d-flex me-2">
                        <FormControl
                            type="search"
                            placeholder="Tìm kiếm"
                            className="me-2"
                            aria-label="Search"
                            style={{ width: "200px" }} // Điều chỉnh độ rộng tùy ý
                        />
                        <Button
                            variant="outline-dark"
                            className="rounded-circle p-2"
                            onClick={() => window.location.href = "/search"}
                            style={{
                                borderWidth: "2px",
                                transition: "transform 0.2s, box-shadow 0.2s",
                            }}
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
                    </Form>

                    {/* Nút tạo story */}
                    <Button
                        variant="outline-dark"
                        className="rounded-circle p-2 ms-2"
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
                </div>
            </Container>
        </Navbar>
    );
}

export default Header;