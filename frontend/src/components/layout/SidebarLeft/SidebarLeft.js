import React, { useState, useEffect, useContext } from "react";
import { WebSocketContext } from "../../../context/WebSocketContext";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  FaHome,
  FaSearch,
  FaBell,
  FaEnvelope,
  FaUserAlt,
  FaEllipsisH,
  FaSignOutAlt,
  FaLock,
  FaTrash,
  FaRegPlusSquare,
  FaBars,
  FaPlusCircle,
  FaMoon,
  FaSun,
  FaUserFriends,
  FaUserSlash,
} from "react-icons/fa";
import { BsStars } from "react-icons/bs";
import KLogoSvg from "../../svgs/KSvg";
import { AuthContext } from "../../../context/AuthContext";
import useSingleMedia from "../../../hooks/useSingleMedia";

function SidebarLeft({ onToggleDarkMode, isDarkMode, onShowCreatePost }) {
  const { user, logout } = useContext(AuthContext);
  const { subscribe, unsubscribe } = useContext(WebSocketContext) || {};
  const navigate = useNavigate();
  const location = useLocation();
  const [showMenu, setShowMenu] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

  const { mediaUrl: avatarUrl } = useSingleMedia(user?.id, "PROFILE", "image");

  const mainTabs = [
    { icon: <FaHome />, label: "Trang chủ", path: "/home" },
    { icon: <FaSearch />, label: "Khám phá", path: "/explore" },
    {
      icon: <FaBell />,
      label: "Thông báo",
      path: "/notifications",
      badge: unreadNotificationCount,
    },
    {
      icon: <FaEnvelope />,
      label: "Tin nhắn",
      path: "/messages",
      badge: unreadMessageCount,
    },
    { icon: <FaUserAlt />, label: "Cộng đồng", path: "/communities" },
    { icon: <BsStars />, label: "Premium", path: "/premium" },
    { icon: <FaUserAlt />, label: "Hồ sơ", path: `/profile/${user?.username}` },
  ];

  const additionalTabs = [
    { icon: <FaUserFriends />, label: "Bạn bè", path: "/friends" },
    { icon: <FaUserSlash />, label: "Người bị chặn", path: "/blocks" },
    { icon: <FaRegPlusSquare />, label: "Tạo Story", path: "/create-story" },
    { icon: <FaLock />, label: "Cài đặt Bảo mật", path: "/settings" },
    { icon: <FaTrash />, label: "Xóa Tài khoản", path: "/delete-account" },
  ];

  const isLinkActive = (path) => {
    if (path.startsWith("/profile") && location.pathname.startsWith("/profile"))
      return true;
    if (path === "/home" && ["/", "/home"].includes(location.pathname))
      return true;
    return location.pathname === path;
  };

  const handleNavClick = (tab) => {
    setShowMenu(false);
    if (tab.action === "logout") {
      logout();
      navigate("/");
    } else {
      navigate(tab.path);
    }
  };
  useEffect(() => {
    console.log("User data:", user);
    if (!user?.id || !subscribe || !unsubscribe) {
      console.warn("Skipping WebSocket subscription: user.id=", user?.id, "subscribe=", !!subscribe, "unsubscribe=", !!unsubscribe);
      return;
    }

    const subId = `unread-count-${user.id}`;
    const subscription = subscribe(`/topic/unread-count/${user.id}`, (data) => {
      const count = data.unreadCount ?? 0;
      console.log(`Received unread chat count for user ${user.id}:`, count);
      setUnreadMessageCount(count);
      window.dispatchEvent(
          new CustomEvent("updateUnreadCount", {
            detail: { unreadCount: count },
          })
      );
    }, subId);

    // Lắng nghe sự kiện updateUnreadCount từ MessengerPage
    const handleUpdateUnreadCount = (event) => {
      const count = event.detail.unreadCount ?? 0;
      console.log(`Received updateUnreadCount event for user ${user.id}:`, count);
      setUnreadMessageCount(count);
    };
    window.addEventListener("updateUnreadCount", handleUpdateUnreadCount);

    return () => {
      if (subscription) {
        unsubscribe(subId);
        console.log(`Unsubscribed from /topic/unread-count/${user.id}`);
      }
      window.removeEventListener("updateUnreadCount", handleUpdateUnreadCount);
    };
  }, [user, subscribe, unsubscribe]);

  useEffect(() => {
    const fetchUnreadMessageCount = async () => {
      try {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        if (!token) {
          console.warn("No token found, skipping unread count fetch");
          return;
        }
        const res = await fetch(`${process.env.REACT_APP_API_URL}/chat/messages/unread-count`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          throw new Error(`Lỗi khi lấy số chat chưa đọc: ${res.status}`);
        }
        const data = await res.json();
        const count = data.unreadCount ?? 0;
        setUnreadMessageCount(count);
        window.dispatchEvent(
            new CustomEvent("updateUnreadCount", {
              detail: { unreadCount: count },
            })
        );
      } catch (err) {
        console.error("Không thể tải số chat chưa đọc:", err.message);
      }
    };

    if (user) {
      fetchUnreadMessageCount();
    }
  }, [user]);

  useEffect(() => {
    if (!user?.id || !subscribe || !unsubscribe) return;

    const subId = `notif-badge-${user.id}`;
    const subscription = subscribe(`/topic/notifications/${user.id}`, (notification) => {
      setUnreadNotificationCount(prev => prev + 1); // Tăng badge khi có noti mới
    }, subId);

    return () => {
      if (subscription) unsubscribe(subId);
    };
  }, [user, subscribe, unsubscribe]);

  useEffect(() => {
    const handle = (e) => {
      const count = e.detail.unreadCount ?? 0;
      setUnreadNotificationCount(count); // Nhận event từ NotificationPage
    };
    window.addEventListener("updateUnreadNotificationCount", handle);
    return () => window.removeEventListener("updateUnreadNotificationCount", handle);
  }, []);


  return (
    <aside className="hidden md:flex flex-col h-screen sticky top-0 bg-[var(--background-color)] text-[var(--text-color)] p-3 border-r border-[var(--border-color)] transition-colors">
      <div className="flex items-center justify-between mb-4">
        <Link to="/home">
          <KLogoSvg width="50px" height="50px" />
        </Link>
        <button onClick={onToggleDarkMode} className="text-xl">
          {isDarkMode ? <FaSun /> : <FaMoon />}
        </button>
      </div>

      <nav className="flex flex-col space-y-2">
        {mainTabs.map((tab) => (
          <button
            key={tab.label}
            onClick={() => handleNavClick(tab)}
            className={`flex items-center px-4 py-2 rounded-full hover:bg-[var(--hover-bg-color)] transition-colors ${
              isLinkActive(tab.path)
                ? "bg-[var(--hover-bg-color)] font-bold text-[var(--primary-color)]"
                : ""
            }`}
          >
            <span className="mr-3 text-xl relative">
              {tab.icon}
              {tab.badge > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {tab.badge}
                </span>
              )}
            </span>
            <span className="text-base hidden lg:inline">{tab.label}</span>
          </button>
        ))}

        {/* Additional dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center px-4 py-2 rounded-full hover:bg-[var(--hover-bg-color)] w-full"
          >
            <FaEllipsisH className="mr-3 text-xl" />
            <span className="hidden lg:inline">Thêm</span>
          </button>
          {showMenu && (
            <div className="absolute z-10 mt-1 w-full bg-[var(--background-color)] shadow-md rounded-lg border border-[var(--border-color)]">
              {additionalTabs.map((tab) => (
                <button
                  key={tab.label}
                  onClick={() => handleNavClick(tab)}
                  className="flex items-center px-4 py-2 hover:bg-[var(--hover-bg-color)] w-full text-left"
                >
                  <span className="mr-3 text-xl">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* User info bottom */}
      <div className="mt-auto pt-4">
        <div className="flex items-center cursor-pointer hover:bg-[var(--hover-bg-color)] p-2 rounded-full">
          <img
            src={avatarUrl || "https://placehold.co/40x40"}
            alt="Avatar"
            className="w-10 h-10 rounded-full object-cover mr-3"
          />
          <div className="hidden lg:block">
            <div className="font-bold">{user?.displayName || "Người dùng"}</div>
            <div className="text-sm text-[var(--text-color-muted)]">
              @{user?.username}
            </div>
          </div>
          <button
            onClick={() => handleNavClick({ action: "logout" })}
            className="ml-auto text-xl"
          >
            <FaSignOutAlt />
          </button>
        </div>
      </div>
    </aside>
  );
}

export default SidebarLeft;
