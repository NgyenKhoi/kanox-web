import useSingleMedia from "../../hooks/useSingleMedia"
function GroupSearchItem({ group, onClick }) {
    const { mediaUrl } = useSingleMedia(group.id, "GROUP", "image");

    return (
        <div
            className="flex items-center gap-3 cursor-pointer hover:bg-[var(--hover-bg-color)] p-2 rounded-lg transition"
            onClick={onClick}
        >
            <img
                src={mediaUrl || "https://via.placeholder.com/40"}
                alt={group.name}
                className="w-8 h-8 object-cover rounded-md"
            />
            <span className="text-sm font-medium truncate">{group.name}</span>
        </div>
    );
}

export default GroupSearchItem;
