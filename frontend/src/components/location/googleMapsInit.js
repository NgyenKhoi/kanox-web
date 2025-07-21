export const definePlaceAutocomplete = async () => {
    if (!window.google?.maps?.importLibrary) {
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

    // ✅ Chỉ define nếu chưa define
    if (!customElements.get("gmpx-place-autocomplete")) {
        customElements.define("gmpx-place-autocomplete", PlaceAutocompleteElement);
    }
};
