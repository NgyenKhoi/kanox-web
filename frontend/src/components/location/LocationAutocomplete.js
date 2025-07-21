import { useEffect, useRef } from "react";

export default function LocationAutocomplete({ onPlaceSelect }) {
    const inputRef = useRef(null);

    useEffect(() => {
        const el = inputRef.current;
        if (!el) return;

        const handlePlaceChange = (event) => {
            const place = el.value;

            // Truy cập thông tin địa điểm từ el.gmpxResult
            const result = el.gmpxResult;

            if (result && onPlaceSelect) {
                onPlaceSelect({
                    formatted_address: result.formatted_address,
                    name: result.name,
                    geometry: {
                        location: {
                            lat: () => result.geometry?.location?.lat,
                            lng: () => result.geometry?.location?.lng,
                        },
                    },
                });
            }
        };

        el.addEventListener("gmpx-placechange", handlePlaceChange);

        return () => {
            el.removeEventListener("gmpx-placechange", handlePlaceChange);
        };
    }, [onPlaceSelect]);

    return (
        <gmpx-place-autocomplete
            ref={inputRef}
            style={{
                width: "100%",
                border: "none",
                borderBottom: "1px solid var(--border-color)",
                padding: "4px 0",
                backgroundColor: "transparent",
                color: "var(--text-color)",
            }}
        ></gmpx-place-autocomplete>
    );
}
