import React, { useState } from "react";
import { Modal, Button, Form, Nav, ListGroup } from "react-bootstrap";
import { FaSearch } from "react-icons/fa"; // Import search icon

function CommunityMembersModal({ show, handleClose, communityName, members }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // 'all' or 'moderators'

  const filteredMembers = members.filter((member) => {
    const matchesSearch =
        member.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.handle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab =
        activeTab === "all" ||
        (activeTab === "moderators" && member.type === "QTV");
    return matchesSearch && matchesTab;
  });

  return (
      <Modal
          show={show}
          onHide={handleClose}
          centered
          scrollable
          className="community-members-modal"
      >
        <Modal.Header
            closeButton
            className="d-flex justify-content-between align-items-center"
        >
          <Modal.Title className="ms-auto text-center w-100">
            Thành viên
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-3">
          {/* Search Input */}
          <Form className="mb-3 d-flex align-items-center members-search-input-wrapper">
            <FaSearch className="me-2 text-muted" />
            <Form.Control
                type="text"
                placeholder="Tìm kiếm người"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="rounded-pill border-0 bg-light flex-grow-1"
                style={{ boxShadow: "none" }}
            />
          </Form>

          {/* Category Tabs */}
          <Nav variant="underline" className="members-category-nav mb-4">
            <Nav.Item>
              <Nav.Link
                  eventKey="all"
                  active={activeTab === "all"}
                  onClick={() => setActiveTab("all")}
              >
                Tất cả
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link
                  eventKey="moderators"
                  active={activeTab === "moderators"}
                  onClick={() => setActiveTab("moderators")}
              >
                Người kiểm duyệt
              </Nav.Link>
            </Nav.Item>
          </Nav>

          {/* Member List */}
          <ListGroup variant="flush">
            {filteredMembers.length === 0 ? (
                <p className="text-center text-muted mt-4">
                  Không tìm thấy thành viên nào.
                </p>
            ) : (
                filteredMembers.map((member) => (
                    <ListGroup.Item
                        key={member.id}
                        className="d-flex align-items-center py-2 px-0 member-list-item"
                    >
                      <img
                          src={member.avatar}
                          alt="Member Avatar"
                          className="rounded-circle me-3"
                          style={{ width: "50px", height: "50px", objectFit: "cover" }}
                      />
                      <div className="flex-grow-1">
                        <div className="fw-bold">
                          {member.username}{" "}
                          {member.type === "QTV" && (
                              <span className="badge bg-primary ms-1">QTV</span>
                          )}
                        </div>
                        <div className="text-muted">
                          @{member.handle} · {member.type}
                        </div>
                      </div>
                      {/* You might want a "Theo dõi" (Follow) button here */}
                      <Button variant="outline-primary" className="rounded-pill px-3">
                        Theo dõi
                      </Button>
                    </ListGroup.Item>
                ))
            )}
          </ListGroup>
        </Modal.Body>
      </Modal>
  );
}

export default CommunityMembersModal;