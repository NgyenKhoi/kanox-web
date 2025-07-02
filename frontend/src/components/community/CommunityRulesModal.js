import React from "react";
import { Modal, Button } from "react-bootstrap";
import { FaTimes } from "react-icons/fa"; // Import the close icon

function CommunityRulesModal({
                               show,
                               handleClose,
                               communityName,
                               rules,
                               onAgreeToJoin,
                             }) {
  return (
      <Modal
          show={show}
          onHide={handleClose}
          centered
          className="community-rules-modal"
      >
        <Modal.Header
            closeButton
            className="d-flex justify-content-between align-items-center"
        >
          <Modal.Title className="ms-auto text-center w-100">
            Quy tắc cho {communityName}
          </Modal.Title>
          {/* FaTimes is part of the closeButton functionality, but if you want custom, you can put it here */}
        </Modal.Header>
        <Modal.Body className="p-4">
          <h5 className="mb-3">
            Xem lại và đồng ý với Quy tắc của {communityName}
          </h5>
          <p className="text-muted small">
            Những quy tắc này do các quản trị viên của Cộng đồng đặt ra, thực thi
            và tồn tại bên cạnh Quy tắc của X.
          </p>

          {rules.map((rule, index) => (
              <div key={index} className="d-flex mb-3">
                <span className="me-2 fw-bold rule-number">{index + 1}</span>
                <div>
                  <p className="fw-bold mb-1">{rule.title}</p>
                  <p className="text-muted mb-0">{rule.description}</p>
                </div>
              </div>
          ))}
        </Modal.Body>
        <Modal.Footer className="d-flex justify-content-center border-0">
          <Button
              variant="primary"
              className="rounded-pill px-5 py-2"
              onClick={onAgreeToJoin}
          >
            Đồng ý và tham gia
          </Button>
        </Modal.Footer>
      </Modal>
  );
}

export default CommunityRulesModal;