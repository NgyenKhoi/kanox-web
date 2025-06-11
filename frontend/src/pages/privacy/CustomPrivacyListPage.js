import React, { useState, useEffect, useContext } from "react";
import { Container, Row, Col, Form, Button, Spinner, ListGroup, Modal } from "react-bootstrap";
import { FaArrowLeft, FaPlusCircle, FaSearch } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import SidebarLeft from "../../components/layout/SidebarLeft/SidebarLeft";
import SidebarRight from "../../components/layout/SidebarRight/SidebarRight";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function CustomPrivacyListPage() {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [lists, setLists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newListName, setNewListName] = useState("");
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);
    const [selectedListId, setSelectedListId] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        if (!user) {
            navigate("/signup");
            return;
        }
        fetchLists();
    }, [user, navigate]);

    const fetchLists = async () => {
        setLoading(true);
        const token = sessionStorage.getItem("token") || localStorage.getItem("token");
        if (!token) {
            toast.error("Không tìm thấy token. Vui lòng đăng nhập lại.");
            setLoading(false);
            navigate("/signup");
            return;
        }

        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/privacy/lists`, {
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            const contentType = response.headers.get("content-type");
            let data;
            if (contentType && contentType.includes("application/json")) {
                data = await response.json();
            } else {
                const text = await response.text();
                data = { message: text };
            }

            if (!response.ok) {
                throw new Error(data.message || "Không thể lấy danh sách tùy chỉnh.");
            }

            setLists(data.data || []);
        } catch (error) {
            console.error("Lỗi khi lấy danh sách:", error);
            toast.error(error.message || "Không thể tải danh sách!");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateList = async () => {
        if (!newListName.trim()) {
            toast.error("Tên danh sách không được để trống.");
            return;
        }

        const token = sessionStorage.getItem("token") || localStorage.getItem("token");
        if (!token) {
            toast.error("Không tìm thấy token. Vui lòng đăng nhập lại.");
            navigate("/signup");
            return;
        }

        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/privacy/lists`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ listName: newListName }),
            });

            const contentType = response.headers.get("content-type");
            let data;
            if (contentType && contentType.includes("application/json")) {
                data = await response.json();
            } else {
                const text = await response.text();
                data = { message: text };
            }

            if (!response.ok) {
                throw new Error(data.message || "Không thể tạo danh sách!");
            }

            toast.success("Tạo danh sách thành công!");
            setNewListName("");
            fetchLists();
        } catch (error) {
            console.error("Lỗi khi tạo danh sách:", error);
            toast.error(error.message || "Không thể tạo danh sách!");
        }
    };

    const handleSearchUsers = async () => {
        if (!searchTerm.trim()) {
            toast.error("Vui lòng nhập từ khóa tìm kiếm!");
            return;
        }

        const token = sessionStorage.getItem("token") || localStorage.getItem("token");
        if (!token) {
            toast.error("Không tìm thấy token. Vui lòng đăng nhập lại!");
            navigate("/signup");
            return;
        }

        try {
            const response = await fetch(
                `${process.env.REACT_APP_API_URL}/search/users?query=${encodeURIComponent(searchTerm)}`,
                {
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const contentType = response.headers.get("content-type");
            let data;
            if (contentType && contentType.includes("application/json")) {
                data = await response.json();
            } else {
                const text = await response.text();
                data = { message: text };
            }

            if (!response.ok) {
                throw new Error(data.message || "Không thể tìm kiếm người dùng!");
            }

            setSearchResults(data.data || []);
        } catch (error) {
            console.error("Lỗi khi tìm kiếm:", error);
            toast.error(error.message || "Không thể tìm kiếm!");
        }
    };

    const handleAddMember = async (memberId) => {
        const token = sessionStorage.getItem("token") || localStorage.getItem("token");
        if (!token) {
            toast.error("Không tìm thấy token!");
            navigate("/signup");
            return;
        }

        try {
            const response = await fetch(
                `${process.env.REACT_APP_API_URL}/privacy/lists/${selectedListId}/members`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ memberId }),
                }
            );

            const contentType = response.headers.get("content-type");
            let data;
            if (contentType && contentType.includes("application/json")) {
                data = await response.json();
            } else {
                const text = await response.text();
                data = { message: text };
            }

            if (!response.ok) {
                throw new Error(data.message || "Không thể thêm thành viên!");
            }

            toast.success("Thêm thành viên thành công!");
            setSearchTerm("");
            setSearchResults([]);
            setShowAddMemberModal(false);
        } catch (error) {
            console.error("Lỗi khi thêm thành viên:", error);
            toast.error(error.message || "Không thể thêm thành viên!");
        }
    };

    const handleToggleDarkMode = () => {
        setIsDarkMode((prev) => !prev);
        document.body.classList.toggle("dark-mode", !isDarkMode);
    };

    const handleShowCreatePost = () => {
        console.log("Mở modal tạo bài đăng");
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center min-vh-100">
                <Spinner animation="border" role="status" />
            </div>
        );
    }

    return (
        <>
            <ToastContainer />
            <Container fluid className="min-vh-100 p-0">
                <div className="sticky-top bg-white py-2 border-bottom" style={{ zIndex: 1020 }}>
                    <Container fluid>
                        <Row>
                            <Col xs={12} lg={12} className="mx-auto d-flex align-items-center ps-md-5">
                                <Link to="/home" className="btn btn-light">
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
                    <Row className="h-100">
                        <Col xs={0} lg={3} className="d-none d-lg-block p-0">
                            <SidebarLeft
                                onToggleDarkMode={handleToggleDarkMode}
                                isDarkMode={isDarkMode}
                                onShowCreatePost={handleShowCreatePost}
                            />
                        </Col>
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
                                        <Form.Control.Feedback />
                                    </Form.Group>
                                    <Button
                                        variant="dark"
                                        className="rounded-pill px-4 py-2 fw-bold"
                                        onClick={handleCreateList}
                                    >
                                        Tạo danh sách
                                    </Button>
                                </Form>
                                <h4 className="text-dark mb-3">Danh sách của bạn</h4>
                                <ListGroup variant="flush">
                                    {lists.length === 0 ? (
                                        <p className="text-muted text-center p-4">Chưa có danh sách nào.</p>
                                    ) : (
                                        lists.map((list) => (
                                            <ListGroup.Item key={list.id} className="d-flex align-items-center py-3">
                                                <div className="flex-grow-1">
                                                    <span className="fw-bold text-dark">{list.listName}</span>
                                                </div>
                                                <Button
                                                    variant="outline-primary"
                                                    className="rounded-pill px-3"
                                                    onClick={() => {
                                                        setSelectedListId(list.id);
                                                        setShowAddMemberModal(true);
                                                    }}
                                                >
                                                    <FaPlusCircle className="me-2" /> Thêm thành viên
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

                <Modal
                    show={showAddMemberModal}
                    onHide={() => setShowAddMemberModal(false)}
                    centered
                    className="follow-list-modal"
                >
                    <Modal.Header closeButton>
                        <Modal.Title className="ms-auto text-center w-100">Thêm thành viên</Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="p-3">
                        <Form className="mb-3 d-flex align-items-center">
                            <FaSearch className="me-2 text-muted" />
                            <Form.Control
                                type="text"
                                placeholder="Tìm kiếm người dùng"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyPress={(e) => e.key === "Enter" && handleSearchUsers()}
                                className="rounded-pill border-0 bg-light flex-grow-1"
                                style={{ boxShadow: "none" }}
                            />
                            <Button
                                variant="primary"
                                className="ms-2 rounded-pill"
                                onClick={handleSearchUsers}
                            >
                                Tìm kiếm
                            </Button>
                        </Form>
                        <ListGroup variant="flush">
                            {searchResults.length === 0 ? (
                                <p className="text-center text-muted mt-4">Không tìm thấy người dùng nào!</p>
                            ) : (
                                searchResults.map((result) => (
                                    <ListGroup.Item
                                        key={result.id}
                                        className="d-flex align-items-center py-3 px-0"
                                    >
                                        <img
                                            src={result.avatar || "https://source.unsplash.com/50x50/?portrait"}
                                            alt="User Avatar"
                                            className="rounded-circle me-3"
                                            style={{ width: "50px", height: "50px", objectFit: "cover" }}
                                        />
                                        <div className="flex-grow-1">
                                            <div className="fw-bold">{result.displayName || result.username}</div>
                                            <div className="text-muted">@{result.username}</div>
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
            </Container>
        </>
    );
}

export default CustomPrivacyListPage;