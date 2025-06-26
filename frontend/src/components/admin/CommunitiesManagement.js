import React from "react";
import { Container, Row, Col, Card, Button, Table, Badge } from "react-bootstrap";

const CommunitiesManagement = () => {
  const communities = [
    {
      id: "c1",
      name: "Yêu Thích ReactJS",
      members: 1200,
      status: "active",
      type: "public",
      created: "2023-02-01",
    },
    {
      id: "c2",
      name: "Game Thủ Việt",
      members: 5000,
      status: "active",
      type: "public",
      created: "2022-08-10",
    },
    {
      id: "c3",
      name: "Marketing Pro",
      members: 300,
      status: "private",
      created: "2023-11-15",
    },
    {
      id: "c4",
      name: "Fans K-Pop Việt",
      members: 1500,
      status: "active",
      type: "public",
      created: "2024-01-05",
    },
    {
      id: "c5",
      name: "Developer Freelancer",
      members: 180,
      status: "active",
      type: "private",
      created: "2023-04-20",
    }
  ];

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