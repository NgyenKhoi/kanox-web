import React from "react";
import { Container, Row, Col, Card, ListGroup } from "react-bootstrap";

// Component: DashboardOverview - Tổng quan Dashboard
const DashboardOverview = () => {
  // Dữ liệu giả cho thống kê dashboard
  const stats = [
    { label: "Tổng số người dùng", value: "15,450", icon: "👥" },
    { label: "Tổng số bài viết", value: "8,210", icon: "📋" },
    { label: "Tổng số cộng đồng", value: "120", icon: "🏘️" },
    { label: "Báo cáo mới", value: "45", icon: "⚠️" },
  ];

  const activities = [
    {
      title: "Nguyễn Văn A đã đăng ký tài khoản mới",
      time: "10 phút trước",
    },
    {
      title: "Bài viết ID #12345 đã bị báo cáo",
      time: "30 phút trước",
    },
    {
      title: 'Cộng đồng "Yêu Thích ReactJS" được tạo',
      time: "1 giờ trước",
    },
  ];

  return (
    <Container fluid className="p-4 bg-white rounded shadow-sm">
      {" "}
      {/* Thay p-6 bg-white rounded-lg shadow-md */}
      <h2 className="text-3xl fw-bold mb-4 text-dark">
        {" "}
        {/* Thay text-3xl font-bold mb-6 text-gray-800 */}
        Tổng quan Dashboard
      </h2>
      <Row className="g-4 mb-5">
        {" "}
        {/* Thay grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 */}
        {stats.map((stat, index) => (
          <Col xs={12} md={6} lg={3} key={index}>
            {" "}
            {/* Responsive columns */}
            <Card className="h-100 p-4 bg-light border-0 rounded shadow-sm d-flex flex-row align-items-center">
              {" "}
              {/* Thay bg-gray-50 p-6 rounded-lg shadow-sm flex items-center space-x-4 */}
              <div className="fs-1 text-primary me-3">
                {" "}
                {/* Thay text-4xl text-blue-500 mr-2 */}
                {stat.icon}
              </div>
              <div>
                <Card.Text className="text-muted mb-1 fs-6">
                  {stat.label}
                </Card.Text>{" "}
                {/* Thay text-gray-600 text-sm */}
                <Card.Title className="fs-3 fw-bold text-dark">
                  {stat.value}
                </Card.Title>{" "}
                {/* Thay text-2xl font-semibold text-gray-900 */}
              </div>
            </Card>
          </Col>
        ))}
      </Row>
      <div className="mt-5">
        {" "}
        {/* Thay mt-8 */}
        <h3 className="text-2xl fw-bold mb-4 text-dark">
          {" "}
          {/* Thay text-2xl font-bold mb-4 text-gray-800 */}
          Hoạt động gần đây
        </h3>
        <ListGroup className="rounded shadow-sm">
          {" "}
          {/* Thay space-y-3 */}
          {activities.map((activity, index) => (
            <ListGroup.Item
              key={index}
              className="bg-light text-dark py-3 my-2 rounded"
            >
              {" "}
              {/* Thay bg-gray-50 p-4 rounded-lg shadow-sm text-gray-700 */}
              <span className="fw-semibold">{activity.title}</span>
              <span className="text-muted ms-2 fs-6">{activity.time}</span>
            </ListGroup.Item>
          ))}
        </ListGroup>
      </div>
      <div className="mt-5">
        {" "}
        {/* Thay mt-8 */}
        <h3 className="text-2xl fw-bold mb-4 text-dark">
          {" "}
          {/* Thay text-2xl font-bold mb-4 text-gray-800 */}
          Biểu đồ thống kê
        </h3>
        <div
          className="bg-light p-5 rounded shadow-sm d-flex align-items-center justify-content-center text-muted"
          style={{ minHeight: "16rem" }}
        >
          {" "}
          {/* Thay bg-gray-50 p-6 rounded-lg shadow-sm h-64 flex items-center justify-center text-gray-500 */}
          <span className="fs-1 text-secondary me-3">📈</span>{" "}
          {/* Biểu đồ đường */}
          <p className="mb-0">
            Biểu đồ hiển thị lượt đăng ký người dùng hàng tháng (dữ liệu giả)
          </p>
        </div>
      </div>
    </Container>
  );
};

export default DashboardOverview;
