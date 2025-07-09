import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import CommunityLayout from "../../components/layout/Layout/CommunityLayout";

export default function GroupMembersWrapper({ children, onDataRefresh }) {
    const [viewMode, setViewMode] = useState("feed");
    const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem("theme") === "dark");
    const navigate = useNavigate();

    const handleToggleDarkMode = () => {
        const newTheme = isDarkMode ? "light" : "dark";
        localStorage.setItem("theme", newTheme);
        document.documentElement.setAttribute("data-theme", newTheme);
        setIsDarkMode(!isDarkMode);
    };

    const handleGroupCreated = () => {
        if (onDataRefresh) onDataRefresh();
    };

    const handleSelectView = (view) => {
        setViewMode(view);
        if (view === "feed" || view === "yourGroups") {
            navigate("/communities");
        }
    };

    return (
        <CommunityLayout
            selectedView={viewMode}
            onSelectView={handleSelectView}
            onGroupCreated={handleGroupCreated}
            onToggleDarkMode={handleToggleDarkMode}
            isDarkMode={isDarkMode}
        >
            {children}
        </CommunityLayout>
    );
}
