import React, { useEffect, useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  ListGroup,
  Button,
  Table,
} from "react-bootstrap";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Đăng ký các thành phần cần thiết cho Chart.js
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const DashboardOverview = () => {
  const [stats, setStats] = useState([
    { label: "Tổng số người dùng", value: "Đang tải...", icon: "👥" },
    { label: "Tổng số bài viết", value: "Đang tải...", icon: "📋" },
    { label: "Tổng số cộng đồng", value: "Đang tải...", icon: "🏘️" },
    { label: "Báo cáo mới", value: "45", icon: "⚠️" },
  ]);

  const [registrationData, setRegistrationData] = useState({
    labels: [],
    datasets: [],
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
            `${process.env.REACT_APP_API_URL}/admin/dashboard/stats`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
        );

        if (!response.ok) throw new Error("Lỗi khi lấy dữ liệu thống kê");

        const data = await response.json();

        setStats([
          { label: "Tổng số người dùng", value: data.totalUsers, icon: "👥" },
          { label: "Tổng số bài viết", value: data.totalPosts, icon: "📋" },
          { label: "Tổng số cộng đồng", value: data.totalGroups, icon: "🏘️" },
          { label: "Báo cáo mới", value: data.totalReports, icon: "⚠️" },
        ]);
      } catch (error) {
        console.error("Lỗi khi load thống kê dashboard:", error);
      }
    };

    const fetchRegistrationData = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
            `${process.env.REACT_APP_API_URL}/admin/dashboard/registrations-by-week?startYear=2025&endYear=2025`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
        );

        if (!response.ok) throw new Error("Lỗi khi lấy dữ liệu đăng ký");

        const data = await response.json();

        setRegistrationData({
          labels: data.map((item) => item.yearWeek),
          datasets: [
            {
              label: "Số lượng người dùng đăng ký",
              data: data.map((item) => item.userCount),
              backgroundColor: "rgba(54, 162, 235, 0.6)",
              borderColor: "rgba(54, 162, 235, 1)",
              borderWidth: 1,
            },
          ],
        });
      } catch (error) {
        console.error("Lỗi khi load dữ liệu đăng ký:", error);
      }
    };

    fetchStats();
    fetchRegistrationData();
  }, []);

  const monthlyStats = [
    { id: 1, month: "Tháng 1", users: 44, posts: 23, communities: 15 },
    { id: 2, month: "Tháng 2", users: 55, posts: 25, communities: 18 },
    { id: 3, month: "Tháng 3", users: 57, posts: 30, communities: 20 },
    { id: 4, month: "Tháng 4", users: 56, posts: 35, communities: 25 },
    { id: 5, month: "Tháng 5", users: 61, posts: 40, communities: 28 },
    { id: 6, month: "Tháng 6", users: 58, posts: 42, communities: 30 },
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

  const chartOptions = {
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Số lượng người dùng",
        },
      },
      x: {
        title: {
          display: true,
          text: "Tuần",
        },
      },
    },
    plugins: {
      legend: {
        display: true,
        position: "top",
      },
      title: {
        display: true,
        text: "Số lượng người dùng đăng ký theo tuần",
      },
    },
    maintainAspectRatio: false,
  };

  return (
      <Container fluid className="p-4 bg-white rounded shadow-sm">
        <h2 className="text-3xl fw-bold mb-4 text-dark">Tổng quan Dashboard</h2>
        <Row className="g-4 mb-5">
          {stats.map((stat, index) => (
              <Col xs={12} md={6} lg={3} key={index}>
                <Card className="h-100 p-4 bg-light border-0 rounded shadow-sm d-flex flex-row align-items-center">
                  <div className="fs-1 text-primary me-3">{stat.icon}</div>
                  <div>
                    <Card.Text className="text-muted mb-1 fs-6">
                      {stat.label}
                    </Card.Text>
                    <Card.Title className="fs-3 fw-bold text-dark">
                      {stat.value}
                    </Card.Title>
                  </div>
                </Card>
              </Col>
          ))}
        </Row>

        <Row className="mb-5">
          <Col xs={12}>
            <Card className="shadow-sm">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h3 className="mb-0 fs-4 fw-bold text-dark">
                  Thống kê hoạt động hàng tháng
                </h3>
                <Button variant="outline-primary" size="sm">
                  <span className="me-1">⬇️</span> Xuất báo cáo
                </Button>
              </Card.Header>
              <Card.Body>
                <div
                    className="table-responsive"
                    style={{ height: 400, overflowY: "auto" }}
                >
                  <Table striped bordered hover className="mb-0">
                    <thead>
                    <tr>
                      <th>Tháng</th>
                      <th>Người dùng mới</th>
                      <th>Bài viết mới</th>
                      <th>Cộng đồng mới</th>
                    </tr>
                    </thead>
                    <tbody>
                    {monthlyStats.map((row) => (
                        <tr key={row.id}>
                          <td>{row.month}</td>
                          <td>{row.users} người</td>
                          <td>{row.posts} bài</td>
                          <td>{row.communities} cộng đồng</td>
                        </tr>
                    ))}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row className="mb-5">
          <Col xs={12}>
            <Card className="shadow-sm">
              <Card.Header>
                <h3 className="mb-0 fs-4 fw-bold text-dark">Hoạt động gần đây</h3>
              </Card.Header>
              <Card.Body>
                <ListGroup className="rounded shadow-sm">
                  {activities.map((activity, index) => (
                      <ListGroup.Item
                          key={index}
                          className="bg-light text-dark py-3 my-2 rounded d-flex justify-content-between align-items-center"
                      >
                        <div>
                          <span className="fw-semibold">{activity.title}</span>
                          <small className="text-muted d-block">
                            {activity.time}
                          </small>
                        </div>
                      </ListGroup.Item>
                  ))}
                </ListGroup>
                <Button variant="outline-primary" className="w-100 mt-3">
                  Xem thêm
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row>
          <Col xs={12}>
            <Card className="shadow-sm">
              <Card.Header>
                <h3 className="mb-0 fs-4 fw-bold text-dark">Biểu đồ thống kê</h3>
              </Card.Header>
              <Card.Body>
                {registrationData.labels.length > 0 ? (
                    <div style={{ height: "400px" }}>
                      <Bar data={registrationData} options={chartOptions} />
                    </div>
                ) : (
                    <div
                        className="bg-light p-5 rounded shadow-sm d-flex align-items-center justify-content-center text-muted"
                        style={{ minHeight: "16rem" }}
                    >
                      <span className="fs-1 text-secondary me-3">📈</span>
                      <p className="mb-0">Đang tải dữ liệu biểu đồ...</p>
                    </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
  );
};

export default DashboardOverview;