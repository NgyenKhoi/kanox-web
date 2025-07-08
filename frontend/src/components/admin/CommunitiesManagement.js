import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card, Button, Table, Badge, Spinner, Alert } from "react-bootstrap";

const CommunitiesManagement = () => {
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Gọi API lấy danh sách cộng đồng
  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/groups`);
        if (!response.ok) {
          throw new Error("Không thể tải danh sách nhóm");
        }

        const data = await response.json();
        setCommunities(data);
      } catch (err) {
        console.error("Lỗi khi gọi API:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCommunities();
  }, []);
  const handleView = (id) => console.log(`Xem cộng đồng ID: ${id}`);
  const handleManageMembers = (id) =>
      console.log(`Quản lý thành viên cộng đồng ID: ${id}`);
  const handleDelete = (id) => {
    console.log(`Xóa cộng đồng ID: ${id}`);
    // Logic xóa cộng đồng sẽ được thêm vào đây
  };

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
                        <td>
                          {new Date(community.created).toLocaleDateString()}
                        </td>
                        <td>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleView(community.id)}
                          >
                            Xem
                          </Button>
                          <Button
                            variant="info"
                            size="sm"
                            className="ms-2"
                            onClick={() => handleManageMembers(community.id)}
                          >
                            Thành viên
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            className="ms-2"
                            onClick={() => handleDelete(community.id)}
                          >
                            Xóa
                          </Button>
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