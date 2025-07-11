import React, { useEffect, useState } from "react";
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
  deleteGroupAsAdmin, // ✅ Import đúng hàm API
} from "../../api/groupApi";
import { useNavigate } from "react-router-dom"; // ✅ Thêm điều hướng

const CommunitiesManagement = () => {
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate(); // ✅ Khai báo hook điều hướng

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
    navigate(`/admin/groups/${id}/view`); // 🔄 Bạn có thể sửa thành route bạn dùng cho xem chi tiết
  };

  const handleManageMembers = (id) => {
    navigate(`/groups/${id}/members`); // ✅ Điều hướng đúng đến trang GroupMembersPage
  };

  const handleDelete = async (id) => {
    try {
      await deleteGroupAsAdmin(id); // ✅ Dùng API đúng endpoint admin
      setCommunities((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      alert("Lỗi khi xóa nhóm: " + err.message);
    }
  };

  if (loading) return <Spinner animation="border" />;
  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
      <Container fluid>
        <Row>
          <Col>
            <Card className="mb-4">
              <Card.Header>
                <h3 className="mb-0">Quản lý Cộng đồng</h3>
              </Card.Header>
              <Card.Body>
                <div className="mb-4">
                  <h4 className="text-lg font-semibold mb-3">Danh sách cộng đồng</h4>
                  <Table hover responsive>
                    <thead>
                    <tr>
                      <th>Tên cộng đồng</th>
                      <th>Thành viên</th>
                      <th>Trạng thái</th>
                      <th>Loại</th>
                      <th>Ngày tạo</th>
                      <th>Hành động</th>
                    </tr>
                    </thead>
                    <tbody>
                    {communities.map((community) => (
                        <tr key={community.id}>
                          <td>{community.name}</td>
                          <td>{community.members}</td>
                          <td>
                            <Badge bg={community.status === "active" ? "success" : "danger"}>
                              {community.status === "active" ? "Hoạt động" : "Vô hiệu"}
                            </Badge>
                          </td>
                          <td>
                            <Badge bg={community.type === "public" ? "primary" : "secondary"}>
                              {community.type === "public" ? "Công khai" : "Riêng tư"}
                            </Badge>
                          </td>
                          <td>{new Date(community.created).toLocaleDateString()}</td>
                          <td>
                            <Button variant="primary" size="sm" onClick={() => handleView(community.id)}>Xem</Button>
                            <Button variant="info" size="sm" className="ms-2" onClick={() => handleManageMembers(community.id)}>Thành viên</Button>
                            <Button variant="danger" size="sm" className="ms-2" onClick={() => handleDelete(community.id)}>Xóa</Button>
                          </td>
                        </tr>
                    ))}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
  );
};

export default CommunitiesManagement;
