import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    FaThLarge,
    FaUsers,
    FaPlusCircle,
    FaSearch,
    FaHome,
    FaMoon,
    FaSun,
} from "react-icons/fa";
import CreateGroupModal from "./CreateGroupModal";

function CommunitySidebarLeft({ selectedView, onSelectView, joinedGroups = [], onGroupCreated, onToggleDarkMode, isDarkMode }) {
    const navigate = useNavigate();
    const shortList = joinedGroups.slice(0, 5);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Xử lý click vào nhóm
    const handleGroupClick = (groupId) => {
        navigate(`/community/${groupId}`);
    };

    // Xử lý click nút trang chủ
    const handleHomeClick = () => {
        navigate("/home");
    };

    return (
        <>
            <aside className="hidden md:flex flex-col h-screen sticky top-0 bg-[var(--background-color)] text-[var(--text-color)] p-3 border-r border-[var(--border-color)] transition-colors">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold">Nhóm</h2>
                    <button onClick={onToggleDarkMode} className="text-xl">
                        {isDarkMode ? <FaSun /> : <FaMoon />}
                    </button>
                </div>

                {/* Home Button */}
                <button
                    onClick={handleHomeClick}
                    className="flex items-center px-4 py-2 rounded-full hover:bg-[var(--hover-bg-color)] transition-colors mb-4"
                >
                    <FaHome className="mr-3 text-lg" />
                    <span className="text-base hidden lg:inline">Trang chủ</span>
                </button>

                {/* Search Bar */}
                <div className="mb-4">
                    <div className="relative">
                        <FaSearch className="absolute top-2.5 left-3 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm nhóm"
                            className="w-full pl-10 pr-3 py-2 rounded-full bg-[var(--input-bg)] text-[var(--text-color)] placeholder-gray-500 border border-[var(--border-color)] focus:outline-none"
                        />
                    </div>
                </div>

                {/* Menu */}
                <nav className="flex flex-col space-y-2 mb-4">
                    <button
                        onClick={() => onSelectView("feed")}
                        className={`flex items-center px-4 py-2 rounded-full hover:bg-[var(--hover-bg-color)] transition-colors ${
                            selectedView === "feed"
                                ? "bg-[var(--hover-bg-color)] font-bold text-[var(--primary-color)]"
                                : ""
                        }`}
                    >
                        <FaThLarge className="mr-3 text-lg" />
                        <span className="text-base hidden lg:inline">Bảng feed của bạn</span>
                    </button>

                    <button
                        onClick={() => onSelectView("yourGroups")}
                        className={`flex items-center px-4 py-2 rounded-full hover:bg-[var(--hover-bg-color)] transition-colors ${
                            selectedView === "yourGroups"
                                ? "bg-[var(--hover-bg-color)] font-bold text-[var(--primary-color)]"
                                : ""
                        }`}
                    >
                        <FaUsers className="mr-3 text-lg" />
                        <span className="text-base hidden lg:inline">Nhóm của bạn</span>
                    </button>
                </nav>

                {/* Create Group Button */}
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition mb-4"
                >
                    <FaPlusCircle />
                    <span className="hidden lg:inline">Tạo nhóm mới</span>
                </button>

                {/* Joined Groups */}
                <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400 mb-2">
                        <span>Nhóm bạn đã tham gia</span>
                        <span
                            role="button"
                            onClick={() => onSelectView("yourGroups")}
                            className="text-blue-500 hover:underline cursor-pointer"
                        >
              Xem tất cả
            </span>
                    </div>

                    {shortList.length > 0 ? (
                        shortList.map((group) => (
                            <div
                                key={group.id}
                                className="flex items-center gap-3 cursor-pointer hover:bg-[var(--hover-bg-color)] p-2 rounded-lg transition"
                                onClick={() => handleGroupClick(group.id)}
                            >
                                <img
                                    src={group.avatar || "https://via.placeholder.com/40"}
                                    alt={group.name}
                                    className="w-10 h-10 rounded-full object-cover"
                                />
                                <span className="font-semibold truncate text-sm">{group.name}</span>
                            </div>
                        ))
                    ) : (
                        <p className="text-muted small text-gray-500 dark:text-gray-400">
                            Chưa tham gia nhóm nào.
                        </p>
                    )}
                </div>
            </aside>

            {/* Modal Tạo Nhóm */}
            <CreateGroupModal
                show={showCreateModal}
                onHide={() => setShowCreateModal(false)}
                onGroupCreated={onGroupCreated}
            />
        </>
    );
}

export default CommunitySidebarLeft;