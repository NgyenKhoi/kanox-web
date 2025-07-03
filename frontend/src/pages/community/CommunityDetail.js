import React, { useState, useEffect, useContext } from "react";
import { Container, Row, Col, Card, Nav, Button, Modal } from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";
// Corrected: Added FaUsers to the import
import { FaArrowLeft, FaSearch, FaUsers } from "react-icons/fa";
import SidebarRight from "../../components/layout/SidebarRight/SidebarRight";
import CommunityRulesModal from "../../components/community/CommunityRulesModal";
import CommunityMembersModal from "../../components/community/CommunityMembersModal";
import { AuthContext } from "../../context/AuthContext";

function CommunityDetail() {
  const { communityId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [community, setCommunity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("top");
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  // Added: State to control members modal visibility
  const [showMembersModal, setShowMembersModal] = useState(false);

  // Dummy data for a specific community (replace with actual API fetch)
  const dummyCommunities = {
    "cookie-run-kingdom": {
      id: "cookie-run-kingdom",
      name: "Cookie Run Kingdom",
      handle: "@cookie-run-kingdom",
      avatar: "https://via.placeholder.com/100/FFC0CB?text=CRK",
      banner: "https://via.placeholder.com/800x200?text=Community+Banner",
      members: "28.500",
      founded: "Tháng 1 năm 2021",
      category: "Cộng đồng game",
      description:
        "Find players and discuss events, updates, characters and strategies of the game.",
      isVerified: true,
      rules: [
        {
          title: "Be kind and respectful",
          description:
            "We all love respect. Doesn't matter what the reason is, offenses directed at any member are not allowed.",
        },
        {
          title: "On-topic tweets only",
          description:
            "It's exciting meeting new people, but please keep the discussions and posts on the community on-topic: Cookie Run Kingdom.",
        },
        {
          title: "Avoid Spam",
          description:
            "Please, avoid posting the same thing several times. Posts recruiting for guilds are...",
        },
      ],
      memberList: [
        {
          id: "u1",
          username: "Bùi Lê Duy",
          handle: "@leduybui.vn",
          avatar: "https://via.placeholder.com/40/FF5733?text=B",
          type: "Thành viên",
        },
        {
          id: "u2",
          username: "Diễm My",
          handle: "@MyDiem2013",
          avatar: "https://via.placeholder.com/40/33FF57?text=D",
          type: "Thành viên",
        },
        {
          id: "u3",
          username: "yapsama",
          handle: "@osadogling",
          avatar: "https://via.placeholder.com/40/3357FF?text=Y",
          type: "Thành viên",
        },
        {
          id: "u4",
          username: "Cerqs",
          handle: "@CerqsThiago",
          avatar: "https://via.placeholder.com/40/F0F0F0?text=C",
          type: "Thành viên",
        },
        {
          id: "u5",
          username: "Nguyễn Văn A",
          handle: "@nguyenvanana",
          avatar: "https://via.placeholder.com/40/FF33CC?text=N",
          type: "Thành viên",
        },
        {
          id: "u6",
          username: "Nosy Neighbor",
          handle: "@StarfireXXXXX",
          avatar: "https://via.placeholder.com/40/CC33FF?text=N",
          type: "QTV",
        },
        {
          id: "u7",
          username: "Demiurge",
          handle: "@Demiurge",
          avatar: "https://via.placeholder.com/40/33CCFF?text=D",
          type: "Thành viên",
        },
      ],
      posts: [
        {
          id: "comm_post1",
          userAvatar: "https://via.placeholder.com/40/007bff?text=G",
          username: "GameMaster",
          userHandle: "@cookiemaster",
          time: "3 giờ",
          content: "New character designs leaked!😱",
          comments: 15,
          retweets: 30,
          likes: 120,
          shares: 5,
        },
      ],
    },
    "web-dev-community": {
      id: "web-dev-community",
      name: "Web Dev Community",
      handle: "@webdevs",
      avatar: "https://via.placeholder.com/100/ADD8E6?text=WD",
      banner: "https://via.placeholder.com/800x200?text=WebDev+Banner",
      members: "50.000",
      founded: "Tháng 5 năm 2019",
      category: "Công nghệ",
      description:
        "Discuss all things web development: React, Node.js, CSS, HTML, and more!",
      isVerified: false,
      rules: [
        {
          title: "Stay professional",
          description: "Maintain a professional tone.",
        },
        {
          title: "Share helpful resources",
          description: "Help others with useful links.",
        },
      ],
      memberList: [
        {
          id: "w1",
          username: "CodeMaster",
          handle: "@code_dev",
          avatar: "https://via.placeholder.com/40/A0A0A0?text=CM",
          type: "Thành viên",
        },
        {
          id: "w2",
          username: "ReactGuru",
          handle: "@react_king",
          avatar: "https://via.placeholder.com/40/B0B0B0?text=RG",
          type: "QTV",
        },
      ],
      posts: [
        {
          id: "comm_post2",
          userAvatar: "https://via.placeholder.com/40/FFA07A?text=C",
          username: "CodeNinja",
          userHandle: "@coding_master",
          time: "1 ngày",
          content:
            "Anyone else struggling with useContext and global state management? Need tips! #ReactJS",
          comments: 25,
          retweets: 10,
          likes: 80,
          shares: 3,
        },
      ],
    },
  };

  useEffect(() => {
    setLoading(true);
    setError(null);
    const fetchCommunity = async () => {
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate API call delay
      try {
        const data = dummyCommunities[communityId];
        if (!data) {
          throw new Error("Không tìm thấy cộng đồng này.");
        }
        setCommunity(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCommunity();
  }, [communityId]);

  const handleShowRulesModal = () => setShowRulesModal(true);
  const handleCloseRulesModal = () => setShowRulesModal(false);

  // Added: Handlers for members modal
  const handleShowMembersModal = () => setShowMembersModal(true);
  const handleCloseMembersModal = () => setShowMembersModal(false);

  const handleAgreeToJoin = async () => {
    // if (!user) {
    //   alert("Bạn cần đăng nhập để tham gia cộng đồng.");
    //   navigate("/login");
    //   return;
    // }

    setIsJoining(true);
    handleCloseRulesModal();

    try {
      // Simulate API call to send join request
      // In a real application, you would make an API call like:
      // const response = await fetch(`/api/communities/${community.id}/join`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${user.token}` // Assuming token for auth
      //   },
      //   body: JSON.stringify({ userId: user.id })
      // });

      // if (!response.ok) {
      //   throw new Error('Failed to send join request.');
      // }

      await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate API delay

      alert(
        `Yêu cầu tham gia cộng đồng "${community.name}" đã được gửi thành công! Vui lòng chờ quản trị viên xét duyệt.`
      );
      // You might want to update the UI to show "Pending request" or "Joined"
    } catch (err) {
      alert(`Có lỗi xảy ra khi gửi yêu cầu: ${err.message}`);
      console.error("Error joining community:", err);
    } finally {
      setIsJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center p-5">Đang tải thông tin cộng đồng...</div>
    );
  }

  if (error) {
    return <div className="text-center p-5 text-danger">Lỗi: {error}</div>;
  }

  if (!community) {
    return (
      <div className="text-center p-5 text-muted">
        Không tìm thấy cộng đồng.
      </div>
    );
  }

  return (
    <div>
      <Container
        fluid
        className="community-detail-page-container d-flex flex-grow-1 bg-[var(--background-color)]"
      >
        <Row className="w-100 justify-content-center">
          <Col
            xs={12}
            lg={8}
            className="community-detail-main-content border-start border-end py-3"
          >
            {/* Header */}
            <div className="d-flex align-items-center mb-3 px-3">
              <Button
                variant="link"
                onClick={() => navigate("/communities")}
                className="bg-[var(--background-color)] text-[var(--text-color)] p-0 me-3"
              >
                <FaArrowLeft size={20} />
              </Button>
              <h2 className="mb-0 me-auto">{community.name}</h2>
              <div className="search-icon me-3">
                <FaSearch size={20} />
              </div>
              <div className="settings-icon">
                <i className="bi bi-gear"></i>
              </div>
            </div>

            {/* Community Banner */}
            <div className="community-banner mb-3">
              <img
                src={community.banner}
                alt="Community Banner"
                className="img-fluid w-100"
              />
              <img
                src={community.avatar}
                alt="Community Avatar"
                className="community-avatar rounded-circle border border-3 border-white"
              />
            </div>

            {/* Community Info */}
            <div className="px-3 pb-3 ">
              <h3 className="mb-0">
                {community.name}{" "}
                {community.isVerified && (
                  <i className="bi bi-patch-check-fill text-primary ms-1"></i>
                )}
              </h3>
              <p className="text-muted">{community.handle}</p>
              <Button
                variant="primary"
                className="rounded-pill px-4 mb-3"
                onClick={handleShowRulesModal}
                disabled={isJoining}
              >
                {isJoining ? "Đang gửi yêu cầu..." : "Tham gia"}
              </Button>
              <p>{community.description}</p>
              <div className="d-flex small text-muted mb-3">
                <span className="me-3 d-flex align-items-center">
                  {/* Added FaUsers icon */}
                  <FaUsers className="me-1" />
                  {/* Updated onClick to open members modal */}
                  <span
                    onClick={handleShowMembersModal}
                    style={{ cursor: "pointer", textDecoration: "underline" }}
                  >
                    {community.members} thành viên
                  </span>
                </span>
                <span>Tạo {community.founded}</span>
                <span className="ms-auto">Cộng đồng {community.category}</span>
              </div>
            </div>

            {/* Navigation Tabs (Hàng đầu, Mới nhất, Media, Giới thiệu) */}
            <Nav variant="underline" className="community-detail-nav mb-4">
              <Nav.Item>
                <Nav.Link
                  eventKey="top"
                  active={activeTab === "top"}
                  onClick={() => setActiveTab("top")}
                >
                  Hàng đầu
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link
                  eventKey="latest"
                  active={activeTab === "latest"}
                  onClick={() => setActiveTab("latest")}
                >
                  Mới nhất
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link
                  eventKey="media"
                  active={activeTab === "media"}
                  onClick={() => setActiveTab("media")}
                >
                  Media
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link
                  eventKey="about"
                  active={activeTab === "about"}
                  onClick={() => setActiveTab("about")}
                >
                  Giới thiệu
                </Nav.Link>
              </Nav.Item>
            </Nav>

            {/* Content based on active tab */}
            <div className="tab-content px-3">
              {activeTab === "top" && (
                <div>
                  {/* Render top posts for this community */}
                  {community.posts.map((post) => (
                    <Card
                      key={post.id}
                      className="mb-3 post-card bg-[var(--background-color)] text-[var(--text-color)]"
                    >
                      <Card.Body>
                        <div className="d-flex align-items-start mb-2">
                          <img
                            src={post.userAvatar}
                            alt="User Avatar"
                            className="rounded-circle me-2"
                            style={{ width: "40px", height: "40px" }}
                          />
                          <div className="flex-grow-1">
                            <div className="d-flex align-items-center">
                              <span className="fw-bold me-1">
                                {post.username}
                              </span>
                            </div>
                            <div className="d-flex align-items-center text-muted small">
                              <span className="me-1">{post.userHandle}</span>
                              <span>· {post.time}</span>
                            </div>
                          </div>
                        </div>
                        <Card.Text>{post.content}</Card.Text>
                      </Card.Body>
                    </Card>
                  ))}
                  {community.posts.length === 0 && (
                    <p className="text-muted text-center">
                      Không có bài đăng nào.
                    </p>
                  )}
                </div>
              )}
              {activeTab === "latest" && (
                <div>
                  <p>Nội dung các bài đăng mới nhất...</p>
                </div>
              )}
              {activeTab === "media" && (
                <div>
                  <p>Nội dung media của cộng đồng...</p>
                </div>
              )}
              {activeTab === "about" && (
                <div>
                  <p>Thông tin giới thiệu chi tiết về cộng đồng này.</p>
                </div>
              )}
            </div>
          </Col>

          {/* Right Sidebar */}
          <Col lg={4} className="d-none d-lg-block community-sidebar-right">
            <SidebarRight />
          </Col>
        </Row>

        {/* Community Rules Modal */}
        {community && (
          <CommunityRulesModal
            show={showRulesModal}
            handleClose={handleCloseRulesModal}
            communityName={community.name}
            rules={community.rules || []} // Pass rules from community data
            onAgreeToJoin={handleAgreeToJoin}
          />
        )}

        {/* Added: Community Members Modal */}
        {community && (
          <CommunityMembersModal
            show={showMembersModal}
            handleClose={handleCloseMembersModal}
            communityName={community.name}
            members={community.memberList || []} // Pass the member list
          />
        )}
      </Container>
    </div>
  );
}

export default CommunityDetail;
