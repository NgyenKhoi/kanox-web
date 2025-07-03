    import React, {useContext, useMemo} from "react";
    import {
        Modal,
        Form,
        ListGroup,
        Spinner,
        InputGroup,
        Image,
        Button,
    } from "react-bootstrap";
    import {FaSearch} from "react-icons/fa";
    import {useNavigate} from "react-router-dom";
    import {AuthContext} from "../../context/AuthContext";
    import {toast} from "react-toastify";
    import useMedia from "../../hooks/useMedia";

    function UserSelectionModal({
                                    show,
                                    handleClose,
                                    searchKeyword,
                                    setSearchKeyword,
                                    searchResults,
                                    isSearching,
                                    handleSelectUser,
                                }) {
        const navigate = useNavigate();
        const {token} = useContext(AuthContext);

        // 📦 Lấy danh sách userId từ searchResults
        const userIds = useMemo(() => searchResults.map((user) => user.id), [searchResults]);
        const {mediaData, loading: mediaLoading} = useMedia(userIds, "PROFILE", "image");

        const handleSelectUserWithAuth = async (userId) => {
            try {
                await handleSelectUser(userId);
                handleClose();
            } catch (err) {
                toast.error("Lỗi khi chọn người dùng: " + err.message);
            }
        };

        return (
            <Modal show={show} onHide={handleClose} centered size="md">
                <Modal.Header closeButton className="bg-[var(--background-color)] border-b border-[var(--border-color)] text-[var(--text-color)]">
                    <Modal.Title className="font-bold text-[var(--text-color)]">
                        Tin nhắn mới
                    </Modal.Title>
                </Modal.Header>
                <>
                    <Modal.Body className="bg-[var(--background-color)] text-[var(--text-color)]">
                        <div
                            className="flex items-center mb-3 px-3 py-2 bg-[var(--background-color)] border border-[var(--border-color)] rounded-full shadow-sm">
                            <FaSearch className="text-[var(--text-color-muted)] mr-2"/>
                            <input
                                type="text"
                                placeholder="Tìm kiếm theo tên hoặc email"
                                value={searchKeyword}
                                onChange={(e) => setSearchKeyword(e.target.value)}
                                className="bg-transparent flex-grow border-0 outline-none text-sm text-[var(--text-color)] placeholder:text-[var(--text-color-muted)]"
                                autoFocus
                            />
                        </div>

                        {isSearching || mediaLoading ? (
                            <div className="flex justify-center my-3">
                                <div
                                    className="w-6 h-6 border-4 border-t-transparent border-[var(--primary-color)] border-solid rounded-full animate-spin"/>
                            </div>
                        ) : (
                            <div>
                                {searchResults.length > 0 ? (
                                    searchResults.map((user) => {
                                        const avatarUrl = mediaData?.[user.id]?.[0]?.url || null;
                                        return (
                                            <div
                                                key={user.id}
                                                className="flex items-center p-2 hover:bg-[var(--hover-bg-color)] transition-colors duration-200"
                                            >
                                                <div
                                                    onClick={() => navigate(`/profile/${user.username}`)}
                                                    style={{cursor: "pointer"}}
                                                >
                                                    {avatarUrl ? (
                                                        <img
                                                            src={avatarUrl}
                                                            className="w-10 h-10 rounded-full mr-2 object-cover"
                                                            alt={`Avatar của ${user.username}`}
                                                        />

                                                    ) : (
                                                        <div
                                                            className="w-10 h-10 rounded-full bg-gray-500 text-white flex items-center justify-center mr-2">
                                                            <span>{user.username?.charAt(0).toUpperCase() || "U"}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-grow">
                                                    <p
                                                        className="font-bold text-sm mb-0 cursor-pointer hover:underline"
                                                        onClick={() => navigate(`/profile/${user.username}`)}
                                                    >
                                                        {user.displayName || user.username}
                                                    </p>
                                                    <p className="text-[var(--text-color-muted)] text-xs">
                                                        @{user.username}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => handleSelectUserWithAuth(user.id)}
                                                    className="bg-[var(--primary-color)] hover:brightness-110 text-white text-sm px-3 py-1 rounded-full transition"
                                                >
                                                    Nhắn tin
                                                </button>
                                            </div>
                                        );
                                    })
                                ) : searchKeyword.length > 0 ? (
                                    <p className="text-center text-[var(--text-color-muted)] text-sm p-4">
                                        Không tìm thấy người dùng nào.
                                    </p>
                                ) : (
                                    <p className="text-center text-[var(--text-color-muted)] p-4">
                                        Nhập tên hoặc email để tìm kiếm.
                                    </p>
                                )}
                            </div>
                        )}
                    </Modal.Body>

                    <Modal.Footer className="bg-[var(--background-color)] border-t border-[var(--border-color)] flex justify-end">
                        <button
                            onClick={handleClose}
                            className="bg-[var(--hover-bg-color)] border border-[var(--border-color)] text-[var(--text-color)] px-4 py-2 rounded-md hover:bg-[var(--border-color)] transition"
                        >
                            Đóng
                        </button>
                    </Modal.Footer>

                </>
            </Modal>
        );
    };

    export default UserSelectionModal;