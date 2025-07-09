import React, { useState } from "react";
import CommunityLayout from "../../components/layout/Layout/CommunityLayout";
import GroupCommunityPage from "./GroupCommunityPage";
import { useNavigate } from "react-router-dom";

export default function GroupCommunityWrapper() {
    const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem("theme") === "dark");
    const navigate = useNavigate();
    const handleToggleDarkMode = () => {
        const newTheme = isDarkMode ? "light" : "dark";
        localStorage.setItem("theme", newTheme);
        document.documentElement.setAttribute("data-theme", newTheme);
        setIsDarkMode(!isDarkMode);
    };

    const handleGroupCreated = () => {
        // Có thể để trống hoặc truyền prop này vào `GroupCommunityPage` nếu cần
    };

    const handleSelectView = (view) => {
        navigate("/communities");
    };

    return (
        <CommunityLayout
            selectedView="feed"
            onSelectView={handleSelectView}
            onToggleDarkMode={handleToggleDarkMode}
            isDarkMode={isDarkMode}
            onGroupCreated={handleGroupCreated}
        >
            <GroupCommunityPage
                onToggleDarkMode={handleToggleDarkMode}
                isDarkMode={isDarkMode}
            />
        </CommunityLayout>
    );
}
