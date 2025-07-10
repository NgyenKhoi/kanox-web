const API_BASE = process.env.REACT_APP_API_URL;

const getTokenHeader = () => {
    const token = localStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
    };
};

export const fetchAllGroups = async () => {
    const res = await fetch(`${API_BASE}/groups`, {
        headers: getTokenHeader(),
    });
    if (!res.ok) throw new Error("Không thể tải danh sách nhóm");
    return res.json();
};

export const deleteGroupAsAdmin = async (groupId) => {
    const res = await fetch(`${API_BASE}/admin/groups/${groupId}`, {
        method: "DELETE",
        headers: getTokenHeader(),
    });
    if (!res.ok) throw new Error("Không thể xoá nhóm (admin)");
};


export const fetchGroupDetail = async (groupId) => {
    const res = await fetch(`${API_BASE}/groups/detail/${groupId}`, {
        headers: getTokenHeader(),
    });
    if (!res.ok) throw new Error("Không thể xem chi tiết nhóm");
    return res.json();
};


