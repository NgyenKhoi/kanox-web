import React, { useState, useEffect, useContext } from "react";
import { Container, Row, Col, Form, Button, Spinner, ListGroup, Modal } from "react-bootstrap";
import { FaArrowLeft, FaPlusCircle, FaSearch, FaTrash } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import SidebarRight from "../../components/layout/SidebarRight/SidebarRight";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import useUserSearch from "../../hooks/useUserSearch";

function CustomPrivacyListPage() {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [lists, setLists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newListName, setNewListName] = useState("");
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);
    const [showMembersModal, setShowMembersModal] = useState(false);
    const [selectedListId, setSelectedListId] = useState(null);
    const [selectedListName, setSelectedListName] = useState("");
    const [members, setMembers] = useState([]);
    const [isDarkMode, setIsDarkMode] = useState(false);

    const token = sessionStorage.getItem("token") || localStorage.getItem("token");
    const {
        searchKeyword,
        setSearchKeyword,
        searchResults,
        isSearching,
    } = useUserSearch(token, navigate);

    useEffect(() => {
        fetchLists();
    }, []);

    const fetchLists = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/privacy/lists`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Không thể lấy danh sách");
            setLists(data.data || []);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateList = async () => {
        if (!newListName.trim()) {
            toast.error("Tên danh sách không được để trống");
            return;
        }
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/privacy/lists`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ listName: newListName }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Không thể tạo danh sách");
            toast.success("Tạo danh sách thành công");
            setNewListName("");
            fetchLists();
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleDeleteList = async (listId) => {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/privacy/lists/${listId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Không thể xóa danh sách");
            toast.success("Xóa danh sách thành công");
            fetchLists();
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleAddMember = async (memberId) => {
        try {
            const response = await fetch(
                `${process.env.REACT_APP_API_URL}/privacy/lists/${selectedListId}/members`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ memberId }),
                }
            );
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Không thể thêm thành viên");
            toast.success("Thêm thành viên thành công");
            setSearchKeyword("");
            setShowAddMemberModal(false);
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleViewMembers = async (listId, listName) => {
        try {
            const response = await fetch(
                `${process.env.REACT_APP_API_URL}/privacy/lists/${listId}/members`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Không thể lấy thành viên");
            setMembers(data.data || []);
            setSelectedListId(listId);
            setSelectedListName(listName);
            setShowMembersModal(true);
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleRemoveMember = async (memberId) => {
        try {
            const response = await fetch(
                `${process.env.REACT_APP_API_URL}/privacy/lists/${selectedListId}/members/${memberId}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Không thể xóa thành viên");
            toast.success("Xóa thành viên thành công");
            handleViewMembers(selectedListId, selectedListName);
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleToggleDarkMode = () => {
        setIsDarkMode((prev) => !prev);
        document.body.classList.toggle("dark-mode", !isDarkMode);
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center min-vh-100">
                <Spinner animation="border" />
            </div>
        );
    }

    return (
        <>
            <ToastContainer />
            <Container fluid className="min-vh-100 p-0">
                <div className="sticky-top bg-white py-2 border-bottom">
                    <Container fluid>
                        <Row>
                            <Col xs={12} lg={12} className="mx-auto d-flex align-items-center ps-md-5">
                                <Link to="/settings" className="btn btn-light">
                                    <FaArrowLeft size={20} />
                                </Link>
                                <div>
                                    <h5 className="mb-0 fw-bold text-dark">Danh sách tùy chỉnh</h5>
                                    <span className="text-dark small">Quản lý danh sách riêng tư</span>
                                </div>
                            </Col>
                        </Row>
                    </Container>
                </div>

                <Container fluid className="flex-grow-1">
                    <Row>
                        <Col xs={12} lg={6} className="px-md-0">
                            <div className="p-3">
                                <h4 className="text-dark mb-4">Tạo danh sách mới</h4>
                                <Form className="mb-4">
                                    <Form.Group className="mb-3">
                                        <Form.Label className="fw-bold text-dark">Tên danh sách</Form.Label>
                                        <Form.Control
                                            type="text"
                                            placeholder="Nhập tên danh sách"
                                            value={newListName}
                                            onChange={(e) => setNewListName(e.target.value)}
                                            className="rounded-pill"
                                        />
                                    </Form.Group>
                                    <Button
                                        variant="primary"
                                        className="rounded-pill px-4 py-2 fw-bold"
                                        onClick={handleCreateList}
                                    >
                                        Tạo danh sách
                                    </Button>
                                </Form>

                                <h4 className="text-dark mb-3">Danh sách của bạn</h4>
                                <ListGroup variant="flush">
                                    {lists.length === 0 ? (
                                        <p className="text-muted text-center p-4">Chưa có danh sách nào</p>
                                    ) : (
                                        lists.map((list) => (
                                            <ListGroup.Item key={list.id} className="d-flex align-items-center py-3">
                                                <div className="flex-grow-1">
                                                    <span
                                                        className="fw-bold text-dark"
                                                        style={{ cursor: "pointer" }}
                                                        onClick={() => handleViewMembers(list.id, list.listName)}
                                                    >
                                                        {list.listName}
                                                    </span>
                                                </div>
                                                <Button
                                                    variant="outline-primary"
                                                    className="rounded-pill px-3 me-2"
                                                    onClick={() => {
                                                        setSelectedListId(list.id);
                                                        setShowAddMemberModal(true);
                                                    }}
                                                >
                                                    <FaPlusCircle className="me-2" />
                                                    Thêm
                                                </Button>
                                                <Button
                                                    variant="outline-danger"
                                                    className="rounded-pill px-3"
                                                    onClick={() => handleDeleteList(list.id)}
                                                >
                                                    <FaTrash className="me-2" />
                                                    Xóa
                                                </Button>
                                            </ListGroup.Item>
                                        ))
                                    )}
                                </ListGroup>
                            </div>
                        </Col>
                        <Col xs={0} lg={3} className="d-none d-lg-block p-0">
                            <SidebarRight />
                        </Col>
                    </Row>
                </Container>

                {/* Modal Thêm thành viên */}
                <Modal show={showAddMemberModal} onHide={() => setShowAddMemberModal(false)} centered>
                    <Modal.Header closeButton>
                        <Modal.Title className="ms-auto text-center w-100">Thêm thành viên</Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="p-3">
                        <Form className="mb-3 d-flex align-items-center">
                            <FaSearch className="me-2 text-muted" />
                            <Form.Control
                                type="text"
                                placeholder="Tìm kiếm người dùng"
                                value={searchKeyword}
                                onChange={(e) => setSearchKeyword(e.target.value)}
                                className="rounded-pill border-0 bg-light"
                            />
                        </Form>
                        <ListGroup variant="flush">
                            {isSearching ? (
                                <p className="text-center text-muted mt-4">Đang tìm kiếm...</p>
                            ) : searchResults.length === 0 ? (
                                <p className="text-center text-muted mt-4">Không tìm thấy người dùng</p>
                            ) : (
                                searchResults.map((result) => (
                                    <ListGroup.Item key={result.id} className="d-flex align-items-center py-3 px-0">
                                        <div className="flex-grow-1">
                                            <div className="fw-bold">
                                                {result.displayName || result.username}
                                            </div>
                                            <span className="text-muted">@{result.username}</span>
                                        </div>
                                        <Button
                                            variant="outline-primary"
                                            className="rounded-pill px-3"
                                            onClick={() => handleAddMember(result.id)}
                                        >
                                            Thêm
                                        </Button>
                                    </ListGroup.Item>
                                ))
                            )}
                        </ListGroup>
                    </Modal.Body>
                </Modal>

                {/* Modal Danh sách thành viên */}
                <Modal show={showMembersModal} onHide={() => setShowMembersModal(false)} centered>
                    <Modal.Header closeButton>
                        <Modal.Title className="ms-auto text-center w-100">
                            Thành viên của {selectedListName}
                        </Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="p-3">
                        <ListGroup variant="flush">
                            {members.length === 0 ? (
                                <p className="text-center text-muted mt-4">Chưa có thành viên</p>
                            ) : (
                                members.map((member) => (
                                    <ListGroup.Item
                                        key={member.memberUserId}
                                        className="d-flex align-items-center py-3 px-0"
                                    >
                                        <div className="flex-grow-1">
                                            <div className="fw-bold">
                                                {member.displayName || member.username}
                                            </div>
                                            <div className="text-muted">@{member.username}</div>
                                        </div>
                                        <Button
                                            variant="outline-danger"
                                            className="rounded-pill px-3"
                                            onClick={() => handleRemoveMember(member.memberUserId)}
                                        >
                                            <FaTrash /> Xóa
                                        </Button>
                                    </ListGroup.Item>
                                ))
                            )}
                        </ListGroup>
                    </Modal.Body>
                </Modal>
            </Container>
        </>
    );
}

export default CustomPrivacyListPage;
