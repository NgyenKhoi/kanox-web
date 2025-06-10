import React from "react";
import { Modal } from "react-bootstrap";
import TweetInput from "../TweetInput/TweetInput";

const CreatePostModal = ({ show, handleClose, onPostSuccess }) => {
  return (
    <Modal show={show} onHide={handleClose} centered size="lg">
      <Modal.Header closeButton className="border-0">
        {/* <Modal.Title>Tạo bài đăng mới</Modal.Title> */}
      </Modal.Header>
      <Modal.Body className="px-4 pb-4 pt-0">
        <TweetInput
          postOnSuccess={(newPost) => {
            onPostSuccess(newPost); // Truyền bài đăng mới lên component cha (HomePage)
            handleClose(); // Đóng modal sau khi đăng bài thành công
          }}
          isModal={true} // Báo hiệu cho TweetInput rằng nó đang ở trong modal (có thể dùng để điều chỉnh UI nếu cần)
        />
      </Modal.Body>
    </Modal>
  );
};

export default CreatePostModal;
