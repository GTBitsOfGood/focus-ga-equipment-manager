import { createElement } from "lwc";
import EquipmentDashboard from "c/equipmentDashboard";
import getStatusCounts from "@salesforce/apex/EquipmentStatusController.getStatusCounts";
import getEquipmentRecords from "@salesforce/apex/EquipmentInventoryController.getEquipmentRecords";

describe("c-equipment-dashboard", () => {
  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  it("renders KPIs before filters and inventory, keeping counts global when filters change", async () => {
    const element = createElement("c-equipment-dashboard", {
      is: EquipmentDashboard
    });
    document.body.appendChild(element);
    await Promise.resolve();

    expect(
      Array.from(
        element.shadowRoot.querySelectorAll(
          "c-equipment-status-summary, c-equipment-dashboard-filters, c-equipment-inventory-table"
        ),
        (child) => child.tagName.toLowerCase()
      )
    ).toEqual([
      "c-equipment-status-summary",
      "c-equipment-dashboard-filters",
      "c-equipment-inventory-table"
    ]);

    getStatusCounts.emit([
      { status: "Out", label: "Out In Community", count: 7 }
    ]);
    await Promise.resolve();
    const summary = element.shadowRoot.querySelector(
      "c-equipment-status-summary"
    );
    const initialConfig = getStatusCounts.getLastConfig();
    const filters = { searchTerm: "Wheel", status: "Out", size: "", color: "" };
    element.shadowRoot
      .querySelector("c-equipment-dashboard-filters")
      .dispatchEvent(new CustomEvent("filterschange", { detail: filters }));
    await Promise.resolve();
    await Promise.resolve();

    expect(getEquipmentRecords.getLastConfig()).toMatchObject(filters);
    expect(getStatusCounts.getLastConfig()).toEqual(initialConfig);
    expect(element.shadowRoot.querySelector("c-equipment-status-summary")).toBe(
      summary
    );
    expect(
      summary.shadowRoot.querySelector(".kpi-count").textContent.trim()
    ).toBe("7");
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
