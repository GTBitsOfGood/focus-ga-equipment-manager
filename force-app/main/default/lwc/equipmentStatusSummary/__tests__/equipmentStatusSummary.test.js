import { createElement } from "lwc";
import EquipmentStatusSummary from "c/equipmentStatusSummary";
import getStatusCounts from "@salesforce/apex/EquipmentStatusController.getStatusCounts";

const COUNTS = [
  { status: "Ready for Checkout", label: "Ready for Checkout", count: 3 },
  { status: "Checkout Pending", label: "Checkout Pending", count: 0 },
  { status: "Out", label: "Out In Community", count: 2 },
  { status: "Repair", label: "Repair", count: 0 },
  { status: "Inactive", label: "Inactive", count: 1 }
];

describe("c-equipment-status-summary", () => {
  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  it("shows a loading state until counts arrive", () => {
    const element = createElement("c-equipment-status-summary", {
      is: EquipmentStatusSummary
    });
    document.body.appendChild(element);

    expect(
      element.shadowRoot.querySelector("lightning-spinner")
    ).not.toBeNull();
    expect(element.shadowRoot.querySelector(".kpi-grid")).toBeNull();
  });

  it("renders all five status labels and counts, including zeros", async () => {
    const element = createElement("c-equipment-status-summary", {
      is: EquipmentStatusSummary
    });
    document.body.appendChild(element);

    getStatusCounts.emit(COUNTS);
    await Promise.resolve();

    expect(
      Array.from(element.shadowRoot.querySelectorAll(".kpi-label"), (label) =>
        label.textContent.trim()
      )
    ).toEqual(COUNTS.map((item) => item.label));
    expect(
      Array.from(element.shadowRoot.querySelectorAll(".kpi-count"), (count) =>
        count.textContent.trim()
      )
    ).toEqual(["3", "0", "2", "0", "1"]);
    expect(element.shadowRoot.querySelector("lightning-spinner")).toBeNull();
    expect(element.shadowRoot.querySelector('[role="alert"]')).toBeNull();
  });

  it("shows a friendly error and recovers when counts arrive", async () => {
    const element = createElement("c-equipment-status-summary", {
      is: EquipmentStatusSummary
    });
    document.body.appendChild(element);

    getStatusCounts.emitError({ message: "Request failed" });
    await Promise.resolve();

    expect(
      element.shadowRoot.querySelector('[role="alert"]').textContent
    ).toContain("Unable to load equipment counts. Please try again later.");
    expect(element.shadowRoot.querySelector("lightning-spinner")).toBeNull();
    expect(element.shadowRoot.querySelector(".kpi-grid")).toBeNull();

    getStatusCounts.emit(COUNTS);
    await Promise.resolve();

    expect(element.shadowRoot.querySelector('[role="alert"]')).toBeNull();
    expect(element.shadowRoot.querySelectorAll(".kpi-card")).toHaveLength(5);
  });
});
