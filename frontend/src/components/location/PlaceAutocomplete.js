import { useEffect, useRef } from "react";

export default function PlaceAutocomplete({ onPlaceSelect }) {
    const ref = useRef(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const handlePlaceChange = () => {
            const place = el.value;
            onPlaceSelect?.(place);
        };

        el.addEventListener("gmpx-placeautocomplete:placechanged", handlePlaceChange);
        return () => {
            el.removeEventListener("gmpx-placeautocomplete:placechanged", handlePlaceChange);
        };
    }, [onPlaceSelect]);

    return (
        <gmpx-place-autocomplete
            ref={ref}
            style={{
                width: "100%",
                display: "block",
                borderBottom: "1px solid #ccc",
                padding: "8px",
            }}
            placeholder="Nhập địa điểm"
            country="vn"
        />
    );
}
