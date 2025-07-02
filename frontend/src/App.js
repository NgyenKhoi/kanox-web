import React, { useState, useEffect, useContext } from "react";
import { Container, Row, Col, Spinner, Modal, Button } from "react-bootstrap";
import "./App.css";
import PrivateRoute from "./components/common/PrivateRoute/PrivateRoute";

import SidebarLeft from "./components/layout/SidebarLeft/SidebarLeft";
import { ThemeContext, ThemeProvider } from "./context/ThemeContext";
import { AuthContext, AuthProvider } from "./context/AuthContext";
import { WebSocketContext, WebSocketProvider } from "./context/WebSocketContext";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";

// Import các page
import SignupPage from "./pages/auth/signup/signupPage";
import HomePage from "./pages/home/HomePage";
import ProfilePage from "./pages/profile/ProfilePage";
import ResetPasswordPage from "./pages/auth/login/ResetPasswordPage";
import ExplorePage from "./pages/search/ExplorePage";
import NotificationPage from "./pages/Notifications/NotificationPage";
import MessengerPage from "./pages/Messenger/MessengerPage";
import LoadingPage from "./components/common/Loading/LoadingPage";
import VerifyEmailPage from "./pages/auth/login/VerifyEmailPage";
import CommunityPage from "./pages/community/CommunityPage";
import CommunityDetail from "./pages/community/CommunityDetail";
import CustomPrivacyListPage from "./pages/privacy/CustomPrivacyListPage";
import BlockedUsersPage from "./pages/block/BlockedUsersPage";
import SettingsPage from "./pages/settings/SettingsPage";
import FriendsPage from "./pages/friends/FriendsPage";
import AdminPage from "./pages/admin/adminpage";
import Call from "./components/messages/Call";

