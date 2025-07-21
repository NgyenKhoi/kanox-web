export const definePlaceAutocomplete = async () => {
    // Đợi cho tới khi Google Maps đã load xong
    if (!window.google || !window.google.maps) {
        console.warn("⏳ Chờ Google Maps sẵn sàng...");
        await new Promise((resolve) => {
            const interval = setInterval(() => {
                if (window.google?.maps?.importLibrary) {
                    clearInterval(interval);
                    resolve();
                }
            }, 100);
        });
    }

    const { PlaceAutocompleteElement } = await window.google.maps.importLibrary("places");

    if (!customElements.get("gmpx-place-autocomplete")) {
        customElements.define("gmpx-place-autocomplete", PlaceAutocompleteElement);
        console.log("✅ gmpx-place-autocomplete đã được định nghĩa");
    }
};
