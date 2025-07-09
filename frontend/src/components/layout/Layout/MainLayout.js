import React from "react";
import { Col, Row, Container } from "react-bootstrap";
import SidebarLeft from "../SidebarLeft/SidebarLeft";

export default function MainLayout({ children, onToggleDarkMode, isDarkMode, onShowCreatePost }) {
    return (
        <Container fluid className="min-vh-100 p-0">
            <Row className="m-0">
                <Col xs={0} lg={3} className="p-0 d-none d-lg-block">
                    <SidebarLeft
                        onToggleDarkMode={onToggleDarkMode}
                        isDarkMode={isDarkMode}
                        onShowCreatePost={onShowCreatePost}
                    />
                </Col>
                <Col xs={12} lg={9} className="p-0">
                    {children}
                </Col>
            </Row>
        </Container>
    );
}
