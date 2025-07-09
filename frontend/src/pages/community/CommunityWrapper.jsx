import React, { useState } from "react";
import CommunityLayout from "../../components/layout/Layout/CommunityLayout";
import CommunityPage from "./CommunityPage";

export default function CommunityWrapper() {
    const [selectedView, setSelectedView] = useState("feed");
    const [refreshTrigger, setRefreshTrigger] = useState(Date.now());

    // Callback gọi khi tạo nhóm mới để reload danh sách
    const handleGroupCreated = () => {
        setRefreshTrigger(Date.now()); // trigger CommunityPage useEffect
    };

    // Bạn cũng có thể truyền dark mode toggle từ ThemeContext ở đây nếu cần
    const [isDarkMode, setIsDarkMode] = useState(
        localStorage.getItem("theme") === "dark"
    );

    const toggleDarkMode = () => {
        const newMode = isDarkMode ? "light" : "dark";
        localStorage.setItem("theme", newMode);
        document.documentElement.setAttribute("data-theme", newMode);
        setIsDarkMode(!isDarkMode);
    };

    return (
        <CommunityLayout
            selectedView={selectedView}
            onSelectView={setSelectedView}
            onToggleDarkMode={toggleDarkMode}
            isDarkMode={isDarkMode}
            onGroupCreated={handleGroupCreated}
        >
            <CommunityPage
                selectedView={selectedView}
                onSelectView={setSelectedView}
                onToggleDarkMode={toggleDarkMode}
                isDarkMode={isDarkMode}
                refreshTrigger={refreshTrigger}
            />
        </CommunityLayout>
    );
}
