import { createElement } from "lwc";
import EquipmentDashboardFilters from "c/equipmentDashboardFilters";

describe("c-equipment-dashboard-filters", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("debounces the rendered search input", () => {
    const element = createElement("c-equipment-dashboard-filters", {
      is: EquipmentDashboardFilters
    });

    const handler = jest.fn();
    element.addEventListener("filterschange", handler);
    document.body.appendChild(element);

    const searchInput = element.shadowRoot.querySelector("lightning-input");
    searchInput.value = "wheel";
    searchInput.dispatchEvent(
      new CustomEvent("change", {
        bubbles: true,
        composed: true
      })
    );

    expect(handler).not.toHaveBeenCalled();

    jest.advanceTimersByTime(299);
    expect(handler).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].detail).toEqual({
      searchTerm: "wheel",
      status: "",
      size: "",
      color: ""
    });
  });

  it("emits immediately on status changes and clears a pending debounce timer", () => {
    const element = createElement("c-equipment-dashboard-filters", {
      is: EquipmentDashboardFilters
    });

    const handler = jest.fn();
    element.addEventListener("filterschange", handler);
    document.body.appendChild(element);

    const searchInput =
      element.shadowRoot.querySelectorAll("lightning-input")[0];
    searchInput.value = "Crib";
    searchInput.dispatchEvent(
      new CustomEvent("change", {
        bubbles: true,
        composed: true
      })
    );

    const statusCombobox =
      element.shadowRoot.querySelector("lightning-combobox");
    statusCombobox.dispatchEvent(
      new CustomEvent("change", {
        detail: { value: "Available" },
        bubbles: true,
        composed: true
      })
    );

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].detail).toEqual({
      searchTerm: "Crib",
      status: "Available",
      size: "",
      color: ""
    });

    jest.advanceTimersByTime(300);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("clears all filters and cancels an outstanding debounce timer", () => {
    const element = createElement("c-equipment-dashboard-filters", {
      is: EquipmentDashboardFilters
    });

    const handler = jest.fn();
    element.addEventListener("filterschange", handler);
    document.body.appendChild(element);

    const searchInput =
      element.shadowRoot.querySelectorAll("lightning-input")[0];
    const sizeInput = element.shadowRoot.querySelectorAll("lightning-input")[1];

    searchInput.value = "Crib";
    searchInput.dispatchEvent(
      new CustomEvent("change", {
        bubbles: true,
        composed: true
      })
    );

    sizeInput.value = "Small";
    sizeInput.dispatchEvent(
      new CustomEvent("change", {
        bubbles: true,
        composed: true
      })
    );

    const clearButton = element.shadowRoot.querySelector("lightning-button");
    clearButton.click();

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].detail).toEqual({
      searchTerm: "",
      status: "",
      size: "",
      color: ""
    });

    jest.advanceTimersByTime(300);
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
