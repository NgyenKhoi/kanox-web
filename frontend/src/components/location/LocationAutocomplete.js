import { useEffect, useRef } from "react";

export default function LocationAutocomplete({ onPlaceSelect }) {
    const inputRef = useRef(null);

    useEffect(() => {
        if (!window.google || !window.google.maps || !window.google.maps.places) {
            console.error("Google Maps JavaScript API chưa sẵn sàng");
            return;
        }

        const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
            types: ["geocode"],
            componentRestrictions: { country: "vn" },
        });

        autocomplete.addListener("place_changed", () => {
            const place = autocomplete.getPlace();
            if (!place.geometry) return;

            onPlaceSelect?.(place);
        });
    }, [onPlaceSelect]);

    return (
        <input
            ref={inputRef}
            type="text"
            placeholder="Nhập địa điểm"
            className="form-control border-0 border-bottom rounded-0 px-0 py-1 text-[var(--text-color)]"
            style={{
                backgroundColor: "transparent",
                borderBottom: "1px solid var(--border-color)",
            }}
        />
    );
}
