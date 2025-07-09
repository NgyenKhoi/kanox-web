import React from "react";
import { Row, Col } from "react-bootstrap";
import { useLocation } from "react-router-dom";
import CommunitySidebarLeft from "../../community/CommunitySidebarLeft";

export default function CommunityLayout({
                                            children,
                                            selectedView,
                                            onSelectView,
                                            onToggleDarkMode,
                                            isDarkMode,
                                            onGroupCreated,
                                        }) {
    const location = useLocation();

    return (
        <Row className="m-0">
            <Col lg={3} className="p-0 d-none d-lg-block">
                <CommunitySidebarLeft
                    selectedView={selectedView}
                    onSelectView={onSelectView}
                    onGroupCreated={onGroupCreated}
                    onToggleDarkMode={onToggleDarkMode}
                    isDarkMode={isDarkMode}
                />
            </Col>
            <Col lg={9} className="p-0">
                {children}
            </Col>
        </Row>
    );
}
