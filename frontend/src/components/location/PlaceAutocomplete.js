import { useEffect, useRef } from "react";

export default function PlaceAutocomplete({ onPlaceSelect }) {
    const ref = useRef(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        el.setAttribute("placeholder", "Nhập địa điểm");
        el.setAttribute("country", "vn");

        const handlePlaceChange = (event) => {
            const place = event.detail; // ✅ Đây mới là object placeResult đúng chuẩn
            if (place && place.geometry) {
                const lat = place.geometry.location.lat;
                const lng = place.geometry.location.lng;
                const name = place.formattedAddress || place.displayName || "";

                onPlaceSelect?.({
                    ...place,
                    formattedAddress: name,
                    latitude: lat,
                    longitude: lng,
                });
            }
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
