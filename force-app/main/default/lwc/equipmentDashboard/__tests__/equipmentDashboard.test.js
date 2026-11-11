import { createElement } from "lwc";
import EquipmentDashboard from "c/equipmentDashboard";

describe("c-equipment-dashboard", () => {
  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  it("renders KPIs, filters, and inventory in the required order", async () => {
    const element = createElement("c-equipment-dashboard", {
      is: EquipmentDashboard
    });

    document.body.appendChild(element);
    await Promise.resolve();

    const children = Array.from(
      element.shadowRoot.querySelectorAll(
        "c-equipment-status-summary, c-equipment-dashboard-filters, c-equipment-inventory-table"
      )
    ).map((child) => child.tagName.toLowerCase());

    expect(children).toEqual([
      "c-equipment-status-summary",
      "c-equipment-dashboard-filters",
      "c-equipment-inventory-table"
    ]);
  });

  it("stores the current filter state and passes it to the inventory table", async () => {
    const element = createElement("c-equipment-dashboard", {
      is: EquipmentDashboard
    });

    document.body.appendChild(element);
    await Promise.resolve();

    const filters = {
      searchTerm: "Wheel",
      status: "Available",
      size: "Large",
      color: "Blue"
    };

    element.handleFiltersChange({ detail: filters });
    await Promise.resolve();

    expect(element.filters).toEqual(filters);
    const table = element.shadowRoot.querySelector(
      "c-equipment-inventory-table"
    );
    expect(table.filters).toEqual(filters);
  });

  it("updates when the filter component emits a new filterschange event", async () => {
    const element = createElement("c-equipment-dashboard", {
      is: EquipmentDashboard
    });

    document.body.appendChild(element);
    await Promise.resolve();

    const filters = {
      searchTerm: "Crib",
      status: "",
      size: "Medium",
      color: "Red"
    };

    const filtersChild = element.shadowRoot.querySelector(
      "c-equipment-dashboard-filters"
    );
    filtersChild.dispatchEvent(
      new CustomEvent("filterschange", {
        detail: filters,
        bubbles: true,
        composed: true
      })
    );
    await Promise.resolve();

    expect(element.filters).toEqual(filters);
    const table = element.shadowRoot.querySelector(
      "c-equipment-inventory-table"
    );
    expect(table.filters).toEqual(filters);
  });
});
