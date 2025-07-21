export const definePlaceAutocomplete = async () => {
    if (!window.google?.maps?.importLibrary) {
        console.error("Google Maps chưa sẵn sàng");
        return;
    }

    const { PlaceAutocompleteElement } = await window.google.maps.importLibrary("places");

    if (!customElements.get("gmpx-place-autocomplete")) {
        customElements.define("gmpx-place-autocomplete", PlaceAutocompleteElement);
    }
};
