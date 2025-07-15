import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Spinner, Row, Col, Card, Badge, Button } from "react-bootstrap";
import { fetchGroupDetailById } from "../../api/groupApi"; // ✅ Đảm bảo đúng path file

const GroupAdminPage = () => {
    const { groupId: id } = useParams();
    const [groupInfo, setGroupInfo] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadGroup = async () => {
            try {
                const data = await fetchGroupDetailById(id);
                setGroupInfo(data);
            } catch (error) {
                console.error("❌ Lỗi khi lấy thông tin nhóm:", error.message);
            } finally {
                setLoading(false);
            }
        };

        loadGroup();
    }, [id]);

    if (loading) {
        return (
            <div className="text-center mt-5">
                <Spinner animation="border" />
                <p>Đang tải thông tin nhóm...</p>
            </div>
        );
    }

    if (!groupInfo) {
        return <p className="text-center text-danger">Không thể tải dữ liệu nhóm.</p>;
    }

    return (
        <div className="container mt-4">
            <h2 className="mb-4">Chi tiết Quản trị Nhóm</h2>
            <Row>
                <Col md={4}>
                    <Card className="shadow">
                        <Card.Img
                            variant="top"
                            src={groupInfo.avatarUrl || "https://via.placeholder.com/400x200.png?text=No+Avatar"}
                            style={{ height: "200px", objectFit: "cover" }}
                        />
                        <Card.Body>
                            <Card.Title>{groupInfo.name}</Card.Title>
                            <Card.Subtitle className="mb-2 text-muted">
                                Nhóm{" "}
                                {groupInfo.privacyLevel === "private" ? (
                                    <Badge bg="secondary">Riêng tư</Badge>
                                ) : (
                                    <Badge bg="primary">Công khai</Badge>
                                )}
                            </Card.Subtitle>
                            <Card.Text>
                                {groupInfo.description || "Không có mô tả"}
                            </Card.Text>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={8}>
                    <Card className="shadow mb-4">
                        <Card.Body>
                            <h5>Thông tin khác</h5>
                            <p><strong>ID nhóm:</strong> {groupInfo.id}</p>
                            <p><strong>Ngày tạo:</strong> {new Date(groupInfo.createdAt).toLocaleDateString()}</p>
                            <p><strong>Số thành viên:</strong> {groupInfo.totalMembers}</p>
                            <p><strong>Trạng thái:</strong> {groupInfo.status ? (
                                <Badge bg="success">Hoạt động</Badge>
                            ) : (
                                <Badge bg="danger">Vô hiệu</Badge>
                            )}</p>
                        </Card.Body>
                    </Card>

                    <div className="d-flex gap-3">
                        <Button variant="outline-primary">Quản lý thành viên</Button>
                        <Button variant="outline-warning">Cập nhật nhóm</Button>
                        <Button variant="outline-danger">Xoá nhóm</Button>
                    </div>
                </Col>
            </Row>
        </div>
    );
};

export default GroupAdminPage;