function AppContent() {
  const [isLoading, setIsLoading] = useState(true);
  const [showCallModal, setShowCallModal] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [chatIds, setChatIds] = useState([]);
  const { user, token } = useContext(AuthContext);
  const { subscribe, unsubscribe, publish } = useContext(WebSocketContext) || {};
  const { isDarkMode, toggleDarkMode } = useContext(ThemeContext);
  const navigate = useNavigate();
  const [showCreatePost, setShowCreatePost] = useState(false);

  useEffect(() => {
    if (!user || !token) {
      setIsLoading(false);
      return;
    }
    const fetchChatIds = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/chat/user/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const chats = await response.json();
          setChatIds(chats.map((chat) => chat.id));
        } else {
          console.error("Error fetching chat IDs");
        }
      } catch (error) {
        console.error("Error fetching chat IDs:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchChatIds();
  }, [user, token]);

  useEffect(() => {
    if (!subscribe || !unsubscribe || !publish || !chatIds.length) {
      console.log("Skipping subscriptions: Missing WebSocket context or chatIds");
      return;
    }

    const subscriptions = [];
    chatIds.forEach((chatId) => {
      subscriptions.push(
          subscribe(`/topic/call/${chatId}`, (message) => {
            console.log("Received call signal:", message);
            if (message.type === "start" && message.userId !== user.id) {
              setIncomingCall({
                chatId: message.chatId,
                sessionId: message.sessionId,
                from: message.userId
              });
              setShowCallModal(true);
            }
          }, `call-${chatId}`)
      );
    });

    const handleIncomingCall = (event) => {
      const { chatId, sessionId, from, to } = event.detail;
      if (to !== user.username) {
        console.log("⛔ Mình là người gọi, không hiển thị modal.");
        return;
      }
      setIncomingCall({ chatId, sessionId });
      setShowCallModal(true);
    };
    window.addEventListener("incomingCall", handleIncomingCall);

    return () => {
      subscriptions.forEach((_, index) => unsubscribe(`call-${chatIds[index]}`));
      window.removeEventListener("incomingCall", handleIncomingCall);
    };
  }, [chatIds, subscribe, unsubscribe, user, navigate]);

  const acceptCall = () => {
    setShowCallModal(false);
    navigate(`/call/${incomingCall.chatId}`);
  };

  const rejectCall = () => {
    setShowCallModal(false);
    if (publish && incomingCall) {
      publish("/app/call/end", {
        chatId: incomingCall.chatId,
        callSessionId: incomingCall.sessionId,
        userId: user?.id,
      });
    }
    setIncomingCall(null);
  };

  return (
      <>
        {isLoading ? (
            <LoadingPage />
        ) : (
            <Container fluid className="min-vh-100 p-0">
              <Row className="m-0">
                {/* SidebarLeft */}
                {user && (
                    <Col xs={0} lg={3} className="p-0 d-none d-lg-block">
                      <SidebarLeft
                          onToggleDarkMode={toggleDarkMode}
                          isDarkMode={isDarkMode}
                          onShowCreatePost={() => setShowCreatePost(true)}
                      />
                    </Col>
                )}
                {/* Routes */}
                <Col xs={12} lg={user ? 9 : 12} className="p-0">
                  <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<SignupPage />} />
                    <Route path="/reset-password" element={<ResetPasswordPage />} />
                    <Route path="/verify-email" element={<VerifyEmailPage />} />

                    {/* Private Routes */}
                    <Route
                        path="/home"
                        element={
                          <PrivateRoute>
                            <HomePage
                                onShowCreatePost={() => setShowCreatePost(true)}
                                onToggleDarkMode={toggleDarkMode}
                                isDarkMode={isDarkMode}
                            />
                          </PrivateRoute>
                        }
                    />
                    <Route path="/profile/:username" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
                    <Route path="/profile/me" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
                    <Route path="/explore" element={<PrivateRoute><ExplorePage /></PrivateRoute>} />
                    <Route path="/notifications" element={<PrivateRoute><NotificationPage /></PrivateRoute>} />
                    <Route path="/messages" element={<PrivateRoute><MessengerPage /></PrivateRoute>} />
                    <Route path="/communities" element={<PrivateRoute><CommunityPage /></PrivateRoute>} />
                    <Route path="/community/:communityId" element={<PrivateRoute><CommunityDetail /></PrivateRoute>} />
                    <Route path="/privacy/lists" element={<PrivateRoute><CustomPrivacyListPage /></PrivateRoute>} />
                    <Route path="/blocks" element={<PrivateRoute><BlockedUsersPage /></PrivateRoute>} />
                    <Route path="/settings" element={<PrivateRoute><SettingsPage /></PrivateRoute>} />
                    <Route path="/friends" element={<PrivateRoute><FriendsPage /></PrivateRoute>} />
                    <Route path="/admin" element={<PrivateRoute><AdminPage /></PrivateRoute>} />
                    <Route path="/call/:chatId" element={<PrivateRoute><Call /></PrivateRoute>} />
                  </Routes>

                  <Modal
                      show={showCallModal}
                      centered
                      onHide={rejectCall}
                      className="bg-[var(--background-color)] text-[var(--text-color)]"
                  >
                    <Modal.Header closeButton>
                      <Modal.Title>Cuộc gọi đến</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>Bạn có muốn nhận cuộc gọi video?</Modal.Body>
                    <Modal.Footer>
                      <Button variant="secondary" onClick={rejectCall}>
                        Từ chối
                      </Button>
                      <Button variant="primary" onClick={acceptCall}>
                        Chấp nhận
                      </Button>
                    </Modal.Footer>
                  </Modal>
                </Col>
              </Row>
            </Container>
        )}
      </>
  );
}

function App() {
  return (
      <Router>
        <AuthProvider>
          <WebSocketProvider>
            <ThemeProvider>
              <AppContent />
            </ThemeProvider>
          </WebSocketProvider>
        </AuthProvider>
      </Router>
  );
}

export default App;
