import React from "react";
import { FaTwitter, FaSearch } from "react-icons/fa";
import { Link } from "react-router-dom";

function Header() {
    return (
        <header className="lg:hidden fixed top-0 left-0 w-full bg-[var(--background-color)] border-b shadow-sm z-50">
            <div className="flex items-center justify-between px-4 py-2">
                <img
                    src="https://via.placeholder.com/40"
                    alt="Avatar"
                    className="rounded-full w-10 h-10"
                />
                <Link to="/home" className="mx-auto text-[var(--text-color)]">
                    <FaTwitter size={28} />
                </Link>
                <FaSearch size={20} className="text-[var(--text-color-muted)]" />
            </div>
        </header>
    );
}

export default Header;
