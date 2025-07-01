import React, { useState, useEffect, useContext } from "react";
import { Container, Row, Col, Form, Button, Spinner, ListGroup, Modal } from "react-bootstrap";
import { FaArrowLeft, FaPlusCircle, FaSearch, FaTrash } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
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
    const [showMembersModal, setShowMembersModal] = useState(false);
    const [selectedListId, setSelectedListId] = useState(null);
    const [selectedListName, setSelectedListName] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [members, setMembers] = useState([]);
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        // if (!user) {
        //     navigate("/");
        //     return;
        // }
        fetchLists();
    }, [user, navigate]);

    const fetchLists = async () => {
        setLoading(true);
        const token = sessionStorage.getItem("token") || localStorage.getItem("token");
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
        const token = sessionStorage.getItem("token") || localStorage.getItem("token");
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
        const token = sessionStorage.getItem("token") || localStorage.getItem("token");
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

    const handleSearchUsers = async () => {
        if (!searchTerm.trim()) {
            toast.error("Vui lòng nhập từ khóa tìm kiếm");
            return;
        }
        const token = sessionStorage.getItem("token") || localStorage.getItem("token");
        try {
            const response = await fetch(
                `${process.env.REACT_APP_API_URL}/search/users?query=${encodeURIComponent(searchTerm)}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Không thể tìm kiếm");
            setSearchResults(data.data || []);
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleAddMember = async (memberId) => {
        const token = sessionStorage.getItem("token") || localStorage.getItem("token");
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
            setSearchTerm("");
            setSearchResults([]);
            setShowAddMemberModal(false);
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleViewMembers = async (listId, listName) => {
        const token = sessionStorage.getItem("token") || localStorage.getItem("token");
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
        const token = sessionStorage.getItem("token") || localStorage.getItem("token");
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
        return React.createElement(
            "div",
            { className: "d-flex justify-content-center align-items-center min-vh-100" },
            React.createElement(Spinner, { animation: "border" })
        );
    }

    return React.createElement(
        React.Fragment,
        null,
        React.createElement(ToastContainer),
        React.createElement(
            Container,
            { fluid: true, className: "min-vh-100 p-0" },
            React.createElement(
                "div",
                { className: "sticky-top bg-white py-2 border-bottom" },
                React.createElement(
                    Container,
                    { fluid: true },
                    React.createElement(
                        Row,
                        null,
                        React.createElement(
                            Col,
                            { xs: 12, lg: 12, className: "mx-auto d-flex align-items-center ps-md-5" },
                            React.createElement(
                                Link,
                                { to: "/settings", className: "btn btn-light" },
                                React.createElement(FaArrowLeft, { size: 20 })
                            ),
                            React.createElement(
                                "div",
                                null,
                                React.createElement("h5", { className: "mb-0 fw-bold text-dark" }, "Danh sách tùy chỉnh"),
                                React.createElement("span", { className: "text-dark small" }, "Quản lý danh sách riêng tư")
                            )
                        )
                    )
                )
            ),
            React.createElement(
                Container,
                { fluid: true, className: "flex-grow-1" },
                React.createElement(
                    Row,
                    null,
                    React.createElement(
                        Col,
                        { xs: 12, lg: 6, className: "px-md-0" },
                        React.createElement(
                            "div",
                            { className: "p-3" },
                            React.createElement("h4", { className: "text-dark mb-4" }, "Tạo danh sách mới"),
                            React.createElement(
                                Form,
                                { className: "mb-4" },
                                React.createElement(
                                    Form.Group,
                                    { className: "mb-3" },
                                    React.createElement(Form.Label, { className: "fw-bold text-dark" }, "Tên danh sách"),
                                    React.createElement(Form.Control, {
                                        type: "text",
                                        placeholder: "Nhập tên danh sách",
                                        value: newListName,
                                        onChange: (e) => setNewListName(e.target.value),
                                        className: "rounded-pill",
                                    })
                                ),
                                React.createElement(
                                    Button,
                                    {
                                        variant: "primary",
                                        className: "rounded-pill px-4 py-2 fw-bold",
                                        onClick: handleCreateList,
                                    },
                                    "Tạo danh sách"
                                )
                            ),
                            React.createElement("h4", { className: "text-dark mb-3" }, "Danh sách của bạn"),
                            React.createElement(
                                ListGroup,
                                { variant: "flush" },
                                lists.length === 0
                                    ? React.createElement("p", { className: "text-muted text-center p-4" }, "Chưa có danh sách nào")
                                    : lists.map((list) =>
                                        React.createElement(
                                            ListGroup.Item,
                                            { key: list.id, className: "d-flex align-items-center py-3" },
                                            React.createElement(
                                                "div",
                                                { className: "flex-grow-1" },
                                                React.createElement(
                                                    "span",
                                                    {
                                                        className: "fw-bold text-dark cursor-pointer",
                                                        onClick: () => handleViewMembers(list.id, list.listName),
                                                    },
                                                    list.listName
                                                )
                                            ),
                                            React.createElement(
                                                Button,
                                                {
                                                    variant: "outline-primary",
                                                    className: "rounded-pill px-3 me-2",
                                                    onClick: () => {
                                                        setSelectedListId(list.id);
                                                        setShowAddMemberModal(true);
                                                    },
                                                },
                                                React.createElement(FaPlusCircle, { className: "me-2" }),
                                                " Thêm"
                                            ),
                                            React.createElement(
                                                Button,
                                                {
                                                    variant: "outline-danger",
                                                    className: "rounded-pill px-3",
                                                    onClick: () => handleDeleteList(list.id),
                                                },
                                                React.createElement(FaTrash, { className: "me-2" }),
                                                " Xóa"
                                            )
                                        )
                                    )
                            )
                        )
                    ),
                    React.createElement(Col, { xs: 0, lg: 3, className: "d-none d-lg-block p-0" }, React.createElement(SidebarRight))
                )
            ),
            React.createElement(
                Modal,
                { show: showAddMemberModal, onHide: () => setShowAddMemberModal(false), centered: true },
                React.createElement(
                    Modal.Header,
                    { closeButton: true },
                    React.createElement(Modal.Title, { className: "ms-auto text-center w-100" }, "Thêm thành viên")
                ),
                React.createElement(
                    Modal.Body,
                    { className: "p-3" },
                    React.createElement(
                        Form,
                        { className: "mb-3 d-flex align-items-center" },
                        React.createElement(FaSearch, { className: "me-2 text-muted" }),
                        React.createElement(Form.Control, {
                            type: "text",
                            placeholder: "Tìm kiếm người dùng",
                            value: searchTerm,
                            onChange: (e) => setSearchTerm(e.target.value),
                            onKeyPress: (e) => e.key === "Enter" && handleSearchUsers(),
                            className: "rounded-pill border-0 bg-light",
                        }),
                        React.createElement(
                            Button,
                            { variant: "primary", className: "ms-2 rounded-pill", onClick: handleSearchUsers },
                            "Tìm"
                        )
                    ),
                    React.createElement(
                        ListGroup,
                        { variant: "flush" },
                        searchResults.length === 0
                            ? React.createElement("p", { className: "text-center text-muted mt-4" }, "Không tìm thấy người dùng")
                            : searchResults.map((result) =>
                                React.createElement(
                                    ListGroup.Item,
                                    { key: result.id, className: "d-flex align-items-center py-3 px-0" },
                                    React.createElement(
                                        "div",
                                        { className: "flex-grow-1" },
                                        React.createElement("div", { className: "fw-bold" }, result.displayName || result.username),
                                        React.createElement("span", { className: "text-muted" }, `@${result.username}`),
                                        React.createElement(
                                            Button,
                                            {
                                                variant: "outline-primary",
                                                className: "rounded-pill px-3",
                                                onClick: () => handleAddMember(result.id),
                                            },
                                            "Thêm"
                                        )
                                    )
                                )
                            )
                    )
                )
            ),
            React.createElement(
                Modal,
                { show: showMembersModal, onHide: () => setShowMembersModal(false), centered: true },
                React.createElement(
                    Modal.Header,
                    { closeButton: true },
                    React.createElement(
                        Modal.Title,
                        { className: "ms-auto text-center w-100" },
                        `Thành viên của ${selectedListName}`
                    )
                ),
                React.createElement(
                    Modal.Body,
                    { className: "p-3" },
                    React.createElement(
                        ListGroup,
                        { variant: "flush" },
                        members.length === 0
                            ? React.createElement("p", { className: "text-center text-muted mt-4" }, "Chưa có thành viên")
                            : members.map((member) =>
                                React.createElement(
                                    ListGroup.Item,
                                    { key: member.memberUserId, className: "d-flex align-items-center py-3 px-0" },
                                    React.createElement(
                                        "div",
                                        { className: "flex-grow-1" },
                                        React.createElement("div", { className: "fw-bold" }, member.displayName || member.username),
                                        React.createElement("div", { className: "text-muted" }, `@${member.username}`)
                                    ),
                                    React.createElement(
                                        Button,
                                        {
                                            variant: "outline-danger",
                                            className: "rounded-pill px-3",
                                            onClick: () => handleRemoveMember(member.memberUserId),
                                        },
                                        React.createElement(FaTrash),
                                        " Xóa"
                                    )
                                )
                            )
                    )
                )
            )
        )
    );
}

export default CustomPrivacyListPage;