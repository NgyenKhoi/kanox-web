import { useEffect, useRef } from "react";

export default function PlaceAutocomplete({ onPlaceSelect }) {
    const ref = useRef(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        // ✅ Set placeholder thủ công vì React không set được lên custom element
        el.setAttribute("placeholder", "Nhập địa điểm");
        el.setAttribute("country", "vn"); // đảm bảo đặt luôn country ở đây

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
        />
    );
}
