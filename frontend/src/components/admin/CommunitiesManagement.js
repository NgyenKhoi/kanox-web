// src/pages/admin/CommunitiesManagement.jsx
import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Table,
  Badge,
  Spinner,
  Alert,
} from "react-bootstrap";
import {
  fetchAllGroups,
  deleteGroupAsAdmin,
} from "../../api/groupApi";
import { useNavigate } from "react-router-dom";
import { FaEye, FaUsers, FaTrash } from "react-icons/fa";

const CommunitiesManagement = () => {
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const loadCommunities = async () => {
    try {
      const data = await fetchAllGroups();
      setCommunities(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCommunities();
  }, []);

  const handleView = (id) => {
    navigate(`/admin/groups/${id}/view`);
  };

  const handleManageMembers = (id) => {
    navigate(`/admin/groups/${id}/members`);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa nhóm này không?")) return;
    try {
      await deleteGroupAsAdmin(id);
      setCommunities((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      alert("Lỗi khi xóa nhóm: " + err.message);
    }
  };

  if (loading)
    return (
        <div className="d-flex justify-content-center align-items-center" style={{ height: "60vh" }}>
          <Spinner animation="border" variant="success" />
        </div>
    );

  if (error)
    return (
        <Container>
          <Alert variant="danger" className="mt-4">
            {error}
          </Alert>
        </Container>
    );

  return (
      <Container fluid className="mt-4">
        <Row>
          <Col>
            <Card className="shadow-sm rounded-4">
              <Card.Header className="bg-success text-white rounded-top-4">
                <h4 className="mb-0">Quản lý Cộng đồng</h4>
              </Card.Header>
              <Card.Body>
                <Table hover responsive className="align-middle table-bordered rounded-3 overflow-hidden">
                  <thead className="table-light">
                  <tr>
                    <th>Tên cộng đồng</th>
                    <th>Thành viên</th>
                    <th>Trạng thái</th>
                    <th>Loại</th>
                    <th>Ngày tạo</th>
                    <th className="text-center">Hành động</th>
                  </tr>
                  </thead>
                  <tbody>
                  {communities.map((community) => (
                      <tr key={community.id}>
                        <td className="fw-semibold">{community.name}</td>
                        <td>{community.members}</td>
                        <td>
                          <Badge bg={community.status === "active" ? "success" : "secondary"}>
                            {community.status === "active" ? "Hoạt động" : "Vô hiệu"}
                          </Badge>
                        </td>
                        <td>
                          <Badge bg={community.type === "public" ? "primary" : "dark"}>
                            {community.type === "public" ? "Công khai" : "Riêng tư"}
                          </Badge>
                        </td>
                        <td>{new Date(community.created).toLocaleDateString()}</td>
                        <td className="text-center">
                          <Button
                              variant="outline-primary"
                              size="sm"
                              className="me-1"
                              onClick={() => handleView(community.id)}
                          >
                            <FaEye className="me-1" />
                            Xem
                          </Button>
                          <Button
                              variant="outline-info"
                              size="sm"
                              className="me-1"
                              onClick={() => handleManageMembers(community.id)}
                          >
                            <FaUsers className="me-1" />
                            Thành viên
                          </Button>
                          <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleDelete(community.id)}
                          >
                            <FaTrash className="me-1" />
                            Xóa
                          </Button>
                        </td>
                      </tr>
                  ))}
                  </tbody>
                </Table>
                {communities.length === 0 && (
                    <p className="text-center text-muted">Không có cộng đồng nào.</p>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
  );
};

export default CommunitiesManagement;
