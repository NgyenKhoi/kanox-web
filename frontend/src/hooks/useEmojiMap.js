import { useEmojiContext } from "../context/EmojiContext";

export default function useEmojiMap() {
    const { emojiMap, loading, error } = useEmojiContext();
    return { emojiMap, loading, error };
}
